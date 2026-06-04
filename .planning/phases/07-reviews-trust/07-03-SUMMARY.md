---
phase: 07-reviews-trust
plan: 03
type: summary
requirements: [REV-03]
status: complete
---

# 07-03 Summary — Seller Rating Summary

## What was built

A compute-on-read seller reputation summary (average, total count, star
distribution) aggregated from a seller's **approved** reviews across all their
products (REV-03, D-03), surfaced on the product detail page and the store page,
plus a Store JSON-LD `aggregateRating`.

## Must-Haves — verification

| Truth                                                         | Status | Evidence                                                                                                           |
| ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| Store page shows average, count, distribution                 | ✅     | `SellerStore.tsx` reviews tab renders `<SellerRatingSummary>` from live `getSellerStarSummary(sellerData.id)`.     |
| Product detail page shows the seller summary                  | ✅     | `SellerCard.tsx` fetches on mount and renders `<SellerRatingSummary>` (SellerCard is used in `ProductDetail.tsx`). |
| Aggregates approved reviews across the seller's products      | ✅     | Service queries `reviews` where `sellerId==X && status=='approved'`.                                               |
| D-03: lifted to seller scope; calcSellerPerformance untouched | ✅     | New `getSellerStarSummary`; `calcSellerPerformance` unchanged.                                                     |

## Verification run

- `npx vitest run src/services/sellerRatingService.test.ts` → 4/4 pass (aggregate / empty / pending-excluded / graceful-error)
- `npx tsc --noEmit` → clean

## Key files

- Created: `src/services/sellerRatingService.test.ts`
- Modified: `src/services/sellerRatingService.ts` (+`getSellerStarSummary`, +`SellerStarSummary`), `src/components/product/RatingSummary.tsx` (+`SellerRatingSummary` variant), `src/components/product/SellerCard.tsx` (fetch+render), `src/components/seo/schemas.ts` (+`sellerStoreSchema`), `src/pages/SellerStore.tsx` (store-page render)

## Deviations from plan (justified)

1. **Inlined the aggregation math** instead of importing `computeReviewStats` (PATTERNS explicitly permits "or inline identical logic"). Keeps the service free of reviewService's firebase/storage + notification import chain, which made unit-testing clean. A defensive in-code `status==='approved'` filter backs up the query filter.
2. **Added `src/pages/SellerStore.tsx`** (not in the plan's files_modified). The store-page must-have could not be met otherwise — `SellerCard` only renders on `ProductDetail`, so the store page needed its own fetch+render. Inserted a live summary block in the reviews tab (the pre-existing block there was hardcoded mock data).
3. **`sellerStoreSchema`** added as a new `Store` JSON-LD helper (no seller schema existed); `aggregateRating` emitted only when `reviewCount > 0`, per acceptance.

## Self-Check: PASSED
