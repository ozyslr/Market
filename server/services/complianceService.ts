// Server-side compliance service — data deletion requests per D-08
import type { Firestore } from 'firebase-admin/firestore';

const DELETION_COL = 'dataDeletionRequests';

export interface DeletionRequest {
  requestId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export async function submitDeletionRequest(
  adminDb: Firestore,
  userId: string,
  reason: string,
): Promise<{ requestId: string }> {
  const ref = adminDb.collection(DELETION_COL).doc();
  const now = new Date().toISOString();
  await ref.set({
    requestId: ref.id,
    userId,
    reason,
    status: 'pending',
    createdAt: now,
  });
  return { requestId: ref.id };
}

export async function getDeletionRequests(
  adminDb: Firestore,
  status?: string,
): Promise<DeletionRequest[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(DELETION_COL);
  if (status) query = query.where('status', '==', status);
  const snap = await query.orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => d.data() as DeletionRequest);
}

export async function approveDeletion(
  adminDb: Firestore,
  requestId: string,
  processedBy: string,
): Promise<void> {
  const ref = adminDb.collection(DELETION_COL).doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Request not found');
  const data = snap.data()!;
  const userId = data.userId;
  const now = new Date().toISOString();

  // Anonymize user orders (keep order data, remove PII - per D-08)
  const orderSetsSnap = await adminDb.collection('orderSets').where('userId', '==', userId).get();

  const batch = adminDb.batch();
  orderSetsSnap.docs.forEach((doc) => {
    batch.update(doc.ref, { userId: null, userEmail: null, updatedAt: now });
  });

  // Also anonymize old orders collection
  const ordersSnap = await adminDb.collection('orders').where('buyerId', '==', userId).get();
  ordersSnap.docs.forEach((doc) => {
    batch.update(doc.ref, { buyerId: null, userEmail: null, updatedAt: now });
  });

  // Remove PII from user profile
  const userRef = adminDb.collection('users').doc(userId);
  batch.update(userRef, {
    name: 'Silinmis Kullanici',
    email: null,
    phone: null,
    photoURL: null,
    preferences: {},
    status: 'deleted',
    deletedAt: now,
  });

  // Update deletion request
  batch.update(ref, { status: 'approved', processedBy, processedAt: now });

  await batch.commit();
}

export async function rejectDeletion(
  adminDb: Firestore,
  requestId: string,
  reason: string,
  processedBy: string,
): Promise<void> {
  const ref = adminDb.collection(DELETION_COL).doc(requestId);
  const now = new Date().toISOString();
  await ref.update({
    status: 'rejected',
    rejectionReason: reason,
    processedBy,
    processedAt: now,
  });
}
