// ─── Server Email Service (Resend) ────────────────────────────────────────
// Wraps the Resend SDK for transactional email delivery.
// Graceful degradation: if RESEND_API_KEY is not set, logs a warning and no-ops.
// All public send functions are non-blocking (try/catch internally).

import { logger } from '../logger.js';
import {
  orderConfirmationHtml,
  shippingUpdateHtml,
  deliveryConfirmationHtml,
  refundNotificationHtml,
  newSellerOrderHtml,
  abandonedCartHtml,
} from './emailTemplates.js';

// ─── Provider initialisation ───────────────────────────────────────────────

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Benim Olan <noreply@benimolan.com>';
const APP_URL = process.env.APP_URL || 'https://benimolan.com';

let resendClient: any = null;

function getResendClient(): any | null {
  if (resendClient !== undefined && resendClient !== null) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn('email', 'RESEND_API_KEY not set — email sending disabled (graceful degradation)');
    resendClient = null;
    return null;
  }

  // Lazy import — avoids hard failure at module load when key is absent
  try {
    const { Resend } = require('resend');
    resendClient = new Resend(apiKey);
  } catch (err: any) {
    logger.error('email', 'Failed to initialise Resend client', { error: err.message });
    resendClient = null;
  }
  return resendClient;
}

// ─── Core sender ──────────────────────────────────────────────────────────

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const client = getResendClient();
  if (!client) {
    logger.warn('email', 'Email not sent (no provider configured)', {
      to: params.to,
      subject: params.subject,
    });
    return;
  }

  const { to, subject, html, from = FROM_ADDRESS } = params;

  const result = await client.emails.send({ from, to, subject, html });

  if (result?.error) {
    throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  logger.info('email', 'Email sent', { to, subject });
}

// ─── Typed convenience senders ────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  orderSetId: string,
  customerEmail: string,
  customerName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  currency: string,
  shippingAddress?: Record<string, any>,
): Promise<void> {
  try {
    const html = orderConfirmationHtml({
      orderSetId,
      customerName,
      items,
      total,
      currency,
      shippingAddress,
      orderUrl: `${APP_URL}/orders/${orderSetId}`,
    });
    await sendEmail({
      to: customerEmail,
      subject: `Siparişiniz Onaylandı — #${orderSetId.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendOrderConfirmationEmail failed (non-blocking)', {
      orderSetId,
      error: err.message,
    });
  }
}

export async function sendShippingUpdateEmail(
  orderSetId: string,
  customerEmail: string,
  customerName: string,
  carrier: string,
  trackingNumber: string,
): Promise<void> {
  try {
    const html = shippingUpdateHtml({
      orderSetId,
      customerName,
      carrier,
      trackingNumber,
      orderUrl: `${APP_URL}/orders/${orderSetId}`,
    });
    await sendEmail({
      to: customerEmail,
      subject: `Siparişiniz Kargoya Verildi — #${orderSetId.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendShippingUpdateEmail failed (non-blocking)', {
      orderSetId,
      error: err.message,
    });
  }
}

export async function sendDeliveryConfirmationEmail(
  orderSetId: string,
  customerEmail: string,
  customerName: string,
): Promise<void> {
  try {
    const html = deliveryConfirmationHtml({
      orderSetId,
      customerName,
      orderUrl: `${APP_URL}/orders/${orderSetId}`,
    });
    await sendEmail({
      to: customerEmail,
      subject: `Siparişiniz Teslim Edildi — #${orderSetId.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendDeliveryConfirmationEmail failed (non-blocking)', {
      orderSetId,
      error: err.message,
    });
  }
}

export async function sendRefundNotificationEmail(
  orderSetId: string,
  customerEmail: string,
  customerName: string,
  refundAmount: number,
  currency: string,
): Promise<void> {
  try {
    const html = refundNotificationHtml({ orderSetId, customerName, refundAmount, currency });
    await sendEmail({
      to: customerEmail,
      subject: `İade İşleminiz Başlatıldı — #${orderSetId.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendRefundNotificationEmail failed (non-blocking)', {
      orderSetId,
      error: err.message,
    });
  }
}

export async function sendNewSellerOrderEmail(
  orderSetId: string,
  sellerEmail: string,
  sellerName: string,
  items: Array<{ name: string; quantity: number }>,
  total: number,
  currency: string,
): Promise<void> {
  try {
    const html = newSellerOrderHtml({ orderSetId, sellerName, items, total, currency });
    await sendEmail({
      to: sellerEmail,
      subject: `Yeni Sipariş Aldınız — #${orderSetId.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendNewSellerOrderEmail failed (non-blocking)', {
      orderSetId,
      error: err.message,
    });
  }
}

export async function sendDelayNotificationEmail(
  orderSetId: string,
  customerEmail: string,
  customerName: string,
  estimatedDelivery: string,
  carrier: string,
): Promise<void> {
  try {
    const formattedDate = new Date(estimatedDelivery).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const orderUrl = `${APP_URL}/orders/${orderSetId}`;
    const shortId = orderSetId.slice(0, 8).toUpperCase();
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><title>Sipariş Gecikmesi</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
    <h2 style="color:#6418E5;">Siparişiniz Hakkında Bilgi</h2>
    <p>Sayın ${customerName},</p>
    <p>
      <strong>#${shortId}</strong> numaralı siparişiniz tahmini teslimat tarihini geçmiş olup
      kargonuz hâlâ yoldadır. Olası gecikmeden dolayı özür dileriz.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px;color:#555;">Kargo Firması:</td>
        <td style="padding:8px;font-weight:bold;">${carrier}</td>
      </tr>
      <tr style="background:#f9f9f9;">
        <td style="padding:8px;color:#555;">Tahmini Teslimat:</td>
        <td style="padding:8px;font-weight:bold;">${formattedDate}</td>
      </tr>
    </table>
    <p>
      <a href="${orderUrl}" style="display:inline-block;padding:12px 24px;background:#6418E5;color:#fff;border-radius:6px;text-decoration:none;">
        Siparişimi Takip Et
      </a>
    </p>
    <p style="color:#888;font-size:13px;">
      Herhangi bir sorunuz varsa müşteri hizmetlerimizle iletişime geçebilirsiniz.
    </p>
  </div>
</body>
</html>`;
    await sendEmail({
      to: customerEmail,
      subject: `Siparişiniz Gecikmeli — #${shortId}`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendDelayNotificationEmail failed (non-blocking)', {
      orderSetId,
      error: err.message,
    });
  }
}

export async function sendAbandonedCartEmail(
  customerEmail: string,
  customerName: string,
  items: Array<{ name: string; image?: string }>,
  cartUrl: string,
): Promise<void> {
  try {
    const itemCount = items.length;
    const html = abandonedCartHtml({ customerName, items, itemCount, cartUrl });
    await sendEmail({
      to: customerEmail,
      subject: `Sepetinde ${itemCount} ürün kaldı — Benim Olan`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendAbandonedCartEmail failed (non-blocking)', {
      customerEmail,
      error: err.message,
    });
  }
}
