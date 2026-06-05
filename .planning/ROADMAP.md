# Roadmap: Benim Olan (Mercora) — Global Artisan Marketplace

## Shipped Milestones

- ✅ **v1.0 — Marketplace Core** (shipped 2026-06-05): Foundation/compliance, dual-provider payments, seller KYC onboarding, Firestore search, shipping & returns, reviews & trust. 44/50 v1 requirements complete (5 awaiting live UAT), 6 deferred to v2. → [Archive](./milestones/v1.0-ROADMAP.md) · [Audit](./v1.0-MILESTONE-AUDIT.md)

## Current Milestone — v1.1: Stabilize & Sharpen

**Goal:** Harden the v1.0 marketplace for production — access control, performance, seller add-flow UX, and a certified purchase funnel. No new big features (those are v2). Informed by `.planning/research/vNext-current-state-report.md`.

**Granularity:** 4 phases (8–11). Phase numbering continues from v1.0; v2 features will be numbered when v2 is planned.

- [x] **Phase 8: Admin Access Control** — route-level admin guard, granular admin roles, audit-log coverage, server authz parity (ADM-01..04) (completed 2026-06-05)
- [x] **Phase 9: Performance** — vendor manualChunks + bundle budget, Lighthouse CI thresholds, image/CDN optimization, Firestore hot-path review (PERF-01..04) (completed 2026-06-05)
- [x] **Phase 10: Seller Add-Flow UX** — quick-add/guided mode, mobile form, bulk image upload + reorder, time-to-first-listing instrumentation (SLR-01..04) ✅ (completed 2026-06-05)
- [x] **Phase 11: Purchase Funnel & Guest Checkout** — guest checkout E2E, address book/autofill, express wallets (Apple/Google Pay), funnel analytics, v1.0 payment UAT closure (BUY-01..05) 📋 (planned 2026-06-05, 5 plans ready) (completed 2026-06-05)

### Phase Details

#### Phase 8: Admin Access Control

**Goal:** Admin surfaces are protected at the route and API layers with role granularity and full audit coverage.
**Depends on:** v1.0 (existing admin pages + custom-claims roles).
**Requirements:** ADM-01, ADM-02, ADM-03, ADM-04
**Success Criteria:**

1. Non-admin users cannot reach any `/admin/*` route (client guard redirects/403); verified for buyer, seller, anonymous.
2. Admin roles are granular (super-admin / support / finance) and each admin section enforces the right sub-role.
3. Every sensitive admin action (KYC approve/reject, refund, role change, CMS edit, payout) writes an audit-log entry with actor + timestamp.
4. Every admin API endpoint enforces role server-side (defense-in-depth), independent of the client guard.

#### Phase 9: Performance

**Goal:** Measured, budgeted performance with vendor splitting and optimized media.
**Depends on:** v1.0 build pipeline (Vite/PWA/Lighthouse CI already present).
**Requirements:** PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria:**

1. `manualChunks` vendor splitting in place; a bundle budget is defined and the analyze report is produced in CI.
2. Lighthouse CI enforces LCP/CLS/TBT thresholds on key pages (home, product detail, checkout) and fails the build on regression.
3. Product media uses optimized/responsive images via a CDN strategy.
4. Hot-path Firestore queries (product lists, search, orders) are reviewed for indexes and read efficiency.

#### Phase 10: Seller Add-Flow UX

**Goal:** Lower friction for sellers adding products, especially on mobile.
**Depends on:** v1.0 ProductForm (AI-assisted) + inventory.
**Requirements:** SLR-01, SLR-02, SLR-03, SLR-04
**Success Criteria:**

1. A quick-add / guided mode lets a seller publish a basic listing with a reduced required-field fast path.
2. The product form is ergonomic on mobile (layout, inputs, image upload).
3. Bulk image upload with drag-reorder works in the product form.
4. Time-to-first-listing is instrumented across the seller onboarding funnel.

#### Phase 11: Purchase Funnel & Guest Checkout

**Goal:** A certified, low-friction purchase path including guests, plus closing v1.0 payment UAT.
**Depends on:** v1.0 checkout (Stripe/Iyzico, saved cards, anonymous auth).
**Requirements:** BUY-01, BUY-02, BUY-03, BUY-04, BUY-05
**Plans:** 5/5 plans complete

Plans:

- [x] 11-01-PLAN.md — Guest checkout E2E (localStorage cart, cart merge, guest email, account upgrade)
- [x] 11-02-PLAN.md — Address book & autofill (type enum, autocomplete attributes, saved address cards)
- [x] 11-03-PLAN.md — Express wallets (Apple Pay / Google Pay via PaymentRequestButtonElement)
- [x] 11-04-PLAN.md — Purchase funnel analytics (Firestore event tracking + admin dashboard card)
- [x] 11-05-PLAN.md — v1.0 UAT closure (checklist + Playwright E2E tests)

**Success Criteria:**

1. A guest (anonymous) can complete checkout end-to-end to a paid order — verified.
2. Buyers have a saved address book / autofill at checkout.
3. Express wallets (Apple Pay / Google Pay) work via Stripe Payment Request.
4. The purchase funnel (cart → checkout → paid) is instrumented with conversion analytics.
5. v1.0 carried live UAT (payments/3DS, order lifecycle, shipping, reviews/Q&A) is executed and signed off.

## Deferred to v2

- **Multi-Currency** (Phase 6 / CUR-01..04) — EUR display, FX rate-locking, TRY/EUR toggle; Trendyol-style per-country currency + localized routing.
- **Typesense search** (SRC-01 typo-tolerant full-text, SRC-05 event-driven index) — v1 ships Firestore search.
- **Cross-Border Compliance** (Phase 8 / CROSS-01..04) — HS codes, customs docs, total landed cost, EU GPSR.

## Carried tech debt (from v1.0 audit)

- Live UAT sign-off: payments/3DS, shipping flows, reviews photo UX + Q&A (see `.planning/v1.0-MILESTONE-AUDIT.md`).
- Deeper cross-phase E2E pass before production sign-off.
