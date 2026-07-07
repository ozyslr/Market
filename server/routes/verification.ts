/**
 * Phone verification (OTP) — server-side Twilio Verify.
 *
 * The client NEVER touches Twilio credentials. All OTP operations
 * happen through these endpoints so the auth token stays on the server.
 *
 * Endpoints:
 *   POST /api/verification/send-otp   — body: { phone: string }
 *   POST /api/verification/verify-otp — body: { phone: string, code: string }
 *   POST /api/verification/validate-vat — body: { countryCode: string, vatNumber: string }
 */
import type { Express } from 'express';
import { logger } from '../logger.js';

function getTwilioEnv() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SID;
  if (!sid || !token || !serviceSid) {
    logger.warn('verification', 'Twilio not configured — OTP endpoints will return 500');
    return null;
  }
  return { sid, token, serviceSid };
}

export function registerVerificationRoutes(app: Express): void {
  // ── Send OTP ──────────────────────────────────────────────────────────

  app.post('/api/verification/send-otp', async (req, res) => {
    const { phone } = req.body || {};

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: 'Telefon numarası gerekli' });
    }

    // Dev mode: accept without sending real SMS
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ success: true });
    }

    const twilio = getTwilioEnv();
    if (!twilio) {
      return res.status(500).json({ success: false, error: 'SMS servisi şu anda kullanılamıyor' });
    }

    try {
      const auth = Buffer.from(`${twilio.sid}:${twilio.token}`).toString('base64');
      const url = `https://verify.twilio.com/v2/Services/${twilio.serviceSid}/Verifications`;

      const twilioRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ to: phone, channel: 'sms' }),
      });

      if (!twilioRes.ok) {
        const err = await twilioRes.json().catch(() => ({}));
        logger.error('verification', 'Twilio send failed', {
          status: twilioRes.status,
          code: (err as any).code,
          phone: phone.slice(0, 6) + '***',
        });

        // Known Twilio error codes
        if ((err as any).code === 60200) {
          return res.json({ success: false, error: 'Geçersiz telefon numarası' });
        }
        if ((err as any).code === 60203) {
          return res.json({ success: false, error: 'Maksimum deneme sayısına ulaşıldı' });
        }

        return res.json({ success: false, error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' });
      }

      const data = await twilioRes.json();
      logger.info('verification', 'OTP sent', {
        status: data.status,
        phone: phone.slice(0, 6) + '***',
      });
      return res.json({ success: true });
    } catch (err: any) {
      logger.error('verification', 'send-otp error', { error: err.message });
      return res
        .status(500)
        .json({ success: false, error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' });
    }
  });

  // ── Verify OTP ────────────────────────────────────────────────────────

  app.post('/api/verification/verify-otp', async (req, res) => {
    const { phone, code } = req.body || {};

    if (!phone || typeof phone !== 'string' || !code || typeof code !== 'string') {
      return res.status(400).json({ verified: false, error: 'Telefon ve kod gerekli' });
    }

    // Dev mode: accept code '123456'
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ verified: code === '123456' });
    }

    const twilio = getTwilioEnv();
    if (!twilio) {
      return res
        .status(500)
        .json({ verified: false, error: 'Doğrulama servisi şu anda kullanılamıyor' });
    }

    try {
      const auth = Buffer.from(`${twilio.sid}:${twilio.token}`).toString('base64');
      const url = `https://verify.twilio.com/v2/Services/${twilio.serviceSid}/VerificationCheck`;

      const twilioRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ to: phone, code }),
      });

      const data = await twilioRes.json();

      if (!twilioRes.ok) {
        logger.warn('verification', 'Twilio verify failed', { status: data.status });
        return res.json({ verified: false });
      }

      const verified = data.status === 'approved';
      logger.info('verification', verified ? 'OTP verified' : 'OTP rejected', {
        status: data.status,
      });
      return res.json({ verified });
    } catch (err: any) {
      logger.error('verification', 'verify-otp error', { error: err.message });
      return res.status(500).json({ verified: false, error: 'Doğrulama yapılamadı' });
    }
  });

  // ── VIES VAT validation ───────────────────────────────────────────────

  app.post('/api/verification/validate-vat', async (req, res) => {
    const { countryCode, vatNumber } = req.body || {};

    if (!countryCode || !vatNumber) {
      return res.status(400).json({ valid: false, error: 'Ülke kodu ve KDV numarası gerekli' });
    }

    try {
      // EU VIES SOAP API
      const viesUrl = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms';
      const viesRes = await fetch(`${viesUrl}/${countryCode}/vat/${vatNumber}`);

      if (viesRes.status === 404) {
        // VIES returns 404 for not found
        return res.json({ valid: false });
      }

      if (!viesRes.ok) {
        logger.warn('verification', 'VIES unavailable', { status: viesRes.status });
        return res.json({ valid: false, error: 'KDV doğrulama servisi şu anda kullanılamıyor' });
      }

      const data = await viesRes.json();
      return res.json({ valid: data.isValid === true });
    } catch (err: any) {
      logger.error('verification', 'VIES error', { error: err.message });
      // VIES frequently down — don't block, let manual review handle
      return res.json({ valid: false, error: 'KDV doğrulama yapılamadı' });
    }
  });
}
