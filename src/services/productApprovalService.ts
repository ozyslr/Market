import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ApprovalEntry {
  id: string;
  productId: string;
  sellerId: string;
  sellerName: string;
  productTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  autoApproved: boolean;
  fraudScore?: number;
  fraudFlags?: string[];
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getPendingApprovals(): Promise<ApprovalEntry[]> {
  try {
    const q = query(collection(db, 'productApprovals'), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApprovalEntry);
  } catch {
    return [];
  }
}

export async function approveProduct(approvalId: string, adminId: string): Promise<void> {
  const ref = doc(db, 'productApprovals', approvalId);
  await updateDoc(ref, {
    status: 'approved',
    reviewedBy: adminId,
    updatedAt: new Date().toISOString(),
  });
  // Update the actual product status to 'approved'
  const snap = await getDocs(
    query(collection(db, 'productApprovals'), where('__name__', '==', approvalId)),
  );
  if (!snap.empty) {
    const entry = snap.docs[0].data() as ApprovalEntry;
    const prodRef = doc(db, 'products', entry.productId);
    await updateDoc(prodRef, { status: 'approved', updatedAt: new Date().toISOString() });
  }
}

export async function rejectProduct(
  approvalId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const ref = doc(db, 'productApprovals', approvalId);
  await updateDoc(ref, {
    status: 'rejected',
    reviewedBy: adminId,
    reviewNote: reason,
    updatedAt: new Date().toISOString(),
  });
}

export async function submitForApproval(
  productId: string,
  sellerId: string,
  sellerName: string,
  productTitle: string,
  fraudInfo?: { score: number; flags: string[] },
): Promise<void> {
  await addDoc(collection(db, 'productApprovals'), {
    productId,
    sellerId,
    sellerName,
    productTitle,
    status: 'pending',
    autoApproved: false,
    fraudScore: fraudInfo?.score || 0,
    fraudFlags: fraudInfo?.flags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
