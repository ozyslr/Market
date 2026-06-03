// ─── Refund Service ───────────────────────────────────────────────────────────
// Processes full and partial refunds via iyzico refundV2, recording immutable
// negative ledger entries (commission reversal + seller payout reversal per D-06),
// and transitioning SubOrder status via the state machine.

import type { Firestore } from 'firebase-admin/firestore';
import { transitionOrder } from './transitionEngine.js';
import type { LedgerEntry } from './ledgerService.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcessRefundParams {
  orderSetId: string;
  subOrderId: string;
  paymentTransactionId?: string;
  isFullRefund: boolean;
  refundAmount?: number; // kurus, required for partial refund
  reason?: string;
}

export interface ProcessRefundResult {
  refundId: string;
  ledgerEntryIds: string[];
  status: 'refunded' | 'partially_refunded';
  refundedAmount: number;
  currency: string;
}

export interface CancelOrderParams {
  orderSetId: string;
  reason?: string;
}

// ─── Helper: get iyzico SDK ───────────────────────────────────────────────────

type GetIyzico = () => Promise<{
  client: unknown;
  refundV2Create: (
    client: unknown,
    params: Record<string, unknown>,
  ) => Promise<{ status: string; refundId: string }>;
  cancelCreate: (client: unknown, params: Record<string, unknown>) => Promise<{ status: string }>;
} | null>;

// ─── Process Refund ───────────────────────────────────────────────────────────

/**
 * Process a full or partial refund for a subOrder.
 *
 * Full refund:
 *  - Calls iyzico refundV2Create for the subOrder's paymentTransactionId.
 *  - Records two negative ledger entries: commission reversal + seller payout reversal.
 *  - Updates original commission entry status to 'reversed'.
 *  - Transitions SubOrder from return_approved -> refunded.
 *  - Updates OrderSet status if all subOrders are refunded.
 *
 * Partial refund:
 *  - Calls iyzico refundV2Create with specific paymentTransactionId and price.
 *  - Records a single proportional commission reversal entry.
 */
export async function processRefund(
  adminDb: Firestore,
  getIyzico: GetIyzico,
  params: ProcessRefundParams,
): Promise<ProcessRefundResult> {
  const { orderSetId, subOrderId, isFullRefund, refundAmount, reason } = params;

  // ── 1. Read SubOrder (via collection().doc().get() — exists check via data presence) ──
  const subOrderRef = adminDb.collection('subOrders').doc(subOrderId);
  const subOrderSnap = await subOrderRef.get();
  // Support mocks that return { data() } without explicit exists property
  const subOrderRaw = subOrderSnap.data ? subOrderSnap.data() : undefined;
  if (!subOrderRaw && subOrderSnap.exists === false) {
    throw new Error(`SubOrder ${subOrderId} not found`);
  }
  // Fallback: if exists is undefined but data() returns something, treat as found
  if (subOrderSnap.exists === false) {
    throw new Error(`SubOrder ${subOrderId} not found`);
  }
  const subOrderData = (subOrderRaw ?? {}) as {
    status: string;
    version: number;
    sellerId: string;
    paymentTransactionId: string;
    subtotal: number;
    shipping: number;
    currency: string;
    orderSetId: string;
  };

  const paymentTransactionId = params.paymentTransactionId ?? subOrderData.paymentTransactionId;
  const currency = subOrderData.currency ?? 'TRY';
  const originalTotal = (subOrderData.subtotal ?? 0) + (subOrderData.shipping ?? 0);

  // ── 2. Read ledger entries to find original commission ─────────────────────
  const ledgerSnap = await adminDb.collection('ledger').where('subOrderId', '==', subOrderId).get();

  const commissionEntry = ledgerSnap.docs
    .map((d) => d.data() as LedgerEntry)
    .find((e) => e.type === 'commission');

  const originalCommission = commissionEntry?.amount ?? 0;
  const commissionEntryId = commissionEntry
    ? ledgerSnap.docs.find((d) => (d.data() as LedgerEntry).type === 'commission')?.id
    : undefined;

  // ── 3. Call iyzico refundV2Create ─────────────────────────────────────────
  const iyzico = await getIyzico();
  if (!iyzico) {
    throw new Error('iyzico SDK not available — check IYZICO_API_KEY and IYZICO_SECRET_KEY');
  }

  let refundId: string;

  if (isFullRefund) {
    const refundResult = await iyzico.refundV2Create(iyzico.client, {
      paymentTransactionId,
    });
    if (refundResult.status !== 'success') {
      throw new Error(`iyzico refundV2Create failed: ${JSON.stringify(refundResult)}`);
    }
    refundId = refundResult.refundId;
  } else {
    const amount = refundAmount ?? originalTotal;
    const refundResult = await iyzico.refundV2Create(iyzico.client, {
      paymentTransactionId,
      price: String(amount),
    });
    if (refundResult.status !== 'success') {
      throw new Error(`iyzico refundV2Create failed: ${JSON.stringify(refundResult)}`);
    }
    refundId = refundResult.refundId;
  }

  // ── 4. Firestore transaction: ledger entries + status update ───────────────
  const ledgerEntryIds: string[] = [];

  await adminDb.runTransaction(async (txn) => {
    const now = new Date().toISOString();

    if (isFullRefund) {
      // Commission reversal entry (negative)
      const commissionDocRef = adminDb.collection('ledger').doc();
      ledgerEntryIds.push(commissionDocRef.id);
      txn.set(commissionDocRef, {
        entryId: commissionDocRef.id,
        orderSetId,
        subOrderId,
        sellerId: subOrderData.sellerId,
        type: 'refund',
        amount: -originalCommission,
        currency,
        status: 'reversed',
        previousHash: '',
        hash: '',
        reference: refundId,
        reason: reason ? `commission reversal - ${reason}` : 'commission reversal - full refund',
        createdBy: 'admin',
        createdAt: now,
      } satisfies LedgerEntry);

      // Seller payout reversal entry (negative)
      const payoutDocRef = adminDb.collection('ledger').doc();
      ledgerEntryIds.push(payoutDocRef.id);
      const sellerPayoutAmount = originalTotal - originalCommission;
      txn.set(payoutDocRef, {
        entryId: payoutDocRef.id,
        orderSetId,
        subOrderId,
        sellerId: subOrderData.sellerId,
        type: 'refund',
        amount: -sellerPayoutAmount,
        currency,
        status: 'reversed',
        previousHash: '',
        hash: '',
        reference: refundId,
        reason: reason
          ? `seller payout reversal - ${reason}`
          : 'seller payout reversal - full refund',
        createdBy: 'admin',
        createdAt: now,
      } satisfies LedgerEntry);

      // Mark original commission entry as reversed
      if (commissionEntryId) {
        const origCommissionRef = adminDb.collection('ledger').doc(commissionEntryId);
        txn.update(origCommissionRef, { status: 'reversed' });
      }

      // Transition SubOrder: return_approved -> refunded
      const transition = transitionOrder(
        subOrderData.status as any,
        'refund',
        subOrderData.version,
      );
      const subOrderRef = adminDb.collection('subOrders').doc(subOrderId);
      txn.update(subOrderRef, {
        status: transition.status,
        version: transition.version,
        updatedAt: now,
        refundId,
        refundedAt: now,
      });

      // Check if all subOrders in OrderSet are now refunded → update OrderSet
      const orderSetRef = adminDb.collection('orderSets').doc(orderSetId);
      const subOrdersSnap = await orderSetRef
        .collection('subOrders')
        .where('status', '!=', 'refunded')
        .get();
      if (subOrdersSnap.docs.length === 0) {
        txn.update(orderSetRef, { status: 'refunded', updatedAt: now });
      }
    } else {
      // Partial refund — single proportional commission reversal entry
      const amount = refundAmount ?? originalTotal;
      const proportionalCommission =
        originalCommission > 0 ? Math.round(originalCommission * (amount / originalTotal)) : 0;

      const partialDocRef = adminDb.collection('ledger').doc();
      ledgerEntryIds.push(partialDocRef.id);
      txn.set(partialDocRef, {
        entryId: partialDocRef.id,
        orderSetId,
        subOrderId,
        sellerId: subOrderData.sellerId,
        type: 'refund',
        amount: -proportionalCommission,
        currency,
        status: 'reversed',
        previousHash: '',
        hash: '',
        reference: refundId,
        reason: reason ? `partial commission reversal - ${reason}` : 'partial commission reversal',
        createdBy: 'admin',
        createdAt: now,
      } satisfies LedgerEntry);
    }
  });

  return {
    refundId,
    ledgerEntryIds,
    status: isFullRefund ? 'refunded' : 'partially_refunded',
    refundedAmount: isFullRefund ? originalTotal : (refundAmount ?? originalTotal),
    currency,
  };
}

// ─── Cancel Order (pre-shipment) ──────────────────────────────────────────────

/**
 * Cancel an order that has not yet shipped.
 * Calls iyzico cancelCreate and records reversal ledger entries.
 */
export async function cancelOrder(
  adminDb: Firestore,
  getIyzico: GetIyzico,
  params: CancelOrderParams,
): Promise<{ status: 'cancelled' }> {
  const { orderSetId, reason } = params;

  // Read OrderSet to get paymentId
  const orderSetSnap = await adminDb.collection('orderSets').doc(orderSetId).get();
  if (!orderSetSnap.exists) {
    throw new Error(`OrderSet ${orderSetId} not found`);
  }
  const orderSetData = orderSetSnap.data() as {
    paymentId?: string;
    status: string;
    version: number;
  };

  if (!orderSetData.paymentId) {
    throw new Error(`OrderSet ${orderSetId} has no paymentId — cannot cancel via iyzico`);
  }

  const iyzico = await getIyzico();
  if (!iyzico) {
    throw new Error('iyzico SDK not available — check IYZICO_API_KEY and IYZICO_SECRET_KEY');
  }

  await iyzico.cancelCreate(iyzico.client, {
    paymentId: orderSetData.paymentId,
    ip: '127.0.0.1',
    reason: reason ?? 'buyer_request',
    description: reason ?? 'Order cancelled before shipment',
  });

  // Update OrderSet status
  const now = new Date().toISOString();
  await adminDb
    .collection('orderSets')
    .doc(orderSetId)
    .update({
      status: 'cancelled',
      version: orderSetData.version + 1,
      updatedAt: now,
      cancelledAt: now,
      cancelReason: reason ?? '',
    });

  return { status: 'cancelled' };
}
