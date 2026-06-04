// ─── Email HTML Templates ──────────────────────────────────────────────────
// Pure HTML template functions — no React Email runtime dependency.
// All templates use inline CSS for maximum email client compatibility.
// Brand: #7C3AED purple, #1A1033 dark, #F8F8FA background.

const BRAND_HEADER = `
  <tr><td style="background:linear-gradient(135deg,#7C3AED,#1A1033);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;letter-spacing:-1px;font-style:italic;">MERCORA</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Benim Olan Alışveriş Platformu</p>
  </td></tr>`;

const BRAND_FOOTER = `
  <tr><td style="padding:24px 40px;background:#F8F8FA;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
      Benim Olan · Bu email otomatik gönderilmiştir
    </p>
  </td></tr>`;

function wrapInLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;max-width:100%;">
        ${BRAND_HEADER}
        ${content}
        ${BRAND_FOOTER}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Order Confirmation ────────────────────────────────────────────────────

export interface OrderConfirmationParams {
  orderSetId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  currency: string;
  shippingAddress?: {
    fullName?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  orderUrl: string;
}

export function orderConfirmationHtml(params: OrderConfirmationParams): string {
  const { orderSetId, customerName, items, total, currency, shippingAddress, orderUrl } = params;
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '₺';
  const shortId = orderSetId.slice(0, 8).toUpperCase();

  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1A1033;">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;color:#666;">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:700;color:#1A1033;">${sym}${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`,
    )
    .join('');

  const addrBlock = shippingAddress
    ? `<div style="margin-top:28px;padding:20px;background:#F8F8FA;border-radius:16px;">
        <h3 style="margin:0 0 10px;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#999;">Teslimat Adresi</h3>
        <p style="margin:0;font-size:13px;font-weight:700;color:#1A1033;">${shippingAddress.fullName || ''}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#666;line-height:1.6;">${shippingAddress.line1 || ''}<br>${shippingAddress.city || ''}, ${shippingAddress.postalCode || ''}<br>${shippingAddress.country || ''}</p>
      </div>`
    : '';

  const content = `
    <tr><td style="background:#7C3AED;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:900;">✅ Siparişiniz Onaylandı!</p>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Merhaba ${customerName} · Sipariş No: <strong style="color:#fff;">#${shortId}</strong></p>
    </td></tr>
    <tr><td style="padding:32px 40px;">
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
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:2px solid #1A1033;">
        <tr style="border-top:1px solid #eee;">
          <td style="padding:12px 0;font-size:14px;font-weight:900;color:#1A1033;text-transform:uppercase;letter-spacing:1px;">TOPLAM</td>
          <td style="padding:12px 0;text-align:right;font-size:20px;font-weight:900;color:#7C3AED;">${sym}${total.toFixed(2)}</td>
        </tr>
      </table>
      ${addrBlock}
      <div style="margin-top:32px;text-align:center;">
        <a href="${orderUrl}" style="display:inline-block;padding:14px 32px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
          Siparişi Takip Et
        </a>
      </div>
    </td></tr>`;

  return wrapInLayout(content);
}

// ─── Shipping Update ───────────────────────────────────────────────────────

export interface ShippingUpdateParams {
  orderSetId: string;
  customerName: string;
  carrier: string;
  trackingNumber: string;
  orderUrl: string;
}

export function shippingUpdateHtml(params: ShippingUpdateParams): string {
  const { orderSetId, customerName, carrier, trackingNumber, orderUrl } = params;
  const shortId = orderSetId.slice(0, 8).toUpperCase();

  const content = `
    <tr><td style="padding:32px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">🚚</div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1A1033;">Siparişiniz Kargoya Verildi!</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#666;">Merhaba ${customerName},</p>
      <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
        Sipariş #${shortId} kargoya verildi. Aşağıdaki bilgilerle takip edebilirsiniz.
      </p>
      <div style="background:#F8F8FA;border-radius:16px;padding:20px;margin-bottom:24px;text-align:left;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999;padding-bottom:4px;">Kargo Firması</td>
            <td style="font-size:14px;font-weight:700;color:#1A1033;text-align:right;">${carrier || 'Belirtilmedi'}</td>
          </tr>
          <tr>
            <td style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999;padding-top:12px;">Takip Numarası</td>
            <td style="font-size:14px;font-weight:700;color:#7C3AED;text-align:right;padding-top:12px;">${trackingNumber || 'Belirtilmedi'}</td>
          </tr>
        </table>
      </div>
      <a href="${orderUrl}" style="display:inline-block;padding:14px 32px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
        Siparişi Görüntüle
      </a>
    </td></tr>`;

  return wrapInLayout(content);
}

// ─── Delivery Confirmation ─────────────────────────────────────────────────

export interface DeliveryConfirmationParams {
  orderSetId: string;
  customerName: string;
  orderUrl: string;
}

export function deliveryConfirmationHtml(params: DeliveryConfirmationParams): string {
  const { orderSetId, customerName, orderUrl } = params;
  const shortId = orderSetId.slice(0, 8).toUpperCase();

  const content = `
    <tr><td style="padding:32px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">✅</div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1A1033;">Siparişiniz Teslim Edildi!</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#666;">Merhaba ${customerName},</p>
      <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
        Sipariş #${shortId} başarıyla teslim edildi. Alışverişiniz için teşekkür ederiz!
      </p>
      <a href="${orderUrl}" style="display:inline-block;padding:14px 32px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
        Değerlendirme Yap
      </a>
    </td></tr>`;

  return wrapInLayout(content);
}

// ─── Refund Notification ───────────────────────────────────────────────────

export interface RefundNotificationParams {
  orderSetId: string;
  customerName: string;
  refundAmount: number;
  currency: string;
}

export function refundNotificationHtml(params: RefundNotificationParams): string {
  const { orderSetId, customerName, refundAmount, currency } = params;
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '₺';
  const shortId = orderSetId.slice(0, 8).toUpperCase();

  const content = `
    <tr><td style="padding:32px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">💸</div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1A1033;">İade İşleminiz Başlatıldı</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#666;">Merhaba ${customerName},</p>
      <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
        Sipariş #${shortId} için iade talebiniz işleme alındı.
      </p>
      <div style="background:#F8F8FA;border-radius:16px;padding:20px;display:inline-block;margin-bottom:24px;">
        <p style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999;">İade Tutarı</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:900;color:#7C3AED;">${sym}${refundAmount.toFixed(2)}</p>
      </div>
      <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
        İade işlemi 3-5 iş günü içinde hesabınıza yansıyacaktır.
      </p>
    </td></tr>`;

  return wrapInLayout(content);
}

// ─── New Seller Order ──────────────────────────────────────────────────────

export interface NewSellerOrderParams {
  orderSetId: string;
  sellerName: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  currency: string;
}

export function newSellerOrderHtml(params: NewSellerOrderParams): string {
  const { orderSetId, sellerName, items, total, currency } = params;
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '₺';
  const shortId = orderSetId.slice(0, 8).toUpperCase();

  const itemList = items
    .map(
      (item) =>
        `<li style="padding:6px 0;font-size:13px;color:#1A1033;border-bottom:1px solid #f0f0f0;">${item.name} <span style="color:#7C3AED;font-weight:700;">× ${item.quantity}</span></li>`,
    )
    .join('');

  const appUrl = process.env.APP_URL || 'https://benimolan.com';

  const content = `
    <tr><td style="background:#7C3AED;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:900;">🛍️ Yeni Sipariş Aldınız!</p>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Sipariş No: <strong style="color:#fff;">#${shortId}</strong></p>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <p style="margin:0 0 16px;font-size:14px;color:#666;">Merhaba ${sellerName}, yeni bir sipariş aldınız:</p>
      <ul style="list-style:none;margin:0 0 24px;padding:0;">
        ${itemList}
      </ul>
      <div style="background:#F8F8FA;border-radius:16px;padding:16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#999;">Toplam Tutar</td>
            <td style="font-size:20px;font-weight:900;color:#7C3AED;text-align:right;">${sym}${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${appUrl}/seller/orders" style="display:inline-block;padding:14px 32px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
          Siparişleri Görüntüle
        </a>
      </div>
    </td></tr>`;

  return wrapInLayout(content);
}

// ─── New Question (seller) ──────────────────────────────────────────────────

export function newQuestionHtml(
  sellerName: string,
  productName: string,
  questionText: string,
  questionLink: string,
): string {
  const safeQuestion = questionText.slice(0, 500);
  const content = `
    <tr><td style="background:#7C3AED;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:900;">💬 Yeni Soru</p>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">${productName}</p>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <p style="margin:0 0 16px;font-size:14px;color:#666;">Merhaba ${sellerName}, bir alıcı ürününüz hakkında soru sordu:</p>
      <div style="background:#F8F8FA;border-radius:16px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#1A1033;font-weight:600;line-height:1.5;">${safeQuestion}</p>
      </div>
      <div style="text-align:center;">
        <a href="${questionLink}" style="display:inline-block;padding:14px 32px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
          Soruyu Yanıtla
        </a>
      </div>
    </td></tr>`;

  return wrapInLayout(content);
}

// ─── Abandoned Cart ────────────────────────────────────────────────────────

export interface AbandonedCartParams {
  customerName: string;
  items: Array<{ name: string; image?: string }>;
  itemCount: number;
  cartUrl: string;
}

export function abandonedCartHtml(params: AbandonedCartParams): string {
  const { customerName, items, itemCount, cartUrl } = params;

  const itemList = items
    .slice(0, 5)
    .map(
      (item) =>
        `<li style="padding:6px 0;font-size:13px;color:#1A1033;border-bottom:1px solid #f0f0f0;">• ${item.name}</li>`,
    )
    .join('');

  const content = `
    <tr><td style="padding:32px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">🛒</div>
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1A1033;">Sepetinde ${itemCount} ürün kaldı!</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#666;">Merhaba ${customerName},</p>
      <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
        Sepetine eklediğin ürünler hala seni bekliyor.<br>
        Kaçırmadan tamamlamak ister misin?
      </p>
      <ul style="list-style:none;margin:0 0 24px;padding:0;text-align:left;">
        ${itemList}
      </ul>
      <a href="${cartUrl}" style="display:inline-block;padding:14px 36px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
        Sepete Dön
      </a>
      <p style="margin:20px 0 0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        ${items.length} farklı ürün sepetinde seni bekliyor
      </p>
    </td></tr>`;

  return wrapInLayout(content);
}
