# Stack Research

**Domain:** E-commerce marketplace (multi-seller, multi-region TR+EU)
**Researched:** 2026-06-02
**Confidence:** MEDIUM (some library versions inferred from current install base)

## Recommended Stack

### Payment Infrastructure (Dual Provider — Critical Architecture)

This is the single most important stack decision. Stripe Connect does NOT support Turkey or TRY. Iyzico is the dominant Turkish payment gateway. The platform MUST dual-route payments by region.

| Technology                               | Version                            | Purpose                                             | Why Recommended                                                                                                                                                                                                                                 |
| ---------------------------------------- | ---------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Iyzico Marketplace API**               | iyzipay@2.x (existing CJS wrapper) | TRY payments + seller commission splits (TR market) | Only major Turkish gateway with sub-merchant onboarding, escrow, and automated commission split APIs. Already partially integrated. Must upgrade to full Marketplace flow (subMerchantPrice per basket item, item approval for escrow release). |
| **Stripe Connect** (Destination Charges) | stripe@22.x (existing)             | EUR/international payments + seller payouts         | Stripe Connect handles platform fees via `application_fee_amount`, automated onboarding via Express accounts, and cross-border payouts. Does NOT support Turkey/TRY — this is complementary to Iyzico.                                          |
| **Stripe Express Accounts**              | stripe@22.x API                    | Seller KYC/payout onboarding (non-TR)               | Balanced control and simplicity. Stripe handles identity verification, sellers get simplified dashboard. Platform controls payout scheduling and fee deduction.                                                                                 |

**Critical constraint:** Stripe Connect does not support Turkey for payouts or TRY settlement (confirmed 2026). All TRY transactions MUST go through Iyzico. All EUR/international seller payouts go through Stripe Connect. This creates a dual-payment architecture where the checkout flow must detect buyer region and route accordingly.

### Search Engine

| Technology                  | Version | Purpose                                               | Why Recommended                                                                                                                                                                                                             |
| --------------------------- | ------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Typesense** (self-hosted) | 28.x    | Full-text product search, faceted filters, geo-search | Best balance for marketplace: built-in HA via Raft consensus, field weighting/boosting for merchandising, multi-tenant scoped API keys (seller isolation), sub-50ms query latency. Self-hosted via Docker on VPS (~$16/mo). |

**Why not alternatives:**

- **Meilisearch**: No field weighting (ranking rules only), no HA in Community Edition. Better DX but worse for e-commerce merchandising needs.
- **Algolia**: $500+/mo at 1M searches. No self-host option. Full vendor lock-in. Only justified at enterprise scale with dedicated search budget.
- **Elasticsearch**: Excessive ops overhead for a solo developer. Needs Java heap tuning, cluster management, and significant memory.

### Shipping Integration

| Technology                 | Version                  | Purpose                                                                      | Why Recommended                                                                                                                                                                                                               |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entegi API**             | (SaaS, Turkish provider) | Multi-carrier Turkey domestic shipping (Yurtici, MNG, Aras, Sürat, PTT, UPS) | Single middleware handles all major Turkish carriers. No minimum volume requirements. Web service API for label generation, tracking, and order sync. Already Trendyol/Hepsiburada integrated — proven in Turkish e-commerce. |
| **EasyPost** or **Shippo** | (SaaS)                   | Multi-carrier EU cross-border shipping (DHL, DPD, UPS, GLS)                  | Unified API for European carriers with rate shopping, label generation, and tracking. $0.05/label pricing model scales with volume. Supports cross-border customs documentation.                                              |

**Why not direct carrier integrations:** Building and maintaining separate API integrations for Yurtici, MNG, PTT, DHL, DPD, UPS is excessive for a solo developer. Middleware (Entegi + EasyPost) = two integrations covering 10+ carriers.

### KYC / Identity Verification

| Technology                         | Version            | Purpose                               | Why Recommended                                                                                                                                                                                                        |
| ---------------------------------- | ------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1: Manual review**         | (Firebase Storage) | Seller document upload + admin review | Zero dependency, zero cost. Sellers upload TC Kimlik/passport/company docs to Firebase Storage. Admin reviews in dashboard and approves/rejects. Sufficient for early stage (<100 sellers).                            |
| **Phase 2: Veriff** (when scaling) | (SaaS)             | Automated identity verification       | Full marketplace suite launched Feb 2026. Supports Turkey (TC Kimlik, passport) + EU (eIDAS). Adaptive workflows for different seller types. Biometric liveness + document verification. Pay-per-verification pricing. |

**Why not alternatives:**

- **Onfido**: Better EU coverage but weaker Turkey-specific document support. No explicit marketplace suite.
- **Shufti Pro**: Supports Turkey docs but weaker UI/developer experience than Veriff. Pricing less transparent.
- **Persona**: Strong US-focused, weaker in Turkey/EU.

### Multi-Currency Approach

| Technology                                         | Version                          | Purpose                            | Why Recommended                                                                                               |
| -------------------------------------------------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Intl.NumberFormat** (native)                     | (built into all modern browsers) | Locale-aware price display         | No library needed. Native browser API handles formatting for TRY, EUR, USD, GBP, etc. Works with all locales. |
| **Exchange rate: fixer.io or open exchange rates** | (SaaS API)                       | Live FX rates for price conversion | Store base prices in EUR. Convert to TRY for Turkey buyers. Freeze rate at order time (15-30 min expiry).     |
| **Iyzico native TRY**                              | (built into iyzipay)             | TRY settlement in Turkey           | Iyzico handles TRY natively. No conversion needed for Turkish transactions.                                   |

**Architecture pattern:** Store all base prices in EUR in Firestore. Display converted amounts based on detected/set currency. When buyer is in Turkey -> charge in TRY via Iyzico. When in EU -> charge in EUR via Stripe. This avoids double conversion losses.

### Firebase & Data Layer Optimizations

| Technology                                         | Version                                          | Purpose                                   | Why Recommended                                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Firestore Subcollections**                       | (data modeling pattern)                          | Seller data isolation                     | Structure: `sellers/{id}/products/{id}`, `sellers/{id}/orders/{id}`. Subcollections keep data organized, respect Firestore's 1MB document limit, and simplify security rules.                         |
| **Firestore Distributed Counters**                 | (firebase-firestore/distributed-counter pattern) | Scalable counts (views, followers, stock) | Firestore has a 1 write/second per document limit. For high-traffic counters (product views, seller followers), use distributed counter shards (20-30 subcollections). Critical at marketplace scale. |
| **Firestore Security Rules with custom functions** | (rules language)                                 | Multi-tenant data isolation               | Custom functions to check seller ID against auth token and resource path. Prevent sellers from reading/writing other sellers' data. Must be designed upfront — retrofitting is painful.               |
| **Firebase Cloud Functions (v2)**                  | firebase-functions@latest                        | Order lifecycle automation                | `onDocumentCreated` for order placed -> commission calc -> inventory decrement -> notification. `onDocumentUpdated` for status transitions. Offloads async work from Express server.                  |

**At-scale concerns for Firestore:**

- Write limit of 500/sec per document (ok for marketplace unless one product gets 500+ orders/sec)
- Read limit of 10K/sec per database (monitor at 50K+ daily active users)
- 1MB per document (enforce subcollection pattern from day 1)
- No built-in aggregation queries (need application-level aggregation or Cloud Functions for seller analytics)
- No JOINs (denormalize seller-name, product-name into order documents at write time)

### Real-Time Features

| Technology                   | Version                         | Purpose                              | Why Recommended                                                                                                         |
| ---------------------------- | ------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Firestore onSnapshot**     | (firebase/firestore client SDK) | Real-time order status updates       | Already in existing stack. Use for buyer order tracking page: live updates when status changes.                         |
| **Server-Sent Events (SSE)** | (Express built-in)              | Admin/seller dashboard notifications | Lighter than WebSocket for one-way notifications. For solo developer, simpler to implement and maintain than Socket.io. |

### Admin & Seller Dashboard

| Technology            | Version                  | Purpose                              | Why Recommended                                                                   |
| --------------------- | ------------------------ | ------------------------------------ | --------------------------------------------------------------------------------- |
| **Recharts**          | 3.8.1 (existing)         | Seller/Admin analytics charts        | Already installed. Enough for revenue charts, order trends, category performance. |
| **Simple CSV export** | papaparse@5.x (existing) | Seller payout reports, order exports | Already installed. Use for monthly settlement reports and tax documentation.      |

## Supporting Libraries

| Library                             | Version | Purpose                                                  | When to Use                                                                                   |
| ----------------------------------- | ------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **typesense** (npm)                 | latest  | Typesense client SDK for Node.js backend                 | Server-side indexing of products into Typesense when product created/updated                  |
| **typesense-instantsearch-adapter** | latest  | Adapter for Algolia InstantSearch to work with Typesense | If using InstantSearch UI components on frontend (optional, can build custom React search UI) |
| **@tanstack/react-query**           | 5.x     | Server state management, caching, background sync        | Required for search results caching, exchange rate caching, shipping rate caching             |
| **date-fns**                        | 4.x     | Date formatting for order timestamps, payouts            | Lighter than moment.js, tree-shakeable, timezone-aware for TR/EU time zones                   |

## Installation

```bash
# Search engine - self-hosted Typesense via Docker (on VPS, not in repo)
# docker-compose.yml at VPS level, not in app repo

# Core payment upgrades
npm install stripe@latest  # already installed, verify version
# iyzipay already installed via CJS wrapper

# Search - Typesense client for Node.js backend
npm install typesense

# Frontend state management
npm install @tanstack/react-query @tanstack/react-query-devtools

# Date handling
npm install date-fns

# KYC document upload - already using Firebase Storage, no new library

# Shipping middleware - HTTP calls via axios (already installed)
# No SDK needed for Entegi or EasyPost - they expose REST APIs

# Internationalization - reformat currency with Intl (built-in)
```

## Alternatives Considered

| Category         | Recommended              | Alternative           | When to Use Alternative                                                                                                                 |
| ---------------- | ------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Payment (TR)     | Iyzico Marketplace       | PayTR, Param          | Iyzico is the market standard. PayTR if Iyzico approval is delayed.                                                                     |
| Payment (EU)     | Stripe Connect           | Adyen for Platforms   | Adyen if Stripe Connect cannot meet specific EU regulatory needs (rare for a startup). Adyen has higher integration complexity.         |
| Search           | Typesense                | Meilisearch           | Meilisearch if product catalog exceeds available RAM (Typesense is RAM-first) or operations simplicity outweighs merchandising control. |
| Shipping (TR)    | Entegi                   | Synkka, Geliver       | Synkka if AI-powered route optimization is needed. Geliver if lower cost is priority.                                                   |
| Shipping (EU)    | EasyPost                 | Shippo, SendCloud     | Shippo for TikTok Shop integration. SendCloud for European-focused workflows (returns, cross-border).                                   |
| KYC              | Manual -> Veriff         | ShuftiPro             | ShuftiPro if Turkish document support (NFC chip IDs) is critical and budget is tight.                                                   |
| State management | React Context (existing) | Zustand, Jotai        | Zustand if context re-renders become a performance issue (unlikely at current scale).                                                   |
| Real-time        | Firestore onSnapshot     | WebSocket (Socket.io) | Socket.io if you need bidirectional real-time (seller chat). Out of scope for now.                                                      |

## What NOT to Use

| Avoid                              | Why                                                                                                                                                                                               | Use Instead                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Algolia**                        | $500+/mo at 1M searches, no self-host option, vendor lock-in. Pricing is per-record + per-request, unpredictable at marketplace scale.                                                            | Typesense self-hosted (~$16/mo)                                                                           |
| **Elasticsearch**                  | Heavy ops overhead (JVM tuning, cluster management, ~4GB+ RAM minimum). Overkill for solo developer.                                                                                              | Typesense (Go binary, Docker deploy, ~256MB RAM for small catalogs)                                       |
| **MongoDB / PostgreSQL migration** | "Firebase doesn't scale" is FUD. Firestore handles marketplace scale with proper data modeling. Migration to SQL is a premature optimization that would delay shipping by months.                 | Firestore with disciplined data modeling patterns (subcollections, denormalization, distributed counters) |
| **Redux / Zustand migration**      | Current React Context setup handles current complexity. Migration would be a rewrite with no user-facing benefit.                                                                                 | Keep React Context, add @tanstack/react-query for server-state (orthogonal concern)                       |
| **Socket.io**                      | Adds WebSocket infrastructure, reconnection handling, state sync. For order tracking, Firestore onSnapshot works better (already authenticated, same security rules).                             | Firestore onSnapshot + SSE for admin dashboard notifications                                              |
| **Adyen for Platforms**            | Higher integration complexity, less community support, fewer Turkish payment options. Only justified at very high volume (100K+ transactions/month) where Stripe Connect fees become significant. | Stripe Connect (EU) + Iyzico (TR)                                                                         |
| **Onfido**                         | Weaker Turkey-specific document support. No explicit marketplace onboarding workflow.                                                                                                             | Veriff (marketplace suite, Feb 2026) or manual review                                                     |
| **Wise API for payouts**           | Manual payout orchestration, no dispute handling, no automated fee deduction. Would require building payout logic from scratch.                                                                   | Stripe Connect + Iyzico Marketplace (both handle payouts natively)                                        |

## Stack Patterns by Variant

**If seller volume exceeds 100 active sellers and KYC automation becomes a bottleneck:**

- Add Veriff API integration (automated document verification, biometric liveness)
- Expected cost: ~$1-3 per verification (50-100 sellers = $50-300/mo)
- Keep manual review path for edge cases

**If product catalog exceeds 50,000 SKUs or RAM constraint becomes an issue for Typesense:**

- Scale Typesense vertically (more RAM on VPS) or horizontally (multi-node cluster with Raft)
- Implement Typesense collection partitioning by category
- Consider Meilisearch as fallback (disk-based storage, no RAM limitation)

**If Stripe Connect cannot be used for the platform's legal entity (e.g., company registered in a non-supported country):**

- Use Stripe PaymentIntents for buyer-side (accept payments from buyers)
- Use Iyzico for seller payouts in Turkey
- Use Wise API for EU seller payouts (manual reconciliation)

**If order volume exceeds 1000 orders/day and Firestore write limits become a concern:**

- Implement write sharding for order IDs (prefix with date + random suffix)
- Move high-write operations to Cloud Tasks or a work queue pattern
- Consider a read replica for analytics queries (export to BigQuery via Firebase Extensions)

## Version Compatibility

| Package                   | Compatible With          | Notes                                                                                    |
| ------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| typesense npm client      | Typesense server 28.x    | Client-server compat is strict — match major versions                                    |
| stripe@22.x               | Stripe Connect API 2024+ | Existing version is fine. No breaking changes expected for Destination Charges flow.     |
| iyzipay@2.x               | Iyzico Marketplace API   | Existing CJS wrapper works. Must add subMerchant onboarding and item approval API calls. |
| @tanstack/react-query@5.x | React 19                 | Fully compatible with React 19. Do not use v4 (React 17/18 only).                        |
| firebase@12.x             | firebase-admin@13.x      | Client and admin SDKs are compatible at these versions.                                  |
| firebase-functions v2     | Node 22                  | Requires Node 20+ runtime. Compatible with project's Node 22 baseline.                   |

## Sources

- Stripe Connect docs — Verified: Stripe does NOT support Turkey/TRY for Connect payouts. [docs.stripe.com/connect](https://docs.stripe.com/connect)
- Iyzico Marketplace docs — Verified: Sub-merchant onboarding, commission splits, mass payout API. [docs.iyzico.com/en/products/marketplace](https://docs.iyzico.com/en/products/marketplace)
- Typesense comparison with Meilisearch/Algolia — WebSearch: field weighting, HA, pricing comparison, e-commerce feature matrix. HIGH confidence.
- Veriff Marketplace Suite (Feb 2026) — WebSearch: full-lifecycle identity for dual-sided platforms. MEDIUM confidence (press release, not tested).
- Entegi shipping integration — WebSearch: multi-carrier support for Yurtici, MNG, Aras, PTT, UPS. MEDIUM confidence (official site, no hands-on testing).
- Firestore scalability limits — Firebase official docs: 500 writes/sec per document, 10K reads/sec per database, 1MB per document. HIGH confidence.
- Stripe/Turkey support — WebSearch + Stripe official docs: Turkey not listed in Connect-supported countries. HIGH confidence.
- EasyPost vs Shippo vs SendCloud — WebSearch: European multi-carrier comparison. MEDIUM confidence.

---

_Stack research for: Benim Olan / Mercora marketplace transition_
_Researched: 2026-06-02_
