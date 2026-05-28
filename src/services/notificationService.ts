import {
  collection, query, where, limit,
  getDocs, addDoc, updateDoc, doc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export type NotificationType =
  | 'order_status'
  | 'price_drop'
  | 'back_in_stock'
  | 'review_approved'
  | 'payout'
  | 'moderation';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId, type, title, message,
      link: link ?? null, read: false, createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
  // Fire-and-forget push notification
  try {
    const { queuePushNotification } = await import('./pushNotificationService');
    queuePushNotification(userId, title, message, link).catch(() => {});
  } catch { /* push service unavailable */ }
}

export async function getUserNotifications(userId: string, maxCount = 20): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(maxCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Notification, 'id'>),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'notifications');
    return [];
  }
}

export async function markAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications/markAllRead');
  }
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.read).length;
}
