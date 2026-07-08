---
phase: quick-260604-e5f
plan: 01
subsystem: search
tags: [search, filter, sort, firestore, normalization]
key-files:
  modified:
    - src/services/searchService.ts
    - src/components/commerce/FilterPanel.tsx
    - src/pages/SearchResults.tsx
decisions:
  - "'popular' sortBy value retained as canonical internal key; 'best-selling' is the UI-facing value from FilterPanel, mapped in SearchResults"
  - 'reviewsCount used as best-selling proxy — no explicit salesCount field exists on Product'
metrics:
  completed: '2026-06-04'
  tasks: 3
  files_modified: 3
---

# Phase quick-260604-e5f Plan 01: Firestore-Only Search Improvement Summary

**One-liner:** Exported normalizeTR, added minRating filter end-to-end (Firestore + client-side), and wired best-selling sort from FilterPanel through to results via mapSortValue mapping.

## Tasks Completed

| Task | Name                                                 | Commit  | Files                                   |
| ---- | ---------------------------------------------------- | ------- | --------------------------------------- |
| 1    | Add minRating to SearchParams and wire rating filter | f428fc7 | src/services/searchService.ts           |
| 2    | Add best-selling sort option to FilterPanel          | b83b172 | src/components/commerce/FilterPanel.tsx |
| 3    | Wire sort mapping and remove normalizeTR duplicate   | 60d9b63 | src/pages/SearchResults.tsx             |

## What Was Built

- **searchService.ts:** `normalizeTR` exported; `SearchParams.minRating?: number` added; `applySearchFilters` filters by `minRating` after `inStock` block; `searchFirestore` adds `where('rating', '>=', minRating)` Firestore constraint before sorting block.
- **FilterPanel.tsx:** `SORT_OPTIONS` entry changed from `{ value: 'popular', label: 'En Popüler' }` to `{ value: 'best-selling', label: 'En Çok Satan' }`.
- **SearchResults.tsx:** Local `normalizeTR` function removed; imported from `@/services/searchService` alongside `getFacetedFilters`. `mapSortValue` helper added — maps `'best-selling'` → `'popular'` and passes through other values unchanged. Inline sort block uses `mappedSort` so best-selling correctly sorts by `reviewsCount` descending.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes are fully wired data-flow modifications, no placeholder values.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `src/services/searchService.ts` — exists, normalizeTR exported, minRating in SearchParams
- `src/components/commerce/FilterPanel.tsx` — exists, best-selling entry present
- `src/pages/SearchResults.tsx` — exists, normalizeTR imported not defined locally, mapSortValue present
- Commits f428fc7, b83b172, 60d9b63 — all on master branch
- `npm run lint` — 0 errors, 20 pre-existing warnings (no new issues introduced)
