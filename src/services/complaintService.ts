import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Complaint {
  id: string;
  buyerId: string;
  orderId?: string;
  productId: string;
  reason: string;
  description: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fileComplaint(
  buyerId: string,
  productId: string,
  reason: string,
  description: string,
  orderId?: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'complaints'), {
    buyerId,
    productId,
    orderId: orderId || null,
    reason,
    description,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getComplaints(status?: string): Promise<Complaint[]> {
  try {
    let q = query(collection(db, 'complaints'));
    if (status) q = query(q, where('status', '==', status));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Complaint);
  } catch {
    return [];
  }
}

export async function resolveComplaint(
  complaintId: string,
  adminId: string,
  resolution: string,
): Promise<void> {
  const ref = doc(db, 'complaints', complaintId);
  await updateDoc(ref, {
    status: 'resolved',
    resolution,
    reviewedBy: adminId,
    updatedAt: new Date().toISOString(),
  });
}

export async function getComplaintsByProduct(productId: string): Promise<Complaint[]> {
  try {
    const q = query(collection(db, 'complaints'), where('productId', '==', productId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Complaint);
  } catch {
    return [];
  }
}
