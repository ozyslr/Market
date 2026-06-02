# Feature Research

**Domain:** E-Commerce Marketplace (Trendyol-style, TR + Europe)
**Researched:** 2026-06-02
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete and untrustworthy.

| Feature                                       | Why Expected                                                                                                                 | Complexity | Notes                                                                                                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secure Payment Gateway (3D Secure)            | Buyers expect bank-grade security; 3D Secure is mandatory in TR (Iyzico/BKM) and EU (PSD2/SCA)                               | HIGH       | Dual provider: Stripe (EU/global) + Iyzico (TR). Must use backend API, not client-side simulation. Stripe Webhooks for async confirmation.                                |
| Full Order Lifecycle                          | Without order states (Pending -> Processing -> Shipped -> Delivered -> Cancelled -> Returned), no one trusts the platform    | MEDIUM     | Firestore state machine with webhook-driven transitions. Status must be visible to buyer AND seller in real-time.                                                         |
| KYC Seller Onboarding                         | Trendyol & Hepsiburada require business license, tax info, ID verification. Without it, platform attracts fraud sellers      | MEDIUM     | Document upload (Firebase Storage), admin approval workflow, seller tiers (individual vs company). KVKK requires identity verification anyway.                            |
| Category-Based Variable Commission            | Core business model (5-20% by category). Trendyol and Hepsiburada both do this                                               | MEDIUM     | Commission rates per category stored in Firestore, auto-calculated at checkout, visible in seller payout reports.                                                         |
| Advanced Search & Filtering                   | Users expect to filter by price, brand, category, rating, shipping speed, seller location                                    | HIGH       | Elasticsearch or Algolia integration required. Native Firestore queries cannot handle faceted search at scale. P0 for conversion rate.                                    |
| Real-Time Cargo Tracking                      | Hepsiburada's HepsiJet delivers 1.8 days urban average. Without live tracking, buyers assume package is lost                 | MEDIUM     | Multi-carrier API integration (PTT Kargo, MNG Kargo, DPD, UPS, Evri). Tracking number input by seller, status synced via webhook.                                         |
| Buyer Reviews & Ratings with Photo            | Verified purchase badge, photo upload, sorting. Fake reviews are the #1 trust destroyer                                      | MEDIUM     | Must implement "verified buyer" badge (only reviewed after delivery). Hepsiburada penalizes sellers for bad CS within 2 hours.                                            |
| Multi-Currency Support                        | European buyers expect EUR pricing. TR buyers expect TL. 2026 requirement for cross-border                                   | MEDIUM     | Display prices in EUR/TL/GBP. Conversion via real-time API (e.g., exchangerate.host). Payouts in seller's chosen currency.                                                |
| Multi-Language UI (TR/EN/DE/AR)               | Existing (React i18n). Must extend to seller dashboard, admin panel, and automated emails                                    | MEDIUM     | Already partially built. Need to cover: order emails, seller notifications, legal documents, KYC flows.                                                                   |
| KVKK/GDPR Compliance                          | KVKK (Turkey, 2024 cookie guide) + GDPR (EU, May 2018). Cookies, data access, right to deletion, cross-border transfer rules | HIGH       | Cookie consent banner (opt-in, no pre-ticked), data processing agreement for each seller, data center jurisdiction mapping, DPO appointment, 72-hour breach notification. |
| Seller Dashboard (Inventory, Orders, Revenue) | Sellers must self-manage stock, see orders, track earnings. No dashboard = no sellers                                        | MEDIUM     | Existing basic dashboard needs: real-time stock counts, order fulfillment actions, basic revenue numbers. Add payout history.                                             |
| Secure Authentication (Firebase Auth + MFA)   | Already using Firebase Auth. Must add: email verification, phone verification for high-value transactions, optional MFA      | LOW        | Extend existing Firebase Auth. MFA via Firebase Authentication (SMS/Google Authenticator).                                                                                |
| Returns & Cancellation Workflow               | 14-day right of withdrawal (EU consumer law). TR: same under TKHK (Tuketicinin Korunmasi Hk. Kanun)                          | MEDIUM     | Return request by buyer -> seller approval -> reverse logistics -> refund trigger. Must handle partial returns from multi-vendor carts.                                   |
| Order Confirmation & Transactional Emails     | Email confirmation, shipping notification, delivery confirmation, return received                                            | LOW        | Use SendGrid / AWS SES. Template-based, multi-language. Must include tracking link, return policy link.                                                                   |
| Static Pages (About, Terms, Returns, Privacy) | Legal requirement in both TR and EU. KVKK Article 10 + GDPR Articles 13-14 require privacy notice                            | LOW        | Already partially built. Must update for KVKK/GDPR specifics (DPO contact, data retention periods, cross-border transfer info).                                           |

### Differentiators (Competitive Advantage)

Features that set Mercora apart. Not required, but valuable for TR+Europe cross-border positioning.

| Feature                                         | Value Proposition                                                                                                             | Complexity | Notes                                                                                                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Shopping Assistant (Active Agent)            | Conversational agent that builds baskets, answers product questions, respects budget. No TR competitor has this working well  | HIGH       | Already has basic integration. Upgrade to Gemini 1.5 Pro with: product DB RAG, multi-turn conversation, basket manipulation, price comparison.                      |
| Seller Financial Dashboard with Payout Tracking | Trendyol/Hepsiburada payouts are opaque. Real-time payout tracking, settlement breakdown, tax reports = seller trust          | MEDIUM     | Pending payouts, completed payouts, commission breakdown by order, XLSX export for accounting. Automated payout on T+3 (like Hepsiburada) or configurable schedule. |
| Cross-Border Compliance Automation              | HS code auto-suggestion, customs document generation, duty calculation at checkout. EU-TR customs union means reduced tariffs | HIGH       | Integrate with customs API (e.g., Zonos, Easyship). Auto-suggest HS codes from product category. Show total landed cost at checkout.                                |
| Verified + Photo Reviews with Seller Q&A        | Amazon-style verified purchase badge + photo/video reviews. Seller Q&A section for pre-purchase questions                     | MEDIUM     | Existing review system. Add: verified badge logic, photo upload, helpful/not-helpful voting, seller reply to reviews.                                               |
| Multi-Carrier Real-Time Tracking with Map       | Not just status text — show package location on map, estimated delivery window, carrier comparison at checkout                | MEDIUM     | Integrate with AfterShip, Shippo, or ShipStation for unified tracking. Carrier selection by price/speed at checkout.                                                |
| Category-Specific Commission Automation         | Auto-calculation at checkout, visible to both buyer and seller. Tiered commissions (higher volume = lower rate)               | MEDIUM     | Firestore rules for commission by category + seller tier. Monthly commission reports. Seller can see exactly what they earned per order.                            |
| Bilingual Seller Backend                        | Sellers can manage listings and finances in Turkish OR English. Hepsiburada already offers this; Trendyol is TR-only          | MEDIUM     | Existing i18n infrastructure extended to seller dashboard. All seller-facing emails in seller's chosen language.                                                    |
| Smart Product Recommendations                   | Personalized recommendations based on browsing + purchase history. Not just "popular items"                                   | HIGH       | Requires user behavior tracking (GDPR consent required). Use Firebase Predictions or custom ML via Gemini API.                                                      |
| AI-Powered Product Listing Assistant            | Seller uploads photos, AI generates title, description, category suggestion, SEO keywords. Reduces listing friction           | MEDIUM     | Gemini Vision API for image-to-text. TR-language descriptions checked for "not Google Translate" (Hepsiburada rejects translated content with 99.1% accuracy).      |
| One-Click Reorder & Saved Carts                 | Buyers can reorder past purchases or save carts for later. Reduces friction for repeat customers                              | LOW        | LocalStorage + Firestore for cross-device cart persistence. "Buy again" button on order history.                                                                    |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for a solo-dev team targeting TR+Europe launch within 6 months.

| Feature                                 | Why Requested                              | Why Problematic                                                                                                                                                       | Alternative                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Built-In Chat/Messaging System          | "Amazon has buyer-seller messaging"        | Adds real-time infrastructure (WebSocket/Firebase Realtime DB), moderation overhead, SLA for response time. Hepsiburada already penalizes 2-hour response violations. | Use order-level contact forms + email relay. Buyer can message seller via order page; email is relayed. No live chat.                                         |
| B2B Wholesale Mode                      | "We could sell to businesses too"          | Completely different checkout flow (invoice, PO numbers, net terms, VAT handling, bulk pricing). Doubles scope.                                                       | Keep B2C as validated before expanding. Defer to v2 with dedicated phase. Current out-of-scope is correct.                                                    |
| Warehouse Management (FBA-Style)        | "Amazon FBA is how they win"               | Physical logistics is a separate business. Requires warehouse ops, inventory receiving, picking/packing staff. Cannot be software-only.                               | Let sellers self-fulfill. Partner with 3PLs for optional fulfillment. Never run your own warehouse. Out of scope correctly.                                   |
| Dynamic Pricing Engine                  | "We can maximize margins with AI"          | Requires demand forecasting, competitor scraping, price elasticity modeling. High risk of pricing errors angering buyers/sellers.                                     | Start with fixed + discount pricing. Manual seller-set prices. Add promotional campaigns (flash sales, coupons) before dynamic pricing.                       |
| Native iOS/Android Apps                 | "All marketplaces have apps"               | Solo dev maintaining React Native or native apps = massive maintenance burden. Push notifications, app store reviews, device fragmentation.                           | PWA-first strategy. Current site is responsive. Add service worker for offline support, push notifications via web. Native apps at Series A stage.            |
| Seller Ad Platform (Sponsored Listings) | "Trendyol makes money from ads"            | Real-time bidding system, ad auction engine, reporting dashboard, fraud detection. This is a product in itself.                                                       | Start with organic ranking only. Add "featured seller" badge as subscription upsell later. No auction-based ads in v1.                                        |
| Live Video Shopping                     | "Trendyol does live streams"               | Streaming infrastructure, moderation, scheduling, recording. Very low adoption in TR/DE markets vs Asia.                                                              | Product videos (recorded, not live) for now. Hepsiburada requires 30-second Turkish video per SKU — match this, not live streaming.                           |
| Multi-Vendor Cart (Single Payment)      | "Buy from 3 sellers, pay once"             | Requires complex payment splitting (Stripe Connect or custom), multi-vendor inventory reservation, partial refunds are a nightmare.                                   | Start with per-seller checkout. Each seller's items in cart are a separate transaction. Add unified cart when Stripe Connect Marketplace is fully integrated. |
| Full-Text Review Translation            | "Translate all reviews to user's language" | AI translation cost at scale, context loss in slang/reviews, legal liability for incorrect translations.                                                              | Translate review snippet on-demand (Gemini API). Show original + "Translate" button. Cache translations per language.                                         |
| Seller Subscription Tiers (Monthly Fee) | "Recurring revenue from sellers"           | Increases barrier to entry for sellers. Two-sided marketplace needs supply (sellers) first. Commission-only model is standard for growth phase.                       | Commission-only for first 12 months. Add subscription tiers (premium placement, analytics, dedicated support) once seller base is 500+.                       |

## Feature Dependencies

```
Secure Payment Gateway (Stripe + Iyzico)
    └──requires──> Express Backend Security Hardening
                       └──requires──> Webhook Infrastructure

Full Order Lifecycle
    └──requires──> Secure Payment Gateway (for payment confirmation trigger)
    └──requires──> Firestore Order State Machine
                       └──requires──> Webhook-based async transitions

KYC Seller Onboarding
    └──requires──> Firebase Storage (document upload)
    └──requires──> Admin Approval Workflow UI

Real-Time Cargo Tracking
    └──requires──> Order Lifecycle (Shipped state)
    └──requires──> Multi-Carrier API Integration

Advanced Search & Filtering
    └──enhances──> Product Listing Pages
    └──requires──> Elasticsearch or Algolia Index Sync with Firestore

Multi-Currency Support
    └──requires──> Exchange Rate API Integration
    └──enhances──> Multi-Language UI

KVKK/GDPR Compliance
    └──enhances──> EVERY feature (privacy by design)
    └──requires──> Cookie Consent Banner (before any tracking)
    └──requires──> Data Deletion Flow (before launch)

Multi-Vendor Cart (Single Payment) ──conflicts──> Per-Seller Checkout
    (Build per-seller first, migrate to unified later)

B2B Wholesale ──conflicts──> B2C marketplace focus
    (Different buyer flows, different checkout logic)
```

### Dependency Notes

- **Order Lifecycle requires Secure Payment:** An order cannot move to "Processing" without payment confirmation. Stripe Webhook triggers the state transition. This is the critical path.
- **Advanced Search requires indexing service:** Firestore cannot do faceted search (price range + brand + category + rating + shipping speed simultaneously). You MUST have Elasticsearch or Algolia. This is not optional.
- **KYC Onboarding requires admin panel:** The seller uploads documents, but someone must review and approve. Build the admin approval UI before launching seller self-service registration.
- **KVKK/GDPR is cross-cutting:** Every feature that touches user data (orders, reviews, search personalization, AI assistant) must handle data deletion requests. Implement deletion flow before any personalization features.
- **Multi-currency enhances multi-language but isn't blocked by it:** Display prices in TL/EUR/GBP independently of UI language. Currency selector + language selector are independent.
- **Multi-vendor cart conflicts with per-seller checkout:** Do NOT build both simultaneously. Launch with per-seller checkout (MVP), then add unified cart in Phase 2. The payment splitting complexity is significant.

## MVP Definition

### Launch With (P0 - Required for Go-Live)

Minimum viable marketplace — what's needed for buyers to trust and transact.

- [x] Product listings with images, categories, SEO metadata
- [x] Shopping cart and wishlist
- [x] User accounts (Firebase Auth, email + Google)
- [x] Multi-language UI (TR/EN/DE/AR)
- [x] Basic seller dashboard (inventory, orders view)
- [x] Basic admin panel (CMS, categories, user management)
- [ ] Secure payment gateway (Stripe production + Iyzico live) -- IN PROGRESS
- [ ] Full order lifecycle (Pending -> Processing -> Shipped -> Delivered) -- NOT STARTED
- [ ] KVKK/GDPR compliance (cookie consent, privacy policy, data deletion) -- NOT STARTED
- [ ] KYC seller onboarding (document upload, admin approval) -- NOT STARTED
- [ ] Category-based variable commission (auto-calculated at checkout) -- NOT STARTED
- [ ] Order confirmation + tracking number entry -- NOT STARTED

### Add After Validation (P1 - Operational Scale)

Features to add once core transaction flow is proven.

- [ ] Advanced search with faceted filtering (Elasticsearch)
- [ ] Real-time cargo tracking with multi-carrier API
- [ ] Buyer reviews with verified purchase badge + photo upload
- [ ] Multi-currency support (EUR/TL/GBP display + conversion)
- [ ] Seller financial dashboard (payout tracking, commission reports)
- [ ] Returns & cancellation workflow (14-day right of withdrawal)
- [ ] Transactional email automation (order confirmation, shipping, delivery)
- [ ] Seller REST API extension (order management, inventory sync)
- [ ] Cross-border compliance (HS code, customs docs, total landed cost)

### Future Consideration (P2 - Innovation)

Features to defer until marketplace has 500+ sellers and 50K+ monthly orders.

- [ ] AI shopping assistant (conversational, basket-building agent)
- [ ] Smart product recommendations (personalized, behavior-based)
- [ ] AI-powered product listing assistant (image-to-text, SEO suggestions)
- [ ] Multi-vendor cart (single payment for items from multiple sellers)
- [ ] B2B wholesale mode (separate buyer flow)
- [ ] Native mobile apps (iOS/Android) -- PWA-first strategy
- [ ] Seller ad platform (sponsored listings)
- [ ] Dynamic pricing engine
- [ ] Warehouse management fulfillment (3PL partnership)
- [ ] Seller subscription tiers (monthly fee for premium features)

## Feature Prioritization Matrix

| Feature                                  | User Value | Implementation Cost | Priority      |
| ---------------------------------------- | ---------- | ------------------- | ------------- |
| Secure Payment Gateway (Stripe + Iyzico) | HIGH       | HIGH                | P0            |
| Full Order Lifecycle                     | HIGH       | MEDIUM              | P0            |
| KYC Seller Onboarding                    | HIGH       | MEDIUM              | P0            |
| KVKK/GDPR Compliance                     | HIGH       | HIGH                | P0            |
| Category-Based Commission                | HIGH       | MEDIUM              | P0            |
| Order Confirmation Emails                | HIGH       | LOW                 | P0            |
| Advanced Search & Filtering              | HIGH       | HIGH                | P1            |
| Real-Time Cargo Tracking                 | HIGH       | MEDIUM              | P1            |
| Buyer Reviews (Verified + Photo)         | HIGH       | MEDIUM              | P1            |
| Multi-Currency Support                   | MEDIUM     | MEDIUM              | P1            |
| Seller Financial Dashboard               | MEDIUM     | MEDIUM              | P1            |
| Returns & Cancellation Workflow          | MEDIUM     | MEDIUM              | P1            |
| Cross-Border Compliance                  | MEDIUM     | HIGH                | P1            |
| Multi-Vendor Cart (Unified)              | MEDIUM     | HIGH                | P2            |
| AI Shopping Assistant                    | MEDIUM     | HIGH                | P2            |
| Smart Recommendations                    | MEDIUM     | HIGH                | P2            |
| Native Mobile Apps                       | MEDIUM     | VERY HIGH           | P2            |
| Seller Ad Platform                       | HIGH       | VERY HIGH           | P2 (Deferred) |
| B2B Wholesale Mode                       | MEDIUM     | VERY HIGH           | P2 (Deferred) |
| Warehouse Management (FBA)               | LOW        | EXTREME             | P2 (Deferred) |
| Dynamic Pricing                          | LOW        | VERY HIGH           | P2 (Deferred) |

**Priority key:**

- **P0:** Launch blocker. Cannot go to production without this.
- **P1:** Operational scale. Adds seller/buyer trust and retention.
- **P2:** Innovation & growth. Deferred to post-PMF.

## Competitor Feature Analysis

| Feature                 | Trendyol                     | Hepsiburada                      | Amazon Turkey               | Mercora Plan                                           |
| ----------------------- | ---------------------------- | -------------------------------- | --------------------------- | ------------------------------------------------------ |
| Commission Model        | 20-25% (cat-dependent)       | 8.5-14.5% + 2.4% fee             | 15-20% referral             | 5-20% variable (compete on lower rates)                |
| KYC Onboarding          | Business license + ID        | Business license + ID + TR video | Business license + tax info | Document upload + admin approval (simpler)             |
| Fulfillment             | Trendyol Logistics (owned)   | HepsiJet (owned)                 | Amazon FBA (owned)          | Seller self-fulfill + 3PL optional                     |
| Payment                 | Iyzico (3DS)                 | Iyzico (3DS)                     | Own processor (3DS)         | Stripe (EU) + Iyzico (TR) dual                         |
| Search                  | Elasticsearch-based          | Elasticsearch-based              | A9 algorithm                | Elasticsearch/Algolia (P1)                             |
| Returns                 | 14-day right, courier pickup | 14-day right, courier pickup     | 30-day, drop-off            | 14-day right, seller-managed (MVP)                     |
| Seller Payout           | T+7 days                     | T+3 days                         | T+14 days                   | T+3 to T+7 configurable (competitive advantage)        |
| AI Assistant            | Basic chatbot                | No public AI feature             | Rufus (Amazon's AI)         | Gemini-powered agent (P2 differentiator)               |
| Multi-currency          | TL only                      | TL only                          | TRY + USD for cross-border  | TL/EUR/GBP (differentiator for TR+Europe)              |
| Seller Analytics        | Basic dashboard              | Detailed analytics               | Amazon Seller Central       | Financial dashboard with payout focus (differentiator) |
| Cross-border compliance | Limited                      | Hepsiglobal (customs support)    | Global Selling (full)       | HS code + customs automation (P1)                      |
| Mobile experience       | Native apps                  | Native apps                      | Native apps                 | PWA-first (deferred native)                            |

## Sources

- Trendyol Seller Center: [marcabien.com Trendyol guide](https://marcabien.com/en/sell-on-trendyol-internationally)
- Hepsiburada seller data: Cross-reference of commission rates, Hepsiglobal onboarding requirements, HepsiJet logistics performance
- Amazon Seller Central comparison: Industry-standard marketplace feature set
- Multi-vendor marketplace platforms analysis: Yo!Kart, Sharetribe, CS-Cart, Dokan feature sets
- KVKK/GDPR compliance: [KVKK Cookie Guide](https://www.esenyelpartners.com/compliance-strategies-for-websites-under-current-kvkk-cookie-guide/), [business.gov.nl](https://business.gov.nl/regulations/long-distance-sales-and-purchases/), [Verisistem KVKK-GDPR](https://www.verisistem.com/en/services/european-union-eu-general-data-protection-regulation-gdpr-turkiye-consulting-compliance-services)
- Order management and fulfillment: Broadleaf, Base.com, ShipStation, Onport feature documentation

---

_Feature research for: Benim Olan (Mercora) e-commerce marketplace TR+Europe_
_Researched: 2026-06-02_
