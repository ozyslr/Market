# Roadmap: Benim Olan (Mercora) — Global Artisan Marketplace

## Milestones

- ✅ **v1.0 — Marketplace Core** — Phases 1–7 (shipped 2026-06-05) → [Archive](./milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 — Stabilize & Sharpen** — Phases 8–11 (shipped 2026-06-05) → [Archive](./milestones/v1.1-ROADMAP.md)
- ✅ **v2.0 — Trust & Scale** — Phases 12–17 (shipped 2026-06-07) → [Archive](./milestones/v2.0-ROADMAP.md)
- 🚧 **v3.0 — Go Live & Scale** — Phases 18–21 (in progress)

## Phases

<details>
<summary>✅ v1.0 Marketplace Core (Phases 1–7) — SHIPPED 2026-06-05</summary>
- [x] Phase 1: Foundation & Compliance
- [x] Phase 2: Payment & Order Lifecycle
- [x] Phase 3: Seller Onboarding & KYC
- [x] Phase 4: Search & Discovery (Firestore-only)
- [x] Phase 5: Shipping & Fulfillment
- [x] Phase 7: Reviews & Trust
</details>

<details>
<summary>✅ v1.1 Stabilize & Sharpen (Phases 8–11) — SHIPPED 2026-06-05</summary>
- [x] Phase 8: Admin Access Control (3/3 plans)
- [x] Phase 9: Performance (4/4 plans)
- [x] Phase 10: Seller Add-Flow UX (4/4 plans)
- [x] Phase 11: Purchase Funnel & Guest Checkout (5/5 plans)
</details>

<details>
<summary>✅ v2.0 Trust & Scale (Phases 12–17) — SHIPPED 2026-06-07</summary>
- [x] Phase 12: Search & Storage Fix (4/4 plans)
- [x] Phase 13: Multi-Currency (2/2 plans)
- [x] Phase 14: Cross-Border Compliance (2/2 plans)
- [x] Phase 15: Seller Trust & Fraud Prevention (3/3 plans)
- [x] Phase 16: Automations (1/1 plan)
- [x] Phase 17: UAT Closure (1/1 plan)
</details>

### 🚧 v3.0 Go Live & Scale (Phases 18–21)

#### Phase 18: Live UAT & Go Live

**Goal:** Close all remaining UAT debt, provision infrastructure, and prepare for production launch.
**Depends on:** v2.0 (Phase 12 Typesense, Phase 16 e-fatura stub).
**Requirements:** UAT-01, UAT-02, UAT-03, UAT-04, UAT-05

**Success Criteria:**

1. BUY-05 UAT checklist fully signed off (payments/3DS, shipping, reviews/Q&A).
2. Typesense Cloud/server provisioned and connected to production Firestore.
3. E-fatura API (Paraşüt/Logo) configured with valid API keys.
4. Stripe production keys configured and test charge verified.
5. All 3 Playwright E2E checkout specs pass against staging.

#### Phase 19: ML Fraud Detection

**Goal:** Upgrade rule-based fraud detection to include ML-based anomaly detection and behavioral analysis.
**Depends on:** Phase 15 (rule-based fraud detection in place).
**Requirements:** MLF-01, MLF-02, MLF-03, MLF-04

**Success Criteria:**

1. ML anomaly detection model identifies unusual pricing/discount/stock patterns.
2. Seller behavioral analysis flags suspicious account activity.
3. Fraud event dataset created from Firestore for model training.
4. Admin dashboard shows ML fraud alerts alongside rule-based flags.

#### Phase 20: Native Mobile App

**Goal:** Launch React Native iOS/Android app with core marketplace flows.
**Depends on:** Phase 18 (production infrastructure ready).
**Requirements:** MOB-01, MOB-02, MOB-03, MOB-04, MOB-05

**Success Criteria:**

1. React Native app authenticates via Firebase Auth (Google + email).
2. Home page, product listing, product detail work on mobile.
3. Cart + checkout with Stripe/Iyzico works on mobile.
4. Seller dashboard accessible on mobile (orders, inventory).
5. Push notifications via Firebase Cloud Messaging.

#### Phase 21: B2B Wholesale

**Goal:** Enable B2B wholesale with company accounts, custom catalogs, quote system, and net payment terms.
**Depends on:** Phase 18 (production readiness).
**Requirements:** B2B-01, B2B-02, B2B-03, B2B-04, B2B-05

**Success Criteria:**

1. Company registration with tax ID and trade registry number.
2. Sellers can set minimum order quantities and wholesale prices per product.
3. Buyers can request quotes; sellers can respond with pricing.
4. Net payment terms (30/60/90 day) available for approved B2B accounts.
5. B2B order approval workflow: buyer submits → seller approves → invoice generated.

## Deferred to v4

- WMS / warehouse management
- Dynamic pricing engine
- Real-time messaging/chat

## Progress

| Phase                  | Milestone      | Plans Complete | Status      |
| ---------------------- | -------------- | -------------- | ----------- |
| 1–17                   | v1.0/v1.1/v2.0 | All            | Complete    |
| 18. Live UAT & Go Live | v3.0           | 0/1            | Not started |
| 19. ML Fraud Detection | v3.0           | 0/1            | Not started |
| 20. Native Mobile App  | v3.0           | 0/1            | Not started |
| 21. B2B Wholesale      | v3.0           | 0/1            | Not started |
