'use client';

import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
  query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import { createNotification } from '@/services/notificationService';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ModerationTarget = 'product' | 'review' | 'question' | 'seller';

export interface ModerationItem {
  id: string;
  targetId: string;
  targetType: ModerationTarget;
  targetName: string;
  submittedBy: string;
  reason: string;
  status: ModerationStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: ModerationTarget;
  reason: string;
  details?: string;
  createdAt: string;
}

const COL = 'moderation';
const REPORTS_COL = 'moderationReports';

export async function submitForReview(
  data: Omit<ModerationItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, COL), {
      ...data,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getPendingReviews(targetType?: ModerationTarget): Promise<ModerationItem[]> {
  try {
    const constraints: any[] = [where('status', '==', 'pending')];
    if (targetType) constraints.push(where('targetType', '==', targetType));
    constraints.push(orderBy('createdAt', 'asc'));
    const q = query(collection(db, COL), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ModerationItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function reviewItem(
  itemId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  reviewNote?: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, COL, itemId), {
      status,
      reviewedBy,
      reviewNote: reviewNote ?? null,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const item = (await getDocs(query(
      collection(db, COL),
      where('__name__', '==', itemId),
      limit(1),
    ))).docs[0]?.data() as ModerationItem | undefined;

    if (item && status === 'approved' && item.targetType === 'seller') {
      await updateDoc(doc(db, 'users', item.submittedBy), {
        sellerStatus: 'approved',
        updatedAt: new Date().toISOString(),
      });

      await createNotification(
        item.submittedBy,
        'moderation',
        'Seller Application Approved',
        'Your seller application has been approved. You can now start selling!',
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${itemId}`);
    throw error;
  }
}

export async function createReport(
  data: Omit<ModerationReport, 'id' | 'createdAt'>,
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, REPORTS_COL), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REPORTS_COL);
    throw error;
  }
}

export async function getReports(): Promise<ModerationReport[]> {
  try {
    const q = query(collection(db, REPORTS_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ModerationReport));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REPORTS_COL);
    return [];
  }
}

export async function deleteModerationItem(itemId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${itemId}`);
  }
}
