'use client';

import { collection, doc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'pickup_scheduled' | 'received' | 'refunded' | 'closed';

export interface ReturnRequest {
  id: string;
  orderId: string;
  sellerId: string;
  userId: string;
  userEmail: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  reason: string;
  details?: string;
  status: ReturnStatus;
  resolution?: string;
  refundAmount?: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

const COL = 'returnRequests';

export async function createReturnRequest(data: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, COL), { ...data, createdAt: now, updatedAt: now });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getReturnRequests(sellerId: string, status?: ReturnStatus): Promise<ReturnRequest[]> {
  try {
    const ref = collection(db, COL);
    const constraints: any[] = [where('sellerId', '==', sellerId)];
    if (status) constraints.push(where('status', '==', status));
    constraints.push(orderBy('createdAt', 'desc'));
    const q = query(ref, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getAllReturnRequests(status?: ReturnStatus): Promise<ReturnRequest[]> {
  try {
    const ref = collection(db, COL);
    const constraints: any[] = [];
    if (status) constraints.push(where('status', '==', status));
    constraints.push(orderBy('createdAt', 'desc'));
    const q = query(ref, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function updateReturnStatus(
  returnId: string,
  status: ReturnStatus,
  resolution?: string,
  refundAmount?: number,
): Promise<void> {
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, COL, returnId), {
      status,
      updatedAt: now,
      resolution: resolution || null,
      refundAmount,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${returnId}`);
    throw error;
  }
}
