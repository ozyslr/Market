// ─── Returns Workflow Routes ───────────────────────────────────────────────────
// SHP-05: Buyer creates return request, seller/admin approves or rejects.
// Approval generates a return label and triggers the Phase 2 refund engine.

import type { Express } from 'express';
import type { ReturnRequest, ReturnReason } from '../../src/types/returns.js';
import { processRefund } from '../services/refundService.js';
import { createCargoShipment, routeCarrierByRegion } from '../../src/services/cargoService.js';
import { transitionOrder } from '../services/transitionEngine.js';

// ─── Constants ─────────────────────────────────────────────────────────────────

const WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14-day return window (T-05-04-03)

const VALID_REASONS: ReturnReason[] = [
  'wrong_item',
  'damaged',
  'not_as_described',
  'changed_mind',
  'other',
];

// ─── Types ─────────────────────────────────────────────────────────────────────

type Middleware = (req: any, res: any, next: any) => any;

export interface ReturnsRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
  verifyAdmin: Middleware;
  verifySeller: Middleware;
  getIyzico: () => Promise<unknown>;
}

// ─── Route Registration ────────────────────────────────────────────────────────

export function registerReturnsRoutes(app: Express, deps: ReturnsRouteDeps): void {
  const { adminDb, verifyFirebaseToken, verifyAdmin, verifySeller } = deps;

  /**
   * POST /api/orders/:orderSetId/subOrders/:subOrderId/return-request
   * Buyer creates a return request. Validates ownership, delivered status, and 14-day window.
   */
  app.post(
    '/api/orders/:orderSetId/subOrders/:subOrderId/return-request',
    verifyFirebaseToken,
    async (req: any, res: any) => {
      const { orderSetId, subOrderId } = req.params;

      try {
        if (!adminDb) {
          return res.status(503).json({ error: 'Database not configured' });
        }
        const db = adminDb;

        // Load OrderSet — buyer ownership check (T-05-04-01)
        const orderSetSnap = await db.collection('orderSets').doc(orderSetId).get();
        if (!orderSetSnap.exists) {
          return res.status(404).json({ error: 'Order not found' });
        }
        const orderSetData = orderSetSnap.data() as { userId: string };
        if (orderSetData.userId !== req.uid) {
          return res.status(403).json({ error: 'Forbidden: not the owner of this order' });
        }

        // Load SubOrder — delivered guard
        const subOrderSnap = await db.collection('subOrders').doc(subOrderId).get();
        if (!subOrderSnap.exists) {
          return res.status(404).json({ error: 'SubOrder not found' });
        }
        const subOrderData = subOrderSnap.data() as {
          status: string;
          sellerId: string;
          deliveredAt?: string;
          version: number;
          shippingAddress?: { country?: string };
        };

        if (subOrderData.status !== 'delivered') {
          return res.status(409).json({ error: 'SubOrder is not in delivered status' });
        }

        // 14-day window guard — reads deliveredAt from Firestore (T-05-04-03, never from body)
        const deliveredAt = subOrderData.deliveredAt;
        if (!deliveredAt) {
          return res.status(409).json({ error: 'deliveredAt not recorded for this SubOrder' });
        }
        if (Date.now() - new Date(deliveredAt).getTime() > WINDOW_MS) {
          return res.status(409).json({ error: 'return_window_expired' });
        }

        // Validate request body
        const { reason, notes } = req.body as { reason: unknown; notes?: unknown };
        if (!reason || !VALID_REASONS.includes(reason as ReturnReason)) {
          return res.status(400).json({
            error: `reason must be one of: ${VALID_REASONS.join(', ')}`,
          });
        }
        if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
          return res.status(400).json({ error: 'notes must be a string max 500 chars' });
        }

        // Create returns/{id} doc
        const returnId = crypto.randomUUID();
        const now = new Date().toISOString();
        const windowExpiresAt = new Date(new Date(deliveredAt).getTime() + WINDOW_MS).toISOString();

        const returnDoc: ReturnRequest = {
          id: returnId,
          orderSetId,
          subOrderId,
          buyerId: req.uid,
          sellerId: subOrderData.sellerId,
          reason: reason as ReturnReason,
          notes: notes as string | undefined,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          windowExpiresAt,
        };

        await db.collection('returns').doc(returnId).set(returnDoc);

        // Transition SubOrder: delivered -> return_requested
        const transition = transitionOrder(
          subOrderData.status as any,
          'request_return',
          subOrderData.version,
        );
        await db.collection('subOrders').doc(subOrderId).update({
          status: transition.status,
          version: transition.version,
          updatedAt: now,
        });

        return res.status(201).json({ returnId });
      } catch (err: any) {
        return res
          .status(err.statusCode ?? 500)
          .json({ error: err.message || 'Failed to create return request' });
      }
    },
  );

  /**
   * POST /api/returns/:returnId/approve
   * Seller or admin approves a pending return, generates label and triggers refund.
   */
  app.post('/api/returns/:returnId/approve', verifyFirebaseToken, async (req: any, res: any) => {
    const { returnId } = req.params;

    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      const db = adminDb;

      // Load return doc
      const returnSnap = await db.collection('returns').doc(returnId).get();
      if (!returnSnap.exists) {
        return res.status(404).json({ error: 'Return request not found' });
      }
      const returnData = returnSnap.data() as ReturnRequest;

      // Seller/admin ownership guard (T-05-04-02)
      if (returnData.sellerId !== req.uid && !req.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: not the seller of this return' });
      }

      // Pending guard (T-05-04-04 — double-approval prevention)
      if (returnData.status !== 'pending') {
        return res.status(409).json({ error: 'Return is not in pending status' });
      }

      // Determine buyer country for carrier routing
      const subOrderSnap = await db.collection('subOrders').doc(returnData.subOrderId).get();
      const subOrderData = subOrderSnap.exists ? (subOrderSnap.data() as any) : {};
      const buyerCountry: string = subOrderData?.shippingAddress?.country ?? 'TR';

      // Fetch seller profile for return label receiver fields (CR-03)
      const sellerSnap = await db.collection('sellers').doc(returnData.sellerId).get();
      const sellerData: any = sellerSnap.exists ? sellerSnap.data()! : {};

      // Generate return label (can fail — no Firestore side-effects yet)
      const providerName = routeCarrierByRegion(buyerCountry);
      const shipmentResp = await createCargoShipment(providerName, {
        orderId: returnData.orderSetId,
        senderName: subOrderData?.shippingAddress?.fullName ?? '',
        senderAddress: subOrderData?.shippingAddress?.line1 ?? '',
        senderCity: subOrderData?.shippingAddress?.city ?? '',
        senderPhone: subOrderData?.shippingAddress?.phone ?? '',
        receiverName: sellerData.storeName || sellerData.name || 'Satıcı',
        receiverAddress: sellerData.address || sellerData.storeAddress || '',
        receiverCity: sellerData.city || '',
        receiverPhone: sellerData.phone || sellerData.phoneNumber || '',
        packageCount: 1,
        receiverCountry: buyerCountry,
        isReturn: true,
      });

      // Trigger refund engine (can fail — no Firestore side-effects yet; CR-02)
      // T-05-05: subOrderId from doc, never from request body
      const refundResult = await processRefund(db, deps.getIyzico as any, {
        orderSetId: returnData.orderSetId,
        subOrderId: returnData.subOrderId,
        isFullRefund: true,
        reason: returnData.reason,
      });

      const now = new Date().toISOString();

      // Single atomic write — only reached when both label and refund succeeded (CR-02)
      await db
        .collection('returns')
        .doc(returnId)
        .update({
          status: 'refunded',
          approvedBy: req.uid,
          returnTrackingNumber: shipmentResp.trackingNumber,
          returnLabelUrl: shipmentResp.labelUrl ?? '',
          refundId: refundResult.refundId,
          ledgerEntryIds: refundResult.ledgerEntryIds,
          updatedAt: now,
        });

      // Non-blocking email notification
      void (async () => {
        try {
          const { sendRefundNotificationEmail } = await import('../services/emailService.js');
          const orderSetSnap = await db.collection('orderSets').doc(returnData.orderSetId).get();
          const orderSetDoc = orderSetSnap.exists ? orderSetSnap.data() : null;
          if (orderSetDoc?.userEmail) {
            await sendRefundNotificationEmail(
              returnData.orderSetId,
              orderSetDoc.userEmail as string,
              (orderSetDoc.userName as string) ?? '',
              refundResult.refundedAmount,
              refundResult.currency,
            );
          }
        } catch {
          // non-blocking — swallow error
        }
      })();

      return res.json({
        returnId,
        returnTrackingNumber: shipmentResp.trackingNumber,
        status: 'refunded',
      });
    } catch (err: any) {
      return res
        .status(err.statusCode ?? 500)
        .json({ error: err.message || 'Failed to approve return' });
    }
  });

  /**
   * POST /api/returns/:returnId/reject
   * Seller or admin rejects a pending return.
   */
  app.post('/api/returns/:returnId/reject', verifyFirebaseToken, async (req: any, res: any) => {
    const { returnId } = req.params;

    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      const db = adminDb;

      // Load return doc
      const returnSnap = await db.collection('returns').doc(returnId).get();
      if (!returnSnap.exists) {
        return res.status(404).json({ error: 'Return request not found' });
      }
      const returnData = returnSnap.data() as ReturnRequest;

      // Seller/admin ownership guard (T-05-04-02)
      if (returnData.sellerId !== req.uid && !req.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: not the seller of this return' });
      }

      // Pending guard
      if (returnData.status !== 'pending') {
        return res.status(409).json({ error: 'Return is not in pending status' });
      }

      // Validate rejection reason
      const { rejectionReason } = req.body as { rejectionReason?: unknown };
      if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
        return res.status(400).json({ error: 'rejectionReason is required' });
      }

      const now = new Date().toISOString();

      // Update return doc: rejected
      await db.collection('returns').doc(returnId).update({
        status: 'rejected',
        rejectionReason,
        updatedAt: now,
      });

      // Transition SubOrder back: return_requested -> delivered (reject_return)
      const subOrderSnap = await db.collection('subOrders').doc(returnData.subOrderId).get();
      if (subOrderSnap.exists) {
        const subData = subOrderSnap.data() as { status: string; version: number };
        try {
          const transition = transitionOrder(
            subData.status as any,
            'reject_return',
            subData.version,
          );
          await db.collection('subOrders').doc(returnData.subOrderId).update({
            status: transition.status,
            version: transition.version,
            updatedAt: now,
          });
        } catch {
          // Non-fatal if transition fails (subOrder may already be in different state)
        }
      }

      return res.json({ returnId, status: 'rejected' });
    } catch (err: any) {
      return res
        .status(err.statusCode ?? 500)
        .json({ error: err.message || 'Failed to reject return' });
    }
  });
}
