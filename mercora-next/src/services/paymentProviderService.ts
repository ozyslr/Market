'use client';

import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export type PaymentProvider = 'stripe' | 'iyzico' | 'paypal' | 'manual';

export interface PaymentProviderConfig {
  id: string;
  provider: PaymentProvider;
  isActive: boolean;
  label: string;
  description?: string;
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  merchantId?: string;
  additionalConfig?: Record<string, string>;
  supportedCurrencies: string[];
  minAmount?: number;
  maxAmount?: number;
  feePercent: number;
  feeFixed: number;
  createdAt: string;
  updatedAt: string;
}

const COL = 'paymentProviders';

export async function getProviders(): Promise<PaymentProviderConfig[]> {
  try {
    const q = query(collection(db, COL), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentProviderConfig));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getActiveProviders(): Promise<PaymentProviderConfig[]> {
  try {
    const all = await getProviders();
    return all.filter(p => p.isActive);
  } catch {
    return [];
  }
}

export async function saveProvider(data: Omit<PaymentProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, COL), { ...data, createdAt: now, updatedAt: now });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function updateProvider(id: string, data: Partial<PaymentProviderConfig>): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deleteProvider(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
  }
}
