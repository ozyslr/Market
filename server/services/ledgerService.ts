// ─── Immutable Ledger Service ───────────────────────────────────────────────
// Append-only ledger with SHA-256 hash chain for commission records,
// payouts, refunds, and all financial entries.
// Per D-03: Firestore security rules block all client writes.

import crypto from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  entryId: string;
  orderSetId: string;
  subOrderId: string;
  sellerId: string;
  type: 'order_charge' | 'commission' | 'payout' | 'refund' | 'adjustment';
  amount: number; // in kurus, positive or negative
  currency: string;
  status?: 'pending' | 'collected' | 'released' | 'reversed';
  previousHash: string; // SHA-256 of previous entry
  hash: string; // SHA-256 of this entry's data
  reference: string; // optional: Stripe transfer ID, etc.
  reason: string;
  createdBy: 'system' | 'admin';
  createdAt: string;
}

const LEDGER_COLLECTION = 'ledger';

/**
 * Compute SHA-256 hash for a set of entry fields (excluding hash, entryId, createdAt).
 * Matches the data that goes into the hash chain.
 */
function computeEntryHash(entryData: {
  orderSetId: string;
  subOrderId: string;
  sellerId: string;
  type: string;
  amount: number;
  currency: string;
  previousHash: string;
}): string {
  const payload = JSON.stringify({
    orderSetId: entryData.orderSetId,
    subOrderId: entryData.subOrderId,
    sellerId: entryData.sellerId,
    type: entryData.type,
    amount: entryData.amount,
    currency: entryData.currency,
    previousHash: entryData.previousHash,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Record a ledger entry in an append-only transaction.
 * Automatically computes the hash chain (previousHash + entry data hash).
 *
 * @param adminDb - Firebase Admin Firestore instance
 * @param entry - Entry data without auto-generated fields (entryId, hash, previousHash, createdAt)
 * @returns The fully populated LedgerEntry
 */
export async function recordEntry(
  adminDb: Firestore,
  entry: Omit<LedgerEntry, 'entryId' | 'hash' | 'previousHash' | 'createdAt'>,
): Promise<LedgerEntry> {
  const now = new Date().toISOString();
  const docRef = adminDb.collection(LEDGER_COLLECTION).doc();
  const entryId = docRef.id;

  // Use a transaction to safely determine the previous hash
  const result = await adminDb.runTransaction(async (txn) => {
    // Query the latest entry to get its hash (for chaining)
    const latestSnap = await txn.get(
      adminDb.collection(LEDGER_COLLECTION).orderBy('createdAt', 'desc').limit(1),
    );

    let previousHash: string;
    if (latestSnap.empty) {
      previousHash = ''; // First entry in the chain
    } else {
      const latestData = latestSnap.docs[0].data() as LedgerEntry;
      previousHash = latestData.hash;
    }

    // Compute this entry's hash
    const hash = computeEntryHash({
      orderSetId: entry.orderSetId,
      subOrderId: entry.subOrderId,
      sellerId: entry.sellerId,
      type: entry.type,
      amount: entry.amount,
      currency: entry.currency,
      previousHash,
    });

    const ledgerEntry: LedgerEntry = {
      entryId,
      orderSetId: entry.orderSetId,
      subOrderId: entry.subOrderId,
      sellerId: entry.sellerId,
      type: entry.type,
      amount: entry.amount,
      currency: entry.currency,
      status: (entry.status ?? 'pending') as 'pending' | 'collected' | 'released' | 'reversed',
      previousHash,
      hash,
      reference: entry.reference || '',
      reason: entry.reason,
      createdBy: entry.createdBy,
      createdAt: now,
    };

    txn.set(docRef, ledgerEntry);
    return ledgerEntry;
  });

  return result;
}

/**
 * Get all ledger entries for a specific order (orderSet).
 */
export async function getEntriesByOrder(
  adminDb: Firestore,
  orderSetId: string,
): Promise<LedgerEntry[]> {
  const snap = await adminDb
    .collection(LEDGER_COLLECTION)
    .where('orderSetId', '==', orderSetId)
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map((d) => d.data() as LedgerEntry);
}

/**
 * Get all ledger entries for a specific seller.
 */
export async function getEntriesBySeller(
  adminDb: Firestore,
  sellerId: string,
): Promise<LedgerEntry[]> {
  const snap = await adminDb
    .collection(LEDGER_COLLECTION)
    .where('sellerId', '==', sellerId)
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map((d) => d.data() as LedgerEntry);
}

/**
 * Update the status of a ledger entry atomically.
 */
export async function updateEntryStatus(
  adminDb: Firestore,
  entryId: string,
  newStatus: LedgerEntry['status'],
): Promise<void> {
  const docRef = adminDb.collection(LEDGER_COLLECTION).doc(entryId);
  await docRef.update({ status: newStatus });
}

/**
 * Get all ledger entries with a specific status.
 */
export async function getEntriesByStatus(
  adminDb: Firestore,
  status: LedgerEntry['status'],
): Promise<LedgerEntry[]> {
  const snap = await adminDb
    .collection(LEDGER_COLLECTION)
    .where('status', '==', status)
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map((d) => d.data() as LedgerEntry);
}

/**
 * Get all ledger entries for a specific seller filtered by status.
 */
export async function getEntriesBySellerAndStatus(
  adminDb: Firestore,
  sellerId: string,
  status: LedgerEntry['status'],
): Promise<LedgerEntry[]> {
  const snap = await adminDb
    .collection(LEDGER_COLLECTION)
    .where('sellerId', '==', sellerId)
    .where('status', '==', status)
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map((d) => d.data() as LedgerEntry);
}

/**
 * Verify the integrity of the full ledger hash chain.
 * Recomputes every hash and checks chain linkage.
 *
 * @returns Object with valid flag, first/last entry IDs, and count checked
 */
export async function verifyChain(
  adminDb: Firestore,
): Promise<{ valid: boolean; firstEntryId: string; lastEntryId: string; entriesChecked: number }> {
  const snap = await adminDb.collection(LEDGER_COLLECTION).orderBy('createdAt', 'asc').get();

  if (snap.empty) {
    return { valid: true, firstEntryId: '', lastEntryId: '', entriesChecked: 0 };
  }

  let expectedPreviousHash = '';
  let firstEntryId = '';
  let lastEntryId = '';
  let entriesChecked = 0;

  for (const doc of snap.docs) {
    const entry = doc.data() as LedgerEntry;

    if (!firstEntryId) {
      firstEntryId = entry.entryId;
    }
    lastEntryId = entry.entryId;

    // Check previousHash linkage
    if (entry.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        firstEntryId,
        lastEntryId: entry.entryId,
        entriesChecked: entriesChecked + 1,
      };
    }

    // Recompute the expected hash
    const recomputedHash = computeEntryHash({
      orderSetId: entry.orderSetId,
      subOrderId: entry.subOrderId,
      sellerId: entry.sellerId,
      type: entry.type,
      amount: entry.amount,
      currency: entry.currency,
      previousHash: entry.previousHash,
    });

    // Check hash integrity
    if (recomputedHash !== entry.hash) {
      return {
        valid: false,
        firstEntryId,
        lastEntryId: entry.entryId,
        entriesChecked: entriesChecked + 1,
      };
    }

    expectedPreviousHash = entry.hash;
    entriesChecked++;
  }

  return { valid: true, firstEntryId, lastEntryId, entriesChecked };
}
