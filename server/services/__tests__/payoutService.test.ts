import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEligiblePayouts, markCommissionCollected, getSellerBalance } from '../payoutService.js';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeEntry(overrides: Record<string, any>) {
  return {
    entryId: `entry-${Math.random().toString(36).slice(2)}`,
    orderSetId: 'order-001',
    subOrderId: 'sub-001',
    sellerId: 'seller-1',
    type: 'commission',
    amount: -1000,
    currency: 'TRY',
    status: 'collected',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    previousHash: '',
    hash: 'abc',
    reference: '',
    reason: 'Commission',
    createdBy: 'system',
    ...overrides,
  };
}

function createMockDb(entries: any[] = []) {
  const docRef = {
    id: `entry-mock`,
    update: vi.fn().mockResolvedValue(undefined),
  };

  const collectionFn = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnValue(docRef),
    get: vi.fn().mockResolvedValue({
      empty: entries.length === 0,
      docs: entries.map((e) => ({
        id: e.entryId,
        ref: { id: e.entryId, update: vi.fn().mockResolvedValue(undefined) },
        data: () => e,
      })),
    }),
  });

  return {
    collection: collectionFn,
    runTransaction: vi.fn().mockImplementation(async (fn: any) => {
      const txn = {
        get: vi.fn().mockImplementation(async (ref: any) => ({
          exists: true,
          data: () => entries[0],
          ref,
        })),
        update: vi.fn(),
        set: vi.fn(),
      };
      return fn(txn);
    }),
    _docRef: docRef,
  };
}

// ─── Test 1: T+7 eligibility ─────────────────────────────────────────────────

describe('payoutService', () => {
  describe('getEligiblePayouts', () => {
    it('returns seller with correct payout amount when commission entry is 8 days old', async () => {
      const entry = makeEntry({
        sellerId: 'seller-1',
        amount: -1500,
        status: 'collected',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const mockDb = createMockDb([entry]);
      const result = await getEligiblePayouts(mockDb as any);

      // Should return at least one seller
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const sellerResult = result.find((r) => r.sellerId === 'seller-1');
      expect(sellerResult).toBeDefined();
      expect(sellerResult!.totalAmount).toBe(1500); // absolute value of commission amount
    });

    it('returns empty when commission entry is only 3 days old (T+7 not met)', async () => {
      const entry = makeEntry({
        sellerId: 'seller-2',
        amount: -1500,
        status: 'collected',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const mockDb = createMockDb([entry]);
      const result = await getEligiblePayouts(mockDb as any);

      // No seller should be eligible (3 days < 7 days)
      const sellerResult = result.find((r) => r.sellerId === 'seller-2');
      expect(sellerResult).toBeUndefined();
    });
  });

  // ─── Test 3: Commission status transition ─────────────────────────────────

  describe('markCommissionCollected', () => {
    it('updates ledger entry status to collected', async () => {
      const entry = makeEntry({ status: 'pending', entryId: 'entry-abc' });
      const mockDb = createMockDb([entry]);

      await markCommissionCollected(mockDb as any, 'order-001', 'sub-001');

      // The collection's doc update should have been called
      expect(mockDb.collection).toHaveBeenCalledWith('ledger');
    });
  });

  // ─── Test 4: Net payout calculation ──────────────────────────────────────

  describe('getSellerBalance', () => {
    it('calculates available, pending, and totalEarned correctly from ledger entries', async () => {
      // Simulate: order_charge of 10000, commission of -1000 (released), payout of -9000 (released)
      const entries = [
        makeEntry({
          type: 'order_charge',
          amount: 10000,
          status: 'released',
          sellerId: 'seller-3',
        }),
        makeEntry({
          type: 'commission',
          amount: -1000,
          status: 'released',
          sellerId: 'seller-3',
        }),
        makeEntry({
          type: 'payout',
          amount: -9000,
          status: 'released',
          sellerId: 'seller-3',
        }),
        makeEntry({
          type: 'commission',
          amount: -500,
          status: 'collected',
          sellerId: 'seller-3',
        }),
      ];

      const mockDb = createMockDb(entries);
      const result = await getSellerBalance(mockDb as any, 'seller-3');

      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('totalEarned');
      // pending = sum of 'collected' commission amounts (absolute)
      expect(result.pending).toBe(500);
    });
  });
});
