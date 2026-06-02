// ─── Order State Machine — Transition Engine ─────────────────────────────────
// Centralized authority for order lifecycle transitions.
// Enforces the transition matrix; invalid transitions throw InvalidTransitionError.
// Optimistic concurrency via version field.

export type OrderSetStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected'
  | 'refunded'
  | 'on_hold';

export type SubOrderStatus = OrderSetStatus;

export type TransitionEvent =
  | 'payment_received'
  | 'mark_shipped'
  | 'confirm_delivery'
  | 'auto_complete'
  | 'cancel'
  | 'request_return'
  | 'approve_return'
  | 'reject_return'
  | 'refund'
  | 'place_on_hold'
  | 'release_hold';

/**
 * Transition matrix: maps each status to a set of valid (event -> nextStatus) pairs.
 * An empty object `{}` means the status is terminal (no transitions allowed).
 */
export const TRANSITION_MATRIX: Record<
  OrderSetStatus,
  Partial<Record<TransitionEvent, OrderSetStatus>>
> = {
  pending: { payment_received: 'processing', cancel: 'cancelled' },
  paid: { cancel: 'cancelled' },
  processing: { mark_shipped: 'shipped', cancel: 'cancelled', place_on_hold: 'on_hold' },
  shipped: { confirm_delivery: 'delivered' },
  delivered: { auto_complete: 'completed', request_return: 'return_requested' },
  completed: { request_return: 'return_requested' },
  cancelled: {},
  return_requested: { approve_return: 'return_approved', reject_return: 'delivered' },
  return_approved: { refund: 'refunded' },
  return_rejected: {},
  refunded: {},
  on_hold: { release_hold: 'processing', cancel: 'cancelled' },
};

/**
 * Error thrown when an invalid status transition is attempted.
 */
export class InvalidTransitionError extends Error {
  public readonly status: OrderSetStatus;
  public readonly event: TransitionEvent;

  constructor(status: OrderSetStatus, event: TransitionEvent) {
    super(`Invalid transition: ${status} -> ${event}`);
    this.name = 'InvalidTransitionError';
    this.status = status;
    this.event = event;
  }
}

/**
 * Attempt a state transition for an order.
 *
 * @param currentStatus - The current order status.
 * @param event - The event triggering the transition.
 * @param currentVersion - The current version number (for optimistic concurrency).
 * @returns An object with the new `status` and incremented `version`.
 * @throws {InvalidTransitionError} If the transition is not allowed by the matrix.
 */
export function transitionOrder(
  currentStatus: OrderSetStatus,
  event: TransitionEvent,
  currentVersion: number,
): { status: OrderSetStatus; version: number } {
  const nextStatus = TRANSITION_MATRIX[currentStatus]?.[event];
  if (!nextStatus) {
    throw new InvalidTransitionError(currentStatus, event);
  }
  return { status: nextStatus, version: currentVersion + 1 };
}
