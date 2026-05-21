'use client';

import { collection, doc, getDocs, addDoc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'bank_transfer' | 'iyzico' | 'stripe';

export interface PayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  method: PayoutMethod;
  destination: string;
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

export interface SellerBalance {
  sellerId: string;
  totalEarned: number;
  totalCommission: number;
  totalFees: number;
  totalPaidOut: number;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  updatedAt: string;
}

const BALANCE_COL = 'sellerBalances';
const PAYOUT_COL = 'payoutRequests';

export async function getSellerBalance(sellerId: string): Promise<SellerBalance | null> {
  try {
    const q = query(collection(db, BALANCE_COL), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as SellerBalance;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BALANCE_COL);
    return null;
  }
}

export async function requestPayout(
  sellerId: string,
  amount: number,
  method: PayoutMethod,
  destination: string,
): Promise<string> {
  try {
    const fee = Math.max(5, amount * 0.01);
    const ref = await addDoc(collection(db, PAYOUT_COL), {
      sellerId,
      amount,
      fee: Math.round(fee * 100) / 100,
      netAmount: Math.round((amount - fee) * 100) / 100,
      status: 'pending',
      method,
      destination,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PAYOUT_COL);
    throw error;
  }
}

export async function getPayoutHistory(sellerId: string): Promise<PayoutRequest[]> {
  try {
    const q = query(
      collection(db, PAYOUT_COL),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PAYOUT_COL);
    return [];
  }
}

export async function updatePayoutStatus(id: string, status: PayoutStatus, processedBy?: string): Promise<void> {
  try {
    await updateDoc(doc(db, PAYOUT_COL, id), {
      status,
      processedBy: processedBy || null,
      processedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PAYOUT_COL}/${id}`);
  }
}

export async function getAllPayoutRequests(status?: PayoutStatus): Promise<PayoutRequest[]> {
  try {
    const ref = collection(db, PAYOUT_COL);
    const q = status ? query(ref, where('status', '==', status)) : query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PAYOUT_COL);
    return [];
  }
}
