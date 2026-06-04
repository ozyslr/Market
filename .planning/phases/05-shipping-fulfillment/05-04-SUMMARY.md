---
phase: 05-shipping-fulfillment
plan: '04'
subsystem: returns
tags: [returns, refund, cargo, state-machine, express]
dependency_graph:
  requires: [05-01, 02-05]
  provides: [returns-workflow-backend]
  affects: [server.ts, returns-collection, subOrders-collection]
tech_stack:
  added: []
  patterns: [returns-route-deps-injection, window-guard-server-side, processRefund-wire-up]
key_files:
  created:
    - server/routes/returns.ts
  modified:
    - server.ts
decisions:
  - 'WINDOW_MS guard reads deliveredAt from Firestore only — never from request body (T-05-04-03)'
  - 'crypto.randomUUID() used for returnId — no extra dependency (Node 22 built-in)'
  - 'verifySeller unused structurally but kept in ReturnsRouteDeps for future seller-scoped middleware'
  - 'Approve endpoint: two sequential Firestore updates (approved then refunded) to record intermediate state'
metrics:
  duration: '~25 minutes'
  completed: '2026-06-04'
  tasks_completed: 1
  files_changed: 2
---

# Phase 05 Plan 04: Returns Workflow Backend Summary

Full returns workflow backend: buyer submits return request with server-side 14-day window enforcement, seller/admin approves (return label + processRefund) or rejects, all wired into server.ts.

## Tasks Completed

| #   | Task                                               | Commit  | Files                               |
| --- | -------------------------------------------------- | ------- | ----------------------------------- |
| 1   | Create returns.ts (3 endpoints) + server.ts wiring | decc37a | server/routes/returns.ts, server.ts |

## What Was Built

**server/routes/returns.ts** — `registerReturnsRoutes` exporting 3 Express endpoints:

1. `POST /api/orders/:orderSetId/subOrders/:subOrderId/return-request`
   - verifyFirebaseToken; buyer ownership (orderSet.userId === req.uid → 403)
   - Delivered status guard → 409 if not delivered
   - 14-day window: `Date.now() - new Date(deliveredAt).getTime() > WINDOW_MS` → 409 `return_window_expired`
   - Reason validation against ReturnReason union
   - Creates `returns/{crypto.randomUUID()}` doc; transitions SubOrder via `transitionOrder(request_return)`
   - Returns 201 `{ returnId }`

2. `POST /api/returns/:returnId/approve`
   - verifyFirebaseToken; sellerId === req.uid OR req.isAdmin → 403
   - Pending status guard (double-approval prevention T-05-04-04) → 409
   - `routeCarrierByRegion(buyerCountry)` → `createCargoShipment(..., isReturn: true)`
   - `processRefund(adminDb, getIyzico, { orderSetId, subOrderId, isFullRefund: true })`
   - Two sequential doc updates: status=approved → status=refunded with refundId
   - Non-blocking `sendRefundNotificationEmail` (void IIFE)

3. `POST /api/returns/:returnId/reject`
   - verifyFirebaseToken; ownership guard; pending guard
   - rejectionReason required string validation
   - Updates doc to rejected; `transitionOrder(reject_return)` on SubOrder

**server.ts** — added import and `registerReturnsRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin, verifySeller, getIyzico })` after carrier poll routes.

## Test Results

```
Test Files  1 passed (1)
Tests       2 passed | 1 todo (3)
```

The two window enforcement tests pass (GREEN). The processRefund wire-up test remains `.todo` — the behavior is implemented in the route but the test was written as a todo placeholder in Plan 02 (not an integration test).

## Verification

- `npx tsc --noEmit` — zero errors in returns.ts and server.ts
- `WINDOW_MS` and `return_window_expired` both present in returns.ts
- `processRefund` called with `isFullRefund: true`
- `registerReturnsRoutes` present in server.ts after `express.json()`

## Deviations from Plan

**1. [Rule 1 - Bug] sendRefundNotificationEmail takes 5 arguments, not 3**

- Found during: Task 1 (tsc error TS2554)
- Issue: Plan excerpt showed 3-arg call; actual signature is `(orderSetId, email, name, refundAmount, currency)`
- Fix: Added `refundResult.refundedAmount` and `refundResult.currency` from the processRefund result
- Files modified: server/routes/returns.ts
- Commit: decc37a (fixed before commit)

## Known Stubs

None — all data flows are wired to real Firestore documents and service calls.

## Threat Flags

None — all STRIDE mitigations from the threat register are implemented inline.

## Self-Check: PASSED

- [x] server/routes/returns.ts exists
- [x] server.ts imports and calls registerReturnsRoutes
- [x] Commit decc37a present in git log
- [x] Tests GREEN (2 passed, 1 todo)
- [x] TSC clean
