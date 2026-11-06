import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COL = 'priceAlerts';

export interface PriceAlert {
  userId: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
}

function alertId(userId: string, productId: string): string {
  return `${userId}_${productId}`;
}

export async function trackPrice(
  userId: string,
  productId: string,
  targetPrice: number,
): Promise<void> {
  await setDoc(doc(db, COL, alertId(userId, productId)), {
    userId,
    productId,
    targetPrice,
    createdAt: new Date().toISOString(),
  });
}

export async function untrackPrice(userId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, COL, alertId(userId, productId)));
}

export async function isTrackingPrice(userId: string, productId: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, COL, alertId(userId, productId)));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getTrackedProducts(userId: string): Promise<string[]> {
  try {
    const q = query(collection(db, COL), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => (d.data() as PriceAlert).productId);
  } catch {
    return [];
  }
}

export async function getPriceAlert(userId: string, productId: string): Promise<PriceAlert | null> {
  try {
    const snap = await getDoc(doc(db, COL, alertId(userId, productId)));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as PriceAlert & { id: string };
  } catch {
    return null;
  }
}
