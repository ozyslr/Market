import { describe, it, expect, vi, beforeEach } from 'vitest';

// All mocks must use vi.hoisted() because vi.mock is hoisted to top of file
const {
  mockGetDocs, mockSetDoc, mockUpdateDoc, mockDeleteDoc,
  mockDoc, mockCollection, mockQuery, mockWhere,
  mockIncrement, mockServerTimestamp, mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockIncrement: vi.fn((n: number) => n),
  mockServerTimestamp: vi.fn(() => 'SERVER_TIMESTAMP' as const),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  doc: mockDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  increment: mockIncrement,
  serverTimestamp: mockServerTimestamp,
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: { CREATE: 'create', UPDATE: 'update', DELETE: 'delete', LIST: 'list' },
  auth: { currentUser: null },
}));

import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  calcDiscount,
  getCouponsBySeller,
  createSellerCoupon,
  updateSellerCoupon,
  deleteSellerCoupon,
  incrementCouponUsage,
} from '../couponService';
import type { Coupon } from '@/types';

beforeEach(() => {
  vi.resetAllMocks();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'c1',
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    usedCount: 0,
    isActive: true,
    createdAt: '2026-01-01',
    ...overrides,
  };
}

// ── getCoupons ───────────────────────────────────────────────────────────────

describe('getCoupons', () => {
  it('returns all coupons from Firestore', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => makeCoupon() }],
    });

    const result = await getCoupons();
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('SAVE10');
  });

  it('returns empty array on Firestore error', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore error'));

    const result = await getCoupons();
    expect(result).toEqual([]);
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── createCoupon ─────────────────────────────────────────────────────────────

describe('createCoupon', () => {
  const validData = {
    code: 'NEW20',
    discountType: 'percentage' as const,
    discountValue: 20,
    isActive: true,
  };

  it('creates a coupon with generated id, zero usage, and createdAt', async () => {
    const result = await createCoupon(validData);
    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe('string');
    expect(result.code).toBe('NEW20');
    expect(result.usedCount).toBe(0);
    expect(result.createdAt).toBeTruthy();
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  it('throws on Firestore error and calls handleFirestoreError', async () => {
    const err = new Error('Permission denied');
    mockSetDoc.mockRejectedValue(err);

    await expect(createCoupon(validData)).rejects.toThrow('Permission denied');
    expect(mockHandleFirestoreError).toHaveBeenCalledWith(err, 'create', 'coupons');
  });
});

// ── updateCoupon ─────────────────────────────────────────────────────────────

describe('updateCoupon', () => {
  it('calls updateDoc with data and serverTimestamp', async () => {
    await updateCoupon('c1', { discountValue: 15 });
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload).toHaveProperty('discountValue', 15);
    expect(payload).toHaveProperty('updatedAt', 'SERVER_TIMESTAMP');
  });

  it('throws on Firestore error', async () => {
    const err = new Error('Not found');
    mockUpdateDoc.mockRejectedValue(err);

    await expect(updateCoupon('c1', {})).rejects.toThrow('Not found');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── deleteCoupon ─────────────────────────────────────────────────────────────

describe('deleteCoupon', () => {
  it('calls deleteDoc with the correct document reference', async () => {
    await deleteCoupon('c1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('throws on Firestore error', async () => {
    const err = new Error('Forbidden');
    mockDeleteDoc.mockRejectedValue(err);

    await expect(deleteCoupon('c1')).rejects.toThrow('Forbidden');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── validateCoupon ───────────────────────────────────────────────────────────

describe('validateCoupon', () => {
  it('returns valid for active, unexpired coupon meeting min order amount', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => makeCoupon({ expiresAt: '2027-12-31', minOrderAmount: 50 }) }],
    });

    const result = await validateCoupon('SAVE10', 100);
    expect(result.valid).toBe(true);
    expect(result.coupon).toBeDefined();
    expect(result.coupon!.code).toBe('SAVE10');
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for non-existent coupon code', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const result = await validateCoupon('NOPE', 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('coupon.invalid');
  });

  it('returns invalid for expired coupon', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => makeCoupon({ expiresAt: '2025-01-01' }) }],
    });

    const result = await validateCoupon('EXPIRED', 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('coupon.invalid');
  });

  it('returns invalid when max uses are exhausted', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => makeCoupon({ maxUses: 50, usedCount: 50 }) }],
    });

    const result = await validateCoupon('USEDUP', 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('coupon.invalid');
  });

  it('returns min_order error when cart total is below minimum', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => makeCoupon({ minOrderAmount: 200 }) }],
    });

    const result = await validateCoupon('BIG', 50);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('coupon.min_order');
  });

  it('returns invalid on Firestore error', async () => {
    mockGetDocs.mockRejectedValue(new Error('DB down'));

    const result = await validateCoupon('ERR', 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('coupon.invalid');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── calcDiscount ─────────────────────────────────────────────────────────────

describe('calcDiscount', () => {
  it('calculates percentage discount as (subtotal * value / 100)', () => {
    const coupon = makeCoupon({ discountType: 'percentage', discountValue: 10 });
    expect(calcDiscount(coupon, 200)).toBe(20);
    expect(calcDiscount(coupon, 0)).toBe(0);
  });

  it('caps fixed discount at subtotal', () => {
    const coupon = makeCoupon({ discountType: 'fixed', discountValue: 50 });
    expect(calcDiscount(coupon, 30)).toBe(30);
    expect(calcDiscount(coupon, 100)).toBe(50);
  });
});

// ── getCouponsBySeller ───────────────────────────────────────────────────────

describe('getCouponsBySeller', () => {
  it('returns coupons matching the given seller ID', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => makeCoupon({ sellerId: 's1' }) }],
    });

    const result = await getCouponsBySeller('s1');
    expect(result).toHaveLength(1);
    expect(result[0].sellerId).toBe('s1');
  });

  it('returns empty array on Firestore error', async () => {
    mockGetDocs.mockRejectedValue(new Error('Error'));
    const result = await getCouponsBySeller('s1');
    expect(result).toEqual([]);
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── createSellerCoupon ───────────────────────────────────────────────────────

describe('createSellerCoupon', () => {
  it('creates a coupon with sellerId assigned', async () => {
    const data = {
      code: 'SELLER10',
      discountType: 'percentage' as const,
      discountValue: 10,
      isActive: true,
    };
    const result = await createSellerCoupon('seller1', data);
    expect(result.sellerId).toBe('seller1');
    expect(result.id).toBeTruthy();
    expect(result.usedCount).toBe(0);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  it('throws on Firestore error', async () => {
    mockSetDoc.mockRejectedValue(new Error('Write failed'));
    await expect(
      createSellerCoupon('seller1', {
        code: 'X',
        discountType: 'fixed' as const,
        discountValue: 5,
        isActive: true,
      }),
    ).rejects.toThrow('Write failed');
  });
});

// ── updateSellerCoupon ───────────────────────────────────────────────────────

describe('updateSellerCoupon', () => {
  it('updates when the coupon belongs to the seller', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => ({ sellerId: 'seller1' }) }],
    });

    await updateSellerCoupon('seller1', 'c1', { discountValue: 25 });
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it('throws when the coupon does not belong to the seller', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'other', data: () => ({ sellerId: 'seller2' }) }],
    });

    await expect(updateSellerCoupon('seller1', 'c1', {})).rejects.toThrow(
      'Bu kupon size ait değil',
    );
  });

  it('throws on Firestore error during ownership check', async () => {
    mockGetDocs.mockRejectedValue(new Error('Read error'));
    await expect(updateSellerCoupon('seller1', 'c1', {})).rejects.toThrow('Read error');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── deleteSellerCoupon ───────────────────────────────────────────────────────

describe('deleteSellerCoupon', () => {
  it('deletes when the coupon belongs to the seller', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'c1', data: () => ({ sellerId: 'seller1' }) }],
    });

    await deleteSellerCoupon('seller1', 'c1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('throws when the coupon does not belong to the seller', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'other', data: () => ({ sellerId: 'seller2' }) }],
    });

    await expect(deleteSellerCoupon('seller1', 'c1')).rejects.toThrow(
      'Bu kupon size ait değil',
    );
  });

  it('throws on Firestore error during ownership check', async () => {
    mockGetDocs.mockRejectedValue(new Error('Read error'));
    await expect(deleteSellerCoupon('seller1', 'c1')).rejects.toThrow('Read error');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── incrementCouponUsage ─────────────────────────────────────────────────────

describe('incrementCouponUsage', () => {
  it('calls updateDoc with increment(1)', async () => {
    await incrementCouponUsage('c1');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockIncrement).toHaveBeenCalledWith(1);
  });

  it('handles Firestore error without throwing', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Update error'));
    await incrementCouponUsage('c1');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});
