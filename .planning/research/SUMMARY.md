# Project Research Summary

**Project:** Benim Olan (Mercora) -- Global Artisan Marketplace
**Domain:** E-commerce marketplace (multi-seller, multi-region TR+EU)
**Researched:** 2026-06-02
**Confidence:** HIGH

## Executive Summary

This is a multi-vendor e-commerce marketplace connecting artisan sellers with buyers in Turkey and Europe. Experts build these as domain-segmented modular monoliths -- a single Express backend with strict module boundaries (buyer, seller, admin, finance, orders), not microservices. The architecture must be organized around three concerns: multi-tenant data isolation, escrow-style payment flow (platform holds funds and deducts commission before paying sellers), and dual-payment-region compliance (TRY through Iyzico, EUR through Stripe Connect).

The recommended approach is a phased build starting with compliance infrastructure (KVKK/GDPR has criminal liability in Turkey), then payment + order lifecycle as the critical path, followed by seller onboarding, search, shipping, and multi-currency. Key risks: (1) Firestore cost explosion, (2) order state machine bugs causing double refunds, (3) commission/payout math errors with dual providers, (4) KVKK/GDPR compliance failure carrying criminal liability, (5) Firestore-based search killing conversion.

## Key Findings

### Recommended Stack

Iyzico Marketplace (TRY) + Stripe Connect (EUR) -- dual payment non-negotiable. Typesense self-hosted for search. Entegi (TR) + EasyPost (EU) for shipping. Manual KYC with Veriff at scale.

**Core technologies:**

- **Iyzico Marketplace API**: TRY payments + sub-merchant splits for Turkey
- **Stripe Connect (Destination Charges)**: EUR payments + seller payouts (no Turkey support)
- **Typesense (self-hosted)**: Full-text search with faceted filters and field weighting
- **Entegi API**: Multi-carrier Turkish shipping (Yurtici, MNG, Aras, PTT, UPS)
- **EasyPost/Shippo**: Multi-carrier EU shipping (DHL, DPD, UPS, GLS)
- **Firestore Subcollections + Distributed Counters**: Seller data isolation and scalable counts
- **Firebase Cloud Functions v2**: Order lifecycle automation
- **@tanstack/react-query**: Server state management
- **Exchange rate API (openexchangerates.org / exchangerate.host)**: Daily FX rates

### Expected Features

**Must have (P0):** Secure payment (Stripe 3DS + Iyzico), full order lifecycle (Pending → Processing → Shipped → Delivered), KYC seller onboarding, KVKK/GDPR compliance, category-based commission (5-20%), transactional emails

**Should have (P1):** Advanced search (Typesense), cargo tracking, verified reviews, multi-currency, seller finance dashboard, returns workflow, cross-border compliance

**Defer (P2):** AI assistant, smart recommendations, multi-vendor cart, native apps, ad platform, B2B wholesale, warehouse (WMS), dynamic pricing

### Architecture Approach

Domain-segmented modular monolith with 6 patterns: OrderSet/SubOrder, state machine FSM, commission engine with immutable ledger, API-first migration from Firestore, search abstraction, escrow payment flow.

**Build order (dependency chain):**

1. **Foundation** -- Order data model, state machine, commission engine, immutable ledger
2. **Payment & Payout** -- Dual-payment integration, escrow flow, webhook idempotency
3. **Seller Onboarding** -- KYC flow, admin review, Stripe Connect account creation
4. **Search & Discovery** -- Typesense self-hosted, event-driven indexing, faceted filters
5. **Shipping & Fulfillment** -- Carrier API integration, tracking, returns
6. **Multi-Currency** -- FX rate service, display/settlement currency separation
7. **Reviews & Trust** -- Verified purchase badges, photo reviews, seller Q&A
8. **Cross-Border Compliance** -- HS code suggestion, customs documentation

### Critical Pitfalls

1. **Firestore Cost Explosion** -- Cache aggressively, cursor pagination, custom claims, billing alerts
2. **Order State Machine Without Enforcement** -- Centralized transition matrix with optimistic locking
3. **Commission Math Errors** -- Integer money, single formula, `reverse_transfer: true`, daily reconciliation
4. **Multi-Currency FX Costs** -- Single base price (TRY), rate locking at checkout, like-for-like settlement
5. **KVKK/GDPR Afterthought** -- VERBIS registration, granular consent, Turkish SCCs, separate data purposes
6. **Dual Payment Provider Complexity** -- Iyzico sub-merchant onboarding differs from Stripe Connect, need abstraction layer
7. **Search on NoSQL** -- Firestore cannot do faceted search; must switch to dedicated engine by ~500 products

## Implications for Roadmap

### Phase 1: Foundation and Compliance (P0 -- highest priority)

**Rationale:** Every feature depends on data models, security rules, and compliance. KVKK/GDPR has criminal liability.
**Delivers:** Order data model (OrderSet + SubOrder), state machine, commission engine, immutable ledger, KVKK/GDPR compliance, Firestore security rules hardening
**Research needed:** No (standard patterns)

### Phase 2: Payment and Order Lifecycle (P0 -- critical path)

**Rationale:** Payments are the critical path. State machine and commission engine from Phase 1 consumed here.
**Delivers:** Stripe Connect (EUR), Iyzico Marketplace (TRY), escrow flow, inventory reservation, webhook idempotency
**Research needed:** Yes (highest risk -- dual provider complexity)

### Phase 3: Seller Onboarding and KYC (P0)

**Rationale:** Depends on Phase 2 for Stripe Connect account creation on KYC approval.
**Delivers:** KYC document upload portal, admin review queue, Stripe Connect account creation, enhanced seller dashboard
**Research needed:** No (standard patterns)

### Phase 4: Search and Discovery (P1)

**Rationale:** Firestore cannot do faceted search. Must deploy before 500 products to maintain conversion.
**Delivers:** Typesense self-hosted, event-driven indexing, faceted filter UI, relevance tuning
**Research needed:** No (standard patterns)

### Phase 5: Shipping and Fulfillment (P1)

**Rationale:** Depends on Phase 2 order lifecycle (Shipped/Delivered states).
**Delivers:** Entegi API (TR carriers), EasyPost API (EU carriers), real-time tracking, delivery confirmation, returns workflow
**Research needed:** Yes (carrier API specifics)

### Phase 6: Multi-Currency and Localization (P1)

**Rationale:** Depends on Phase 2 payment settlement rules.
**Delivers:** Exchange rate service, price display in local currency, like-for-like settlement, RTL improvements
**Research needed:** No (standard patterns)

### Phase 7: Reviews and Trust Features (P1)

**Rationale:** Verified purchase badge requires delivered orders (Phase 2 + Phase 5).
**Delivers:** Verified purchase badge, photo reviews, seller Q&A, rating summary improvements
**Research needed:** No (standard patterns)

### Phase 8: Cross-Border Compliance (P1)

**Rationale:** Depends on Phase 6 for total landed cost calculation.
**Delivers:** HS code suggestion, customs documentation, total landed cost display
**Research needed:** Yes (Turkish customs specifics)

### Phase 9+: Innovation (P2 -- Deferred)

AI assistant, recommendations, multi-vendor cart, native apps, B2B, WMS, dynamic pricing, ad platform.

## Confidence Assessment

| Area         | Confidence | Notes                                                               |
| ------------ | ---------- | ------------------------------------------------------------------- |
| Stack        | HIGH       | Dual-region constraint verified from official Stripe/Iyzico docs    |
| Features     | HIGH       | Competitor analysis from Trendyol, Hepsiburada, Amazon              |
| Architecture | HIGH       | Patterns from commercetools, Spryker, MercurJS                      |
| Pitfalls     | HIGH       | Stripe Connect analysis, KVKK legal sources, real-world postmortems |

**Overall: HIGH**

### Gaps to Address

- Iyzico Marketplace approval timeline -- apply during Phase 1. PayTR as fallback.
- Typesense VPS sizing -- start 2GB RAM, 1 CPU. Monitor and scale.
- Turkish SCCs for cross-border data transfers -- engage privacy lawyer in Phase 1.
- Stripe Connect entity eligibility -- verify during Phase 2 research.

## Sources

### Primary (HIGH)

- Stripe Connect docs -- no Turkey/TRY for Connect payouts (2026)
- Iyzico docs -- sub-merchant onboarding, commission splits, mass payout
- Firebase docs -- Firestore limits, security rules, Cloud Functions v2
- Typesense vs alternatives -- field weighting, HA, pricing comparison
- KVKK requirements -- VERBIS registration, criminal liability, consent requirements
- commercetools State Machines -- FSM pattern for order lifecycle
- MercurJS -- Order Set / Order Group pattern

### Secondary (MEDIUM)

- Veriff Marketplace Suite -- identity verification for dual-sided platforms
- Entegi -- Turkish multi-carrier shipping middleware
- EasyPost/Shippo -- EU carrier comparison and integration
- Trendyol Seller Center -- commission structure, seller requirements (2026)
- Hepsiburada -- logistics benchmarks and commission rates
- Freetrade -- Firestore scaling experience and cost optimization

### Tertiary (LOW)

- Zonos/Easyship customs API -- not evaluated for Turkish customs
- Turkish SCC mechanism -- identified but not evaluated
- Amazon Turkey seller requirements

---

_Research completed: 2026-06-02_
_Ready for roadmap: yes_
