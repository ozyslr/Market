# Current-State Report — 4 Focus Areas (pre-v1.1 scoping)

**Date:** 2026-06-05 · **Method:** inline codebase survey (Glob/Grep, key-file probes). Signals are directional; items marked ⚠ need a deeper read before committing scope.

Scope requested by founder: ① performance, ② seller features + easy product adding, ③ admin permissions & details, ④ user purchase ease.

---

## ① Performance — **Mostly in place; targeted tuning, not a rebuild**

**Have:**

- Route-level code-splitting: `App.tsx` uses a `lazy()`/`named()` helper across **52 routes** with `Suspense` + `PageLoader` fallback (buyer, seller, admin all lazy).
- `vite-plugin-pwa` (Workbox offline/SW), `rollup-plugin-visualizer` (gated behind `ANALYZE=true`), Lighthouse CI (`lighthouserc.json`).
- Firestore reads are mostly on-demand / `onSnapshot`; client-side filtering for search.

**Gaps / opportunities:**

- No explicit `manualChunks` vendor splitting in `vite.config.ts` ⚠ — large shared vendor bundle likely; verify with `ANALYZE=true npm run build`.
- Firestore search is client-side (catalog-scale ceiling — already known, Typesense → v2).
- No measured Core Web Vitals baseline in repo; Lighthouse CI exists but no recorded budget/targets ⚠.
- Image optimization/CDN strategy unconfirmed ⚠ (model-viewer/3D + many product images).

**Verdict:** B+. Architecture is sound; needs a measurement pass (Lighthouse budget, bundle analysis, image/CDN audit) rather than structural work.

---

## ② Seller features + easy product adding — **Strong; polish the add-flow**

**Have (15 seller pages):** Dashboard, Inventory, ImportCenter (CSV), Orders, Finance, Invoices, Analytics, Performance, Pricing, PriceAnalysis, Coupons, Certificates, Messages, ApiKeys, Settings, Store.

- **Product add is already AI-assisted:** `ProductForm.tsx` wires `generateProductDescription`, `generateMetaDescription`, `generateProductImage`, `suggestTags` (Gemini), plus **draft/publish** states and multi-image upload (~74 form controls).
- CSV bulk import/export (SSRF-safe), bulk edit bar, batch ship modal.

**Gaps / opportunities:**

- "Easy adding" is feature-rich but possibly **heavy** (74 controls) — a guided/stepped or "quick add" mode + better mobile ergonomics could lower friction ⚠ (needs UX review).
- No bulk image management / drag-reorder confirmation ⚠.
- Seller onboarding→first-product "time to first listing" not instrumented.

**Verdict:** A-. Core is comprehensive (often ahead of MVP). Work here is UX-streamlining + analytics, not net-new capability.

---

## ③ Admin permissions & details — **Feature-rich; access-control rigor is the question**

**Have (26 admin pages):** Dashboard, Analytics, Reports, Finance, Payments, Orders, Products, Sellers, SellerView, Users, Reviews, Returns, Coupons, Deals, Campaigns, Categories, CMS, Languages, Tiers, Integrations, Webhooks, Settings, Support, Chat, **AuditLog**, DataDeletion.

**Gaps / opportunities (most important area):**

- ⚠ **No route-level admin guard visible in `App.tsx`** — admin `<Route>`s render the page directly (e.g. `/admin` → `<AdminDashboard/>`); no `ProtectedRoute`/`requireRole` wrapper found. Access control likely relies on per-page checks and server `verifyAdmin` on APIs. **This is the #1 thing to verify** — a missing client route guard is a UX/defense-in-depth gap even if APIs are server-guarded.
- No granular admin roles (super-admin vs support vs finance) found ⚠ — single `role === 'admin'` likely. Multi-role admin RBAC is a candidate feature.
- AuditLog page exists — confirm it captures all sensitive admin actions ⚠.

**Verdict:** B. Breadth is excellent; **depth of access control (route guards + granular roles + audit coverage) needs verification and likely hardening.**

---

## ④ User purchase ease — **Solid multi-step checkout; reduce friction**

**Have:** `Checkout.tsx` 3-step flow, Stripe + Iyzico, **saved cards / one-click** (`oneClickCheckoutService`, `useOneClickCheckout`), Cart, OrderHistory, OrderTracking, product comparison, recommendations, recently-viewed, wishlist. Anonymous-auth guests exist (events). No hard login-gate found in Checkout ⚠ (guest-friendly — verify a true guest can complete purchase).

**Gaps / opportunities:**

- Confirm **guest checkout** actually completes end-to-end (anonymous → order) ⚠.
- Address book / saved addresses, express wallets (Apple/Google Pay) — unconfirmed ⚠.
- Purchase funnel not instrumented (cart→checkout→paid conversion) ⚠.
- This overlaps directly with the **v1.0 live-UAT debt** (3DS, order flow) — purchase ease can't be certified until that UAT is signed off.

**Verdict:** B+. Capable checkout; needs friction/conversion audit + the carried payment UAT.

---

## Cross-cutting reality

- Codebase is **well past a thin MVP** — most "features" exist. The highest-leverage v-next work is **hardening + measurement + UX polish**, not greenfield build.
- **Carried v1.0 tech debt** (live UAT: payments/3DS, shipping, reviews/Q&A; deeper E2E) is the gating item for "production-ready" and overlaps area ④.

## Recommended milestone shape (for discussion)

A **"Stabilize & Sharpen" (v1.1)** milestone over a big feature push:

1. **Performance pass** — bundle analysis + manualChunks, Lighthouse budget, image/CDN audit.
2. **Admin access-control hardening** — route guards + granular admin roles + audit coverage (highest-risk gap).
3. **Seller add-flow UX** — quick-add / guided mode, mobile ergonomics, time-to-first-listing instrumentation.
4. **Purchase-funnel + guest checkout** — verify guest E2E, add conversion instrumentation, close the v1.0 payment UAT.

Big features (multi-currency, Typesense, cross-border) stay **v2.0** — they're expansion, not the "is what we have solid and easy?" question being asked now.
