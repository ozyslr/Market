import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetDoc, mockGetDocs, mockSetDoc, mockDeleteDoc,
  mockDoc, mockCollection, mockQuery, mockWhere,
  mockCreateNotification,
} = vi.hoisted(() => ({
  mockGetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockSetDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockCreateNotification: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  doc: mockDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('../notificationService', () => ({
  createNotification: mockCreateNotification,
}));

import {
  trackPrice, untrackPrice, isTrackingPrice,
  getTrackedProducts, getPriceAlert, checkPriceDrops,
} from '../priceTrackingService';
import type { PriceAlert } from '../priceTrackingService';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSnapDoc(overrides: Partial<PriceAlert> = {}): { id: string; data: () => PriceAlert } {
  return {
    id: 'uid_p1',
    data: () => ({
      userId: 'uid',
      productId: 'p1',
      targetPrice: 50,
      currentPrice: 100,
      createdAt: '2026-05-01T00:00:00.000Z',
      ...overrides,
    }),
  };
}

// ── trackPrice ───────────────────────────────────────────────────────────────

describe('trackPrice', () => {
  it('calls setDoc with price alert data and createdAt', async () => {
    await trackPrice('uid', 'p1', 50);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, data] = mockSetDoc.mock.calls[0];
    expect(data).toMatchObject({
      userId: 'uid',
      productId: 'p1',
      targetPrice: 50,
    });
    expect(data).toHaveProperty('createdAt');
    expect(typeof data.createdAt).toBe('string');
  });
});

// ── untrackPrice ─────────────────────────────────────────────────────────────

describe('untrackPrice', () => {
  it('calls deleteDoc with correct document reference', async () => {
    await untrackPrice('uid', 'p1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

// ── isTrackingPrice ──────────────────────────────────────────────────────────

describe('isTrackingPrice', () => {
  it('returns true when the alert document exists', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });
    const result = await isTrackingPrice('uid', 'p1');
    expect(result).toBe(true);
  });

  it('returns false when the alert document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await isTrackingPrice('uid', 'p1');
    expect(result).toBe(false);
  });

  it('returns false on Firestore error', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'));
    const result = await isTrackingPrice('uid', 'p1');
    expect(result).toBe(false);
  });
});

// ── getTrackedProducts ──────────────────────────────────────────────────────

describe('getTrackedProducts', () => {
  it('returns product IDs from all price alerts for the user', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ productId: 'p1' }) }, { data: () => ({ productId: 'p2' }) }],
    });

    const result = await getTrackedProducts('uid');
    expect(result).toEqual(['p1', 'p2']);
  });

  it('returns empty array when user has no tracked products', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    const result = await getTrackedProducts('uid');
    expect(result).toEqual([]);
  });

  it('returns empty array on Firestore error', async () => {
    mockGetDocs.mockRejectedValue(new Error('Permission denied'));
    const result = await getTrackedProducts('uid');
    expect(result).toEqual([]);
  });
});

// ── getPriceAlert ───────────────────────────────────────────────────────────

describe('getPriceAlert', () => {
  it('returns the price alert with id when it exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'uid_p1',
      data: () => ({ userId: 'uid', productId: 'p1', targetPrice: 50, currentPrice: 100, createdAt: '2026-05-01' }),
    });

    const result = await getPriceAlert('uid', 'p1');
    expect(result).not.toBeNull();
    expect(result!.productId).toBe('p1');
    expect(result!.targetPrice).toBe(50);
  });

  it('returns null when the alert does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getPriceAlert('uid', 'p1');
    expect(result).toBeNull();
  });

  it('returns null on Firestore error', async () => {
    mockGetDoc.mockRejectedValue(new Error('DB error'));
    const result = await getPriceAlert('uid', 'p1');
    expect(result).toBeNull();
  });
});

// ── checkPriceDrops ─────────────────────────────────────────────────────────

describe('checkPriceDrops', () => {
  it('does nothing when there are no price alerts for the product', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    await checkPriceDrops('p1', 30);
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it('does nothing when the product document does not exist', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeSnapDoc()],
    });
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await checkPriceDrops('p1', 30);
    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });

  it('creates notification and deletes alert when current price is at or below target', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeSnapDoc({ targetPrice: 50 })],
    });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'p1',
      data: () => ({ title: 'Test Product', slug: 'test-product' }),
    });

    await checkPriceDrops('p1', 40);

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('does not create notification when current price is above target', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeSnapDoc({ targetPrice: 50 })],
    });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'p1',
      data: () => ({ title: 'Test Product', slug: 'test-product' }),
    });

    await checkPriceDrops('p1', 60);

    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });

  it('handles error gracefully without throwing', async () => {
    mockGetDocs.mockRejectedValue(new Error('Unexpected error'));
    await expect(checkPriceDrops('p1', 30)).resolves.toBeUndefined();
  });
});
