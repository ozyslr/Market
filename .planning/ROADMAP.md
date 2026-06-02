# Roadmap: Benim Olan (Mercora) — Global Artisan Marketplace

## Overview

Benim Olan is a live Technical MVP transitioning to a full-scale multi-vendor marketplace. This roadmap builds the missing P0 infrastructure (compliance, payments, order lifecycle, KYC) first, then adds search, shipping, multi-currency, and trust features in dependency order. Phase 8 (cross-border compliance) is deferred to v2 as it depends on multi-currency settlement and is not required for TR+EU launch.

**Granularity:** Fine (8 phases)
**Mode:** MVP — each phase delivers an end-to-end user capability as vertical slices.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work.
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED).
- v2 phases are annotated and deferred.

- [ ] **Phase 1: Foundation & Compliance** — Order data model, commission engine, immutable ledger, KVKK/GDPR compliance, Firestore security rules
- [ ] **Phase 2: Payment & Order Lifecycle** — Dual-provider payments (Iyzico TRY + Stripe EUR), escrow flow, order lifecycle, seller payouts, transactional emails
- [ ] **Phase 3: Seller Onboarding & KYC** — KYC document upload, admin review/approval, seller store management, CSV import/export, enhanced REST API
- [ ] **Phase 4: Search & Discovery** — Typesense full-text search, faceted filters, sort options, event-driven index updates
- [ ] **Phase 5: Shipping & Fulfillment** — Entegi (TR) + EasyPost (EU) carrier integration, live tracking, delivery confirmation, returns workflow
- [ ] **Phase 6: Multi-Currency** — Exchange rate service, TRY-based pricing with EUR display, rate locking at checkout, TRY-only settlement
- [ ] **Phase 7: Reviews & Trust** — Verified purchase badge, photo reviews, seller rating, Q&A
- [ ] **Phase 8: Cross-Border Compliance (v2)** — HS codes, customs docs, total landed cost (deferred to v2)

## Phase Details

### Phase 1: Foundation & Compliance

**Goal**: Order data model, commission engine, and legal compliance infrastructure are operational.
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: ORD-01, ORD-02, ORD-06, COM-01, COM-02, COM-03, CMP-01, CMP-02, CMP-03, CMP-04, CMP-05, CMP-06
**Success Criteria** (what must be TRUE):

1. Orders are created with OrderSet/SubOrder structure; state machine enforces valid transitions (Pending, Processing, Shipped, Delivered, Cancelled, Returned)
2. Commission rates are configurable per-category (5-20%) and per-seller override; every commission and payout is recorded in an immutable ledger
3. Cookie consent banner displays with category-based opt-in (mandatory, analytics, marketing); EU users see GDPR-specific consent flow
4. Users can access privacy policy, terms of service, KVKK disclosure text, and VERBIS registration info; users can submit data deletion requests
5. Firestore security rules block unauthorized reads/writes across all collections; only authenticated users access their own data
   **Plans**: TBD
   **UI hint**: yes

### Phase 2: Payment & Order Lifecycle

**Goal**: Customers can pay with TRY or EUR, orders flow through their lifecycle, and sellers receive automated payouts.
**Mode**: mvp
**Depends on**: Phase 1 (state machine, commission engine, immutable ledger)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, ORD-03, ORD-04, ORD-05, COM-04, COM-05, NOT-01, NOT-02, NOT-03
**Success Criteria** (what must be TRUE):

1. Customer pays with Iyzico (TRY, 3D Secure) or Stripe (EUR, 3D Secure); payment is held in platform escrow
2. Platform deducts category-based commission automatically; seller payout initiates on T+7 schedule
3. Refunds reverse commission via reverse_transfer; webhook events are idempotent -- duplicate events do not cause double processing
4. Seller can transition order from Processing to Shipped; customer sees real-time order status on order detail page; stock is reserved at payment and restored on cancellation
5. Customer receives email for order confirmation, shipping update, delivery, and returns; seller receives email for new orders; cart abandonment email triggers after 1 hour of inactivity
6. Seller views financial dashboard showing current balance, pending payouts, and payout history
   **Plans**: TBD
   **UI hint**: yes

### Phase 3: Seller Onboarding & KYC

**Goal**: Sellers can register, verify their identity, and manage their store and products independently.
**Mode**: mvp
**Depends on**: Phase 2 (Stripe Connect account creation requires payment infrastructure)
**Requirements**: SEL-01, SEL-02, SEL-03, SEL-04, SEL-05, SEL-06
**Success Criteria** (what must be TRUE):

1. Seller completes KYC onboarding flow -- uploads identity document, tax certificate, and bank account information; Stripe Connect account is created on approval
2. Admin reviews KYC documents in dedicated panel with approve/reject workflow, including reason for rejection
3. Seller store page displays with logo, banner, about section, and product listing; store URL is shareable
4. Seller manages products via dashboard -- add, edit, stock update, price change; validates minimum 1 photo and required category
5. Seller imports/exports products via CSV with header validation and error reporting
6. Seller REST API exposes CRUD endpoints for products and orders with API key authentication and rate limiting
   **Plans**: TBD
   **UI hint**: yes

### Phase 4: Search & Discovery

**Goal**: Buyers can find products quickly with relevant search results, filters, and sort options.
**Mode**: mvp
**Depends on**: Phase 2 (products must exist with order history for popularity-based sorting)
**Requirements**: SRC-01, SRC-02, SRC-03, SRC-04, SRC-05
**Success Criteria** (what must be TRUE):

1. Full-text search returns relevant results with typo tolerance (e.g., "telefon" matches "telefon") using Typesense
2. Buyers filter results by price range, category, brand, minimum rating, and shipping option; active filters are clearly displayed and removable
3. Buyers sort by newest, best-selling, price ascending/descending, and rating
4. Search result cards show product image, title, price (with currency), rating stars, and seller name
5. Search index updates automatically within seconds when products are added, updated, or deleted
   **Plans**: TBD
   **UI hint**: yes

### Phase 5: Shipping & Fulfillment

**Goal**: Orders are shipped with carrier integration, tracked in real-time, and support returns.
**Mode**: mvp
**Depends on**: Phase 2 (order lifecycle with Shipped/Delivered states)
**Requirements**: SHP-01, SHP-02, SHP-03, SHP-04, SHP-05
**Success Criteria** (what must be TRUE):

1. TR shipments use Entegi API to create labels for Yurtici, MNG, Aras, PTT, UPS; EU shipments use EasyPost API for DHL, DPD, UPS, GLS
2. Tracking number and live carrier status are visible on the order detail page; status refreshes automatically
3. Customer receives email notification on delivery confirmation; delay notification triggers if estimated delivery date passes
4. Customer creates return request from order detail page; return status is trackable through the same lifecycle
   **Plans**: TBD
   **UI hint**: yes

### Phase 6: Multi-Currency

**Goal**: Prices display in local currency; settlement is always in TRY.
**Mode**: mvp
**Depends on**: Phase 2 (payment settlement rules), Phase 5 (shipping costs in local currency)
**Requirements**: CUR-01, CUR-02, CUR-03, CUR-04
**Success Criteria** (what must be TRUE):

1. Product prices are stored in TRY; EU visitors see prices converted to EUR using current exchange rate during browsing
2. Exchange rate is locked at checkout confirmation -- browsing rate fluctuations do not change the final amount
3. Product pages show both TRY and EUR prices; user can toggle display currency
4. Seller always receives payout in TRY regardless of buyer's payment currency
   **Plans**: TBD
   **UI hint**: yes

### Phase 7: Reviews & Trust

**Goal**: Buyers can leave verified reviews; sellers build reputation through ratings and Q&A.
**Mode**: mvp
**Depends on**: Phase 2 (verified purchase requires delivered orders), Phase 5 (delivery confirmation triggers review eligibility)
**Requirements**: REV-01, REV-02, REV-03, REV-04
**Success Criteria** (what must be TRUE):

1. Only verified purchasers (order delivered) can leave reviews; "Verified Purchase" badge appears on review
2. Reviews can include up to 5 photos; photos are displayed in a gallery on the product page
3. Seller rating summary (average, count, distribution) is displayed on store page and product detail page
4. Buyers can post questions on product pages; seller receives notification and can reply publicly
   **Plans**: TBD
   **UI hint**: yes

### Phase 8: Cross-Border Compliance (v2)

**Goal**: Cross-border EU sales with customs documentation and compliance (deferred to v2).
**Mode**: mvp
**Depends on**: Phase 6 (total landed cost calculation needs multi-currency)
**Requirements**: None (v2 scope)
**Success Criteria** (what must be TRUE):

1. HS code auto-suggested based on product category
2. Customs documentation auto-generated for cross-border shipments
3. Total landed cost (product + shipping + duties) displayed to buyer
4. EU GPSR labeling requirements met for all products sold to EU
   **Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 (v2)

| Phase                           | Plans Complete | Status      | Completed |
| ------------------------------- | -------------- | ----------- | --------- |
| 1. Foundation & Compliance      | 0/--           | Not started | -         |
| 2. Payment & Order Lifecycle    | 0/--           | Not started | -         |
| 3. Seller Onboarding & KYC      | 0/--           | Not started | -         |
| 4. Search & Discovery           | 0/--           | Not started | -         |
| 5. Shipping & Fulfillment       | 0/--           | Not started | -         |
| 6. Multi-Currency               | 0/--           | Not started | -         |
| 7. Reviews & Trust              | 0/--           | Not started | -         |
| 8. Cross-Border Compliance (v2) | 0/--           | Not started | -         |
