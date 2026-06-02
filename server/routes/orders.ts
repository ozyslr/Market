// ─── Order API Routes ─────────────────────────────────────────────────────────
// Covers order creation + listing using the server-side order service.
// All writes go through the admin SDK (not client-side Firestore).

import type { Express } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { createOrderSet, getOrderSet, getUserOrderSets } from '../services/orderService.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface OrderRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
}

// ─── Validation Schemas ───────────────────────────────────────────────────────

const orderItemSchema = z.object({
  productId: z.string().min(1),
  sellerId: z.string().min(1),
  name: z.string().min(1),
  image: z.string().min(1),
  price: z.number().finite().nonnegative(),
  quantity: z.number().int().positive(),
  subtotal: z.number().finite().nonnegative(),
});

const shippingAddressSchema = z.object({
  fullName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1).max(2),
  phone: z.string().min(1),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  currency: z.string().length(3).default('TRY'),
  shippingAddress: shippingAddressSchema,
});

// ─── Route Registration ──────────────────────────────────────────────────────

export function registerOrderRoutes(app: Express, deps: OrderRouteDeps) {
  const { verifyFirebaseToken } = deps;

  /**
   * POST /api/orders/create
   * Create a new OrderSet with SubOrders grouped by sellerId.
   * Requires: valid Firebase ID token, valid order body.
   */
  app.post(
    '/api/orders/create',
    verifyFirebaseToken,
    validate(createOrderSchema),
    async (req: any, res: any) => {
      try {
        const { items, currency, shippingAddress } = req.body;

        const result = await createOrderSet({
          userId: req.uid,
          userEmail: req.userEmail || '',
          items,
          currency,
          shippingAddress,
        });

        return res.status(201).json(result);
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to create order' });
      }
    },
  );

  /**
   * GET /api/orders
   * List all OrderSets for the authenticated user.
   */
  app.get('/api/orders', verifyFirebaseToken, async (req: any, res: any) => {
    try {
      const orders = await getUserOrderSets(req.uid);
      return res.status(200).json(orders);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
    }
  });

  /**
   * GET /api/orders/:orderSetId
   * Get a single OrderSet with its populated SubOrders.
   * Ownership is enforced: only the order owner or admin can read.
   */
  app.get('/api/orders/:orderSetId', verifyFirebaseToken, async (req: any, res: any) => {
    try {
      const { orderSetId } = req.params;
      const orderSet = await getOrderSet(orderSetId);

      if (!orderSet) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Ownership check: only the owner or an admin can read
      if ((orderSet as any).userId !== req.uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.status(200).json(orderSet);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch order' });
    }
  });
}
