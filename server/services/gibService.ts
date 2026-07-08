/**
 * GIB E-Fatura Connector Service
 *
 * Real GIB (Gelir Idaresi Baskanligi) e-invoice integration via SOAP/XML over HTTPS.
 * Uses mutual TLS (client certificate / mali muhur) for authentication.
 *
 * When GIB_API_URL is not configured, falls back to a mock provider with clear logging
 * so development can proceed without production credentials.
 *
 * Env vars:
 *   GIB_API_URL              – GIB SOAP web service endpoint
 *   GIB_API_KEY               – API key / kullanici kodu (optional, depends on GIB version)
 *   GIB_CERTIFICATE_PATH      – Path to PKCS#12 (.pfx/.p12) client certificate (mali muhur)
 *   GIB_CERTIFICATE_PASSPHRASE – Passphrase for the PKCS#12 certificate
 */

import https from 'node:https';
import tls from 'node:tls';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { logger } from '../logger.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GibSendResult {
  success: boolean;
  ettn?: string;
  envelopeId?: string;
  message: string;
  gibResponseCode?: string;
}

export interface GibStatusResult {
  uuid: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'not_found';
  message: string;
  responseDate?: string;
}

// ─── Configuration ──────────────────────────────────────────────────────────

interface GibConfig {
  apiUrl: string;
  apiKey: string;
  certificatePath: string;
  certificatePassphrase: string;
}

function getGibConfig(): GibConfig | null {
  const apiUrl = process.env.GIB_API_URL;
  const apiKey = process.env.GIB_API_KEY || '';
  const certificatePath = process.env.GIB_CERTIFICATE_PATH || '';
  const certificatePassphrase = process.env.GIB_CERTIFICATE_PASSPHRASE || '';

  if (!apiUrl) {
    logger.info('gib', 'GIB_API_URL not configured – using mock provider');
    return null;
  }

  return { apiUrl, apiKey, certificatePath, certificatePassphrase };
}

// ─── SOAP Envelope Builder ─────────────────────────────────────────────────

function buildSoapEnvelope(
  ublXml: string,
  action: 'send' | 'status' | 'cancel',
  uuid?: string,
): string {
  const actionMap: Record<string, string> = {
    send: 'SendUBLInvoice',
    status: 'GetInvoiceStatus',
    cancel: 'CancelInvoice',
  };

  const actionBody: Record<string, string> = {
    send: `<ubl:InvoiceDocument>${escapeXmlForSoap(ublXml)}</ubl:InvoiceDocument>`,
    status: `<ubl:UUID>${escapeXmlForSoap(uuid || '')}</ubl:UUID>`,
    cancel: `<ubl:UUID>${escapeXmlForSoap(uuid || '')}</ubl:UUID>`,
  };

  const soapAction = actionMap[action];

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <soapenv:Header/>
  <soapenv:Body>
    <ubl:${soapAction}>
      ${actionBody[action]}
    </ubl:${soapAction}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function escapeXmlForSoap(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── SOAP Response Parser ──────────────────────────────────────────────────

function parseGibSoapResponse(xml: string): {
  success: boolean;
  ettn?: string;
  envelopeId?: string;
  message: string;
  responseCode?: string;
} {
  try {
    // Extract ETN (ETTN)
    const ettnMatch = xml.match(/<([a-zA-Z0-9]*:)?E[TI]TN[^>]*>([^<]+)<\/[a-zA-Z0-9]*:?E[TI]TN>/i);
    const ettn = ettnMatch?.[2]?.trim();

    // Extract envelope ID
    const envMatch = xml.match(
      /<([a-zA-Z0-9]*:)?EnvelopeID[^>]*>([^<]+)<\/[a-zA-Z0-9]*:?EnvelopeID>/i,
    );
    const envelopeId = envMatch?.[2]?.trim();

    // Extract status / response code
    const codeMatch = xml.match(
      /<([a-zA-Z0-9]*:)?ResponseCode[^>]*>([^<]+)<\/[a-zA-Z0-9]*:?ResponseCode>/i,
    );
    const responseCode = codeMatch?.[2]?.trim();

    // Extract message
    const msgMatch = xml.match(
      /<([a-zA-Z0-9]*:)?ResponseMessage[^>]*>([^<]+)<\/[a-zA-Z0-9]*:?ResponseMessage>/i,
    );
    const message = msgMatch?.[2]?.trim() || '';

    // Check for fault
    const faultMatch = xml.match(/<soapenv:Fault/i);
    if (faultMatch) {
      const faultMsg = xml.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i)?.[1]?.trim();
      return { success: false, message: faultMsg || 'GIB SOAP fault', responseCode };
    }

    // Success if we got an ETTN or positive response code
    const successCodes = ['0', '00', '000', 'OK', 'ACCEPTED', 'SUCCESS'];
    const isSuccess = !!ettn || (responseCode ? successCodes.includes(responseCode) : false);

    return {
      success: isSuccess,
      ettn: ettn || undefined,
      envelopeId: envelopeId || undefined,
      message: message || (isSuccess ? 'Fatura GIB tarafindan kabul edildi.' : 'GIB islem hatasi'),
      responseCode,
    };
  } catch {
    return { success: false, message: 'GIB SOAP response parse error' };
  }
}

// ─── HTTPS Agent with Client Certificate ────────────────────────────────────

function createHttpsAgent(config: GibConfig): https.Agent | null {
  if (!config.certificatePath || !fs.existsSync(config.certificatePath)) {
    logger.warn('gib', 'Client certificate not found', { path: config.certificatePath });
    return null;
  }

  try {
    const pfx = fs.readFileSync(config.certificatePath);
    const passphrase = config.certificatePassphrase || undefined;

    return new https.Agent({
      pfx,
      passphrase,
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    });
  } catch (err) {
    logger.error('gib', 'Failed to load client certificate', {
      error: (err as Error).message,
      path: config.certificatePath,
    });
    return null;
  }
}

// ─── SOAP Request ───────────────────────────────────────────────────────────

function makeSoapRequest(
  config: GibConfig,
  soapXml: string,
  soapAction: string,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(config.apiUrl);
    const agent = createHttpsAgent(config);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: `"urn:${soapAction}"`,
        'Content-Length': Buffer.byteLength(soapXml, 'utf-8').toString(),
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      agent: agent || undefined,
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    req.on('error', (err: Error) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('GIB request timeout'));
    });

    req.write(soapXml);
    req.end();
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Send a UBL-TR invoice XML to GIB.
 */
export async function sendInvoiceToGib(ublXml: string, invoiceId: string): Promise<GibSendResult> {
  const config = getGibConfig();

  // ── Mock fallback ─────────────────────────────────────────────────────
  if (!config) {
    logger.info('gib', '[MOCK] Sending invoice to GIB (no credentials configured)', {
      invoiceId,
      xmlSize: Buffer.byteLength(ublXml, 'utf-8'),
    });
    // Simulate 0.3–0.8s processing
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
    // 95% acceptance in mock
    if (Math.random() > 0.05) {
      const ettn = `MOCK-ETTN-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
      logger.info('gib', '[MOCK] Invoice accepted', { invoiceId, ettn });
      return {
        success: true,
        ettn,
        envelopeId: `MOCK-ENV-${Date.now()}`,
        message: '[MOCK] Fatura GIB tarafindan kabul edildi.',
      };
    }
    logger.warn('gib', '[MOCK] Invoice rejected (schema validation)', { invoiceId });
    return {
      success: false,
      message: '[MOCK] GIB: Sema validasyon hatasi – lutfen fatura bilgilerini kontrol edin.',
    };
  }

  // ── Real GIB call ─────────────────────────────────────────────────────
  logger.info('gib', 'Sending invoice to GIB', {
    invoiceId,
    apiUrl: config.apiUrl,
    xmlSize: Buffer.byteLength(ublXml, 'utf-8'),
  });

  try {
    const soapXml = buildSoapEnvelope(ublXml, 'send');
    const { statusCode, body } = await makeSoapRequest(config, soapXml, 'SendUBLInvoice');

    logger.info('gib', 'GIB response received', { invoiceId, statusCode });

    if (statusCode !== 200) {
      return {
        success: false,
        message: `GIB HTTP error: ${statusCode}`,
        gibResponseCode: String(statusCode),
      };
    }

    const result = parseGibSoapResponse(body);
    logger.info('gib', 'GIB result', {
      invoiceId,
      success: result.success,
      ettn: result.ettn,
      responseCode: result.responseCode,
    });

    return result;
  } catch (err) {
    logger.error('gib', 'GIB request failed', {
      invoiceId,
      error: (err as Error).message,
    });
    return {
      success: false,
      message: `GIB baglanti hatasi: ${(err as Error).message}`,
    };
  }
}

/**
 * Get the status of a previously sent GIB invoice by UUID/ETTN.
 */
export async function getInvoiceStatus(uuid: string): Promise<GibStatusResult> {
  const config = getGibConfig();

  if (!config) {
    logger.info('gib', '[MOCK] getInvoiceStatus', { uuid });
    await new Promise((r) => setTimeout(r, 150 + Math.random() * 300));
    return {
      uuid,
      status: Math.random() > 0.1 ? 'accepted' : 'pending',
      message: '[MOCK] Fatura durumu sorgulandi.',
      responseDate: new Date().toISOString(),
    };
  }

  try {
    const soapXml = buildSoapEnvelope('', 'status', uuid);
    const { statusCode, body } = await makeSoapRequest(config, soapXml, 'GetInvoiceStatus');

    if (statusCode !== 200) {
      return { uuid, status: 'not_found', message: `GIB HTTP error: ${statusCode}` };
    }

    // Parse status from SOAP response
    const statusMatch = body.match(/<([a-zA-Z0-9]*:)?Status[^>]*>([^<]+)<\/[a-zA-Z0-9]*:?Status>/i);
    const status = statusMatch?.[2]?.trim()?.toLowerCase() || 'not_found';
    const msgMatch = body.match(
      /<([a-zA-Z0-9]*:)?ResponseMessage[^>]*>([^<]+)<\/[a-zA-Z0-9]*:?ResponseMessage>/i,
    );
    const message = msgMatch?.[2]?.trim() || '';

    const validStatuses = ['pending', 'accepted', 'rejected', 'cancelled', 'not_found'];
    const normalizedStatus = validStatuses.includes(status)
      ? (status as GibStatusResult['status'])
      : 'not_found';

    return {
      uuid,
      status: normalizedStatus,
      message: message || `GIB status: ${normalizedStatus}`,
      responseDate: new Date().toISOString(),
    };
  } catch (err) {
    return {
      uuid,
      status: 'not_found',
      message: `GIB status sorgulama hatasi: ${(err as Error).message}`,
    };
  }
}

/**
 * Cancel a previously sent GIB invoice.
 */
export async function cancelGibInvoice(uuid: string): Promise<GibSendResult> {
  const config = getGibConfig();

  if (!config) {
    logger.info('gib', '[MOCK] cancelInvoice', { uuid });
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 400));
    return {
      success: true,
      message: '[MOCK] Fatura iptal edildi.',
    };
  }

  try {
    const soapXml = buildSoapEnvelope('', 'cancel', uuid);
    const { statusCode, body } = await makeSoapRequest(config, soapXml, 'CancelInvoice');

    if (statusCode !== 200) {
      return { success: false, message: `GIB HTTP error: ${statusCode}` };
    }

    return parseGibSoapResponse(body);
  } catch (err) {
    return {
      success: false,
      message: `GIB iptal hatasi: ${(err as Error).message}`,
    };
  }
}

/**
 * Check if GIB integration is configured and ready.
 */
export function isGibConfigured(): boolean {
  return getGibConfig() !== null;
}
