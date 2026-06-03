// ─── Refund Service Tests (TDD RED phase) ────────────────────────────────────
// Tests for refund commission reversal, ledger negative entries, state machine.

import { describe, it, expect, vi } from 'vitest';
import { transitionOrder, InvalidTransitionError } from '../transitionEngine.js';

// ProcessRefundParams — defined inline to allow RED phase before refundService exists
interface ProcessRefundParams {
  orderSetId: string;
  subOrderId: string;
  paymentTransactionId?: string;
  isFullRefund: boolean;
  refundAmount?: number;
  reason?: string;
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeSubOrderDoc(overrides: Record<string, unknown> = {}) {
  return {
    status: 'return_approved',
    version: 2,
    sellerId: 'seller-001',
    paymentTransactionId: 'txn-abc-123',
    subtotal: 10000, // kurus
    shipping: 0,
    currency: 'TRY',
    orderSetId: 'orderset-001',
    ...overrides,
  };
}

function makeLedgerDocs(commissionAmount: number) {
  return [
    {
      entryId: 'entry-commission-1',
      type: 'commission',
      amount: commissionAmount,
      status: 'collected',
      orderSetId: 'orderset-001',
      subOrderId: 'sub-001',
      sellerId: 'seller-001',
      currency: 'TRY',
    },
  ];
}

function createMockDb(subOrderData: Record<string, unknown>, ledgerDocs: unknown[]) {
  // Track recorded ledger entries
  const recordedEntries: unknown[] = [];

  const subOrderDocRef = {
    data: () => subOrderData,
  };

  const ledgerDocRef = {
    id: `ledger-${Math.random().toString(36).slice(2, 8)}`,
  };

  const subOrderCollectionSnap = {
    exists: true,
    data: () => subOrderData,
  };

  const txn = {
    get: vi.fn().mockImplementation(async (ref: any) => {
      // Return suborder or ledger data based on context
      return subOrderCollectionSnap;
    }),
    set: vi.fn().mockImplementation((ref: any, data: unknown) => {
      recordedEntries.push(data);
    }),
    update: vi.fn(),
  };

  const ledgerCollectionRef = {
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      empty: ledgerDocs.length === 0,
      docs: ledgerDocs.map((d) => ({ data: () => d, id: (d as any).entryId })),
    }),
    doc: vi.fn().mockReturnValue(ledgerDocRef),
  };

  const subOrdersCollectionRef = {
    doc: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(subOrderDocRef),
    }),
  };

  const orderSetsCollectionRef = {
    doc: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: 'return_approved', version: 2 }),
      }),
      update: vi.fn(),
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }),
    }),
  };

  const mockDb = {
    collection: vi.fn().mockImplementation((name: string) => {
      if (name === 'ledger') return ledgerCollectionRef;
      if (name === 'subOrders') return subOrdersCollectionRef;
      if (name === 'orderSets') return orderSetsCollectionRef;
      return ledgerCollectionRef;
    }),
    runTransaction: vi.fn().mockImplementation(async (fn: (txn: any) => Promise<any>) => {
      return fn(txn);
    }),
    _recordedEntries: recordedEntries,
    _txn: txn,
  };

  return mockDb;
}

function createMockGetIyzico(refundId = 'refund-xyz-789') {
  const refundV2Create = vi.fn().mockResolvedValue({
    status: 'success',
    refundId,
  });
  const cancelCreate = vi.fn().mockResolvedValue({
    status: 'success',
  });

  return {
    getIyzico: vi.fn().mockResolvedValue({
      client: {},
      refundV2Create,
      cancelCreate,
    }),
    refundV2Create,
    cancelCreate,
  };
}

// ─── Static import (will fail RED until refundService.ts is created) ─────────
import { processRefund } from '../refundService.js';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('refundService', () => {
  describe('Test 1: Full refund — commission + seller payout reversal entries', () => {
    it('records negative commission and seller payout reversal ledger entries', async () => {
      const originalCommission = 1200; // kurus
      const originalTotal = 10000; // kurus
      const expectedSellerPayout = originalTotal - originalCommission; // 8800

      const mockDb = createMockDb(makeSubOrderDoc(), makeLedgerDocs(originalCommission));
      const { getIyzico } = createMockGetIyzico();

      const params: ProcessRefundParams = {
        orderSetId: 'orderset-001',
        subOrderId: 'sub-001',
        isFullRefund: true,
        reason: 'Customer request',
      };

      const result = await processRefund(mockDb as any, getIyzico, params);

      expect(result.ledgerEntryIds).toHaveLength(2);

      // Find commission reversal entry
      const commissionEntry = mockDb._txn.set.mock.calls
        .map((c: unknown[]) => c[1] as Record<string, unknown>)
        .find((e: Record<string, unknown>) => e.reason && String(e.reason).includes('commission'));

      // Find seller payout reversal entry
      const payoutEntry = mockDb._txn.set.mock.calls
        .map((c: unknown[]) => c[1] as Record<string, unknown>)
        .find((e: Record<string, unknown>) => e.reason && String(e.reason).includes('seller'));

      expect(commissionEntry).toBeDefined();
      expect(payoutEntry).toBeDefined();
      expect(commissionEntry!.amount).toBe(-originalCommission);
      expect(payoutEntry!.amount).toBe(-expectedSellerPayout);
      expect(commissionEntry!.type).toBe('refund');
      expect(payoutEntry!.type).toBe('refund');

      // Total refund = commission reversal + seller payout reversal (absolute values)
      const totalRefund =
        Math.abs(commissionEntry!.amount as number) + Math.abs(payoutEntry!.amount as number);
      expect(totalRefund).toBe(originalTotal);
    });
  });

  describe('Test 2: Commission amount in reversal matches original commission', () => {
    it('absolute value of commission reversal equals original commission amount', async () => {
      const originalCommission = 1500;
      const mockDb = createMockDb(
        makeSubOrderDoc({ subtotal: 12000 }),
        makeLedgerDocs(originalCommission),
      );
      const { getIyzico } = createMockGetIyzico();

      const params: ProcessRefundParams = {
        orderSetId: 'orderset-001',
        subOrderId: 'sub-001',
        isFullRefund: true,
      };

      await processRefund(mockDb as any, getIyzico, params);

      const commissionEntry = mockDb._txn.set.mock.calls
        .map((c: unknown[]) => c[1] as Record<string, unknown>)
        .find((e: Record<string, unknown>) => e.reason && String(e.reason).includes('commission'));

      expect(commissionEntry).toBeDefined();
      expect(Math.abs(commissionEntry!.amount as number)).toBe(originalCommission);
    });
  });

  describe('Test 3: SubOrder transitions from return_approved to refunded', () => {
    it('transitionOrder moves return_approved -> refunded via refund event', () => {
      const result = transitionOrder('return_approved', 'refund', 2);
      expect(result).toEqual({ status: 'refunded', version: 3 });
    });

    it('transitionOrder throws InvalidTransitionError when refunded is terminal', () => {
      expect(() => transitionOrder('refunded', 'refund', 3)).toThrow(InvalidTransitionError);
    });
  });

  describe('Test 4: Partial refund — specific paymentTransactionId, proportional commission', () => {
    it('calls refundV2Create with correct paymentTransactionId and records proportional commission', async () => {
      const originalCommission = 1200;
      const originalTotal = 10000;
      const partialAmount = 5000;
      const expectedProportionalCommission = Math.round(
        originalCommission * (partialAmount / originalTotal),
      ); // 600

      const mockDb = createMockDb(makeSubOrderDoc(), makeLedgerDocs(originalCommission));
      const { getIyzico, refundV2Create } = createMockGetIyzico();

      const params: ProcessRefundParams = {
        orderSetId: 'orderset-001',
        subOrderId: 'sub-001',
        paymentTransactionId: 'txn-abc-123',
        isFullRefund: false,
        refundAmount: partialAmount,
      };

      await processRefund(mockDb as any, getIyzico, params);

      // iyzico called with specific paymentTransactionId and price
      expect(refundV2Create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          paymentTransactionId: 'txn-abc-123',
          price: String(partialAmount),
        }),
      );

      // Single ledger entry with proportional commission reversal
      const allEntries = mockDb._txn.set.mock.calls.map(
        (c: unknown[]) => c[1] as Record<string, unknown>,
      );
      const refundEntries = allEntries.filter((e: Record<string, unknown>) => e.type === 'refund');

      expect(refundEntries).toHaveLength(1);
      expect(refundEntries[0].amount).toBe(-expectedProportionalCommission);
    });
  });
});
