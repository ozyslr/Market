import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/types/order';

function buildOrderEmailHtml(order: Order): string {
  const currencySymbol = order.currency === 'GBP' ? '£' : order.currency === 'USD' ? '$' : '₺';
  const itemRows = order.items
    .map(
      item => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1A1033;">${item.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;color:#666;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:700;color:#1A1033;">${currencySymbol}${item.subtotal.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const addr = order.shippingAddress;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;max-width:100%;">

        <!-- Header -->
        <tr><td style="background:#1A1033;padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-1px;font-style:italic;">MERCORA</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Global Marketplace</p>
        </td></tr>

        <!-- Success Banner -->
        <tr><td style="background:#7C3AED;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">✅ Siparişiniz Onaylandı!</p>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Sipariş No: <strong style="color:#fff;">#${order.id.slice(0, 12).toUpperCase()}</strong></p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">

          <!-- Order Items -->
          <h3 style="margin:0 0 16px;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#999;">Sipariş Detayları</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr>
                <th style="text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#bbb;padding-bottom:8px;">Ürün</th>
                <th style="text-align:center;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#bbb;padding-bottom:8px;">Adet</th>
                <th style="text-align:right;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#bbb;padding-bottom:8px;">Tutar</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:2px solid #1A1033;">
            <tr>
              <td style="padding:8px 0;font-size:12px;color:#999;">Ara Toplam</td>
              <td style="padding:8px 0;text-align:right;font-size:12px;font-weight:700;">${currencySymbol}${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:12px;color:#999;">Kargo</td>
              <td style="padding:8px 0;text-align:right;font-size:12px;font-weight:700;">${currencySymbol}${order.shipping.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:12px;color:#999;">KDV / VAT</td>
              <td style="padding:8px 0;text-align:right;font-size:12px;font-weight:700;">${currencySymbol}${order.tax.toFixed(2)}</td>
            </tr>
            <tr style="border-top:1px solid #eee;">
              <td style="padding:12px 0;font-size:14px;font-weight:900;color:#1A1033;text-transform:uppercase;letter-spacing:1px;">TOPLAM</td>
              <td style="padding:12px 0;text-align:right;font-size:20px;font-weight:900;color:#7C3AED;">${currencySymbol}${order.total.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Shipping Address -->
          ${addr ? `
          <div style="margin-top:28px;padding:20px;background:#F8F8FA;border-radius:16px;">
            <h3 style="margin:0 0 10px;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#999;">Teslimat Adresi</h3>
            <p style="margin:0;font-size:13px;font-weight:700;color:#1A1033;">${addr.fullName}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#666;line-height:1.6;">${addr.line1}<br>${addr.city}, ${addr.postalCode}<br>${addr.country}</p>
          </div>` : ''}

          <!-- CTA -->
          <div style="margin-top:32px;text-align:center;">
            <a href="https://mercora.com/orders/${order.id}"
               style="display:inline-block;padding:14px 32px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">
              Siparişi Takip Et
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;background:#F8F8FA;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
            Mercora Global Marketplace · Bu email otomatik gönderilmiştir
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  try {
    await addDoc(collection(db, 'mail'), {
      to: order.userEmail,
      message: {
        subject: `Siparişiniz Onaylandı — #${order.id.slice(0, 12).toUpperCase()}`,
        html: buildOrderEmailHtml(order),
      },
    });
  } catch (error) {
    // Firebase Trigger Email extension kurulu değilse sessizce geç
    console.warn('[emailService] Trigger Email extension kurulu olmayabilir:', error);
  }
}
