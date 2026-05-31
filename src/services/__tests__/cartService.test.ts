import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase modules
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockDoc = vi.fn();
const mockHandleFirestoreError = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: (...args: any[]) => mockHandleFirestoreError(...args),
  OperationType: { GET: 'GET', WRITE: 'WRITE', DELETE: 'DELETE' },
}));

import { getCart, saveCart, clearCart, type CartItem } from '../cartService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCart', () => {
  it('returns empty array when cart does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getCart('user1');
    expect(result).toEqual([]);
  });

  it('returns cart items when cart exists', async () => {
    const items = [{ productId: 'p1', quantity: 2, addedAt: '2026-01-01' }];
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ items }),
    });

    const result = await getCart('user1');
    expect(result).toEqual(items);
  });

  it('returns empty array and handles error on failure', async () => {
    const err = new Error('Firestore down');
    mockGetDoc.mockRejectedValue(err);

    const result = await getCart('user1');
    expect(result).toEqual([]);
    expect(mockHandleFirestoreError).toHaveBeenCalledWith(err, 'GET', 'carts/user1');
  });
});

describe('saveCart', () => {
  it('saves cart items with cleaned undefined variantIds', async () => {
    const items: CartItem[] = [
      { productId: 'p1', quantity: 1, addedAt: 'now' },
      { productId: 'p2', variantId: 'v1', quantity: 2, addedAt: 'now' },
    ];

    await saveCart('user1', items);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const savedItems = mockSetDoc.mock.calls[0][1].items;
    expect(savedItems).toHaveLength(2);
    expect(savedItems[0]).not.toHaveProperty('variantId');
    expect(savedItems[1]).toHaveProperty('variantId', 'v1');
  });

  it('handles error on save failure', async () => {
    const err = new Error('Permission denied');
    mockSetDoc.mockRejectedValue(err);

    await saveCart('user1', []);
    expect(mockHandleFirestoreError).toHaveBeenCalledWith(err, 'WRITE', 'carts/user1');
  });
});

describe('clearCart', () => {
  it('deletes the cart document', async () => {
    await clearCart('user1');
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('handles error on delete failure', async () => {
    const err = new Error('Not found');
    mockDeleteDoc.mockRejectedValue(err);

    await clearCart('user1');
    expect(mockHandleFirestoreError).toHaveBeenCalledWith(err, 'DELETE', 'carts/user1');
  });
});
