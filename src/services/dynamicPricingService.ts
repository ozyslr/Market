import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────

export type PricingRuleType = 'stock_based' | 'time_based' | 'demand_based';
export type PriceAdjustment = 'percentage' | 'fixed';

export interface PricingRule {
  id: string;
  sellerId: string;
  productId: string;
  productTitle: string;
  ruleType: PricingRuleType;
  enabled: boolean;
  adjustmentType: PriceAdjustment;
  adjustmentValue: number; // positive = increase, negative = decrease
  // Stock-based
  stockThreshold?: number; // apply when stock is below this
  overstockThreshold?: number; // apply when stock is above this
  // Time-based
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ...
  // Demand-based
  minViews?: number;
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastApplied?: string;
}

export interface DynamicPriceResult {
  originalPrice: number;
  dynamicPrice: number;
  discount: number;
  ruleType: PricingRuleType | null;
  ruleLabel: string;
  applied: boolean;
}

const COL = 'pricingRules';

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function createRule(
  rule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = doc(collection(db, COL));
  const now = new Date().toISOString();
  await setDoc(ref, { ...rule, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateRule(id: string, updates: Partial<PricingRule>): Promise<void> {
  const ref = doc(db, COL, id);
  await setDoc(ref, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteRule(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getRulesByProduct(productId: string): Promise<PricingRule[]> {
  const snap = await getDocs(
    query(collection(db, COL), where('productId', '==', productId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PricingRule);
}

export async function getRulesBySeller(sellerId: string): Promise<PricingRule[]> {
  const snap = await getDocs(
    query(collection(db, COL), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PricingRule);
}

// ─── Pricing Engine ────────────────────────────────────────────────────────

function isTimeActive(rule: PricingRule): boolean {
  if (rule.ruleType !== 'time_based' || !rule.startTime || !rule.endTime) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check day of week
  if (rule.daysOfWeek?.length && !rule.daysOfWeek.includes(now.getDay())) return false;

  const [sh, sm] = rule.startTime.split(':').map(Number);
  const [eh, em] = rule.endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (startMin <= endMin) {
    return currentMinutes >= startMin && currentMinutes <= endMin;
  }
  // Overnight (e.g. 22:00 - 06:00)
  return currentMinutes >= startMin || currentMinutes <= endMin;
}

/**
 * Calculate the dynamic price for a product given its rules and context.
 */
export function calculateDynamicPrice(
  product: { id: string; price: number; stock?: number; views?: number },
  rules: PricingRule[],
): DynamicPriceResult {
  const result: DynamicPriceResult = {
    originalPrice: product.price,
    dynamicPrice: product.price,
    discount: 0,
    ruleType: null,
    ruleLabel: '',
    applied: false,
  };

  if (!rules.length) return result;

  // Sort: demand_based > stock_based > time_based (most specific first)
  const sorted = [...rules]
    .filter((r) => r.enabled)
    .sort((a, b) => {
      const order = { demand_based: 0, stock_based: 1, time_based: 2 };
      return (order[a.ruleType] ?? 3) - (order[b.ruleType] ?? 3);
    });

  for (const rule of sorted) {
    // Check conditions
    if (rule.ruleType === 'time_based' && !isTimeActive(rule)) continue;
    if (rule.ruleType === 'stock_based' && product.stock !== undefined) {
      if (rule.stockThreshold && product.stock > rule.stockThreshold) continue;
      if (rule.overstockThreshold && product.stock < rule.overstockThreshold) continue;
    }
    if (rule.ruleType === 'demand_based' && product.views !== undefined) {
      if (rule.minViews && product.views < rule.minViews) continue;
    }

    // Apply adjustment
    let adjustment: number;
    if (rule.adjustmentType === 'percentage') {
      adjustment = product.price * (rule.adjustmentValue / 100);
    } else {
      adjustment = rule.adjustmentValue;
    }

    const adjustedPrice = Math.max(0, product.price + adjustment);

    // Pick the first applicable rule (highest priority)
    if (adjustedPrice !== product.price) {
      result.dynamicPrice = Math.round(adjustedPrice * 100) / 100;
      result.discount = Math.round((product.price - result.dynamicPrice) * 100) / 100;
      result.ruleType = rule.ruleType;
      result.applied = true;

      const labels: Record<PricingRuleType, string> = {
        stock_based: 'Stok bazlı fiyatlandırma',
        time_based: 'Zamana bağlı fiyatlandırma',
        demand_based: 'Talep bazlı fiyatlandırma',
      };
      result.ruleLabel = labels[rule.ruleType] || 'Dinamik fiyatlandırma';
      break;
    }
  }

  return result;
}

// ─── Demand scoring (views tracking) ──────────────────────────────────────

const VIEW_COUNTS = new Map<string, number>();

export function incrementViewCount(productId: string) {
  VIEW_COUNTS.set(productId, (VIEW_COUNTS.get(productId) || 0) + 1);
}

export function getViewCount(productId: string): number {
  return VIEW_COUNTS.get(productId) || 0;
}
