import { describe, it, expect } from 'vitest';
import { calculateCommission, resolveRate, type CommissionRule } from '../commissionEngine.js';

// ─── Test helpers ────────────────────────────────────────────────────────────

const ELECTRONICS = 'elektronik';
const FASHION = 'giyim';
const SELLER_A = 'seller-a';
const SELLER_B = 'seller-b';
const UNKNOWN_CATEGORY = 'bilinmeyen-kategori';

const testRules: CommissionRule[] = [
  {
    ruleId: 'global-default',
    type: 'global',
    rate: 0.1,
    minCommission: 500,
    maxCommission: 50000,
    active: true,
    priority: 300,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    ruleId: 'cat-electronics',
    type: 'category',
    scope: { categoryId: ELECTRONICS },
    rate: 0.05,
    minCommission: 500,
    maxCommission: 50000,
    active: true,
    priority: 200,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    ruleId: 'seller-a-override',
    type: 'seller',
    scope: { sellerId: SELLER_A },
    rate: 0.08,
    minCommission: 500,
    maxCommission: 50000,
    active: true,
    priority: 100,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const inactiveRule: CommissionRule = {
  ruleId: 'seller-b-inactive',
  type: 'seller',
  scope: { sellerId: SELLER_B },
  rate: 0.03,
  minCommission: 500,
  maxCommission: 50000,
  active: false,
  priority: 100,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('commissionEngine', () => {
  describe('resolveRate', () => {
    it('returns category override rate when available', () => {
      const rate = resolveRate(testRules, SELLER_B, ELECTRONICS);
      expect(rate).toBe(0.05);
    });

    it('returns seller override rate, beating category default (specificity priority)', () => {
      const rate = resolveRate(testRules, SELLER_A, ELECTRONICS);
      expect(rate).toBe(0.08);
    });

    it('returns global default rate when no overrides match', () => {
      const rate = resolveRate(testRules, SELLER_B, FASHION);
      expect(rate).toBe(0.1);
    });

    it('returns category default rate from DEFAULT_RATES when no rules match category', () => {
      const rate = resolveRate([], SELLER_B, FASHION);
      // Giyim default: 0.10
      expect(rate).toBe(0.1);
    });

    it('returns global fallback (0.10) for unknown category with no rules', () => {
      const rate = resolveRate([], SELLER_B, UNKNOWN_CATEGORY);
      expect(rate).toBe(0.1);
    });

    it('ignores inactive rules', () => {
      const rules = [...testRules, inactiveRule];
      const rate = resolveRate(rules, SELLER_B, ELECTRONICS);
      // inactive seller rule for SELLER_B should be ignored, category rule applies
      expect(rate).toBe(0.05);
    });
  });

  describe('calculateCommission', () => {
    it('calculates commission with category override (electronics at 5%)', () => {
      const result = calculateCommission({
        priceInKurus: 10000, // 100 TL
        sellerId: SELLER_B,
        categoryId: ELECTRONICS,
        rules: testRules,
      });
      expect(result.rate).toBe(0.05);
      expect(result.amount).toBe(500); // 10000 * 0.05 = 500 kurus = 5 TL
      expect(result.minApplied).toBe(false);
      expect(result.maxApplied).toBe(false);
      expect(result.ruleId).toBe('cat-electronics');
    });

    it('seller override beats category default', () => {
      const result = calculateCommission({
        priceInKurus: 10000,
        sellerId: SELLER_A,
        categoryId: ELECTRONICS,
        rules: testRules,
      });
      expect(result.rate).toBe(0.08);
      expect(result.amount).toBe(800); // 10000 * 0.08
      expect(result.ruleId).toBe('seller-a-override');
    });

    it('uses global default (10%) when no overrides', () => {
      const result = calculateCommission({
        priceInKurus: 20000, // 200 TL
        sellerId: SELLER_B,
        categoryId: FASHION,
        rules: testRules,
      });
      expect(result.rate).toBe(0.1);
      expect(result.amount).toBe(2000); // 20000 * 0.1 = 2000 kurus = 20 TL
      expect(result.ruleId).toBe('global-default');
    });

    it('respects minCommission floor (5 TL = 500 kurus)', () => {
      const result = calculateCommission({
        priceInKurus: 1000, // 10 TL, 10% would be 100 kurus = 1 TL, below 5 TL floor
        sellerId: SELLER_B,
        categoryId: FASHION,
        rules: testRules,
      });
      expect(result.amount).toBe(500); // floored to 500 kurus (5 TL)
      expect(result.minApplied).toBe(true);
    });

    it('respects maxCommission ceiling (500 TL = 50000 kurus)', () => {
      const result = calculateCommission({
        priceInKurus: 1000000, // 10000 TL, 10% = 100000 kurus > 50000 ceiling
        sellerId: SELLER_B,
        categoryId: FASHION,
        rules: testRules,
      });
      expect(result.amount).toBe(50000); // capped to 50000 kurus (500 TL)
      expect(result.maxApplied).toBe(true);
    });

    it('zero price returns zero commission', () => {
      const result = calculateCommission({
        priceInKurus: 0,
        sellerId: SELLER_B,
        categoryId: ELECTRONICS,
        rules: testRules,
      });
      expect(result.amount).toBe(0);
      expect(result.minApplied).toBe(false);
      expect(result.maxApplied).toBe(false);
    });

    it('all amounts are integers (kurus)', () => {
      const result = calculateCommission({
        priceInKurus: 12345,
        sellerId: SELLER_B,
        categoryId: ELECTRONICS,
        rules: testRules,
      });
      expect(Number.isInteger(result.amount)).toBe(true);
    });
  });
});
