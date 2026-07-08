// ─── Stock Reservation Service ────────────────────────────────────────────────
// Manages product stock levels atomically using Firestore transactions.
// All mutations go through server Admin SDK — client access is denied.
//
// Stock document shape (within products/{id}):
//   stock: { available: number; reserved: number; total: number }
//
// Operations:
//   reserveStock  — reserve qty at checkout (available -= qty, reserved += qty)
//   restoreStock  — reverse reservation on cancel/timeout (reserved -= qty, available += qty)
//   confirmStock  — on payment success (reserved -= qty, permanent deduction)

import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

// ─── Errors ──────────────────────────────────────────────────────────────────

export class InsufficientStockError extends Error {
  public readonly productId: string;
  public readonly available: number;
  public readonly requested: number;

  constructor(productId: string, available: number, requested: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available} (yetersiz stok)`,
    );
    this.name = 'InsufficientStockError';
    this.productId = productId;
    this.available = available;
    this.requested = requested;
  }
}

// ─── Stock Operations ─────────────────────────────────────────────────────────

/**
 * Reserve stock for a product at checkout.
 * Atomically: stock.available -= quantity, stock.reserved += quantity.
 * Throws InsufficientStockError if available < quantity.
 */
export async function reserveStock(
  adminDb: Firestore,
  productId: string,
  quantity: number,
): Promise<{ available: number; reserved: number }> {
  const productRef = adminDb.collection('products').doc(productId);

  return adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(productRef);
    if (!snap.exists) {
      throw new Error(`Product ${productId} not found`);
    }

    const data = snap.data()!;
    const stock = data.stock ?? { available: data.stock ?? 0, reserved: 0 };
    const available: number =
      typeof stock === 'object' ? (stock.available ?? 0) : (data.stock ?? 0);
    const reserved: number = typeof stock === 'object' ? (stock.reserved ?? 0) : 0;

    if (available < quantity) {
      throw new InsufficientStockError(productId, available, quantity);
    }

    txn.update(productRef, {
      'stock.available': FieldValue.increment(-quantity),
      'stock.reserved': FieldValue.increment(quantity),
      updatedAt: new Date().toISOString(),
    });

    return { available: available - quantity, reserved: reserved + quantity };
  });
}

/**
 * Restore (un-reserve) stock on order cancellation or timeout.
 * Atomically: stock.reserved -= quantity, stock.available += quantity.
 */
export async function restoreStock(
  adminDb: Firestore,
  productId: string,
  quantity: number,
): Promise<{ available: number; reserved: number }> {
  const productRef = adminDb.collection('products').doc(productId);

  return adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(productRef);
    if (!snap.exists) {
      throw new Error(`Product ${productId} not found`);
    }

    const data = snap.data()!;
    const stock = data.stock ?? {};
    const available: number = typeof stock === 'object' ? (stock.available ?? 0) : 0;
    const reserved: number = typeof stock === 'object' ? (stock.reserved ?? 0) : 0;

    txn.update(productRef, {
      'stock.available': FieldValue.increment(quantity),
      'stock.reserved': FieldValue.increment(-quantity),
      updatedAt: new Date().toISOString(),
    });

    return { available: available + quantity, reserved: Math.max(0, reserved - quantity) };
  });
}

/**
 * Confirm stock deduction on successful payment.
 * Atomically: stock.reserved -= quantity (permanent deduction — does NOT restore to available).
 */
export async function confirmStock(
  adminDb: Firestore,
  productId: string,
  quantity: number,
): Promise<void> {
  const productRef = adminDb.collection('products').doc(productId);

  await adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(productRef);
    if (!snap.exists) {
      throw new Error(`Product ${productId} not found`);
    }

    txn.update(productRef, {
      'stock.reserved': FieldValue.increment(-quantity),
      updatedAt: new Date().toISOString(),
    });
  });
}
