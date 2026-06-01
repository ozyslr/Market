import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetDoc, mockGetDocs, mockDoc, mockCollection,
  mockQuery, mockWhere, mockOrderBy, mockLimit,
  mockSaveCart, mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockGetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
  mockLimit: vi.fn(),
  mockSaveCart: vi.fn(),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  doc: mockDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: { GET: 'GET', WRITE: 'WRITE', DELETE: 'DELETE', LIST: 'LIST', CREATE: 'CREATE', UPDATE: 'UPDATE' },
}));

vi.mock('../cartService', () => ({
  saveCart: mockSaveCart,
}));

import { getLastOrder, validateReorderItems, reorderToCart } from '../reorderService';
import type { Order } from '@/types/order';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeOrderSnap(overrides: Partial<Order> = {}): { id: string; exists: () => true; data: () => any } {
  return {
    id: 'order_1',
    exists: () => true,
    data: () => ({
      userId: 'uid',
      items: [
        { productId: 'p1', name: 'Product 1', price: 100, quantity: 2, image: '/p1.jpg' },
        { productId: 'p2', name: 'Product 2', price: 50, quantity: 1, image: '/p2.jpg' },
      ],
      status: 'delivered',
      createdAt: { toDate: () => new Date('2026-05-01'), toMillis: () => 1000 },
      ...overrides,
    }),
  };
}

function makeProductSnap(overrides: any = {}): { exists: () => boolean; data: () => any } {
  return {
    exists: () => true,
    data: () => ({
      id: 'p1',
      title: 'Product 1',
      price: 100,
      stock: 10,
      isActive: true,
      status: 'approved',
      ...overrides,
    }),
  };
}

// ── getLastOrder ─────────────────────────────────────────────────────────────

describe('getLastOrder', () => {
  it('returns null when no completed orders exist', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const result = await getLastOrder('uid');
    expect(result).toBeNull();
  });

  it('returns the most recent completed order', async () => {
    const snap = makeOrderSnap();
    mockGetDocs.mockResolvedValue({ empty: false, docs: [snap] });

    const result = await getLastOrder('uid');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('order_1');
    expect((result as any).userId).toBe('uid');
  });

  it('returns null on Firestore error', async () => {
    mockGetDocs.mockRejectedValue(new Error('Network error'));

    const result = await getLastOrder('uid');
    expect(result).toBeNull();
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── validateReorderItems ─────────────────────────────────────────────────────

describe('validateReorderItems', () => {
  it('returns available for active, approved, in-stock products', async () => {
    mockGetDoc.mockResolvedValue(makeProductSnap());

    const order = makeOrderSnap().data() as Order;
    const results = await validateReorderItems(order as any);

    expect(results).toHaveLength(2);
    expect(results[0].available).toBe(true);
    expect(results[1].available).toBe(true);
  });

  it('marks item unavailable when product doc does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const order = makeOrderSnap().data() as Order;
    const results = await validateReorderItems(order as any);

    expect(results[0].available).toBe(false);
    expect(results[0].reason).toBe('Urun artik mevcut degil');
  });

  it('marks item unavailable when product is inactive', async () => {
    mockGetDoc.mockResolvedValue(makeProductSnap({ isActive: false }));

    const order = makeOrderSnap().data() as Order;
    const results = await validateReorderItems(order as any);

    expect(results[0].available).toBe(false);
    expect(results[0].reason).toBe('Urun artik satista degil');
  });

  it('marks item unavailable when product not approved', async () => {
    mockGetDoc.mockResolvedValue(makeProductSnap({ status: 'pending' }));

    const order = makeOrderSnap().data() as Order;
    const results = await validateReorderItems(order as any);

    expect(results[0].available).toBe(false);
    expect(results[0].reason).toBe('Urun artik satista degil');
  });

  it('marks item unavailable when out of stock', async () => {
    mockGetDoc.mockResolvedValue(makeProductSnap({ stock: 0 }));

    const order = makeOrderSnap().data() as Order;
    const results = await validateReorderItems(order as any);

    expect(results[0].available).toBe(false);
    expect(results[0].reason).toBe('Stokta yok');
  });

  it('handles Firestore error per item', async () => {
    mockGetDoc.mockRejectedValue(new Error('DB error'));

    const order = makeOrderSnap().data() as Order;
    const results = await validateReorderItems(order as any);

    expect(results[0].available).toBe(false);
    expect(results[0].reason).toBe('Dogrulama hatasi');
  });
});

// ── reorderToCart ────────────────────────────────────────────────────────────

describe('reorderToCart', () => {
  it('throws when order does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(reorderToCart('uid', 'nonexistent')).rejects.toThrow('Siparis bulunamadi');
  });

  it('adds available items and saves merged cart', async () => {
    // First getDoc call = order doc
    // Second getDoc call (from validateReorderItems) = product doc for each item
    // Third getDoc call = existing cart
    mockGetDoc
      .mockResolvedValueOnce(makeOrderSnap())                // order
      .mockResolvedValueOnce(makeProductSnap())               // product p1
      .mockResolvedValueOnce(makeProductSnap({ id: 'p2', price: 50, stock: 0 }))  // product p2 out of stock
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [] }) }); // existing cart (empty)

    mockSaveCart.mockResolvedValue(undefined);

    const result = await reorderToCart('uid', 'order_1');

    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    expect(mockSaveCart).toHaveBeenCalledTimes(1);
    // Cart should contain only the available item
    const savedItems = mockSaveCart.mock.calls[0][1];
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].productId).toBe('p1');
  });

  it('merges with existing cart items', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeOrderSnap())                 // order
      .mockResolvedValueOnce(makeProductSnap())                // product p1
      .mockResolvedValueOnce(makeProductSnap({ id: 'p2' }))   // product p2
      .mockResolvedValueOnce({                                 // existing cart with p1 already
        exists: () => true,
        data: () => ({
          items: [{ productId: 'p1', quantity: 1, addedAt: '2026-01-01' }],
        }),
      });

    mockSaveCart.mockResolvedValue(undefined);

    const result = await reorderToCart('uid', 'order_1');

    expect(result.added).toBe(2); // both available
    const savedItems = mockSaveCart.mock.calls[0][1];
    // p1 should have quantity incremented: 1 (existing) + 2 (from order) = 3
    const p1Item = savedItems.find((i: any) => i.productId === 'p1');
    expect(p1Item?.quantity).toBe(3);
    // p2 should be a new entry
    const p2Item = savedItems.find((i: any) => i.productId === 'p2');
    expect(p2Item?.quantity).toBe(1);
  });

  it('throws on saveCart error', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeOrderSnap())
      .mockResolvedValueOnce(makeProductSnap())
      .mockResolvedValueOnce(makeProductSnap({ id: 'p2' }))
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [] }) });

    mockSaveCart.mockRejectedValue(new Error('Save failed'));

    await expect(reorderToCart('uid', 'order_1')).rejects.toThrow('Save failed');
  });
});
