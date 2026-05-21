'use client';

import {
  collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import { createNotification } from '@/services/notificationService';

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
}

const COL = 'priceAlerts';

export async function createPriceAlert(
  data: Omit<PriceAlert, 'id' | 'createdAt' | 'isActive' | 'currentPrice'> & { currentPrice: number },
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
  try {
    const q = query(
      collection(db, COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function deletePriceAlert(alertId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, alertId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${alertId}`);
  }
}

export async function checkAndNotifyAlerts(
  productId: string,
  newPrice: number,
): Promise<number> {
  try {
    const q = query(
      collection(db, COL),
      where('productId', '==', productId),
      where('isActive', '==', true),
    );
    const snap = await getDocs(q);

    let triggeredCount = 0;
    const now = new Date().toISOString();

    for (const d of snap.docs) {
      const alert = d.data() as PriceAlert;
      if (newPrice <= alert.targetPrice) {
        await deleteDoc(doc(db, COL, d.id));
        await createNotification(
          alert.userId,
          'price_drop',
          'Price Drop Alert!',
          `"${alert.productName}" is now ${newPrice.toFixed(2)} (was ${alert.currentPrice.toFixed(2)})`,
        );
        triggeredCount++;
      }
    }

    return triggeredCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return 0;
  }
}

export async function getActiveAlertCount(productId: string): Promise<number> {
  try {
    const q = query(
      collection(db, COL),
      where('productId', '==', productId),
      where('isActive', '==', true),
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    return 0;
  }
}
