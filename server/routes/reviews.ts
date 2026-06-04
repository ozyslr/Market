// ─── Review API Routes ────────────────────────────────────────────────────────
// Verified-purchase-gated review submission (REV-01).
// All writes go through the Admin SDK — client direct writes to `reviews` are denied
// by firestore.rules. The server confirms a Delivered SubOrder for the buyer before
// writing the review with server-set `verified: true` and `status: 'approved'`.

import type { Express } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { sendNewQuestionEmail } from '../services/emailService.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface ReviewRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
}

// ─── Validation Schema ─────────────────────────────────────────────────────────

const notifyQuestionSchema = z.object({
  productId: z.string().min(1),
  questionId: z.string().min(1),
  questionText: z.string().min(1).max(2000),
});

const submitReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
  userName: z.string().min(1).max(120).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  categoryRatings: z
    .object({
      quality: z.number().min(1).max(5),
      shipping: z.number().min(1).max(5),
      description: z.number().min(1).max(5),
    })
    .optional(),
});

// ─── Route Registration ──────────────────────────────────────────────────────

export function registerReviewRoutes(app: Express, deps: ReviewRouteDeps) {
  const { adminDb, verifyFirebaseToken } = deps;

  /**
   * POST /api/reviews
   * Submit a product review. Gated on a Delivered SubOrder owned by the caller
   * that contains the product. The server sets `verified: true` and
   * `status: 'approved'` — these are never read from the request body (T-07-01).
   */
  app.post(
    '/api/reviews',
    verifyFirebaseToken,
    validate(submitReviewSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) {
          return res.status(503).json({ error: 'Database not configured' });
        }

        const { productId, rating, comment, photos, categoryRatings, userName } = req.body;
        const userId: string = req.uid;

        // 1. Verify the buyer has a Delivered SubOrder containing this product.
        //    SubOrder docs have no `userId`/`productIds` fields — the buyer lives on
        //    the parent OrderSet and products live in the SubOrder `items[]` array —
        //    so we traverse the user's OrderSets to their delivered SubOrders (D-01).
        const orderSetsSnap = await adminDb
          .collection('orderSets')
          .where('userId', '==', userId)
          .get();

        const subOrderIds: string[] = [];
        orderSetsSnap.docs.forEach((d: any) => {
          const ids = d.data()?.subOrderIds || [];
          for (const id of ids) subOrderIds.push(id);
        });

        let verifiedPurchase = false;
        let deliveredSellerId: string | null = null;
        for (const subId of subOrderIds) {
          const subSnap = await adminDb.collection('subOrders').doc(subId).get();
          if (!subSnap.exists) continue;
          const sub = subSnap.data();
          if (sub?.status !== 'delivered') continue;
          const items: any[] = sub.items || [];
          const match = items.find((it) => it.productId === productId);
          if (match) {
            verifiedPurchase = true;
            deliveredSellerId = match.sellerId || null;
            break;
          }
        }

        if (!verifiedPurchase) {
          return res
            .status(403)
            .json({ error: 'Yalnızca teslim alınan ürünler için yorum yapabilirsiniz.' });
        }

        // 2. Dedup — one approved review per product+user (T-07-05).
        const dupSnap = await adminDb
          .collection('reviews')
          .where('productId', '==', productId)
          .where('userId', '==', userId)
          .where('status', '==', 'approved')
          .limit(1)
          .get();
        if (!dupSnap.empty) {
          return res.status(409).json({ error: 'Bu ürün için zaten yorum yaptınız.' });
        }

        // 3. Resolve sellerId (prefer the canonical product doc, fall back to the
        //    matched order item's sellerId).
        let sellerId: string | null = deliveredSellerId;
        try {
          const productSnap = await adminDb.collection('products').doc(productId).get();
          if (productSnap.exists && productSnap.data()?.sellerId) {
            sellerId = productSnap.data().sellerId;
          }
        } catch {
          // keep deliveredSellerId fallback
        }

        // 4. Write the review via Admin SDK with server-set trust fields.
        const review: Record<string, any> = {
          productId,
          sellerId: sellerId || null,
          userId,
          userName: userName || 'Müşteri',
          rating,
          comment,
          photos: Array.isArray(photos) ? photos : [],
          categoryRatings: categoryRatings || null,
          helpfulCount: 0,
          helpfulVoters: [],
          verified: true, // server-set — never from req.body (T-07-01)
          status: 'approved', // server-set — verified purchases auto-approve (D-02)
          createdAt: new Date().toISOString(),
        };

        const ref = await adminDb.collection('reviews').add(review);

        return res.status(201).json({ data: { id: ref.id, ...review } });
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to submit review' });
      }
    },
  );

  /**
   * POST /api/reviews/notify-seller-question
   * Sends the seller an email when a buyer posts a question (REV-04). The seller's
   * email/PII is resolved server-side and never returned to the client (T-07-12).
   * Best-effort: any failure responds 200 so the question flow is never blocked.
   */
  app.post(
    '/api/reviews/notify-seller-question',
    verifyFirebaseToken,
    validate(notifyQuestionSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(200).json({ ok: false, reason: 'db-unconfigured' });
        const { productId, questionText } = req.body;

        const productSnap = await adminDb.collection('products').doc(productId).get();
        if (!productSnap.exists) return res.status(200).json({ ok: false, reason: 'no-product' });
        const product = productSnap.data();
        const sellerId: string | undefined = product?.sellerId;
        const productName: string = product?.title || product?.name || 'Ürününüz';
        if (!sellerId) return res.status(200).json({ ok: false, reason: 'no-seller' });

        // Resolve seller email + display name (sellers doc first, then user doc).
        let email: string | undefined;
        let sellerName = 'Satıcı';
        const sellerSnap = await adminDb.collection('sellers').doc(sellerId).get();
        if (sellerSnap.exists) {
          const s = sellerSnap.data();
          email = s?.email || s?.contactEmail || s?.ownerEmail;
          sellerName = s?.storeName || s?.name || sellerName;
        }
        if (!email) {
          const userSnap = await adminDb.collection('users').doc(sellerId).get();
          if (userSnap.exists) {
            const u = userSnap.data();
            email = u?.email;
            sellerName = u?.displayName || u?.name || sellerName;
          }
        }
        if (!email) return res.status(200).json({ ok: false, reason: 'no-email' });

        const appUrl = process.env.APP_URL || 'https://benimolan.com';
        await sendNewQuestionEmail(
          email,
          sellerName,
          productName,
          questionText,
          `${appUrl}/seller/questions`,
        );
        return res.status(200).json({ ok: true });
      } catch (err: any) {
        // Non-blocking: never fail the question flow on a notification error.
        return res.status(200).json({ ok: false, reason: err.message });
      }
    },
  );
}
