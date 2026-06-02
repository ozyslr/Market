// ─── Commission Engine ──────────────────────────────────────────────────────
// Server-side commission rate resolution with specificity priority:
// 1) seller-specific active rule, 2) category-specific active rule,
// 3) DEFAULT_RATES[categoryId], 4) global default (10%).
// All monetary values are in integer kurus (1 TL = 100 kurus).

import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CommissionRule {
  ruleId: string;
  type: 'category' | 'seller' | 'global';
  scope?: { categoryId?: string; sellerId?: string };
  rate: number; // e.g., 0.05 = 5%
  minCommission: number; // in kurus (500 = 5 TL)
  maxCommission: number; // in kurus (50000 = 500 TL)
  active: boolean;
  priority: number; // lower = higher priority
  createdAt: string;
  updatedAt: string;
}

export interface CommissionResult {
  rate: number;
  amount: number; // in kurus (integer)
  minApplied: boolean;
  maxApplied: boolean;
  ruleId: string;
}

// ─── Default Rates (from D-05) ──────────────────────────────────────────────

export const DEFAULT_RATES: Record<string, number> = {
  elektronik: 0.05, // 5%
  giyim: 0.1, // 10%
  'ev-ve-yasam': 0.12, // 12%
  kozmetik: 0.15, // 15%
  mucevher: 0.08, // 8%
};

const GLOBAL_DEFAULT_RATE = 0.1; // 10%

// ─── Rate Resolution ────────────────────────────────────────────────────────

/**
 * Resolve the effective commission rate for a given seller + category.
 *
 * Priority order (per D-04):
 * 1. Seller-specific active rule (for this seller + category)
 * 2. Category-specific active rule
 * 3. DEFAULT_RATES[categoryId]
 * 4. Global default (0.10)
 */
export function resolveRate(rules: CommissionRule[], sellerId: string, categoryId: string): number {
  // Filter to active rules only
  const activeRules = rules.filter((r) => r.active);

  // Priority 1: seller-specific rule for this seller+category
  const sellerRule = activeRules.find(
    (r) =>
      r.type === 'seller' && r.scope?.sellerId === sellerId && r.scope?.categoryId === categoryId,
  );
  if (sellerRule) return sellerRule.rate;

  // Priority 2: category-specific rule
  const categoryRule = activeRules.find(
    (r) => r.type === 'category' && r.scope?.categoryId === categoryId,
  );
  if (categoryRule) return categoryRule.rate;

  // Priority 3: default rate by category
  if (DEFAULT_RATES[categoryId] !== undefined) {
    return DEFAULT_RATES[categoryId];
  }

  // Priority 4: global default
  return GLOBAL_DEFAULT_RATE;
}

/**
 * Resolve the best matching rule for a given seller + category.
 * Used to get min/max limits from the matched rule.
 */
function resolveMatchingRule(
  rules: CommissionRule[],
  sellerId: string,
  categoryId: string,
): CommissionRule | null {
  const activeRules = rules.filter((r) => r.active);

  // Priority 1: seller-specific rule for this seller+category
  const sellerRule = activeRules.find(
    (r) =>
      r.type === 'seller' && r.scope?.sellerId === sellerId && r.scope?.categoryId === categoryId,
  );
  if (sellerRule) return sellerRule;

  // Priority 2: category-specific rule
  const categoryRule = activeRules.find(
    (r) => r.type === 'category' && r.scope?.categoryId === categoryId,
  );
  if (categoryRule) return categoryRule;

  // Priority 3: global rule
  const globalRule = activeRules.find((r) => r.type === 'global');
  if (globalRule) return globalRule;

  return null;
}

// ─── Commission Calculation ─────────────────────────────────────────────────

/**
 * Calculate commission for a given price, seller, and category.
 *
 * @param params.priceInKurus - Item price in integer kurus (e.g., 10000 = 100 TL)
 * @param params.sellerId - Seller ID
 * @param params.categoryId - Category ID
 * @param params.rules - Array of commission rules to evaluate
 * @returns CommissionResult with rate, amount, and limit flags
 */
export function calculateCommission(params: {
  priceInKurus: number;
  sellerId: string;
  categoryId: string;
  rules: CommissionRule[];
}): CommissionResult {
  const { priceInKurus, sellerId, categoryId, rules } = params;

  // Handle zero price edge case
  if (priceInKurus === 0) {
    return {
      rate: resolveRate(rules, sellerId, categoryId),
      amount: 0,
      minApplied: false,
      maxApplied: false,
      ruleId: '',
    };
  }

  // Resolve rate and matching rule
  const rate = resolveRate(rules, sellerId, categoryId);
  const matchedRule = resolveMatchingRule(rules, sellerId, categoryId);

  // Calculate raw commission amount
  let amount = Math.round(priceInKurus * rate);

  // Apply min/max from the matched rule (or defaults)
  let minApplied = false;
  let maxApplied = false;

  if (matchedRule) {
    if (amount <= matchedRule.minCommission) {
      amount = matchedRule.minCommission;
      minApplied = true;
    } else if (amount >= matchedRule.maxCommission) {
      amount = matchedRule.maxCommission;
      maxApplied = true;
    }
  }

  return {
    rate,
    amount,
    minApplied,
    maxApplied,
    ruleId: matchedRule?.ruleId ?? '',
  };
}

/**
 * Get the default rates map for admin display.
 */
export function getDefaultRates(): Record<string, number> {
  return { ...DEFAULT_RATES };
}
