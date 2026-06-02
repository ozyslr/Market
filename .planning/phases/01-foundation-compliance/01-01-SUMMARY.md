---
phase: 01-foundation-compliance
plan: 01
subsystem: order-walking-skeleton
tags: [types, state-machine, api, firestore, firestore-rules, tdd]
requires: []
provides: [order-types, transition-engine, order-api, client-order-display]
affects:
  - src/types/order.ts
  - server/services/transitionEngine.ts
  - server/services/orderService.ts
  - server/routes/orders.ts
  - server.ts
  - src/services/orderService.ts
  - src/pages/OrderHistory.tsx
  - src/pages/OrderTracking.tsx
  - firestore.rules
tech-stack:
  added: [transitionEngine (in-house FSM)]
  patterns:
    - Server-side state machine with explicit transition matrix
    - Zod validation for API payloads (T-01-002)
    - Optimistic concurrency via version field (T-01-003)
    - Ownership check on GET /api/orders/:orderSetId (T-01-004)
    - Admin SDK writes bypassing Firestore rules (T-01-005)
key-files:
  created:
    - server/services/transitionEngine.ts
    - server/services/orderService.ts
    - server/routes/orders.ts
  modified:
    - src/types/order.ts
    - server.ts
    - src/services/orderService.ts
    - src/pages/OrderHistory.tsx
    - src/pages/OrderTracking.tsx
    - firestore.rules
decisions: []
metrics:
  duration: null
  completed: 2026-06-02
---

# Phase 1 Foundation & Compliance: Plan 01 Summary

## One-liner

Order walking skeleton: OrderSet/SubOrder data model, transition matrix state machine with 14 passing tests, Express order API (create/list/detail) with Zod validation, Firestore security rules for orderSets/subOrders, and client-side OrderHistory/OrderTracking pages wired to the new API.

## Tasks

| #   | Name                                              | Type       | Status | Commit                         |
| --- | ------------------------------------------------- | ---------- | ------ | ------------------------------ |
| 1   | OrderSet/SubOrder types, transition engine, tests | auto (tdd) | Done   | 6d0d5f0 (RED), 4860e98 (GREEN) |
| 2   | Express order API with server-side validation     | auto       | Done   | f703f37                        |
| 3   | Wire client-side order display                    | auto       | Done   | a1780b0, cc18083 (type fixes)  |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Aggressive `order.` -> `o.` replacement broke helper functions**

- **Found during:** Task 3 (type check)
- **Issue:** Replace-all turned `order.` inside `getStepDate`, `OrderTimeline`, `CarrierTrackingCard` into `o.` when parameter was still named `order`
- **Fix:** Reverted `order.` back in those function scopes where param is named `order`
- **Files modified:** `src/pages/OrderTracking.tsx`
- **Commit:** cc18083

**2. [Rule 2] `adminDb` possibly null type errors in orderService.ts**

- **Found during:** Task 3 type check
- **Issue:** TypeScript `tsc --noEmit` flagged 3 instances of `adminDb` possibly null despite null guard
- **Fix:** Added local `const db = adminDb` after each null guard, replaced `adminDb.` with `db.`
- **Files modified:** `server/services/orderService.ts`
- **Commit:** cc18083

### Threat Mitigation Coverage

| Threat ID | Mitigation                                                       | Status  |
| --------- | ---------------------------------------------------------------- | ------- |
| T-01-001  | verifyFirebaseToken middleware on POST/GET routes                | Covered |
| T-01-002  | Zod validation on items, currency, shippingAddress               | Covered |
| T-01-003  | Version field + runTransaction for optimistic concurrency        | Covered |
| T-01-004  | Ownership check: orderSet.userId vs req.uid                      | Covered |
| T-01-005  | Firestore rules: client-side write denied on orderSets/subOrders | Covered |

### Known Stubs

- **OrderHistory.tsx:** Product thumbnail grid replaced with generic Package icon since OrderSet API does not return item images at summary level. Future plan to add item preview data to OrderSet.
- **OrderTracking.tsx (new OrderSet view):** SubOrder sections use generic status color (amber/red/blue) instead of the rich timeline/carrier tracking from the old model. Detailed per-sub-order tracking deferred.
- **OrderTracking.tsx:** The ReorderButton and carrier tracking card are not rendered in the new OrderSet view -- only the old Order model path supports them.

## Threat Flags

None -- all security-relevant surface (new API endpoints, Firestore collections, auth paths) was already listed in the plan's threat model.

## Self-Check: PASSED

- [x] server/services/transitionEngine.ts created (50+ lines, exports all named items)
- [x] server/services/orderService.ts created
- [x] server/routes/orders.ts created
- [x] src/types/order.ts extended (OrderSet, SubOrder, SubOrderItem, TransitionEvent, OrderSetStatus)
- [x] server.ts updated (registerOrderRoutes import + call)
- [x] firestore.rules updated (orderSets + subOrders collections)
- [x] src/services/orderService.ts updated (createOrderSet, getUserOrderSets, getOrderSetDetail)
- [x] src/pages/OrderHistory.tsx updated (uses getUserOrderSets API)
- [x] src/pages/OrderTracking.tsx updated (tries OrderSet API first, falls back to old Order model)
- [x] All 14 transition engine tests pass
- [x] tsc --noEmit passes with zero errors
