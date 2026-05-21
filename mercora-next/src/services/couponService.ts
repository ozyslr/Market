'use client';

import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import { Coupon } from '@/types';

const COL = 'coupons';

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function createCoupon(data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Promise<Coupon> {
  try {
    const id = crypto.randomUUID();
    const coupon: Coupon = { ...data, id, usedCount: 0, createdAt: new Date().toISOString() };
    await setDoc(doc(db, COL, id), coupon);
    return coupon;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
    throw error;
  }
}

export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  try {
    const q = query(
      collection(db, COL),
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return { valid: false, error: 'coupon.invalid' };

    const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return { valid: false, error: 'coupon.expired' };

    if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses)
      return { valid: false, error: 'coupon.max_uses' };

    if (coupon.minOrderAmount !== undefined && orderTotal < coupon.minOrderAmount)
      return { valid: false, error: 'coupon.min_order' };

    return { valid: true, coupon };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return { valid: false, error: 'coupon.error' };
  }
}

export async function incrementCouponUsage(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), { usedCount: increment(1) });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
  }
}

export function calcDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === 'percentage') {
    return Math.round((subtotal * coupon.discountValue) / 100 * 100) / 100;
  }
  return Math.min(coupon.discountValue, subtotal);
}
