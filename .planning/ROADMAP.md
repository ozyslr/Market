# Roadmap: Benim Olan (Mercora) — Global Artisan Marketplace

## Milestones

- ✅ v1.0 (1-7) · v1.1 (8-11) · v2.0 (12-17) · v3.0 (18-20) · v4.0 (22-25) — SHIPPED
- ✅ **v5.0 — Merchant Dashboard** — Phases 26–28 — SHIPPED
- 🚧 **v6.0 — Admin Satıcı Denetim Merkezi** — Phases 30–35 (planning)

## Phases

<details><summary>✅ v1.0–v5.0 (Phases 1–28) — SHIPPED</summary>
v1.0 Marketplace Core (1-7) · v1.1 Stabilize & Sharpen (8-11) · v2.0 Trust & Scale (12-17) · v3.0 Go Live & Scale (18-20) · v4.0 Seller Empire (22-25) · v5.0 Merchant Dashboard (26-28)
</details>

### 🚧 v6.0 Admin Satıcı Denetim Merkezi (Phases 30–35)

- [ ] **Phase 30: Foundation & Shared** — Shared admin component library, theme unification, re-render-safe hook architecture, remove MOCK_SELLERS fallback
- [ ] **Phase 31: Seller List + Bulk Actions** — Filter chips, GMV column, inline commission edit, bulk action strip, URL param sync, skeleton loading
- [ ] **Phase 32: Seller Detail Core** — Tabbed two-column AdminSellerView rebuild, sticky header, stat cards, lazy tab loading via useSellerDetail hook
- [ ] **Phase 33: KYC & Intervention** — Request-changes state, atomic approval, suspend/reactivate/ban endpoints with revokeRefreshTokens, full audit trail; verifyAdmin hardening
- [ ] **Phase 34: Finance Oversight** — Finance tab (System B ledger only), payout history, commission rules UI, audit trail on all commission writes
- [ ] **Phase 35: Trust/Tier & Disputes** — Trust/performance score display, tier override, trust adjustment endpoint, per-seller disputes panel, Firestore rules for returns/returnRequests

## Phase Details

### Phase 30: Foundation & Shared

**Goal**: Admin seller screens share a consistent, performant component foundation — unified theme, no mock data, re-render-safe hooks
**Depends on**: Nothing (first v6.0 phase)
**Requirements**: ACC-01, ACC-02, ACC-03, ACC-04
**Success Criteria** (what must be TRUE):

1. Admin sees a single consistent light brand theme across all seller screens — no dark/light mismatch
2. Stat card, status badge, confirmation dialog, and toast components are shared and render identically in list and detail views
3. Any Firestore read error shows an explicit error state with a retry button — MOCK_SELLERS is permanently removed
4. No admin seller screen triggers an infinite re-render loop; useParams results are stabilized with useMemo before use in useEffect deps
   **Plans**: TBD
   **UI hint**: yes

### Phase 31: Seller List + Bulk Actions

**Goal**: Admin can filter, search, and act on sellers in bulk from a single list view
**Depends on**: Phase 30
**Requirements**: LST-01, LST-02, LST-03, LST-04, LST-05
**Success Criteria** (what must be TRUE):

1. Admin can filter the seller list by status chip (All / Pending KYC / Active / Suspended / Banned) and results update immediately
2. Admin can type in the search box and results debounce at 300ms; active filters are reflected in the URL (shareable)
3. Admin can see 30-day GMV per seller and edit commission inline from the list row
4. Admin can select multiple sellers and apply a bulk action (KYC Approve, Suspend, Change Commission, Export) in one click
5. List skeleton rows appear during loading; status badge counts are computed via getCountFromServer — no full-collection reads
   **Plans**: TBD
   **UI hint**: yes

### Phase 32: Seller Detail Core

**Goal**: Admin can view every dimension of a seller's profile from one tabbed two-column screen, with data loaded lazily per tab
**Depends on**: Phase 30
**Requirements**: DET-01, DET-02, DET-03, DET-04
**Success Criteria** (what must be TRUE):

1. Admin navigating to /admin/sellers/:id sees a two-column layout (sticky header + sidebar) with a six-tab panel (Overview, KYC, Products, Orders, Finance, Activity)
2. The sticky header shows seller identity, KYC + payment status, origin, join date, and four stat cards (GMV, performance score, balance, commission rate)
3. Tabs other than Overview load data only on first open; all list queries include limit(50) or limit(20) for secondary panels
4. Overview tab shows recent products and recent orders; Activity tab shows the last 50 audit events in a timeline
   **Plans**: TBD
   **UI hint**: yes

### Phase 33: KYC & Intervention

**Goal**: Admin can approve, reject, request changes, suspend, reactivate, and ban sellers — all server-side, atomic, audited, and immediately enforced
**Depends on**: Phase 32
**Requirements**: INT-01, INT-02, INT-03, INT-04, INT-05, INT-06, INT-07, SEC-02
**Success Criteria** (what must be TRUE):

1. Admin can approve or reject a KYC application from the detail view and an audit record with before/after snapshot appears immediately
2. KYC approval atomically updates sellerApplications.status inside the server endpoint — if Stripe/Iyzico provisioning fails, status does not change
3. Admin can set a KYC application to "changes_requested" and the seller can resubmit
4. Admin can suspend a seller with a reason; the seller is blocked from panel login, product creation, and payout within seconds (revokeRefreshTokens called)
5. Admin can reactivate a suspended seller with a note; payout re-enables and an audit record is written
6. Admin can permanently ban a seller via a typed-confirmation dialog; stripe.accounts.reject() is called and the ban cannot be undone
7. verifyAdmin is non-optional on all admin/seller endpoints; the iyzico route type enforces this at startup — any missing guard causes a fail-fast error on server boot
   **Plans**: TBD

### Phase 34: Finance Oversight

**Goal**: Admin can audit a seller's financial position, trigger payouts, and manage commission rules — all audit-trailed and using System B ledger data exclusively
**Depends on**: Phase 33
**Requirements**: FIN-01, FIN-02, FIN-03, FIN-04
**Success Criteria** (what must be TRUE):

1. The Finance tab shows the seller's ledger balance and transaction history sourced exclusively from System B; System A data appears only as a labeled legacy note
2. Finance-role admin can trigger a manual payout from the Finance tab and the action appears in the audit log
3. Admin can view and edit per-seller/category commission rules with a before/after preview and confirmation step
4. Every commission rule create, update, or delete writes an audit entry with before/after rate snapshots before returning
   **Plans**: TBD

### Phase 35: Trust/Tier & Disputes

**Goal**: Admin can view real trust/performance scores, override a seller's tier, adjust their trust score, and resolve disputes — backed by correct Firestore rules and rules-unit tests
**Depends on**: Phase 33
**Requirements**: TRD-01, TRD-02, TRD-03, TRD-04, SEC-01
**Success Criteria** (what must be TRUE):

1. Trust score and performance score shown to admin are computed from real order/review data (no Math.random placeholders); trust score is persisted in Firestore and stable across page loads
2. Admin can override a seller's tier with a reason and optional expiry date; the override is stored in sellers.tierOverride and applies immediately
3. Admin can apply a trust score adjustment (bounded ±20) via a verifyAdmin endpoint; the change is audited and reflected in the seller's displayed score
4. Admin can view a per-seller disputes panel listing both complaints (with sellerId) and returnRequests lifecycle; admin can resolve/update them with audit trail
5. Admin can moderate a seller's products (approve/reject/request-changes) via a path that correctly updates the product document
6. Firestore rules grant admin read access to returns and returnRequests; sellerApplications has an explicit rules block; every new or modified rule block has a @firebase/rules-unit-testing test
   **Plans**: TBD

## Progress

| Phase                          | Plans Complete | Status      | Completed  |
| ------------------------------ | -------------- | ----------- | ---------- |
| 1–28                           | All            | Complete    | 2026-06-07 |
| 30. Foundation & Shared        | 0/1            | Not started | -          |
| 31. Seller List + Bulk Actions | 0/1            | Not started | -          |
| 32. Seller Detail Core         | 0/1            | Not started | -          |
| 33. KYC & Intervention         | 0/1            | Not started | -          |
| 34. Finance Oversight          | 0/1            | Not started | -          |
| 35. Trust/Tier & Disputes      | 0/1            | Not started | -          |
