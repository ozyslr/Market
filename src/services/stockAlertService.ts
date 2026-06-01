import {
  doc, setDoc, deleteDoc, getDoc, getDocs,
  collection, query, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from './notificationService';
import { Product } from '@/types';

const COL = 'stockAlerts';

export interface StockAlert {
  userId: string;
  productId: string;
  createdAt: string;
  notified: boolean;
}

function alertId(userId: string, productId: string): string {
  return `${userId}_${productId}`;
}

export async function subscribeToStockAlert(
  userId: string,
  productId: string,
): Promise<void> {
  await setDoc(doc(db, COL, alertId(userId, productId)), {
    userId,
    productId,
    createdAt: new Date().toISOString(),
    notified: false,
  });
}

export async function unsubscribeFromStockAlert(
  userId: string,
  productId: string,
): Promise<void> {
  await deleteDoc(doc(db, COL, alertId(userId, productId)));
}

export async function isSubscribedToStockAlert(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, COL, alertId(userId, productId)));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function checkAndNotifyStockAlerts(productId: string): Promise<void> {
  try {
    const q = query(
      collection(db, COL),
      where('productId', '==', productId),
      where('notified', '==', false),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const productSnap = await getDoc(doc(db, 'products', productId));
    if (!productSnap.exists()) return;
    const product = { id: productSnap.id, ...productSnap.data() } as Product;
    if ((product.stock ?? 0) <= 0) return;

    const link = `/product/${product.slug}`;
    await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data() as StockAlert;
        await createNotification(
          data.userId,
          'back_in_stock',
          'Tekrar Stokta!',
          `${product.title} tekrar stoklarımıza girdi. Hemen sipariş verebilirsiniz.`,
          link,
        );
        await setDoc(doc(db, COL, d.id), { notified: true }, { merge: true });
      }),
    );
  } catch (error) {
    console.error('[stockAlertService] checkAndNotifyStockAlerts error:', error);
  }
}
