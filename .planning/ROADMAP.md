# Roadmap: Benim Olan (Mercora) — Global Artisan Marketplace

## Milestones

- ✅ **v1.0 — Marketplace Core** — Phases 1–7 (shipped 2026-06-05) → [Archive](./milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 — Stabilize & Sharpen** — Phases 8–11 (shipped 2026-06-05) → [Archive](./milestones/v1.1-ROADMAP.md)
- 🚧 **v2.0 — Trust & Scale** — Phases 12–17 (in progress)

## Phases

<details>
<summary>✅ v1.0 Marketplace Core (Phases 1–7) — SHIPPED 2026-06-05</summary>

- [x] Phase 1: Foundation & Compliance
- [x] Phase 2: Payment & Order Lifecycle
- [x] Phase 3: Seller Onboarding & KYC
- [x] Phase 4: Search & Discovery (Firestore-only)
- [x] Phase 5: Shipping & Fulfillment
- [x] Phase 6: Multi-Currency (deferred to v2)
- [x] Phase 7: Reviews & Trust

</details>

<details>
<summary>✅ v1.1 Stabilize & Sharpen (Phases 8–11) — SHIPPED 2026-06-05</summary>

- [x] Phase 8: Admin Access Control (3/3 plans)
- [x] Phase 9: Performance (4/4 plans)
- [x] Phase 10: Seller Add-Flow UX (4/4 plans)
- [x] Phase 11: Purchase Funnel & Guest Checkout (5/5 plans)

</details>

### 🚧 v2.0 Trust & Scale (Phases 12–17)

#### Phase 12: Search & Storage Fix

**Goal:** Firebase Storage seller upload fix + Typesense full-text search with real-time Firestore sync.
**Depends on:** v1.1 (existing Firestore product collection).
**Requirements:** BUG-01, BUG-02, SRC-01, SRC-02, SRC-03, SRC-04, SRC-05

**Success Criteria:**

1. Seller successfully uploads product images without Storage permission errors; error messages are user-readable.
2. Typo-tolerant search returns relevant results under 100ms for TR/EN/DE/AR queries.
3. Faceted filtering works for category, price range, brand, and rating.
4. Firestore product changes sync to Typesense within 5 seconds.
5. Admin dashboard shows search analytics: top queries, no-results queries, click-through rate.

#### Phase 13: Multi-Currency

**Goal:** EUR/TRY dual-currency support with daily FX rates, display toggle, and rate-locked checkout.
**Depends on:** Phase 12 (Typesense for EUR product search).
**Requirements:** CUR-01, CUR-02, CUR-03, CUR-04, CUR-05, CUR-06

**Success Criteria:**

1. User can toggle between EUR and TRY; default currency detected from browser/geo.
2. Daily ECB exchange rates cached in Firestore; EUR prices computed from TRY base.
3. FX rate locked for 15 minutes at checkout; customer sees guaranteed price.
4. EUR payments use Stripe presentment_currency with auto-settlement.
5. URL routing reflects currency: /tr → TRY, /en → EUR.

#### Phase 14: Cross-Border Compliance

**Goal:** HS code system, customs invoice generation, GPSR compliance, and auto VAT calculation for EU orders.
**Depends on:** Phase 13 (multi-currency for EUR pricing).
**Requirements:** CROSS-01, CROSS-02, CROSS-03, CROSS-04, CROSS-05

**Success Criteria:**

1. Every product category has an HS code; seller can override in product form.
2. Products ineligible for destination country are blocked at checkout with clear messaging.
3. Stripe Tax auto-calculates VAT based on buyer country.
4. International orders generate a proforma/commercial invoice PDF.
5. GPSR fields (authorized rep, safety doc) are added to product form; EU buyers see compliance info.

#### Phase 15: Seller Trust & Fraud Prevention

**Goal:** Phone verification, tax ID validation, product approval queue, complaint system, and fake listing detection.
**Depends on:** Phase 14 (cross-border compliance for EU seller verification).
**Requirements:** FRD-01, FRD-02, FRD-03, FRD-04, FRD-05, FRD-06

**Success Criteria:**

1. Seller completes SMS OTP verification during KYC onboarding; VOIP numbers blocked.
2. Tax ID validated (VIES for EU, format regex for TR); invalid flagged for admin review.
3. New listings from untrusted sellers enter approval queue; admin can approve/reject with reason.
4. Buyer can file complaint; admin reviews and resolves; seller can appeal.
5. Seller trust score computed and displayed on store page (based on order completion, reviews, age).
6. Fake listing detection flags: new seller + high discount + stock image = manual review required.

#### Phase 16: Automations

**Goal:** Auto invoice PDFs, transactional emails, e-fatura integration, and abandoned cart recovery.
**Depends on:** Phase 15 (stable order flow + seller verification).
**Requirements:** AUT-01, AUT-02, AUT-03, AUT-04, AUT-05

**Success Criteria:**

1. Invoice PDF auto-generated on order completion; downloadable by buyer and seller.
2. Order confirmation, shipping status, and seller approval emails sent automatically.
3. E-fatura integration via Paraşüt/Logo API for TR business sellers.
4. Abandoned cart recovery: 3-email series at 1h, 24h, 72h after abandonment.

#### Phase 17: UAT Closure

**Goal:** Execute v1.0 live UAT checklist, run E2E tests, and verify guest checkout with real payment cards.
**Depends on:** Phase 16 (all systems stable for final verification).
**Requirements:** UAT-01, UAT-02, UAT-03

**Success Criteria:**

1. All items in BUY-05 UAT checklist signed off (payments/3DS, order lifecycle, shipping, reviews/Q&A).
2. All 3 Playwright E2E checkout specs pass against staging environment.
3. Guest-to-paid-order flow verified with real Stripe test cards in production-like environment.

## Progress

| Phase                          | Milestone | Plans Complete | Status      | Completed  |
| ------------------------------ | --------- | -------------- | ----------- | ---------- |
| 1. Foundation & Compliance     | v1.0      | —              | Complete    | 2026-06-05 |
| 2. Payment & Order Lifecycle   | v1.0      | —              | Complete    | 2026-06-05 |
| 3. Seller Onboarding & KYC     | v1.0      | —              | Complete    | 2026-06-05 |
| 4. Search & Discovery          | v1.0      | —              | Complete    | 2026-06-05 |
| 5. Shipping & Fulfillment      | v1.0      | —              | Complete    | 2026-06-05 |
| 7. Reviews & Trust             | v1.0      | —              | Complete    | 2026-06-05 |
| 8. Admin Access Control        | v1.1      | 3/3            | Complete    | 2026-06-05 |
| 9. Performance                 | v1.1      | 4/4            | Complete    | 2026-06-05 |
| 10. Seller Add-Flow UX         | v1.1      | 4/4            | Complete    | 2026-06-05 |
| 11. Purchase Funnel & Guest    | v1.1      | 5/5            | Complete    | 2026-06-05 |
| 12. Search & Storage Fix       | v2.0      | 0/1            | Not started | —          |
| 13. Multi-Currency             | v2.0      | 0/1            | Not started | —          |
| 14. Cross-Border Compliance    | v2.0      | 0/1            | Not started | —          |
| 15. Seller Trust & Fraud Prev. | v2.0      | 0/1            | Not started | —          |
| 16. Automations                | v2.0      | 0/1            | Not started | —          |
| 17. UAT Closure                | v2.0      | 0/1            | Not started | —          |
