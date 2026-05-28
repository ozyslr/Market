import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus } from '../types/order';
import { createNotification } from './notificationService';
import { restoreProductStock } from './productService';

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
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
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
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
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
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
      onOrders(orders);
    },
    (error) => {
      console.error('[orderService] subscribeOrdersByUser error:', error);
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
      onError?.(error);
    },
  );
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
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
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
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
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    return [];
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    return [];
  }
}

const STATUS_NOTIFY: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  processing: { title: 'Siparişiniz İşleme Alındı', message: 'Siparişiniz hazırlanmaya başlandı.' },
  shipped:    { title: 'Siparişiniz Kargoya Verildi', message: 'Siparişiniz kargoya teslim edildi.' },
  delivered:  { title: 'Siparişiniz Teslim Edildi', message: 'Siparişiniz başarıyla teslim edildi.' },
  cancelled:  { title: 'Siparişiniz İptal Edildi', message: 'Siparişiniz iptal edildi.' },
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra?: Partial<Order>
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
          order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        );
      }
    }

    const msg = STATUS_NOTIFY[status];
    if (msg) {
      const order = await getOrderById(orderId);
      if (order?.userId) {
        await createNotification(order.userId, 'order_status', msg.title, msg.message, `/orders/${orderId}`);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
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
              order.items.map(item => ({ productId: item.productId, quantity: item.quantity }))
            );
          }
        } catch { /* stock restore failure shouldn't block the batch result */ }
      }

      // Send notification
      const msg = STATUS_NOTIFY[status];
      if (msg) {
        try {
          const order = await getOrderById(orderId);
          if (order?.userId) {
            await createNotification(order.userId, 'order_status', msg.title, msg.message, `/orders/${orderId}`);
          }
        } catch { /* notification failure shouldn't block */ }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/batch`);
    result.failCount = updates.length;
    result.errors = updates.map(u => ({ orderId: u.orderId, error: 'Batch write failed' }));
  }

  return result;
}
