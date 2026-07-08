# Admin Seller Control Center — UX/IA Research (v6.0)

**Date:** 2026-06-08
**Scope:** Transforming `AdminSellers.tsx` + `AdminSellerView.tsx` into a single-pane "Seller Control Center" for a Trendyol-style marketplace admin.

---

## 1. Reference Patterns

### 1.1 Stripe Dashboard — Contextual Master/Detail

Stripe's customer/payment detail page is the gold standard for a single-pane control center. The list is always accessible via navigation, but once you enter a detail record, the full screen is dedicated to that entity. A sticky header shows the entity name, the health pill (Restricted, Active, etc.), and the primary action button. Below it, secondary metadata runs in a single row. The rest of the screen is organized into collapsible sections with consistent 4-column stat cards at the top. **Takeaway:** health status and primary action stay pinned; sections collapse to reduce vertical length without hiding anything.

### 1.2 Shopify Admin (Partner/Plus) — Tabbed Detail

When Shopify added more entity complexity (customers, stores, metafields) they switched to tabs inside the detail view rather than scrolling one long page. Each tab is lazy-loaded. The tab bar is horizontally scrollable on mobile. **Takeaway:** tabs let each domain (Products, Orders, Finance, KYC) own its full vertical space without infinite scroll collision.

### 1.3 Trendyol Seller Operations Center — Priority-surfaced Status Header

Trendyol's internal seller ops screens always show a "health score" row at the top: KYC status, active/suspended badge, last activity, complaint count. Actions are split into two zones — "Pending Actions" (red/amber, demand immediate click) and "Admin Tools" (gray, discretionary). **Takeaway:** pending-action affordances must visually dominate over read-only data.

### 1.4 Amazon Seller Central (Admin View) — Sectioned Vertical Scroll with In-Page Jump Nav

Amazon's internal seller view uses a sticky left-side quick-jump nav at desktop widths (`#overview`, `#products`, `#orders`, `#finance`, `#compliance`). This avoids the tab loading flicker while still organizing content. Each section has its own "section header" with a count badge. **Takeaway:** jump-nav works well when data is all loaded at once (acceptable for per-seller view); tabs work better when data is loaded lazily per domain.

### 1.5 Linear Issue View — Sidebar + Main Content Split

Linear's issue view splits meta/actions into a right sidebar (status, assignee, priority) and main content left. The sidebar actions are always visible regardless of scroll position. **Takeaway:** for a seller where meta (KYC status, commission, payment account) is action-heavy, a right sidebar column keeps actions accessible without top-of-page scroll dependency.

### 1.6 GitHub Organization Member View — Bulk Actions on List View

GitHub's member list reveals a checkbox column on hover, shows a floating bottom bar when any are checked ("3 selected — Remove / Change role / Export"), and hides it when nothing is selected. **Takeaway:** bulk action bar should be contextual (appears only when items are selected), not occupy permanent space.

---

## 2. Recommended IA for the Control Center

### 2.1 List View: `AdminSellers.tsx` — Keep and Extend

The existing list is well-structured. Recommended changes:

**Header row (above table)**

- Left: `Satıcı Yönetimi` title + pending-KYC count badge (existing, keep)
- Center: status filter chips (Tümü / Pending KYC / Aktif / Askıda / Banlı) — extend existing KYC chips to include account status
- Right: search input (existing) + "Filtrele" dropdown button (status, origin, tier, commission range)

**Table columns — revised order and content**

1. Mağaza (avatar + name + slug) — existing
2. KYC + Payment (combined: badge + payment account status pill in one cell — saves width)
3. Tier (Medal + level badge — currently "Performans" column, rename)
4. Komisyon (inline edit — existing, keep)
5. Durum (status badge — existing)
6. GMV (new column: 30-day revenue in ₺, sourced from existing `orders` aggregate)
7. Aksiyonlar (existing action buttons)

**Bulk action bar** — appears as a fixed bottom strip when 1+ rows are checkbox-selected:

- Checkboxes added as first column (hidden until row hover or any is checked)
- Strip shows: `X satıcı seçildi · [KYC Onayla] [Askıya Al] [Komisyon Değiştir] [Dışa Aktar]`
- Strip dismisses on deselect all or Escape
- Destructive bulk actions (Askıya Al) show an inline confirmation inside the strip before executing

**Search behavior**

- Current: client-side filter on loaded sellers array — acceptable for <500 sellers, keep
- Add: debounced 300ms filter, search across `storeName`, `slug`, `origin`, `userId`
- Add: URL param sync (`?q=name&kyc=pending&status=active`) so links are shareable

**Empty / loading / error states**

- Loading: existing spinner is fine; add skeleton rows (3 rows, shimmer animation via Tailwind `animate-pulse`) instead of full-page spinner so layout doesn't jump
- Empty after filter: "Filtrelerinizle eşleşen satıcı bulunamadı. [Filtreleri temizle]" with Store icon — existing "Satıcı bulunamadı" can be extended
- Error: "Satıcılar yüklenirken hata oluştu. [Tekrar Dene]" with RefreshCcw icon; currently falls back to MOCK_SELLERS silently — this should be explicit

### 2.2 Detail View: `AdminSellerView.tsx` — Redesign as Control Center

**Layout: Two-column at lg+, single-column on mobile**

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Admin Panel                                [Toast zone]        │
├──────────────────────────────────────────────────────────────────┤
│  SELLER HEADER (full width, sticky)                               │
│  Logo · StoreName · KYC pill · Status pill · Origin · Joined     │
│  [4 stat cards: GMV / Performance / Balance / Commission]         │
│  [Primary action buttons: Approve / Suspend / Message]            │
├────────────────────────────────┬─────────────────────────────────┤
│  TAB BAR (lazy loaded)         │  ACTION SIDEBAR (sticky)         │
│  [Overview][KYC][Products]     │  KYC: status + Approve/Reject   │
│  [Orders][Finance][Activity]   │  Payment: Stripe/Iyzico status  │
│                                │  Commission: inline edit field  │
│  TAB CONTENT AREA              │  Status: toggle suspend/ban     │
│  (scrolls independently)       │  Quick links: Seller Panel ↗   │
└────────────────────────────────┴─────────────────────────────────┘
```

At `lg` (1024px+): 2-column grid (`grid-cols-[1fr_280px]`), sidebar `sticky top-6`.
Below `lg`: sidebar renders as a collapsed "Hızlı İşlemler" accordion above the tab bar.

**Sticky Header (always visible)**

```
[Logo 56px] [StoreName + badges row] .............. [GMV large] [Actions row]
            [slug · origin · joined · tier]
```

- Badges: KYC pill + Status pill + Origin tag — all in one flex-wrap row
- GMV shows delivered-orders total (existing `totalRevenue` calculation)
- Actions row: `[Onayla]` (emerald, only if canApprove) · `[Askıya Al / Aktifleştir]` (orange/green toggle) · `[⋯ More]` dropdown (Ban, Message, Export, View as Seller)
- Sticky: `sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800` — scrolls up with the page but remains within viewport

**Tab structure (6 tabs)**

| Tab         | Content                                                                             | Data loaded                         |
| ----------- | ----------------------------------------------------------------------------------- | ----------------------------------- |
| Genel Bakış | 4 stat cards + mini product grid (first 6) + mini order list (last 5)               | Bundled in initial Promise.all      |
| KYC         | DocViewerCard grid + identity status + payment account status + approve/reject form | Bundled in initial load             |
| Ürünler     | Full product grid with status filter chips + approve/reject per product             | From initial load; paginate locally |
| Siparişler  | Full orders table with status filter + amount totals                                | From initial load; paginate locally |
| Finans      | Balance card + commissions table + payout history table + mini bar chart            | From initial load                   |
| Aktivite    | Audit log timeline (chronological list of admin actions on this seller)             | Lazy loaded on tab open             |

**Tab loading strategy**: All data except Activity is fetched in a single `Promise.all` on mount (existing pattern in `AdminSellerView.tsx` lines 143–174 — keep this). Activity is loaded lazily on first tab open using a local `loaded` flag.

**Stat card grid (below header, above tabs)**

4 cards in `grid-cols-2 md:grid-cols-4`:

1. GMV (delivered revenue, emerald)
2. Performance score + tier badge (yellow)
3. Available balance (blue)
4. Commission earned by platform (purple)

Existing `AdminSellerView.tsx` lines 580–638 already implement these cards. Migrate to a reusable `SellerStatCard` component (see Section 3).

### 2.3 Action Affordances

**Standard inline actions (no confirmation)**

- Edit commission rate (existing inline edit pattern — keep)
- Copy onboarding URL (existing — keep)
- View KYC document (existing DocViewerCard — keep)

**Actions requiring a single-step confirmation (amber banner)**

- Suspend seller: "Bu satıcıyı askıya almak istediğinizden emin misiniz? Tüm ürünleri gizlenecek." → [Evet, Askıya Al] [İptal]
- Unsuspend: no confirmation needed (non-destructive)
- Override commission rate: "Komisyonu %X'dan %Y'ye değiştirmek istediğinizden emin misiniz?" only if delta > 5pp

**Actions requiring reason + confirmation (two-step modal or expandable form)**

- Reject KYC application: existing `showRejectForm` pattern in `AdminSellerView.tsx` lines 511–558 is correct — mandatory textarea, min-10-char validation. Keep and reuse.
- Ban seller (permanent): reason textarea required + "BAN" typing confirmation (like GitHub repo deletion)
- Approve KYC: currently a simple button click — low risk, no extra confirmation needed

**Financial actions (highest severity)**

- Manual payout trigger: modal with amount field, bank account preview, "This cannot be undone" warning, require reason
- Commission refund/adjustment: modal with audit reason field
- All financial actions: write to auditLog via existing `audit()` service before executing

**Confirmation pattern anatomy** (standardized across all confirm flows):

```
bg-amber-50/bg-red-900/20 rounded-xl p-4
  Icon (AlertCircle or XCircle)
  Heading: action name
  Body: what will happen
  [Cancel — neutral] [Confirm Action — color-coded]
```

Use `AnimatePresence` + `motion.div` with `height: 0 → auto` (existing pattern from `AdminSellerView.tsx`).

### 2.4 Activity / Audit Timeline

The existing `auditLogService.ts` already writes events. In the Activity tab:

- Fetch last 50 audit events for this seller's ID
- Render as a vertical timeline: dot + line on left, event row on right
- Each row: timestamp (relative `2 saat önce`, full on hover via `title` attr) + actor email + action label + change diff
- Group by date (`today`, `yesterday`, `date string`)
- Color-code by severity: green (approve/activate), amber (suspend/commission-change), red (reject/ban)
- No pagination needed initially — 50 events is sufficient for a solo-dev MVP

---

## 3. Component Reuse

### Existing components that fit directly

| Component                | File                                         | How used in Control Center                                                             |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `DocViewerCard`          | `AdminSellerView.tsx` (lines 55–105, inline) | Extract to `src/components/admin/DocViewerCard.tsx`, reuse in KYC tab                  |
| `BulkEditBar`            | `src/components/seller/BulkEditBar.tsx`      | Adapt for list-view bulk actions (currently seller-side, not admin-side)               |
| `FinanceDashboard`       | `src/components/seller/FinanceDashboard.tsx` | Potential read-only render in Finance tab; check if it accepts `sellerId` prop         |
| `OrderStatsBar`          | `src/components/seller/OrderStatsBar.tsx`    | Could render in Overview tab header                                                    |
| Inline commission editor | `AdminSellers.tsx` (lines 429–469)           | Extract to `src/components/admin/CommissionEditor.tsx` — used in both list and sidebar |

### New shared components needed

| Component name         | File path                                       | Purpose                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SellerStatCard`       | `src/components/admin/SellerStatCard.tsx`       | Reusable stat card (icon, label, value, sub-value). Replaces duplicated card markup in both AdminSellers quick-view modal and AdminSellerView stat grid. Props: `icon`, `label`, `value`, `sub`, `color`     |
| `SellerStatusBadge`    | `src/components/admin/SellerStatusBadge.tsx`    | Renders KYC + account status pills consistently. Accepts `kycStatus`, `accountStatus`, `paymentStatus`. Replaces the inline badge maps in both files (`KYC_BADGE`, `STATUS_BADGE`, `kycColor`).              |
| `ConfirmBanner`        | `src/components/admin/ConfirmBanner.tsx`        | Expandable amber/red confirmation strip. Props: `open`, `variant: 'warn'                                                                                                                                     | 'danger'`, `heading`, `body`, `onConfirm`, `onCancel`, `confirmLabel`, `loading`. Uses existing `AnimatePresence`+`motion.div` height-expand pattern. |
| `AuditTimeline`        | `src/components/admin/AuditTimeline.tsx`        | Renders audit log events as a vertical timeline. Props: `events: AuditEvent[]`, `loading`. Used in Activity tab.                                                                                             |
| `AdminTabBar`          | `src/components/admin/AdminTabBar.tsx`          | Tab bar with lazy-load indicator. Props: `tabs: {key, label, icon, badge?}[]`, `active`, `onChange`. Avoids recreating tab button patterns in every admin detail view.                                       |
| `SellerControlSidebar` | `src/components/admin/SellerControlSidebar.tsx` | The sticky right sidebar with KYC actions, commission editor, status toggle. Accepts `seller`, `application`, `onApprove`, `onReject`, `onToggleSuspend`, `onCommissionSave`. Stateless — parent owns state. |
| `BulkActionStrip`      | `src/components/admin/BulkActionStrip.tsx`      | Fixed bottom bar for list view bulk actions. Appears when `selectedCount > 0`. Props: `count`, `actions: {label, icon, variant, onClick}[]`.                                                                 |

### Styling note

All new components must use the `#1A1033` / `#F8F8FA` / `accent` (brand purple `#6418E5`) palette from `AdminSellers.tsx`. The dark `zinc-950` theme in `AdminSellerView.tsx` is inconsistent with the rest of the admin — the Control Center redesign should unify to the light theme (`bg-white / bg-[#F8F8FA]`) used by `AdminSellers.tsx` and `AdminDashboard.tsx`.

---

## 4. Performance & State

### Current problem

`AdminSellerView.tsx` fires 8 parallel Firestore reads on mount (line 143 `Promise.all`). This is fine for a single seller view. The loop causing the infinite re-render bug (fixed in commit `c0ac5be`) was `perfScores` being set inside an effect that had `filtered` as a dependency — `filtered` was recomputed each render, causing the loop.

### Recommended hook structure

**List view: `useSellerList` hook** (`src/hooks/useSellerList.ts`)

```ts
// Encapsulates: fetch, filter, pagination, perfScore preloading
// State: sellers[], loading, error, search, kycFilter, statusFilter
// Returns: { filtered, loading, error, search, setSearch, kycFilter, setKycFilter, ... }
// perfScore preloading: useMemo-derived visible IDs → useEffect with stable dep array
```

The re-render loop fix is to compute `visibleIds` with `useMemo` first, then use that stable value in the `useEffect` dep array — not `filtered` directly.

```ts
const visibleIds = useMemo(
  () => filtered.slice(0, 20).map((s) => s.id),
  [filtered], // filtered itself is useMemo-stable
);

useEffect(() => {
  visibleIds.forEach((id) => {
    if (!perfScores[id]) {
      calcSellerPerformance(id).then((score) =>
        setPerfScores((prev) => ({ ...prev, [id]: score })),
      );
    }
  });
}, [visibleIds]); // stable — only re-runs when visible IDs actually change
```

**Detail view: `useSellerDetail` hook** (`src/hooks/useSellerDetail.ts`)

```ts
// Encapsulates the Promise.all from AdminSellerView lines 143–174
// Returns: { seller, application, products, orders, perfScore, commissions, payouts, sellerBal, loading, error, refresh }
// Activity data: separate useEffect gated by `activityTabOpened` flag to avoid fetching at mount
```

**Tab lazy loading pattern**

```ts
const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview', 'kyc']));

const openTab = (key: string) => {
  setActiveTab(key);
  setLoadedTabs((prev) => new Set([...prev, key]));
};
```

Each tab renders `{loadedTabs.has('activity') && <ActivityTab />}` — components mount once and stay mounted, preventing data refetch on tab switches.

**Firestore read budget for detail view**
Current reads on mount: sellers/[id] + products (query) + orders (query) + calcSellerPerformance (query) + commissions (query) + payouts (query) + sellerBalance (query) + sellerApplications (query) = 8 reads. This is acceptable for an admin flow that is not high-frequency. Do not cache aggressively — admins need current data.

**List view pagination**
Current: loads all sellers. For < 200 sellers this is fine. At scale, add Firestore cursor pagination (`startAfter(lastDoc)`) with a "Load more" button — not infinite scroll (admin tables need stable scroll position).

---

## 5. Anti-Patterns to Avoid

### 5.1 Putting all domains in one scroll — the "wall of content" anti-pattern

`AdminSellerView.tsx` currently scrolls one long page: KYC → metrics → products (20 items) → orders (20 rows). At 30+ products this becomes unnavigable. **Fix:** tabs with lazy loading (see Section 2.2).

### 5.2 Immediate destructive actions on icon button click

`AdminSellers.tsx` line 519–535: the suspend/activate toggle fires immediately on click with no confirmation. A mis-click suspends a live seller. **Fix:** wrap in `ConfirmBanner` for the Suspend action (not for Activate, which is non-destructive).

### 5.3 Silent fallback to mock data on error

`AdminSellers.tsx` lines 83–92: on any error, silently loads `MOCK_SELLERS`. An admin does not know they are looking at fake data. **Fix:** show error state with retry button; only show mock data in development (`import.meta.env.DEV`).

### 5.4 Re-render loop from unstable effect dependencies

Fixed in `c0ac5be` but the root cause pattern remains elsewhere: `useEffect` that calls `setState` inside a loop where the state is in the dependency array. **Fix:** always derive a stable `ids` array with `useMemo` before using in `useEffect` (see Section 4 code sample).

### 5.5 Mixed dark/light themes in the same admin section

`AdminSellers.tsx` uses `bg-white / text-[#1A1033]` (light). `AdminSellerView.tsx` uses `bg-zinc-950 / text-white` (dark). Navigating between them is jarring. **Fix:** unify to the light theme for the Control Center redesign.

### 5.6 Inline toast definition duplicated in each file

`AdminSellerView.tsx` defines its own `ToastMsg` interface and toast state inline (lines 41–45, 136–141). This will be duplicated in more views. **Fix:** extract to a `useToast` hook (`src/hooks/useToast.ts`) — small but avoids 3× duplication across future admin pages.

### 5.7 Prop-drilling action handlers through 4 levels

If the sidebar and each tab panel need `onApprove`, `onReject`, `onToggleSuspend`, pass them via a `SellerControlContext` (React Context scoped to the single detail page) rather than prop drilling through tab containers. Acceptable to co-locate context in the page file itself since it is not a global concern.

### 5.8 Mixing navigation tabs with content sections in same state variable

`AdminSellers.tsx` uses `adminTab` for three different content categories (sellers list, applications list, commission rules) — these are fundamentally different entities. In the new IA, the list view should live at `/admin/sellers`, applications at `/admin/applications`, commission rules at `/admin/commission` — separate routes, not tabs in one page. This removes the need for tab-gated `useEffect` loads and makes each section bookmarkable.

### 5.9 No keyboard navigation on action buttons

Current icon buttons have `title` attrs but no `aria-label`. KYC approve/reject in the table should be keyboard-reachable in a logical order. Add `aria-label` to all icon-only buttons in the redesign.

### 5.10 Fetching all sellers' performance scores upfront

`AdminSellers.tsx` preloads `calcSellerPerformance` for the first 20 sellers on every filter change. Each call is a Firestore read. At 20 sellers × multiple filter interactions this burns reads. **Fix:** load perf scores only for sellers actually visible in the viewport (Intersection Observer) or on explicit "load score" click, or cache results in `sessionStorage` keyed by `sellerId` with a 5-minute TTL.

---

## Appendix: Existing Service / Type Reference

| Data              | Service / Source                                | Used in                               |
| ----------------- | ----------------------------------------------- | ------------------------------------- |
| Seller profile    | `doc(db, 'sellers', sellerId)`                  | AdminSellerView line 146              |
| KYC application   | `sellerApplicationService.getApplications()`    | AdminSellers line 107                 |
| Products          | `productService.getProducts({ sellerId })`      | Both files                            |
| Orders            | `orderService.getOrdersBySeller(sellerId)`      | AdminSellerView line 148              |
| Performance score | `sellerRatingService.calcSellerPerformance(id)` | Both files                            |
| Commissions       | `commissionService.getSellerCommissions(id)`    | AdminSellerView line 150              |
| Payouts           | `sellerPayoutService.getPayoutHistory(id)`      | AdminSellerView line 151              |
| Balance           | `sellerPayoutService.getSellerBalance(id)`      | AdminSellerView line 152              |
| Audit log         | `auditLogService.audit(...)` write only         | AdminSellers; read side not yet built |
| Commission rules  | `commissionService.getCommissionRules()`        | AdminSellers line 115                 |

`Seller` interface lives in `src/types.ts` line 78. The `SellerApplication` type is in `src/services/sellerApplicationService.ts`.
