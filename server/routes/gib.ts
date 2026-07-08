/**
 * GIB E-Fatura API Routes
 *
 * Server-side endpoints for GIB e-invoice integration.
 * All endpoints require Firebase authentication (verifyFirebaseToken).
 * Seller-specific operations also require verifySeller.
 *
 * Endpoints:
 *   POST   /api/invoices/:id/send-to-gib    – Send invoice XML to GIB
 *   GET    /api/invoices/:id/gib-status      – Get GIB status for an invoice
 *   POST   /api/invoices/:id/cancel-gib      – Cancel an invoice at GIB
 *   GET    /api/gib/config-status            – Check if GIB is configured
 */

import { type Express, type Response } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import {
  sendInvoiceToGib,
  getInvoiceStatus,
  cancelGibInvoice,
  isGibConfigured,
} from '../services/gibService.js';
import { logger } from '../logger.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface GibRouteDeps {
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
  verifySeller: Middleware;
}

// ─── UBL-TR XML Generator ──────────────────────────────────────────────────
// (Server-side copy to keep server routes self-contained)

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().split('T')[0];
}

function generateUblTrXml(invoice: any): string {
  const profileId = 'TEMELFATURA';
  const invoiceTypeCode = invoice.type || 'SATIS';

  const itemXml = (invoice.items || [])
    .map(
      (item: any, idx: number) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${invoice.currency || 'TRY'}">${(item.totalAmount || 0).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${invoice.currency || 'TRY'}">${(item.vatAmount || 0).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${invoice.currency || 'TRY'}">${((item.totalAmount || 0) - (item.vatAmount || 0)).toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${invoice.currency || 'TRY'}">${(item.vatAmount || 0).toFixed(2)}</cbc:TaxAmount>
          <cbc:Percent>${item.vatRate || 20}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>KDV</cbc:Name>
              <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(item.name || '')}</cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${invoice.currency || 'TRY'}">${(item.unitPrice || 0).toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${invoice.invoiceNumber || ''}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${invoice.ettn || ''}</cbc:UUID>
  <cbc:IssueDate>${formatDate(invoice.invoiceDate || new Date().toISOString())}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency || 'TRY'}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${invoice.sellerTaxNumber || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.sellerName || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoice.sellerAddress || '')}</cbc:StreetName>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${escapeXml(invoice.sellerTaxOffice || '')}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${invoice.buyerTaxNumber || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.buyerName || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoice.buyerAddress || '')}</cbc:StreetName>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${escapeXml(invoice.buyerTaxOffice || '')}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency || 'TRY'}">${(invoice.subtotal || 0).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency || 'TRY'}">${(invoice.subtotal || 0).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency || 'TRY'}">${(invoice.totalAmount || 0).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency || 'TRY'}">${(invoice.totalAmount || 0).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${itemXml}
</Invoice>`;
}

// ─── Route Registration ────────────────────────────────────────────────────

export function registerGibRoutes(app: Express, deps: GibRouteDeps): void {
  const { adminDb, verifyFirebaseToken, verifySeller } = deps;

  // ── POST /api/invoices/:id/send-to-gib ──────────────────────────────────
  app.post(
    '/api/invoices/:id/send-to-gib',
    verifyFirebaseToken,
    verifySeller,
    async (req: any, res: Response) => {
      try {
        const invoiceId = req.params.id;
        if (!adminDb) {
          return res.status(503).json({ error: 'Firebase Admin not configured' });
        }

        // Read invoice from Firestore
        const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();
        if (!invoiceDoc.exists) {
          return res.status(404).json({ error: 'Fatura bulunamadi' });
        }

        const invoice = invoiceDoc.data()!;

        // Verify seller owns this invoice
        if (invoice.sellerId !== req.uid) {
          return res.status(403).json({ error: 'Bu faturaya erisim yetkiniz yok' });
        }

        // Only draft or previously rejected invoices can be sent
        if (invoice.status !== 'draft' && invoice.status !== 'rejected') {
          return res.status(400).json({
            error: `Bu fatura gonderilemez. Mevcut durum: ${invoice.status}`,
          });
        }

        // Generate UBL-TR XML
        const ublXml = generateUblTrXml(invoice);

        // Send to GIB
        const gibResult = await sendInvoiceToGib(ublXml, invoiceId);

        const now = new Date().toISOString();
        const updates: Record<string, any> = {
          gibStatus: gibResult.success ? 'accepted' : 'rejected',
          gibMessage: gibResult.message,
          updatedAt: now,
        };

        if (gibResult.success) {
          updates.status = 'sent';
          updates.sentAt = now;
          updates.ettn = gibResult.ettn;
          updates.envelopeId = gibResult.envelopeId;
        } else {
          updates.status = 'rejected';
        }

        await adminDb.collection('invoices').doc(invoiceId).update(updates);

        logger.info('gib', 'Invoice GIB submission result', {
          invoiceId,
          success: gibResult.success,
          ettn: gibResult.ettn,
        });

        return res.json({
          success: gibResult.success,
          data: {
            ...invoice,
            ...updates,
            id: invoiceId,
          },
          message: gibResult.message,
        });
      } catch (err: any) {
        logger.error('gib', 'send-to-gib route error', { error: (err as Error).message });
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── GET /api/invoices/:id/gib-status ────────────────────────────────────
  app.get(
    '/api/invoices/:id/gib-status',
    verifyFirebaseToken,
    verifySeller,
    async (req: any, res: Response) => {
      try {
        const invoiceId = req.params.id;
        if (!adminDb) {
          return res.status(503).json({ error: 'Firebase Admin not configured' });
        }

        const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();
        if (!invoiceDoc.exists) {
          return res.status(404).json({ error: 'Fatura bulunamadi' });
        }

        const invoice = invoiceDoc.data()!;
        if (invoice.sellerId !== req.uid) {
          return res.status(403).json({ error: 'Bu faturaya erisim yetkiniz yok' });
        }

        const ettn = invoice.ettn;
        if (!ettn) {
          return res.json({
            status: 'not_sent',
            message: "Fatura henuz GIB'e gonderilmedi",
          });
        }

        const statusResult = await getInvoiceStatus(ettn);

        // Update local status if changed
        if (statusResult.status === 'accepted' && invoice.gibStatus !== 'accepted') {
          await adminDb.collection('invoices').doc(invoiceId).update({
            gibStatus: 'accepted',
            status: 'approved',
            updatedAt: new Date().toISOString(),
          });
        } else if (statusResult.status === 'rejected' && invoice.gibStatus !== 'rejected') {
          await adminDb.collection('invoices').doc(invoiceId).update({
            gibStatus: 'rejected',
            status: 'rejected',
            gibMessage: statusResult.message,
            updatedAt: new Date().toISOString(),
          });
        }

        return res.json(statusResult);
      } catch (err: any) {
        logger.error('gib', 'gib-status route error', { error: (err as Error).message });
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── POST /api/invoices/:id/cancel-gib ───────────────────────────────────
  app.post(
    '/api/invoices/:id/cancel-gib',
    verifyFirebaseToken,
    verifySeller,
    async (req: any, res: Response) => {
      try {
        const invoiceId = req.params.id;
        if (!adminDb) {
          return res.status(503).json({ error: 'Firebase Admin not configured' });
        }

        const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();
        if (!invoiceDoc.exists) {
          return res.status(404).json({ error: 'Fatura bulunamadi' });
        }

        const invoice = invoiceDoc.data()!;
        if (invoice.sellerId !== req.uid) {
          return res.status(403).json({ error: 'Bu faturaya erisim yetkiniz yok' });
        }

        const ettn = invoice.ettn;
        if (!ettn) {
          return res.status(400).json({ error: "Bu fatura henuz GIB'e gonderilmemis" });
        }

        if (invoice.status === 'cancelled') {
          return res.status(400).json({ error: 'Bu fatura zaten iptal edilmis' });
        }

        const cancelResult = await cancelGibInvoice(ettn);

        if (cancelResult.success) {
          await adminDb.collection('invoices').doc(invoiceId).update({
            status: 'cancelled',
            gibStatus: 'rejected',
            gibMessage: cancelResult.message,
            updatedAt: new Date().toISOString(),
          });
        }

        return res.json({
          success: cancelResult.success,
          message: cancelResult.message,
        });
      } catch (err: any) {
        logger.error('gib', 'cancel-gib route error', { error: (err as Error).message });
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── GET /api/gib/config-status ──────────────────────────────────────────
  app.get('/api/gib/config-status', verifyFirebaseToken, async (_req: any, res: Response) => {
    const configured = isGibConfigured();
    res.json({
      configured,
      mode: configured ? 'live' : 'mock',
      message: configured
        ? 'GIB entegrasyonu aktif.'
        : 'GIB entegrasyonu yapilandirilmamis – mock provider kullaniliyor.',
    });
  });
}
