// ─── Server-side input validators & idempotency helpers ──────────────────────
// Pure, dependency-free functions extracted from server.ts so they can be
// unit-tested in isolation. No Node/Express imports → safe to tree-shake.

/** True only for real, finite numbers (rejects NaN, Infinity, non-numbers). */
export const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

/** True for a non-empty string within the allowed length bound. */
export const isNonEmptyString = (v: unknown, max = 5000): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max;

export interface SignatureItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

/**
 * Produces a stable signature for a set of cart items, independent of order.
 * Used to detect rapid duplicate checkout/order requests (idempotency).
 */
export const itemsSignature = (items: SignatureItem[]): string =>
  items
    .map((i) => `${i.productId}:${i.variantId || ''}:${i.quantity}`)
    .sort()
    .join('|');
