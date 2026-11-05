// ─── Server-authoritative checkout totals ────────────────────────────────────
// Mirrors the Checkout.tsx math (TRY only, TR VAT on top of the discounted subtotal) so the
// total the buyer sees and the amount charged agree. Client totals are compared, never trusted.
import { createHash } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { calculateTotal, MARKETS } from '../../src/lib/taxEngine.js';

export interface QuoteItemInput {
  productId: string;
  quantity: number;
}

export interface QuoteLine {
  productId: string;
  sellerId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
  freeShipping: boolean;
}

export interface CheckoutQuote {
  lines: QuoteLine[];
  subtotal: number;
  /** Coupon + best cart campaign. */
  discount: number;
  couponDiscount: number;
  couponId: string | null;
  shipping: number;
  tax: number;
  total: number;
  currency: 'TRY';
}

// shortcut: shipping is the client-chosen carrier rate, capped here; compute rates server-side once carrier APIs are live.
export const MAX_SHIPPING_TRY = 1000;

export class QuoteError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Order-independent fingerprint of the cart, stored on the PaymentIntent and re-checked on completion. */
export function cartSignature(items: QuoteItemInput[]): string {
  const canon = items
    .map((i) => `${i.productId}:${i.quantity}`)
    .sort()
    .join('|');
  return createHash('sha256').update(canon).digest('hex').slice(0, 32);
}

/** Server prices, names and sellers for the cart lines. Throws QuoteError for unknown products. */
export async function quoteLines(db: Firestore, items: QuoteItemInput[]): Promise<QuoteLine[]> {
  if (items.length === 0) throw new QuoteError('Sepet boş');
  const snaps = await Promise.all(
    items.map((i) => db.collection('products').doc(i.productId).get()),
  );
  return items.map((item, idx) => {
    const snap = snaps[idx];
    if (!snap.exists) throw new QuoteError(`Ürün bulunamadı: ${item.productId}`, 409);
    const p = snap.data()!;
    const price = p.price ?? p.basePrice;
    if (typeof price !== 'number' || price <= 0) {
      throw new QuoteError(`Ürün fiyatı geçersiz: ${item.productId}`, 409);
    }
    return {
      productId: item.productId,
      sellerId: String(p.sellerId || ''),
      name: String(p.title || p.name || 'Ürün'),
      image: String(p.images?.[0] || ''),
      price,
      quantity: item.quantity,
      subtotal: round2(price * item.quantity),
      freeShipping: p.freeShipping === true,
    };
  });
}

async function couponDiscount(
  db: Firestore,
  code: string,
  lines: QuoteLine[],
  subtotal: number,
): Promise<{ id: string; amount: number }> {
  const snap = await db
    .collection('coupons')
    .where('code', '==', code.trim().toUpperCase())
    .where('isActive', '==', true)
    .limit(1)
    .get();
  if (snap.empty) throw new QuoteError('Geçersiz veya süresi dolmuş kupon');
  const c = snap.docs[0].data();
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) {
    throw new QuoteError('Geçersiz veya süresi dolmuş kupon');
  }
  if (typeof c.maxUses === 'number' && (c.usedCount ?? 0) >= c.maxUses) {
    throw new QuoteError('Geçersiz veya süresi dolmuş kupon');
  }
  // Seller-scoped coupons apply only to that seller's lines (same rule as Checkout.tsx).
  const base = c.sellerId
    ? lines.filter((l) => l.sellerId === c.sellerId).reduce((s, l) => s + l.subtotal, 0)
    : subtotal;
  if (base <= 0) throw new QuoteError('Bu kupon sepetinizdeki ürünler için geçerli değil.');
  if (typeof c.minOrderAmount === 'number' && base < c.minOrderAmount) {
    throw new QuoteError('Minimum sipariş tutarı karşılanmıyor');
  }
  const amount =
    c.discountType === 'percentage'
      ? round2((base * c.discountValue) / 100)
      : Math.min(Number(c.discountValue) || 0, base);
  return { id: snap.docs[0].id, amount };
}

/** Best active cart campaign discount (same rule as campaignService.calcCartCampaigns). */
async function campaignDiscount(db: Firestore, subtotal: number): Promise<number> {
  const snap = await db
    .collection('campaigns')
    .where('isActive', '==', true)
    .where('isCartCampaign', '==', true)
    .get();
  const now = new Date().toISOString();
  let best = 0;
  for (const d of snap.docs) {
    const c = d.data();
    if (!(c.startDate <= now && c.endDate >= now)) continue;
    if (c.minOrderAmount && subtotal < c.minOrderAmount) continue;
    let amount =
      c.discountType === 'percentage'
        ? round2(subtotal * (c.discountValue / 100))
        : Number(c.discountValue) || 0;
    if (c.maxDiscountAmount && amount > c.maxDiscountAmount) amount = c.maxDiscountAmount;
    best = Math.max(best, amount);
  }
  return best;
}

export async function quoteCheckout(
  db: Firestore,
  input: { items: QuoteItemInput[]; couponCode?: string; shipping?: number },
): Promise<CheckoutQuote> {
  const lines = await quoteLines(db, input.items);
  const subtotal = round2(lines.reduce((s, l) => s + l.subtotal, 0));

  const coupon = input.couponCode?.trim()
    ? await couponDiscount(db, input.couponCode, lines, subtotal)
    : null;
  const discount = round2((coupon?.amount ?? 0) + (await campaignDiscount(db, subtotal)));

  const allFree = lines.every((l) => l.freeShipping);
  const shipping = allFree
    ? 0
    : round2(Math.min(Math.max(input.shipping ?? 0, 0), MAX_SHIPPING_TRY));

  const t = calculateTotal(Math.max(0, subtotal - discount), shipping, MARKETS.TR, true);
  return {
    lines,
    subtotal,
    discount,
    couponDiscount: coupon?.amount ?? 0,
    couponId: coupon?.id ?? null,
    shipping,
    tax: round2(t.vat),
    total: round2(t.total),
    currency: 'TRY',
  };
}
