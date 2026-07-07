# Codebase Concerns

**Analysis Date:** 2026-06-08

---

## Tech Debt

### Mock Data Leaked into Production Code Paths

**Issue:** `MOCK_PRODUCTS` (2,832-line fixture), `MOCK_SELLERS`, `MOCK_CATEGORIES`, and `MOCK_USER` are imported directly in production pages and services. These are not just for tests — they are imported and rendered on live pages.

**Files:**

- `src/pages/Home.tsx` — initialises `products` state with `MOCK_PRODUCTS`, renders `MOCK_PRODUCTS.slice(0, 20)` as "Senin İçin Seçtiklerimiz"
- `src/pages/Cart.tsx` — resolves cart items via `MOCK_PRODUCTS.find()`; "Suggested" row uses `MOCK_PRODUCTS.slice(4, 6)`
- `src/pages/Checkout.tsx` — builds checkout product list from `MOCK_PRODUCTS.find()`
- `src/pages/ProductDetail.tsx` — related products, "bought together", and seller products all sourced from `MOCK_PRODUCTS`
- `src/pages/SearchResults.tsx` — falls back to `MOCK_PRODUCTS` during search
- `src/pages/AdminSellers.tsx` (line 84) — falls back to `MOCK_SELLERS` when Firestore returns empty
- `src/pages/AdminCMS.tsx` — category items from `MOCK_CATEGORIES`
- `src/services/botService.ts`, `src/services/campaignService.ts`, `src/services/moderationService.ts`, `src/services/searchService.ts` — use `MOCK_PRODUCTS` as data source
- `src/components/layout/SearchBar.tsx` — autocomplete shows `MOCK_PRODUCTS.slice(0, 4)` when no real results
- `src/hooks/useExchangeRate.ts` — falls back to hardcoded rates (`USD/TRY: 32.12` etc.) if `VITE_EXCHANGE_RATE_API_KEY` absent

**Impact:** Users see fake/sample products in live flows. Admin seller list may show mock sellers. Cart and checkout pricing may reference non-Firestore prices. Any order placed from a mock product will have incorrect data.

**Fix approach:** Replace all `MOCK_PRODUCTS` fallbacks in pages/services with real Firestore queries. Move `MOCK_PRODUCTS` import to test files only. Add a build-time lint rule (`no-restricted-imports`) to block mock imports outside `src/data/` and test files.

---

### Unbound Firestore Full-Collection Scans

**Issue:** Several queries fetch entire collections without pagination or `limit()`, which will become prohibitively expensive as data grows.

**Files:**

- `src/pages/AdminDashboard.tsx` (lines 341–344) — `getDocs(collection(db, 'users'))`, `getDocs(collection(db, 'products'))`, `getDocs(collection(db, 'orders'))` — three unbounded scans on every admin dashboard load
- `src/services/userService.ts` (line 22) — `getDocs(collection(db, 'users'))` — used by admin user list
- `src/services/recommendationService.ts` (line 211) — full products scan as fallback when composite index is missing

**Impact:** At 10k+ users/products/orders the admin dashboard will hit Firestore read quotas and slow to seconds. Firestore billing scales linearly per document read.

**Fix approach:** Add `limit()` + cursor-based pagination to admin list queries. Replace AdminDashboard counts with aggregation queries (`count()` — available in Firestore SDK v9.13+). Fix the composite index in `firestore.indexes.json` to remove the products fallback scan.

---

### Typesense Sync Secret Has Hardcoded Fallback

**Issue:** `src/services/productService.ts` (lines 659, 689) uses `import.meta.env.VITE_TYPESENSE_SYNC_SECRET || 'dev-secret'`. The string `'dev-secret'` is bundled into the production JavaScript.

**Files:** `src/services/productService.ts` (lines 659, 689)

**Impact:** If `VITE_TYPESENSE_SYNC_SECRET` is unset in production, the sync endpoint becomes accessible with the publicly-known string `dev-secret`. This allows anyone who reads the bundle to trigger Typesense product reindexing.

**Fix approach:** Remove the fallback string. Fail fast with a runtime error if the env var is absent in production. Add `VITE_TYPESENSE_SYNC_SECRET` to the deployment secrets checklist.

---

### `Date.now()` / `Math.random()` Used as Persistent IDs

**Issue:** Multiple services generate IDs using `Date.now()` and `Math.random()`. These are not collision-resistant, not URL-safe, and not portable.

**Files:**

- `src/services/adService.ts` — `ad-${Date.now()}-${Math.random()...}`
- `src/services/commissionService.ts` — `ctx-${Date.now()}-${Math.random()...}`
- `src/services/botService.ts` — `product-${Date.now()}-${botId}`
- `src/pages/AdminCMS.tsx`, `src/pages/AdminDeals.tsx`, `src/pages/SellerMenuEditor.tsx`, `src/pages/Checkout.tsx` (line 883: `orderId={"pending_"+Date.now()}`)
- `src/lib/storage.ts` — `${folder}/${Date.now()}-${Math.random()...}` for storage paths

**Impact:** Two concurrent writes within the same millisecond will produce a duplicate ID. The `pending_${Date.now()}` order ID passed to the Iyzico payment component means Iyzico is tracking orders with ephemeral timestamps, not real order IDs — reconciliation will fail.

**Fix approach:** Use `crypto.randomUUID()` (available in all modern browsers and Node 18+). Replace `pending_${Date.now()}` in Checkout with the real Firestore order ID, available after order creation.

---

### ✅ FIXED (2026-07-08): Twilio Credentials Exposed to Client Bundle

**Resolution:** `server/routes/verification.ts` handles all Twilio operations server-side. Client calls `/api/verification/send-otp` and `/api/verification/verify-otp` — never touches Twilio directly. `VITE_TWILIO_*` env vars removed from client. OTP rate limiter added (5 req/hour/IP).

---

### `subOrders` Firestore Rules Block Sellers from Reading Own Orders

**Issue:** `firestore.rules` (line 72–77) restricts `subOrders` reads to `isAdmin()` only. Sellers cannot read their own sub-orders directly from Firestore.

**Files:** `firestore.rules` (lines 72–77), `src/pages/SellerOrders.tsx`

**Impact:** `SellerOrders.tsx` works around this by using a Realtime subscription helper (`subscribeOrdersBySeller`) that must go through the server, not direct Firestore. If the server is down, sellers see no orders. The rules create an inconsistency — sellers can ship orders but cannot query them client-side.

**Fix approach:** Add a seller-scoped read rule: `allow read: if isSeller() && resource.data.sellerId == request.auth.token.sellerId;`. Verify this against existing server-side security model before deploying.

---

### 172 `any` Type Usages Undermine TypeScript Strictness

**Issue:** 172 occurrences of `: any`, `as any`, or `<any>` detected across `src/`. Notable patterns include `Sentry.ErrorBoundary as any` in `src/App.tsx` and the Stripe API version cast `'2025-03-31.basil' as any` in `server.ts`.

**Files:** Spread across `src/` — highest concentration in service files and page components.

**Impact:** Bypasses type checking in the exact areas (payments, auth, Firestore reads) where runtime type errors are most harmful. IDE autocompletion and refactoring break down on `any`-typed values.

**Fix approach:** Address incrementally. Priority targets: payment-related `any` casts in `server/routes/stripe.ts` and `src/pages/Checkout.tsx`. The Stripe API version cast should use a typed constant from the Stripe SDK.

---

## Known Bugs

### ✅ FIXED (2026-07-08): Mock Payment Fallback Leaks into Production Orders

**Resolution:** `isMock` state and `mock_pi_*` fallback removed from both `StripePaymentForm.tsx` and `Checkout.tsx`. If Stripe SDK fails to load, the form now shows an error message with a back button instead of simulating a successful payment. Server-side mock fallback in `create-payment-intent` was already removed in phase-30.

---

### `useExchangeRate` Returns Stale Hardcoded Rates Silently

**Symptoms:** If `VITE_EXCHANGE_RATE_API_KEY` is missing or set to `"YOUR_EXCHANGE_RATE_API_KEY"`, the hook silently returns hardcoded rates (`USD/TRY: 32.12`, `EUR/TRY: 34.55`) from 2024 without any visual indicator to the user.

**Files:** `src/hooks/useExchangeRate.ts` (lines 3–17)

**Trigger:** `VITE_EXCHANGE_RATE_API_KEY` env var not configured.

**Workaround:** Set the API key. Until then, prices shown in foreign currency are incorrect.

---

### Duplicate SearchBar Components — Only Layout Version Is Used

**Symptoms:** Two separate `SearchBar` components exist: `src/components/layout/SearchBar.tsx` (used by Navbar) and `src/components/search/SearchBar.tsx` (imports Typesense directly, never imported by anything in the main app). This means the Typesense-powered search UI is dead code.

**Files:** `src/components/search/SearchBar.tsx`, `src/components/layout/SearchBar.tsx`, `src/components/layout/Navbar.tsx` (line 66)

**Trigger:** All routes use the layout `SearchBar` via `Navbar`.

**Workaround:** None needed at runtime, but `src/components/search/SearchBar.tsx` is maintenance burden if both are evolved separately.

---

## Security Considerations

### `dangerouslySetInnerHTML` with Unescaped External Data (XSS Risk)

**Risk:** Typesense search result highlights rendered without sanitization.

**Files:** `src/components/search/SearchBar.tsx` (line 136) — `dangerouslySetInnerHTML={{ __html: hit.highlights?.[0]?.snippet || doc.title }}`

**Current mitigation:** The Typesense snippet is controlled by the search backend. If Typesense is misconfigured or compromised, arbitrary HTML executes in user browsers.

**Recommendations:** Sanitize the snippet with `DOMPurify` before rendering. The `src/pages/AdminDashboard.tsx` (line 1523) and `src/pages/SellerDashboard.tsx` (line 818) uses of `dangerouslySetInnerHTML` contain only inline CSS strings and are lower risk, but should be converted to Tailwind classes.

---

### File Upload Has No Server-Side MIME or Size Validation

**Risk:** `src/lib/storage.ts` uploads files directly to Firebase Storage without MIME type or size checks. Client-side checks exist in some forms (`SellerStore.tsx`, `ReviewForm.tsx`) but are absent in the core `uploadImage()` utility.

**Files:** `src/lib/storage.ts` (lines 4–9), `src/components/seller/ProductForm.tsx` (line 262)

**Current mitigation:** Firebase Storage security rules (not reviewed in this audit) may provide a secondary gate.

**Recommendations:** Add MIME and size validation inside `uploadImage()`. Add Firebase Storage rules that restrict allowed content types. Validate file types server-side for the CSV import route (`server/routes/csvImport.ts`).

---

### Rate Limiting Not Applied to OTP / Verification Endpoints

**Risk:** `/api/verification/send-otp` and `/api/verification/verify-otp` are referenced from `src/services/sellerVerificationService.ts` but no rate limiter is applied to those paths in `server.ts`. The existing `generalLimiter` (200 req/15 min) is too permissive for OTP endpoints.

**Files:** `server.ts` (rate limit configuration), `src/services/sellerVerificationService.ts`

**Current mitigation:** Twilio Verify has its own anti-abuse controls, but reliance on a third-party limit is not sufficient.

**Recommendations:** Add a dedicated `otpLimiter` (e.g., 5 req/hour per IP) on `/api/verification/*` routes.

---

### `dev-secret` Hardcoded Default for Typesense Sync Authentication

See Tech Debt section above. Restated here because the impact is a security boundary bypass, not just code quality.

**Files:** `src/services/productService.ts` (lines 659, 689)

---

## Performance Bottlenecks

### AdminDashboard Fetches Entire Users, Products, and Orders Collections

**Problem:** Three unbounded `getDocs()` calls fire in parallel on every `AdminDashboard` mount. At scale (10k users, 50k products, 100k orders) this reads ~160k documents per page load.

**Files:** `src/pages/AdminDashboard.tsx` (lines 341–344)

**Cause:** No aggregation queries or server-side pagination in place for admin stats.

**Improvement path:** Use Firestore `count()` aggregation (SDK v9.13+) for totals. Move revenue/GMV calculations to a scheduled Cloud Function that writes a `stats/summary` document. Paginate product/user lists.

---

### `recommendationService` Full Products Fallback Scan

**Problem:** When a composite Firestore index is missing, `src/services/recommendationService.ts` (line 211) fetches the entire `products` collection to sort in memory. This is triggered on the Home page.

**Files:** `src/services/recommendationService.ts` (lines 205–217)

**Cause:** Missing `firestore.indexes.json` entries for the composite query (category + isActive + rating).

**Improvement path:** Add the required index to `firestore.indexes.json` and deploy. Remove the catch-block full-scan fallback after confirming index is live.

---

### Large Page Components (1,000+ Lines)

**Problem:** Several page components are monolithic, making them slow to parse and difficult to split for code-splitting.

**Files (by line count):**

- `src/pages/AdminDashboard.tsx` — 1,537 lines
- `src/pages/SellerImportCenter.tsx` — 1,336 lines
- `src/pages/SellerStore.tsx` — 1,297 lines
- `src/components/seller/ProductForm.tsx` — 1,276 lines
- `src/pages/AdminCMS.tsx` — 1,271 lines
- `src/pages/Checkout.tsx` — 1,211 lines
- `src/pages/ProductDetail.tsx` — 1,189 lines

**Cause:** Business logic, UI, and data access mixed directly in page components rather than delegated to hooks/services.

**Improvement path:** Extract sub-sections into named sub-components and move data-fetching logic to custom hooks. Apply React lazy loading (`React.lazy`) at the route level for all heavy admin pages.

---

## Fragile Areas

### Checkout Payment Flow (`src/pages/Checkout.tsx`)

**Files:** `src/pages/Checkout.tsx` — 1,211 lines, 5 `eslint-disable-next-line react-hooks/exhaustive-deps` suppressions

**Why fragile:** Multiple `useEffect` hooks with suppressed dependency arrays (lines 85, 105, 163, 244, 590, 612) mean state changes may silently fail to retrigger payment initialisation. The `isMock` flag branches throughout the file — any regression in the real Stripe path might silently fall back to mock mode.

**Safe modification:** When touching `useEffect` hooks here, explicitly audit every dependency suppression. Write a Playwright test covering the full Stripe payment flow before making changes.

**Test coverage:** E2E test exists (`e2e/checkout-authenticated.spec.ts`, `e2e/checkout-guest.spec.ts`) but mock mode may mask real Stripe integration failures.

---

### Firebase Auth Token / Firestore Rules Synchronisation

**Files:** `firestore.rules`, `src/lib/authMiddleware.ts`, `src/lib/firebase-admin.ts`

**Why fragile:** Custom claims (`role`, `sellerId`) are set server-side and cached in the Firebase ID token (valid up to 1 hour). A seller's role change (e.g., suspension) will not reflect in Firestore rules until their token expires or they re-authenticate. The MEMORY file notes: "Phase 5 firebase rules deploy pending" — rules edits may not be deployed.

**Safe modification:** After editing `firestore.rules`, always run `firebase deploy --only firestore:rules`. Test all four UAT flows noted in MEMORY (`phase5-firebase-rules-deploy-pending.md`). Force token refresh via `user.getIdToken(true)` where immediate role changes must take effect.

---

### Blockchain Certificate Service Is Simulated

**Files:** `src/services/blockchainService.ts` — `generateTxHash()` (line ~44) produces random hex strings, not real on-chain transactions

**Why fragile:** `txHash`, `blockNumber`, and `network` fields in `productCertificates` Firestore documents are synthetic. The "Verify Product" flow at `/verify` and `SellerCertificates` page presents these as authentic blockchain proofs. A user or auditor checking the tx hash against a real block explorer will find it does not exist.

**Safe modification:** Clearly label certificates as "in-platform" (not on-chain) until a real blockchain integration is built. Do not expand the UI to claim on-chain authenticity.

---

### `src/data/mockProducts.ts` Is 2,832 Lines Bundled into Production

**Files:** `src/data/mockProducts.ts`

**Why fragile:** This file is imported by production pages and services. It is included in the Vite build output, adding significant bundle weight. It also contains hardcoded Turkish/English product names, prices, and image URLs that may become stale or broken.

**Safe modification:** Before removing, audit all import sites (20 non-test files) to ensure each has a working Firestore fallback. Do not remove until all pages can render without it.

---

## Scaling Limits

### Single Express Server, No Horizontal Scaling

**Current capacity:** One `tsx server.ts` process on port 3000.

**Limit:** CPU-bound tasks (PDF invoice generation, Gemini AI, CSV imports) block the event loop. A single crash takes down both the API and Vite middleware.

**Scaling path:** Separate the Vite dev server from the Express API for production. Use Cloud Run or a managed Node host with autoscaling. Move heavy tasks (invoice generation, AI calls) to Cloud Functions or background workers.

---

### Firestore Write Rate for Real-Time Analytics Events

**Current capacity:** `src/services/analyticsService.ts` writes per-event documents to Firestore.

**Limit:** Firestore has a 1 write/second sustained limit per document and soft limits on collection write throughput at scale.

**Scaling path:** Batch analytics events (buffer in-memory, flush every N seconds). Consider BigQuery streaming inserts for analytics instead of Firestore.

---

## Dependencies at Risk

### `iyzipay` (CJS Module, No TypeScript Types)

**Risk:** `server/iyzico.cjs` wraps `iyzipay` v2.0.67 which is a CommonJS module without TypeScript types. The integration uses `any` types throughout and is lazy-loaded with a CJS interop wrapper.

**Impact:** Type errors in the Iyzico payment path go undetected. The CJS/ESM boundary adds fragility on Node version upgrades.

**Migration plan:** Check if a typed TypeScript wrapper or official SDK exists. If not, write a narrow type definition file (`iyzipay.d.ts`) covering only the used methods.

---

### `typesense` Client Installed But Service Not Configured

**Risk:** `src/services/typesenseService.ts` is wired up but requires a running Typesense instance. Per MEMORY notes, Typesense was deferred (`phase4-search-typesense-deferred.md`). The package is bundled into the client build even when Typesense is not available.

**Impact:** `VITE_TYPESENSE_HOST` defaults to `localhost:8108`, which will throw connection errors in production if unconfigured. The lazy-load in `searchService.ts` silently swallows the error, so search degrades without logging.

**Migration plan:** Either fully disable the Typesense import path with a feature flag checked at build time, or set up a production Typesense instance. Add explicit logging when Typesense fails to initialise.

---

## Missing Critical Features

### E-Fatura Integration Is a Stub

**Problem:** `src/services/efaturaService.ts` returns `{ success: false, error: 'E-Fatura API yapılandırılmamış' }` when `EFATURA_API_URL`/`EFATURA_API_KEY` are absent. Turkish tax law requires e-invoicing for sellers above a revenue threshold.

**Blocks:** Legal compliance for TR sellers at scale.

---

### No Email Transactional System Verified End-to-End

**Problem:** `server/routes/email.ts` and `server/services/emailService.ts` exist, but the abandoned cart email cron (`/api/abandoned-cart/check`) and payout notification emails are the only verified send paths. Order confirmation emails, seller application status emails, and return approval emails are not confirmed as working in the current deployment.

**Blocks:** Core buyer/seller communication; impacts trust.

---

## Test Coverage Gaps

### Payment Critical Path Has No Unit Tests

**What's not tested:** `src/pages/Checkout.tsx` payment flow, `src/components/checkout/StripePaymentForm.tsx`, and mock fallback branching logic have no unit tests.

**Files:** `src/pages/Checkout.tsx`, `src/components/checkout/StripePaymentForm.tsx`

**Risk:** Mock/real payment branching can silently fall back to mock mode in production.

**Priority:** High

---

### All 65+ Page Components Have No Unit or Integration Tests

**What's not tested:** Only 3 component unit tests exist (`Breadcrumb`, `OptimizedImage`, `Skeleton`). Zero page-level component tests. The 77 pages/components representing buyer, seller, and admin flows are tested only through a small set of Playwright E2E specs.

**Files:** `src/pages/` (65+ files), `src/components/` (100+ files)

**Risk:** Regressions in individual component logic (form validation, state transitions) are not caught until E2E or manual testing.

**Priority:** Medium — focus first on checkout, auth, and seller onboarding flows.

---

### `firestore.rules` Not Covered by Automated Tests

**What's not tested:** No Firebase Emulator-based rules tests (`@firebase/rules-unit-testing`). The rules are complex (282 lines, atomic helpful-vote checks, role-based write guards).

**Files:** `firestore.rules`

**Risk:** A rules change that inadvertently opens a collection to all users, or blocks sellers from reading their own data, will not be caught before deployment.

**Priority:** High — especially before expanding seller or buyer write permissions.

---

_Concerns audit: 2026-06-08_
