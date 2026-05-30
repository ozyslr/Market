import { collection, doc, getDocs, addDoc, updateDoc, query, where, orderBy, runTransaction } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { createNotification } from './notificationService';
import { restoreProductStock } from './productService';

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

  // Automation fields
  /** Auto-generated return code (e.g. RTN-A3X9K2) */
  returnCode?: string;
  /** Whether this return was auto-approved */
  autoApproved?: boolean;
  /** Auto-approval reason */
  autoApprovalReason?: string;
  /** Status timeline */
  timeline?: { status: ReturnStatus; timestamp: string; note?: string }[];
  /** Return window expiry (14 days from delivery) */
  returnWindowExpiry?: string;
  /** Return labels/carrier info */
  shippingLabel?: string;
  carrierCode?: string;

  createdAt: string;
  updatedAt: string;
}

const COL = 'returnRequests';
const RETURN_WINDOW_DAYS = 14;
const AUTO_APPROVE_THRESHOLD_DAYS = 7;

/** Generate unique return code: RTN-XXXXXX */
function generateReturnCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `RTN-${code}`;
}

function isWithinReturnWindow(orderCreatedAt: string): boolean {
  const orderDate = new Date(orderCreatedAt);
  const deadline = new Date(orderDate);
  deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);
  return new Date() <= deadline;
}

function shouldAutoApprove(orderCreatedAt: string, refundAmount: number): boolean {
  if (!isWithinReturnWindow(orderCreatedAt)) return false;
  const orderDate = new Date(orderCreatedAt);
  const cutoff = new Date(orderDate);
  cutoff.setDate(cutoff.getDate() + AUTO_APPROVE_THRESHOLD_DAYS);
  // Auto-approve if within 7 days and refund < 5000 TRY
  return new Date() <= cutoff && refundAmount <= 5000;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createReturnRequest(
  data: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt' | 'returnCode' | 'timeline' | 'autoApproved' | 'autoApprovalReason'>,
  orderCreatedAt: string,
): Promise<ReturnRequest> {
  try {
    const now = new Date().toISOString();
    const returnCode = generateReturnCode();
    const refundAmount = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const autoApproved = shouldAutoApprove(orderCreatedAt, refundAmount);
    const returnWindowExpiry = new Date(
      new Date(orderCreatedAt).getTime() + RETURN_WINDOW_DAYS * 86_400_000
    ).toISOString();

    const status: ReturnStatus = autoApproved ? 'approved' : 'requested';

    const timeline = [
      {
        status: status as ReturnStatus,
        timestamp: now,
        note: autoApproved
          ? `İade kodu ${returnCode} — otomatik onaylandı (7 gün içinde, ${refundAmount.toFixed(2)} ₺)`
          : `İade kodu ${returnCode} — manuel onay bekliyor`,
      },
    ];

    const docData = {
      ...data,
      status,
      returnCode,
      autoApproved,
      autoApprovalReason: autoApproved
        ? `7 gün içinde talep edildi, tutar ${refundAmount.toFixed(2)} ₺ (max 5.000 ₺)`
        : undefined,
      timeline,
      refundAmount,
      returnWindowExpiry,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await addDoc(collection(db, COL), docData);

    // Notify seller
    if (data.sellerId) {
      await createNotification(
        data.sellerId, 'order_status',
        autoApproved ? 'İade Otomatik Onaylandı' : 'Yeni İade Talebi',
        `${data.userEmail} — ${data.items.map(i => i.name).join(', ')} — ${returnCode}`,
        '/seller/orders',
      );
    }

    // Notify buyer
    if (data.userId) {
      await createNotification(
        data.userId, 'order_status',
        autoApproved ? 'İadeniz Onaylandı' : 'İade Talebiniz Alındı',
        `İade kodunuz: ${returnCode}${autoApproved ? ' — iade kargoya verilebilir' : ' — onay sürecinde'}`,
        `/orders/${data.orderId}`,
      );
    }

    return { id: ref.id, ...docData } as ReturnRequest;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getReturnRequests(sellerId: string, status?: ReturnStatus): Promise<ReturnRequest[]> {
  try {
    const ref = collection(db, COL);
    const constraints = [where('sellerId', '==', sellerId)];
    if (status) constraints.push(where('status', '==', status));
    constraints.push(orderBy('createdAt', 'desc') as any);
    const q = query(ref, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getUserReturnRequests(userId: string): Promise<ReturnRequest[]> {
  try {
    const ref = collection(db, COL);
    const q = query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc'));
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

    // Get the existing return request for timeline and notifications
    const snap = await getDocs(query(collection(db, COL), where('__name__', '==', returnId)));
    let existing: ReturnRequest | null = null;
    if (!snap.empty) {
      existing = { id: snap.docs[0].id, ...snap.docs[0].data() } as ReturnRequest;
    }

    // Append timeline entry
    const timelineEntry = { status, timestamp: now, note: resolution || undefined };
    const timeline = existing?.timeline
      ? [...existing.timeline, timelineEntry]
      : [timelineEntry];

    await updateDoc(doc(db, COL, returnId), {
      status,
      updatedAt: now,
      resolution: resolution || null,
      refundAmount: refundAmount ?? null,
      timeline,
    });

    // Auto-restore stock when refunded
    if (status === 'refunded' && existing) {
      try {
        await restoreProductStock(
          existing.items.map(item => ({ productId: item.productId, quantity: item.quantity }))
        );
      } catch { /* non-blocking */ }
    }

    // Notify buyer
    if (existing?.userId) {
      const statusMessages: Partial<Record<ReturnStatus, { title: string; message: string }>> = {
        approved: { title: 'İadeniz Onaylandı', message: `İade kodunuz: ${existing.returnCode} — kargoya verebilirsiniz.` },
        rejected: { title: 'İadeniz Reddedildi', message: resolution || `İade talebiniz reddedildi. Kod: ${existing.returnCode}` },
        refunded: { title: 'İadeniz Tamamlandı', message: `${(refundAmount ?? existing.refundAmount ?? 0).toFixed(2)} ₺ iade edildi. Kod: ${existing.returnCode}` },
        received: { title: 'İadeniz Teslim Alındı', message: `İade paketiniz teslim alındı. Kod: ${existing.returnCode}` },
      };
      const msg = statusMessages[status];
      if (msg) {
        await createNotification(existing.userId, 'order_status', msg.title, msg.message, `/orders/${existing.orderId}`);
      }
    }

    // Notify seller
    if (existing?.sellerId) {
      const sellerMessages: Partial<Record<ReturnStatus, { title: string }>> = {
        received: { title: 'İade Paketi Teslim Alındı' },
        refunded: { title: 'İade Tamamlandı' },
      };
      const msg = sellerMessages[status];
      if (msg) {
        await createNotification(
          existing.sellerId, 'order_status',
          msg.title,
          `${existing.userEmail} — ${existing.returnCode} — ${(refundAmount ?? existing.refundAmount ?? 0).toFixed(2)} ₺`,
          '/seller/orders',
        );
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${returnId}`);
    throw error;
  }
}
