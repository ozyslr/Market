import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetDocs,
  mockGetDoc,
  mockCollection,
  mockQuery,
  mockWhere,
  mockLimit,
  mockDoc,
  mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockLimit: vi.fn(),
  mockDoc: vi.fn(),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  limit: mockLimit,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  doc: mockDoc,
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: { LIST: 'LIST', GET: 'GET' },
}));

import { getSellerBySlug, getSellerById } from '../userService';

describe('getSellerBySlug', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns the seller when a slug matches', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 's1', data: () => ({ storeName: 'Shop', slug: 'shop' }) }],
    });
    const s = await getSellerBySlug('shop');
    expect(s?.id).toBe('s1');
  });
  it('returns null when no slug matches (no mock fallback)', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
    expect(await getSellerBySlug('nope')).toBeNull();
  });
  it('throws on error', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('down'));
    await expect(getSellerBySlug('shop')).rejects.toThrow();
  });
});

describe('getSellerById', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns the seller when it exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 's1',
      data: () => ({ storeName: 'Shop' }),
    });
    expect((await getSellerById('s1'))?.id).toBe('s1');
  });
  it('returns null when missing', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    expect(await getSellerById('x')).toBeNull();
  });
});
