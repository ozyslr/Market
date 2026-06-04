# Phase 4: Search & Discovery - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current search engine (Firestore queries / client-side `MOCK_PRODUCTS` filtering) with **Typesense** to deliver typo-tolerant full-text search, faceted filtering (price range, category, brand, rating, shipping option), sort options (newest, best-selling, price asc/desc, rating), and an index that auto-updates within seconds of product create/update/delete.

The existing search **UI** (`SearchResults.tsx`, `FilterPanel`, `ActiveFilters`, `ProductCard`) is reused largely as-is — this phase swaps the engine _behind_ the existing `searchProducts()` interface, it does not redesign the search experience.

**Out of scope (own phases / later):** product recommendations, AI/semantic search, multi-currency price display (Phase 6 — prices stay TRY-base here), shipping carrier integration (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Typesense Hosting & Client Access

- **D-01:** Use **Typesense Cloud** (managed) — no self-hosted infra; chosen for solo-dev operability (backups, scaling, upgrades handled).
- **D-02:** Browser queries Typesense **directly** using a scoped **search-only API key**. The admin/write API key is **server-side only** (never shipped to the client).

### Index Sync Strategy (SRC-05)

- **D-03:** Sync via **server write-through**, not Cloud Functions or polling. Product changes reach Typesense through an authenticated Express endpoint.
- **D-04:** Because product writes currently happen **client-side directly to Firestore**, the client calls a new authenticated **`POST /api/search/sync`** endpoint _after_ its Firestore write. The endpoint verifies the Firebase token + seller ownership, then upserts (create/update) or deletes the document in Typesense using the server-side admin key.
- **D-05:** Provide an **admin-triggered reindex endpoint** (e.g. `POST /api/admin/reindex`, admin-only) that bulk-imports all Firestore `products` into Typesense. This handles initial backfill **and** doubles as drift-recovery if any sync event is missed.

### Search Architecture & Fallback

- **D-06:** Layer Typesense **behind the existing `searchProducts()` interface** in `searchService.ts`. Typesense becomes the primary engine; the UI components (`SearchResults`, `FilterPanel`) stay untouched.
- **D-07:** **Keep the Firestore → MOCK_PRODUCTS fallback chain permanently** as a resilience layer — if Typesense is unreachable, search degrades gracefully rather than breaking the most critical buyer flow.

### Multilingual & Typo Tolerance (TR/EN/DE/AR)

- **D-08:** Use a **single Typesense collection/index**. Index whatever localized fields exist (e.g. `title_tr`/`title_en`/…) as searchable string fields and query across all of them; let Typesense rank the best match. (Not separate indexes per language.)
- **D-09:** Rely on **Typesense's native typo tolerance** and **drop the manual TR-normalization** (`ş→s`, `ğ→g`, `ı→i`, …) from the search path. Add a small **TR/EN synonym set** for common equivalents (e.g. `telefon`/`phone`) to improve relevance.

### Claude's Discretion

- Typesense schema field definitions, types, and `default_sorting_field` selection.
- Sort-field data sourcing — e.g. "best-selling" requires a sales/order-count signal on the product; the planner decides whether to use an existing field or derive/add a counter (products have order history from Phase 2).
- Facet multi-select UX details, facet-count display, pagination vs infinite scroll, search-as-you-type/autocomplete wiring — implement with sensible defaults consistent with the existing UI.
- Retry/error handling semantics for the `/api/search/sync` call (e.g. fire-and-forget vs awaited; reconcile via reindex on failure).
- Environment variable names and secret management for Typesense host/keys.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements

- `.planning/ROADMAP.md` § "Phase 4: Search & Discovery" — goal + 5 success criteria.
- `.planning/REQUIREMENTS.md` — SRC-01..SRC-05 definitions.

### Existing search implementation (reuse / refactor targets)

- `src/services/searchService.ts` — `searchProducts()`, `searchSuggestions()`, `applySearchFilters()`, `computeFacets()`, `getFacetedFilters()`, `SearchParams`/`SearchResult` interfaces, current Firestore-first → MOCK fallback. Typesense layers in here (D-06/D-07).
- `src/pages/SearchResults.tsx` — search UI page (grid/list toggle, filters, current TR normalization to be dropped from search path per D-09).
- `src/components/commerce/FilterPanel.tsx` — `FilterPanel`, `ActiveFilters`, `FacetCounts` (faceted filter UI — SRC-02).
- `src/components/commerce/ProductCard.tsx` — result card (image, price, rating, seller — SRC-04).
- `src/services/productService.ts` — product create/update/delete write paths that must trigger `/api/search/sync` (D-04).

### Server patterns to mirror

- `server/routes/sellerApi.ts` — existing API-key auth + rate-limit patterns (reference for new search/admin routes).
- `src/lib/authMiddleware.ts` / `server/` token verification — for `/api/search/sync` Firebase-token + ownership checks (D-04).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `searchService.searchProducts()`: stable interface to layer Typesense behind — keeps UI untouched.
- `FilterPanel` / `ActiveFilters` / `FacetCounts`: faceting UI already built; wire to Typesense facet counts.
- `ProductCard`: already renders image/price/rating/seller for SRC-04.
- `SearchResults.tsx`: full results page with grid/list, skeleton loading, SEO.

### Established Patterns

- Express route registration with DI `deps` object (see `server/routes/*.ts`); webhook/raw routes registered before JSON routes.
- Firebase Admin SDK server-side; Firebase client SDK for direct client→Firestore writes (the reason for the client-calls-sync-endpoint pattern in D-04).
- Service-layer `try/catch` + `handleFirestoreError`, graceful-degradation reads return fallbacks — mirrors the keep-fallback decision D-07.

### Integration Points

- New Express routes: `POST /api/search/sync` (seller, token+ownership) and `POST /api/admin/reindex` (admin-only).
- New Typesense client wrapper (server admin key + client search-only key config via env).
- Hook product write paths in `productService.ts` (and callers `ProductForm.tsx`, `SellerInventory.tsx`, `SellerImportCenter.tsx`, admin product edits) to call the sync endpoint.

</code_context>

<specifics>
## Specific Ideas

- Typo tolerance acceptance example from ROADMAP: searching "telefon" must match "telefon"/phone-type listings (SRC-01).
- "Within seconds" freshness target for index updates (SRC-05) — drives the synchronous write-through choice over batch polling.

</specifics>

<deferred>
## Deferred Ideas

- **TR-character normalization on the search path** — being dropped in favor of Typesense typo tolerance + synonyms (D-09). The `normalizeTR` helper may still be used elsewhere (category matching) — do not delete globally, only remove from the Typesense query/index path.
- **Synonym expansion beyond the initial TR/EN set** — relevance tuning pass deferred; ship a small curated set first.
- **Multi-currency price display in results** — Phase 6.
- **Semantic / AI-powered search & recommendations** — separate future phase.

None of the above are in Phase 4 scope.

</deferred>

---

_Phase: 04-search-discovery_
_Context gathered: 2026-06-04_
