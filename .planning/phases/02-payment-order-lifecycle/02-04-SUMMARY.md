---
phase: 02-payment-order-lifecycle
plan: 04
subsystem: finance-payout
tags: [payout, T+7, iyzico-approval, ledger, finance-dashboard, csv-export, tdd]
requires: [02-01, 02-02]
provides: [PAY-06, COM-04, COM-05]
affects:
  - server/services/payoutService.ts
  - server/services/ledgerService.ts
  - server/routes/finance.ts
  - server/routes/payouts.ts
  - server/routes/orders.ts
  - server.ts
  - src/components/seller/FinanceDashboard.tsx
  - src/services/financeService.ts
  - src/pages/SellerFinance.tsx
tech-stack:
  added: []
  patterns:
    - T+7 payout eligibility by scanning collected commission entries older than 7 days
    - iyzico approvalCreate called non-blocking on SubOrder delivery transition
    - Commission status lifecycle: pending -> collected (on delivery) -> released (T+7)
    - Server-only finance API — no client Firestore reads for ledger data (T-02-014)
    - CSV export with UTF-8 BOM for Turkish Excel compatibility
key-files:
  created:
    - server/services/payoutService.ts (getEligiblePayouts, processPayout, processDelivery, markCommissionCollected, getSellerBalance)
    - server/routes/payouts.ts (POST /api/process-scheduled-payouts, POST /api/admin/manual-payout, GET /api/finance/payout-history/:sellerId)
    - server/routes/finance.ts (5 seller finance endpoints including CSV export)
    - src/components/seller/FinanceDashboard.tsx (4 stat cards, transaction table, payout history, CSV download)
    - server/services/__tests__/payoutService.test.ts (4 TDD tests — RED then GREEN)
  modified:
    - server/services/ledgerService.ts (added status field + updateEntryStatus, getEntriesByStatus, getEntriesBySellerAndStatus)
    - server/routes/orders.ts (delivery hook triggers processDelivery non-blocking)
    - server.ts (registerPayoutRoutes + registerFinanceRoutes wired; legacy payout endpoint renamed)
    - src/services/financeService.ts (rewritten to server API calls — no Firestore)
    - src/pages/SellerFinance.tsx (simplified to delegate to FinanceDashboard)
decisions:
  - status field on LedgerEntry is optional (defaults to pending) for backward compatibility with existing callers
  - iyzico approval on delivery is non-blocking — logs warning and proceeds with ledger update if call fails
  - T+7 eligibility filter done client-side after Firestore query (composite index not guaranteed in dev)
  - Legacy sellerBalances/payoutSchedules payout endpoint preserved as /api/process-scheduled-payouts-legacy
  - Ledger amounts are in kurus (1/100 TRY) — FinanceDashboard divides by 100 for display
metrics:
  duration: ~35 minutes
  completed: 2026-06-03
---

# Phase 2 Plan 04: Payout Service & Finance Dashboard Summary

## One-liner

T+7 payout cron with iyzico escrow approval on delivery, commission status lifecycle (pending→collected→released), server-only finance API, and rewritten seller finance dashboard with 4 stat cards, transaction history, and CSV export.

## Tasks

| #   | Name                                                            | Status | Commit  |
| --- | --------------------------------------------------------------- | ------ | ------- |
| 1   | (TDD) Failing tests for payout service T+7 and approval         | Done   | 3df430e |
| 2   | Payout service, delivery hook, ledger status, cron + payouts.ts | Done   | fa657b3 |
| 3   | Finance API, FinanceDashboard component, CSV export             | Done   | 3d63b34 |

## Task Details

### Task 1: TDD RED (commit 3df430e)

4 tests in `server/services/__tests__/payoutService.test.ts`:

- Test 1: `getEligiblePayouts` returns seller for 8-day-old collected commission
- Test 2: `getEligiblePayouts` returns empty for 3-day-old entry (T+7 not met)
- Test 3: `markCommissionCollected` calls ledger collection correctly
- Test 4: `getSellerBalance` returns pending=500 for collected commission entry

All 4 failed RED (module not found) until Task 2.

### Task 2: Implementation (commit fa657b3)

- **ledgerService.ts**: Added optional `status` field (`pending|collected|released|reversed`) to `LedgerEntry`. Added `updateEntryStatus`, `getEntriesByStatus`, `getEntriesBySellerAndStatus`. All existing callers unchanged (status defaults to `pending`).
- **payoutService.ts**: `getEligiblePayouts` queries collected commissions older than T+7 and groups by seller. `processPayout` marks entries released and records payout entry. `processDelivery` calls iyzico approval (non-blocking), marks commission collected, records pending payout. `markCommissionCollected` and `getSellerBalance` exported.
- **routes/orders.ts**: Added `confirm_delivery` delivery hook after transition — calls `processDelivery` non-blocking via `.catch()`.
- **routes/payouts.ts**: `POST /api/process-scheduled-payouts` (verifyCronSecret), `POST /api/admin/manual-payout` (verifyAdmin), `GET /api/finance/payout-history/:sellerId`.
- **routes/finance.ts**: 5 endpoints — summary, transactions (paginated + filtered), payouts, CSV export (BOM + Turkish locale), commission breakdown.
- **server.ts**: `registerPayoutRoutes` + `registerFinanceRoutes` wired; inline payout endpoint renamed to `/api/process-scheduled-payouts-legacy`.

All 10 tests pass (payoutService 4/4, ledgerService 6/6). tsc clean.

### Task 3: Finance UI (commit 3d63b34)

- **financeService.ts**: Fully rewritten — all functions call server API with Firebase ID token auth. `getSellerFinanceSummary`, `getSellerTransactions` (with filters), `getSellerPayouts`, `exportSellerTransactions` (blob download), `getCommissionBreakdown`. Zero Firestore imports.
- **FinanceDashboard.tsx**: 250-line component — 4 stat cards (Kullanılabilir Bakiye/green, Bekleyen Kazanç/amber, Toplam Kazanç/purple, Son Ödeme), transaction table with type+date filters + refresh, payout history table, CSV export button with loading state, skeleton loaders for all sections.
- **SellerFinance.tsx**: Reduced from 551 lines to 46 lines — route guard + header + `<FinanceDashboard sellerId={user.id} />`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LedgerEntry.status optional for backward compatibility**

- **Found during:** Task 2 tsc check
- **Issue:** Adding `status` as required to `LedgerEntry` broke all existing `recordEntry` call sites in `iyzico.ts`, `orders.ts`, and `ledgerService.test.ts` that don't pass a status
- **Fix:** Made `status` optional (`status?:`) on the interface; `recordEntry` defaults to `'pending'`
- **Files modified:** `server/services/ledgerService.ts`
- **Commit:** fa657b3

**2. [Rule 1 - Bug] finance.ts TS2538 on optional status index**

- **Found during:** Task 2 tsc check
- **Issue:** `STATUS_LABELS[e.status]` raised TS2538 (undefined cannot be index type) because `status` is optional
- **Fix:** Guard with `e.status ? STATUS_LABELS[e.status] : undefined`
- **Files modified:** `server/routes/finance.ts`
- **Commit:** fa657b3

### Intentional Scope Decisions

- **Legacy payout endpoint preserved**: The old `POST /api/process-scheduled-payouts` operated on `sellerBalances`/`payoutSchedules` collections. Renamed to `/api/process-scheduled-payouts-legacy` to avoid breaking any existing cron. The new ledger-based endpoint is registered first at the same path via `registerPayoutRoutes`.

## Threat Mitigation Coverage

| Threat ID | Mitigation                                                                          | Status  |
| --------- | ----------------------------------------------------------------------------------- | ------- |
| T-02-014  | Server API only — verifyFirebaseToken + sellerId ownership on all finance endpoints | Covered |
| T-02-015  | verifyAdmin on /api/admin/manual-payout; verifyCronSecret on scheduled payout       | Covered |
| T-02-016  | Payout amounts calculated server-side from ledger; no client-provided amounts       | Covered |
| T-02-017  | Every payout recorded in immutable ledger with hash chain                           | Covered |

## Verification Results

- `npx vitest run server/services/__tests__/payoutService.test.ts` — 4/4 passed
- `npx vitest run server/services/__tests__/ledgerService.test.ts` — 6/6 passed
- `npx tsc --noEmit` — 0 errors

## Known Stubs

None — all API endpoints are wired to the live ledger service. FinanceDashboard loads from real server endpoints.

## Threat Flags

None — all new endpoints are within the planned threat model.

## Self-Check: PASSED

- [x] `server/services/payoutService.ts` exists with getEligiblePayouts, processPayout, processDelivery, markCommissionCollected, getSellerBalance
- [x] `server/routes/finance.ts` exists with GET /api/finance/seller/:sellerId/summary
- [x] `server/routes/payouts.ts` exists with POST /api/process-scheduled-payouts (verifyCronSecret)
- [x] `src/components/seller/FinanceDashboard.tsx` exists (4 stat cards, transaction table, payout history, CSV)
- [x] `src/services/financeService.ts` uses server API only (zero Firestore imports)
- [x] `src/pages/SellerFinance.tsx` delegates to FinanceDashboard (no direct Firestore reads)
- [x] iyzico approval called in processDelivery (non-blocking) when SubOrder transitions to delivered
- [x] LedgerEntry status lifecycle: pending -> collected -> released
- [x] 10 tests pass (4 payout + 6 ledger)
- [x] tsc --noEmit passes (0 errors)
- [x] Commits 3df430e (Task 1), fa657b3 (Task 2), 3d63b34 (Task 3) exist
