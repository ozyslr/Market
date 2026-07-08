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
  subscribeToStockAlert, unsubscribeFromStockAlert,
  isSubscribedToStockAlert, checkAndNotifyStockAlerts,
} from '../stockAlertService';
import type { StockAlert } from '../stockAlertService';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStockAlertDoc(overrides: Partial<StockAlert> = {}): {
  id: string; data: () => StockAlert;
} {
  return {
    id: 'uid_p1',
    data: () => ({
      userId: 'uid',
      productId: 'p1',
      createdAt: '2026-05-01T00:00:00.000Z',
      notified: false,
      ...overrides,
    }),
  };
}

// ── subscribeToStockAlert ────────────────────────────────────────────────────

describe('subscribeToStockAlert', () => {
  it('calls setDoc with stock alert data and notified: false', async () => {
    await subscribeToStockAlert('uid', 'p1');

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, data] = mockSetDoc.mock.calls[0];
    expect(data).toMatchObject({
      userId: 'uid',
      productId: 'p1',
      notified: false,
    });
    expect(data).toHaveProperty('createdAt');
    expect(typeof data.createdAt).toBe('string');
  });
});

// ── unsubscribeFromStockAlert ────────────────────────────────────────────────

describe('unsubscribeFromStockAlert', () => {
  it('calls deleteDoc with correct document reference', async () => {
    await unsubscribeFromStockAlert('uid', 'p1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

// ── isSubscribedToStockAlert ─────────────────────────────────────────────────

describe('isSubscribedToStockAlert', () => {
  it('returns true when the alert document exists', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });
    const result = await isSubscribedToStockAlert('uid', 'p1');
    expect(result).toBe(true);
  });

  it('returns false when the alert document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await isSubscribedToStockAlert('uid', 'p1');
    expect(result).toBe(false);
  });

  it('returns false on Firestore error', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'));
    const result = await isSubscribedToStockAlert('uid', 'p1');
    expect(result).toBe(false);
  });
});

// ── checkAndNotifyStockAlerts ────────────────────────────────────────────────

describe('checkAndNotifyStockAlerts', () => {
  it('does nothing when there are no pending stock alerts', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    await checkAndNotifyStockAlerts('p1');

    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it('does nothing when the product document does not exist', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeStockAlertDoc()],
    });
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await checkAndNotifyStockAlerts('p1');

    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('does nothing when the product is still out of stock', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeStockAlertDoc()],
    });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'p1',
      data: () => ({ title: 'Out of Stock Item', slug: 'out-of-stock', stock: 0 }),
    });

    await checkAndNotifyStockAlerts('p1');

    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('creates notification and updates alert when product is back in stock', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeStockAlertDoc()],
    });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'p1',
      data: () => ({ title: 'In Stock Item', slug: 'in-stock', stock: 10 }),
    });

    await checkAndNotifyStockAlerts('p1');

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      'uid', 'back_in_stock', expect.any(String), expect.any(String), expect.any(String),
    );
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, updateData] = mockSetDoc.mock.calls[0];
    expect(updateData).toEqual({ notified: true });
  });

  it('handles error gracefully without throwing', async () => {
    mockGetDocs.mockRejectedValue(new Error('Unexpected error'));
    await expect(checkAndNotifyStockAlerts('p1')).resolves.toBeUndefined();
  });
});
