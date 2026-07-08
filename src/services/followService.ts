import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const followDoc = (userId: string) => doc(db, 'follows', userId);

export async function getFollowedSellers(userId: string): Promise<string[]> {
  try {
    const snap = await getDoc(followDoc(userId));
    return snap.exists() ? ((snap.data().sellerIds as string[]) ?? []) : [];
  } catch {
    return [];
  }
}

export async function followSeller(userId: string, sellerId: string): Promise<void> {
  await setDoc(followDoc(userId), {
    sellerIds: arrayUnion(sellerId),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function unfollowSeller(userId: string, sellerId: string): Promise<void> {
  await setDoc(followDoc(userId), {
    sellerIds: arrayRemove(sellerId),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
