---
phase: 01-foundation-compliance
plan: 02
type: execute
subsystem: commission-engine
tags: [commission, ledger, admin-api, immutable, audit]
requires:
  - 01-01 (OrderSet/SubOrder model, transition engine, order routes)
  - research/ARCHITECTURE.md (Pattern 3)
  - research/CONTEXT.md (D-04, D-05, D-06)
provides:
  - COM-01 (Commission rule engine with specificity priority)
  - COM-02 (Admin CRUD for commission rules)
  - COM-03 (Immutable ledger with hash chain integrity)
affects:
  - server.ts (route registration)
  - server/routes/orders.ts (ledger entry on order creation)
  - firestore.rules (new collections)
  - src/services/commissionService.ts (API-based client helpers)
  - src/types/order.ts (SubOrder.commission, payoutAmount — already from 01-01)
tech-stack:
  added: [Node.js crypto (SHA-256)]
  patterns:
    [
      Server-side financial calculation,
      append-only ledger with Firestore transactions,
      TDD for business logic,
    ]
key-files:
  created:
    - server/services/commissionEngine.ts (177 lines)
    - server/services/__tests__/commissionEngine.test.ts (221 lines)
    - server/routes/commission.ts (278 lines)
    - server/services/ledgerService.ts (217 lines)
    - server/services/__tests__/ledgerService.test.ts (278 lines)
  modified:
    - server.ts (2 lines added: import + route registration)
    - server/routes/orders.ts (12 lines added: ledger entry in create flow)
    - src/services/commissionService.ts (60 lines added: API-based helpers)
    - firestore.rules (20 lines added: commissionRules + ledger collections)
decisions:
  - Plan-level TDD for Task 1 (commission engine) with RED/GREEN for specificity priority logic
  - Integer kurus throughout (1 TL = 100 kurus) for precise financial math
  - Ledger verifyChain reads all entries (small scale) — pagination added when needed
  - commissionRules admin routes use verifyAdmin middleware (threat T-01-006)
  - Ledger server-side writes only (firestore.rules blocks client create per T-01-010)
metrics:
  duration: 65 minutes
  completed_date: 2026-06-02
  total_tasks: 3
  total_commits: 4
  total_tests: 18
  test_passes: 18
  test_failures: 0
  lines_added: ~950
---

# Phase 1 Plan 2: Commission Engine + Immutable Ledger Summary

Server-side commission engine with category-based variable rates (5-20%), seller-specific overrides, and an append-only SHA-256 hash chain ledger for all financial entries. 18 tests across 2 test suites all passing.

## Task Results

### Task 1: Commission Engine with Specificity Priority Resolution (TDD)

RED phase committed (f470b7d) with 12 failing tests. GREEN phase committed (f62997f) implementing:

- `CommissionRule` and `CommissionResult` interfaces
- `resolveRate()` with 4-tier priority: seller override > category rule > DEFAULT_RATES > global 10%
- `calculateCommission()` with min (500 kurus/5 TL) and max (50000 kurus/500 TL) enforcement
- `getDefaultRates()` for admin consumption
- DEFAULT_RATES per D-05: Elektronik 5%, Giyim 10%, Ev & Yasam 12%, Kozmetik 15%, Mucevher 8%

All amounts in integer kurus. Zero-price edge case returns amount 0 with no min/max application.

### Task 2: Commission Rules Admin CRUD API and Order Integration (f1705ca)

- `server/routes/commission.ts`: POST/GET/PUT/DELETE `/api/admin/commission-rules` (admin-only via verifyAdmin)
- POST `/api/orders/calculate-commission` (authenticated preview via verifyFirebaseToken)
- GET `/api/commission-rules/defaults` (authenticated rate map)
- Zod validation schemas for all endpoints
- `server.ts` updated to register commission routes
- `firestore.rules` added: commissionRules (admin write) and ledger (no client writes)
- `src/services/commissionService.ts` extended with `getDefaultRatesFromServer()` and `calculateCommissionPreview()` API wrappers

### Task 3: Immutable Ledger with SHA-256 Hash Chain (54b728d)

- `server/services/ledgerService.ts`:
  - `recordEntry()`: Append-only via Firestore transaction. Auto-computes SHA-256 hash chained to previous entry. First entry gets empty previousHash.
  - `getEntriesByOrder()` / `getEntriesBySeller()`: Query helpers
  - `verifyChain()`: Full chain integrity verification — recomputes every hash, validates previousHash linkage
- 6 tests covering: hash validity, chain linkage, uncorrupted chain verification, tampered amount detection, broken previousHash chain detection, empty ledger
- Order creation flow in `server/routes/orders.ts` records `order_charge` ledger entry (non-blocking on failure)
- Ledger query endpoints in `commission.ts`: GET `/api/ledger/order/:orderSetId` (ownership check) and GET `/api/admin/ledger/verify` (chain integrity)
- Per D-03/D-06: T+7 payout trigger deferred to Phase 2 (payment processing)

## Verification Results

- `npx vitest run server/services/__tests__/commissionEngine.test.ts` — 12 of 12 passed
- `npx vitest run server/services/__tests__/ledgerService.test.ts` — 6 of 6 passed
- **Total: 18 of 18 tests passing**

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

| Flag                              | File                        | Description                                                                            |
| --------------------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| threat_flag: new_network_endpoint | server/routes/commission.ts | POST/GET/PUT/DELETE /api/admin/commission-rules — new admin-only collection management |
| threat_flag: new_network_endpoint | server/routes/commission.ts | POST /api/orders/calculate-commission — authenticated commission preview               |
| threat_flag: new_network_endpoint | server/routes/commission.ts | GET /api/ledger/order/:orderSetId — seller financial data with ownership check         |
| threat_flag: new_network_endpoint | server/routes/commission.ts | GET /api/admin/ledger/verify — admin chain integrity audit                             |

All new endpoints are covered by existing threat model (T-01-006 through T-01-010) with verifyAdmin or verifyFirebaseToken middleware.

## TDD Gate Compliance

- RED gate commit: f470b7d `test(01-foundation-compliance-02): add failing tests for commission engine`
- GREEN gate commit: f62997f `feat(01-foundation-compliance-02): implement commission engine with specificity priority`
- Gate sequence validated: test commit precedes feat commit.

## Self-Check: PASSED

- server/services/commissionEngine.ts — exists (177 lines, >60 min)
- server/services/**tests**/commissionEngine.test.ts — exists (221 lines)
- server/routes/commission.ts — exists (278 lines)
- server/services/ledgerService.ts — exists (217 lines, >80 min)
- server/services/**tests**/ledgerService.test.ts — exists (278 lines)
- server.ts — modified (import + registerCommissionRoutes)
- server/routes/orders.ts — modified (recordEntry in create flow)
- src/services/commissionService.ts — modified (API helpers)
- firestore.rules — modified (commissionRules + ledger collections)
- Commit f470b7d — found
- Commit f62997f — found
- Commit f1705ca — found
- Commit 54b728d — found
