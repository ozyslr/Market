import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SellerCoupon {
  id?: string;
  sellerId: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  productIds?: string[];
  startsAt: string;
  expiresAt: string;
  enabled: boolean;
  createdAt: string;
}

export async function createCoupon(
  coupon: Omit<SellerCoupon, 'id' | 'usedCount' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'sellerCoupons'), {
    ...coupon,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getSellerCoupons(sellerId: string): Promise<SellerCoupon[]> {
  try {
    const q = query(collection(db, 'sellerCoupons'), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerCoupon);
  } catch {
    return [];
  }
}

export async function updateCoupon(id: string, updates: Partial<SellerCoupon>): Promise<void> {
  const ref = doc(db, 'sellerCoupons', id);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
}

export async function validateCoupon(
  code: string,
  orderAmount: number,
  sellerId?: string,
): Promise<{ valid: boolean; coupon?: SellerCoupon; discount?: number }> {
  try {
    const q = query(
      collection(db, 'sellerCoupons'),
      where('code', '==', code),
      where('enabled', '==', true),
    );
    const snap = await getDocs(q);
    if (snap.empty) return { valid: false };

    const coupon = snap.docs[0].data() as SellerCoupon;
    const now = new Date().toISOString();

    if (coupon.expiresAt < now) return { valid: false };
    if (coupon.startsAt > now) return { valid: false };
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false };
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) return { valid: false };
    if (sellerId && coupon.sellerId !== sellerId) return { valid: false };

    const discount =
      coupon.type === 'percentage'
        ? (orderAmount * coupon.value) / 100
        : Math.min(coupon.value, orderAmount);

    return { valid: true, coupon: { ...coupon, id: snap.docs[0].id }, discount };
  } catch {
    return { valid: false };
  }
}
