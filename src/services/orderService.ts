import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus } from '../types/order';
import { createNotification } from './notificationService';

const ORDERS_COLLECTION = 'orders';

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
