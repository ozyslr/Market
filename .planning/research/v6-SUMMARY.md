# v6.0 Admin Seller Control Center — Research Summary

**Synthesized:** 2026-06-08  
**Sources:** v6-SELLER-DATA.md · v6-ADMIN-UX.md · v6-KYC-FLOWS.md · v6-FINANCE.md · v6-TRUST-DISPUTE.md · v6-PITFALLS.md

---

## 1. Milestone Framing

The Admin Seller Control Center consolidates the fragmented `AdminSellers.tsx` and `AdminSellerView.tsx` pages into a single-pane workspace where one admin can view and act on every dimension of a seller's lifecycle without switching screens. The core problem it solves is that critical admin powers — suspend/ban, tier override, manual payout, complaint resolution, KYC approval — currently live in separate uncoordinated pages, have no server-side authorization guard, and leave no audit trail. The v6 milestone closes these gaps, hardens authorization, and establishes the data foundation (persisted trust score, `sellerId` on complaints, `tierOverride` field) that future automation (ML fraud, mobile ops) depends on.

---

## 2. What Already Exists (Reuse)

The following can be called directly with no new backend work:

**Data reads (client SDK or existing server routes)**

- Seller profile: `getDoc(db, 'sellers', sellerId)` — already used in `AdminSellerView` line 146 _(SELLER-DATA §2.1)_
- Store config/menu/blocks (read): `sellerStoreService`, `sellerMenuService`, `storeContentService` _(SELLER-DATA §2.1)_
- KYC application + documents: `sellerApplicationService.getApplications()` + `GET /api/kyc/signed-url/:path` _(SELLER-DATA §2.2, KYC-FLOWS §1.4)_
- KYC approve (TR): `POST /api/admin/seller/:id/approve-tr` — idempotent, already wired _(KYC-FLOWS §2.1)_
- KYC approve (EU): `POST /api/admin/seller/:id/approve-eu` — idempotent, already wired _(KYC-FLOWS §2.2)_
- Payout history + balance: `sellerPayoutService.getPayoutHistory()`, `getSellerBalance()` _(SELLER-DATA §2.4)_
- Payout approve/complete/fail: `sellerPayoutService.updatePayoutStatus()` _(SELLER-DATA §2.4)_
- Commissions (read + release): `commissionService.getSellerCommissions()`, `releaseCommissions()` _(SELLER-DATA §2.4)_
- Commission rule CRUD: `POST/PUT/DELETE /api/admin/commission-rules` (verifyAdmin) _(FINANCE §3)_
- Manual payout (finance admin): `POST /api/admin/manual-payout` (verifyAdmin + finance role) _(FINANCE §2)_
- Ledger transactions (read + CSV): `GET /api/finance/seller/:sellerId/summary`, `transactions`, `export` _(FINANCE §4)_
- Ledger integrity: `GET /api/admin/ledger/verify` _(FINANCE §5)_
- Return requests (read + update): `returnService.getAllReturnRequests()`, `updateReturnStatus()` _(TRUST-DISPUTE §4b)_
- Complaints (read + resolve): `complaintService.getComplaints()`, `resolveComplaint()` _(TRUST-DISPUTE §4a)_
- Product moderation: `moderationService.approveProduct/rejectProduct/requestChanges` + AI scan via `aiModerationService.moderateProductBatch` _(TRUST-DISPUTE §3)_
- Tier config (global edit): `sellerTierService.updateTierConfig()` _(TRUST-DISPUTE §2)_
- Audit log (read + append): `auditLogService.getAuditLogs()`, `audit()` shorthand _(SELLER-DATA §2.8)_
- Seller analytics: `sellerAnalyticsService.getSellerAnalytics()` _(SELLER-DATA §2.9)_
- Performance score: `sellerRatingService.calcSellerPerformance()`, `getSellerStarSummary()` _(SELLER-DATA §2.3)_

**Existing UI components that can be adapted**

- `DocViewerCard`, inline commission editor, `BulkEditBar` (seller-side) — all reusable _(ADMIN-UX §3)_

---

## 3. Critical Defects Surfaced by Research

| #   | Issue                                                                                                                                                                                             | Severity | Source                             | Why It Matters for v6                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | **Suspend has no enforcement** — `sellers.status='suspended'` does not gate panel login, product creation, or payment receipt                                                                     | CRITICAL | KYC-FLOWS §4                       | A "suspended" seller can keep operating; the control center's Suspend button is cosmetic until this is fixed |
| 2   | **No `revokeRefreshTokens` on suspend** — Firebase ID token stays valid up to 60 min after suspension                                                                                             | CRITICAL | PITFALLS §4c                       | Seller continues to pass auth claims checks for up to an hour after admin action                             |
| 3   | **Dual balance systems diverge** — `sellerBalances` (System A, client-side) and `ledger` (System B, server-only) are independent; both may be active                                              | HIGH     | FINANCE §1                         | Admin could act on a stale System A balance; payout double-counting is possible                              |
| 4   | **Split-brain approval** — `reviewApplication()` client `updateDoc` runs after `/api/admin/seller/:id/approve-*`; if server fails, application status updates anyway with no payment provisioning | HIGH     | PITFALLS §3a, KYC-FLOWS §2.3       | Seller gets `approved` status in Firestore but no Stripe/Iyzico account                                      |
| 5   | **`AdminSellerView` approve/reject not audited** — `handleApprove`/`handleReject` do not call `audit()`                                                                                           | HIGH     | KYC-FLOWS §3.3                     | Approval actions via detail view leave zero audit trail                                                      |
| 6   | **`seller.ban` action type exists but is never called** — no ban endpoint exists                                                                                                                  | HIGH     | KYC-FLOWS §3.2                     | Permanent bans cannot be executed or proven in audit log                                                     |
| 7   | **Commission rule changes leave no audit trail** — POST/PUT/DELETE on `/api/admin/commission-rules` do not call `audit()`                                                                         | HIGH     | FINANCE §3                         | Commission rate changes are invisible in audit log; compliance gap                                           |
| 8   | **Moderation services uncoordinated** — `productApprovalService.rejectProduct` does not update the `products` document                                                                            | HIGH     | TRUST-DISPUTE §3                   | Reject via approval queue leaves product in prior status; buyer still sees it                                |
| 9   | **`complaints` lacks `sellerId` field** — filtering by seller requires join through `products` collection                                                                                         | MEDIUM   | SELLER-DATA §2.7                   | Expensive and fragile; blocks per-seller dispute panel                                                       |
| 10  | **Trust score not persisted / placeholder values in performance score** — `computeTrustScore` is pure function; `calcSellerPerformance` uses `Math.random()` for `shipSpeedScore`                 | MEDIUM   | TRUST-DISPUTE §1, SELLER-DATA §2.3 | Scores change on every page load; tier assignment is non-deterministic                                       |
| 11  | **No per-seller `tierOverride` field** — tier is always computed from performance score; no way to manually hold a seller at a tier                                                               | MEDIUM   | SELLER-DATA §3.1, TRUST-DISPUTE §2 | Admin cannot manually promote/demote a seller                                                                |
| 12  | **Token staleness after suspend** (see #2) + **`iyzico approve-tr` has optional `verifyAdmin`** — if omitted at startup the endpoint is unauthenticated                                           | MEDIUM   | PITFALLS §3b                       | Any unauthenticated caller can provision Iyzico sub-merchants                                                |
| 13  | **Infinite re-render root cause still present in pattern** — `useParams` result used as unstable `useEffect` dep                                                                                  | MEDIUM   | PITFALLS §1                        | Bug was fixed once (c0ac5be) but the pattern will recur in new panels                                        |
| 14  | **`AdminSellers` silently falls back to `MOCK_SELLERS`** on any error                                                                                                                             | MEDIUM   | PITFALLS §4a, ADMIN-UX §5.3        | Admin unknowingly acts on fake data                                                                          |
| 15  | **`AdminReturns.tsx` does not use `returnService`** — reads order status flags instead; `returnRequests` collection invisible to admin                                                            | MEDIUM   | TRUST-DISPUTE §4b                  | Per-seller return history not accessible in current admin UI                                                 |
| 16  | **`returns` Firestore read rules exclude admin** — client-side admin read returns empty                                                                                                           | MEDIUM   | PITFALLS §3d                       | Any returns panel built without adding `isAdmin()` to rules silently shows nothing                           |
| 17  | **Commission client/server fee divergence** — `commissionService.ts` applies 3.5% platform fee; `commissionEngine.ts` does not                                                                    | LOW      | FINANCE §3                         | Seller finance display and ledger show different net amounts                                                 |
| 18  | **`Date.now()` as commission rule ID** — collision-prone under concurrent admin actions                                                                                                           | LOW      | PITFALLS §4d                       | Duplicate rule IDs possible under concurrent admin sessions                                                  |

---

## 4. Required New Backend Work

All of the following are prerequisites for their respective UI panels. All must use `verifyAdmin` middleware (required, not optional) and write audit entries via `server/lib/auditLog.ts`.

| Endpoint / Schema                                                                                      | Type                | Prerequisite for             | Notes                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/admin/seller/:id/suspend` body `{reason, until?}`                                           | New endpoint        | Suspend action in any panel  | Must call `adminAuth.revokeRefreshTokens(uid)` + set `sellers.status='suspended'` + pause Stripe Connect payouts for EU / Iyzico sub-merchant for TR + write `seller.suspend` audit with before/after |
| `POST /api/admin/seller/:id/reactivate` body `{note?}`                                                 | New endpoint        | Reactivate action            | Must re-enable Stripe/Iyzico payouts + write `seller.activate` audit                                                                                                                                  |
| `POST /api/admin/seller/:id/ban` body `{reason, reasonCode}`                                           | New endpoint        | Ban action                   | Two-step confirmation UI; calls `stripe.accounts.reject()` for EU; writes `seller.ban` audit                                                                                                          |
| `PATCH /api/admin/seller/:id/request-changes` body `{changes}`                                         | New endpoint        | KYC "Request Changes" button | Adds `status: 'changes_requested'` to `sellerApplications` schema; new `seller.kyc_changes_requested` audit action type                                                                               |
| `PUT /api/admin/seller/:id/tier-override` body `{tier, reason, expiresAt?}`                            | New endpoint        | Tier override panel          | Writes `sellers.tierOverride` + `sellers.tierOverrideReason` + `sellers.tierOverrideExpiry`; adds these fields to `Seller` type                                                                       |
| `PUT /api/admin/seller/:id/trust-adjustment` body `{adjustment: -20..+20, reason}`                     | New endpoint        | Trust score panel            | Writes `sellers.trustScoreAdjustment`; `computeTrustScore` must read this field as an offset                                                                                                          |
| Atomic KYC approval: move `reviewApplication()` write INTO `/api/admin/seller/:id/approve-*` endpoints | Server modification | KYC flow                     | Eliminates split-brain; `sellerApplications.status` updated in same server transaction as provisioning                                                                                                |
| Add `audit()` calls to `POST/PUT/DELETE /api/admin/commission-rules` handlers                          | Server modification | Finance oversight            | `settings.update` action with before/after rate snapshots                                                                                                                                             |
| Add `revokeRefreshTokens(uid)` to suspend/ban endpoints                                                | Server modification | All suspension flows         | Immediate token invalidation                                                                                                                                                                          |
| Add `sellerId` to `complaints` on `fileComplaint()` (pass from order/product lookup)                   | Schema + service    | Disputes panel               | Required for `getComplaintsByProduct` replacement with direct `where('sellerId', ==, id)` query                                                                                                       |
| Add `isAdmin()` to `returns` + `returnRequests` Firestore read rules                                   | Rules change        | Admin returns/disputes panel | Without this, client-side admin reads return empty                                                                                                                                                    |
| Make `verifyAdmin` required (non-optional) in iyzico route deps type                                   | Server hardening    | Security                     | Fail fast at startup if missing                                                                                                                                                                       |

---

## 5. Recommended Control Center IA

_(condensed from ADMIN-UX §2)_

**List View (`/admin/sellers`)** — extend existing `AdminSellers.tsx`

- Status filter chips: Tümü / Pending KYC / Aktif / Askıda / Banlı
- Table columns: Mağaza · KYC+Payment (combined) · Tier · Komisyon (inline edit) · Durum · GMV (30d) · Aksiyonlar
- Bulk action strip (appears on checkbox selection): KYC Onayla · Askıya Al · Komisyon Değiştir · Dışa Aktar
- URL param sync for shareable filters; debounced search (300ms); skeleton loading rows

**Detail View (`/admin/sellers/:id`)** — redesign `AdminSellerView.tsx`

Layout: Two-column at lg+ (`grid-cols-[1fr_280px]`), single-column on mobile.

- **Sticky header (full width):** Logo · StoreName · KYC pill · Status pill · Origin · Joined + 4 stat cards (GMV / Performance / Balance / Commission) + primary action row (Onayla / Askıya Al-Aktifleştir / ⋯ More)
- **Action Sidebar (sticky right, 280px):** KYC status + Approve/Reject, Payment status (Stripe/Iyzico), Commission inline edit, Status toggle, quick links
- **6 tabs (lazy-load except Overview + KYC):**

| Tab         | Content                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Genel Bakış | 4 stat cards + first 6 products + last 5 orders                                                  |
| KYC         | DocViewerCard grid + identity status + approve/reject/request-changes form                       |
| Ürünler     | Product grid with status filter + per-product moderation + bulk approve + AI scan                |
| Siparişler  | Orders table with status filter + amount totals                                                  |
| Finans      | Balance card (System B ledger only) + commissions table + payout history + tier/commission rules |
| Aktivite    | Audit log timeline (last 50 events, lazy loaded on first open)                                   |

**Separate routes (not tabs of AdminSellers):**

- `/admin/applications` — KYC application queue
- `/admin/commission` — global commission rules management

---

## 6. Proposed Capability Groups → Candidate Phases

| Group                             | One-line Goal                                                                                                                                                                                      | Requirements Category                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **A. Foundation**                 | Shared admin components + theme unification + hook architecture + remove MOCK fallback                                                                                                             | Architecture / performance / code quality; no new features                    |
| **B. Seller List + Bulk Actions** | Extend `AdminSellers` list with status filter chips, GMV column, bulk action strip, URL params, skeleton loading                                                                                   | UX / list-view improvements; no new backend                                   |
| **C. Seller Detail Core**         | Rebuild `AdminSellerView` as tabbed two-column layout with sticky header, stat cards, sidebar; load data via `useSellerDetail` hook with lazy tab loading                                          | Architecture redesign; uses existing reads only                               |
| **D. KYC & Intervention**         | Add request-changes state; wire audit to all approval paths; implement suspend/reactivate/ban server endpoints with `revokeRefreshTokens`; fix split-brain approval                                | Backend-heavy; all 5 new endpoints; Firestore rules changes                   |
| **E. Finance Oversight**          | Finance tab showing ledger (System B only), payout history, commission rules; add audit trail to commission rule changes; surface System A legacy warning                                          | Backend audit trail addition + finance tab UI                                 |
| **F. Trust/Tier & Disputes**      | Trust score + performance score display (with placeholder warning); tier override endpoint + UI; add `sellerId` to complaints; build disputes panel showing both `complaints` and `returnRequests` | New fields on `Seller` type; 2 new endpoints; Firestore rules fix for returns |

Suggested phase order: A → B → C → D → E → F. Groups D and E have backend prerequisites; Group F depends on schema changes introduced in D.

---

## 7. Cross-Cutting Guardrails

These apply to every phase. Treat as a mandatory phase-entry checklist.

**Re-render safety**

- `useMemo` wrap on any value from `useParams`, `useSearchParams`, `useLocation` before use in `useEffect` dep array _(PITFALLS §1)_
- No module-level mutable variables inside or adjacent to components; use `useRef` for counters/IDs _(PITFALLS §1)_

**Performance**

- Every `getDocs` in admin screens must include `limit(50)` for lists, `limit(20)` for secondary panels _(PITFALLS §2a)_
- Use `getCountFromServer()` for badge counts — never count by fetching all docs _(PITFALLS §2a)_
- Panel sub-components fetch their own data lazily (only on first tab open) _(PITFALLS §2d, ADMIN-UX §4)_
- Debounce all search inputs ≥ 300ms before entering `useMemo`/`useEffect` deps _(PITFALLS §2b)_
- Wrap all `filter().reduce()` computations over arrays in `useMemo` _(PITFALLS §2e)_

**Authorization**

- All admin write actions go through Express endpoints protected by `verifyAdmin` (required, not optional) — no direct client-side `updateDoc` for mutations _(PITFALLS §3c)_
- `revokeRefreshTokens(uid)` called on every suspend/ban action _(PITFALLS §4c)_
- `reviewApplication` client call removed; status update atomic inside server approval endpoint _(PITFALLS §3a)_

**Data integrity**

- Admin Finance tab uses System B (ledger) data only; System A `sellerBalances` shown only as a legacy/reconciliation note _(FINANCE §5, guardrail 1)_
- Commission rule writes (create/update/delete) always call `audit()` before responding _(FINANCE §5, guardrail 4)_
- Replace `Date.now()` IDs with `crypto.randomUUID()` _(PITFALLS §4d)_
- Remove `MOCK_SELLERS` fallback; show explicit error state _(PITFALLS §4a)_

**Firestore rules**

- Add explicit `match /sellerApplications/{appId}` block _(PITFALLS §3a)_
- Add `|| isAdmin()` to `returns` and `returnRequests` read rules _(PITFALLS §3d)_
- Add `@firebase/rules-unit-testing` tests for every new or modified rule block before deploy _(PITFALLS §4f)_

**Audit**

- Every admin write (approve, reject, suspend, ban, commission change, tier override, trust adjustment, payout trigger, complaint resolve) must write an audit entry with `before` + `after` snapshots via `server/lib/auditLog.ts` _(KYC-FLOWS §3, FINANCE §3)_

---

## 8. Open Decisions

The following require a call from the developer before or during phase planning:

1. **System A decommission timeline.** `sellerBalances` + `payoutRequests` (System A) and the ledger (System B) currently coexist. The control center will surface System B only — but should System A be frozen, migrated, or left as-is for sellers created before the ledger? _(FINANCE §1)_

2. **`performanceScore` placeholder fix scope.** `shipSpeedScore` uses `Math.random()`, `responseRate` is hardcoded. Should fixing these be part of v6 (gate tier display behind a "placeholder data" warning) or deferred? If deferred, the tier panel must visually flag that scores are synthetic. _(TRUST-DISPUTE §1)_

3. **`trustScoreAdjustment` ceiling.** Research recommends a ±20 cap. Is this the right range, or should it be ±10? What is the business rule for when an admin adjustment expires? _(TRUST-DISPUTE §5)_

4. **`tierOverride` expiry.** Should tier overrides be permanent until manually removed, or should they auto-expire (e.g., after 30 days)? If auto-expiry, does a scheduled job need to be built? _(SELLER-DATA §3.2)_

5. **Ban reversal policy.** The current model treats ban as permanent (requires `stripe.accounts.reject()` which cannot be reversed). Should the system support "lift ban" (restore sub-merchant), or is a banned seller permanently off-platform? _(KYC-FLOWS §5.2)_

6. **`complaints.sellerId` backfill.** Adding `sellerId` to new complaint documents is straightforward. Do existing `complaints` documents need a migration script, or is a forward-only approach acceptable (old complaints remain join-dependent)? _(TRUST-DISPUTE §4a)_

7. **GİB e-fatura mock labelling.** The invoice system is fully mocked (`sendToGib` simulates 90% success). Should the Finance tab surface invoice data at all in v6, or defer until real GİB credentials are configured? _(FINANCE §4)_

8. **Second-admin confirmation for ban.** Solo developer setup makes "require second admin to confirm ban" impractical. Is a typed-confirmation dialog (type store name to confirm) sufficient, or does the product need a two-admin approval queue for permanent bans? _(KYC-FLOWS §5.2)_

---

## Sources

| Report                | Key contribution                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `v6-SELLER-DATA.md`   | Full data/service inventory; reuse table; gap list for missing fields and endpoints                          |
| `v6-ADMIN-UX.md`      | Reference patterns; IA layout; component reuse and new component list; hook architecture; anti-patterns      |
| `v6-KYC-FLOWS.md`     | KYC state machine; provisioning idempotency; audit gaps; recommended intervention action set                 |
| `v6-FINANCE.md`       | Dual balance system risk; payout lifecycle; commission divergence; admin actions table with guardrails       |
| `v6-TRUST-DISPUTE.md` | Trust/tier formulas and gaps; dispute lifecycle; `returnRequests` admin blind spot; per-seller override gaps |
| `v6-PITFALLS.md`      | Re-render root cause; N+1 read risks; authorization gaps; prevention checklist                               |
