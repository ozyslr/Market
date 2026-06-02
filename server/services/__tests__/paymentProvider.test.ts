// ─── IyzicoProvider Marketplace Tests ───────────────────────────────────────
// Tests for IPaymentProvider interface + IyzicoProvider implementation
// covering marketplace subMerchant splits and commission integration.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommissionResult } from '../commissionEngine.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../commissionEngine.js', () => ({
  calculateCommission: vi.fn(),
}));

vi.mock('../../iyzico.cjs', () => ({
  createCheckoutForm: vi.fn(),
  retrieveCheckoutForm: vi.fn(),
}));

// Import after mocks are set up
import { IyzicoProvider } from '../paymentProvider.js';
import { calculateCommission } from '../commissionEngine.js';
import { createCheckoutForm, retrieveCheckoutForm } from '../../iyzico.cjs';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SELLER_A = 'seller-aaa';
const SELLER_B = 'seller-bbb';

function makeCommissionResult(amount: number): CommissionResult {
  return {
    rate: 0.1,
    amount,
    minApplied: false,
    maxApplied: false,
    ruleId: 'global-1',
  };
}

const mockGetIyzico = vi.fn().mockResolvedValue({
  client: { __mock: true },
});

const BASE_CHECKOUT_PARAMS = {
  orderSetId: 'order-set-001',
  totalAmount: 20000, // 200 TL in kurus
  currency: 'TRY',
  buyer: {
    id: 'user-001',
    email: 'buyer@test.com',
    name: 'Test Buyer',
    phone: '+905551234567',
  },
  shippingAddress: {
    fullName: 'Test Buyer',
    line1: '123 Test St',
    city: 'Istanbul',
    country: 'Turkey',
    postalCode: '34000',
  },
  callbackUrl: 'https://example.com/api/iyzico/callback',
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('IyzicoProvider', () => {
  let provider: IyzicoProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new IyzicoProvider({ getIyzico: mockGetIyzico });

    // Default mock: createCheckoutForm returns a valid token
    (createCheckoutForm as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
      token: 'mock-token-123',
      paymentPageUrl: 'https://sandbox.iyzico.com/pay/mock-token-123',
    });
  });

  describe('Test 1: single-seller OrderSet', () => {
    it('sets subMerchantKey and subMerchantPrice per basket item for single seller', async () => {
      // 2 items from seller A, each 10000 kurus (100 TL)
      // Commission 1000 kurus (10%) → subMerchantPrice = 9000 each
      (calculateCommission as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(makeCommissionResult(1000)) // item 1
        .mockReturnValueOnce(makeCommissionResult(1000)); // item 2

      const params = {
        ...BASE_CHECKOUT_PARAMS,
        items: [
          {
            id: 'prod-001',
            name: 'Product One',
            price: 10000,
            subMerchantKey: 'sub-key-aaa',
            categoryId: 'elektronik',
            sellerId: SELLER_A,
            subMerchantPrice: 9000,
          },
          {
            id: 'prod-002',
            name: 'Product Two',
            price: 10000,
            subMerchantKey: 'sub-key-aaa',
            categoryId: 'elektronik',
            sellerId: SELLER_A,
            subMerchantPrice: 9000,
          },
        ],
      };

      const result = await provider.initCheckout(params);

      expect(result.token).toBe('mock-token-123');
      expect(result.paymentPageUrl).toBe('https://sandbox.iyzico.com/pay/mock-token-123');

      // Verify the SDK was called with correct basket items
      const sdkCall = (createCheckoutForm as ReturnType<typeof vi.fn>).mock.calls[0];
      const request = sdkCall[1];
      expect(request.basketItems).toHaveLength(2);
      request.basketItems.forEach((item: any) => {
        expect(item.subMerchantKey).toBe('sub-key-aaa');
        expect(Number(item.subMerchantPrice)).toBe(9000);
      });
    });
  });

  describe('Test 2: multi-seller OrderSet', () => {
    it('assigns correct subMerchantKey per seller for each basket item', async () => {
      // Item from seller A (10000 kurus), item from seller B (10000 kurus)
      (calculateCommission as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(makeCommissionResult(1000)) // item A
        .mockReturnValueOnce(makeCommissionResult(1500)); // item B (15% rate)

      const params = {
        ...BASE_CHECKOUT_PARAMS,
        items: [
          {
            id: 'prod-001',
            name: 'Product A',
            price: 10000,
            subMerchantKey: 'sub-key-aaa',
            categoryId: 'elektronik',
            sellerId: SELLER_A,
            subMerchantPrice: 9000,
          },
          {
            id: 'prod-003',
            name: 'Product B',
            price: 10000,
            subMerchantKey: 'sub-key-bbb',
            categoryId: 'giyim',
            sellerId: SELLER_B,
            subMerchantPrice: 8500,
          },
        ],
      };

      await provider.initCheckout(params);

      const sdkCall = (createCheckoutForm as ReturnType<typeof vi.fn>).mock.calls[0];
      const request = sdkCall[1];
      expect(request.basketItems).toHaveLength(2);

      const itemA = request.basketItems.find((i: any) => i.id === 'prod-001');
      const itemB = request.basketItems.find((i: any) => i.id === 'prod-003');

      expect(itemA?.subMerchantKey).toBe('sub-key-aaa');
      expect(itemB?.subMerchantKey).toBe('sub-key-bbb');
    });
  });

  describe('Test 3: commission engine integration — price split integrity', () => {
    it('ensures sum(subMerchantPrices) + sum(commissions) === paidPrice', async () => {
      // Item 1: price 10000, commission 1000 → subMerchantPrice 9000
      // Item 2: price 10000, commission 1500 → subMerchantPrice 8500
      // paidPrice = 20000, commissions = 2500, subMerchantTotal = 17500
      (calculateCommission as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(makeCommissionResult(1000))
        .mockReturnValueOnce(makeCommissionResult(1500));

      const params = {
        ...BASE_CHECKOUT_PARAMS,
        totalAmount: 20000,
        items: [
          {
            id: 'prod-001',
            name: 'Product A',
            price: 10000,
            subMerchantKey: 'sub-key-aaa',
            categoryId: 'elektronik',
            sellerId: SELLER_A,
            subMerchantPrice: 9000,
          },
          {
            id: 'prod-002',
            name: 'Product B',
            price: 10000,
            subMerchantKey: 'sub-key-bbb',
            categoryId: 'giyim',
            sellerId: SELLER_B,
            subMerchantPrice: 8500,
          },
        ],
      };

      await provider.initCheckout(params);

      const sdkCall = (createCheckoutForm as ReturnType<typeof vi.fn>).mock.calls[0];
      const request = sdkCall[1];

      const totalSubMerchantPrice = request.basketItems.reduce(
        (sum: number, item: any) => sum + Number(item.subMerchantPrice),
        0,
      );
      const totalCommission = request.basketItems.reduce(
        (sum: number, item: any) => sum + (Number(item.price) - Number(item.subMerchantPrice)),
        0,
      );
      const paidPrice = Number(request.paidPrice);

      // subMerchantTotal (17500) + commissions (2500) === paidPrice (20000)
      expect(totalSubMerchantPrice + totalCommission).toBe(paidPrice);
    });
  });

  describe('Test 4: missing subMerchantKey throws ConfigurationError', () => {
    it('rejects with ConfigurationError when seller has no subMerchantKey', async () => {
      const params = {
        ...BASE_CHECKOUT_PARAMS,
        items: [
          {
            id: 'prod-001',
            name: 'Product No SubMerchant',
            price: 10000,
            subMerchantKey: '', // empty — seller not onboarded
            categoryId: 'elektronik',
            sellerId: 'seller-no-submerchant',
            subMerchantPrice: 9000,
          },
        ],
      };

      await expect(provider.initCheckout(params)).rejects.toThrow(/subMerchantKey/i);
    });
  });
});
