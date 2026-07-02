import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetDocs,
  mockCollection,
  mockQuery,
  mockWhere,
  mockDocumentId,
  mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockDocumentId: vi.fn(() => '__name__'),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  documentId: mockDocumentId,
  doc: vi.fn(),
  getDoc: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  runTransaction: vi.fn(),
  increment: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: { LIST: 'LIST', GET: 'GET', CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}));

vi.mock('../priceHistoryService', () => ({ recordPrice: vi.fn() }));

import { getProductsByIds } from '../productService';

function snapFromDocs(docs: { id: string; data: any }[]) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })), empty: docs.length === 0 };
}

describe('getProductsByIds', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array for empty input without querying', async () => {
    const result = await getProductsByIds([]);
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('fetches products for given ids in a single chunk', async () => {
    mockGetDocs.mockResolvedValueOnce(
      snapFromDocs([
        { id: 'a', data: { title: 'A', slug: 'a' } },
        { id: 'b', data: { title: 'B', slug: 'b' } },
      ]),
    );
    const result = await getProductsByIds(['a', 'b']);
    expect(result.map((p) => p.id)).toEqual(['a', 'b']);
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
  });

  it('chunks ids in groups of 10', async () => {
    const ids = Array.from({ length: 12 }, (_, i) => `id${i}`);
    mockGetDocs
      .mockResolvedValueOnce(
        snapFromDocs(ids.slice(0, 10).map((id) => ({ id, data: { title: id } }))),
      )
      .mockResolvedValueOnce(
        snapFromDocs(ids.slice(10).map((id) => ({ id, data: { title: id } }))),
      );
    const result = await getProductsByIds(ids);
    expect(mockGetDocs).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(12);
  });

  it('omits ids that do not exist (no mock fallback)', async () => {
    mockGetDocs.mockResolvedValueOnce(snapFromDocs([{ id: 'a', data: { title: 'A' } }]));
    const result = await getProductsByIds(['a', 'missing']);
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('throws on Firestore error (no mock fallback)', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('firestore down'));
    await expect(getProductsByIds(['a'])).rejects.toThrow();
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});
