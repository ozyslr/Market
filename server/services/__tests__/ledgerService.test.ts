import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordEntry, verifyChain } from '../ledgerService.js';

// ─── Mock adminDb ───────────────────────────────────────────────────────────

function createMockDb(docs: any[] = []) {
  // Doc reference for recordEntry's doc() call (outside transaction)
  const docRef = {
    id: `ledger-${Math.random().toString(36).slice(2, 8)}`,
    set: vi.fn(),
  };

  const collectionRef = {
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      empty: docs.length === 0,
      docs: docs.map((d) => ({
        data: () => d,
      })),
    }),
    doc: vi.fn().mockReturnValue(docRef),
  };

  return {
    runTransaction: vi
      .fn()
      .mockImplementation(
        async (
          fn: (txn: {
            get: (ref: any) => Promise<any>;
            set: (ref: any, data: any) => void;
          }) => Promise<any>,
        ) => {
          const txn = {
            get: async (ref: any) => ref.get(),
            set: vi.fn(),
          };
          return fn(txn);
        },
      ),
    collection: vi.fn().mockReturnValue(collectionRef),
    _docRef: docRef,
  };
}

describe('ledgerService', () => {
  describe('recordEntry', () => {
    it('creates entry with valid SHA-256 hash', async () => {
      const mockDb = createMockDb([]); // empty ledger
      const entry = {
        orderSetId: 'order-001',
        subOrderId: 'sub-001',
        sellerId: 'seller-1',
        type: 'order_charge' as const,
        amount: 10000,
        currency: 'TRY',
        reference: '',
        reason: 'Order charge',
        createdBy: 'system' as const,
      };

      const result = await recordEntry(mockDb as any, entry);

      expect(result.entryId).toBeTruthy();
      expect(result.hash).toBeTruthy();
      expect(typeof result.hash).toBe('string');
      expect(result.hash.length).toBe(64); // SHA-256 hex length
      expect(result.previousHash).toBe(''); // First entry
      expect(result.createdAt).toBeTruthy();
    });

    it('chains entries (second entry previousHash equals first entry hash)', async () => {
      const firstEntry = {
        entryId: 'entry-1',
        orderSetId: 'order-001',
        subOrderId: 'sub-001',
        sellerId: 'seller-1',
        type: 'order_charge',
        amount: 10000,
        currency: 'TRY',
        previousHash: '',
        hash: 'abc123hash',
        reference: '',
        reason: 'First charge',
        createdBy: 'system',
        createdAt: '2026-01-01T00:00:00Z',
      };

      const mockDb = createMockDb([firstEntry]);

      const entry = {
        orderSetId: 'order-001',
        subOrderId: 'sub-001',
        sellerId: 'seller-1',
        type: 'commission' as const,
        amount: -5000,
        currency: 'TRY',
        reference: '',
        reason: 'Commission deduction',
        createdBy: 'system' as const,
      };

      const result = await recordEntry(mockDb as any, entry);

      // previousHash should match first entry's hash
      expect(result.previousHash).toBe(firstEntry.hash);
      expect(result.previousHash).toBe('abc123hash');
      expect(result.hash).toBeTruthy();
      expect(result.hash.length).toBe(64);
    });
  });

  describe('verifyChain', () => {
    it('returns valid=true for uncorrupted chain', async () => {
      // Build a chain with known hashes
      const crypto = await import('crypto');

      function computeHash(data: {
        orderSetId: string;
        subOrderId: string;
        sellerId: string;
        type: string;
        amount: number;
        currency: string;
        previousHash: string;
      }): string {
        const payload = JSON.stringify({
          orderSetId: data.orderSetId,
          subOrderId: data.subOrderId,
          sellerId: data.sellerId,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          previousHash: data.previousHash,
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
      }

      const hash1 = computeHash({
        orderSetId: 'order-001',
        subOrderId: 'sub-001',
        sellerId: 'seller-1',
        type: 'order_charge',
        amount: 10000,
        currency: 'TRY',
        previousHash: '',
      });

      const hash2 = computeHash({
        orderSetId: 'order-001',
        subOrderId: 'sub-001',
        sellerId: 'seller-1',
        type: 'commission',
        amount: -5000,
        currency: 'TRY',
        previousHash: hash1,
      });

      const entries = [
        {
          entryId: 'entry-1',
          orderSetId: 'order-001',
          subOrderId: 'sub-001',
          sellerId: 'seller-1',
          type: 'order_charge',
          amount: 10000,
          currency: 'TRY',
          previousHash: '',
          hash: hash1,
          reference: '',
          reason: 'Order charge',
          createdBy: 'system',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          entryId: 'entry-2',
          orderSetId: 'order-001',
          subOrderId: 'sub-001',
          sellerId: 'seller-1',
          type: 'commission',
          amount: -5000,
          currency: 'TRY',
          previousHash: hash1,
          hash: hash2,
          reference: '',
          reason: 'Commission',
          createdBy: 'system',
          createdAt: '2026-01-01T00:00:01Z',
        },
      ];

      const mockDb = createMockDb(entries);
      const result = await verifyChain(mockDb as any);

      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBe(2);
      expect(result.firstEntryId).toBe('entry-1');
      expect(result.lastEntryId).toBe('entry-2');
    });

    it('returns valid=false if hash is tampered (amount modified)', async () => {
      const crypto = await import('crypto');

      function computeHash(data: {
        orderSetId: string;
        subOrderId: string;
        sellerId: string;
        type: string;
        amount: number;
        currency: string;
        previousHash: string;
      }): string {
        const payload = JSON.stringify({
          orderSetId: data.orderSetId,
          subOrderId: data.subOrderId,
          sellerId: data.sellerId,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          previousHash: data.previousHash,
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
      }

      const hash1 = computeHash({
        orderSetId: 'order-001',
        subOrderId: 'sub-001',
        sellerId: 'seller-1',
        type: 'order_charge',
        amount: 10000,
        currency: 'TRY',
        previousHash: '',
      });

      // Deliberately tampered: amount doesn't match hash
      const entries = [
        {
          entryId: 'entry-1',
          orderSetId: 'order-001',
          subOrderId: 'sub-001',
          sellerId: 'seller-1',
          type: 'order_charge',
          amount: 10000,
          currency: 'TRY',
          previousHash: '',
          hash: hash1,
          reference: '',
          reason: 'Order charge',
          createdBy: 'system',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          entryId: 'entry-2',
          orderSetId: 'order-001',
          subOrderId: 'sub-001',
          sellerId: 'seller-1',
          type: 'commission',
          amount: 99999, // TAMPERED — different from what was hashed
          currency: 'TRY',
          previousHash: hash1,
          hash: computeHash({
            // hash computed with original amount
            orderSetId: 'order-001',
            subOrderId: 'sub-001',
            sellerId: 'seller-1',
            type: 'commission',
            amount: -5000, // original amount
            currency: 'TRY',
            previousHash: hash1,
          }),
          reference: '',
          reason: 'Commission',
          createdBy: 'system',
          createdAt: '2026-01-01T00:00:01Z',
        },
      ];

      const mockDb = createMockDb(entries);
      const result = await verifyChain(mockDb as any);

      expect(result.valid).toBe(false);
      expect(result.entriesChecked).toBe(2);
    });

    it('returns valid=false when previousHash chain is broken', async () => {
      const crypto = await import('crypto');

      function computeHash(data: {
        orderSetId: string;
        subOrderId: string;
        sellerId: string;
        type: string;
        amount: number;
        currency: string;
        previousHash: string;
      }): string {
        const payload = JSON.stringify({
          orderSetId: data.orderSetId,
          subOrderId: data.subOrderId,
          sellerId: data.sellerId,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          previousHash: data.previousHash,
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
      }

      const hash1 = computeHash({
        orderSetId: 'order-001',
        subOrderId: 'sub-001',
        sellerId: 'seller-1',
        type: 'order_charge',
        amount: 10000,
        currency: 'TRY',
        previousHash: '',
      });

      // Second entry's previousHash points to a wrong hash
      const entries = [
        {
          entryId: 'entry-1',
          orderSetId: 'order-001',
          subOrderId: 'sub-001',
          sellerId: 'seller-1',
          type: 'order_charge',
          amount: 10000,
          currency: 'TRY',
          previousHash: '',
          hash: hash1,
          reference: '',
          reason: 'Order charge',
          createdBy: 'system',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          entryId: 'entry-2',
          orderSetId: 'order-001',
          subOrderId: 'sub-001',
          sellerId: 'seller-1',
          type: 'commission',
          amount: -5000,
          currency: 'TRY',
          previousHash: 'wrong-previous-hash', // BROKEN chain
          hash: 'anything',
          reference: '',
          reason: 'Commission',
          createdBy: 'system',
          createdAt: '2026-01-01T00:00:01Z',
        },
      ];

      const mockDb = createMockDb(entries);
      const result = await verifyChain(mockDb as any);

      expect(result.valid).toBe(false);
    });

    it('returns valid=true with 0 entries for empty ledger', async () => {
      const mockDb = createMockDb([]);
      const result = await verifyChain(mockDb as any);

      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBe(0);
    });
  });
});
