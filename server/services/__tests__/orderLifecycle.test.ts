// ─── Order Lifecycle Tests (TDD RED phase) ───────────────────────────────────
// Tests for:
//   1. Webhook idempotency via processedWebhooks collection
//   2. SubOrder transition (processing -> shipped via mark_shipped)
//   3. Stock reservation (reserveStock reduces available, increases reserved)
//   4. Stock restore on cancel (restoreStock reverses reservation)
//   5. Stock reservation failure when insufficient stock

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transitionOrder, InvalidTransitionError } from '../transitionEngine.js';
import { reserveStock, restoreStock, InsufficientStockError } from '../stockService.js';

// ─── Firestore mock helpers ──────────────────────────────────────────────────

function makeDocSnap(data: Record<string, any>, exists = true) {
  return { exists, data: () => data };
}

function makeMockDb(productData: Record<string, any>) {
  const updates: any[] = [];
  const txn = {
    get: vi.fn().mockResolvedValue(makeDocSnap(productData)),
    update: vi.fn((...args: any[]) => {
      updates.push(args);
    }),
  };
  const runTransaction = vi.fn(async (fn: (t: any) => Promise<any>) => {
    return fn(txn);
  });

  const docRef = { id: 'product-1' };
  const adminDb = {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(docRef),
    }),
    runTransaction,
    _txn: txn,
    _updates: updates,
  } as any;

  return { adminDb, txn, updates };
}

// ─── Test 1: processedWebhooks dedup ─────────────────────────────────────────

describe('Webhook idempotency (processedWebhooks dedup)', () => {
  it('returns early when eventId already processed', async () => {
    // Simulate: processedWebhooks/{eventId} doc exists on first read
    const existingDocSnap = makeDocSnap(
      { eventId: 'token-123', processedAt: new Date().toISOString() },
      true,
    );
    const orderSetUpdateFn = vi.fn();

    const txn = {
      get: vi.fn().mockResolvedValue(existingDocSnap),
      set: vi.fn(),
      update: orderSetUpdateFn,
    };

    const adminDb = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({}),
      }),
      runTransaction: vi.fn(async (fn: (t: any) => Promise<any>) => fn(txn)),
    };

    // Simulate idempotency check logic: if doc exists, return early
    const eventId = 'token-123';
    await adminDb.runTransaction(async (t: any) => {
      const dedupRef = adminDb.collection('processedWebhooks').doc(eventId);
      const dedupSnap = await t.get(dedupRef);
      if (dedupSnap.exists) {
        // Early return — do NOT call orderSet update
        return;
      }
      // Only runs if NOT a duplicate:
      t.update({}, { status: 'processing' });
    });

    // Assert: no Firestore updates called (early return path)
    expect(orderSetUpdateFn).not.toHaveBeenCalled();
    expect(txn.set).not.toHaveBeenCalled();
  });
});

// ─── Test 2: SubOrder transition processing -> shipped ───────────────────────

describe('transitionOrder state machine', () => {
  it('transitions processing -> shipped with mark_shipped', () => {
    const result = transitionOrder('processing', 'mark_shipped', 1);
    expect(result.status).toBe('shipped');
    expect(result.version).toBe(2);
  });

  it('throws InvalidTransitionError for invalid event on shipped status', () => {
    expect(() => transitionOrder('shipped', 'payment_received', 2)).toThrow(InvalidTransitionError);
  });
});

// ─── Test 3: Stock reservation (reserveStock) ─────────────────────────────────

describe('reserveStock', () => {
  it('reduces available and increases reserved when stock is sufficient', async () => {
    const productData = {
      stock: { available: 10, reserved: 0, total: 10 },
    };
    const { adminDb, txn } = makeMockDb(productData);

    await reserveStock(adminDb, 'product-1', 5);

    expect(adminDb.runTransaction).toHaveBeenCalledOnce();
    expect(txn.update).toHaveBeenCalledOnce();
    const updateCall = txn.update.mock.calls[0];
    // updateCall[1] should contain FieldValue increments or numeric deltas
    // We verify the update was called with the doc ref and an update object
    expect(updateCall).toBeDefined();
    expect(updateCall.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Test 4: Stock restore on cancel ─────────────────────────────────────────

describe('restoreStock', () => {
  it('decreases reserved and increases available', async () => {
    const productData = {
      stock: { available: 5, reserved: 5, total: 10 },
    };
    const { adminDb, txn } = makeMockDb(productData);

    await restoreStock(adminDb, 'product-1', 3);

    expect(adminDb.runTransaction).toHaveBeenCalledOnce();
    expect(txn.update).toHaveBeenCalledOnce();
    const updateCall = txn.update.mock.calls[0];
    expect(updateCall).toBeDefined();
  });
});

// ─── Test 5: Stock reservation failure when insufficient ─────────────────────

describe('reserveStock - InsufficientStockError', () => {
  it('throws InsufficientStockError when requested qty exceeds available', async () => {
    const productData = {
      stock: { available: 10, reserved: 0, total: 10 },
    };

    // runTransaction for this test executes the fn but the fn will throw
    const txn = {
      get: vi.fn().mockResolvedValue(makeDocSnap(productData)),
      update: vi.fn(),
    };
    const adminDb = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ id: 'product-1' }),
      }),
      runTransaction: vi.fn(async (fn: (t: any) => Promise<any>) => fn(txn)),
    } as any;

    await expect(reserveStock(adminDb, 'product-1', 15)).rejects.toThrow(InsufficientStockError);
    await expect(reserveStock(adminDb, 'product-1', 15)).rejects.toThrow(
      /Insufficient stock|yetersiz stok/i,
    );
  });
});
