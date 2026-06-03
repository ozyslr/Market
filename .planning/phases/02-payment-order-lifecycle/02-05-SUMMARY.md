---
phase: 02-payment-order-lifecycle
plan: 05
subsystem: payments
tags: [refund, ledger, iyzico, state-machine, commission-reversal]
dependency_graph:
  requires: [02-01, 02-02, 02-03, 02-04]
  provides: [admin-refund-endpoint, commission-reversal-ledger, cancel-order-endpoint]
  affects: [ledger, subOrders, orderSets]
tech_stack:
  added: []
  patterns: [negative-ledger-entries, atomic-firestore-transaction, iyzico-refundV2]
key_files:
  created:
    - server/services/refundService.ts
    - server/routes/refund.ts
  modified:
    - server/lib/schemas.ts
    - server.ts
decisions:
  - Reason strings use lowercase so test `.includes('commission')` and `.includes('seller')` match case-sensitively
  - adminDb typed as Firestore | null in route deps, matching existing route convention (email, payouts)
  - email notification in refund route fetches customerEmail from OrderSet non-blocking; amount=0 placeholder (full order read deferred)
metrics:
  duration: ~45 minutes
  completed_date: 2026-06-03
  tasks_completed: 2
  tasks_checkpoint: 1
  files_created: 2
  files_modified: 2
---

# Phase 02 Plan 05: Admin Refund & Commission Reversal Summary

**One-liner:** iyzico refundV2 admin endpoint with dual negative ledger entries (commission + seller payout reversal) and SubOrder state machine integration.

## Tasks

| #   | Name                                                                       | Status         | Commit  |
| --- | -------------------------------------------------------------------------- | -------------- | ------- |
| 1   | TDD: Test refund commission reversal and ledger negative entry             | Done           | dac7980 |
| 2   | Admin refund endpoint with iyzico refundV2, ledger reversal, state machine | Done           | b3eef02 |
| 3   | [BLOCKING] Deploy Firestore security rules                                 | **Checkpoint** | —       |

## What Was Built

### Task 2: refundService.ts + Admin Routes

**`server/services/refundService.ts`** — `processRefund(adminDb, getIyzico, params)`:

- Reads SubOrder from Firestore to get `paymentTransactionId`, `subtotal`, `shipping`, `sellerId`
- Queries `ledger` collection for original commission entry
- Calls `iyzico.refundV2Create(client, { paymentTransactionId })` for full refund
- Calls `iyzico.refundV2Create(client, { paymentTransactionId, price: String(amount) })` for partial
- Inside `runTransaction`:
  - **Full refund:** two negative ledger entries (`type: 'refund'`, `status: 'reversed'`):
    - `amount: -originalCommission` with `reason: 'commission reversal - full refund'`
    - `amount: -(subtotal - commission)` with `reason: 'seller payout reversal - full refund'`
  - Marks original commission entry `status: 'reversed'` via `txn.update`
  - Transitions SubOrder via `transitionOrder('return_approved', 'refund', version)` → `refunded`
  - Updates OrderSet to `refunded` if all subOrders are refunded
  - **Partial refund:** single entry with proportional commission `Math.round(commission * amount/total)`
- Also exports `cancelOrder(adminDb, getIyzico, params)` for pre-shipment cancellations via `iyzico.cancelCreate`

**`server/routes/refund.ts`** — `registerRefundRoutes(app, deps)`:

- `POST /api/admin/refund` — verifyAdmin, validates with `adminRefundSchema`, returns `{ status, refundId, ledgerEntryIds }`
- `POST /api/admin/cancel-order` — verifyAdmin, validates with `cancelOrderSchema`, returns `{ status: 'cancelled' }`
- iyzico failures → 502 with `{ error: 'iyzico refund failed', providerError }`
- Non-blocking email notification via `sendRefundNotificationEmail` (fire-and-forget)

**`server/lib/schemas.ts`** additions:

- `adminRefundSchema`: `{ orderSetId, subOrderId?, paymentTransactionId?, isFullRefund, reason? }`
- `cancelOrderSchema`: `{ orderSetId, reason? }`

**`server.ts`**: `registerRefundRoutes` imported and registered after email routes.

## Verification Results

```
npx vitest run server/services/__tests__/refundService.test.ts
  Tests  5 passed (5)

npx vitest run server/services/__tests__/transitionEngine.test.ts server/services/__tests__/ledgerService.test.ts
  Tests  20 passed (20)

npx tsc --noEmit
  (no output — zero errors)
```

## Task 3 Checkpoint: [BLOCKING] Deploy Firestore Security Rules

**Status: Pending — requires Firebase CLI authentication**

Phase 2 introduced these Firestore collections requiring rule coverage:

- `processedWebhooks` (Plan 02) — webhook dedup, server SDK write only, client access denied
- `ledger` entries now have `status` field (Plan 04) — field addition, no collection change

**Deploy commands (run in project root terminal):**

```bash
# Step 1 — Deploy rules
firebase deploy --only firestore:rules --non-interactive

# Step 2 — Verify deployment
firebase firestore:get --database "(default)" rules
# Expected output includes: orderSets, subOrders, processedWebhooks, ledger, commissionRules, dataDeletionRequests

# Step 3 — Verify server starts
npm run dev
# Expected: server starts on port 3000, all routes registered

# Step 4 — Verify role enforcement (403 on non-admin token)
curl -X POST http://localhost:3000/api/admin/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"orderSetId":"test","isFullRefund":true}'
# Expected: 403 Forbidden
```

**Resume signal:** Type "approved" or describe any issues encountered during deployment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reason string case sensitivity**

- **Found during:** Task 2 GREEN phase
- **Issue:** Test searched `e.reason.includes('commission')` (lowercase) but service used `'Commission reversal'` (uppercase C) causing `find()` to return undefined
- **Fix:** Lowercased all reason string prefixes: `'commission reversal'`, `'seller payout reversal'`, `'partial commission reversal'`
- **Files modified:** `server/services/refundService.ts`
- **Commit:** b3eef02

**2. [Rule 2 - Missing null guard] adminDb Firestore | null type**

- **Found during:** tsc --noEmit
- **Issue:** `registerRefundRoutes` initially typed `adminDb: Firestore` but existing convention uses `Firestore | null` with runtime null guards
- **Fix:** Updated deps interface to `Firestore | null`, added `if (!adminDb) return 503` guards in both route handlers, used local `const db = adminDb` after guard for narrowed type
- **Files modified:** `server/routes/refund.ts`
- **Commit:** b3eef02

**3. [Rule 2 - Missing validation] emailService signature mismatch**

- **Found during:** tsc --noEmit
- **Issue:** `sendRefundNotificationEmail` takes `(orderSetId, customerEmail, customerName, amount, currency)` — not `(adminDb, orderSetId, subOrderId, refundId)` as the plan assumed
- **Fix:** Updated route to fetch `customerEmail` from OrderSet doc and call with correct args; amount=0 placeholder since full order total requires additional read
- **Files modified:** `server/routes/refund.ts`
- **Commit:** b3eef02

## Self-Check

```
[ -f "O:/AI/E-tic 2026/server/services/refundService.ts" ] → FOUND
[ -f "O:/AI/E-tic 2026/server/routes/refund.ts" ] → FOUND
git log --oneline | grep dac7980 → FOUND (Task 1 RED)
git log --oneline | grep b3eef02 → FOUND (Task 2 GREEN)
```

## Self-Check: PASSED
