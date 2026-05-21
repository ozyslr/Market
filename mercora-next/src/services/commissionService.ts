'use client';

import { collection, doc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export interface CommissionRule {
  id: string;
  name: string;
  rate: number;
  categoryOverrides?: Record<string, number>;
  sellerOverrides?: Record<string, number>;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  updatedAt?: string;
}

export interface CommissionTransaction {
  id: string;
  orderId: string;
  sellerId: string;
  productId: string;
  itemPrice: number;
  rate: number;
  amount: number;
  platformFee: number;
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
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommissionRule));
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

export function calcCommission(
  rules: CommissionRule[],
  sellerId: string,
  categoryId: string,
  itemPrice: number,
): { rate: number; amount: number; platformFee: number; netAmount: number } {
  const rule = rules.find(r => r.isActive);
  if (!rule) return { rate: 0, amount: 0, platformFee: 0, netAmount: itemPrice };

  let rate = rule.rate;
  if (rule.sellerOverrides?.[sellerId] != null) {
    rate = rule.sellerOverrides[sellerId];
  } else if (rule.categoryOverrides?.[categoryId] != null) {
    rate = rule.categoryOverrides[categoryId];
  }

  let amount = itemPrice * (rate / 100);
  if (rule.minAmount != null) amount = Math.max(amount, rule.minAmount);
  if (rule.maxAmount != null) amount = Math.min(amount, rule.maxAmount);

  const platformFee = itemPrice * 0.035;
  const netAmount = itemPrice - amount - platformFee;

  return {
    rate,
    amount: Math.round(amount * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}

export async function recordCommission(tx: Omit<CommissionTransaction, 'id' | 'createdAt'>): Promise<string> {
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

export async function getSellerCommissions(sellerId: string): Promise<CommissionTransaction[]> {
  try {
    const q = query(collection(db, TX_COL), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommissionTransaction));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TX_COL);
    return [];
  }
}

export async function releaseCommissions(txIds: string[]): Promise<void> {
  try {
    const now = new Date().toISOString();
    await Promise.all(txIds.map(id =>
      updateDoc(doc(db, TX_COL, id), { status: 'released', releasedAt: now })
    ));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TX_COL);
  }
}
