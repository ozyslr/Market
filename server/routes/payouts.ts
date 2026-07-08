// ─── Payout Routes ────────────────────────────────────────────────────────────
// Cron-triggered T+7 batch payout endpoint + admin manual override.
// All payout amounts are calculated server-side from the immutable ledger
// (T-02-016). No client-provided amounts accepted.
//
// Phase 30 fix: processPayout now creates real Stripe Connect Transfers
// for sellers with a stripeAccountId on their seller doc. Sellers without
// Stripe Connect are marked 'manual_payout_required'. Transfer failures
// are tracked as 'transfer_failed' for operations to resolve.

import crypto from 'crypto';
import type Stripe from 'stripe';
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import type { AdminRole } from '../../src/types.js';
import { getEligiblePayouts, processPayout } from '../services/payoutService.js';
import type { PayoutReconciliation } from '../services/payoutService.js';
import { getEntriesBySeller } from '../services/ledgerService.js';
import { logger } from '../logger.js';
import { audit } from '../lib/auditLog.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface PayoutRouteDeps {
  adminDb: Firestore | null;
  stripe: Stripe;
  verifyAdmin: Middleware;
  verifyCronSecret: Middleware;
  verifyFirebaseToken: Middleware;
  requireAdminRole: (...allowed: AdminRole[]) => Middleware;
}

export function registerPayoutRoutes(app: Express, deps: PayoutRouteDeps) {
  const { adminDb, stripe, verifyAdmin, verifyCronSecret, verifyFirebaseToken, requireAdminRole } =
    deps;

  /**
   * POST /api/process-scheduled-payouts
   * Called by external cron (Monday 03:00 UTC).
   * Scans all 'collected' commission entries older than T+7, marks them 'released',
   * and creates real Stripe Connect Transfers to send money to sellers.
   * Auth: verifyCronSecret (T-02-015)
   */
  app.post('/api/process-scheduled-payouts', verifyCronSecret, async (_req, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

      const eligible = await getEligiblePayouts(adminDb);

      if (eligible.length === 0) {
        return res.json({
          processed: 0,
          totalAmount: 0,
          errors: [],
          reconciliation: null,
        });
      }

      // ── Generate a batch run ID for idempotency ──────────────────────────
      const batchRunId = `payout_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const reconciliation: PayoutReconciliation = {
        batchId: batchRunId,
        processed: 0,
        stripeTransferred: 0,
        manualPayoutRequired: 0,
        transferFailed: 0,
        skippedZeroAmount: 0,
        totalAmountTransferred: 0,
        errors: [],
      };

      for (const batch of eligible) {
        try {
          const result = await processPayout(
            adminDb,
            stripe,
            batch.sellerId,
            batch.totalAmount,
            batch.entryIds,
            batchRunId,
          );

          reconciliation.processed++;

          switch (result.transferResult) {
            case 'stripe_transferred':
              reconciliation.stripeTransferred++;
              reconciliation.totalAmountTransferred += batch.totalAmount;
              break;
            case 'manual_payout_required':
              reconciliation.manualPayoutRequired++;
              break;
            case 'transfer_failed':
              reconciliation.transferFailed++;
              reconciliation.errors.push(
                `Transfer failed for seller ${batch.sellerId}: ${result.error ?? 'unknown error'}`,
              );
              break;
            case 'skipped_zero_amount':
              reconciliation.skippedZeroAmount++;
              break;
          }

          audit(
            'system',
            'system@mercora',
            'admin',
            'payout.process',
            'payout',
            batch.sellerId,
            `Payout to ${batch.sellerId}`,
            `${batch.totalAmount} kurus (T+7 cron) — ${result.transferResult}`,
          );
        } catch (err) {
          const msg = `Unexpected error for seller ${batch.sellerId}: ${(err as Error).message}`;
          reconciliation.errors.push(msg);
          logger.error('payout', msg, { sellerId: batch.sellerId });
        }
      }

      // ── Reconciliation summary log ──────────────────────────────────────
      logger.info('payout', 'Scheduled payout batch complete — reconciliation', {
        batchId: batchRunId,
        processed: reconciliation.processed,
        stripeTransferred: reconciliation.stripeTransferred,
        manualPayoutRequired: reconciliation.manualPayoutRequired,
        transferFailed: reconciliation.transferFailed,
        skippedZeroAmount: reconciliation.skippedZeroAmount,
        totalAmountTransferred: reconciliation.totalAmountTransferred,
        errorCount: reconciliation.errors.length,
      });

      return res.json({
        processed: reconciliation.processed,
        totalAmount: reconciliation.totalAmountTransferred,
        errors: reconciliation.errors,
        reconciliation,
      });
    } catch (err: any) {
      logger.error('payout', 'Scheduled payout run failed', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/manual-payout
   * Admin override: manually trigger payout for a specific seller (D-11).
   * Creates a real Stripe Connect Transfer if the seller has stripeAccountId.
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

        const manualBatchId = `manual_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const result = await processPayout(
          adminDb,
          stripe,
          sellerId,
          amount,
          entryIds,
          manualBatchId,
        );

        audit(
          req.uid,
          req.userEmail ?? '',
          req.decodedToken?.role || 'admin',
          'payout.complete',
          'payout',
          sellerId,
          `Manual payout to ${sellerId}`,
          `${amount} kurus — ${result.transferResult}${result.transferId ? ` (transfer: ${result.transferId})` : ''}`,
        );
        logger.info('payout', 'Admin manual payout executed', {
          sellerId,
          amount,
          transferResult: result.transferResult,
          transferId: result.transferId ?? null,
          adminUid: req.uid,
        });
        return res.json({
          success: true,
          payout: result.payoutEntry,
          transferResult: result.transferResult,
          transferId: result.transferId ?? null,
        });
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
