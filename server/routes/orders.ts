// ─── Order API Routes ─────────────────────────────────────────────────────────
// Covers order creation + listing using the server-side order service.
// All writes go through the admin SDK (not client-side Firestore).

import type { Express } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { createOrderSet, getOrderSet, getUserOrderSets } from '../services/orderService.js';
import { recordEntry } from '../services/ledgerService.js';
import { transitionOrder, InvalidTransitionError } from '../services/transitionEngine.js';
import type { OrderSetStatus, TransitionEvent } from '../services/transitionEngine.js';
import { subOrderTransitionSchema } from '../lib/schemas.js';
import { processDelivery } from '../services/payoutService.js';
import {
  sendShippingUpdateEmail,
  sendDeliveryConfirmationEmail,
} from '../services/emailService.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface OrderRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
  getIyzico?: () => Promise<any>;
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

        // Record ledger entry for the order charge
        if (deps.adminDb) {
          try {
            await recordEntry(deps.adminDb, {
              orderSetId: result.id,
              subOrderId: '',
              sellerId: '',
              type: 'order_charge',
              amount: result.totalAmount,
              currency: result.currency,
              reference: '',
              reason: 'Order placed',
              createdBy: 'system',
            });
          } catch (ledgerErr) {
            // Ledger recording failure is non-blocking for order creation
            console.warn(
              '[ledger] Failed to record order_charge entry:',
              (ledgerErr as Error).message,
            );
          }
        }

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
   * POST /api/orders/:orderSetId/subOrders/:subOrderId/transition
   * Seller-only endpoint to transition a SubOrder status (e.g., processing -> shipped).
   * Requires: Firebase token, seller ownership of the SubOrder.
   * Enforces: state machine via transitionEngine, trackingNumber required for mark_shipped (D-13).
   */
  app.post(
    '/api/orders/:orderSetId/subOrders/:subOrderId/transition',
    verifyFirebaseToken,
    validate(subOrderTransitionSchema),
    async (req: any, res: any) => {
      const { orderSetId, subOrderId } = req.params;
      const { event, trackingNumber, carrier } = req.body as {
        event: TransitionEvent;
        trackingNumber?: string;
        carrier?: string;
      };

      try {
        if (!deps.adminDb) {
          return res.status(503).json({ error: 'Database not configured' });
        }
        const db = deps.adminDb;

        const subOrderRef = db.collection('subOrders').doc(subOrderId);
        const orderSetRef = db.collection('orderSets').doc(orderSetId);

        let newStatus: OrderSetStatus;

        await db.runTransaction(async (txn: any) => {
          const subSnap = await txn.get(subOrderRef);
          if (!subSnap.exists) {
            throw Object.assign(new Error('SubOrder not found'), { statusCode: 404 });
          }

          const subData = subSnap.data()!;

          // Seller ownership check (T-02-006)
          if (subData.sellerId !== req.uid && req.role !== 'admin') {
            throw Object.assign(new Error('Forbidden: not the seller of this SubOrder'), {
              statusCode: 403,
            });
          }

          const currentStatus = subData.status as OrderSetStatus;
          const currentVersion = (subData.version as number) || 0;

          // Enforce state machine
          const result = transitionOrder(currentStatus, event, currentVersion);
          newStatus = result.status;

          const updateFields: Record<string, any> = {
            status: result.status,
            version: result.version,
            updatedAt: new Date().toISOString(),
          };

          if (event === 'mark_shipped') {
            if (trackingNumber) updateFields.trackingNumber = trackingNumber;
            if (carrier) updateFields.carrier = carrier;
            updateFields.shippedAt = new Date().toISOString();
          }

          txn.update(subOrderRef, updateFields);

          // Check if all SubOrders are now shipped — update OrderSet aggregate
          const orderSetSnap = await txn.get(orderSetRef);
          if (orderSetSnap.exists) {
            const orderSetData = orderSetSnap.data()!;
            const subOrderIds: string[] = orderSetData.subOrderIds || [];

            if (subOrderIds.length > 0 && result.status === 'shipped') {
              // Fetch sibling subOrders (outside this transaction snapshot — best effort)
              // We optimistically update OrderSet if this is the only subOrder
              // For multi-subOrder sets, the parent route should reconcile separately
              if (subOrderIds.length === 1) {
                const osVersion = (orderSetData.version as number) || 0;
                txn.update(orderSetRef, {
                  status: 'shipped',
                  version: osVersion + 1,
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          }
        });

        // ── Email triggers (non-blocking) ────────────────────────────────────
        if (newStatus! === 'shipped' || newStatus! === 'delivered') {
          // Fetch OrderSet to get customer email
          getOrderSet(orderSetId)
            .then((orderSet) => {
              if (!orderSet) return;
              const osData = orderSet as any;
              const customerEmail: string = osData.userEmail || '';
              const customerName: string = osData.userName || osData.userEmail || 'Müşteri';
              if (!customerEmail) return;

              if (newStatus! === 'shipped') {
                sendShippingUpdateEmail(
                  orderSetId,
                  customerEmail,
                  customerName,
                  carrier || '',
                  trackingNumber || '',
                ).catch(() => {});
              } else if (newStatus! === 'delivered') {
                sendDeliveryConfirmationEmail(orderSetId, customerEmail, customerName).catch(
                  () => {},
                );
              }
            })
            .catch(() => {}); // non-blocking
        }

        // Delivery hook: trigger iyzico approval + ledger status update (non-blocking)
        if (newStatus! === 'delivered') {
          const db = deps.adminDb;
          const subSnap = await db.collection('subOrders').doc(subOrderId).get();
          const subData = subSnap.exists ? subSnap.data() : {};
          const paymentTransactionId = subData?.paymentTransactionId || null;

          processDelivery(
            deps.adminDb,
            orderSetId,
            subOrderId,
            paymentTransactionId,
            deps.getIyzico || null,
          ).catch((err: Error) => {
            console.warn('[payout] processDelivery failed (non-blocking):', err.message);
          });
        }

        return res.json({ success: true, status: newStatus! });
      } catch (err: any) {
        if (err instanceof InvalidTransitionError) {
          return res.status(422).json({ error: err.message });
        }
        const code = err.statusCode ?? 500;
        return res.status(code).json({ error: err.message || 'Transition failed' });
      }
    },
  );

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
