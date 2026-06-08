# v6.0 Admin Seller Control Center — Pitfalls Report

**Milestone:** AdminSellers + AdminSellerView rebuild  
**Analyzed:** 2026-06-08  
**Source commits:** c0ac5be (re-render fix), current HEAD

---

## 1. Re-render Bug Root Cause (commit c0ac5be)

### What happened

The `AdminSellerView` component had two distinct bugs that together caused an infinite render loop.

**Bug A — Module-level mutable counter as toast ID**

Before the fix, `_toastId` was declared at module scope:

```ts
// BEFORE (broken)
let _toastId = 0;
// inside component:
const id = ++_toastId;
```

During Vite HMR (hot-module replacement), the module is re-evaluated but React component instances are preserved. The counter was reset to `0` on each HMR cycle while the component was still alive. This caused ID collisions in the toast list, which triggered React's reconciler to unmount/remount toast items, which triggered `setToasts`, which caused re-renders. In production builds this is less severe, but the pattern is fundamentally wrong because module-level state escapes the React lifecycle entirely.

**Fix:** Replace with `useRef(0)` (`toastIdRef`), which is scoped to the component instance and survives re-renders without resetting.

**Bug B — Unstable reference from `useParams` used as `useEffect` dependency**

Before the fix:

```ts
// BEFORE (broken)
const { sellerId } = useParams<{ sellerId: string }>();
// useEffect dep:
}, [sellerId]);
```

React Router v7 can return a new object from `useParams()` on every render even when the URL has not changed. The string value `sellerId` is the same, but in a version of the code where `sellerId` was destructured from the params object and that object was used in a dependency array, or where the string reference changed (e.g., as a side-effect of context churn), `useEffect` would re-fire. The data-load `useEffect` at line 143 in the current file depends on `[sellerId]`. If the router returns a fresh string reference for the same value, the effect re-runs, which triggers 8 parallel Firestore reads, which call `setLoading(false)` and multiple `setState` calls, which trigger re-renders, which call `useParams` again — loop.

**Fix:** Stabilize the value with `useMemo`:

```ts
// AFTER (fixed)
const { sellerId: sellerIdParam } = useParams<{ sellerId: string }>();
const sellerId = useMemo(() => sellerIdParam, [sellerIdParam]);
```

`useMemo` returns a stable reference as long as `sellerIdParam` is the same primitive value, breaking the loop.

### The exact anti-pattern

**Rule to prevent recurrence:** Never use a value derived from `useParams()`, `useSearchParams()`, or `useLocation()` directly as a `useEffect` dependency when that effect triggers multiple `setState` calls. Always stabilize with `useMemo` first. This is doubly important in React Router v7, which uses a new object identity for params on every navigation-related re-render.

**Secondary rule:** Never use module-level mutable variables (`let x = 0`) inside React components for anything that feeds `useState`. Use `useRef` for instance-local counters, IDs, and timers.

---

## 2. Performance Pitfalls

### 2a. N+1 Firestore reads on a single screen mount

`AdminSellerView` currently fires 8 parallel reads in one `Promise.all` (line 145–173):

1. `getDoc(doc(db, 'sellers', sellerId))` — 1 read
2. `getProducts({ sellerId })` — unbounded `getDocs` on `products` collection with `where('sellerId', ==, sellerId)`
3. `getOrdersBySeller(sellerId)` — unbounded `getDocs` on `orders`/`subOrders`
4. `calcSellerPerformance(sellerId)` — internally reads reviews + orders
5. `getSellerCommissions(sellerId)` — reads entire `commissionTransactions` for seller
6. `getPayoutHistory(sellerId)` — reads all `payoutRequests` for seller
7. `getSellerBalance(sellerId)` — reads `sellerBalances` doc
8. `getDocs(query(collection(db, 'sellerApplications'), where('userId', '==', sellerId)))` — reads all applications for user

For a seller with 500 products, 1000 orders, and 200 commission transactions this is **1700+ document reads per page load**. With the v6 rebuild adding more data panels (chat logs, audit trail, dispute history, notifications), this number will grow further.

**Prevention:**

- Add `limit(50)` to products and orders queries immediately. Display counts separately using Firestore `count()` aggregation (SDK v9.13+ / `firebase` v12 that is already installed supports `getCountFromServer()`).
- Lazy-load each section independently (accordion or tab pattern). Do not fire all 8 reads at mount — load seller header + KYC status first, load financial data only when the Finance tab is opened.
- For `calcSellerPerformance`, it reads reviews and orders internally. Cache the result in the component with `useMemo` keyed on `sellerId` and avoid re-computing on tab switches.
- Use a `stats` denormalized document on the `sellers/{sellerId}` record for counts (products_count, orders_count, total_revenue) written by Cloud Functions on order events, so the overview card never reads sub-collections.

### 2b. `AdminSellers` fires N calcSellerPerformance calls concurrently

`AdminSellers.tsx` line 122–131 has a `useEffect` that iterates `filtered.slice(0, 20)` and calls `calcSellerPerformance(s.userId)` for every seller on every filter/search change. Each call makes multiple Firestore reads internally. With 20 sellers, this is potentially 40–100 reads every time the search input changes (debounce is absent).

**Prevention:**

- Debounce search input (300ms minimum) before updating `filtered`.
- Only preload performance scores for visible sellers when the sellers list settles (debounce the effect, not just the input).
- Cache scores in a module-level Map or React Context so navigating away and back does not refetch.

### 2c. Unbounded product list in AdminSellers modal

`AdminSellers.tsx` line 97: `getProducts({ sellerId: selectedSeller.userId, includeNonApproved: true })` fetches all products with no `limit()`. A seller with 1000 products renders them all inside a modal.

**Prevention:** Add `limit(100)` to this query. Add "Show more" pagination. The modal is not the place for a full inventory audit; link to a dedicated page for that.

### 2d. Large monolithic component risk

`AdminSellerView` is currently 754 lines. The v6 rebuild adds chat, audit trail, dispute history, product moderation, mass actions, and analytics panels. Projecting from `AdminDashboard.tsx` (1537 lines, noted in CONCERNS.md as a performance and maintenance problem), `AdminSellerView` v6 will easily exceed 1500 lines if not decomposed.

**Prevention:**

- Define section boundaries before writing code: `SellerHeader`, `KycPanel`, `FinancePanel`, `ProductsPanel`, `OrdersPanel`, `AuditPanel` as separate components.
- Each panel owns its own data fetch via a dedicated custom hook (`useSellerProducts(sellerId)`, `useSellerFinance(sellerId)`, etc.).
- Apply `React.lazy` at the route level for the entire admin section.

### 2e. No memoization of computed values

`totalRevenue` at line 265 is recomputed on every render by iterating the `orders` array inline. With 1000+ orders this is a non-trivial computation done synchronously in the render path.

**Prevention:** Wrap in `useMemo(() => orders.filter(...).reduce(...), [orders])`.

---

## 3. Authorization Pitfalls

### 3a. `sellerApplications` collection has no Firestore rules entry

The `firestore.rules` file (282 lines) has **no match block for `sellerApplications`**. The global default-deny catch-all at line 17 (`allow read, write: if isAdmin()`) means only admins can read/write — which is the correct security posture for that collection. However this is implicit, not explicit. Any future change to the default rule (e.g., opening reads for sellers to check their own status) would silently affect `sellerApplications` because there is no explicit override.

**More critically:** `reviewApplication()` in `src/services/sellerApplicationService.ts` line 136 calls `updateDoc(doc(db, 'sellerApplications', id), { status, adminNote, ... })` **directly from the client SDK** using the logged-in admin's Firebase Auth token. This works today because the default deny rule allows admins to write, but it means:

1. Any user who successfully sets `role === 'admin'` in their custom claims can approve/reject seller applications with no further server-side validation.
2. There is no server-side audit of what `adminNote` contains (no sanitization, no length check, no rate limit).
3. The client-side `reviewApplication` call in `AdminSellerView.handleApprove` (line 201) runs **after** the server-side `/api/admin/seller/:id/approve-tr|eu` call. If the server call fails but the client call proceeds, the application status is updated in Firestore without payment provisioning completing — a split-brain state.

**Prevention:**

- Move `reviewApplication` write to the server. The `/api/admin/seller/:id/approve-tr|eu` endpoints should atomically update the `sellerApplications` document as part of the approval transaction, not rely on a client-side `updateDoc` running separately afterward.
- Add an explicit `match /sellerApplications/{appId}` block to `firestore.rules` with `allow read: if isAdmin() || (isFullUser() && resource.data.userId == getUserId()); allow write: if isAdmin();`

### 3b. Iyzico approve-tr has optional verifyAdmin

`server/routes/iyzico.ts` line 540:

```ts
...(verifyAdmin ? [verifyAdmin] : []),
```

`verifyAdmin` is typed as optional (`verifyAdmin?: Middleware`). If the dependency injection call assembles the iyzico routes without passing `verifyAdmin`, the `/api/admin/seller/:id/approve-tr` endpoint becomes unauthenticated. The Stripe `approve-eu` endpoint (`stripe.ts` line 844) uses `verifyAdmin` directly without the conditional spread, so it is always protected.

**Prevention:** Make `verifyAdmin` required in the iyzico route deps type. Remove the optional spread. Fail fast at server startup if `verifyAdmin` is absent rather than silently unprotecting the endpoint.

### 3c. Direct client-side Firestore writes for admin actions bypass audit trail

The current `AdminSellers.tsx` has several admin write actions that go directly to Firestore client-side:

- `updateSeller(id, data)` — KYC status change, commission rate change, suspend/activate (`src/services/userService.ts` → direct `updateDoc`)
- `saveCommissionRule(editingRule)` — commission rule CRUD (`src/services/commissionService.ts` → direct `updateDoc`)
- `reviewApplication(...)` — application status change (direct `updateDoc` as described above)

These calls do call `audit()` in the component, but the audit log write is a fire-and-forget client call — it can fail silently while the Firestore write succeeds. An admin action can take effect with no audit record.

**Prevention for v6:** Route all admin write actions through server endpoints protected by `verifyAdmin`. The server endpoint performs the write via Admin SDK and writes the audit log in the same transaction/batch. Client-side audit calls should be removed.

### 3d. `returns` collection read rules exclude admin reads for seller context

`firestore.rules` line 274: returns are readable by `buyerId` or `sellerId`. An admin using `AdminSellerView` to inspect a seller's dispute/return history would need to go through the server (Admin SDK bypasses rules). If v6 adds a "Returns" panel to `AdminSellerView` that fetches from Firestore client-side, it will return empty results for the admin.

**Prevention:** Add `|| isAdmin()` to the returns read rule before building any admin returns display panel.

### 3e. `subOrders` collection is admin-read-only in Firestore rules

Already noted in CONCERNS.md line 94: `subOrders` reads are restricted to `isAdmin()`. The v6 rebuild of `AdminSellerView` must continue reading subOrders via server endpoints (Admin SDK), not direct client Firestore calls. This is currently correct in `getOrdersBySeller` but must be preserved.

---

## 4. Other Fragile Areas from CONCERNS.md Relevant to This Milestone

### 4a. `MOCK_SELLERS` fallback in `AdminSellers.tsx` line 84

The current `AdminSellers.tsx` falls back to `MOCK_SELLERS` when Firestore returns an empty result. In development this masks real Firestore connectivity issues. The v6 rebuild must remove this fallback entirely and show an empty state or error state instead. The CONCERNS.md audit (line 20–21) explicitly lists this as a production concern.

### 4b. Direct `updateDoc` for seller `commissionRate` has no server validation

`AdminSellers.tsx` `saveCommission()` calls `updateSeller(seller.id, { commissionRate: val })` which resolves to a direct client `updateDoc` on `sellers/{sellerId}`. The client validates `0 <= val <= 100` but there is no server-side validation. The Firestore rules allow any admin to write any value to the `sellers` document. A commission rate of `-5` or `150` would pass the Firestore rules and corrupt seller earnings calculations.

**Prevention:** Add server-side range validation on the `PATCH /api/admin/sellers/:id` endpoint (which should be created for v6). The client should call the server, not Firestore directly.

### 4c. Firebase Auth token staleness for suspended sellers

CONCERNS.md (line 262) notes that custom claims (`role`, `sellerId`) are cached in the Firebase ID token for up to 1 hour. If an admin suspends a seller via the v6 interface, that seller's active sessions continue to have `role: 'seller'` in their token until it expires. Firestore rules check the token claim, not a Firestore document field. The seller can continue writing products for up to 60 minutes after suspension.

**Prevention:** The suspend action on the server should call `adminAuth.revokeRefreshTokens(uid)`, which invalidates all existing tokens immediately. The client SDK will detect the revocation on the next token refresh (within 1 hour for passive clients, immediately for clients that re-authenticate). This is the documented Firebase pattern for immediate suspension.

### 4d. `Date.now()` used for commission rule IDs

`AdminSellers.tsx` line 220: `id: \`rule-\${Date.now()}\``is passed to`saveCommissionRule()`. CONCERNS.md (line 63–74) documents this pattern as collision-prone. Two admins creating commission rules simultaneously will produce duplicate IDs. Use `crypto.randomUUID()`instead, or let Firestore's`addDoc` generate the ID.

### 4e. `any` types throughout admin data flows

The `applications` state in `AdminSellers.tsx` is typed as `any[]` (line 67). The KYC documents in the `applications` tab (line 736) are typed as `{ url: string; name?: string }` inline. These will widen in v6 as more fields are displayed, and without explicit types, TypeScript will not catch field name mismatches from the Firestore schema. CONCERNS.md notes 172 `any` usages codebase-wide; the admin/seller flow is a high-impact area to clean up.

### 4f. No Firestore rules tests

CONCERNS.md (line 376–385) notes there are no `@firebase/rules-unit-testing` tests for `firestore.rules`. Any new rules added for v6 (returns admin read, sellerApplications explicit block, seller status read for suspended check) will be unverified until production traffic hits them.

---

## 5. Prevention Checklist

The following rules must be enforced during v6 phase planning and implementation:

**Re-render safety**

- [ ] All `useEffect` dependencies that come from React Router hooks (`useParams`, `useSearchParams`, `useLocation`) must be stabilized with `useMemo` before use as dependencies.
- [ ] No module-level mutable variables inside or adjacent to React components. Use `useRef` for instance-local counters and IDs.
- [ ] Every new `useEffect` must list its complete dependency array. No `eslint-disable react-hooks/exhaustive-deps` suppressions without a written comment explaining the exact reasoning.

**Performance**

- [ ] Every Firestore `getDocs` call in admin screens must include `limit(N)`. Default limit: 50 for lists, 20 for secondary panels.
- [ ] Use `getCountFromServer(query(...))` for displaying counts; do not count documents by fetching them.
- [ ] Decompose `AdminSellerView` into panel sub-components. Each panel fetches its own data lazily (only on first expand/focus), not on parent mount.
- [ ] Debounce all search inputs (minimum 300ms) before the debounced value enters `useMemo`/`useEffect` dependency arrays.
- [ ] Wrap all expensive `reduce`/`filter` computations over arrays in `useMemo`.

**Authorization**

- [ ] All admin write actions in v6 must go through Express server endpoints protected by `verifyAdmin` middleware. No direct client-side `updateDoc`/`setDoc` for admin mutations.
- [ ] Make `verifyAdmin` a required (not optional) parameter in all route registration functions that expose admin endpoints.
- [ ] The `reviewApplication` client SDK call must be removed and replaced by the server-side approval endpoint writing the status atomically.
- [ ] Add `revokeRefreshTokens(uid)` to the seller suspend/ban server action to immediately invalidate the seller's token.
- [ ] Add explicit `match /sellerApplications/{appId}` block to `firestore.rules` before deploying v6 changes.
- [ ] Add `|| isAdmin()` to `returns` read rule before building any admin returns/dispute panel.

**Data integrity**

- [ ] Remove `MOCK_SELLERS` fallback from `AdminSellers.tsx` entirely before v6 goes live.
- [ ] Replace `Date.now()` IDs with `crypto.randomUUID()` in commission rule creation.
- [ ] Type `applications` state explicitly (not `any[]`); add the `SellerApplication` type or a narrower `AdminApplicationRow` type.

**Testing**

- [ ] Add `@firebase/rules-unit-testing` tests for every new or modified `firestore.rules` block before deploying.
- [ ] Add a Playwright E2E test covering the approve-reject flow end-to-end (including the split-brain risk: what happens if `approve-tr|eu` succeeds but the application status update fails).

---

_Analysis based on: `src/pages/AdminSellerView.tsx`, `src/pages/AdminSellers.tsx`, `src/lib/authMiddleware.ts`, `firestore.rules`, `src/services/sellerApplicationService.ts`, `server/routes/iyzico.ts`, `server/routes/stripe.ts`, `.planning/codebase/CONCERNS.md`, git diff c0ac5be._
