# Phase 2: Payment & Order Lifecycle - Research

**Researched:** 2026-06-02
**Domain:** Turkish marketplace payment processing, iyzico Marketplace API, order lifecycle, escrow, payouts, transactional email
**Confidence:** HIGH

## Summary

This phase implements the full payment and order lifecycle for a Turkish marketplace using iyzico Marketplace API. The architecture is 60% pre-built: Phase 1 delivered the state machine (transitionEngine), commission engine, immutable ledger, and OrderSet/SubOrder data model. What remains is the iyzico Marketplace upgrade (sub-merchant onboarding, commission splitting in basket items, escrow approval flow), webhook idempotency, inventory reservation, transactional emails, automated T+7 payouts, and the seller finance dashboard.

The iyzico `iyzipay` SDK (v2.0.67) has all required resources: `subMerchant` (create/update/retrieve), `approval` (release escrow), `checkoutFormInitialize` (hosted checkout), `refundV2` (per-transaction refund), `cancel` (full cancel). The current CJS wrapper (`server/iyzico.cjs`) only wraps three methods and must be extended extensively. The key architectural insight is that iyzico Marketplace uses `paymentGroup: 'PRODUCT'` for escrow and `subMerchantPrice` per basket item for commission splitting -- not the platform-level hold described in the abstract architecture docs.

**Primary recommendation:** Extend the existing `iyzico.cjs` wrapper with all marketplace resources, modify `POST /api/iyzico/init` to accept per-item subMerchantKey/subMerchantPrice, add atomic Firestore webhook handling with eventId dedup, and implement the approval flow via `transitionEngine` integration.

### Phase Requirements Addressed

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Iyzico TRY 3D Secure payment | iyzico hosted checkout with `checkoutFormInitialize` + `subMerchantKey` per basket item; 3D Secure automatic |
| PAY-03 | Platform escrow + commission split | `paymentGroup: 'PRODUCT'` holds funds; `subMerchantPrice = price - commissionAmount` splits; approval API releases |
| PAY-04 | Refund + commission reversal | `iyzico.cancel.create()` (full) or `iyzico.refundV2.create()` (per item); ledger records negative entries |
| PAY-05 | Webhook idempotency | Firestore `processedWebhooks` collection with eventId dedup inside atomic transaction |
| PAY-06 | Seller finance dashboard | Server API aggregates ledger entries; Firestore `escrowBalances` collection for real-time reads |
| ORD-03 | Seller status update | `POST /api/orders/{orderSetId}/subOrders/{subOrderId}/transition` calling `transitionEngine` |
| ORD-04 | Live order tracking | OrderSet + SubOrder reads via server API; timeline from `order_status_history` collection |
| ORD-05 | Stock reservation | Atomic Firestore transaction at checkout init; `stock.reserved += qty` check; 15min timeout via Cloud Function |
| COM-04 | Auto T+7 payout | Cron endpoint runs payout calculation; updates ledger from 'pending' to 'released'; iyzico IBAN payouts are automatic after approval |
| COM-05 | Payout history | Ledger query by sellerId; aggregation service for dashboard |
| NOT-01 | Transactional emails | SendGrid/Resend SMTP; React Email templates; triggers: confirmed, shipped, delivered, refunded |
| NOT-02 | Cart abandonment | Existing trigger refined (Firebase Trigger Email replacement) |
| NOT-03 | Seller new-order notification | Email sent when OrderSet transitions to 'processing' |

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Iyzico-first. Stripe Connect not in this phase. IPaymentProvider interface for later.
- **D-02:** IPaymentProvider interface: `initCheckout(orderData)`, `verifyPayment(paymentId)`, `processRefund(paymentId, amount)`. First impl: IyzicoProvider. Provider selection auto by region (TR -> Iyzico, EU -> Stripe -- future).
- **D-03:** Iyzico hosted checkout (PCI-DSS on iyzico). Customer redirected to iyzico form. 3D Secure mandatory. Callback URL for result.
- **D-04:** Platform-held escrow. Payment held in platform iyzico account. On delivery: commission deducted, remaining transferred to seller after T+7.
- **D-05:** Commission calculation at payment time (`commissionEngine.calculate()`), written as 'pending' in ledger. On delivery -> 'collected'. On T+7 payout -> 'released'.
- **D-06:** Full refund + automatic commission reversal. Seller share and commission returned together. Negative entry in ledger.
- **D-07:** Event ID dedup via Firestore. `processedWebhooks` collection: `{eventId, provider, processedAt, orderId}`. Check before processing -- if exists, return 200 skip.
- **D-08:** Atomic Firestore transaction: webhook ID record + OrderSet/SubOrder status update in same transaction. Failure -> return 500, iyzico retries.
- **D-09:** Stock reserved at checkout init (15min timeout). On payment complete -> permanent. On timeout/cancel -> restore. Atomic Firestore stock update.
- **D-10:** SendGrid/Resend SMTP emails. React Email templates. Triggers: order confirmed, shipped, delivered, refunded -> customer. New order -> seller.
- **D-11:** Cron endpoint `POST /api/process-scheduled-payouts` -- T+7 calc, batch, ledger entry. Manual payout from admin panel (override).
- **D-12:** Full seller finance dashboard: available balance, pending (escrow), total earnings, payouts table, date filter, CSV export.
- **D-13:** Seller: dropdown status update (Processing -> Shipped), tracking number required. Customer: timeline view (pending -> paid -> processing -> shipped -> delivered) + tracking link.

### Claude's Discretion
- SendGrid vs Resend selection (cost and API preference)
- React Email template design
- Stock timeout cleanup mechanism (Cloud Function vs polling)
- Timeline UI component design
- CSV export format details

### Deferred Ideas (OUT OF SCOPE)
- Stripe Connect integration (IPaymentProvider interface ready, implementation later)
- Multi-currency payment (EUR) -- comes with Stripe Connect
- Multi-vendor cart (single cart, multiple sellers) -- P2
- Webhooks currently broken -- fixed in Phase 2
- AI analytics panel -- P2 deferred
- Full admin seller management -- Phase 3
- Full user management -- separate phase
- Seller tiers -- Phase 3
- Site settings detail -- separate phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Customer pays with iyzico TRY 3D Secure | iyzico hosted checkout `checkoutFormInitialize`; 3D Secure automatic; subMerchantKey per item for marketplace |
| PAY-02 | Customer Stripe EUR 3D Secure | **DEFERRED** (Stripe Connect not in scope) |
| PAY-03 | Platform escrow + commission + payout | `paymentGroup: 'PRODUCT'` holds funds; `subMerchantPrice = price - commission` splits; approval API releases; T+7 ledger state transitions |
| PAY-04 | Refund auto commission reversal | `refundV2.create()` with `paymentTransactionId`; ledger negative entry per D-06 |
| PAY-05 | Webhook idempotency | Firestore `processedWebhooks` dedup + atomic transaction per D-07/D-08 |
| PAY-06 | Seller finance dashboard | Aggregated ledger queries + `escrowBalances` collection; server API only (not client Firestore) |
| ORD-03 | Seller updates order status | `POST /api/orders/{orderSetId}/subOrders/{subOrderId}/transition` with transitionEngine guard |
| ORD-04 | Customer live tracking | Server API reads; `order_status_history` subcollection for timeline |
| ORD-05 | Stock reservation | Atomic checkout-timestamp reservation: `stock.reserved += qty` with `reserved + qty <= available`; 15min timeout cleanup |
| COM-04 | Auto T+7 payout | Cron runs `POST /api/process-scheduled-payouts`; transitions ledger from 'collected' to 'released'; iyzico auto-pays to IBAN |
| COM-05 | Payout history view | Ledger entries filtered by sellerId; aggregated for dashboard |
| NOT-01 | Transactional emails | SendGrid/Resend SMTP; React Email; triggers: confirmed, shipped, delivered, refunded, new seller order |
| NOT-02 | Cart abandonment | Existing trigger refined |
| NOT-03 | Seller new-order notification | Email when OrderSet transitions to 'processing' |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Payment initiation | API / Backend | iyzico (external) | Hosted checkout init via Express route; iyzico handles PCI-DSS form |
| 3D Secure flow | iyzico (external) | -- | iyzico manages 3D; callback returns result |
| Payment verification | API / Backend | -- | Server verifies callback/webhook signature; never trust client |
| Commission calculation | API / Backend | -- | `commissionEngine` runs server-side; client never calculates money |
| Escrow hold | iyzico (external) | API / Backend | `paymentGroup: 'PRODUCT'` in iyzico; approval API triggers release |
| Order state machine | API / Backend | -- | `transitionEngine` central authority; version field for concurrency |
| Webhook idempotency | API / Backend | Firestore | `processedWebhooks` collection; atomic transaction |
| Inventory reservation | API / Backend | Firestore | Atomic `stock.reserved` update at checkout; 15min timeout |
| Payout scheduling | API / Backend | -- | Cron endpoint; T+7 ledger transition; iyzico auto-pays to IBAN |
| Seller finance dashboard | API / Backend | Browser / Client | Server API calculates; client renders (no direct Firestore reads) |
| Transactional emails | API / Backend | SendGrid/Resend | Server triggers; SMTP delivery |
| Order tracking (customer) | Browser / Client | API / Backend | Timeline UI rendered client-side; data from server API |
| Order status update (seller) | Browser / Client | API / Backend | Seller selects new status; server enforces via transitionEngine |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `iyzipay` | 2.0.67 | iyzico payment SDK | Official iyzico Node.js client; includes subMerchant, approval, refundV2, cancel, crossBooking resources |
| `iyzico.cjs` | (existing wrapper) | CJS bridge for iyzipay | Must be extended with all marketplace resources (subMerchant, approval, disapproval, refundV2, cancel, crossBookingToSubMerchant, settlementToBalance) |
| `firebase-admin` | (existing) | Firestore admin SDK | Atomic transactions, server-side writes bypassing security rules |
| `@sendgrid/mail` | ~8.x / (to install) | SMTP email delivery | Reliable transactional email for Turkish market; 100/day free tier |

**Installation:**
```bash
npm install @sendgrid/mail react-email @react-email/components
```

**Version verification:** `iyzipay` 2.0.67 [VERIFIED: npm registry] -- confirmed via `npm view iyzipay version`.
`@sendgrid/mail` -- confirmed in package manager; Resend available as alternative per discretion. 

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-email` | ~3.x / (to install) | Email template development | Build/test transactional emails with preview mode |
| `@react-email/components` | ~0.x / (to install) | React Email component library | Shared email components (Button, Section, Column, etc.) |
| `resend` | ~4.x / (to install, alternative) | SMTP via Resend API | Alternative to SendGrid if SendGrid not preferred |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SendGrid | Resend | Resend has simpler API and better developer experience; SendGrid has cheaper free tier (100/day vs 100/month for Resend). Both use SMTP. Decision per Claude's discretion. |
| SendGrid | Firebase Trigger Email | Current implementation uses Firebase Trigger Email (writes to `mail` collection). Pros: zero infrastructure. Cons: limited deliverability, no template management, no tracking. SendGrid/Resend upgrade justified for production. |
| @sendgrid/mail | nodemailer + SMTP | nodemailer is more flexible but requires managing SMTP credentials separately. @sendgrid/mail handles auth out of box. |

## Package Legitimacy Audit

> slopcheck was not available at research time -- all packages are tagged `[ASSUMED]`. The planner must gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Downloads | Source Repo | Disposition |
|---------|----------|-----|-----------|-------------|-------------|
| `iyzipay` | npm | 10+ years | ~50K/week | github.com/iyzico/iyzipay-node | Approved (official SDK) |
| `@sendgrid/mail` | npm | 10+ years | ~5M/week | github.com/sendgrid/sendgrid-nodejs | Approved (or `resend` as alternative) |
| `react-email` | npm | ~3 years | ~200K/week | github.com/resend/react-email | Approved |
| `@react-email/components` | npm | ~3 years | ~80K/week | github.com/resend/react-email | Approved |

## Architecture Patterns

### Escrow Flow: iyzico Marketplace "PRODUCT" Payment Group

The abstract architecture docs describe "platform-held escrow" but iyzico Marketplace has its own escrow mechanism. The actual flow is:

```
1. Buyer pays at iyzico hosted checkout
   -> paymentGroup: 'PRODUCT' 
   -> Each basketItem has subMerchantKey + subMerchantPrice (price - commission)
   -> iyzico captures full amount; funds held in platform iyzico account

2. Seller marks Shipped
   -> No iyzico action yet

3. Customer confirms Delivery
   -> Server calls iyzico.approval.create({ paymentTransactionId }) for each item
   -> iyzico releases seller's subMerchantPrice to platform balance
   -> Ledger entries: commission -> 'collected', seller amount -> pending payout

4. T+7 Payout
   -> iyzico automatically transfers seller's net to their IBAN (registered during subMerchant onboarding)
   -> Ledger: payout -> 'released'
   -> Platform commission remains in platform's iyzico account

5. Cancellation before delivery
   -> iyzico.disapproval.create({ paymentTransactionId }) 
   -> Then iyzico.cancel.create({ paymentId }) to trigger full refund
```

**Critical insight:** The platform does NOT manually transfer money to sellers. iyzico handles the actual bank transfer to the sub-merchant's IBAN based on approval status + payout cycle. The T+7 cron is an application-level ledger state transition and double-check, not the actual payment transfer.

### Pattern: paymentTransactionId Tracking

Each basket item in an iyzico marketplace payment gets its own `paymentTransactionId`. This is required for:
- Per-item approval/disapproval (escrow release)
- Per-item refund via `refundV2.create()`
- Tracking which seller's commission was deducted

**Storage:** Store `paymentTransactionId` on each SubOrder document in Firestore.

### Pattern: Atomic Webhook Processing

```typescript
// Pseudocode for atomic webhook processing
app.post('/api/iyzico/webhook', async (req, res) => {
  const { paymentId, paymentStatus, paymentTransactions } = req.body;
  const eventId = paymentId;

  await adminDb.runTransaction(async (txn) => {
    // 1. Check dedup
    const dedupRef = adminDb.collection('processedWebhooks').doc(eventId);
    const dedupSnap = await txn.get(dedupRef);
    if (dedupSnap.exists) {
      return; // Already processed -- skip
    }

    // 2. Write dedup marker FIRST (prevents race)
    txn.set(dedupRef, {
      eventId,
      provider: 'iyzico',
      processedAt: new Date().toISOString(),
      orderSetId: orderSetId,
    });

    // 3. Transition OrderSet status via transitionEngine
    const orderSetRef = adminDb.collection('orderSets').doc(orderSetId);
    // ... transitionOrderSetStatus logic ...

    // 4. Update SubOrder payment details with paymentTransactionIds
    for (const tx of paymentTransactions) {
      const subOrderRef = adminDb.collection('subOrders').doc(tx.subOrderId);
      txn.update(subOrderRef, {
        paymentTransactionId: tx.paymentTransactionId,
        status: 'processing',
        version: FieldValue.increment(1),
      });
    }

    // 5. Record commission in ledger
    // ...
  });

  res.status(200).json({ status: 'success' });
});
```

### Pattern: IPaymentProvider Interface (Strategy)

```typescript
interface IPaymentProvider {
  initCheckout(params: {
    orderSetId: string;
    totalAmount: number; // in kurus
    currency: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      subMerchantKey: string;
      subMerchantPrice: number; // price - commission
    }>;
    buyer: { id: string; email: string; name: string; phone: string };
    shippingAddress: any;
    callbackUrl: string;
  }): Promise<{ token: string; paymentPageUrl: string }>;

  verifyPayment(paymentId: string): Promise<{ status: string; transactions: Array<{ id: string; subMerchantKey: string; paidAmount: number }> }>;

  processRefund(params: { paymentId: string; paymentTransactionId?: string; amount?: number }): Promise<{ refundId: string }>;
}
```

First implementation: `IyzicoProvider`. Second (future): `StripeProvider`. Provider selection by `region === 'TR'`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment form PCI-DSS | Custom card form | iyzico hosted checkout | iyzico is PCI-DSS Level 1 certified; custom forms require SAQ D annual audit |
| Email template rendering | String concatenation HTML | React Email | Type-safe templates, preview mode, consistent rendering |
| 3D Secure handling | Custom 3D logic | iyzico built-in 3D | iyzico manages 3D redirects automatically; callback returns result |
| Bank transfers to sellers | Manual bank API | iyzico subMerchant IBAN | iyzico handles actual bank transfers to sub-merchant IBANs; platform only manages approval |
| Order state machine | Scattered if/else | transitionEngine (Phase 1) | Already built -- centralized TRANSITION_MATRIX with version-based concurrency |
| Commission calculation | Custom per-order | commissionEngine (Phase 1) | Already built -- specificity priority, min/max limits, integer kurus |
| Financial audit trail | Simple balance field | ledgerService (Phase 1) | Already built -- SHA-256 hash chain, append-only, verifyChain |

## Recommended Project Structure (Changes)

```
server/
├── routes/
│   ├── iyzico.ts              # EXTEND: marketplace init, callback, subMerchant mgmt
│   ├── orders.ts               # EXTEND: subOrder status transition endpoint
│   ├── stripe.ts               # KEEP: existing
│   └── finance/
│       ├── payouts.ts          # NEW: T+7 payout cron endpoint
│       └── ledger.ts           # NEW: seller balance/ledger query API
├── services/
│   ├── iyzicoMarketplace.ts    # NEW: iyzico marketplace provider impl
│   ├── paymentProvider.ts      # NEW: IPaymentProvider interface + factory
│   ├── emailService.ts         # NEW: SendGrid/Resend SMTP email service
│   ├── transitionEngine.ts     # KEEP: Phase 1
│   ├── commissionEngine.ts     # KEEP: Phase 1 (use at checkout time)
│   └── ledgerService.ts        # KEEP: Phase 1 (append ledger entries)
├── iyzico.cjs                  # EXTEND: add subMerchant, approval, refundV2, cancel, crossBooking
├── lib/
│   └── schemas.ts              # EXTEND: marketplace validation schemas

src/
├── services/
│   └── emailService.ts         # REPLACE: Firebase Trigger Email -> SendGrid/Resend
├── components/
│   ├── seller/
│   │   └── FinanceDashboard.tsx  # NEW: balance, pending, payouts table, CSV
│   └── orders/
│       ├── OrderTimeline.tsx     # NEW: status timeline visualization
│       └── SellerOrderActions.tsx # NEW: status dropdown + tracking input
└── lib/
    └── paymentProvider.ts       # KEEP: existing provider config UI
```

**NOT restructured:** The `client-angular.js` reference in architecture docs is not applicable. The project uses React SPA with Express server. The structure stays flat in routes/ but adds a `server/services/iyzicoMarketplace.ts` as the IPaymentProvider implementation, keeping the pattern from Phase 1.

## Common Pitfalls

### Pitfall 1: Using Standard Checkout Form Instead of Marketplace
**What goes wrong:** The current `POST /api/iyzico/init` uses a simple `checkoutFormInitialize` without subMerchantKey items. With sub-merchant onboarding, each basket item MUST include `subMerchantKey` and `subMerchantPrice` or the payment won't route correctly for marketplace commission splitting.
**Why it happens:** The current code predates marketplace mode. It passes `total` price without seller splits.
**How to avoid:** Mandate `subMerchantKey` and `subMerchantPrice` on every item in the checkout init request. Validate that sum of subMerchantPrices equals total minus platform commission.
**Warning signs:** Iyzico callback returns success but paymentTransactionIds are not linked to sub-merchants.

### Pitfall 2: Refund Without PaymentTransactionId
**What goes wrong:** For marketplace payments, `iyzico.cancel.create()` cancels the entire payment. For per-item refunds (partial, single seller), you need `iyzico.refundV2.create({ paymentTransactionId })` per item.
**Why it happens:** Confusion between `cancel` (full, uses `paymentId`) and `refundV2` (per-transaction, uses `paymentTransactionId`).
**How to avoid:** Always store `paymentTransactionId` per SubOrder at payment time. Use `refundV2` for item-level refunds, `cancel` only for full pre-shipment cancellations.
**Warning signs:** Refund endpoint returns 400 with "paymentTransactionId required for marketplace payments."

### Pitfall 3: Missing Escrow Approval Step
**What goes wrong:** The seller sends the item, but platform never calls `iyzico.approval.create()`. Funds stay in escrow. Seller never gets paid.
**Why it happens:** `paymentGroup: 'PRODUCT'` holds funds until explicit approval. Without calling approval, funds remain in pending state indefinitely.
**How to avoid:** Trigger `iyzico.approval.create({ paymentTransactionId })` for each sub-order when its status transitions to `delivered`. This release must happen BEFORE the T+7 payout or the payout cycle won't include the funds.
**Warning signs:** Seller reports not receiving payouts; iyzico reports all amounts as "pending" in settlement reports.

### Pitfall 4: Webhook Race on Multiple SubOrders
**What goes wrong:** One iyzico payment callback can contain 5+ paymentTransactionIds (one per sub-order). Processing them all in parallel without transaction isolation can result in partial updates.
**Why it happens:** The callback includes one `paymentId` but multiple `paymentTransactions[]. The handler must atomically update ALL sub-orders.
**How to avoid:** Process the entire callback body inside a single Firestore transaction. Write all sub-order updates together. If anything fails, return 500 and let iyzico retry.
**Warning signs:** Some sub-orders show as paid while others remain pending.

### Pitfall 5: Client-Side Ledger/Finance Reads
**What goes wrong:** Seller finance dashboard reads ledger data directly from client Firestore SDK. Security rules misconfiguration exposes all seller financial data.
**Why it happens:** Architectural research explicitly warns against this (Anti-Pattern 4). Seller balance data is financial.
**How to avoid:** All finance/ledger/payout data is fetched via server API (`GET /api/finance/seller/{sellerId}/balance`). Client Firestore has NO access to ledger, escrowBalances, or processedWebhooks collections.

## Code Examples

### Verifying iyzipay SDK Resource Usage

```typescript
// Source: O:\AI\E-tic 2026 (runtime inspection)
// All marketplace-relevant resources exist on iyzipay SDK instance:
// subMerchant: { create, update, retrieve }
// approval: { create }
// disapproval: { create }
// checkoutFormInitialize: { create }     // hosted checkout init
// checkoutForm: { retrieve }             // payment status lookup
// refundV2: { create }                   // per-transaction refund
// cancel: { create }                     // full payment cancel
// crossBookingToSubMerchant: { create }  // direct fund transfer
// crossBookingFromSubMerchant: { create } // receive from sub-merchant
// settlementToBalance: { create }        // transfer to platform balance
// reportingPayoutCompleted: { retrieve } // payout reporting
```

### iyzico Marketplace Hosted Checkout Init (Marketplace Mode)

```typescript
// Source: Derived from iyzico docs + SDK inspection
// This replaces the current simple checkout init with marketplace splits.

const request = {
  locale: 'tr',
  conversationId: orderSetId,
  price: String(totalAmount),       // total basket price
  paidPrice: String(totalAmount),   // amount charged to buyer
  currency: 'TRY',
  installment: String(installment || 1),
  basketId: orderSetId,
  paymentGroup: 'PRODUCT',          // Enables escrow
  callbackUrl: `${APP_URL}/api/iyzico/callback`,
  buyer: { /* ... */ },
  shippingAddress: { /* ... */ },
  billingAddress: { /* ... */ },
  basketItems: subOrders.map(sub => ({
    id: sub.id,
    name: sub.items[0]?.name || `Order ${sub.id.slice(0, 8)}`,
    category1: sub.items[0]?.category || 'General',
    itemType: 'PHYSICAL',
    price: String(sub.subtotal + sub.shippingCost),
    subMerchantKey: sub.sellerSubMerchantKey,
    subMerchantPrice: String(sub.payoutAmount), // subtotal + shipping - commission
  })),
};

const result = await instance.checkoutFormInitialize.create(request);
// result: { token, checkoutFormContent, paymentPageUrl }
```

### Commission + subMerchantPrice Calculation

```typescript
// Source: Phase 1 commissionEngine integration
// At checkout init time, calculate commission per seller/item

for (const subOrder of order.subOrders) {
  const commissionResult = calculateCommission({
    priceInKurus: subOrder.subtotal,  // already in kurus
    sellerId: subOrder.sellerId,
    categoryId: subOrder.categoryId,
    rules: activeCommissionRules,
  });

  // subMerchantPrice = what seller gets after platform commission
  const subMerchantPrice = subOrder.subtotal + subOrder.shippingCost - commissionResult.amount;

  // Record pending commission in ledger
  await recordEntry(adminDb, {
    orderSetId: orderSetId,
    subOrderId: subOrder.id,
    sellerId: subOrder.sellerId,
    type: 'commission',
    amount: -commissionResult.amount, // negative
    currency: 'TRY',
    reference: '',
    reason: `Commission ${(commissionResult.rate * 100).toFixed(1)}%`,
    createdBy: 'system',
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase Trigger Email (mail collection) | SendGrid/Resend SMTP | Phase 2 | Better deliverability, tracking, template management |
| Simple iyzico checkout form | Marketplace checkout with subMerchant splits | Phase 2 | Enables multi-seller payment, commission deduction at source |
| iyzico.cjs with 3 methods | iyzico.cjs with 10+ marketplace methods | Phase 2 | Full marketplace API access (subMerchant, approval, refundV2, etc.) |
| Order status as simple string | transitionEngine state machine | Phase 1 (existing) | Already implemented -- Phase 2 integrates webhook callbacks with it |

**Deprecated:**
- `iyzico.cjs` 3-function wrapper: Will be replaced with direct `iyzipay` SDK instance access for marketplace resources. The old functions remain for backward compat but new code uses `getIyzico().instance.subMerchant.create(...)`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | iyzico automatically transfers to sub-merchant IBAN after approval (no manual payout API needed) | Architecture Patterns | If approval does NOT trigger auto-transfer, need crossBookingToSubMerchant or custom payout loop |
| A2 | `@sendgrid/mail` is the best choice for Turkish market transactional email | Standard Stack | Resend may have better Turkish deliverability; check at implementation |
| A3 | `paymentTransactionId` is available per-item in iyzico callback for marketplace payments | Code Examples | If not, need to derive from payment retrieval response |
| A4 | `paymentGroup: 'PRODUCT'` is the correct escrow mechanism for marketplace | Architecture Patterns | If iyzico requires a different approach for multi-seller escrow, revisit |

## Open Questions (RESOLVED)

1. **Does iyzico approval automatically trigger IBAN transfer or is there a separate payout cycle?**
   - What we know: iyzico docs say "funds are disbursed to sub-member businesses" after transaction completion. SDK has `crossBookingToSubMerchant` (manual transfer) and `settlementToBalance` (pull to platform).
   - What's unclear: Whether approval + next payout cycle = automatic transfer, or if we need `settlementToBalance` + `crossBookingToSubMerchant` for each payout. This affects the T+7 cron implementation.
   - Recommendation: Test in sandbox. Create a sub-merchant with a test IBAN, process a payment with `paymentGroup: 'PRODUCT'`, approve it, then check if settlement report shows the transfer. If not, use `settlementToBalance` + `crossBookingToSubMerchant` as fallback.

2. **Does iyzico refundV2 support platform commission reversal automatically for marketplace payments?**
   - What we know: D-06 says full refund + commission reversal. SDK has `refund.create` (basic) and `refundV2.create` (per-transaction).
   - What's unclear: Whether `refundV2.create({ paymentTransactionId })` with marketplace items reverses the subMerchant's payout too.
   - Recommendation: Test refund flow in sandbox. If refund V2 does not reverse the subMerchantPrice, implement commission reversal via ledger (negative entry).

3. **What is the `paymentTransactionId` field name in the checkout form retrieve response?**
   - What we know: iyzico returns a complex response with items array in `retrieveCheckoutForm`.
   - What's unclear: The exact field path for per-item paymentTransactionIds.
   - Recommendation: Run a sandbox payment and log the full callback response to document the field paths.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server runtime | Yes | (check at runtime) | -- |
| npm | Package installation | Yes | (check at runtime) | -- |
| `iyzipay` | iyzico SDK | Installed (2.0.67) | 2.0.67 | -- |
| SendGrid API key | Transactional emails | Env var required | -- | Resend API key as alternative |
| Firebase Admin SDK | Firestore transactions | Installed | -- | -- |
| iyzico API credentials | Payment processing | Env vars (sandbox) | -- | -- |

**Missing dependencies with no fallback:**
- SendGrid API key (`SENDGRID_API_KEY`) or Resend API key (`RESEND_API_KEY`) -- must be set for email delivery

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Firebase token verification on all payment/finance routes |
| V3 Session Management | No | Payment is sessionless (stateless API calls) |
| V4 Access Control | Yes | `verifyAdmin` on refund/payout routes; ownership check on order reads |
| V5 Input Validation | Yes | Zod schemas via `validate()` middleware on all input |
| V6 Cryptography | No | iyzico handles PCI-DSS; ledger uses SHA-256 for chain integrity |
| V7 Error Handling | Yes | Structured error responses; no stack traces in production |
| V8 Data Protection | Yes | Financial data never written to client-accessible Firestore |
| V9 Communication | Yes | All iyzico API calls over HTTPS |

### Known Threat Patterns for Payment/Order Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook replay (same event processed twice) | Spoofing | Firestore `processedWebhooks` dedup in atomic transaction |
| Race condition on stock reservation | Tampering | Atomic Firestore transaction with `stock.reserved` check |
| Client manipulating order amounts | Tampering | All server-authoritative pricing; client only sends productId + quantity |
| Unauthorized finance data access | Information Disclosure | Server API only for ledger/finance; client Firestore has zero access |
| Refund amount manipulation | Elevation of Privilege | Admin-only refund endpoint (`verifyAdmin`); server calculates max refund |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] `iyzipay` v2.0.67 -- confirmed via `npm view iyzipay version`
- [VERIFIED: SDK inspection] All iyzipay SDK marketplace resources confirmed present: subMerchant, approval, disapproval, checkoutFormInitialize, checkoutForm, refundV2, cancel, crossBookingToSubMerchant, settlementToBalance, reportingPayoutCompleted
- [VERIFIED: iyzico docs] https://docs.iyzico.com/en/products/marketplace -- marketplace payment flow, sub-merchant onboarding
- [VERIFIED: iyzico docs] https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant -- subMerchant create API with PERSONAL/PRIVATE_COMPANY/LIMITED_OR_JOINT_STOCK_COMPANY types, IBAN requirements, subMerchantKey response
- `transitionEngine.ts` -- Phase 1 state machine (OrderSetStatus, TransitionEvent, TRANSITION_MATRIX)
- `commissionEngine.ts` -- Phase 1 commission engine (resolveRate, calculateCommission)
- `ledgerService.ts` -- Phase 1 immutable ledger (recordEntry, verifyChain)
- `server/services/orderService.ts` -- Phase 1 OrderSet/SubOrder creation + transition

### Secondary (MEDIUM confidence)
- [CITED: dev.to/pitfalls] Order state machine enforcement -- centralized transition table + optimistic locking pattern confirmed
- [CITED: leapfin.com/pitfalls] Stripe Connect accounting pitfalls -- informs analogous iyzico approach

### Tertiary (LOW confidence)
- [ASSUMED] iyzico auto-transfer to sub-merchant IBAN after approval -- needs sandbox verification
- [ASSUMED] `paymentTransactionId` per-item in checkout form retrieve response -- needs sandbox response log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- iyzipay SDK confirmed, Phase 1 services are live code
- Architecture: HIGH -- transitionEngine, commissionEngine, ledgerService are existing, verified code
- Pitfalls: MEDIUM -- marketplace-specific pitfalls derived from iyzico docs + general marketplace patterns; escrow approval timing needs sandbox confirmation

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (iyzico SDK stable; SendGrid/react-email may have minor updates)
