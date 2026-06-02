import { describe, it, expect } from 'vitest';
import { calculateCommission, resolveRate, getDefaultRates } from '../commissionEngine.js';
import type { CommissionRule } from '../commissionEngine.js';

describe('commissionEngine', () => {
  // Test fixtures — rates as decimals (0.05 = 5%)
  const globalRule: CommissionRule = {
    ruleId: 'global-1',
    type: 'global',
    scope: {},
    rate: 0.1,
    minCommission: 500, // 5 TL in kurus
    maxCommission: 50000, // 500 TL in kurus
    active: true,
    priority: 100,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const categoryRule: CommissionRule = {
    ruleId: 'cat-1',
    type: 'category',
    scope: { categoryId: 'elektronik' },
    rate: 0.05,
    minCommission: 500,
    maxCommission: 50000,
    active: true,
    priority: 50,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const sellerRule: CommissionRule = {
    ruleId: 'seller-1',
    type: 'seller',
    scope: { sellerId: 'seller-abc', categoryId: 'elektronik' },
    rate: 0.08,
    minCommission: 500,
    maxCommission: 50000,
    active: true,
    priority: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const inactiveCategoryRule: CommissionRule = {
    ruleId: 'cat-inactive',
    type: 'category',
    scope: { categoryId: 'giyim' },
    rate: 0.025,
    minCommission: 500,
    maxCommission: 50000,
    active: false,
    priority: 50,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const expensiveCategoryRule: CommissionRule = {
    ruleId: 'cat-expensive',
    type: 'category',
    scope: { categoryId: 'luks' },
    rate: 0.03,
    minCommission: 500,
    maxCommission: 50000,
    active: true,
    priority: 50,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const defaultRates = getDefaultRates();

  describe('resolveRate', () => {
    it('returns seller override rate when seller-specific rule exists for the seller+category', () => {
      const rules = [globalRule, categoryRule, sellerRule];
      const rate = resolveRate(rules, 'seller-abc', 'elektronik');
      // seller-abc has a seller override for elektronik at 0.08
      expect(rate).toBe(0.08);
    });

    it('returns category rate when no seller override exists for the seller', () => {
      const rules = [globalRule, categoryRule];
      const rate = resolveRate(rules, 'seller-xyz', 'elektronik');
      // No seller override for seller-xyz, so category rate 0.05
      expect(rate).toBe(0.05);
    });

    it('returns category default rate from DEFAULT_RATES when no rules match', () => {
      const rules: CommissionRule[] = [];
      const rate = resolveRate(rules, 'seller-xyz', 'giyim');
      // No rules at all, should fall back to DEFAULT_RATES
      expect(rate).toBe(defaultRates['giyim']);
    });

    it('returns global default 0.10 when no rules match and no category default exists', () => {
      const rules: CommissionRule[] = [];
      const rate = resolveRate(rules, 'seller-xyz', 'unknown-category');
      // No rules, no category default — global default 0.10
      expect(rate).toBe(0.1);
    });

    it('ignores inactive rules', () => {
      const rules = [inactiveCategoryRule, globalRule];
      const rate = resolveRate(rules, 'seller-xyz', 'giyim');
      // inactiveCategoryRule is inactive, so falls through to global default
      expect(rate).toBe(0.1);
    });
  });

  describe('calculateCommission', () => {
    it('calculates commission using category override rate', () => {
      const rules = [globalRule, categoryRule];
      // 10000 kurus = 100 TL * 5% = 500 kurus = 5 TL
      const result = calculateCommission({
        priceInKurus: 10000,
        sellerId: 'seller-xyz',
        categoryId: 'elektronik',
        rules,
      });
      expect(result.rate).toBe(0.05);
      expect(result.amount).toBe(500);
      expect(result.minApplied).toBe(true); // 500 matches min 500
      expect(result.maxApplied).toBe(false);
      expect(typeof result.ruleId).toBe('string');
    });

    it('returns seller override rate, beating category default', () => {
      const rules = [globalRule, categoryRule, sellerRule];
      const result = calculateCommission({
        priceInKurus: 10000,
        sellerId: 'seller-abc',
        categoryId: 'elektronik',
        rules,
      });
      expect(result.rate).toBe(0.08);
      expect(result.amount).toBe(800); // 10000 * 0.08 = 800 kurus = 8 TL
    });

    it('returns global default rate when no overrides exist', () => {
      const rules: CommissionRule[] = [];
      const result = calculateCommission({
        priceInKurus: 10000,
        sellerId: 'seller-xyz',
        categoryId: 'unknown',
        rules,
      });
      expect(result.rate).toBe(0.1);
      expect(result.amount).toBe(1000); // 10% of 10000 kurus
    });

    it('respects minCommission (500 kurus = 5 TL floor)', () => {
      const rules = [globalRule]; // global has 10% rate
      // 1000 kurus = 10 TL * 10% = 100 kurus — below min 500
      const result = calculateCommission({
        priceInKurus: 1000,
        sellerId: 'seller-xyz',
        categoryId: 'unknown',
        rules,
      });
      expect(result.amount).toBe(500); // min 500 kurus
      expect(result.minApplied).toBe(true);
      expect(result.maxApplied).toBe(false);
    });

    it('respects maxCommission (50000 kurus = 500 TL ceiling)', () => {
      const rules = [globalRule]; // global has min/max = 500/50000
      // 1000000 kurus = 10000 TL * 10% = 100000 kurus — above max 50000
      const result = calculateCommission({
        priceInKurus: 1000000,
        sellerId: 'seller-xyz',
        categoryId: 'unknown',
        rules,
      });
      expect(result.amount).toBe(50000); // max 50000 kurus
      expect(result.minApplied).toBe(false);
      expect(result.maxApplied).toBe(true);
    });

    it('returns 0 commission for 0 TL item price', () => {
      const rules = [globalRule];
      const result = calculateCommission({
        priceInKurus: 0,
        sellerId: 'seller-xyz',
        categoryId: 'unknown',
        rules,
      });
      expect(result.amount).toBe(0);
      expect(result.rate).toBe(0.1);
      expect(result.minApplied).toBe(false);
      expect(result.maxApplied).toBe(false);
    });

    it('uses min/max from the matched rule, not the global rule', () => {
      // A category rule with custom min/max
      const customMinMaxRule: CommissionRule = {
        ruleId: 'cat-custom',
        type: 'category',
        scope: { categoryId: 'luks' },
        rate: 0.03,
        minCommission: 1000, // 10 TL min
        maxCommission: 100000, // 1000 TL max
        active: true,
        priority: 50,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      const rules = [globalRule, customMinMaxRule];
      const result = calculateCommission({
        priceInKurus: 500,
        sellerId: 'seller-xyz',
        categoryId: 'luks',
        rules,
      });
      // 500 * 0.03 = 15 kurus, below min 1000
      expect(result.amount).toBe(1000); // custom minCommission from matched rule
      expect(result.minApplied).toBe(true);
      expect(result.ruleId).toBe('cat-custom');
    });
  });
});
