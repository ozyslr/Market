import {
  collection, addDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { createNotification } from './notificationService';

const HISTORY_COLLECTION = 'price_history';

export interface PriceEntry {
  id: string;
  productId: string;
  price: number;
  recordedAt: string;
}

export async function recordPrice(productId: string, price: number): Promise<void> {
  try {
    await addDoc(collection(db, HISTORY_COLLECTION), {
      productId,
      price,
      recordedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, HISTORY_COLLECTION);
  }
}

export async function getPriceHistory(productId: string, maxCount = 30): Promise<PriceEntry[]> {
  try {
    const q = query(
      collection(db, HISTORY_COLLECTION),
      where('productId', '==', productId),
      orderBy('recordedAt', 'desc'),
      limit(maxCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      productId: d.data().productId,
      price: d.data().price,
      recordedAt: d.data().recordedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, HISTORY_COLLECTION);
    return [];
  }
}

export async function getLowestPrice(productId: string): Promise<number | null> {
  const history = await getPriceHistory(productId, 90);
  if (history.length === 0) return null;
  return Math.min(...history.map(h => h.price));
}

export async function checkAndNotifyPriceDrop(
  productId: string,
  productTitle: string,
  newPrice: number,
  watcherUserIds: string[],
): Promise<void> {
  if (watcherUserIds.length === 0) return;
  const history = await getPriceHistory(productId, 2);
  // Need at least one previous entry to compare
  if (history.length < 2) return;
  const previousPrice = history[1].price;
  if (newPrice >= previousPrice) return;

  await Promise.all(
    watcherUserIds.map(userId =>
      createNotification(
        userId,
        'price_drop',
        'Fiyat Düştü!',
        `${productTitle} ürününün fiyatı ${previousPrice} ₺'den ${newPrice} ₺'ye düştü.`,
        `/product/${productId}`,
      )
    )
  );
}
