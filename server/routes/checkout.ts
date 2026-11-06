// ─── Checkout completion (server-side order creation) ───────────────────────
// The only way a buyer order reaches `orders`: the client can no longer write orders
// (firestore.rules), so status/paymentStatus/total/stock are decided here.
//   stripe : PaymentIntent must be succeeded, belong to this uid and match the cart → status 'paid'
//   manual : bank transfer, stock reserved now → status 'pending'
//   iyzico : order created 'pending'; /api/iyzico/callback marks it paid (markIyzicoOrderPaid)
import type { Express } from 'express';
import type Stripe from 'stripe';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { logger } from '../logger.js';
import {
  cartSignature,
  productPageCoupons,
  quoteCheckout,
  quoteLines,
  QuoteError,
  type QuoteLine,
} from '../services/checkoutQuote.js';

type Middleware = (req: any, res: any, next: any) => any;

const itemInput = z.object({
  productId: z.string().min(1).max(128),
  quantity: z.number().int().positive().max(999),
});

export const checkoutItemsSchema = z.array(itemInput).min(1).max(50);

const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(300),
  line2: z.string().max(300).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().max(100).optional().default(''),
  postalCode: z.string().max(20).optional().default(''),
  country: z.string().max(60).default('TR'),
  phone: z.string().trim().min(1).max(30),
});

const completeSchema = z.object({
  paymentMethod: z.enum(['stripe', 'manual', 'iyzico']),
  paymentIntentId: z.string().startsWith('pi_').max(255).optional(),
  items: checkoutItemsSchema,
  couponCode: z.string().max(64).optional(),
  shipping: z.number().finite().nonnegative().optional(),
  carrier: z.string().max(40).optional(),
  guestEmail: z.string().email().max(254).optional(),
  shippingAddress: addressSchema,
});

const round2 = (n: number) => Math.round(n * 100) / 100;
const orderItems = (lines: QuoteLine[]) => lines.map(({ freeShipping: _f, ...l }) => l);
const sellerIdsOf = (lines: QuoteLine[]) => [
  ...new Set(lines.map((l) => l.sellerId).filter(Boolean)),
];

export function registerCheckoutRoutes(
  app: Express,
  deps: { stripe: Stripe; adminDb: Firestore | null; verifyFirebaseToken: Middleware },
) {
  const { stripe, adminDb, verifyFirebaseToken } = deps;

  // Coupons advertised on a product page: global + that seller's, valid only, display fields only.
  // (The `coupons` collection itself is seller/admin-only, so used-up or inactive codes never leak.)
  app.get('/api/coupons/active', async (req: any, res: any) => {
    if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
    try {
      const sellerId =
        typeof req.query.sellerId === 'string' ? req.query.sellerId.slice(0, 128) : '';
      const coupons = await productPageCoupons(adminDb, sellerId);
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ coupons });
    } catch {
      return res.json({ coupons: [] });
    }
  });

  // Coupon preview: buyers cannot read `coupons` (rules), so the code is checked here.
  app.post(
    '/api/checkout/quote',
    verifyFirebaseToken,
    validate(
      z.object({
        items: checkoutItemsSchema,
        couponCode: z.string().max(64).optional(),
        shipping: z.number().finite().nonnegative().optional(),
      }),
    ),
    async (req: any, res: any) => {
      if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
      try {
        const { lines: _lines, ...totals } = await quoteCheckout(adminDb, req.body);
        return res.json(totals);
      } catch (err: any) {
        if (err instanceof QuoteError) return res.status(err.status).json({ error: err.message });
        return res.status(500).json({ error: 'Tutar hesaplanamadı' });
      }
    },
  );

  app.post(
    '/api/checkout/complete',
    verifyFirebaseToken,
    validate(completeSchema),
    async (req: any, res: any) => {
      if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
      const db = adminDb;
      const body = req.body as z.infer<typeof completeSchema>;
      const uid: string = req.uid;
      const isGuest = req.decodedToken?.firebase?.sign_in_provider === 'anonymous';
      const userEmail = req.userEmail || body.guestEmail || '';
      const now = new Date().toISOString();

      try {
        const base = {
          userId: uid,
          userEmail,
          isGuest,
          currency: 'TRY',
          paymentMethod: body.paymentMethod,
          shippingAddress: body.shippingAddress,
          ...(body.carrier ? { carrier: body.carrier } : {}),
          createdAt: now,
          updatedAt: now,
        };

        // ── Stripe: payment already captured — verify it, then always create the order ──
        if (body.paymentMethod === 'stripe') {
          if (!body.paymentIntentId) {
            return res.status(400).json({ error: 'paymentIntentId gerekli' });
          }
          const pi = await stripe.paymentIntents.retrieve(body.paymentIntentId);
          if (pi.status !== 'succeeded') {
            return res.status(402).json({ error: 'Ödeme tamamlanmamış' });
          }
          if (pi.metadata?.uid !== uid) return res.status(403).json({ error: 'Forbidden' });
          if (pi.metadata?.cartSig !== cartSignature(body.items)) {
            return res.status(400).json({ error: 'Sepet ödeme ile eşleşmiyor' });
          }

          const lines = await quoteLines(db, body.items);
          const claimRef = db.collection('paymentClaims').doc(pi.id);
          const orderRef = db.collection('orders').doc();
          const couponId = pi.metadata?.couponId || '';

          const orderId = await db.runTransaction(async (tx) => {
            const claim = await tx.get(claimRef);
            if (claim.exists) return claim.data()!.orderId as string; // idempotent retry
            const productRefs = lines.map((l) => db.collection('products').doc(l.productId));
            const snaps = await Promise.all(productRefs.map((r) => tx.get(r)));
            snaps.forEach((s, i) => {
              if ((s.data()?.stock ?? 0) < lines[i].quantity) {
                // Paid already: never refuse the order; log so the seller/admin can act.
                logger.warn('checkout', 'Paid order oversells stock', {
                  productId: lines[i].productId,
                  piId: pi.id,
                });
              }
              tx.update(productRefs[i], { stock: FieldValue.increment(-lines[i].quantity) });
            });
            if (couponId) {
              tx.update(db.collection('coupons').doc(couponId), {
                usedCount: FieldValue.increment(1),
              });
            }
            tx.create(orderRef, {
              ...base,
              items: orderItems(lines),
              sellerIds: sellerIdsOf(lines),
              subtotal: round2(lines.reduce((s, l) => s + l.subtotal, 0)),
              discount: Number(pi.metadata?.discount || 0),
              shipping: Number(pi.metadata?.shipping || 0),
              tax: Number(pi.metadata?.tax || 0),
              total: round2((pi.amount_received || pi.amount) / 100),
              status: 'paid',
              paymentStatus: 'succeeded',
              stripePaymentIntentId: pi.id,
              ...(couponId ? { couponId } : {}),
              paidAt: now,
            });
            tx.create(claimRef, { orderId: orderRef.id, uid, createdAt: now });
            return orderRef.id;
          });

          const snap = await db.collection('orders').doc(orderId).get();
          return res.status(201).json({ order: { id: orderId, ...snap.data() } });
        }

        // ── Manual (havale/EFT) and iyzico: nothing paid yet — totals and stock checked now ──
        const quote = await quoteCheckout(db, body);
        const orderRef = db.collection('orders').doc();
        const order = {
          ...base,
          items: orderItems(quote.lines),
          sellerIds: sellerIdsOf(quote.lines),
          subtotal: quote.subtotal,
          discount: quote.discount,
          shipping: quote.shipping,
          tax: quote.tax,
          total: quote.total,
          status: 'pending',
          paymentStatus: 'pending',
          stripePaymentIntentId: '',
          ...(quote.couponId ? { couponId: quote.couponId } : {}),
        };

        await db.runTransaction(async (tx) => {
          if (body.paymentMethod === 'manual') {
            // Bank transfer: reserve stock now (restored if the order is cancelled).
            const refs = quote.lines.map((l) => db.collection('products').doc(l.productId));
            const snaps = await Promise.all(refs.map((r) => tx.get(r)));
            snaps.forEach((s, i) => {
              if ((s.data()?.stock ?? 0) < quote.lines[i].quantity) {
                throw new QuoteError(`Stok yetersiz: ${quote.lines[i].name}`, 409);
              }
            });
            refs.forEach((r, i) =>
              tx.update(r, { stock: FieldValue.increment(-quote.lines[i].quantity) }),
            );
            if (quote.couponId) {
              tx.update(db.collection('coupons').doc(quote.couponId), {
                usedCount: FieldValue.increment(1),
              });
            }
          }
          tx.create(orderRef, order);
        });

        return res.status(201).json({ order: { id: orderRef.id, ...order } });
      } catch (err: any) {
        if (err instanceof QuoteError) return res.status(err.status).json({ error: err.message });
        logger.error('checkout', 'Order completion failed', {
          error: err.message,
          paymentMethod: body.paymentMethod,
          piId: body.paymentIntentId,
        });
        return res.status(500).json({ error: 'Sipariş oluşturulamadı' });
      }
    },
  );
}

/**
 * Called by the iyzico browser callback after the payment was verified with iyzico.
 * Idempotent: a second call for an already-paid order is a no-op.
 */
export async function markIyzicoOrderPaid(
  db: Firestore,
  orderId: string,
  paid: { paidPrice: number; token: string; paymentId?: string },
): Promise<'paid' | 'already' | 'mismatch' | 'missing'> {
  const orderRef = db.collection('orders').doc(orderId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) return 'missing';
    const o = snap.data()!;
    if (o.paymentStatus === 'succeeded') return 'already';
    // paidPrice may include installment interest, so it can only be >= the order total.
    if (o.paymentMethod !== 'iyzico' || paid.paidPrice + 0.01 < Number(o.total)) {
      return 'mismatch';
    }
    for (const item of o.items ?? []) {
      tx.update(db.collection('products').doc(item.productId), {
        stock: FieldValue.increment(-item.quantity),
      });
    }
    if (o.couponId) {
      tx.update(db.collection('coupons').doc(o.couponId), { usedCount: FieldValue.increment(1) });
    }
    const now = new Date().toISOString();
    tx.update(orderRef, {
      status: 'paid',
      paymentStatus: 'succeeded',
      iyzicoPaymentToken: paid.token,
      ...(paid.paymentId ? { iyzicoPaymentId: paid.paymentId } : {}),
      paidAt: now,
      updatedAt: now,
    });
    return 'paid';
  });
}

/** iyzico requires sum(basketItems.price) === price: spread the order total over its lines. */
export function iyzicoBasket(
  items: Array<{ productId: string; name: string; subtotal: number }>,
  total: number,
) {
  const positive = items.filter((i) => i.subtotal > 0);
  const sum = positive.reduce((s, i) => s + i.subtotal, 0);
  let acc = 0;
  return positive.map((item, idx) => {
    const price =
      idx === positive.length - 1 ? round2(total - acc) : round2((item.subtotal / sum) * total);
    acc = round2(acc + price);
    return {
      id: item.productId,
      name: item.name.slice(0, 120),
      category1: 'Genel',
      itemType: 'PHYSICAL',
      price: price.toFixed(2),
    };
  });
}
