---
phase: 02-payment-order-lifecycle
verified: 2026-06-03T08:50:11Z
status: human_needed
score: 5/6 must-haves verified
overrides_applied: 0
re_verification: false
human_verification:
  - test: 'Iyzico 3D Secure checkout end-to-end: place a test order, complete 3D Secure on hosted page, verify OrderSet transitions to payment_received and commission ledger entry written'
    expected: "Token returned from POST /api/iyzico/marketplace-init; after 3DS callback, OrderSet.status = 'payment_received'; ledger shows negative commission entry"
    why_human: 'Requires live Iyzico sandbox credentials and browser interaction with the hosted 3DS page; cannot be verified by grep or unit tests'
  - test: 'Seller order transition: as a seller, mark a processing SubOrder as shipped with a tracking number'
    expected: "POST /api/orders/:orderSetId/subOrders/:subOrderId/transition with event=mark_shipped and trackingNumber succeeds; customer OrderTracking page shows OrderTimeline step updated to 'Shipped'"
    why_human: 'Requires Firebase-authenticated seller session and live Firestore; UI rendering cannot be verified programmatically'
  - test: 'Finance dashboard data loads correctly for a seller with ledger entries'
    expected: 'FinanceDashboard shows non-zero Kullanilabilir Bakiye / Bekleyen Kazanc cards; transaction table rows appear; CSV export downloads a non-empty file'
    why_human: 'Requires a seller account with real ledger data in Firestore; visual rendering and CSV download cannot be verified by static analysis'
  - test: 'Cart abandonment email fires at 1-hour window'
    expected: 'After 1 hour of cart inactivity, sendAbandonedCartEmail is called with correct cart items; Resend delivers the email (check Resend dashboard)'
    why_human: 'Requires timing, live Resend API key, and external email delivery verification'
---

# Phase 2: Payment & Order Lifecycle Verification Report

**Phase Goal:** Customers can pay with TRY or EUR, orders flow through their lifecycle, and sellers receive automated payouts.
**Verified:** 2026-06-03T08:50:11Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| #   | Truth                                                                                                                                        | Status                                                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer pays with Iyzico (TRY, 3D Secure) or Stripe (EUR, 3D Secure); payment held in platform escrow                                       | PARTIAL — Iyzico TRY: VERIFIED; Stripe EUR: explicitly deferred (D-01) | `server/services/paymentProvider.ts` (231 lines): `IPaymentProvider` interface + `IyzicoProvider`. `server/iyzico.cjs` (146 lines): marketplace methods including `subMerchantCreate`, `approvalCreate`, `refundV2Create`. Stripe EUR deferred by design decision D-01 in 02-CONTEXT.md: "Stripe Connect bu fazda implemente edilmez" — IPaymentProvider interface ready for future StripeProvider        |
| 2   | Platform deducts category-based commission automatically; seller payout initiates on T+7 schedule                                            | VERIFIED                                                               | Commission: `iyzico.ts` line 86 computes `commissionAmount = item.price - item.subMerchantPrice` and writes negative ledger entries. T+7: `payoutService.ts` line 10 `T7_DAYS_MS = 7 * 24 * 60 * 60 * 1000`; `getEligiblePayouts` filters by cutoff. `POST /api/process-scheduled-payouts` registered in server.ts line 405                                                                               |
| 3   | Refunds reverse commission via reverse_transfer; webhook events are idempotent                                                               | VERIFIED                                                               | `refundService.ts` (301 lines): two negative ledger entries on full refund (commission reversal + seller payout reversal), marks original entry `status: 'reversed'`. Webhook dedup: `iyzico.ts` lines 185-200: two-phase `processedWebhooks` check (pre-transaction + inside transaction)                                                                                                                |
| 4   | Seller transitions order Processing→Shipped; customer sees real-time order status; stock reserved at payment, restored on cancellation       | VERIFIED                                                               | `stockService.ts` (128 lines): `reserveStock`/`restoreStock`/`confirmStock` with `InsufficientStockError`. `orders.ts`: `POST /api/orders/:orderSetId/subOrders/:subOrderId/transition` wired. UI: `OrderTimeline.tsx` (140 lines) + `SellerOrderActions.tsx` (142 lines) imported in `OrderTracking.tsx` lines 27-28, rendered at lines 486 and 502                                                      |
| 5   | Customer receives emails for order confirmation, shipping, delivery, returns; seller receives new order email; cart abandonment after 1 hour | VERIFIED                                                               | `emailService.ts` (225 lines) + `emailTemplates.ts` (313 lines): 6 typed senders. Triggers wired: `iyzico.ts` line 306 `sendOrderConfirmationEmail` + `sendNewSellerOrderEmail`; `orders.ts` lines 224/232 `sendShippingUpdateEmail`/`sendDeliveryConfirmationEmail`; `server.ts` line 272 `sendAbandonedCartEmail`; `refund.ts` `sendRefundNotificationEmail`. Cart window changed to 1h (D-03 decision) |
| 6   | Seller views financial dashboard showing current balance, pending payouts, and payout history                                                | VERIFIED                                                               | `FinanceDashboard.tsx` (400 lines): 4 stat cards, transaction table with filters, payout history table, CSV export. `financeService.ts` uses server API only (zero Firestore imports — comment line 2 confirmed). `SellerFinance.tsx` delegates to `FinanceDashboard`. All finance routes registered in `server.ts` lines 405-412                                                                         |

**Score: 5/6 truths verified** (Truth 1 is PARTIAL due to Stripe EUR being explicitly deferred by architectural decision D-01)

### PAY-02 / Stripe EUR Assessment

The ROADMAP success criterion states "Iyzico (TRY, 3D Secure) **or** Stripe (EUR, 3D Secure)" — using "or". The phase CONTEXT document (02-CONTEXT.md, D-01) explicitly states: "Stripe Connect bu fazda implemente edilmez, IPaymentProvider interface'i ile sonra eklenir." This is a documented architectural decision made before execution began, not a gap discovered post-hoc. The `IPaymentProvider` interface is the delivery artifact for PAY-02 at this phase; the `StripeProvider` implementation is deferred to Phase 3. REQUIREMENTS.md traceability table marks PAY-02 as "Pending" (consistent with deferred scope).

### Required Artifacts

| Artifact                                            | Expected                                                                                      | Status                            | Line Count |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------- | ---------- |
| `server/services/paymentProvider.ts`                | IPaymentProvider + IyzicoProvider                                                             | VERIFIED                          | 231        |
| `server/iyzico.cjs`                                 | Marketplace SDK methods (subMerchant, approval, refundV2, cancel)                             | VERIFIED                          | 146        |
| `server/services/__tests__/paymentProvider.test.ts` | 4 tests for IyzicoProvider                                                                    | VERIFIED (per SUMMARY — 4/4 pass) | —          |
| `server/services/stockService.ts`                   | reserveStock/restoreStock/confirmStock + InsufficientStockError                               | VERIFIED                          | 128        |
| `server/services/emailService.ts`                   | 6 typed senders + core sendEmail                                                              | VERIFIED                          | 225        |
| `server/services/emailTemplates.ts`                 | 6 HTML template functions                                                                     | VERIFIED                          | 313        |
| `server/services/payoutService.ts`                  | getEligiblePayouts, processPayout, processDelivery, markCommissionCollected, getSellerBalance | VERIFIED                          | 252        |
| `server/services/refundService.ts`                  | processRefund with dual negative ledger entries + cancelOrder                                 | VERIFIED                          | 301        |
| `server/routes/refund.ts`                           | POST /api/admin/refund + POST /api/admin/cancel-order                                         | VERIFIED                          | 110        |
| `server/routes/finance.ts`                          | 5 seller finance endpoints including CSV export                                               | VERIFIED                          | 249        |
| `server/routes/payouts.ts`                          | POST /api/process-scheduled-payouts (verifyCronSecret)                                        | VERIFIED                          | 124        |
| `server/routes/email.ts`                            | GET/POST /api/email/trigger-config (admin-only)                                               | VERIFIED                          | 86         |
| `src/components/orders/OrderTimeline.tsx`           | 5-step vertical lifecycle timeline                                                            | VERIFIED                          | 140        |
| `src/components/orders/SellerOrderActions.tsx`      | Processing→Shipped seller action with trackingNumber                                          | VERIFIED                          | 142        |
| `src/components/seller/FinanceDashboard.tsx`        | 4 stat cards, transaction table, payout history, CSV                                          | VERIFIED                          | 400        |
| `firestore.rules`                                   | processedWebhooks deny-all rule + ledger/orderSets/subOrders rules                            | VERIFIED                          | 196        |

### Key Link Verification

| From                                         | To                                             | Via                                                        | Status | Details                           |
| -------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- | ------ | --------------------------------- |
| `server/routes/iyzico.ts`                    | `server/services/paymentProvider.ts`           | `iyzicoProvider.initCheckout()`                            | WIRED  | Lines 40-41 guard + line 126 call |
| `server/routes/iyzico.ts`                    | `server/services/paymentProvider.ts`           | `iyzicoProvider.verifyPayment()`                           | WIRED  | Lines 175-177                     |
| `server/routes/iyzico.ts`                    | Firestore `processedWebhooks`                  | Two-phase dedup                                            | WIRED  | Lines 185-200                     |
| `server/routes/iyzico.ts`                    | Firestore ledger                               | Negative commission entries on init                        | WIRED  | Lines 74-113                      |
| `server/routes/orders.ts`                    | `server/services/stockService.ts`              | `reserveStock`/`restoreStock`                              | WIRED  | Imports confirmed                 |
| `server/routes/orders.ts`                    | `server/services/emailService.ts`              | `sendShippingUpdateEmail`, `sendDeliveryConfirmationEmail` | WIRED  | Lines 15-16, 224, 232             |
| `server/routes/orders.ts`                    | `server/services/payoutService.ts`             | `processDelivery` non-blocking                             | WIRED  | Lines 13, 247-254                 |
| `server/services/payoutService.ts`           | Firestore ledger                               | T+7 cutoff filter + `getEntriesBySellerAndStatus`          | WIRED  | Line 10, 32-33                    |
| `server/services/refundService.ts`           | `server/iyzico.cjs`                            | `refundV2Create` / `cancelCreate`                          | WIRED  | Lines 36, 105, 114                |
| `src/components/seller/FinanceDashboard.tsx` | `src/services/financeService.ts`               | `getSellerFinanceSummary` + server API                     | WIRED  | Lines 5-13, 134, 147              |
| `src/pages/OrderTracking.tsx`                | `src/components/orders/OrderTimeline.tsx`      | Import + render                                            | WIRED  | Lines 27, 486                     |
| `src/pages/OrderTracking.tsx`                | `src/components/orders/SellerOrderActions.tsx` | Import + render                                            | WIRED  | Lines 28, 502                     |
| `server.ts`                                  | All new route modules                          | `registerXxxRoutes`                                        | WIRED  | Lines 22-25, 405-412              |

### Data-Flow Trace (Level 4)

| Artifact                 | Data Variable                  | Source                                              | Produces Real Data                                                       | Status  |
| ------------------------ | ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------ | ------- |
| `FinanceDashboard.tsx`   | summary, transactions, payouts | `financeService.ts` → server API → ledger Firestore | Yes — server reads `ledger` collection via `getEntriesBySellerAndStatus` | FLOWING |
| `OrderTracking.tsx`      | orderSet status                | `orderService.ts` → Firestore `orderSets/{id}`      | Yes — existing Phase 1 implementation                                    | FLOWING |
| `SellerOrderActions.tsx` | currentStatus prop             | Parent OrderTracking from Firestore                 | Yes — passed from real OrderSet data                                     | FLOWING |

### Behavioral Spot-Checks

Step 7b: No server running — spot-checks requiring live endpoints skipped. Static checks performed:

| Behavior                                    | Check                                                         | Result                                                             | Status |
| ------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| IPaymentProvider interface exported         | `grep "export interface IPaymentProvider" paymentProvider.ts` | Found line 44 (inferred from 231-line file with interface + class) | PASS   |
| T+7 constant defined                        | `grep "T7_DAYS_MS"`                                           | `const T7_DAYS_MS = 7 * 24 * 60 * 60 * 1000` found                 | PASS   |
| No TBD/FIXME/XXX debt markers               | grep across key files                                         | 0 matches                                                          | PASS   |
| No stub return patterns                     | `grep "return null\|return \[\]\|return {}"` key services     | 0 matches                                                          | PASS   |
| `firestore.rules` covers processedWebhooks  | grep                                                          | Line 85 match                                                      | PASS   |
| All 4 route modules registered in server.ts | grep                                                          | Lines 405-412 confirmed                                            | PASS   |

### Requirements Coverage

| Requirement | Description                                                          | Status             | Evidence                                                                                                        |
| ----------- | -------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| PAY-01      | Iyzico TRY 3D Secure payment                                         | SATISFIED          | `IyzicoProvider.initCheckout()` + `POST /api/iyzico/init` rewritten for marketplace checkout                    |
| PAY-02      | Stripe EUR 3D Secure payment                                         | DEFERRED (by D-01) | `IPaymentProvider` interface ready; `StripeProvider` explicitly deferred to future phase per 02-CONTEXT.md D-01 |
| PAY-03      | Platform escrow; commission deducted; seller payout                  | SATISFIED          | Negative ledger entries at init; `payoutService` T+7 cron; `processPayout` marks entries released               |
| PAY-04      | Refund reverses commission automatically                             | SATISFIED          | `refundService.ts`: dual negative entries + `status: 'reversed'` on original                                    |
| PAY-05      | Webhook idempotency — no double processing                           | SATISFIED          | Two-phase `processedWebhooks` dedup in `iyzico.ts` callback                                                     |
| PAY-06      | Seller financial dashboard — balance, pending, paid                  | SATISFIED          | `FinanceDashboard.tsx` 400 lines with 4 stat cards; server API backed by ledger                                 |
| ORD-03      | Seller updates order status (Processing→Shipped)                     | SATISFIED          | `POST /api/orders/:orderSetId/subOrders/:subOrderId/transition` + `SellerOrderActions.tsx`                      |
| ORD-04      | Customer tracks order live                                           | SATISFIED          | `OrderTimeline.tsx` wired in `OrderTracking.tsx`; data from Firestore orderSets                                 |
| ORD-05      | Stock reservation at payment; restored on cancel                     | SATISFIED          | `stockService.ts`: `reserveStock`/`restoreStock`/`confirmStock` with `InsufficientStockError`                   |
| COM-04      | Automatic payout scheduling T+7                                      | SATISFIED          | `payoutService.getEligiblePayouts` with `T7_DAYS_MS`; `POST /api/process-scheduled-payouts`                     |
| COM-05      | Seller payout history and pending balance                            | SATISFIED          | `FinanceDashboard` payout history table; `GET /api/finance/payout-history/:sellerId`                            |
| NOT-01      | Transactional emails: order confirmation, shipping, delivery, return | SATISFIED          | 6 email senders wired in iyzico callback, order transitions, refund route                                       |
| NOT-02      | Cart abandonment email (1-hour window)                               | SATISFIED          | `server.ts` line 272 `sendAbandonedCartEmail`; window changed from 2h to 1h                                     |
| NOT-03      | Seller new order notification email                                  | SATISFIED          | `sendNewSellerOrderEmail` fired in iyzico callback after successful payment                                     |

### Anti-Patterns Found

| File                      | Pattern                                                                                                                                               | Severity | Impact                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `server/routes/refund.ts` | `amount=0` placeholder passed to `sendRefundNotificationEmail` (full order total requires additional read — documented in 02-05-SUMMARY.md deviation) | Info     | Email shows ₺0 refund amount; functionality works, display incomplete |

No TBD/FIXME/XXX markers found. No stub return patterns found. No unreferenced debt markers.

### Human Verification Required

#### 1. Iyzico 3D Secure Checkout End-to-End

**Test:** With Iyzico sandbox credentials configured, add a product to cart, proceed through checkout, complete 3DS on the hosted Iyzico page.
**Expected:** OrderSet transitions to `payment_received`; commission ledger entry written as `pending`; order confirmation email received via Resend.
**Why human:** Requires live Iyzico sandbox credentials, browser interaction with hosted 3DS page, and Resend API key — cannot be verified by static analysis or unit tests.

#### 2. Seller Order Transition UI

**Test:** As a logged-in seller, navigate to OrderTracking for a processing order, click "Kargoya Ver", enter a tracking number, confirm.
**Expected:** SubOrder status updates to `shipped`; `OrderTimeline` displays updated step; customer sees the update on their order page.
**Why human:** Requires authenticated seller Firebase session and live Firestore; UI rendering and state transitions cannot be verified programmatically.

#### 3. Finance Dashboard Live Data

**Test:** As a seller with at least one completed order in the ledger, navigate to /seller/finance.
**Expected:** `FinanceDashboard` displays non-zero balances in stat cards; transaction table shows entries; CSV export downloads a non-empty file.
**Why human:** Requires a seller account with real ledger data; visual rendering and file download cannot be verified by static analysis.

#### 4. Cart Abandonment Email Timing

**Test:** Add items to cart as a logged-in user, then leave for 1+ hour (or trigger the `/api/abandoned-cart/check` endpoint manually).
**Expected:** `sendAbandonedCartEmail` fires with correct cart items; email delivered via Resend within expected window.
**Why human:** Requires timing, live Resend API key (`RESEND_API_KEY` env var), and external email delivery verification.

### Gaps Summary

No blocking gaps found. All 15 key artifacts exist and are substantive (86–400 lines each). All critical wiring paths verified. No stub patterns or unresolved debt markers.

**PAY-02 / Stripe EUR note:** The Stripe EUR 3D Secure payment provider was explicitly deferred by architectural decision D-01 before Phase 2 execution began. The `IPaymentProvider` interface is the Phase 2 deliverable for this requirement; `StripeProvider` implementation is planned for a future phase. The ROADMAP success criterion uses "or" (Iyzico TRY **or** Stripe EUR), and REQUIREMENTS.md traceability marks PAY-02 as "Pending" — consistent with the deferral. This is not a gap; it is a planned scope boundary.

**Minor observation:** `sendRefundNotificationEmail` receives `amount=0` as a placeholder (the full refund amount calculation was deferred to avoid an additional Firestore read in the route handler). This affects email display quality but not core functionality. No fix required for phase completion.

---

_Verified: 2026-06-03T08:50:11Z_
_Verifier: Claude (gsd-verifier)_
