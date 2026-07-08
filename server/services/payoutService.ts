// ─── Payout Service ───────────────────────────────────────────────────────────
// Handles T+7 payout eligibility, delivery approval (iyzico escrow release),
// and seller balance aggregation from the immutable ledger.

import type { Firestore } from 'firebase-admin/firestore';
import { getEntriesBySeller, updateEntryStatus, recordEntry } from './ledgerService.js';
import type { LedgerEntry } from './ledgerService.js';
import { logger } from '../logger.js';

const T7_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EligiblePayout {
  sellerId: string;
  totalAmount: number; // absolute value (kurus)
  entryIds: string[];
}

export interface SellerBalance {
  available: number; // sum of 'released' payout entries (absolute)
  pending: number; // sum of 'collected' commission amounts (absolute)
  totalEarned: number; // released + collected
}

// ─── T+7 Eligibility ─────────────────────────────────────────────────────────

/**
 * Query all ledger entries where type='commission' AND status='collected'
 * AND createdAt < (now - 7 days). Group by sellerId and return payout batches.
 */
export async function getEligiblePayouts(adminDb: Firestore): Promise<EligiblePayout[]> {
  const cutoff = new Date(Date.now() - T7_DAYS_MS).toISOString();

  const snap = await adminDb
    .collection('ledger')
    .where('type', '==', 'commission')
    .where('status', '==', 'collected')
    .get();

  if (snap.empty) return [];

  // Filter client-side for createdAt < cutoff (Firestore composite index not guaranteed)
  const eligibleDocs = snap.docs.filter((d) => {
    const entry = d.data() as LedgerEntry;
    return entry.createdAt < cutoff;
  });

  if (eligibleDocs.length === 0) return [];

  // Group by sellerId
  const bySellerMap = new Map<string, { totalAmount: number; entryIds: string[] }>();

  for (const doc of eligibleDocs) {
    const entry = doc.data() as LedgerEntry;
    const abs = Math.abs(entry.amount);
    const existing = bySellerMap.get(entry.sellerId);
    if (existing) {
      existing.totalAmount += abs;
      existing.entryIds.push(entry.entryId);
    } else {
      bySellerMap.set(entry.sellerId, { totalAmount: abs, entryIds: [entry.entryId] });
    }
  }

  return Array.from(bySellerMap.entries()).map(([sellerId, data]) => ({
    sellerId,
    ...data,
  }));
}

// ─── Process Payout (T+7 batch) ───────────────────────────────────────────────

/**
 * Atomically: mark all eligible commission entries as 'released',
 * record a new 'payout' ledger entry for the seller, return the payout entry.
 */
export async function processPayout(
  adminDb: Firestore,
  sellerId: string,
  amount: number,
  entryIds: string[],
): Promise<LedgerEntry> {
  // Update all eligible entries to 'released'
  await Promise.all(entryIds.map((id) => updateEntryStatus(adminDb, id, 'released')));

  // Record the payout entry
  const payoutEntry = await recordEntry(adminDb, {
    orderSetId: '',
    subOrderId: '',
    sellerId,
    type: 'payout',
    amount: -amount, // negative: money leaving the platform to the seller
    currency: 'TRY',
    status: 'released',
    reference: '',
    reason: `T+7 payout — ${entryIds.length} commission(s) released`,
    createdBy: 'system',
  });

  logger.info('payout', `Processed payout for seller ${sellerId}`, {
    sellerId,
    amount,
    entryCount: entryIds.length,
  });

  return payoutEntry;
}

// ─── Delivery Hook (iyzico approval + ledger collection) ─────────────────────

/**
 * Called when a SubOrder transitions to 'delivered'.
 * 1. Calls iyzico approval.create to release escrow.
 * 2. Updates commission ledger entry to 'collected'.
 * 3. Records a pending payout entry for the seller.
 */
export async function processDelivery(
  adminDb: Firestore,
  orderSetId: string,
  subOrderId: string,
  paymentTransactionId: string | null,
  getIyzico: (() => Promise<any>) | null,
): Promise<void> {
  // Step 1: iyzico approval (escrow release) — non-blocking
  if (paymentTransactionId && getIyzico) {
    try {
      const iyzico = await getIyzico();
      if (iyzico && iyzico.approvalCreate && iyzico.client) {
        await iyzico.approvalCreate(iyzico.client, { paymentTransactionId });
        logger.info('payout', 'iyzico approval created', { paymentTransactionId });
      }
    } catch (err) {
      // Non-blocking: log warning but proceed with ledger update
      logger.warn('payout', 'iyzico approval failed — continuing with ledger update', {
        paymentTransactionId,
        error: (err as Error).message,
      });
    }
  }

  // Step 2: Mark commission entry as 'collected'
  await markCommissionCollected(adminDb, orderSetId, subOrderId);

  // Step 3: Look up seller from the subOrder's commission entry to record pending payout
  try {
    const commissionEntries = await adminDb
      .collection('ledger')
      .where('orderSetId', '==', orderSetId)
      .where('subOrderId', '==', subOrderId)
      .where('type', '==', 'commission')
      .get();

    if (!commissionEntries.empty) {
      const entry = commissionEntries.docs[0].data() as LedgerEntry;
      // Also look up the order_charge to compute seller net
      const chargeEntries = await adminDb
        .collection('ledger')
        .where('orderSetId', '==', orderSetId)
        .where('subOrderId', '==', subOrderId)
        .where('type', '==', 'order_charge')
        .get();

      let sellerNet = 0;
      if (!chargeEntries.empty) {
        const chargeEntry = chargeEntries.docs[0].data() as LedgerEntry;
        sellerNet = chargeEntry.amount + Math.abs(entry.amount); // charge minus commission
      }

      if (sellerNet > 0 && entry.sellerId) {
        await recordEntry(adminDb, {
          orderSetId,
          subOrderId,
          sellerId: entry.sellerId,
          type: 'payout',
          amount: sellerNet,
          currency: entry.currency,
          status: 'pending',
          reference: paymentTransactionId || '',
          reason: 'Awaiting T+7 release',
          createdBy: 'system',
        });
      }
    }
  } catch (err) {
    logger.warn('payout', 'Failed to record pending payout entry', {
      orderSetId,
      subOrderId,
      error: (err as Error).message,
    });
  }
}

// ─── Mark Commission Collected ────────────────────────────────────────────────

/**
 * Update the commission ledger entry for a given order/subOrder to 'collected'.
 */
export async function markCommissionCollected(
  adminDb: Firestore,
  orderSetId: string,
  subOrderId: string,
): Promise<void> {
  const snap = await adminDb
    .collection('ledger')
    .where('orderSetId', '==', orderSetId)
    .where('subOrderId', '==', subOrderId)
    .where('type', '==', 'commission')
    .get();

  if (snap.empty) {
    logger.warn('payout', 'No commission entry found to mark collected', {
      orderSetId,
      subOrderId,
    });
    return;
  }

  await Promise.all(snap.docs.map((doc) => updateEntryStatus(adminDb, doc.id, 'collected')));
}

// ─── Seller Balance Aggregation ───────────────────────────────────────────────

/**
 * Aggregate seller balance from ledger entries.
 * - available: sum of 'released' payout amounts (absolute)
 * - pending: sum of 'collected' commission amounts (absolute)
 * - totalEarned: released + collected
 */
export async function getSellerBalance(
  adminDb: Firestore,
  sellerId: string,
): Promise<SellerBalance> {
  const entries = await getEntriesBySeller(adminDb, sellerId);

  let available = 0;
  let pending = 0;

  for (const entry of entries) {
    if (entry.type === 'payout' && entry.status === 'released') {
      // Released payouts represent money sent out — track absolute
      available += Math.abs(entry.amount);
    } else if (entry.type === 'commission' && entry.status === 'collected') {
      // Collected commissions = earnings awaiting T+7 release
      pending += Math.abs(entry.amount);
    }
  }

  const totalEarned = available + pending;

  return { available, pending, totalEarned };
}
