# Admin Seller Control Center — Trust, Tier, Product Moderation & Dispute Systems

**Milestone:** v6.0 Admin Seller Control Center
**Researched:** 2026-06-08
**Scope:** Brownfield audit of existing services; recommendations for new admin UI sections

---

## 1. Trust Score

### Source File

`src/services/sellerTrustService.ts` (lines 1–38)

### Factors and Formula

`computeTrustScore(factors: TrustFactors): number` — pure function, no Firestore reads. Returns an integer 0–100.

| Factor                | Weight (points) | Full-score threshold | Zero-score threshold | Formula                           |
| --------------------- | --------------- | -------------------- | -------------------- | --------------------------------- |
| Order completion rate | 20              | 95%+                 | <50%                 | `(rate - 0.5) × 40`, clamped 0–20 |
| Average review rating | 20              | 4.5 stars            | <2 stars             | `(avg - 2) × 6.67`, clamped 0–20  |
| Seller age (days)     | 20              | 365 days+            | <30 days             | `(days / 365) × 20`, floor 5      |
| Response rate (24h)   | 20              | 80%+                 | 0%                   | `rate × 25`, clamped 0–20         |
| Total orders shipped  | 20              | 100+ orders          | 0 orders             | `orders × 0.2`, cap 20            |

Sum of five 0–20 buckets = total score 0–100. New sellers start with a minimum of 5 points from the age bucket (floor at line 22).

### Trust Levels

`getTrustLevel(score): { label, color, minOrders }` at lines 33–38:

| Score range | Label             | Color   | minOrders gate |
| ----------- | ----------------- | ------- | -------------- |
| 80–100      | Güvenilir Satıcı  | emerald | 50             |
| 60–79       | Başarılı Satıcı   | blue    | 10             |
| 40–59       | Yeni Satıcı       | amber   | 0              |
| 0–39        | Değerlendiriliyor | zinc    | 0              |

`minOrders` is metadata on the level — the function returns it but there is no enforcement logic in this file that blocks sellers below it.

### Admin Override Capability: NOT IMPLEMENTED

There is no `setTrustScore`, `overrideTrustScore`, or manual-adjustment function anywhere in `sellerTrustService.ts`. The score is computed purely from live data passed as arguments; it is never persisted to Firestore by this service. **There is no admin override mechanism today.** This is a gap the control center must close.

### Secondary Score System: `calcSellerPerformance`

`src/services/sellerRatingService.ts` (lines 75–134) defines a separate `SellerPerformanceScore` (0–100 overall, with sub-scores: ratingScore, shipSpeedScore, complianceScore, returnRate, cancelRate, responseRate). This is the score fed to `getTierFromScore` in sellerTierService.

**Critical caveat:** `calcSellerPerformance` contains multiple placeholders at lines 92 and 103:

- `ratingScore` is hardcoded to `75` (line 92: `// placeholder`)
- `returnRate` is hardcoded to `0` (line 103: `// placeholder — would need returnRequest collection`)
- `shipSpeedScore` uses `Math.random()` (line 97)
- `responseRate` is hardcoded to `90` (line 109)

This means the tier assignment derived from `performanceScore` is currently not driven by real data. **The tier system works structurally but scores are synthetic.**

---

## 2. Tier System

### Source File

`src/services/sellerTierService.ts` (lines 1–291)

### Tier Definitions

Five tiers in ascending order (`TIER_ORDER` at line 170):

| Tier     | Label     | Max Products | Max Monthly Rev | Commission | Monthly Fee | Min Score |
| -------- | --------- | ------------ | --------------- | ---------- | ----------- | --------- |
| starter  | Başlangıç | 50           | 50,000 ₺        | 15%        | 0 ₺         | 0         |
| bronze   | Bronz     | 200          | 150,000 ₺       | 12%        | 99 ₺        | 40        |
| silver   | Gümüş     | 500          | 500,000 ₺       | 10%        | 249 ₺       | 60        |
| gold     | Altın     | 2,000        | 2,000,000 ₺     | 8%         | 599 ₺       | 75        |
| platinum | Platin    | 10,000       | unlimited       | 5%         | 1,499 ₺     | 90        |

### Feature Gates per Tier

| Feature            | starter | bronze | silver | gold | platinum |
| ------------------ | ------- | ------ | ------ | ---- | -------- |
| Bulk CSV import    | No      | Yes    | Yes    | Yes  | Yes      |
| Coupon creation    | No      | No     | Yes    | Yes  | Yes      |
| Dynamic pricing    | No      | No     | Yes    | Yes  | Yes      |
| Featured placement | No      | No     | No     | Yes  | Yes      |
| API access         | No      | No     | No     | Yes  | Yes      |

### Tier Assignment Logic

`getTierFromScore(score: number): SellerTier` (line 215) — iterates TIER_ORDER from top, returns first tier whose `minPerformanceScore <= score`. Uses `DEFAULT_TIERS` constants (not admin-customized values) for threshold comparison.

`getSellerTierStatus(sellerId, productCount, monthlyRevenue, performanceScore)` (line 230) — assembles the full status object. Calls `getTierFromScore` then loads the admin-customized `TierConfig` from Firestore (`sellerTiers` collection).

### Admin Override Capability: PARTIAL

**What exists:**

- `updateTierConfig(tier, updates)` (line 188) — admin can modify `maxProducts`, `commissionRate`, `monthlyFee` for any tier globally. This is exposed in `AdminTiers.tsx` with audit logging via `auditLogService`.
- Firestore collection `sellerTiers` stores overrides; `getTierConfig` (line 177) reads Firestore first and falls back to defaults.

**What does NOT exist:**

- No function to assign a specific tier to an individual seller bypassing the score. Tier assignment is always computed from `performanceScore` via `getTierFromScore`, never stored per-seller.
- No per-seller tier override or "grace period hold" mechanism.

**Gap:** An admin cannot say "this seller stays at gold despite their score dropping to 70." The control center needs to add `tier` and `tierOverride` fields to the `sellers` Firestore document and a corresponding service function.

### AdminTiers.tsx Coverage

`src/pages/AdminTiers.tsx` (lines 22–233) — already-built page. Loads all tier configs, allows inline editing of `maxProducts`, `commissionRate`, `monthlyFee` per tier. Audits changes. Does NOT show individual seller tier assignments or allow per-seller overrides.

---

## 3. Product Moderation

### Two Separate Services — Clarification

There are two services that can approve/reject products. They operate on different Firestore collections and serve different purposes:

#### `productApprovalService.ts` — Approval Queue (separate `productApprovals` collection)

`src/services/productApprovalService.ts` (lines 1–91)

- Collection: `productApprovals`
- Document type: `ApprovalEntry` — includes `productId`, `sellerId`, `sellerName`, `productTitle`, `status` (`pending`/`approved`/`rejected`), `autoApproved` flag, `fraudScore`, `fraudFlags[]`, `reviewedBy`, `reviewNote`
- Entry point: `submitForApproval(productId, sellerId, ...)` — called when a seller submits a product; creates an approval queue entry
- `approveProduct(approvalId, adminId)` — updates the approval entry AND syncs the `products` document to `status: 'approved'`
- `rejectProduct(approvalId, adminId, reason)` — only updates the approval entry (does NOT update the products document — possible bug)
- **No audit logging** calls in this service

#### `moderationService.ts` — Direct Product Moderation (products collection)

`src/services/moderationService.ts` (lines 1–103)

- Collection: `products` directly
- Entry point for admin UI (`AdminProducts.tsx` imports from this service, not productApprovalService)
- Three transitions: `approveProduct(id, auditActor?)`, `rejectProduct(id, note, auditActor?)`, `requestChanges(id, note, auditActor?)`
- `requestChanges` sets `status: 'draft'` with a note — puts product back to editable state
- All three functions call `audit(...)` from `auditLogService` when `auditActor` is provided
- Falls back to `MOCK_PRODUCTS` if Firestore returns nothing in `getPendingProducts`

#### AI Moderation Layer: `aiModerationService.ts`

`src/services/aiModerationService.ts` — uses Gemini (via `/api/gemini/text` endpoint, model `gemini-3-flash-preview`) to return a `ModerationResult` with `verdict` (`approved`/`flagged`/`rejected`), `confidence` (0–100), `reason`, `flags[]`, and `suggestedAction`.

`AdminProducts.tsx` (lines 63–80) adds an "AI Scan" button that calls `moderateProductBatch` on all pending products and overlays results on the queue. Admin still takes the final approve/reject action.

#### Relationship Between the Two Services

The two services are **not coordinated**. `productApprovalService` manages a separate queue doc; `moderationService` acts directly on products. The actual admin product page (`AdminProducts.tsx`) uses only `moderationService`. The `productApprovalService` appears to be an older or parallel flow — possibly triggered server-side when a product is first submitted. **This is a dual-write risk:** approving via `productApprovalService.approveProduct` updates both collections, but its `rejectProduct` only updates the approval entry, not the product document itself.

### Product Statuses

`type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected'` (`src/types.ts` line 203)

| Status   | Meaning                       | Transition path                                                |
| -------- | ----------------------------- | -------------------------------------------------------------- |
| draft    | Seller editing, not submitted | seller saves; `requestChanges` puts it back here               |
| pending  | Submitted, awaiting admin     | seller submits; triggers approval queue entry                  |
| approved | Live, visible to buyers       | admin approves via moderationService or productApprovalService |
| rejected | Blocked with note             | admin rejects; note stored in `moderationNote` field           |

### Moderation Queue in Admin UI

`AdminProducts.tsx` — full-featured list with:

- Status filter tabs (All / Pending / Approved / Rejected / Draft)
- Search by title
- Bulk selection
- Per-product approve / reject (with modal + reason for rejection)
- Toggle flags: featured, bestSeller, isFlashDeal, newArrival
- AI Scan button with progress bar for batch Gemini moderation

---

## 4. Disputes

### 4a. Complaint Lifecycle

**Source:** `src/services/complaintService.ts` (lines 1–79)
**Collection:** `complaints`
**Type:** `Complaint` — `buyerId`, `orderId?`, `productId`, `reason`, `description`, `status`, `resolution?`

```
open → reviewing → resolved
                 → dismissed
```

| Status    | Meaning                           |
| --------- | --------------------------------- |
| open      | Filed by buyer, not yet triaged   |
| reviewing | Admin is investigating            |
| resolved  | Admin closed with resolution text |
| dismissed | Admin closed without action       |

**Available functions:**

- `fileComplaint(buyerId, productId, reason, description, orderId?)` — buyer-facing
- `getComplaints(status?)` — admin: all complaints, optionally filtered by status
- `getComplaintsByProduct(productId)` — admin: complaints for one product
- `resolveComplaint(complaintId, adminId, resolution)` — only sets `resolved`; no `dismissed` transition function exists (gap)

**Missing from current service:**

- No `dismissComplaint` function
- No `setReviewing` function — `reviewing` status is a declared value with no write path
- No `sellerId` field on Complaint — cannot query complaints per seller without joining through product/order
- No audit log calls
- No seller notification on complaint filed or resolved

### 4b. Return/Refund Lifecycle

**Source:** `src/services/returnService.ts` (lines 1–255)
**Collection:** `returnRequests`
**Type:** `ReturnRequest` in returnService.ts (richer than the one in `src/types.ts` which is a simpler stub)

Full status machine:

```
requested → approved → pickup_scheduled → received → refunded → closed
          → rejected
```

| Status           | Meaning                                |
| ---------------- | -------------------------------------- |
| requested        | Buyer filed return request             |
| approved         | Approved (auto or manual)              |
| rejected         | Denied with resolution note            |
| pickup_scheduled | Shipping arranged                      |
| received         | Physical goods received back by seller |
| refunded         | Money returned to buyer                |
| closed           | Process complete                       |

**Auto-approval logic** (`shouldAutoApprove` at line 60):

- Within 7 days of order (`AUTO_APPROVE_THRESHOLD_DAYS`)
- Refund amount ≤ 5,000 ₺
- Both conditions must be true → `status` is set to `approved` immediately on creation

**Auto-actions on status change:**

- `refunded` → `restoreProductStock` called automatically
- Buyer notifications for: approved, rejected, refunded, received
- Seller notifications for: received, refunded

**Admin-facing functions:**

- `getAllReturnRequests(status?)` — all returns, optionally filtered
- `updateReturnStatus(returnId, status, resolution?, refundAmount?)` — full status control including timeline append

**`AdminReturns.tsx` gap:** The current admin page (`src/pages/AdminReturns.tsx`) does NOT use `returnService.ts` at all. It queries `orderService.getAllOrders()` and filters by `status === 'refunded' || status === 'cancelled'`. It calls `issueRefund(orderId)` (Stripe refund on the order) and `updateOrderStatus`. This means **the `returnRequests` collection is entirely invisible to the admin today.**

### 4c. Seller Rating / Reviews

**Source:** `src/services/reviewService.ts` (lines 1–180), `sellerRatingService.ts` (lines 1–51)

**Review type** (`src/types.ts` lines 59–76): `status: 'pending' | 'approved' | 'rejected'`; `verified: boolean`; `sellerId?` field present.

**Flow:**

1. Buyer submits via `POST /api/reviews` (server-side, requires delivered order verification — D-01)
2. Review written with `status: 'pending'`, `verified: false`
3. Admin approves (`approveReview` → sets `status: 'approved'`, notifies buyer) or rejects (`rejectReview` → deletes the document)
4. Only `approved` reviews appear to buyers and count in `getSellerStarSummary`

**Seller star summary** (`getSellerStarSummary` in sellerRatingService.ts line 17): queries `reviews` where `sellerId == X AND status == approved`. Returns `{ average, total, distribution }`. Compute-on-read, not cached.

**Admin page** (`AdminReviews.tsx`): shows all reviews with approve/reject actions. Audits both. Does not filter by seller.

---

## 5. Recommended Control Center Sections

### Section A: Trust & Tier Panel (per-seller)

**Purpose:** Surface a seller's current computed trust score, performance score breakdown, tier status, and allow admin intervention.

**What to display:**

- Trust score gauge (0–100) with factor breakdown (orderCompletionRate, avgReviewRating, sellerAgeDays, responseRate, totalOrders)
- Performance score sub-components (note: currently placeholder values — flag visually)
- Current tier badge + tier config (commission, maxProducts, fee)
- Path-to-next-tier: score gap and product count gap
- Product cap status (atCap flag, remainingSlots)
- Seller `Seller.status` field (`active` / `suspended` / `banned`) + `kycStatus`

**Admin Actions Table:**

| Action                                                 | Service / Field                                                              | Guardrail                                                                     | Audit                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Edit global tier config (commission, maxProducts, fee) | `sellerTierService.updateTierConfig`                                         | Numeric range validation; confirm modal                                       | `audit('tier.update', 'tier', tierId)` — already implemented in AdminTiers.tsx |
| Override individual seller tier (bypass score)         | NEW: `sellers/{id}.tierOverride` + service function needed                   | Require reason; show warning if score < tier minimum; auto-expiry date option | `audit('seller.tierOverride', 'seller', sellerId, reason)`                     |
| Manually set trust score adjustment                    | NEW: `sellers/{id}.trustScoreAdjustment` + offsetting in `computeTrustScore` | Integer −20 to +20 cap; require reason; visible to seller in dashboard        | `audit('seller.trustAdjust', 'seller', sellerId, reason)`                      |
| Suspend seller                                         | `sellers/{id}.status = 'suspended'`, `suspendedUntil`                        | Require duration + reason; notify seller                                      | `audit('seller.suspend', 'seller', sellerId)`                                  |
| Ban seller                                             | `sellers/{id}.status = 'banned'`                                             | Require reason; two-admin confirm (or confirmation dialog with re-type)       | `audit('seller.ban', 'seller', sellerId)`                                      |
| Reinstate seller                                       | `sellers/{id}.status = 'active'`                                             | Only if previously suspended/banned                                           | `audit('seller.reinstate', 'seller', sellerId)`                                |

### Section B: Products Panel (per-seller)

**Purpose:** View all products from a specific seller with moderation queue surfaced prominently; apply bulk or per-product actions.

**What to display:**

- Product list filtered by `sellerId` with status tabs (pending/approved/rejected/draft)
- AI moderation verdict overlay (fraudScore, fraudFlags from productApprovals; ModerationResult.verdict from aiModerationService)
- Flag toggles: featured, bestSeller, isFlashDeal, newArrival
- Count summary: total / pending / rejected / at cap indicator

**Admin Actions Table:**

| Action                            | Service                                                           | Guardrail                                       | Audit                                                              |
| --------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Approve product                   | `moderationService.approveProduct(id, auditActor)`                | Only from `pending` status                      | `audit('product.approve', 'product', id)`                          |
| Reject product (with note)        | `moderationService.rejectProduct(id, note, auditActor)`           | Note required (min 10 chars)                    | `audit('product.reject', 'product', id, note)`                     |
| Request changes                   | `moderationService.requestChanges(id, note, auditActor)`          | Note required                                   | `audit('product.reject', 'product', id, 'changes requested: ...')` |
| Bulk approve selected             | loop `moderationService.approveProduct`                           | Only pending items in selection                 | per-item audit                                                     |
| AI scan pending products          | `aiModerationService.moderateProductBatch`                        | Advisory only — admin must confirm final action | `logAudit` called inside service                                   |
| Toggle featured / bestSeller flag | `productService.updateProduct(id, { featured: bool })`            | —                                               | needs audit call added                                             |
| Delist live product               | `moderationService.rejectProduct` or new `delistProduct` function | Require reason; notify seller                   | `audit('product.delist', ...)`                                     |

**Dual-service gap to resolve:** The control center should use `moderationService` exclusively for admin actions. The `productApprovalService` approval queue can be shown as read-only context (fraudScore, fraudFlags) but the approve/reject write should go through `moderationService` which has audit support and the `requestChanges` flow. Fix the reject-not-updating-product bug in `productApprovalService.rejectProduct` (line 57–69) if it is still used server-side.

### Section C: Disputes Panel (per-seller)

**Purpose:** Show all open complaints and return requests linked to a seller; allow resolution.

**What to display:**

- Complaint list for seller (requires adding `sellerId` field to Complaint or joining via productId/orderId)
- Return request list from `returnRequests` collection via `getReturnRequests(sellerId)` — **this collection is unused by current admin UI**
- Complaint status distribution: open / reviewing / resolved / dismissed
- Return status distribution across the full 7-status machine
- Auto-approved return rate vs manual
- Dispute rate KPI: complaints per 100 orders

**Admin Actions Table:**

| Action                        | Service                                                                                                          | Guardrail                                   | Audit                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| Resolve complaint             | `complaintService.resolveComplaint(id, adminId, resolution)`                                                     | Resolution text required                    | needs audit call added                        |
| Dismiss complaint             | NEW: add `dismissComplaint(id, adminId, reason)` to complaintService                                             | Reason required                             | `audit('complaint.dismiss', 'complaint', id)` |
| Set complaint to reviewing    | NEW: `updateComplaintStatus(id, 'reviewing')`                                                                    | Only from `open`                            | `audit('complaint.reviewing', ...)`           |
| Approve return request        | `returnService.updateReturnStatus(id, 'approved')`                                                               | Only from `requested`                       | needs audit call added                        |
| Reject return request         | `returnService.updateReturnStatus(id, 'rejected', reason)`                                                       | Reason required                             | needs audit call added                        |
| Mark return received          | `returnService.updateReturnStatus(id, 'received')`                                                               | Only from `pickup_scheduled`                | needs audit call added                        |
| Issue refund (manual)         | `returnService.updateReturnStatus(id, 'refunded', note, amount)` + trigger Stripe via `orderService.issueRefund` | Confirm refund amount; only from `received` | needs audit call added                        |
| Override auto-approved return | `returnService.updateReturnStatus(id, 'rejected', reason)`                                                       | Warning: "This was auto-approved"           | needs audit call added                        |

---

## 6. Cross-Cutting Gaps and Risks

### Gaps Requiring New Work (not just wiring existing services)

1. **No per-seller trust score persistence.** `computeTrustScore` is pure; there is no scheduled job writing scores to `sellers/{id}.trustScore`. The control center cannot display a current score without fetching all order/review/message data client-side. Recommendation: add a Cloud Function or scheduled Express job that writes `sellers/{id}.trustScore`, `sellers/{id}.performanceScore`, and `sellers/{id}.tier` daily.

2. **`calcSellerPerformance` has placeholder values** (lines 92, 97, 103, 109 of sellerRatingService.ts). Displayed scores will be misleading until these are wired to real data. Flag this prominently in the admin UI until fixed.

3. **`returnRequests` collection invisible to admin.** `AdminReturns.tsx` uses order status filtering instead. The control center must switch to `returnService.getAllReturnRequests` and `returnService.getReturnRequests(sellerId)`.

4. **No `sellerId` on Complaint.** Cannot query complaints by seller without joining. Either add `sellerId` when `fileComplaint` is called (requires the seller to be known at complaint time, which requires orderId lookup), or add a Firestore index on `productId` and join through `products`.

5. **`productApprovalService.rejectProduct` does not update `products` doc** (line 57–69). The approval queue shows `rejected` but the actual product remains in its prior state. This is a bug if this service is used server-side.

6. **No admin tier override per seller.** The `Seller` type has `status`, `adminNote`, `suspendedUntil` but no `tierOverride` or `trustScoreAdjustment` field. These must be added to the type definition and the seller document.

7. **`resolveComplaint` does not audit.** No `audit()` call in `complaintService.ts`. All dispute resolutions must be audited for the control center to be trustworthy.

### Existing Audit Coverage

| Action                      | Audited today?                                              |
| --------------------------- | ----------------------------------------------------------- |
| Tier config update (global) | Yes — AdminTiers.tsx calls `audit('tier.update', ...)`      |
| Product approve             | Yes — moderationService with auditActor                     |
| Product reject              | Yes — moderationService with auditActor                     |
| Review approve              | Yes — AdminReviews.tsx calls `audit('review.approve', ...)` |
| Review reject/delete        | Yes — AdminReviews.tsx calls `audit('review.delete', ...)`  |
| Return refund (admin)       | Yes — AdminReturns.tsx calls `audit('return.refund', ...)`  |
| Return reject (admin)       | Yes — AdminReturns.tsx calls `audit('return.reject', ...)`  |
| Complaint resolve           | No                                                          |
| Seller suspend/ban          | No (field exists, no write function with audit found)       |

---

## 7. File Reference Index

| File                                     | Purpose                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/services/sellerTrustService.ts`     | Trust score formula and level labels                                                |
| `src/services/sellerTierService.ts`      | Tier definitions, config, assignment, admin update                                  |
| `src/services/sellerRatingService.ts`    | Performance score (partially placeholder), seller star summary                      |
| `src/services/productApprovalService.ts` | Approval queue (productApprovals collection) — parallel to moderationService        |
| `src/services/moderationService.ts`      | Direct product approve/reject/requestChanges with audit — used by admin UI          |
| `src/services/aiModerationService.ts`    | Gemini-based AI moderation with ModerationResult verdict                            |
| `src/services/complaintService.ts`       | Complaint CRUD — missing sellerId, dismissComplaint, audit calls                    |
| `src/services/returnService.ts`          | Full return lifecycle with auto-approval, timeline, stock restore                   |
| `src/services/reviewService.ts`          | Review approve/delete, seller-scoped star summary                                   |
| `src/pages/AdminTiers.tsx`               | Existing: global tier config editor with audit                                      |
| `src/pages/AdminProducts.tsx`            | Existing: moderation queue with AI scan, uses moderationService                     |
| `src/pages/AdminReturns.tsx`             | Existing: return/refund page — uses orderService not returnService (gap)            |
| `src/pages/AdminReviews.tsx`             | Existing: review moderation queue with audit                                        |
| `src/pages/AdminSupport.tsx`             | Existing: support ticket management (separate from complaints)                      |
| `src/types.ts`                           | `Review` (L59), `Seller` (L78), `ReturnRequest` stub (L366), `ProductStatus` (L203) |
