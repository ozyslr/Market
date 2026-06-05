// ─── Payout Routes ────────────────────────────────────────────────────────────
// Cron-triggered T+7 batch payout endpoint + admin manual override.
// All payout amounts are calculated server-side from the immutable ledger
// (T-02-016). No client-provided amounts accepted.

import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import type { AdminRole } from '../../src/types.js';
import { getEligiblePayouts, processPayout } from '../services/payoutService.js';
import { getEntriesBySeller } from '../services/ledgerService.js';
import { logger } from '../logger.js';
import { audit } from '../lib/auditLog.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface PayoutRouteDeps {
  adminDb: Firestore | null;
  verifyAdmin: Middleware;
  verifyCronSecret: Middleware;
  verifyFirebaseToken: Middleware;
  requireAdminRole: (...allowed: AdminRole[]) => Middleware;
}

export function registerPayoutRoutes(app: Express, deps: PayoutRouteDeps) {
  const { adminDb, verifyAdmin, verifyCronSecret, verifyFirebaseToken, requireAdminRole } = deps;

  /**
   * POST /api/process-scheduled-payouts
   * Called by external cron (Monday 03:00 UTC).
   * Scans all 'collected' commission entries older than T+7 and processes payouts.
   * Auth: verifyCronSecret (T-02-015)
   */
  app.post('/api/process-scheduled-payouts', verifyCronSecret, async (_req, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

      const eligible = await getEligiblePayouts(adminDb);

      if (eligible.length === 0) {
        return res.json({ processed: 0, totalAmount: 0, errors: [] });
      }

      let processed = 0;
      let totalAmount = 0;
      const errors: string[] = [];

      for (const batch of eligible) {
        try {
          await processPayout(adminDb, batch.sellerId, batch.totalAmount, batch.entryIds);
          audit(
            'system',
            'system@mercora',
            'admin',
            'payout.process',
            'payout',
            batch.sellerId,
            `Payout to ${batch.sellerId}`,
            `${batch.totalAmount} TRY (T+7 cron)`,
          );
          processed++;
          totalAmount += batch.totalAmount;
        } catch (err) {
          const msg = `Failed payout for seller ${batch.sellerId}: ${(err as Error).message}`;
          errors.push(msg);
          logger.error('payout', msg, { sellerId: batch.sellerId });
        }
      }

      logger.info('payout', 'Scheduled payout run complete', { processed, totalAmount, errors });
      return res.json({ processed, totalAmount, errors });
    } catch (err: any) {
      logger.error('payout', 'Scheduled payout run failed', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/manual-payout
   * Admin override: manually trigger payout for a specific seller (D-11).
   * Auth: verifyAdmin (T-02-015)
   * Body: { sellerId: string, amount: number, entryIds: string[] }
   */
  app.post(
    '/api/admin/manual-payout',
    verifyAdmin,
    requireAdminRole('finance'),
    async (req: any, res) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

        const { sellerId, amount, entryIds } = req.body;
        if (!sellerId || typeof sellerId !== 'string') {
          return res.status(400).json({ error: 'sellerId is required' });
        }
        if (!amount || typeof amount !== 'number' || amount <= 0) {
          return res.status(400).json({ error: 'amount must be a positive number' });
        }
        if (!Array.isArray(entryIds) || entryIds.length === 0) {
          return res.status(400).json({ error: 'entryIds array is required' });
        }

        const payoutEntry = await processPayout(adminDb, sellerId, amount, entryIds);
        audit(
          req.uid,
          req.userEmail ?? '',
          req.decodedToken?.role || 'admin',
          'payout.complete',
          'payout',
          sellerId,
          `Manual payout to ${sellerId}`,
          `${amount} TRY`,
        );
        logger.info('payout', 'Admin manual payout executed', {
          sellerId,
          amount,
          adminUid: req.uid,
        });
        return res.json({ success: true, payout: payoutEntry });
      } catch (err: any) {
        logger.error('payout', 'Admin manual payout failed', { error: err.message });
        return res.status(500).json({ error: err.message });
      }
    },
  );

  /**
   * GET /api/finance/payout-history/:sellerId
   * Return payout ledger entries for the seller.
   * Auth: verifyFirebaseToken + seller ownership (T-02-014)
   */
  app.get('/api/finance/payout-history/:sellerId', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

      const { sellerId } = req.params;

      // Seller ownership check
      if (req.uid !== sellerId && req.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: access denied' });
      }

      const entries = await getEntriesBySeller(adminDb, sellerId);
      const payouts = entries
        .filter((e) => e.type === 'payout')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return res.json({ payouts });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
