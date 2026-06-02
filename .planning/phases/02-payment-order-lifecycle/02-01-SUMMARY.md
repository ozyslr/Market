---
phase: 02-payment-order-lifecycle
plan: 01
subsystem: payment-iyzico
tags: [iyzico, marketplace, submerchant, payment-provider, commission, 3d-secure, tdd]
requires: [01-04]
provides: [PAY-01, PAY-02, PAY-03]
affects:
  - server/iyzico.cjs
  - server/services/paymentProvider.ts
  - server/services/__tests__/paymentProvider.test.ts
  - server/routes/iyzico.ts
  - server/lib/schemas.ts
  - server.ts
tech-stack:
  added: []
  patterns:
    - IPaymentProvider abstraction (D-02) decoupling routes from the iyzico SDK
    - iyzico marketplace subMerchant splits (subMerchantKey/subMerchantPrice) per D-01/D-03
    - Server-side pricing + commission (client never sends totals) — T-02-001
    - Server-to-server callback with iyzico-verified payment status — T-02-002
    - Pending commission entries written to immutable ledger on init (D-05)
key-files:
  created:
    - server/services/paymentProvider.ts (IPaymentProvider interface + IyzicoProvider)
    - server/services/__tests__/paymentProvider.test.ts (4 tests)
  modified:
    - server/iyzico.cjs (marketplace resources on the SDK wrapper)
    - server/routes/iyzico.ts (marketplace checkout init + OrderSet integration)
    - server/lib/schemas.ts (iyzicoMarketplaceInitSchema, iyzicoWebhookSchema)
    - server.ts (inject iyzicoProvider into iyzico routes)
decisions:
  - Commission per item = item.price - item.subMerchantPrice; aggregated per seller into negative ledger entries
  - subMerchantKey is server-sourced from seller records, never client input (T-02-004)
  - Checkout init refuses any OrderSet not in 'pending' status (409)
  - Verified callback transitions OrderSet to 'payment_received'
metrics:
  duration: ~60 minutes (across 2 interrupted executor dispatches + orchestrator finish)
  completed: 2026-06-03
---

# Phase 2 Payment & Order Lifecycle: Plan 01 Summary

## One-liner

iyzico marketplace payment foundation: an `IPaymentProvider` abstraction wraps the iyzico SDK with subMerchant commission splits, and the checkout init route is rewritten to validate the OrderSet, compute server-side commission, record pending ledger entries, and verify payment via a server-to-server callback.

## Tasks

| #   | Name                                                                      | Status | Commit  |
| --- | ------------------------------------------------------------------------- | ------ | ------- |
| 1   | (TDD) Test IyzicoProvider marketplace checkout init                       | Done   | ebdb72b |
| 2   | Extend iyzico.cjs + implement IPaymentProvider interface + IyzicoProvider | Done   | ea7cf1c |
| 3   | Rewrite iyzico routes for marketplace checkout + OrderSet integration     | Done   | 4e5ec15 |

## Task Details

### Task 1: RED tests (commit ebdb72b)

4 test cases in `server/services/__tests__/paymentProvider.test.ts` covering IyzicoProvider marketplace init. Initially RED (import unresolved until Task 2).

### Task 2: Provider abstraction (commit ea7cf1c)

- **paymentProvider.ts**: `IPaymentProvider` interface + `IyzicoProvider` implementation. Interface methods return payment-page URLs only — no raw SDK responses or API keys leak (T-02-003).
- **iyzico.cjs**: marketplace resources added to the SDK wrapper (subMerchant support).
- Task 1 tests pass (GREEN).

### Task 3: Marketplace routes (commit 4e5ec15)

- **schemas.ts**: `iyzicoMarketplaceInitSchema` (OrderSet-based, per-item `subMerchantKey`/`subMerchantPrice`) + `iyzicoWebhookSchema`.
- **routes/iyzico.ts**: `POST /api/iyzico/init` rewritten to go through `IPaymentProvider`. Verifies OrderSet exists and is `pending` (404/409 otherwise), aggregates per-seller commission (`item.price - item.subMerchantPrice`) into negative ledger entries (D-05), and on verified callback transitions the OrderSet to `payment_received`.
- **server.ts**: injects `iyzicoProvider` into the iyzico route deps.

## Deviations from Plan

1. **Executor interruptions**: The first two executor dispatches returned partial (stream-idle) before finishing. Tasks 1–2 were recovered by merging the executor worktree branch to master; Task 3's working-tree changes were verified (tsc + tests) and committed by the orchestrator. No code was lost or duplicated.
2. **Worktree isolation dropped for the phase**: Because every wave is effectively sequential (single-plan waves; wave 3 plans share `server.ts`), remaining plans run sequentially on master rather than in parallel worktrees.

## Threat Mitigation Coverage

| Threat ID | Mitigation                                                             | Status  |
| --------- | ---------------------------------------------------------------------- | ------- |
| T-02-001  | Server-side pricing/commission; client sends only OrderSet + item refs | Covered |
| T-02-002  | Callback uses iyzico-verified status (not client-provided)             | Covered |
| T-02-003  | Provider returns only payment-page URLs; no SDK/key leakage            | Covered |
| T-02-004  | subMerchantKey sourced from seller records server-side                 | Covered |

## Known Stubs

None — routes are wired to the live provider and ledger service.

## Self-Check: PASSED

- [x] `server/services/paymentProvider.ts` exists (IPaymentProvider + IyzicoProvider)
- [x] `iyzicoMarketplaceInitSchema` + `iyzicoWebhookSchema` in schemas.ts
- [x] `POST /api/iyzico/init` rewritten through IPaymentProvider with OrderSet validation
- [x] Per-seller commission written as negative ledger entries
- [x] `tsc --noEmit` passes (0 errors)
- [x] paymentProvider tests pass (4/4)
- [x] Commits ebdb72b (Task 1), ea7cf1c (Task 2), 4e5ec15 (Task 3) exist
