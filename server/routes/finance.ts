// ─── Finance Routes ───────────────────────────────────────────────────────────
// Seller-facing finance data API (server-only — no client Firestore reads, T-02-014).
// All financial queries go through the immutable ledger via payoutService.

import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getSellerBalance } from '../services/payoutService.js';
import { getEntriesBySeller } from '../services/ledgerService.js';
import type { LedgerEntry } from '../services/ledgerService.js';
import { logger } from '../logger.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface FinanceRouteDeps {
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
}

// ─── Query param schemas ──────────────────────────────────────────────────────

const transactionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  type: z.enum(['order_charge', 'commission', 'payout', 'refund', 'adjustment']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// ─── CSV helpers ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  order_charge: 'Satis',
  commission: 'Komisyon',
  payout: 'Odeme',
  refund: 'Iade',
  adjustment: 'Duzeltme',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  collected: 'Tahsil Edildi',
  released: 'Serbest Birakildi',
  reversed: 'Iptal',
};

function formatAmount(amount: number): string {
  return (amount / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function entriesToCsv(entries: LedgerEntry[]): string {
  const header = 'Tarih,Islem Tipi,Tutar (TL),Aciklama,Referans,Durum';
  const rows = entries.map((e) => {
    const date = new Date(e.createdAt).toLocaleDateString('tr-TR');
    const type = TYPE_LABELS[e.type] || e.type;
    const amount = formatAmount(e.amount);
    const reason = `"${e.reason.replace(/"/g, '""')}"`;
    const ref = e.reference || '';
    const status = (e.status ? STATUS_LABELS[e.status] : undefined) || e.status || 'pending';
    return `${date},${type},${amount},${reason},${ref},${status}`;
  });
  return [header, ...rows].join('\n');
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerFinanceRoutes(app: Express, deps: FinanceRouteDeps) {
  const { adminDb, verifyFirebaseToken } = deps;

  // Seller ownership guard helper
  function ownerOrAdmin(req: any, sellerId: string): boolean {
    return req.uid === sellerId || req.role === 'admin';
  }

  /**
   * GET /api/finance/seller/:sellerId/summary
   * Returns { availableBalance, pendingBalance, totalEarned }
   * Auth: verifyFirebaseToken + seller ownership (T-02-014)
   */
  app.get('/api/finance/seller/:sellerId/summary', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
      const { sellerId } = req.params;
      if (!ownerOrAdmin(req, sellerId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const balance = await getSellerBalance(adminDb, sellerId);
      return res.json({
        availableBalance: balance.available,
        pendingBalance: balance.pending,
        totalEarned: balance.totalEarned,
      });
    } catch (err: any) {
      logger.error('finance', 'Failed to get seller summary', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/finance/seller/:sellerId/transactions
   * Paginated ledger entries sorted by createdAt desc. Filterable by type + date range.
   * Auth: verifyFirebaseToken + seller ownership (T-02-014)
   */
  app.get(
    '/api/finance/seller/:sellerId/transactions',
    verifyFirebaseToken,
    async (req: any, res) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
        const { sellerId } = req.params;
        if (!ownerOrAdmin(req, sellerId)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const parsed = transactionQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          return res.status(400).json({ error: parsed.error.flatten() });
        }
        const { limit, offset, type, from, to } = parsed.data;

        let entries = await getEntriesBySeller(adminDb, sellerId);

        // Apply filters
        if (type) entries = entries.filter((e) => e.type === type);
        if (from) entries = entries.filter((e) => e.createdAt >= from);
        if (to) entries = entries.filter((e) => e.createdAt <= to);

        // Sort desc
        entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        const total = entries.length;
        const page = entries.slice(offset, offset + limit);

        return res.json({ transactions: page, total, limit, offset });
      } catch (err: any) {
        logger.error('finance', 'Failed to get seller transactions', { error: err.message });
        return res.status(500).json({ error: err.message });
      }
    },
  );

  /**
   * GET /api/finance/seller/:sellerId/payouts
   * Return payout ledger entries for the seller.
   * Auth: verifyFirebaseToken + seller ownership (T-02-014)
   */
  app.get('/api/finance/seller/:sellerId/payouts', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
      const { sellerId } = req.params;
      if (!ownerOrAdmin(req, sellerId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const entries = await getEntriesBySeller(adminDb, sellerId);
      const payouts = entries
        .filter((e) => e.type === 'payout')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return res.json({ payouts });
    } catch (err: any) {
      logger.error('finance', 'Failed to get seller payouts', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/finance/seller/:sellerId/export
   * CSV-formatted transaction data with Turkish locale.
   * Auth: verifyFirebaseToken + seller ownership (T-02-014)
   */
  app.get('/api/finance/seller/:sellerId/export', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
      const { sellerId } = req.params;
      if (!ownerOrAdmin(req, sellerId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const entries = await getEntriesBySeller(adminDb, sellerId);
      entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const csv = entriesToCsv(entries);
      const filename = `islemler-${sellerId}-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // BOM for Turkish Excel compatibility
      return res.send('﻿' + csv);
    } catch (err: any) {
      logger.error('finance', 'Failed to export seller transactions', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/finance/seller/:sellerId/commission-breakdown/:orderSetId
   * Commission breakdown for a specific order.
   * Auth: verifyFirebaseToken + seller ownership (T-02-014)
   */
  app.get(
    '/api/finance/seller/:sellerId/commission-breakdown/:orderSetId',
    verifyFirebaseToken,
    async (req: any, res) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
        const { sellerId, orderSetId } = req.params;
        if (!ownerOrAdmin(req, sellerId)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const snap = await adminDb
          .collection('ledger')
          .where('orderSetId', '==', orderSetId)
          .where('sellerId', '==', sellerId)
          .get();

        const entries = snap.docs.map((d: any) => d.data() as LedgerEntry);
        const chargeEntry = entries.find((e) => e.type === 'order_charge');
        const commissionEntry = entries.find((e) => e.type === 'commission');

        if (!chargeEntry) {
          return res.status(404).json({ error: 'Order charge entry not found' });
        }

        const subtotal = chargeEntry.amount;
        const commissionAmount = commissionEntry ? Math.abs(commissionEntry.amount) : 0;
        const rate = subtotal > 0 ? commissionAmount / subtotal : 0;
        const netToSeller = subtotal - commissionAmount;

        return res.json({
          orderSetId,
          subtotal,
          commissionAmount,
          rate: parseFloat((rate * 100).toFixed(2)),
          netToSeller,
          currency: chargeEntry.currency,
        });
      } catch (err: any) {
        logger.error('finance', 'Failed to get commission breakdown', { error: err.message });
        return res.status(500).json({ error: err.message });
      }
    },
  );
}
