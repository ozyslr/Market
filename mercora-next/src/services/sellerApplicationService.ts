'use client';

import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export interface SellerApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  storeName: string;
  slug: string;
  phone: string;
  origin: string;
  taxId?: string;
  businessRegistration?: string;
  website?: string;
  socialMedia?: { platform: string; url: string }[];
  productCategories: string[];
  monthlySalesTarget: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

const COL = 'sellerApplications';

export async function submitApplication(data: Omit<SellerApplication, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const id = `app-${Date.now()}`;
  try {
    await setDoc(doc(db, COL, id), {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COL);
    throw error;
  }
}

export async function getApplications(status?: 'pending' | 'approved' | 'rejected'): Promise<SellerApplication[]> {
  try {
    const ref = collection(db, COL);
    const q = status ? query(ref, where('status', '==', status)) : ref;
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SellerApplication));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function reviewApplication(
  id: string,
  status: 'approved' | 'rejected',
  adminNote: string,
  reviewedBy: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), {
      status,
      adminNote,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deleteApplication(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
  }
}
