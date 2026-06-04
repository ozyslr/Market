import {
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export type NotificationType =
  | 'order_status'
  | 'price_drop'
  | 'back_in_stock'
  | 'review_approved'
  | 'new_question'
  | 'payout'
  | 'moderation'
  | 'admin_alert';

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
      userId,
      type,
      title,
      message,
      link: link ?? null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
  // Fire-and-forget push notification
  try {
    const { queuePushNotification } = await import('./pushNotificationService');
    queuePushNotification(userId, title, message, link).catch(() => {});
  } catch {
    /* push service unavailable */
  }
}

export async function notifyAdmins(
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    await Promise.all(snap.docs.map((d) => createNotification(d.id, type, title, message, link)));
  } catch {
    /* admin notification failure must never block the caller */
  }
}

export async function getUserNotifications(userId: string, maxCount = 50): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(maxCount),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Notification, 'id'>),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications/markAllRead');
  }
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/**
 * Convenience: notify a buyer when their order status changes.
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  status: string,
): Promise<void> {
  const statusLabels: Record<string, { title: string; message: string }> = {
    processing: { title: 'Siparişiniz Hazırlanıyor', message: 'Siparişiniz hazırlanıyor.' },
    shipped: { title: 'Siparişiniz Kargoya Verildi', message: 'Siparişiniz kargoya verildi.' },
    delivered: { title: 'Siparişiniz Teslim Edildi', message: 'Siparişiniz teslim edildi.' },
    cancelled: { title: 'Siparişiniz İptal Edildi', message: 'Siparişiniz iptal edildi.' },
  };
  const label = statusLabels[status];
  if (!label) return;
  await createNotification(
    userId,
    'order_status',
    label.title,
    label.message,
    `/orders/${orderId}`,
  );
}

/**
 * Convenience: notify a user when a product they are watching drops in price.
 */
export async function notifyPriceDrop(
  userId: string,
  productTitle: string,
  oldPrice: number,
  newPrice: number,
): Promise<void> {
  const dropPercent = Math.round((1 - newPrice / oldPrice) * 100);
  await createNotification(
    userId,
    'price_drop',
    'Fiyat Düştü!',
    `${productTitle} — %${dropPercent} indirim: ${oldPrice.toFixed(2)} → ${newPrice.toFixed(2)}`,
    undefined,
  );
}

/**
 * Convenience: notify a user when an out-of-stock product becomes available again.
 */
export async function notifyStockAvailable(userId: string, productTitle: string): Promise<void> {
  await createNotification(
    userId,
    'back_in_stock',
    'Tekrar Stokta',
    `${productTitle} ürünü tekrar stoklarımıza girdi.`,
    undefined,
  );
}
