import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

export interface CommissionRule {
  id: string;
  name: string;
  /** Base commission percentage (e.g. 10 = 10%) */
  rate: number;
  /** Category-specific overrides: categoryId → rate */
  categoryOverrides?: Record<string, number>;
  /** Per-seller override rate (when fixed per seller) */
  sellerOverrides?: Record<string, number>;
  /** Min commission amount in TRY */
  minAmount?: number;
  /** Max commission amount in TRY */
  maxAmount?: number;
  isActive: boolean;
  updatedAt?: string;
}

export interface CommissionTransaction {
  id: string;
  orderId: string;
  sellerId: string;
  productId: string;
  /** Sale price of the item */
  itemPrice: number;
  /** Commission rate applied (%) */
  rate: number;
  /** Calculated commission amount */
  amount: number;
  /** Platform fee (extra service fee) */
  platformFee: number;
  /** Net amount for seller (itemPrice - commission - platformFee) */
  netAmount: number;
  status: 'pending' | 'collected' | 'released';
  createdAt: string;
  releasedAt?: string;
}

const RULES_COL = 'commissionRules';
const TX_COL = 'commissionTransactions';

export async function getCommissionRules(): Promise<CommissionRule[]> {
  try {
    const snap = await getDocs(collection(db, RULES_COL));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CommissionRule);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, RULES_COL);
    return [];
  }
}

export async function saveCommissionRule(rule: CommissionRule): Promise<void> {
  try {
    await setDoc(doc(db, RULES_COL, rule.id), { ...rule, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, RULES_COL);
    throw error;
  }
}

/**
 * Calculate commission for a given seller + category + price.
 * Checks: global rule → seller override → category override.
 */
export function calcCommission(
  rules: CommissionRule[],
  sellerId: string,
  categoryId: string,
  itemPrice: number,
): { rate: number; amount: number; platformFee: number; netAmount: number } {
  const rule = rules.find((r) => r.isActive);
  if (!rule) return { rate: 0, amount: 0, platformFee: 0, netAmount: itemPrice };

  // Priority: seller override > category override > base rate
  let rate = rule.rate;
  if (rule.sellerOverrides?.[sellerId] != null) {
    rate = rule.sellerOverrides[sellerId];
  } else if (rule.categoryOverrides?.[categoryId] != null) {
    rate = rule.categoryOverrides[categoryId];
  }

  let amount = itemPrice * (rate / 100);
  if (rule.minAmount != null) amount = Math.max(amount, rule.minAmount);
  if (rule.maxAmount != null) amount = Math.min(amount, rule.maxAmount);

  const platformFee = itemPrice * 0.035; // 3.5% platform service fee
  const netAmount = itemPrice - amount - platformFee;

  return {
    rate,
    amount: Math.round(amount * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}

/** Record a commission transaction after an order is placed */
export async function recordCommission(
  tx: Omit<CommissionTransaction, 'id' | 'createdAt'>,
): Promise<string> {
  const id = `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    await setDoc(doc(db, TX_COL, id), {
      ...tx,
      id,
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TX_COL);
    throw error;
  }
}

/** Get commission transactions for a seller */
export async function getSellerCommissions(sellerId: string): Promise<CommissionTransaction[]> {
  try {
    const q = query(collection(db, TX_COL), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CommissionTransaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TX_COL);
    return [];
  }
}

/** Release pending commissions */
export async function releaseCommissions(txIds: string[]): Promise<void> {
  try {
    const now = new Date().toISOString();
    await Promise.all(
      txIds.map((id) => updateDoc(doc(db, TX_COL, id), { status: 'released', releasedAt: now })),
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TX_COL);
  }
}

// ─── API-based functions (server-side authority) ───────────────────────────

const API_BASE = '/api';

/**
 * Get default commission rates from the server (authoritative).
 */
export async function getDefaultRatesFromServer(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_BASE}/commission-rules/defaults`, {
      headers: { Authorization: `Bearer ${await getAuthToken()}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch defaults: ${res.status}`);
    return await res.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'commission-rules');
    return {};
  }
}

/**
 * Preview commission calculation via server-side engine.
 * Returns the authoritative CommissionResult.
 */
export async function calculateCommissionPreview(
  sellerId: string,
  categoryId: string,
  priceInKurus: number,
): Promise<{
  rate: number;
  amount: number;
  minApplied: boolean;
  maxApplied: boolean;
  ruleId: string;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/calculate-commission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({ sellerId, categoryId, priceInKurus }),
    });
    if (!res.ok) throw new Error(`Failed to calculate commission: ${res.status}`);
    return await res.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'commission-calculate');
    return null;
  }
}

/**
 * Helper: get current Firebase auth token.
 */
async function getAuthToken(): Promise<string> {
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return '';
  return user.getIdToken();
}
