---
phase: 12-search-storage-fix
plan: 02
type: execute
subsystem: search
requirements_addressed: [SRC-01, SRC-03, SRC-04]
---

# Plan 12-02 Summary: Typesense Setup & Firestore Sync

## Completed Tasks

### Task 1: Install Typesense and Create Service ✅

- Installed `typesense` 3.0.6 npm package
- Created `src/services/typesenseService.ts`:
  - Typesense client with env var config (TYPESENSE_HOST, PORT, PROTOCOL, API_KEY)
  - `searchProducts()` with facet filtering, language routing, pagination
  - `upsertProduct()` — transforms + upserts to per-language collections
  - `deleteProduct()` — removes from all language collections
  - `initializeCollections()` — creates products_tr/en/de/ar with locale analyzers
  - `getIndexStatus()` — returns document counts per collection
- Created `server/routes/typesenseSync.ts`:
  - POST /api/typesense/sync/product — upsert product
  - DELETE /api/typesense/sync/product/:id — remove product
  - GET /api/typesense/sync/status — index statistics
  - POST /api/typesense/sync/reindex — admin full re-index (Firebase auth required)

### Task 2: Bootstrap Script ✅

- Created `scripts/bootstrap-typesense.mjs`:
  - Cursor pagination (500 products/batch)
  - Progress output during indexing
  - Final status summary with collection counts

### Task 3: Admin Re-Index Controls ✅

- Re-index endpoint with Firebase auth verification via middleware
- Status endpoint for dashboard integration

## Files Modified/Created

- `package.json` — added typesense dependency
- `server.ts` — registered typesense sync routes
- `.env.example` — added TYPESENSE env vars
- `src/services/typesenseService.ts` (NEW) — Typesense client + operations
- `server/routes/typesenseSync.ts` (NEW) — sync webhook + admin re-index
- `scripts/bootstrap-typesense.mjs` (NEW) — initial index bootstrap
- `src/services/productService.ts` — fire-and-forget sync calls on create/update/delete

## Verification

- [x] `tsc --noEmit` passes
- [ ] Typesense server running with valid API key
- [ ] `node scripts/bootstrap-typesense.mjs` — manual bootstrap
- [ ] Product create/update/delete triggers sync

## Notes

- Typesense Cloud or self-hosted instance required before bootstrap
- Sync from productService uses fire-and-forget pattern — won't block product ops
