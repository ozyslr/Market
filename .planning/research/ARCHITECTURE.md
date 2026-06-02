# Architecture Research

**Domain:** Multi-vendor e-commerce marketplace
**Researched:** 2026-06-02
**Confidence:** HIGH

## Standard Marketplace Architecture

### System Overview

Multi-vendor marketplaces follow a consistent pattern organized around three domains (Buyer, Seller, Admin) with a cross-cutting payment/escrow layer. The architecture is a **domain-segmented modular monolith** — a single deployment with strict module boundaries, not microservices (appropriate for a solo-dev team).

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React SPA)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Buyer UI  │  │Seller UI │  │ Admin UI │  │  Shared / Lib    │    │
│  │(65 pages) │  │(14 pages)│  │(20 pages)│  │ Contexts,Hooks,  │    │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘  │  Services, i18n   │    │
│        │             │             │         └──────────────────┘    │
├────────┴─────────────┴─────────────┴────────────────────────────────┤
│                      API GATEWAY (Express.js)                        │
├────────┬─────────────┬─────────────┬────────────────────────────────┤
│        │             │             │                                 │
│  ┌─────┴─────┐ ┌────┴──────┐ ┌───┴──────┐  ┌──────────────────┐   │
│  │  Buyer    │ │  Seller   │ │  Admin   │  │  Payment         │   │
│  │  Routes   │ │  Routes   │ │  Routes  │  │  Stripe/Iyzico   │   │
│  └─────┬─────┘ └────┬──────┘ └───┬──────┘  └────────┬─────────┘   │
│        │             │             │                  │              │
├────────┴─────────────┴─────────────┴──────────────────┴────────────┤
│                         SERVICE LAYER                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Order   │ │  Product │ │  Seller  │ │  Finance │ │  Search  │  │
│  │  Service │ │  Service │ │  Service │ │  Service │ │  Service │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │             │             │            │             │       │
├───────┴─────────────┴─────────────┴────────────┴────────────┴───────┤
│                        DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │   Firestore  │  │  Algolia/    │  │  Firebase Auth +       │    │
│  │  (Firebase)  │  │  MeiliSearch │  │  Firebase Storage      │    │
│  └──────────────┘  └──────────────┘  └────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  External: Stripe Connect, Iyzico, Shipping Carriers         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component           | Responsibility                                           | Current State                                        | Target State                                                |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| **Buyer UI**        | Product discovery, cart, checkout, order tracking        | 65+ pages existing                                   | Add order splitting UX, multi-seller cart                   |
| **Seller UI**       | Store management, inventory, orders, finance, analytics  | 14 pages existing                                    | Add KYC onboarding, payout dashboard, shipping forms        |
| **Admin UI**        | Governance, commission config, seller approval, reports  | 20 pages existing                                    | Add commission rule engine UI, payout batch management      |
| **Order Service**   | Order state machine, splitting, fulfillment tracking     | Partial in `orderService.ts`                         | Full state machine with guards and transitions              |
| **Finance Service** | Commission calculation, escrow ledger, payout scheduling | `financeService.ts` + `sellerPayoutService.ts` exist | Immutable ledger, escrow balance tracking, auto-payout      |
| **Payment Routes**  | Stripe + Iyzico handling, webhooks, refunds              | Server routes exist                                  | Add Stripe Connect for on-behalf-of payouts                 |
| **Search Service**  | Full-text search, faceted filters, typo tolerance        | `searchService.ts` uses Firestore queries            | Migrate to dedicated search engine (Algolia or MeiliSearch) |

## Recommended Project Structure (Evolution)

The current structure works but needs clearer domain boundaries as marketplace features grow. Suggested additions:

```
O:\AI\E-tic 2026\
├── server/                         # Express server
│   ├── routes/                     #   API route modules
│   │   ├── stripe.ts               #     Current
│   │   ├── iyzico.ts               #     Current
│   │   ├── sellerApi.ts            #     Current
│   │   ├── gemini.ts               #     Current
│   │   ├── webhooks/               #     NEW: organized webhooks
│   │   │   ├── stripe.ts           #       Stripe webhooks
│   │   │   ├── iyzico.ts           #       Iyzico webhooks
│   │   │   └── cargo.ts            #       Shipping carrier webhooks
│   │   ├── orders/                 #     NEW: order lifecycle API
│   │   │   ├── create.ts           #       Order creation + splitting
│   │   │   ├── status.ts           #       Status transitions
│   │   │   └── refund.ts           #       Refund processing
│   │   └── finance/                #     NEW: commission + payout API
│   │       ├── commission.ts       #       Commission rules CRUD
│   │       ├── payout.ts           #       Payout processing
│   │       └── ledger.ts           #       Ledger querying
│   ├── lib/                        #   Server utilities
│   │   ├── validate.ts             #     Current
│   │   └── schemas.ts              #     Current
│   └── services/                   #   NEW: server-only business logic
│       ├── commissionEngine.ts     #     Commission calculation
│       ├── payoutProcessor.ts      #     Payout batching
│       └── ledgerService.ts        #     Immutable ledger operations
│
├── src/
│   ├── services/                   # Client-side service modules
│   │   ├── orderService.ts         #     Current - will call /api/orders
│   │   ├── financeService.ts       #     Current - will call /api/finance
│   │   ├── searchService.ts        #     Current - may wrap Algolia client
│   │   └── ...                     #     55 existing services (stay)
│   │
│   ├── context/                    # React Context providers
│   │   ├── AuthContext.tsx          #     Current
│   │   ├── CartContext.tsx          #     Current - needs multi-vendor split
│   │   └── ... (6 more)
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useComparison.ts        #     Current
│   │   ├── useExchangeRate.ts      #     Current
│   │   ├── useOneClickCheckout.ts  #     Current
│   │   ├── useOrderStateMachine.ts #     NEW: optimistic order updates
│   │   └── useSellerKYC.ts         #     NEW: KYC flow state
│   │
│   ├── components/
│   │   ├── commerce/
│   │   │   └── MultiVendorCart.tsx #     NEW: cart grouped by seller
│   │   ├── checkout/
│   │   │   └── OrderSummary.tsx    #     NEW: multi-seller order breakdown
│   │   ├── seller/
│   │   │   ├── KYCOnboardingFlow.tsx #  NEW: document upload, verification
│   │   │   ├── PayoutHistory.tsx  #     NEW: payout timeline
│   │   │   └── CommissionBreakdown.tsx # NEW: per-order commission view
│   │   └── admin/
│   │       ├── CommissionRuleEditor.tsx # NEW: rule creation UI
│   │       └── PayoutBatchManager.tsx  # NEW: batch approval UI
│   │
│   ├── lib/
│   │   ├── firebase.ts            #     Current - keep for client Firestore
│   │   ├── search.ts              #     NEW: search engine wrapper
│   │   └── paymentProvider.ts     #     NEW: Stripe/Iyzico abstraction
│   │
│   └── types.ts                    # Current - augment with domain types
```

### Structure Rationale

- **server/services/** added for server-only business logic that must not run client-side (commission calculation, payout processing, ledger mutations, financial reconciliation). Client services stay in `src/services/` but gradually call `/api/*` instead of direct Firestore for sensitive operations.
- **server/routes/webhooks/**, **orders/**, **finance/** organize routes by domain instead of the current flat structure, making the transition plan clearer.
- **No radical restructure** — the current flat service layer works for a solo dev. The key change is moving sensitive operations (finance, payouts, commission) exclusively server-side and keeping client services as thin wrappers that call the API.

## Architectural Patterns

### Pattern 1: Order Splitting (Order Set / Sub-Order Pattern)

**What:** When a buyer purchases from multiple sellers in one checkout, create a parent order (Order Set) with individual sub-orders per seller. Each seller fulfills independently but the buyer sees one order.

**When to use:** Every marketplace checkout. Required as soon as multi-vendor cart is supported.

**Trade-offs:** Adds complexity to checkout flow; requires coordination between payment (one charge) and fulfillment (many shipments). But without it, you force one-seller-per-cart which is a terrible UX.

**Example data model:**

```
OrderSet (parent)
├── orderSetId: string
├── buyerId: string
├── status: computed from child orders
├── total: sum of child totals
├── createdAt: timestamp
│
├── Order (per seller)
│   ├── orderId: string
│   ├── sellerId: string
│   ├── status: Pending | Processing | Shipped | Delivered | Cancelled | Returned
│   ├── items: OrderItem[]
│   ├── subtotal: number
│   ├── shippingCost: number
│   ├── commission: number (calculated)
│   ├── payoutAmount: number (subtotal + shipping - commission)
│   └── fulfillment:
│       ├── carrier: string
│       ├── trackingCode: string
│       └── shippedAt: timestamp
│
└── Payment
    ├── paymentId: string
    ├── provider: "stripe" | "iyzico"
    ├── totalCharged: number
    ├── status: Pending | Captured | Refunded
    └── splits: [sellerId => amount]
```

Status aggregation for OrderSet:

- All Orders completed => Completed
- Any Order cancelled => PartiallyCancelled (or Cancelled if all)
- Any Order requires_action => RequiresAction
- Otherwise => Pending

### Pattern 2: Order Lifecycle State Machine

**What:** A finite state machine (FSM) models the order lifecycle as discrete states with explicit transition rules, guards, and side-effect actions. Prevents invalid transitions (e.g., shipping before payment) and centralizes all order status logic.

**When to use:** For ALL order management. The current approach of scattered status checks will cause bugs as the system grows.

**Trade-offs:** More upfront design than status flags, but eliminates entire categories of bugs. The commercetools and Spryker references show this is industry standard for production marketplaces.

**State diagram:**

```
                   ┌─────────────────────────────────────────┐
                   │             Payment Pending              │
                   │  (awaiting payment confirmation)         │
                   └──────────┬──────────────────────────────┘
                              │ payment_received
                              ▼
                   ┌─────────────────────────────────────────┐
                   │             Processing                   │
                   │  (payment confirmed, seller prepares)    │
                   └──────────┬──────────────────────────────┘
                              │ mark_shipped
                              ▼
                   ┌─────────────────────────────────────────┐
                   │             Shipped                      │
                   │  (carrier, tracking code, ETA)           │
                   └──────────┬──────────────────────────────┘
                              │ confirm_delivery
                              ▼
                   ┌─────────────────────────────────────────┐
                   │             Delivered                    │
                   │  (customer received)                     │
                   └──────────┬──────────────────────────────┘
                              │ auto_complete (7 days after)
                              ▼
                   ┌─────────────────────────────────────────┐
                   │             Completed  ◄── TERMINAL      │
                   └─────────────────────────────────────────┘

Cancellation paths (any state before Shipped):
  Payment Pending ─► Cancelled (buyer or system)
  Processing ─► Cancelled (seller or admin, with reason)

Return paths (from Delivered or Completed):
  Delivered ─► ReturnRequested ─► ReturnApproved ─► Refunded
  Delivered ─► ReturnRequested ─► ReturnRejected ─► Completed (reverts)

Hold paths:
  Processing ─► OnHold (admin intervention, e.g., fraud review)
  OnHold ─► Processing (resolved)
  OnHold ─► Cancelled (unresolved)
```

**Key implementation rules:**

- Define transition matrix explicitly — invalid transitions throw errors
- Use guards (e.g., `canShip: order.paymentStatus === 'captured'`)
- Fire side-effects on state entry (email notification, payout release, inventory update)
- Use optimistic concurrency (increment `version` field on each transition) to prevent race conditions
- Log every transition to an immutable audit log

**Implementation approach (no external library needed):**

```typescript
type OrderStatus =
  | 'payment_pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected'
  | 'refunded'
  | 'on_hold';

type TransitionEvent =
  | 'payment_received'
  | 'mark_shipped'
  | 'confirm_delivery'
  | 'auto_complete'
  | 'cancel'
  | 'request_return'
  | 'approve_return'
  | 'reject_return'
  | 'refund'
  | 'place_on_hold'
  | 'release_hold';

const TRANSITION_MATRIX: Record<OrderStatus, Partial<Record<TransitionEvent, OrderStatus>>> = {
  payment_pending: { payment_received: 'processing', cancel: 'cancelled' },
  processing: { mark_shipped: 'shipped', cancel: 'cancelled', place_on_hold: 'on_hold' },
  shipped: { confirm_delivery: 'delivered' },
  delivered: { auto_complete: 'completed', request_return: 'return_requested' },
  completed: { request_return: 'return_requested' },
  return_requested: { approve_return: 'return_approved', reject_return: 'delivered' },
  return_approved: { refund: 'refunded' },
  refunded: {}, // terminal
  cancelled: {}, // terminal
  on_hold: { release_hold: 'processing', cancel: 'cancelled' },
};

function transitionOrder(order: Order, event: TransitionEvent): Order {
  const nextStatus = TRANSITION_MATRIX[order.status]?.[event];
  if (!nextStatus) throw new Error(`Invalid transition: ${order.status} → ${event}`);
  return { ...order, status: nextStatus, version: order.version + 1 };
}
```

### Pattern 3: Commission Engine with Immutable Ledger

**What:** A commission calculation engine that applies category-based, seller-based, or hybrid commission rules at payout time. Results feed an append-only ledger that tracks every financial movement (order charge, commission deduction, payout, refund, reversal).

**When to use:** Core to marketplace business model. Must be in place before any seller payouts go live.

**Trade-offs:** More complex than a flat percentage but enables the category-based variable model (%5-20) the business requires. The immutable ledger adds storage but is non-negotiable for audit compliance.

**Commission rule model:**

```
CommissionRule
├── ruleId: string
├── type: "category" | "seller" | "product" | "tiered"
├── scope: { categoryId?: string, sellerId?: string, productId?: string }
├── rate: number (e.g., 0.12 = 12%)
├── type: "percentage" | "fixed" | "hybrid" (fixed + percentage)
├── minFee: number (minimum commission, e.g., 1.00 TL)
├── maxFee: number (maximum commission, null = unlimited)
├── priority: number (lower = higher priority, seller-specific beats category)
├── active: boolean
└── effectiveDate: timestamp
```

**Resolution order:** Tiered rules > Seller-specific > Product-specific > Category-specific > Default platform rate

**Ledger entry model (immutable):**

```
LedgerEntry
├── entryId: string
├── orderId: string
├── sellerId: string
├── type: "order_charge" | "commission" | "payout" | "refund" | "adjustment" | "fee"
├── amount: number (positive or negative)
├── currency: "TRY" | "EUR" | "USD"
├── balanceAfter: { available: number, escrow: number, pending_out: number }
├── reference: string (e.g., Stripe transfer ID)
├── reason: string
├── createdBy: "system" | "admin" | "seller"
└── createdAt: timestamp
```

**Payout flow:**

```
1. Order marked Delivered
2. CommissionEngine.calculate(order) → commission amount
3. LedgerService.record({ type: 'order_charge', amount: +1250.00 })
4. LedgerService.record({ type: 'commission', amount: -150.00 })  (12%)
5. Seller balance: available += 1100.00

6. PayoutScheduler runs daily:
   a. Query sellers where available >= minPayoutThreshold (e.g., 50 TRY)
   b. For each seller: create PayoutBatch
   c. LedgerService.record({ type: 'payout', amount: -1100.00 })
   d. Initiate bank transfer via Stripe Connect / Iyzico
   e. On success: mark batch completed
   f. On failure: mark batch failed, flag for admin review
```

### Pattern 4: Gradual API-First Migration from Direct Firestore Access

**What:** Transition from the current mixed pattern (client-side Firestore reads + some server API calls) to a clear API-first architecture where all sensitive operations go through Express endpoints, and client Firestore access is limited to read-only, latency-tolerant queries.

**When to use:** Now. Every new marketplace feature (commission, payout, order splitting) must go through the server because it involves secrets, money, or audit requirements.

**Trade-offs:** Adds request latency compared to direct Firestore reads. Removes real-time listener capability for that data. But eliminates the security risk of client-side Firestore rules as the sole defense for financial data.

**Migration tiers:**

| Tier      | Data                                  | Current                          | Target                                               | Rationale                                             |
| --------- | ------------------------------------- | -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| 1 (NOW)   | Orders, Payments, Commission, Payouts | Mixed (some client, some server) | **Server-only API**                                  | Financial data, audit trail                           |
| 2 (SOON)  | Seller profiles, Seller products      | Client Firestore                 | **Server API for writes, client reads optional**     | Seller isolation requires server validation           |
| 3 (LATER) | Products, Categories, Reviews         | Client Firestore                 | **Client Firestore reads remain, writes via server** | Read-heavy, latency-sensitive, writes need validation |
| 4 (NEVER) | User auth, Carts, Wishlists           | Client Firestore + Context       | **Keep client-side**                                 | Real-time needs, low sensitivity, latency-critical    |

### Pattern 5: Search Engine Abstraction

**What:** Replace Firestore-based search (`searchService.ts`) with a dedicated search engine (Algolia or MeiliSearch) wrapped behind an abstraction layer.

**When to use:** When Firestore queries become noticeably slow on product search or when the null-result rate exceeds 10%. For this marketplace with category-based filtering, typo tolerance, and multi-attribute faceting, this should be Phase 1-2 of the roadmap.

**Trade-offs:** Adds an external service + cost. But Firestore's query limitations (no full-text search, no typo tolerance, no relevance ranking) will directly constrain conversion rates.

**Abstracted interface:**

```typescript
interface SearchProvider {
  search(params: SearchParams): Promise<SearchResults>
  indexProduct(product: Product): Promise<void>
  bulkIndexProducts(products: Product[]): Promise<void>
  removeProduct(productId: string): Promise<void>
  removeSellerProducts(sellerId: string): Promise<void>
}

// Implementations swap behind this interface
class AlgoliaSearchProvider implements SearchProvider { ... }
class MeiliSearchProvider implements SearchProvider { ... }
class FirestoreSearchProvider implements SearchProvider { /* current fallback */ }
```

### Pattern 6: Escrow-Style Payment Flow

**What:** Funds flow from buyer through platform escrow, then to seller after delivery confirmation and commission deduction.

**When to use:** Mandatory for marketplace model where platform takes commission. The alternative (seller collects directly) breaks the commission model.

**Trade-offs:** Stripe Connect handles most of this automatically, but Iyzico requires a different approach for the Turkish market. The dual-provider constraint means the escrow logic must be provider-agnostic at the application layer.

**Flow:**

```
1. Buyer pays → Stripe/Iyzico captures full amount
2. Platform holds in Stripe Connect account / Iyzico merchant account
3. Order delivered → commission calculated
4. Platform initiates transfer to seller:
   - Stripe: Connect transfers API (on_behalf_of)
   - Iyzico: Sub-merchant payout API
5. Transfer recorded in immutable ledger
6. Seller sees payout in dashboard (with 3-5 business day settlement delay)
```

## Data Flow

### Key Data Flows

**1. Checkout Flow (Multi-Vendor)**

```
Cart (React Context) → CartContext reads line items
  → Checkout Page groups items by sellerId
  → POST /api/orders/create (Express)
    → OrderService.createOrderSet()
      → Creates OrderSet + N sub-Orders
      → CommissionEngine estimates commission
      → PaymentService.initiateCharge(total, splits)
        → Stripe: PaymentIntent with transfer_data
        → Iyzico: Sub-merchant split
      → Returns OrderSet with payment intent
  → Checkout Page redirects to payment confirmation
  → Stripe/Iyzico webhook → confirms payment
    → Webhook handler: transition orders to Processing
    → NotificationService: notify sellers
```

**2. Search Flow**

```
SearchBar input → debounce 300ms
  → SearchProvider.search({
      query: "el yapimi seramik",
      filters: { category: "home-living", priceRange: [100, 500] },
      sort: "rating_desc",
      page: 1
    })
  → Returns SearchResults { hits, facets, totalHits, page }
  → SearchResultsPage renders ProductCard[] + FilterPanel

Indexing (background):
  Product written/updated → event → SearchProvider.indexProduct(product)
  Seller suspended → event → SearchProvider.removeSellerProducts(sellerId)
```

**3. Payout Flow**

```
Cron job (daily, 03:00 UTC):
  → PayoutProcessor.processScheduled()
    → LedgerService.querySellersAvailableForPayout()
      → Rule: available >= 50 TRY/EUR, lastPayout > 7 days
    → For each seller:
      → PayoutBatch.create(batchId, sellerId, amount)
      → PayoutProvider.transfer(seller.stripeConnectAccountId, amount)
        → On success: mark batch completed
        → On failure: mark batch failed, admin notification
      → LedgerService.record({
          type: 'payout',
          amount: -amount,
          balanceAfter: recalculated
        })
    → NotificationService: email seller payout confirmation
```

**4. Seller KYC Flow**

```
SellerApplication page → upload documents (identity, tax, bank)
  → POST /api/sellers/kyc/submit
    → server: store docs in Firebase Storage (private bucket)
    → server: create KycSubmission document in Firestore
    → Admin panel: KYC review queue
      → Admin views documents, checks, approves/rejects
      → On approve: seller.status = 'active', stripe connect account created
      → On reject: seller notified with reason, can resubmit
```

## Scaling Considerations

| Scale                | Architecture Adjustments                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 0-1k users (current) | Monolithic Express, direct Firestore reads, React Context state                                                           |
| 1k-10k users         | Move financial operations server-only, add search engine, add order state machine                                         |
| 10k-100k users       | Extract finance service to dedicated process, add caching layer (Redis), consider Cloud Tasks for async processing        |
| 100k+ users          | Evaluate service extraction (orders, finance as separate services), add event bus, consider PostgreSQL for financial data |

### Scaling Priorities

1. **First bottleneck:** Firestore read limits on product search. Mitigation: move search to Algolia/MeiliSearch at 5k+ products. Current `searchService.ts` performs client-side Firestore queries which don't scale.
2. **Second bottleneck:** Race conditions on order state transitions (two webhooks updating same order). Mitigation: implement optimistic concurrency with version field before launching production payments. Do this NOW.
3. **Third bottleneck:** Payout processing delays when sellers reach 100+. Mitigation: batch payouts run as a server cron, use Firestore transactions for ledger entries.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Financial Calculations

**What people do:** Calculating commission, payout amounts, or totals in the browser using client-side JavaScript.

**Why it's wrong:** Client code can be modified, inspected, or replayed. Financial calculations must be authoritative (server-only) to prevent fraud and ensure audit compliance.

**Do this instead:** Commission, payout, tax, and fee calculations run exclusively in server route handlers or `server/services/`. The client receives computed values via API response and only displays them.

### Anti-Pattern 2: Single Order Status Flag Without State Machine

**What people do:** Using a single `order.status` string field that any service can set to any value, with scattered if/else checks to "prevent" invalid transitions.

**Why it's wrong:** Creates bugs that are hard to reproduce (race conditions, invalid states), makes the codebase fragile, and every new developer has to guess what transitions are valid.

**Do this instead:** A centralized state machine (Pattern 2) with explicit transition matrix. Every status change goes through one function.

### Anti-Pattern 3: Direct Stripe/Iyzico Calls From Components

**What people do:** Importing Stripe SDK directly in React components and making payment calls client-side.

**Why it's wrong:** Exposes Stripe secret keys, bypasses server-side validation, makes it impossible to add server-side payment logic (commission, hold, etc.).

**Do this instead:** All payment operations go through Express server routes. The client only handles UI rendering and redirect URLs. Current architecture already does this correctly via `POST /api/create-payment-intent` etc. -- maintain this pattern.

### Anti-Pattern 4: Treating All Firestore Data as Readable by Client

**What people do:** Reading seller financial data, payout records, or commission configurations directly from Firestore client SDK using the same pattern as product data.

**Why it's wrong:** Firestore security rules are the only defense. A misconfigured rule exposes all seller financial data. This is the most common marketplace security incident.

**Do this instead:** Financial data (payouts, commissions, seller balances, platform revenue) is NEVER read from client-side Firestore. It is fetched exclusively via authenticated Express API routes that enforce role-based access.

### Anti-Pattern 5: Premature Microservices

**What people do:** Splitting the marketplace into separate microservices (order service, payment service, seller service) before reaching 100k+ users or having multiple teams.

**Why it's wrong:** Adds massive overhead (network calls, data consistency, deployment coordination, debugging) for a solo developer. The current Express monolith is appropriate.

**Do this instead:** Keep the monolith but enforce strict module boundaries. Use folders (`server/services/orders/`, `server/services/finance/`) to separate concerns. Extract to services only when there's a proven scaling need.

## Integration Points

### External Services

| Service                   | Integration Pattern                                                              | Notes                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Stripe Connect**        | Server-side API calls via Stripe SDK                                             | Express routes only. Use Stripe Connect for on-behalf-of transfers to sellers. Seller KYC triggers Stripe Connect account creation. |
| **Iyzico**                | Server-side API via iyzico.cjs wrapper                                           | Turkish sub-merchant model. Different from Stripe Connect -- may need manual payout batching.                                       |
| **Firebase Auth**         | Client SDK for sign-in, server verifies tokens via admin SDK                     | Current pattern is correct. Keep as-is.                                                                                             |
| **Firebase Storage**      | Server generates signed URLs, client uploads directly                            | For KYC document upload: server generates signed URL with expiration, client uploads directly, server verifies after upload.        |
| **Firebase Firestore**    | Client SDK for reads (products, reviews), Admin SDK for writes (orders, finance) | Gradual migration per Pattern 4.                                                                                                    |
| **Algolia / MeiliSearch** | Server-side indexing via API client, client-side search via instantsearch.js     | Abstract behind `SearchProvider` interface from day one.                                                                            |
| **Shipping Carriers**     | Server-side tracking via carrier API                                             | Webhook endpoints in `server/routes/webhooks/cargo.ts` for tracking updates.                                                        |
| **Google Gemini**         | Server-side proxy in `server/routes/gemini.ts` (current)                         | Current pattern is correct -- AI calls go through server.                                                                           |

### Internal Boundaries

| Boundary                     | Communication      | Notes                                                                                      |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| **Client SPA -> Server API** | HTTP (Axios)       | Keep current Axios approach. All new marketplace features use API-only.                    |
| **Client SPA -> Firestore**  | Firebase SDK       | Gradually restrict to read-only, latency-tolerant data (products, categories, reviews).    |
| **Server -> Firestore**      | Firebase Admin SDK | All writes for financial data, orders, commission via admin SDK (bypasses security rules). |
| **Server -> Stripe/Iyzico**  | SDK HTTP calls     | Always server-side. Never expose API keys to client.                                       |
| **Server -> Search Engine**  | REST API           | Background indexing via events. Search queries run from server or client-side search SDK.  |

## Build Order (Feature Dependencies)

The architecture must be built in dependency order. Each layer assumes the one below it is stable.

```
Phase 1: Foundation (Marketplace Core)
  ├── Order splitting data model (OrderSet + SubOrder)
  ├── Order lifecycle state machine (transition matrix, guards, audit log)
  ├── Commission rule engine (category-based variable rates)
  └── Immutable financial ledger (append-only entries)

Phase 2: Payment & Payout
  ├── Escrow payment flow (Stripe Connect + Iyzico sub-merchant)
  ├── Commission deduction at payout time
  ├── Payout scheduling (daily batch, threshold-based)
  └── Seller finance dashboard (read-only, API-sourced)

Phase 3: Seller Onboarding
  ├── KYC document upload flow (Firebase Storage signed URLs)
  ├── Admin KYC review queue (approve/reject with reason)
  ├── Stripe Connect account creation on approval
  └── Seller tier/suspension management

Phase 4: Search & Discovery
  ├── Search engine integration (Algolia/MeiliSearch)
  ├── Faceted filter UI (category, price, rating, seller)
  ├── Relevance tuning (recency, rating, stock boost)
  └── Search analytics (null-rate tracking, click-through)

Phase 5: Shipping & Fulfillment
  ├── Shipping carrier integration API
  ├── Tracking code management per sub-order
  ├── Delivery confirmation flow (buyer + auto)
  └── Return/refund state machine integration

Phase 6: Multi-Currency
  ├── Exchange rate service (API-sourced, cached)
  ├── Product price display in multiple currencies
  └── Settlement currency handling (TRY vs EUR)
```

## Sources

- **Multi-vendor marketplace domain decomposition:** MercurJS (Medusa-based marketplace platform) architecture -- Order Set / Order Group pattern, seller isolation, multi-vendor checkout splitting. DeepWiki documentation provides reference implementation.
- **Order state machine patterns:** commercetools State Machines documentation, Spryker OMS state machine module, Flexbase workflow state machine case study. Industry standard FSM approach for e-commerce order lifecycle.
- **Commission/payout architecture:** Marketplacer Financial System Architecture (escrow/holding period model, batch payout scheduling, immutable ledger), Bagisto marketplace payments guide (commission rules engine).
- **Search infrastructure:** MeiliSearch marketplace guide, Algolia marketplace search ebook, MercurJS search architecture (multi-vendor index isolation, event-driven indexing).
- **Firebase migration pattern:** Firebase Admin SDK architecture, repository/service factory pattern for Firestore abstraction (ROAR platform docs), yoik.me migration issue (#10) -- keep client auth, move data access server-side.
- **Architecture anti-pattern synthesis:** Industry experience -- client-side financial calculations, single status flags, premature microservices documented across multiple marketplace post-mortems.

---

_Architecture research for: Benim Olan (Global Artisan Marketplace)_
_Researched: 2026-06-02_
