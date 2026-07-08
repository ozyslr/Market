import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupPaymentMethod, executeOneClickCheckout, createSetupIntent } from '../services/oneClickCheckoutService';
import type { OneClickCheckoutResult } from '../types/order';

const mockFirebaseUser = {
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  uid: 'test-user-123',
} as any;

describe('oneClickCheckoutService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createSetupIntent', () => {
    it('sends Authorization header with Bearer token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clientSecret: 'seti_1234567890_secret' }),
      });

      await createSetupIntent(mockFirebaseUser);

      const [url, options] = (global.fetch as any).mock.calls[0];
      expect(url).toContain('/api/create-setup-intent');
      expect(options.headers['Authorization']).toBe('Bearer mock-token');
      expect(options.method).toBe('POST');
    });

    it('returns clientSecret on success', async () => {
      const expectedSecret = 'seti_1234567890_secret';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clientSecret: expectedSecret }),
      });

      const result = await createSetupIntent(mockFirebaseUser);

      expect(result.clientSecret).toBe(expectedSecret);
      expect(result.error).toBeUndefined();
    });

    it('returns error on non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Internal server error' }),
      });

      const result = await createSetupIntent(mockFirebaseUser);

      expect(result.error).toBe('Internal server error');
      expect(result.clientSecret).toBe('');
    });
  });

  describe('setupPaymentMethod', () => {
    it('sends payment method data with Bearer token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await setupPaymentMethod(mockFirebaseUser, 'pm_test123', '4242', 'visa');

      const [url, options] = (global.fetch as any).mock.calls[0];
      expect(url).toContain('/api/setup-payment-method');
      expect(options.headers['Authorization']).toBe('Bearer mock-token');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.paymentMethodId).toBe('pm_test123');
      expect(body.last4).toBe('4242');
      expect(body.brand).toBe('visa');
    });

    it('returns success on ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await setupPaymentMethod(mockFirebaseUser, 'pm_test123', '4242', 'visa');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns error on non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Card declined' }),
      });

      const result = await setupPaymentMethod(mockFirebaseUser, 'pm_test123', '4242', 'visa');

      expect(result.error).toBe('Card declined');
      expect(result.success).toBeUndefined();
    });
  });

  describe('executeOneClickCheckout', () => {
    it('sends items and currency with Bearer token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'succeeded',
          orderId: 'order_123',
          total: 99.99,
        }),
      });

      const items = [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', variantId: 'v1', quantity: 1 },
      ];

      await executeOneClickCheckout(mockFirebaseUser, items, 'gbp');

      const [url, options] = (global.fetch as any).mock.calls[0];
      expect(url).toContain('/api/one-click-checkout');
      expect(options.headers['Authorization']).toBe('Bearer mock-token');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.items).toEqual(items);
      expect(body.currency).toBe('gbp');
    });

    it('returns succeeded status correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'succeeded',
          orderId: 'order_abc123',
          total: 149.99,
        }),
      });

      const items = [{ productId: 'p1', quantity: 1 }];
      const result: OneClickCheckoutResult = await executeOneClickCheckout(
        mockFirebaseUser,
        items,
        'gbp'
      );

      expect(result.status).toBe('succeeded');
      expect(result.orderId).toBe('order_abc123');
      expect(result.total).toBe(149.99);
      expect(result.clientSecret).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });

    it('returns requires_action status with clientSecret', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'requires_action',
          clientSecret: 'pi_xxx_secret_3ds',
        }),
      });

      const items = [{ productId: 'p1', quantity: 1 }];
      const result: OneClickCheckoutResult = await executeOneClickCheckout(
        mockFirebaseUser,
        items,
        'gbp'
      );

      expect(result.status).toBe('requires_action');
      expect(result.clientSecret).toBe('pi_xxx_secret_3ds');
      expect(result.orderId).toBeUndefined();
    });

    it('returns failed status with error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'failed',
          errorMessage: 'Card declined',
        }),
      });

      const items = [{ productId: 'p1', quantity: 1 }];
      const result: OneClickCheckoutResult = await executeOneClickCheckout(
        mockFirebaseUser,
        items,
        'gbp'
      );

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Card declined');
    });

    it('returns failed status on network error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      const items = [{ productId: 'p1', quantity: 1 }];
      const result: OneClickCheckoutResult = await executeOneClickCheckout(
        mockFirebaseUser,
        items,
        'gbp'
      );

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Server error');
    });
  });
});
