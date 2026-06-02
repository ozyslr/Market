import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus } from '../types/order';
import { createNotification } from './notificationService';
import { restoreProductStock } from './productService';

import type { OrderSet, SubOrder, TransitionEvent } from '../types/order';

const ORDERS_COLLECTION = 'orders';

export type Unsubscribe = () => void;

/**
 * Subscribe to real-time order updates for a seller.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeOrdersBySeller(
  sellerId: string,
  onOrders: (orders: Order[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('sellerIds', 'array-contains', sellerId),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
      onOrders(orders);
    },
    (error) => {
      console.error('[orderService] subscribeOrdersBySeller error:', error);
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
      onError?.(error);
    },
  );
}

/**
 * Subscribe to all orders in real-time (admin view).
 * Returns an unsubscribe function.
 */
export function subscribeAllOrders(
  onOrders: (orders: Order[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
      onOrders(orders);
    },
    (error) => {
      console.error('[orderService] subscribeAllOrders error:', error);
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
      onError?.(error);
    },
  );
}

/**
 * Subscribe to real-time order updates for a buyer.
 * Returns an unsubscribe function.
 */
export function subscribeOrdersByUser(
  userId: string,
  onOrders: (orders: Order[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
      onOrders(orders);
    },
    (error) => {
      console.error('[orderService] subscribeOrdersByUser error:', error);
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
      onError?.(error);
    },
  );
}

export async function createOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Order> {
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: now,
      updatedAt: now,
    });
    return { ...orderData, id: docRef.id, createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
    throw error;
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const snap = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ORDERS_COLLECTION}/${orderId}`);
    return null;
  }
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    return [];
  }
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('sellerIds', 'array-contains', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    return [];
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    return [];
  }
}

const STATUS_NOTIFY: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  processing: { title: 'Siparişiniz Hazırlanıyor', message: 'Siparişiniz hazırlanıyor.' },
  shipped: { title: 'Siparişiniz Kargoya Verildi', message: 'Siparişiniz kargoya verildi.' },
  delivered: { title: 'Siparişiniz Teslim Edildi', message: 'Siparişiniz teslim edildi.' },
  cancelled: { title: 'Siparişiniz İptal Edildi', message: 'Siparişiniz iptal edildi.' },
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra?: Partial<Order>,
): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status,
      updatedAt: new Date().toISOString(),
      ...(extra || {}),
    });

    // Restore stock when order is cancelled or refunded
    if (status === 'cancelled' || status === 'refunded') {
      const order = await getOrderById(orderId);
      if (order && order.items.length > 0) {
        await restoreProductStock(
          order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        );
      }
    }

    const msg = STATUS_NOTIFY[status];
    if (msg) {
      const order = await getOrderById(orderId);
      if (order?.userId) {
        // Kargoya verildiğinde takip bilgisini bildirime ekle
        let message = msg.message;
        if (status === 'shipped') {
          const carrier = (extra?.carrier as string) || order.carrier;
          const tracking = (extra?.trackingNumber as string) || order.trackingNumber;
          if (carrier && tracking) {
            message = `${carrier} ile yola çıktı. Takip No: ${tracking}`;
          }
        }
        await createNotification(
          order.userId,
          'order_status',
          msg.title,
          message,
          `/orders/${orderId}`,
        );
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

/**
 * Issue a real refund for an order via the admin-protected server endpoint.
 * Sends the caller's Firebase ID token; the server verifies admin role and
 * processes the Stripe refund, then marks the order refunded.
 * @param amount Optional partial-refund amount (major units). Omit for full refund.
 */
export async function issueRefund(
  orderId: string,
  amount?: number,
): Promise<{ refundId: string | null; amount: number }> {
  const { getAuth } = await import('firebase/auth');
  const current = getAuth().currentUser;
  if (!current) throw new Error('Oturum bulunamadı');
  const token = await current.getIdToken();
  const res = await fetch('/api/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, ...(amount !== undefined ? { amount } : {}) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'İade işlemi başarısız');
  return { refundId: data.refundId ?? null, amount: data.amount ?? 0 };
}

export interface BatchOrderUpdate {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
}

export interface BatchUpdateResult {
  successCount: number;
  failCount: number;
  errors: { orderId: string; error: string }[];
}

/**
 * Atomically update multiple orders at once using a batched write.
 * For "shipped" status, includes trackingNumber and carrier in the same batch.
 * Supports up to 500 orders per batch (Firestore limit).
 */
export async function batchUpdateOrders(updates: BatchOrderUpdate[]): Promise<BatchUpdateResult> {
  if (updates.length === 0) return { successCount: 0, failCount: 0, errors: [] };
  if (updates.length > 500) {
    throw new Error('En fazla 500 sipariş aynı anda güncellenebilir.');
  }

  const result: BatchUpdateResult = { successCount: 0, failCount: 0, errors: [] };
  const now = new Date().toISOString();
  const batch = writeBatch(db);

  // Prepare all writes first
  const validUpdates: { orderId: string; status: OrderStatus; extra: Record<string, any> }[] = [];

  for (const update of updates) {
    const extra: Record<string, any> = {};
    if (update.status === 'shipped') {
      extra.shippedAt = now;
      if (update.trackingNumber) extra.trackingNumber = update.trackingNumber;
      if (update.carrier) extra.carrier = update.carrier;
    }

    batch.update(doc(db, ORDERS_COLLECTION, update.orderId), {
      status: update.status,
      updatedAt: now,
      ...extra,
    });

    validUpdates.push({ orderId: update.orderId, status: update.status, extra });
  }

  // Execute batch
  try {
    await batch.commit();
    result.successCount = validUpdates.length;

    // Send notifications and restore stock after successful batch
    for (const { orderId, status, extra } of validUpdates) {
      // Restore stock for cancelled/refunded
      if (status === 'cancelled' || status === 'refunded') {
        try {
          const order = await getOrderById(orderId);
          if (order && order.items.length > 0) {
            await restoreProductStock(
              order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            );
          }
        } catch {
          /* stock restore failure shouldn't block the batch result */
        }
      }

      // Send notification
      const msg = STATUS_NOTIFY[status];
      if (msg) {
        try {
          const order = await getOrderById(orderId);
          if (order?.userId) {
            await createNotification(
              order.userId,
              'order_status',
              msg.title,
              msg.message,
              `/orders/${orderId}`,
            );
          }
        } catch {
          /* notification failure shouldn't block */
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/batch`);
    result.failCount = updates.length;
    result.errors = updates.map((u) => ({ orderId: u.orderId, error: 'Batch write failed' }));
  }

  return result;
}

// ─── OrderSet / SubOrder API Functions (Order Walking Skeleton) ─────────────

/**
 * Create an OrderSet via the server API.
 * Sends the buyer's Firebase ID token for server-side verification.
 */
export async function createOrderSet(
  items: Array<{
    productId: string;
    sellerId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>,
  currency: string,
  shippingAddress: any,
): Promise<OrderSet> {
  const { getAuth } = await import('firebase/auth');
  const current = getAuth().currentUser;
  if (!current) throw new Error('Oturum bulunamadi');
  const token = await current.getIdToken();

  const res = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items, currency, shippingAddress }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Siparis olusturulamadi');
  return data as OrderSet;
}

/**
 * Fetch all OrderSets for the current user via the server API.
 */
export async function getUserOrderSets(): Promise<OrderSet[]> {
  const { getAuth } = await import('firebase/auth');
  const current = getAuth().currentUser;
  if (!current) return [];
  const token = await current.getIdToken();

  const res = await fetch('/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Siparisler yuklenemedi');
  }
  return res.json();
}

/**
 * Fetch a single OrderSet with SubOrders via the server API.
 */
export async function getOrderSetDetail(
  orderSetId: string,
): Promise<OrderSet & { subOrders: SubOrder[] }> {
  const { getAuth } = await import('firebase/auth');
  const current = getAuth().currentUser;
  if (!current) throw new Error('Oturum bulunamadi');
  const token = await current.getIdToken();

  const res = await fetch(`/api/orders/${orderSetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('Siparis bulunamadi');
    if (res.status === 403) throw new Error('Bu siparise erisim izniniz yok');
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Siparis detayi yuklenemedi');
  }
  return res.json();
}

/**
 * Transition a SubOrder's status (seller action, e.g. mark_shipped).
 * Calls POST /api/orders/:orderSetId/subOrders/:subOrderId/transition with Firebase auth.
 */
export async function transitionSubOrderStatus(
  orderSetId: string,
  subOrderId: string,
  event: string,
  extra?: Record<string, unknown>,
): Promise<{ success: boolean; status: string }> {
  const { getAuth } = await import('firebase/auth');
  const current = getAuth().currentUser;
  if (!current) throw new Error('Oturum bulunamadi');
  const token = await current.getIdToken();

  const res = await fetch(`/api/orders/${orderSetId}/subOrders/${subOrderId}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ event, ...extra }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Durum gecisi basarisiz oldu');
  }
  return res.json();
}
