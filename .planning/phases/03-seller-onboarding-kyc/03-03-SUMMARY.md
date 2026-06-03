---
phase: 03-seller-onboarding-kyc
plan: 03
subsystem: seller-bulk-import
tags: [csv, bulk-import, ssrf, firebase-storage, papaparse]
requires:
  - 03-01 (KYC pipeline — seller auth context)
  - 03-02 (product validation — category taxonomy, min-1-photo)
provides:
  - POST /api/products/csv-import (multipart, partial import, error report)
  - GET /api/products/csv-export (seller-scoped UTF-8 BOM CSV)
  - SellerImportCenter server-side CSV import UI (drag-drop, result banner, export)
affects:
  - server.ts (route registration)
  - products Firestore collection (batch writes)
  - Firebase Storage products/{sellerId}/ path
tech-stack:
  added: []
  patterns: [registerXxxRoutes-factory, per-row-zod-validation, ssrf-blocklist, firestore-batch-500]
key-files:
  created:
    - server/routes/csvImport.ts
  modified:
    - server.ts
    - src/pages/SellerImportCenter.tsx
decisions:
  - 'D-07: partial import — invalid rows skipped with per-row {row, field, reason}; valid rows still committed'
  - 'D-08: image_url fetched server-side to Firebase Storage; min 1 image enforced per row'
  - 'D-09: CSV category validated against platform taxonomy built from categories collection; unknown category fails the row'
metrics:
  duration: ~35m
  completed: 2026-06-03
requirements: [SEL-05]
---

# Phase 3 Plan 03: CSV Bulk Import & Export Summary

Server-validated CSV bulk product import with partial-import semantics, SSRF-safe server-side image fetch to Firebase Storage, category taxonomy enforcement, downloadable per-row error report, and seller-scoped CSV export — wired into a drag-drop Import Center UI.

## What Was Built

### Task 1 — `server/routes/csvImport.ts` + `server.ts` (commit 57184b6)

- `registerCsvImportRoutes(app, { adminDb, verifyFirebaseToken })` factory matching the codebase's `registerXxxRoutes` pattern.
- **POST /api/products/csv-import** (verifyFirebaseToken):
  - Custom multipart/form-data parser (`readMultipartFile`) — no new dependency; enforces 10 MB cap during streaming (T-03-13).
  - Builds `platformCategorySet` once from the `categories` collection (doc id + slug + name, lowercased) — D-09 / T-03-14.
  - `Papa.parse` with `header`, `skipEmptyLines`, `transformHeader` trim+lowercase.
  - Per-row `csvRowSchema` (Zod, coerced price/stock) → on failure pushes `{ row, field, reason }` per issue and skips (D-07).
  - Category check → unknown category fails the row with `Unknown category: "X"`.
  - `fetchImageToStorage`: SSRF-hardened (private-IP/loopback/169.254 blocklist, https-in-prod, content-type `image/*`, 5 MB cap, `AbortSignal.timeout(10_000)`). Pipe-separated URLs, first 5, min 1 success required (D-08 / T-03-12).
  - Valid rows written via Firestore batches of 500; `sellerId` always from `req.uid`, never CSV (T-03-16).
  - Response `{ imported, skipped, errors }`.
- **GET /api/products/csv-export** (verifyFirebaseToken): queries `products where sellerId == req.uid` (T-03-15), `Papa.unparse` with fixed columns, UTF-8 BOM prefix, `attachment; filename="products-export.csv"`.
- Registered in `server.ts` after refund routes. `express.json()` only parses JSON content-type, so the multipart stream reaches the handler intact.

### Task 2 — `src/pages/SellerImportCenter.tsx` (commit eedda1c)

- New server-import block in the CSV tab: dashed dropzone with `isDragging` accent border, file chip (name + formatted size).
- `handleServerImport` POSTs FormData with `Authorization: Bearer <token>` (token via local `getAuthToken` → `firebase/auth` currentUser, since `useAuth().user` is a `UserProfile` without `getIdToken`).
- Import result banner via `motion.div` (green/red by `imported > 0`); shows `{imported} products imported / {skipped} rows skipped`.
- `downloadErrorReport` → `Papa.unparse(errors, { columns: ['row','field','reason'] })` + BOM, downloads `import-errors-{YYYY-MM-DD}.csv`.
- Export Products button → GET csv-export, downloads `products-export.csv`.
- Existing client-side quick-preview upload retained below the new server flow.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] csvRowSchema not present in schemas.ts**

- **Found during:** Task 1. Plan's interface section assumed `csvRowSchema` was added in Plan 01; grep found no such export.
- **Fix:** Defined `csvRowSchema` locally in `csvImport.ts` (Zod, coerced price/stock, trimmed strings).
- **Files:** server/routes/csvImport.ts · **Commit:** 57184b6

**2. [Rule 3 - Blocking] No multipart parser available**

- **Found during:** Task 1. No multer/busboy installed; package installs are excluded from auto-fix.
- **Fix:** Implemented a minimal buffer-based multipart parser inline (no new dependency, honoring threat-register "no new packages").
- **Files:** server/routes/csvImport.ts · **Commit:** 57184b6

**3. [Rule 1 - Bug] `user.getIdToken()` type error**

- **Found during:** Task 2. `useAuth().user` is `UserProfile`, lacks `getIdToken`.
- **Fix:** Added local `getAuthToken()` using `firebase/auth` `getAuth().currentUser` (matches commissionService pattern).
- **Files:** src/pages/SellerImportCenter.tsx · **Commit:** eedda1c

**4. [Rule 3 - Blocking] ESLint no-irregular-whitespace on literal BOM**

- **Found during:** both tasks (pre-commit hook). Literal `﻿` BOM chars failed lint.
- **Fix:** Replaced literal BOM with `﻿` escape sequences.
- **Files:** server/routes/csvImport.ts, src/pages/SellerImportCenter.tsx

## Threat Model Coverage

| Threat ID                   | Mitigation implemented                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------- |
| T-03-12 (SSRF)              | `SSRF_BLOCK` regex, https-in-prod, content-type + 5 MB guards in `fetchImageToStorage` |
| T-03-13 (DoS oversized CSV) | 10 MB streaming cap + `AbortSignal.timeout(10_000)` on image fetch                     |
| T-03-14 (category bypass)   | `platformCategorySet` from Firestore; unknown category fails row                       |
| T-03-15 (export leak)       | export query scoped to `sellerId == req.uid`                                           |
| T-03-16 (sellerId spoof)    | batch write `sellerId` from `req.uid`, never CSV/body                                  |

## Verification

- `npx tsc --noEmit` — zero errors.
- `npx eslint` on both modified files — zero problems.
- Acceptance-criteria greps confirmed: `registerCsvImportRoutes` (csvImport.ts + server.ts), `SSRF_BLOCK`/`Private URLs`, `platformCategorySet`/`Unknown category`, `import-errors`/`csv-export`/`isDragging`, `motion.`, `Papa.unparse`.
- Manual runtime CSV upload / SSRF / export checks (items 2-6 in plan) are deferred to manual QA — no test harness in plan scope.

## Known Stubs

None. The existing client-side quick-preview upload (`confirmBulkUpload`) is retained as a separate convenience path and is fully wired to `createProduct`.

## Self-Check: PASSED

- FOUND: server/routes/csvImport.ts
- FOUND: commit 57184b6 (Task 1)
- FOUND: commit eedda1c (Task 2)
- server.ts and src/pages/SellerImportCenter.tsx modified and committed
