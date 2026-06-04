# Phase 7: Reviews & Trust - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 7-reviews-trust
**Areas discussed:** Verified-purchase gating, Review moderation policy, Seller rating summary, Q&A notify + answering

> Note: founder requested the discussion be conducted in Turkish.

---

## Verified-Purchase Gating (REV-01)

| Option                   | Description                                                                                    | Selected |
| ------------------------ | ---------------------------------------------------------------------------------------------- | -------- |
| Server-side enforced     | Express endpoint verifies a `Delivered` SubOrder containing the product; badge set server-side | ✓        |
| Client + Firestore rules | Eligibility checked client-side, constrained by security rules                                 |          |
| You decide               | Planner picks safest method                                                                    |          |

**User's choice:** Server-side enforced (recommended)
**Notes:** Closes the current gap where `addReview` trusts a caller-supplied `verified` flag. Uses Phase 2 order lifecycle + Phase 5 delivery confirmation as source of truth.

---

## Review Moderation Policy

| Option             | Description                                                                  | Selected |
| ------------------ | ---------------------------------------------------------------------------- | -------- |
| Hybrid             | Verified reviews auto-approved/instant; unverified/flagged go to admin queue | ✓        |
| All auto-approve   | All reviews instant; AdminReviews used only for takedowns                    |          |
| All admin approval | Every review waits for admin (current behavior)                              |          |

**User's choice:** Hybrid (recommended)
**Notes:** Reuses existing `pending/approved/rejected` state machine + `AdminReviews` page.

---

## Seller Rating Summary (REV-03)

| Option                         | Description                                                                   | Selected |
| ------------------------------ | ----------------------------------------------------------------------------- | -------- |
| Aggregate from product reviews | Seller-level avg/count/distribution derived from the seller's product reviews | ✓        |
| Separate seller reviews        | Buyers rate the seller directly via `Review.sellerId`                         |          |
| Both                           | Product-derived + separate seller rating                                      |          |

**User's choice:** Aggregate from product reviews (recommended)
**Notes:** Reuses `computeReviewStats` lifted to seller scope; existing `sellerRatingService` performance score stays. Display on store + product pages.

---

## Q&A Notify + Answering (REV-04)

| Option                              | Description                                                             | Selected |
| ----------------------------------- | ----------------------------------------------------------------------- | -------- |
| In-app + email, seller-only answers | NotificationContext + emailService on new question; only seller replies | ✓        |
| In-app only, seller-only            | In-app notification only; no email                                      |          |
| Notify + community answers          | In-app + email; seller AND other buyers can answer                      |          |

**User's choice:** In-app + email, seller-only answers (recommended)
**Notes:** Trendyol-style. Q&A service currently has zero notification wiring.

---

## Claude's Discretion

- REV-02 photo handling (max 5, gallery/lightbox, reuse `uploadReviewPhoto`).
- Review sorting/filtering UX and distribution-bar UI.
- One-review-per-purchase dedup precision and any edit window.
- Q&A notification copy/templates.
- Seller-rating compute-on-read vs cached (default: compute-on-read).
- Firestore security rules for server-path review writes + seller-only Q&A answers.

## Deferred Ideas

- Community Q&A (buyers answering) — deferred; seller-only for now.
- Separate seller-direct rating flow (shipping/communication) — deferred.
- AI review summarization / sentiment — out of scope.
