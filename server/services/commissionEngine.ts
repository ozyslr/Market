// ─── Commission Engine ───────────────────────────────────────────────────────
// Handles commission rule resolution with specificity priority and min/max limits.
// All amounts are in integer kurus (1 TL = 100 kurus) to avoid floating-point issues.

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

// ─── Default Rates (D-05) ──────────────────────────────────────────────────

const DEFAULT_RATES: Record<string, number> = {
  elektronik: 0.05,
  giyim: 0.1,
  'ev-yasam': 0.12,
  kozmetik: 0.15,
  mucevher: 0.08,
};

const GLOBAL_DEFAULT_RATE = 0.1;
const GLOBAL_MIN_COMMISSION = 500; // 5 TL
const GLOBAL_MAX_COMMISSION = 50000; // 500 TL

/**
 * Resolve the effective commission rate using specificity priority:
 * 1) Seller-specific active rule (lowest priority number wins)
 * 2) Category-specific active rule
 * 3) DEFAULT_RATES for the categoryId
 * 4) Global default (10%)
 */
export function resolveRate(rules: CommissionRule[], sellerId: string, categoryId: string): number {
  let sellerRule: CommissionRule | null = null;
  let categoryRule: CommissionRule | null = null;
  let globalRule: CommissionRule | null = null;

  for (const rule of rules) {
    if (!rule.active) continue;

    if (rule.type === 'seller' && rule.scope?.sellerId === sellerId) {
      if (!sellerRule || rule.priority < sellerRule.priority) {
        sellerRule = rule;
      }
    } else if (rule.type === 'category' && rule.scope?.categoryId === categoryId) {
      if (!categoryRule || rule.priority < categoryRule.priority) {
        categoryRule = rule;
      }
    } else if (rule.type === 'global') {
      if (!globalRule || rule.priority < globalRule.priority) {
        globalRule = rule;
      }
    }
  }

  // Priority: seller > category > default from map > global
  if (sellerRule) return sellerRule.rate;
  if (categoryRule) return categoryRule.rate;
  if (DEFAULT_RATES[categoryId] !== undefined) return DEFAULT_RATES[categoryId];
  if (globalRule) return globalRule.rate;
  return GLOBAL_DEFAULT_RATE;
}

/**
 * Find the best matching rule (for metadata like min/max).
 */
function findBestRule(
  rules: CommissionRule[],
  sellerId: string,
  categoryId: string,
): CommissionRule | null {
  let best: CommissionRule | null = null;

  for (const rule of rules) {
    if (!rule.active) continue;

    if (rule.type === 'seller' && rule.scope?.sellerId === sellerId) {
      if (!best || rule.priority < best.priority) best = rule;
    } else if (rule.type === 'category' && rule.scope?.categoryId === categoryId) {
      if (!best || (best.type !== 'seller' && rule.priority < best.priority)) best = rule;
    } else if (rule.type === 'global') {
      if (
        !best ||
        (best.type !== 'seller' && best.type !== 'category' && rule.priority < best.priority)
      )
        best = rule;
    }
  }

  return best;
}

export interface CalculateCommissionParams {
  priceInKurus: number;
  sellerId: string;
  categoryId: string;
  rules: CommissionRule[];
}

/**
 * Calculate commission for a given price, seller, and category.
 * Applies min/max limits from the matched rule. Returns integer kurus amount.
 */
export function calculateCommission(params: CalculateCommissionParams): CommissionResult {
  const { priceInKurus, sellerId, categoryId, rules } = params;

  if (priceInKurus <= 0) {
    return { rate: 0, amount: 0, minApplied: false, maxApplied: false, ruleId: '' };
  }

  const rate = resolveRate(rules, sellerId, categoryId);
  const bestRule = findBestRule(rules, sellerId, categoryId);

  const minCom = bestRule?.minCommission ?? GLOBAL_MIN_COMMISSION;
  const maxCom = bestRule?.maxCommission ?? GLOBAL_MAX_COMMISSION;
  const ruleId = bestRule?.ruleId ?? '';

  let amount = Math.round(priceInKurus * rate);
  let minApplied = false;
  let maxApplied = false;

  if (amount < minCom) {
    amount = minCom;
    minApplied = true;
  }

  if (amount > maxCom) {
    amount = maxCom;
    maxApplied = true;
  }

  return { rate, amount, minApplied, maxApplied, ruleId };
}

/**
 * Return the default rates map for admin visibility.
 */
export function getDefaultRates(): Record<string, number> {
  return { ...DEFAULT_RATES };
}
