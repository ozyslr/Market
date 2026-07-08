// ─── Email Trigger Config Routes ──────────────────────────────────────────
// Admin-only endpoints to enable/disable specific email notification types.
// Config is stored in Firestore `emailConfig` collection (doc: 'triggers').

import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '../logger.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface EmailRouteDeps {
  adminDb: Firestore | null;
  verifyAdmin: Middleware;
}

const EMAIL_CONFIG_DOC = 'triggers';

const DEFAULT_CONFIG: Record<string, boolean> = {
  orderConfirmation: true,
  shippingUpdate: true,
  deliveryConfirmation: true,
  refundNotification: true,
  sellerNewOrder: true,
  abandonedCart: true,
};

export function registerEmailRoutes(app: Express, deps: EmailRouteDeps): void {
  const { adminDb, verifyAdmin } = deps;

  /**
   * GET /api/email/trigger-config
   * Returns current email trigger configuration (admin only).
   */
  app.get('/api/email/trigger-config', verifyAdmin, async (_req: any, res: any) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      const snap = await adminDb.collection('emailConfig').doc(EMAIL_CONFIG_DOC).get();
      const config = snap.exists ? { ...DEFAULT_CONFIG, ...snap.data() } : { ...DEFAULT_CONFIG };

      return res.json({ config });
    } catch (err: any) {
      logger.error('email', 'Failed to read trigger config', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/email/trigger-config
   * Update email trigger configuration (admin only).
   * Body: { orderConfirmation?: boolean, shippingUpdate?: boolean, ... }
   */
  app.post('/api/email/trigger-config', verifyAdmin, async (req: any, res: any) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      const allowedKeys = Object.keys(DEFAULT_CONFIG);
      const updates: Record<string, boolean> = {};

      for (const key of allowedKeys) {
        if (typeof req.body[key] === 'boolean') {
          updates[key] = req.body[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No valid config keys provided',
          allowedKeys,
        });
      }

      await adminDb.collection('emailConfig').doc(EMAIL_CONFIG_DOC).set(updates, { merge: true });

      logger.info('email', 'Trigger config updated', { updates, by: req.uid });
      return res.json({ success: true, updated: updates });
    } catch (err: any) {
      logger.error('email', 'Failed to update trigger config', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });
}
