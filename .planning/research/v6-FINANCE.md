# v6 Admin Seller Control Center — Finance System Research

**Prepared:** 2026-06-08
**Scope:** Seller finance, payout lifecycle, commission engine, invoice/e-fatura, existing admin UIs, and control center recommendations.

---

## 1. Balance Computation

### Two Parallel Systems (Important)

There are two separate balance implementations that co-exist. Understanding both is critical.

#### System A — Legacy (`sellerPayoutService.ts`, Firestore collection `sellerBalances`)

`getSellerBalance` (line 67, `src/services/sellerPayoutService.ts`) reads the `sellerBalances` Firestore collection directly from the client via the Firebase SDK. It returns a `SellerBalance` document with these pre-computed fields:

| Field              | Meaning                                                      |
| ------------------ | ------------------------------------------------------------ |
| `totalEarned`      | Cumulative gross revenue (all time)                          |
| `totalCommission`  | Cumulative commission deducted                               |
| `totalFees`        | Cumulative platform fees deducted (separate from commission) |
| `totalPaidOut`     | Total already transferred out                                |
| `pendingBalance`   | Earned but not yet released                                  |
| `availableBalance` | Ready for withdrawal right now                               |

This document is written by `processAutomaticPayouts` (line 238). On auto-payout completion it zeroes out `availableBalance` and `pendingBalance` and increments `totalPaidOut`. There is no transactional write between an order event and this document — it is updated only at payout time. **RISK: the sellerBalances document can go stale if the cron fails or an order is refunded post-payout.**

#### System B — Canonical Ledger (`server/services/payoutService.ts`, Firestore collection `ledger`)

`getSellerBalance` (line 230, `server/services/payoutService.ts`) aggregates from ledger entries at query time:

```
available  = sum(|amount|) for entries where type='payout'  AND status='released'
pending    = sum(|amount|) for entries where type='commission' AND status='collected'
totalEarned = available + pending
```

This is the **authoritative balance**. The finance API (`GET /api/finance/seller/:sellerId/summary`) returns this value. `FinanceDashboard` (seller UI) reads from this API.

**RISK: `available` in System B measures money already paid out (released payout entries), not money the seller has yet to receive. This naming is counter-intuitive — a newly onboarded seller with no payouts processed will show `available=0` even though earnings exist as `pending` entries.** The control center must clarify this distinction.

#### Inputs to the Ledger

Order placement records two entries (via `server/routes/orders.ts` → `commissionEngine.calculateCommission` + `ledgerService.recordEntry`):

- `type='order_charge'`, `amount=priceInKurus`, `status='pending'`
- `type='commission'`, `amount=-commissionKurus`, `status='pending'`

On delivery (`processDelivery`, `server/services/payoutService.ts` line 118):

1. Commission entry flipped to `status='collected'`
2. A new `type='payout'`, `status='pending'` entry is recorded for sellerNet

On T+7 batch run:

- Eligible payout entries flipped to `status='released'`
- A new `type='payout'`, `status='released'` entry written (this is what `available` counts)

---

## 2. Payout Lifecycle

### States and Transitions

```
order placed
     |
     v
commission entry: pending
order_charge entry: pending
     |
delivery confirmed
     v
commission entry: collected        <-- T+7 clock starts here
pending payout entry written: pending
     |
     | T+7 days pass
     v
cron: POST /api/process-scheduled-payouts
     |
     +-- getEligiblePayouts() filters: type='commission' AND status='collected' AND createdAt < (now-7d)
     |
     v
processPayout(adminDb, sellerId, totalAmount, entryIds)
  - entryIds commission entries: collected → released  (parallel updateEntryStatus)
  - new 'payout' entry recorded: amount=-totalAmount, status='released'
```

### Request-Based Payouts (Legacy System A)

`requestPayout` (line 79, `src/services/sellerPayoutService.ts`) creates a document in `payoutRequests` collection with `status='pending'`. Status flow: `pending → processing → completed | failed`. `updatePayoutStatus` (line 119) updates this document and stamps `processedBy` and `processedAt`. This path is **disconnected from the ledger** — it does not write ledger entries.

**RISK: System A payouts (requestPayout → updatePayoutStatus) bypass the ledger entirely. If both systems are active simultaneously, balance double-counting is possible.**

### Manual Admin Override (Ledger-Based)

`POST /api/admin/manual-payout` (line 83, `server/routes/payouts.ts`):

- Requires `verifyAdmin` + `requireAdminRole('finance')`
- Body: `{ sellerId, amount, entryIds }` — admin must supply exact entryIds
- Calls `processPayout` (same as cron path)
- Writes `audit('payout.complete', ...)` to `auditLogs` collection

### Automatic Scheduled Payout (Three Variants)

| Variant                    | Endpoint                                                         | Auth               | Ledger? | Notes                       |
| -------------------------- | ---------------------------------------------------------------- | ------------------ | ------- | --------------------------- |
| T+7 ledger cron            | `POST /api/process-scheduled-payouts`                            | `verifyCronSecret` | Yes     | Canonical                   |
| Legacy sellerBalances cron | `POST /api/process-scheduled-payouts-legacy`                     | `verifyCronSecret` | No      | Kept for backward compat    |
| Client-side auto payout    | `processAutomaticPayouts()` in `sellerPayoutService.ts` line 195 | Client-side        | No      | Called from unknown trigger |

**RISK: Three auto-payout paths exist. The legacy path (`/api/process-scheduled-payouts-legacy`) and the client-side `processAutomaticPayouts` do NOT write to the ledger and do NOT call `audit()`. These must be decommissioned or the control center will show incomplete history.**

### Iyzico Escrow

`processDelivery` (line 118, `server/services/payoutService.ts`) calls `iyzico.approvalCreate` before marking the commission collected. If iyzico fails, it logs a warning and **continues** — the ledger is updated even if the escrow release API call fails. This is intentional (non-blocking) but creates a reconciliation gap.

---

## 3. Commission System

### Rule Storage (`commissionRules` Firestore collection)

Schema (`server/services/commissionEngine.ts`, `CommissionRule` interface):

| Field              | Type                                 | Notes                                                        |
| ------------------ | ------------------------------------ | ------------------------------------------------------------ |
| `ruleId`           | string                               | Firestore doc ID                                             |
| `type`             | `'category' \| 'seller' \| 'global'` | Specificity level                                            |
| `scope.categoryId` | string?                              | For category/seller rules                                    |
| `scope.sellerId`   | string?                              | For seller-specific rules                                    |
| `rate`             | number                               | 0.0–1.0 (e.g. 0.10 = 10%)                                    |
| `minCommission`    | number                               | Integer kurus (500 = 5 TL)                                   |
| `maxCommission`    | number                               | Integer kurus (50000 = 500 TL)                               |
| `active`           | boolean                              | Soft-delete via `active=false`                               |
| `priority`         | number                               | Lower = higher priority (seller=10, category=50, global=100) |

Hard-coded defaults in `commissionEngine.ts` (line 34):

- `elektronik`: 5%
- `giyim`: 10%
- `ev-ve-yasam`: 12%
- `kozmetik`: 15%
- `mucevher`: 8%
- All others (global default): 10%

### Rate Resolution Priority

1. Seller-specific active rule matching `sellerId + categoryId`
2. Category-specific active rule matching `categoryId`
3. `DEFAULT_RATES[categoryId]` hard-coded in engine
4. Global default 10%

`resolveRate` (line 55, `server/services/commissionEngine.ts`)

### Calculation

`calculateCommission` (line 123) takes `priceInKurus`, applies `resolveRate`, then clamps to `[minCommission, maxCommission]` from the matched rule. Returns `{ rate, amount, minApplied, maxApplied, ruleId }`.

There is also a client-side `calcCommission` in `src/services/commissionService.ts` (line 76) that applies a separate 3.5% platform service fee (`platformFee = itemPrice * 0.035`). **RISK: The server engine (`commissionEngine.ts`) does NOT apply this 3.5% platform fee. The client-side `calcCommission` does. These two implementations diverge and would produce different netAmount values. If the client display uses `calcCommission` while the ledger uses `commissionEngine`, sellers will see a different net than what is actually recorded.**

### Rule Admin API

| Method   | Endpoint                              | Auth                  | Effect                     |
| -------- | ------------------------------------- | --------------------- | -------------------------- |
| `POST`   | `/api/admin/commission-rules`         | `verifyAdmin`         | Create rule                |
| `GET`    | `/api/admin/commission-rules`         | `verifyAdmin`         | List all rules             |
| `PUT`    | `/api/admin/commission-rules/:ruleId` | `verifyAdmin`         | Update rule                |
| `DELETE` | `/api/admin/commission-rules/:ruleId` | `verifyAdmin`         | Soft-delete (active=false) |
| `GET`    | `/api/commission-rules/defaults`      | `verifyFirebaseToken` | Get default rates          |
| `POST`   | `/api/orders/calculate-commission`    | `verifyFirebaseToken` | Preview calculation        |

**RISK: None of the commission rule write endpoints call `audit()`. Changes to commission rates leave no audit trail. This is a compliance gap.**

### Commission Recording and Release

`recordCommission` in `src/services/commissionService.ts` (line 109) writes to `commissionTransactions` collection directly from the client using the Firebase SDK. `releaseCommissions` (line 139) updates `status='released'` on multiple TX docs in parallel. `getSellerCommissions` (line 127) reads by `sellerId`.

**RISK: `commissionTransactions` is a separate Firestore collection from `ledger`. Client-side `recordCommission` bypasses the server's hash-chained ledger. If both collections are in use, the platform has two sources of truth for commission data.**

---

## 4. Existing Finance UIs

### `AdminFinance` (`src/pages/AdminFinance.tsx`)

What it does:

- Fetches all orders via `getAllOrders()` (client-side Firestore read, no auth boundary)
- Filters by delivery status and period (30d / 90d / all)
- Computes GMV, commission, and seller payouts using a **hardcoded 10% commission** (`DEFAULT_COMMISSION = 0.10`, line 6)
- Shows top-10 sellers by sales volume

Gaps:

- Commission rate is hardcoded — does not read from `commissionRules`; a seller paying 5% (electronics) will be shown as 10%
- No payout actions; read-only
- No per-seller drill-down link
- Uses raw order data not the ledger; refunds and adjustments are invisible
- No date range selection beyond preset periods
- Seller ID shown truncated (12 chars); no seller name resolution

### `AdminPayments` (`src/pages/AdminPayments.tsx`)

What it does:

- CRUD for payment provider configurations (Stripe, Iyzico) stored in `paymentProviders` Firestore collection
- Toggle active/inactive per provider
- Region assignment (TR / EU / UK / US / GLOBAL)
- Masked input fields for API keys

Gaps:

- No payout management
- No commission rules management
- No ledger visibility
- No seller-specific financial data

### `SellerFinance` (`src/pages/SellerFinance.tsx`)

Delegates entirely to `FinanceDashboard` component. Uses System B (ledger API). Displays:

- Available balance, pending balance, total earned, last payout
- Filterable transaction history (type + date range)
- Payout history
- CSV export

### `SellerInvoices` (`src/pages/SellerInvoices.tsx`)

Shows invoice list filtered by seller. Actions: send to GİB, cancel, download XML, download text. GİB integration is currently mocked (`sendToGib` in `invoiceService.ts` line 204 — 90% success simulation with random delay).

### `FinanceDashboard` (`src/components/seller/FinanceDashboard.tsx`)

**Note on currency unit:** `formatCurrency` (line 26) divides amounts by 100 before display, treating all ledger amounts as kurus. This is correct for System B entries, but any System A `sellerBalances` values stored in TL would be divided incorrectly by 100.

---

## 5. Recommended Control Center Finance Section

### What to Surface (Read Panel)

The Finance section of the Admin Seller Control Center should, for a given seller, show:

**Balance Summary Card**

- Available balance (released payouts from ledger)
- Pending balance (collected commissions awaiting T+7)
- Total earned (all time)
- Amount paid out (all time — sum of released payout entries with negative amounts)
- Next auto-payout date (from `payoutSchedules`)
- Effective commission rate for top category (resolved via `resolveRate`)

**Ledger Feed** (paginated, filterable)

- All `ledger` entries for this seller sorted desc by `createdAt`
- Columns: date, type, order reference, amount (kurus → TL), status, hash (last 8 chars for integrity spot-check)
- Hash chain integrity badge (link to `GET /api/admin/ledger/verify`)

**Payout History**

- All `type='payout'` entries with status and `reference` (Stripe transfer ID if set)
- Pending payout requests from `payoutRequests` collection (System A — flagged as legacy)

**Commission Rules Panel**

- List of active rules applicable to this seller (seller-specific + category rules)
- Effective rate per product category shown as a preview table
- Link to global commission rules management

**Invoice Summary**

- Count by status: draft / sent / approved / rejected
- GİB integration status (real vs mock)
- Link to seller invoice list

### Admin Actions Table

| Action                                | Endpoint / Service                                                                 | Guardrail                                                                                                           | Audit                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Trigger manual payout                 | `POST /api/admin/manual-payout` body `{sellerId, amount, entryIds}`                | Requires `AdminRole='finance'`; amount must match sum of provided `entryIds`; entryIds must be `status='collected'` | `audit('payout.complete', ...)` — already implemented in `server/routes/payouts.ts` line 103 |
| Override payout status (legacy)       | `updatePayoutStatus(id, status, processedBy)` in `sellerPayoutService.ts` line 119 | Only for `payoutRequests` docs; require confirmation modal; do not use for ledger-based payouts                     | Needs `audit('payout.process', ...)` call added                                              |
| Create/edit commission rule           | `POST /api/admin/commission-rules` or `PUT /api/admin/commission-rules/:ruleId`    | Rate clamped 0–100%; rate change must show before/after preview; confirm dialog required                            | **MISSING — must add `audit('settings.update', ...)` call to commission route handlers**     |
| Deactivate commission rule            | `DELETE /api/admin/commission-rules/:ruleId` (soft-delete)                         | Confirm effect on active sellers; show count of sellers/categories affected                                         | **MISSING — same gap as above**                                                              |
| Release specific commissions manually | `POST /api/admin/manual-payout` with specific `entryIds`                           | Limit to entries in `collected` status older than T+2 (grace period)                                                | Already audited via `payout.complete`                                                        |
| View ledger hash chain                | `GET /api/admin/ledger/verify`                                                     | Read-only; surface as integrity check panel                                                                         | No audit needed (read)                                                                       |
| Add manual adjustment to ledger       | Not yet implemented                                                                | Future: require `reason` text; require second admin confirmation; cannot edit existing entries                      | Would need new `audit('settings.update', ...)` action type                                   |
| Export seller transactions            | `GET /api/finance/seller/:sellerId/export`                                         | Admin can access any seller; ownership check in route uses `ownerOrAdmin()` already                                 | Read-only; no audit needed                                                                   |
| Cancel e-fatura invoice               | `cancelInvoice(invoiceId)` via `invoiceService.ts`                                 | Only `draft` or `sent` status; GİB-approved invoices cannot be cancelled (enforce server-side)                      | Needs audit entry added                                                                      |
| Resend invoice to GİB                 | `sendInvoiceToGib(invoiceId)` via `invoiceService.ts`                              | Only for `draft` or `rejected` status                                                                               | Needs audit entry added                                                                      |

### Guardrails to Implement

**Money-Handling Risks requiring mitigation before v6 goes live:**

1. **Dual system risk** — `sellerBalances` (System A) and `ledger` (System B) can diverge. The control center must display ledger (System B) data only and mark System A data as legacy/unverified. Surface a reconciliation warning if a seller has `sellerBalances` doc AND `ledger` entries with conflicting totals.

2. **Client-side commission write risk** — `recordCommission` in `src/services/commissionService.ts` writes to `commissionTransactions` from the client. Firestore security rules must block client writes to this collection (verify in `firestore.rules`). The admin control center should not expose this collection to admins as authoritative.

3. **Platform fee divergence** — `commissionService.ts` applies 3.5% platform fee; `commissionEngine.ts` does not. The control center should always show the server-engine result (`/api/orders/calculate-commission`) when displaying effective rates, not the client-side `calcCommission` value.

4. **Missing audit trail on commission rule changes** — Any admin who changes a commission rate leaves no record. Before the control center ships, add `audit()` calls in `server/routes/commission.ts` for POST, PUT, and DELETE handlers.

5. **Auto-payout client-side path** — `processAutomaticPayouts()` in `sellerPayoutService.ts` can be called client-side and writes directly to Firestore without auth verification or audit. This function should be disabled or restricted to server-only invocation.

6. **iyzico escrow non-blocking failure** — `processDelivery` continues after iyzico approval failure. The control center should expose a reconciliation panel listing subOrders where iyzico approval failed (where ledger shows `collected` but `reference` field is empty or `paymentTransactionId` was null).

7. **Invoice number counter race condition** — `getNextInvoiceNumber()` in `invoiceService.ts` (line 189) uses an in-memory `_counter` variable initialized from a Firestore query. On server restart or multi-instance deploy, duplicate invoice numbers are possible. For production e-fatura compliance this must use a Firestore transaction or atomic counter.

8. **GİB integration is fully mocked** — `sendToGib()` in `invoiceService.ts` (line 204) is a mock with random 90% success rate. The control center should prominently flag `gibStatus='mock'` and block display of ETTN values for invoices that were accepted by the mock rather than real GİB.

### Phase-Specific Flags

| Area                    | Flag                                                           | Action                                                                   |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Commission rules editor | Needs audit trail                                              | Add `audit()` calls in `commission.ts` before building UI                |
| Ledger viewer           | Hash chain verify endpoint exists (`/api/admin/ledger/verify`) | Wire into UI as integrity badge                                          |
| Manual payout           | `requireAdminRole('finance')` already enforced                 | Confirm `AdminRole='finance'` is assignable in admin user management     |
| Invoice panel           | GİB mock must be labeled                                       | Add `isMock` flag to `InvoiceData` type and surface in admin view        |
| System A cleanup        | `payoutRequests` and `sellerBalances` collections              | Document which sellers were created under System A and migrate or freeze |

---

## File Reference Index

| File                                         | Purpose                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/services/sellerPayoutService.ts`        | System A: sellerBalances doc, payoutRequests CRUD, schedules, auto-payout              |
| `src/services/commissionService.ts`          | Client-side commission rules + transactions; calculates with 3.5% platform fee         |
| `src/services/financeService.ts`             | Client-facing API wrapper for System B ledger endpoints                                |
| `src/services/invoiceService.ts`             | UBL-TR 2.1 invoice generation, GİB mock submission, Firestore CRUD                     |
| `src/services/efaturaService.ts`             | Stub for Paraşüt/Logo e-fatura API; disabled if env vars not set                       |
| `src/pages/AdminFinance.tsx`                 | Existing admin finance overview; hardcoded 10% commission; read-only                   |
| `src/pages/AdminPayments.tsx`                | Payment provider config (Stripe/Iyzico keys + regions); not payout-related             |
| `src/pages/SellerFinance.tsx`                | Seller finance page shell; delegates to FinanceDashboard                               |
| `src/pages/SellerInvoices.tsx`               | Seller invoice management with GİB send/cancel/download                                |
| `src/components/seller/FinanceDashboard.tsx` | Full seller finance UI using System B API                                              |
| `server/routes/payouts.ts`                   | T+7 cron endpoint, manual admin payout, payout history                                 |
| `server/routes/finance.ts`                   | Seller finance API: summary, transactions, payouts, export, commission breakdown       |
| `server/routes/commission.ts`                | Admin commission rule CRUD + calculate-commission + ledger verify                      |
| `server/services/ledgerService.ts`           | Append-only ledger with SHA-256 hash chain; `recordEntry`, `verifyChain`               |
| `server/services/payoutService.ts`           | System B: `getSellerBalance`, `getEligiblePayouts`, `processPayout`, `processDelivery` |
| `server/services/commissionEngine.ts`        | Rate resolution, `calculateCommission`, `DEFAULT_RATES`                                |
| `server/lib/auditLog.ts`                     | `audit()` and `logAudit()` fire-and-forget to `auditLogs` collection                   |
| `src/types.ts` line 21                       | `AdminRole = 'super-admin' \| 'support' \| 'finance'`                                  |
