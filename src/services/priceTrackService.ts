import {
  doc, setDoc, deleteDoc, getDocs,
  collection, query, where, getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COL = 'priceTracks';

export interface PriceTrack {
  userId: string;
  productId: string;
  targetPrice: number;
  originalPrice: number;
  addedAt: string;
}

function trackId(userId: string, productId: string) {
  return `${userId}_${productId}`;
}

export async function trackPrice(
  userId: string,
  productId: string,
  currentPrice: number,
  targetPrice = 0
): Promise<void> {
  await setDoc(doc(db, COL, trackId(userId, productId)), {
    userId,
    productId,
    targetPrice,
    originalPrice: currentPrice,
    addedAt: new Date().toISOString(),
  });
}

export async function untrackPrice(userId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, COL, trackId(userId, productId)));
}

export async function isTracking(userId: string, productId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COL, trackId(userId, productId)));
  return snap.exists();
}

export async function getUserTracks(userId: string): Promise<PriceTrack[]> {
  const q = query(collection(db, COL), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as PriceTrack);
}
