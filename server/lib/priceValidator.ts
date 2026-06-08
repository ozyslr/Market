// ─── Server-side Price Validation ──────────────────────────────────────────
// Prevents client-side price manipulation by verifying cart totals against
// Firestore product prices before creating payment intents.
//
// Tolerates minor rounding differences (≤1% or ≤5 units) to avoid false
// positives from currency conversion or stale cached prices.

import type { Firestore } from 'firebase-admin/firestore';

export interface PriceCheckItem {
  productId: string;
  quantity: number;
  /** Client-claimed unit price in major currency units (e.g. 129.99 ₺) */
  price: number;
}

export interface PriceCheckResult {
  valid: boolean;
  clientTotal: number;
  serverTotal: number;
  /** Absolute difference in major currency units */
  difference: number;
  /** Human-readable reason when invalid */
  reason?: string;
}

/** Maximum allowed price difference as a fraction of serverTotal (0.01 = 1%). */
const MAX_PRICE_DEVIATION_RATIO = 0.01;

/** Minimum absolute difference to trigger rejection (avoids false positives
 * on very small orders — rounding errors on a 50 ₺ order are negligible). */
const MIN_ABSOLUTE_DIFFERENCE = 5;

/**
 * Validate that the client-submitted total matches Firestore product prices.
 *
 * Fetches each product's current price from Firestore, computes the expected
 * total, and compares against the client's claimed prices.
 *
 * @returns PriceCheckResult — `valid: true` when the difference is within tolerance
 */
export async function validatePrices(
  adminDb: Firestore,
  items: PriceCheckItem[],
): Promise<PriceCheckResult> {
  if (items.length === 0) {
    return { valid: false, clientTotal: 0, serverTotal: 0, difference: 0, reason: 'No items provided' };
  }

  let clientTotal = 0;
  let serverTotal = 0;

  // Fetch all product prices in one batch for efficiency
  const productIds = [...new Set(items.map((i) => i.productId))];
  const productSnaps = await Promise.all(
    productIds.map((pid) => adminDb.collection('products').doc(pid).get()),
  );

  const priceMap = new Map<string, number>();
  for (const snap of productSnaps) {
    if (!snap.exists) {
      return {
        valid: false,
        clientTotal: 0,
        serverTotal: 0,
        difference: 0,
        reason: `Product not found: ${snap.id}`,
      };
    }
    const data = snap.data()!;
    const serverPrice = data.price ?? data.basePrice;
    if (typeof serverPrice !== 'number' || serverPrice <= 0) {
      return {
        valid: false,
        clientTotal: 0,
        serverTotal: 0,
        difference: 0,
        reason: `Invalid server price for product: ${snap.id}`,
      };
    }
    priceMap.set(snap.id, serverPrice);
  }

  for (const item of items) {
    const serverPrice = priceMap.get(item.productId)!;
    clientTotal += item.price * item.quantity;
    serverTotal += serverPrice * item.quantity;
  }

  const difference = Math.abs(clientTotal - serverTotal);

  // Accept if difference is within tolerance
  const maxAllowedDiff = Math.max(serverTotal * MAX_PRICE_DEVIATION_RATIO, MIN_ABSOLUTE_DIFFERENCE);
  const valid = difference <= maxAllowedDiff;

  return {
    valid,
    clientTotal: Math.round(clientTotal * 100) / 100,
    serverTotal: Math.round(serverTotal * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    reason: valid
      ? undefined
      : `Price mismatch: client claimed ${clientTotal.toFixed(2)}, server expects ${serverTotal.toFixed(2)} (diff: ${difference.toFixed(2)})`,
  };
}
