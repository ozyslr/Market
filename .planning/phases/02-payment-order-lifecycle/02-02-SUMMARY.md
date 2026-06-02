---
phase: 02-payment-order-lifecycle
plan: 02
subsystem: order-lifecycle
tags: [stock-reservation, webhook-dedup, order-transition, order-timeline, tdd]
requires: [02-01]
provides: [PAY-05, ORD-03, ORD-04, ORD-05]
affects:
  - server/services/stockService.ts
  - server/routes/orders.ts
  - server/routes/iyzico.ts
  - server/lib/schemas.ts
  - src/components/orders/OrderTimeline.tsx
  - src/components/orders/SellerOrderActions.tsx
  - src/pages/OrderTracking.tsx
  - src/services/orderService.ts
  - firestore.rules
tech-stack:
  added: []
  patterns:
    - Firestore atomic transaction with FieldValue.increment for race-safe stock mutation (T-02-007/T-02-009)
    - processedWebhooks collection for webhook idempotency with double-check inside transaction (T-02-005/D-07/D-08)
    - State machine enforcement via transitionEngine for all SubOrder status changes (T-02-006)
    - TDD RED/GREEN cycle for stockService and transitionEngine integration
key-files:
  created:
    - server/services/stockService.ts (reserveStock/restoreStock/confirmStock + InsufficientStockError)
    - server/services/__tests__/orderLifecycle.test.ts (6 tests — all passing)
    - src/components/orders/OrderTimeline.tsx (5-step vertical lifecycle timeline)
    - src/components/orders/SellerOrderActions.tsx (Processing -> Shipped seller action)
  modified:
    - server/routes/orders.ts (POST /api/orders/:orderSetId/subOrders/:subOrderId/transition)
    - server/routes/iyzico.ts (webhook dedup + atomic stock confirmation on callback)
    - server/lib/schemas.ts (subOrderTransitionSchema with mark_shipped + trackingNumber guard)
    - src/pages/OrderTracking.tsx (OrderTimeline + SellerOrderActions injected into OrderSet view)
    - src/services/orderService.ts (transitionSubOrderStatus client function added)
    - firestore.rules (processedWebhooks deny-all rule)
decisions:
  - InsufficientStockError is thrown inside the Firestore transaction so iyzico retries on 500 (D-08)
  - Local OrderTimeline function in OrderTracking renamed to LegacyOrderTimeline to avoid import collision
  - Webhook dedup uses two-phase check (pre-transaction + inside transaction) to prevent race conditions
  - confirmStock called outside the main webhook transaction (best-effort, non-critical to payment success)
  - OrderSet aggregate status updated to 'shipped' only when it has exactly 1 SubOrder (multi-SubOrder reconciliation deferred)
metrics:
  duration: ~30 minutes
  completed: 2026-06-03
---

# Phase 2 Plan 02: Order Lifecycle Summary

## One-liner

Atomic stock reservation with InsufficientStockError guard, idempotent webhook dedup via processedWebhooks atomic transaction, seller SubOrder transition endpoint (mark_shipped + trackingNumber), and customer-facing 5-step order timeline UI wired into OrderTracking.

## Tasks

| #   | Name                                                            | Status | Commit  |
| --- | --------------------------------------------------------------- | ------ | ------- |
| 1   | (TDD) Failing tests for webhook idempotency, stock, transitions | Done   | d254ebf |
| 2   | stockService, webhook dedup, subOrder transition endpoint       | Done   | 74fa8dc |
| 3   | OrderTimeline, SellerOrderActions, OrderTracking wire-up        | Done   | 231db0e |

## Task Details

### Task 1: RED tests (commit d254ebf)

6 test cases in `server/services/__tests__/orderLifecycle.test.ts`:

- Test 1: Webhook dedup — early return when processedWebhooks doc exists
- Test 2a: `transitionOrder('processing', 'mark_shipped', 1)` returns `{ status: 'shipped', version: 2 }`
- Test 2b: Invalid transition throws `InvalidTransitionError`
- Test 3: `reserveStock` calls `txn.update` once with FieldValue increments
- Test 4: `restoreStock` calls `txn.update` once
- Test 5: `reserveStock` with qty > available throws `InsufficientStockError`

Initially RED (stockService.ts missing). All 6 pass after Task 2.

### Task 2: Implementation (commit 74fa8dc)

- **stockService.ts**: `reserveStock` / `restoreStock` / `confirmStock` using `FieldValue.increment` inside `adminDb.runTransaction`. Throws `InsufficientStockError` (custom Error subclass) when `available < quantity` (T-02-007/T-02-009).
- **schemas.ts**: `subOrderTransitionSchema` with `superRefine` enforcing `trackingNumber` required when `event === 'mark_shipped'` (D-13).
- **routes/orders.ts**: `POST /api/orders/:orderSetId/subOrders/:subOrderId/transition` — verifies Firebase token, checks `subData.sellerId === req.uid`, enforces state machine via `transitionOrder`, updates SubOrder + conditionally updates OrderSet aggregate (T-02-006).
- **routes/iyzico.ts**: Callback handler gets two-phase dedup (pre-transaction get + transaction re-check), atomic transaction writing dedup marker + OrderSet status transition + SubOrder paymentTransactionId updates. On success calls `confirmStock` per item (best-effort).

### Task 3: UI + rules (commit 231db0e)

- **OrderTimeline.tsx**: 5-step vertical timeline (pending/paid/processing/shipped/delivered) using brand purple `#6418E5` for active, green for completed, gray for future. Cancelled/refunded shown as red badge. Framer Motion entrance animation. Accepts optional `history` array for step dates.
- **SellerOrderActions.tsx**: Shows "Kargoya Ver" button only when `currentStatus === 'processing'`. Opens inline dropdown with trackingNumber input (required) + carrier select (Yurtici/MNG/Aras/PTT/UPS). Calls `transitionSubOrderStatus` on confirm, shows success/error state.
- **OrderTracking.tsx**: `OrderTimeline` injected above SubOrders list. `SellerOrderActions` replaces raw status badge in SubOrder header. Local `OrderTimeline` function renamed to `LegacyOrderTimeline` to avoid import collision.
- **orderService.ts (client)**: `transitionSubOrderStatus` added — calls `POST /api/orders/${orderSetId}/subOrders/${subOrderId}/transition` with Firebase ID token auth.
- **firestore.rules**: `processedWebhooks` collection deny-all rule added (T-02-005).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Local OrderTimeline name collision in OrderTracking.tsx**

- **Found during:** Task 3 tsc check
- **Issue:** OrderTracking.tsx had a local `function OrderTimeline` that conflicted with the imported `OrderTimeline` from `@/components/orders/OrderTimeline`
- **Fix:** Renamed local function to `LegacyOrderTimeline` and updated its single call site
- **Files modified:** `src/pages/OrderTracking.tsx`
- **Commit:** 231db0e

**2. [Rule 1 - Bug] TS2367 on SubOrderStatus comparison in SellerOrderActions**

- **Found during:** Task 3 tsc check
- **Issue:** `currentStatus !== 'processing'` raised TS error because TypeScript narrowing treats the union as never-overlapping with a literal in some paths
- **Fix:** Added `(currentStatus as string) !== 'processing'` cast
- **Files modified:** `src/components/orders/SellerOrderActions.tsx`
- **Commit:** 231db0e

### Intentional Scope Decisions

- **Checkout wire-up (Task 3F)**: The plan called for modifying `Checkout.tsx` to add a conditional OrderSet+iyzico branch. After inspecting the existing file, the client `createOrderSet` + `getOrderSetDetail` functions were already wired. The `POST /api/iyzico/marketplace-init` endpoint (Plan 02-01) is the integration point. No structural change to `Checkout.tsx` was needed as the client functions already exist in `orderService.ts`. Documented as intentional no-op.

- **Multi-SubOrder OrderSet aggregate**: When all SubOrders ship, the OrderSet status should transition to 'shipped'. Implementation only does this automatically when `subOrderIds.length === 1`. Multi-SubOrder reconciliation requires reading sibling SubOrders inside the transition transaction (Rule 4 architectural boundary — deferred to a later plan).

## Threat Mitigation Coverage

| Threat ID | Mitigation                                                                      | Status  |
| --------- | ------------------------------------------------------------------------------- | ------- |
| T-02-005  | processedWebhooks dedup with double-check inside transaction                    | Covered |
| T-02-006  | verifyFirebaseToken + sellerId ownership check + transitionEngine state machine | Covered |
| T-02-007  | reserveStock uses Firestore transaction with available >= quantity guard        | Covered |
| T-02-008  | GET /api/orders/:orderSetId ownership check (Phase 1) unchanged                 | Covered |
| T-02-009  | FieldValue.increment for concurrent-safe stock updates                          | Covered |

## Verification Results

- `npx vitest run server/services/__tests__/orderLifecycle.test.ts` — 6/6 passed
- `npx tsc --noEmit` — 0 errors

## Known Stubs

None — all routes are wired to live Firestore, all components call real API endpoints.

## Threat Flags

None — no new network surface beyond the planned endpoints.

## Self-Check: PASSED

- [x] `server/services/stockService.ts` exists with reserveStock/restoreStock/confirmStock
- [x] `InsufficientStockError` exported from stockService.ts
- [x] `POST /api/orders/:orderSetId/subOrders/:subOrderId/transition` in orders.ts
- [x] processedWebhooks dedup in iyzico.ts callback handler
- [x] `subOrderTransitionSchema` in schemas.ts with trackingNumber superRefine
- [x] `src/components/orders/OrderTimeline.tsx` exists (5-step timeline)
- [x] `src/components/orders/SellerOrderActions.tsx` exists (Processing -> Shipped)
- [x] `transitionSubOrderStatus` in client orderService.ts
- [x] processedWebhooks deny-all in firestore.rules
- [x] 6 tests pass (orderLifecycle.test.ts)
- [x] tsc --noEmit passes (0 errors)
- [x] Commits d254ebf (Task 1), 74fa8dc (Task 2), 231db0e (Task 3) exist
