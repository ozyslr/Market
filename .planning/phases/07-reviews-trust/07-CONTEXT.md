# Phase 7: Reviews & Trust - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire trust features onto the **existing** review/Q&A scaffolding so buyers can leave verified, photo-backed reviews and sellers build reputation through ratings and seller-answered Q&A. This is a **hardening + wiring** phase, not a greenfield build — the data model, services, components, and an admin moderation page already exist; the gaps are enforcement (verified-purchase gating), aggregation (seller-level rating summary), and notification (Q&A → seller).

Requirements covered:

- **REV-01** — Verified-purchase badge: only buyers with a delivered order may review; "Doğrulanmış Alıcı" badge on the review.
- **REV-02** — Photo reviews: up to 5 photos per review, displayed in a product-page gallery.
- **REV-03** — Seller rating summary: average, count, and star distribution on the store page and product detail page.
- **REV-04** — Product Q&A: buyers post questions; seller is notified and can reply publicly.

**Out of scope (other phases / later):** anything beyond these 4 requirements. No new review incentives/loyalty (own phase), no AI review summarization, no cross-product recommendation changes.

</domain>

<decisions>
## Implementation Decisions

### Verified-Purchase Enforcement (REV-01)

- **D-01:** **Server-side enforced.** Review submission goes through an Express endpoint that verifies (via Firebase Admin / Firestore) the authenticated user has a SubOrder in `Delivered` status containing the reviewed product before the review is written. The `verified` flag (and badge) is **set on the server** — the client cannot fake it. Builds on Phase 2 order lifecycle + Phase 5 delivery confirmation as the single source of truth. **Reason:** the current `addReview` performs no eligibility check and trusts the caller-supplied `verified` boolean — a security gap that must be closed server-side.
- **D-01b:** Eligibility = at least one `Delivered` SubOrder for that user containing the product. One review per delivered purchase (exact dedup/window precision = Claude's discretion; reuse existing `checkUserReview`).

### Review Moderation Policy

- **D-02:** **Hybrid moderation.** Verified-purchase reviews are **auto-approved** (`status: 'approved'`) and appear instantly; non-verified or flagged reviews go to `status: 'pending'` for admin review via the existing `AdminReviews` page. Reuses the existing `pending/approved/rejected` state machine and `approveReview`/`rejectReview` — no new moderation infra. **Reason:** balances speed (verified buyers see their review immediately) with abuse control on unverified content.

### Seller Rating Summary (REV-03)

- **D-03:** **Aggregate from the seller's product reviews.** Seller-level average / count / star-distribution is derived by aggregating reviews across all the seller's products. Reuses existing review data and the existing `computeReviewStats` logic, lifted to seller scope — no separate seller-review flow/UI is introduced. The existing `sellerRatingService` "performance score" stays as-is; this adds the simple star summary the success criterion requires. Display on store page **and** product detail page.

### Q&A Notification & Answering (REV-04)

- **D-04:** **Seller-only answers, dual-channel notification.** On a new question, notify the seller via **both** in-app (existing `NotificationContext`) **and** email (existing `emailService`). Public answers may be written **only by the seller** (no community answering for now). Extends `productQuestionService` (`askQuestion`/`answerQuestion`) which currently has zero notification wiring. **Reason:** Trendyol-style model; dual-channel ensures the seller doesn't miss questions even if not in the dashboard.

### Claude's Discretion

- REV-02 photo handling: enforce max 5 photos, gallery/lightbox display on product page (reuse `ReviewSection`/`ReviewCard`), upload via existing `uploadReviewPhoto`.
- Review sorting/filtering UX (existing `ReviewFilters` reuse), distribution-bar UI in `RatingSummary`.
- Exact one-review-per-purchase dedup rule and any review-edit window.
- Notification copy/templates for the Q&A seller notification.
- Whether seller-rating aggregation is computed on read vs. denormalized/cached (planner decides based on read volume; default: compute-on-read reusing `computeReviewStats`).
- Firestore security rules updates so review writes go through the server path and Q&A answer writes are restricted to the product's seller.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements

- `.planning/ROADMAP.md` § "Phase 7: Reviews & Trust" — goal + 4 success criteria.
- `.planning/REQUIREMENTS.md` — REV-01..REV-04 definitions (Turkish).

### Existing review/Q&A services (primary reuse targets)

- `src/services/reviewService.ts` — `addReview`, `getReviewsByProduct`, `subscribeToProductReviews`, `checkUserReview`, `approve/rejectReview`, `computeReviewStats`, `getReviewStats`, `voteReviewHelpful`, `uploadReviewPhoto`, `addSellerResponse`. **Note:** `addReview` currently does NO purchase verification — D-01 closes this.
- `src/services/sellerRatingService.ts` — `calcSellerPerformance` (performance score; stays as-is, REV-03 adds star summary alongside).
- `src/services/productQuestionService.ts` — `getQuestions`, `askQuestion`, `answerQuestion`, `voteQuestionHelpful`. **Note:** no notification wiring today — D-04 adds it.

### Existing UI components (reuse, don't rebuild)

- `src/components/product/ReviewSection.tsx`, `ReviewForm.tsx`, `ReviewCard.tsx`, `ReviewFilters.tsx`, `RatingSummary.tsx` — review display/entry/summary.
- `src/components/product/QASection.tsx`, `QuestionCard.tsx` — Q&A display.
- `src/components/product/SellerCard.tsx`, `src/components/seo/schemas.ts` — store/SEO rating surfaces.
- `src/pages/AdminReviews.tsx` — existing moderation panel (hybrid policy reuses it).

### Domain types

- `src/types.ts` § `interface Review` (line ~52) — already has `verified`, `photos[]`, `status`, `sellerId`, `categoryRatings`, `helpfulCount/Voters`. Q&A type in `productQuestionService` / types.

### Cross-phase dependencies (source of truth for "verified")

- Phase 2 order lifecycle (SubOrder state machine: `Delivered` state) and Phase 5 delivery confirmation — gate review eligibility on these.
- `.planning/phases/02-payment-order-lifecycle/02-CONTEXT.md`, `.planning/phases/05-shipping-fulfillment/05-CONTEXT.md`.

### Integration infra to reuse for notifications

- `NotificationContext` (in-app notifications) + existing `emailService` (transactional email from Phase 2) — both used by D-04.

### Codebase maps

- `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`, `INTEGRATIONS.md` — service-layer + error-handling patterns to follow.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Full review stack already present: `reviewService.ts` + 5 product review components + `AdminReviews` moderation page. Phase work is enforcement/aggregation/notification, not new UI from scratch.
- `Review` type already carries `verified`, `photos[]`, `status`, `sellerId`, `categoryRatings` — no schema migration needed for the core fields.
- `uploadReviewPhoto` already implements Firebase Storage upload for review photos (REV-02 foundation).
- `computeReviewStats` already produces average/count/distribution at product scope — lift to seller scope for REV-03.
- `NotificationContext` + `emailService` already exist (Phase 2) — wire into Q&A for REV-04.

### Established Patterns

- Service-layer functions wrap Firestore in try/catch + `handleFirestoreError`; reads degrade gracefully (return `[]`). New service code must match.
- Server REST endpoints follow the dependency-injection `deps` pattern (`server/routes/*.ts`) with `verifyFirebaseToken` — the new verified-review endpoint follows this (mirrors Stripe/Iyzico route registration).
- Moderation state machine (`pending`→`approved`/`rejected`) is the reuse target for hybrid policy.

### Integration Points

- New verified-review Express endpoint reads SubOrder/order data (Firebase Admin) to confirm `Delivered` before writing the review.
- Q&A `askQuestion` → emit in-app notification + email to the product's seller.
- Seller store page + product detail page consume the new seller-level rating summary.
- Firestore security rules: restrict review writes to the server path; restrict Q&A answer writes to the product's seller.

</code_context>

<specifics>
## Specific Ideas

- "Doğrulanmış Alıcı" (Verified Purchase) badge wording in Turkish on verified reviews.
- Trendyol-style Q&A model: public seller answer under each question, seller notified on new questions.
- User explicitly requested the discussion in Turkish (founder preference) — does not affect implementation, only this session's communication.

</specifics>

<deferred>
## Deferred Ideas

- Community Q&A (other buyers answering questions) — considered and deferred; seller-only answers for now. Revisit if Q&A volume warrants it.
- Separate seller-direct rating flow (buyers rating the seller independently of products, e.g., shipping/communication) — deferred; REV-03 uses product-review aggregation. Could become its own enhancement.
- AI review summarization / sentiment — out of scope.

</deferred>

---

_Phase: 7-reviews-trust_
_Context gathered: 2026-06-04_
