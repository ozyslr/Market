import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockAddDoc, mockCollection, mockServerTimestamp,
  mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockServerTimestamp: vi.fn(() => 'server_timestamp_mock'),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: mockAddDoc,
  collection: mockCollection,
  serverTimestamp: mockServerTimestamp,
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: { GET: 'GET', WRITE: 'WRITE', DELETE: 'DELETE', LIST: 'LIST', CREATE: 'CREATE', UPDATE: 'UPDATE' },
}));

vi.mock('../pushNotificationService', () => ({
  queuePushNotification: vi.fn().mockResolvedValue(undefined),
}));

import { createNotification, notifyOrderStatusChange, notifyPriceDrop, notifyStockAvailable } from '../notificationService';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createNotification ───────────────────────────────────────────────────────

describe('createNotification', () => {
  it('adds a notification document and triggers push', async () => {
    mockAddDoc.mockResolvedValue({ id: 'notif_1' });
    mockCollection.mockReturnValue('notifications_ref');

    await createNotification('uid', 'order_status', 'Test Title', 'Test Message', '/orders/123');

    expect(mockCollection).toHaveBeenCalledWith({}, 'notifications');
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const addedData = mockAddDoc.mock.calls[0][1];
    expect(addedData).toMatchObject({
      userId: 'uid',
      type: 'order_status',
      title: 'Test Title',
      message: 'Test Message',
      link: '/orders/123',
      read: false,
    });
    expect(addedData.createdAt).toBe('server_timestamp_mock');
  });

  it('adds notification without link when link is undefined', async () => {
    mockAddDoc.mockResolvedValue({ id: 'notif_2' });
    mockCollection.mockReturnValue('notifications_ref');

    await createNotification('uid', 'price_drop', 'Price Drop', '50% off!');

    const addedData = mockAddDoc.mock.calls[0][1];
    expect(addedData.link).toBeNull();
  });

  it('handles Firestore error gracefully', async () => {
    const err = new Error('Permission denied');
    mockAddDoc.mockRejectedValue(err);
    mockCollection.mockReturnValue('notifications_ref');

    await createNotification('uid', 'admin_alert', 'Alert', 'Something happened');

    expect(mockHandleFirestoreError).toHaveBeenCalledWith(err, 'CREATE', 'notifications');
  });
});

// ── notifyOrderStatusChange ──────────────────────────────────────────────────

describe('notifyOrderStatusChange', () => {
  it('calls createNotification with order_status type for processing', async () => {
    mockAddDoc.mockResolvedValue({ id: 'n1' });
    mockCollection.mockReturnValue('notifications_ref');

    await notifyOrderStatusChange('uid', 'order_1', 'processing');

    expect(mockAddDoc).toHaveBeenCalled();
    const data = mockAddDoc.mock.calls[0][1];
    expect(data.type).toBe('order_status');
    expect(data.title).toBe('Siparişiniz Hazırlanıyor');
    expect(data.link).toBe('/orders/order_1');
  });

  it('calls createNotification with order_status type for shipped', async () => {
    mockAddDoc.mockResolvedValue({ id: 'n2' });
    mockCollection.mockReturnValue('notifications_ref');

    await notifyOrderStatusChange('uid', 'order_2', 'shipped');

    const data = mockAddDoc.mock.calls[0][1];
    expect(data.type).toBe('order_status');
    expect(data.title).toBe('Siparişiniz Kargoya Verildi');
  });

  it('calls createNotification with order_status type for delivered', async () => {
    mockAddDoc.mockResolvedValue({ id: 'n3' });
    mockCollection.mockReturnValue('notifications_ref');

    await notifyOrderStatusChange('uid', 'order_3', 'delivered');

    const data = mockAddDoc.mock.calls[0][1];
    expect(data.title).toBe('Siparişiniz Teslim Edildi');
  });

  it('calls createNotification with order_status type for cancelled', async () => {
    mockAddDoc.mockResolvedValue({ id: 'n4' });
    mockCollection.mockReturnValue('notifications_ref');

    await notifyOrderStatusChange('uid', 'order_4', 'cancelled');

    const data = mockAddDoc.mock.calls[0][1];
    expect(data.title).toBe('Siparişiniz İptal Edildi');
  });

  it('does nothing for unknown status', async () => {
    await notifyOrderStatusChange('uid', 'order_5', 'unknown_status');

    expect(mockAddDoc).not.toHaveBeenCalled();
  });
});

// ── notifyPriceDrop ──────────────────────────────────────────────────────────

describe('notifyPriceDrop', () => {
  it('calls createNotification with price_drop type and formatted message', async () => {
    mockAddDoc.mockResolvedValue({ id: 'n5' });
    mockCollection.mockReturnValue('notifications_ref');

    await notifyPriceDrop('uid', 'Awesome Widget', 200, 150);

    const data = mockAddDoc.mock.calls[0][1];
    expect(data.type).toBe('price_drop');
    expect(data.title).toBe('Fiyat Düştü!');
    expect(data.message).toContain('%25 indirim');
    expect(data.message).toContain('200.00');
    expect(data.message).toContain('150.00');
  });

  it('computes drop percentage correctly', async () => {
    mockAddDoc.mockResolvedValue({ id: 'n6' });
    mockCollection.mockReturnValue('notifications_ref');

    await notifyPriceDrop('uid', 'Test', 100, 1);

    const data = mockAddDoc.mock.calls[0][1];
    expect(data.message).toContain('%99 indirim');
  });
});

// ── notifyStockAvailable ────────────────────────────────────────────────────

describe('notifyStockAvailable', () => {
  it('calls createNotification with back_in_stock type', async () => {
    mockAddDoc.mockResolvedValue({ id: 'n7' });
    mockCollection.mockReturnValue('notifications_ref');

    await notifyStockAvailable('uid', 'Popular Item');

    const data = mockAddDoc.mock.calls[0][1];
    expect(data.type).toBe('back_in_stock');
    expect(data.title).toBe('Tekrar Stokta');
    expect(data.message).toContain('Popular Item');
    expect(data.message).toContain('tekrar stoklarımıza girdi');
  });
});
