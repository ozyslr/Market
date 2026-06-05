---
phase: 09-performance
plan: 04
subsystem: firestore
tags: [indexes, query-optimization, firestore, performance]
requires: []
provides: [PERF-04]
affects: [productService, searchService, orderService, reviewService]
tech-stack:
  patterns:
    - Firestore composite indexes
    - Hybrid Firestore+client-side filtering
    - onSnapshot with limit() for bounded real-time listeners
key-files:
  created: []
  modified:
    - firestore.indexes.json
    - src/services/productService.ts
    - src/services/searchService.ts
    - src/services/orderService.ts
    - src/services/reviewService.ts
decisions:
  - D-PERF-05: Added 5 composite indexes for hot-path queries (products, reviews). Deploy via `firebase deploy --only firestore:indexes`
  - Hybrid filtering: categoryId, sellerId, featured, isFlashDeal, isTrending, status pushed to Firestore; price/rating/brand/tag remain client-side
  - onSnapshot listeners capped at limit(50) to bound real-time data sets
  - sellerIds+createdAt composite index deferred (not blocking; Firestore auto-indexes array-contains single-field)
metrics:
  duration_seconds: 600
  completed_date: 2026-06-05
---

# Phase 9 Plan 4: Firestore Indexes + Query Optimization Summary

**One-liner:** Added 5 composite Firestore indexes and pushed common filters from client-side JS to server-side where/orderBy/limit, capping real-time listeners at 50 docs.

## Tasks Completed

| Task | Name                                           | Commit    | Files                                                                                            |
| ---- | ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| 1    | Add composite indexes for hot-path queries     | `6592ff4` | `firestore.indexes.json`                                                                         |
| 2    | Push filtering to Firestore in product listing | `74c1ae6` | `src/services/productService.ts`                                                                 |
| 3    | Review and optimize remaining hot-path queries | `11de16d` | `src/services/searchService.ts`, `src/services/orderService.ts`, `src/services/reviewService.ts` |

## What Was Done

### Task 1: Composite Indexes

Added 5 new composite indexes to `firestore.indexes.json` (9 total):

| #   | Collection | Fields                       | Use Case                       |
| --- | ---------- | ---------------------------- | ------------------------------ |
| 5   | products   | categoryId+status+createdAt  | Category listing, newest first |
| 6   | products   | sellerId+status+createdAt    | Seller inventory listing       |
| 7   | products   | featured+status+createdAt    | Home page featured products    |
| 8   | reviews    | productId+createdAt          | Product detail reviews         |
| 9   | products   | isFlashDeal+status+createdAt | Flash deals section            |

Index #5 from the plan (orders: userId+createdAt) was already the first existing index — skipped per plan instructions.

**Deployment note:** Run `firebase deploy --only firestore:indexes` after merge.

### Task 2: Product Listing Query Optimization

Refactored `getProducts()` in `productService.ts`:

- **Firestore-level (indexed):** categoryId, sellerId, featured, isFlashDeal, isTrending, status='approved'
- **Always applied:** orderBy('createdAt', 'desc'), limit(N) (default 50)
- **Client-side (remaining):** price range, brand, tag, rating, inStock, bestSeller, newArrival, isAiPick, hasDiscount
- `console.warn` signals when client-side pass is still needed (index opportunity signal)
- MOCK_PRODUCTS fallback preserved for offline/error states

### Task 3: Hot-Path Query Review

**searchService.ts:**

- Added `where('status', '==', 'approved')` to base query — unapproved products never fetched
- Added cursor-pagination TODO comment for deep pagination at scale
- Full-text search note referencing phase4-search-typesense-deferred memory

**orderService.ts:**

- Added `limit(50)` to all three onSnapshot listeners (seller, buyer, admin)
- Documented missing sellerIds+createdAt composite index (not blocking; Firestore auto-indexes single-field array-contains)

**reviewService.ts:**

- Added `orderBy('createdAt', 'desc')` + `limit(50)` to both `getReviewsByProduct` and `subscribeToProductReviews`
- Removed redundant client-side sort (now Firestore-sorted)

## Deviations from Plan

### Plan Inaccuracies

**1. Index count mismatch:** Plan acceptance criteria said "6 new indexes (10 total)" but index #5 (orders: userId+createdAt) was already the first existing index. Only 5 new indexes were added (9 total). Plan action explicitly said "Only add indexes that don't duplicate existing ones" — directive followed correctly.

### Parallel Execution Artifact

**2. Task 3 commit in parallel executor:** Task 3 changes (searchService, orderService, reviewService) were committed as part of `11de16d` by a parallel executor agent after lint-staged backup/restore merged them into its working tree. The changes are correct and complete in HEAD, but the commit message describes manualChunks vendor splitting rather than the query optimization work. No functional impact — changes are in the repo.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes at trust boundaries. Index definitions are deploy-time artifacts; query optimizations preserve existing filtering semantics.

## Known Stubs

None.

## Self-Check

All modified files verified in working tree. Commits verified in git history.
