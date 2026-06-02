// ─── Server-side Order Service ───────────────────────────────────────────────
// Handles OrderSet + SubOrder creation and retrieval using the Firebase Admin SDK.
// All writes go through adminDb (bypasses security rules).

import { adminDb } from '../../src/lib/firebase-admin.js';
import { transitionOrder, InvalidTransitionError } from './transitionEngine.js';
import type { OrderSetStatus, SubOrderStatus, TransitionEvent } from './transitionEngine.js';

const ORDER_SETS_COLLECTION = 'orderSets';
const SUB_ORDERS_COLLECTION = 'subOrders';

/** Minimal item shape expected from the client POST body. */
interface CreateItemInput {
  productId: string;
  sellerId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface ShippingAddressInput {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CreateOrderSetInput {
  userId: string;
  userEmail: string;
  items: CreateItemInput[];
  shippingAddress: ShippingAddressInput;
  currency: string;
}

interface SubOrderDoc {
  sellerId: string;
  items: CreateItemInput[];
  subtotal: number;
  shippingCost: number;
  commission: number;
  payoutAmount: number;
  status: SubOrderStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderSetDoc {
  userId: string;
  userEmail: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  subOrderIds: string[];
  status: OrderSetStatus;
  shippingAddress: ShippingAddressInput;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create an OrderSet with one or more SubOrders in a single Firestore transaction.
 * Items are grouped by sellerId — each group becomes a SubOrder.
 */
export async function createOrderSet(data: CreateOrderSetInput) {
  if (!adminDb) throw new Error('Firebase Admin not initialized');

  const now = new Date().toISOString();

  // Group items by sellerId
  const sellerGroups = new Map<string, CreateItemInput[]>();
  for (const item of data.items) {
    const existing = sellerGroups.get(item.sellerId) || [];
    existing.push(item);
    sellerGroups.set(item.sellerId, existing);
  }

  // Calculate totals
  const subOrderTotals: { sellerId: string; subtotal: number }[] = [];
  let totalAmount = 0;

  for (const [sellerId, items] of sellerGroups.entries()) {
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    subOrderTotals.push({ sellerId, subtotal });
    totalAmount += subtotal;
  }

  // Create documents inside a transaction
  const orderSetRef = adminDb.collection(ORDER_SETS_COLLECTION).doc();
  const subOrderRefs = subOrderTotals.map(() => adminDb.collection(SUB_ORDERS_COLLECTION).doc());
  const subOrderIds = subOrderRefs.map((ref) => ref.id);

  await adminDb.runTransaction(async (txn) => {
    // Create OrderSet
    const orderSetDoc: OrderSetDoc = {
      userId: data.userId,
      userEmail: data.userEmail,
      totalAmount,
      currency: data.currency,
      paymentMethod: 'manual',
      paymentStatus: 'pending',
      subOrderIds,
      status: 'pending',
      shippingAddress: data.shippingAddress,
      createdAt: now,
      updatedAt: now,
    };
    txn.set(orderSetRef, orderSetDoc);

    // Create SubOrders
    let idx = 0;
    for (const [sellerId, items] of sellerGroups.entries()) {
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const subOrderDoc: SubOrderDoc = {
        sellerId,
        items,
        subtotal,
        shippingCost: 0,
        commission: 0,
        payoutAmount: subtotal,
        status: 'pending',
        version: 0,
        createdAt: now,
        updatedAt: now,
      };
      txn.set(subOrderRefs[idx], subOrderDoc);
      idx++;
    }
  });

  return {
    id: orderSetRef.id,
    totalAmount,
    currency: data.currency,
    subOrderIds,
    status: 'pending' as const,
    createdAt: now,
  };
}

/**
 * Retrieve an OrderSet by ID, with populated SubOrders.
 */
export async function getOrderSet(orderSetId: string) {
  if (!adminDb) throw new Error('Firebase Admin not initialized');

  const orderSetSnap = await adminDb.collection(ORDER_SETS_COLLECTION).doc(orderSetId).get();
  if (!orderSetSnap.exists) return null;

  const orderSetData = orderSetSnap.data()!;
  const subOrderIds = orderSetData.subOrderIds || [];

  // Fetch all SubOrders referenced
  const subOrders: any[] = [];
  if (subOrderIds.length > 0) {
    const subOrderSnaps = await Promise.all(
      subOrderIds.map((id: string) => adminDb.collection(SUB_ORDERS_COLLECTION).doc(id).get()),
    );
    for (const snap of subOrderSnaps) {
      if (snap.exists) {
        subOrders.push({ id: snap.id, ...snap.data() });
      }
    }
  }

  return {
    id: orderSetSnap.id,
    ...orderSetData,
    subOrders,
  };
}

/**
 * List all OrderSets for a given user.
 */
export async function getUserOrderSets(userId: string, limitCount = 50) {
  if (!adminDb) throw new Error('Firebase Admin not initialized');

  const snap = await adminDb
    .collection(ORDER_SETS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * Transition an OrderSet's status using the state machine.
 * Uses optimistic concurrency (version field) to prevent lost updates.
 */
export async function transitionOrderSetStatus(orderSetId: string, event: TransitionEvent) {
  if (!adminDb) throw new Error('Firebase Admin not initialized');

  const ref = adminDb.collection(ORDER_SETS_COLLECTION).doc(orderSetId);

  await adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(ref);
    if (!snap.exists) {
      throw new Error(`OrderSet ${orderSetId} not found`);
    }

    const currentStatus = snap.data()!.status as OrderSetStatus;
    const currentVersion = (snap.data()!.version as number) || 0;

    const result = transitionOrder(currentStatus, event, currentVersion);

    txn.update(ref, {
      status: result.status,
      version: result.version,
      updatedAt: new Date().toISOString(),
    });

    // For cancellation, also cancel all SubOrders
    if (result.status === 'cancelled') {
      const subOrderIds = (snap.data()!.subOrderIds as string[]) || [];
      for (const subId of subOrderIds) {
        const subRef = adminDb.collection(SUB_ORDERS_COLLECTION).doc(subId);
        const subSnap = await txn.get(subRef);
        const subVersion = subSnap.exists ? (subSnap.data()?.version as number) || 0 : 0;
        txn.update(subRef, {
          status: 'cancelled',
          version: subVersion + 1,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  });
}
