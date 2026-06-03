// ─── Admin Refund Routes ──────────────────────────────────────────────────────
// POST /api/admin/refund       — full or partial iyzico refund + ledger reversal
// POST /api/admin/cancel-order — pre-shipment order cancellation

import type { Express, RequestHandler } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { processRefund, cancelOrder } from '../services/refundService.js';
import { adminRefundSchema, cancelOrderSchema } from '../lib/schemas.js';

// ─── Dependencies ─────────────────────────────────────────────────────────────

interface RefundRouteDeps {
  adminDb: Firestore | null;
  getIyzico: () => Promise<any>;
  verifyAdmin: RequestHandler;
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerRefundRoutes(app: Express, deps: RefundRouteDeps): void {
  const { adminDb, getIyzico, verifyAdmin } = deps;

  // ── POST /api/admin/refund ───────────────────────────────────────────────
  app.post('/api/admin/refund', verifyAdmin, async (req, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });
      const db = adminDb;
      const parsed = adminRefundSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      }

      const { orderSetId, subOrderId, paymentTransactionId, isFullRefund, reason } = parsed.data;

      if (!subOrderId) {
        return res.status(400).json({ error: 'subOrderId is required' });
      }

      const result = await processRefund(db, getIyzico, {
        orderSetId,
        subOrderId,
        paymentTransactionId,
        isFullRefund,
        reason,
      });

      // Non-blocking email notification (fire and forget)
      // Customer details must be fetched separately; skip if unavailable.
      try {
        const { sendRefundNotificationEmail } = await import('../services/emailService.js');
        if (typeof sendRefundNotificationEmail === 'function') {
          // Fetch customer email from OrderSet for notification
          const orderSetSnap = await db.collection('orderSets').doc(orderSetId).get();
          const orderSetDoc = orderSetSnap.exists ? orderSetSnap.data() : null;
          if (orderSetDoc?.customerEmail) {
            sendRefundNotificationEmail(
              orderSetId,
              orderSetDoc.customerEmail as string,
              (orderSetDoc.customerName as string) ?? '',
              0, // amount unknown at this point without full order read
              'TRY',
            ).catch(() => {});
          }
        }
      } catch {
        // emailService non-blocking — ignore failures
      }

      return res.status(200).json({
        status: result.status,
        refundId: result.refundId,
        ledgerEntryIds: result.ledgerEntryIds,
      });
    } catch (err: any) {
      // iyzico provider failure → 502
      if (err?.message?.includes('iyzico')) {
        return res.status(502).json({
          error: 'iyzico refund failed',
          providerError: err.message,
        });
      }
      return res.status(500).json({ error: err.message ?? 'Refund processing failed' });
    }
  });

  // ── POST /api/admin/cancel-order ─────────────────────────────────────────
  app.post('/api/admin/cancel-order', verifyAdmin, async (req, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });
      const db = adminDb;
      const parsed = cancelOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      }

      const result = await cancelOrder(db, getIyzico, parsed.data);

      return res.status(200).json(result);
    } catch (err: any) {
      if (err?.message?.includes('iyzico')) {
        return res.status(502).json({
          error: 'iyzico cancel failed',
          providerError: err.message,
        });
      }
      return res.status(500).json({ error: err.message ?? 'Order cancellation failed' });
    }
  });
}
