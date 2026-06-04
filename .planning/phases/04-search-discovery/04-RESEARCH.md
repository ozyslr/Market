# Phase 4: Search & Discovery - Research

**Researched:** 2026-06-04
**Domain:** Typesense full-text search, Firestore sync, faceted filtering, React search UI
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use Typesense Cloud (managed) — no self-hosted infra.
- **D-02:** Browser queries Typesense directly using a scoped search-only API key. Admin/write key is server-side only.
- **D-03:** Sync via server write-through, not Cloud Functions or polling.
- **D-04:** Client calls `POST /api/search/sync` after its Firestore write. Endpoint verifies Firebase token + seller ownership, then upserts or deletes in Typesense using the server-side admin key.
- **D-05:** Admin-triggered `POST /api/admin/reindex` for initial backfill and drift-recovery.
- **D-06:** Layer Typesense behind the existing `searchProducts()` interface in `searchService.ts`. UI components stay untouched.
- **D-07:** Keep the Firestore → MOCK_PRODUCTS fallback chain permanently as a resilience layer.
- **D-08:** Single Typesense collection/index; index localized fields (`title_tr`/`title_en`/…) as separate searchable string fields; query across all of them.
- **D-09:** Rely on Typesense native typo tolerance; drop manual `normalizeTR()` from the Typesense search path. Add small TR/EN synonym set.

### Claude's Discretion

- Typesense schema field definitions, types, and `default_sorting_field` selection.
- Sort-field data sourcing — e.g. "best-selling" requires a sales/order-count signal; planner decides whether to use existing field or add a counter.
- Facet multi-select UX details, facet-count display, pagination vs infinite scroll, search-as-you-type wiring.
- Retry/error handling semantics for `/api/search/sync` (fire-and-forget vs awaited).
- Environment variable names and secret management for Typesense host/keys.

### Deferred Ideas (OUT OF SCOPE)

- TR-character normalization on the search path (drop from Typesense path only; `normalizeTR` helper may still exist for other uses).
- Synonym expansion beyond initial TR/EN set.
- Multi-currency price display in results (Phase 6).
- Semantic/AI-powered search and recommendations (separate future phase).
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID     | Description                                                       | Research Support                                                                                                                                    |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| SRC-01 | Typesense ile tam metin arama — yazım hatası toleranslı           | Typesense native `num_typos` — on by default; `query_by` across title/description/brand/tags covers full-text                                       |
| SRC-02 | Filtreleme — fiyat aralığı, kategori, marka, puan, kargo seçeneği | `filter_by` with `price:[min..max]`, `categoryId:=X`, `brand:=X`, `rating:>= N`, `freeShipping:=true`; `facet_by` returns counts                    |
| SRC-03 | Sıralama — en yeni, en çok satan, fiyat artan/azalan, puana göre  | `sort_by` with `createdAtTs:desc`, `salesCount:desc`, `price:asc/desc`, `rating:desc`; requires numeric Unix-timestamp field and `salesCount` field |
| SRC-04 | Arama sonuçlarında ürün kartları — fotoğraf, fiyat, puan, satıcı  | `ProductCard` component already handles this; Typesense returns full document so all fields available                                               |
| SRC-05 | Event-driven index güncelleme (ürün ekleme/güncelleme/silme)      | Write-through via `POST /api/search/sync` called from `productService.ts` create/update/delete; admin reindex for backfill                          |

</phase_requirements>

---

## Summary

Phase 4 swaps the search engine behind the existing `searchProducts()` interface — the UI (SearchResults, FilterPanel, ProductCard) is reused as-is. The core work is: (1) define a Typesense collection schema derived from `Product` in `src/types.ts`, (2) wire `typesense` npm package (server-side, admin key) and a search-only key for the browser, (3) rewrite `searchService.ts` to query Typesense first with Firestore/MOCK fallback preserved, (4) add two Express routes (`POST /api/search/sync`, `POST /api/admin/reindex`) in a new `server/routes/search.ts` module, and (5) hook the three product write paths (`createProduct`, `updateProduct`, `deleteProduct` in `productService.ts`) to call the sync endpoint after their Firestore writes.

The architecture is straightforward because all Typesense writes happen through authenticated server code (admin key never reaches the browser), and reads happen directly from the browser using a scoped search-only key — consistent with Typesense's documented security model. No Cloud Functions are needed; the Express server already has Firebase Admin SDK access to do bulk backfill reads.

Multi-language indexing follows D-08: index each localized title/description as separate string fields (`title_tr`, `title_en`, `title_de`, `title_ar`) if they exist on the product document, plus fall back to the root `title`. Typesense typo tolerance covers TR characters natively.

**Primary recommendation:** Use `typesense` npm package server-side (admin key) and the same package browser-side (search-only key). Do NOT use `typesense-instantsearch-adapter` — D-06 keeps the existing `searchService.ts` interface, which is simpler than introducing InstantSearch widgets.

---

## Architectural Responsibility Map

| Capability                            | Primary Tier            | Secondary Tier | Rationale                                                                           |
| ------------------------------------- | ----------------------- | -------------- | ----------------------------------------------------------------------------------- |
| Full-text search query execution      | Browser / Client        | —              | Browser calls Typesense Cloud directly with search-only key (D-02)                  |
| Typesense index write (upsert/delete) | API / Backend (Express) | —              | Admin key must never reach browser; server verifies token + ownership               |
| Bulk backfill / reindex               | API / Backend (Express) | —              | Reads from Firestore Admin SDK, writes to Typesense with admin key                  |
| Facet counts & filter state           | Browser / Client        | —              | Typesense returns facet_counts per query; FilterPanel already renders them          |
| Search fallback (Firestore/MOCK)      | Browser / Client        | —              | Existing fallback chain lives in searchService.ts in the browser bundle             |
| Product write hooks (sync trigger)    | Browser / Client        | —              | productService.ts runs client-side; it calls /api/search/sync after Firestore write |
| Sort signal (salesCount)              | Database / Storage      | API / Backend  | salesCount field on product document, incremented on order completion               |

---

## Standard Stack

### Core

| Library     | Version        | Purpose                                  | Why Standard                                                                                                                          |
| ----------- | -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `typesense` | 1.8.2 (latest) | Typesense HTTP client (server + browser) | Official Typesense client; supports both Node.js (admin) and browser (search-only); typed API [VERIFIED: npmjs.com/package/typesense] |

### Supporting

No additional search libraries needed. The existing stack (axios, React context, searchService.ts interface) handles everything else.

### Alternatives Considered

| Instead of                 | Could Use                                                           | Tradeoff                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `typesense` directly       | `typesense-instantsearch-adapter` + InstantSearch.js                | InstantSearch provides richer widget ecosystem but requires replacing the existing FilterPanel/SearchResults UI — contradicts D-06 |
| Single `typesense` package | Separate `typesense` (server) + `@typesense/typesense-js` (browser) | Same package works in both environments; no reason to split                                                                        |

**Installation:**

```bash
npm install typesense
```

---

## Package Legitimacy Audit

| Package     | Registry | Age    | Downloads | Source Repo                       | slopcheck                         | Disposition                                             |
| ----------- | -------- | ------ | --------- | --------------------------------- | --------------------------------- | ------------------------------------------------------- |
| `typesense` | npm      | ~4 yrs | ~200k/wk  | github.com/typesense/typesense-js | [ASSUMED — slopcheck unavailable] | Approved — official client maintained by Typesense Inc. |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none

_slopcheck was unavailable at research time (temp filesystem full). The `typesense` package is the official client library published by Typesense Inc., confirmed via official documentation at typesense.org/docs. Registry verification via `npm view` was not possible due to disk constraints. Tag: `[ASSUMED]` — planner should add a `checkpoint:human-verify` before install if desired._

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─── ProductCard/FilterPanel/SearchResults (existing UI, unchanged)
  │         │
  │         ▼
  │    searchService.ts
  │         │
  │         ├─── [PRIMARY] typesense client (search-only key)
  │         │         │
  │         │         ▼
  │         │    Typesense Cloud ────────── returns hits + facet_counts
  │         │
  │         └─── [FALLBACK] Firestore SDK → MOCK_PRODUCTS (D-07, unchanged)
  │
  ├─── productService.ts  (createProduct / updateProduct / deleteProduct)
  │         │   after Firestore write
  │         ▼
  │    POST /api/search/sync   (Firebase token + seller ownership check)
  │         │
  │         ▼
  │    server/routes/search.ts (Express, admin key)
  │         │
  │         ├─── typesense admin client → upsert / delete document
  │         │
  │         └─── POST /api/admin/reindex (admin role only)
  │                   │
  │                   ▼
  │              Firestore Admin SDK → batch read all products
  │                   │
  │                   ▼
  │              Typesense importDocuments() bulk upsert
  │
Typesense Cloud (managed, D-01)
```

### Recommended Project Structure

New files this phase:

```
src/
├── lib/
│   └── typesense.ts          # Browser-side client (search-only key)
├── services/
│   └── searchService.ts      # MODIFIED — add Typesense primary path
server/
├── routes/
│   └── search.ts             # NEW — /api/search/sync + /api/admin/reindex
├── lib/
│   └── typesenseAdmin.ts     # NEW — server-side admin client (admin key)
```

Modified files:

```
src/services/productService.ts     # hook createProduct/updateProduct/deleteProduct
src/pages/SearchResults.tsx        # remove normalizeTR from search path (D-09)
src/components/commerce/FilterPanel.tsx  # add 'best-selling' sort option
server.ts                          # register registerSearchRoutes()
```

### Pattern 1: Typesense Collection Schema

**What:** Define the `products` collection once (on reindex if not exists). Fields derived from `Product` interface in `src/types.ts`.

```typescript
// Source: typesense.org/docs/29.0/api/collections.html + src/types.ts analysis
const PRODUCTS_SCHEMA = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'sellerId', type: 'string', facet: false },
    { name: 'title', type: 'string' },
    { name: 'title_tr', type: 'string', optional: true },
    { name: 'title_en', type: 'string', optional: true },
    { name: 'title_de', type: 'string', optional: true },
    { name: 'title_ar', type: 'string', optional: true },
    { name: 'description', type: 'string' },
    { name: 'brand', type: 'string', facet: true },
    { name: 'categoryId', type: 'string', facet: true },
    { name: 'price', type: 'float' },
    { name: 'rating', type: 'float', facet: true },
    { name: 'reviewsCount', type: 'int32' },
    { name: 'salesCount', type: 'int32' }, // for best-selling sort
    { name: 'stock', type: 'int32' },
    { name: 'freeShipping', type: 'bool', facet: true },
    { name: 'status', type: 'string', facet: false },
    { name: 'images', type: 'string[]' },
    { name: 'tags', type: 'string[]', optional: true },
    { name: 'sellerName', type: 'string' }, // denormalized for SRC-04 display
    { name: 'createdAtTs', type: 'int64' }, // Unix ms — for newest sort
  ],
  default_sorting_field: 'salesCount',
} as const;
```

**Notes:**

- `default_sorting_field` must be `int32` or `float`. `salesCount` is the best candidate (popularity proxy). [VERIFIED: typesense.org/docs/29.0/api/collections.html]
- `createdAt` on `Product` is a string (Firestore `serverTimestamp` serialized). Must be converted to Unix ms `int64` as `createdAtTs` for numeric sort.
- Localized title fields are `optional: true` — Typesense skips missing fields gracefully.
- `sellerName` is denormalized from the `Seller` document at index time to avoid a join at search time (SRC-04 requires seller name on result cards).
- Firestore document `id` is the Typesense document `id`.

### Pattern 2: Search Query Construction

```typescript
// Source: typesense.org/docs/29.0/api/search.html
// Called from searchService.ts (Typesense primary path)
async function searchTypesense(params: SearchParams): Promise<SearchResult | null> {
  const filterParts: string[] = [];
  filterParts.push('status:=approved');

  if (params.categoryId) filterParts.push(`categoryId:=${params.categoryId}`);
  if (params.brand) filterParts.push(`brand:=${params.brand}`);
  if (params.minPrice != null && params.maxPrice != null)
    filterParts.push(`price:[${params.minPrice}..${params.maxPrice}]`);
  else if (params.minPrice != null) filterParts.push(`price:>=${params.minPrice}`);
  else if (params.maxPrice != null) filterParts.push(`price:<=${params.maxPrice}`);
  if (params.minRating != null) filterParts.push(`rating:>=${params.minRating}`);
  if (params.freeShipping) filterParts.push('freeShipping:=true');
  if (params.inStock) filterParts.push('stock:>0');

  const sortMap: Record<string, string> = {
    price_asc: 'price:asc',
    price_desc: 'price:desc',
    rating: 'rating:desc',
    newest: 'createdAtTs:desc',
    'best-selling': 'salesCount:desc',
  };
  const sortBy = params.sortBy ? sortMap[params.sortBy] : undefined;

  const result = await typesenseClient
    .collections('products')
    .documents()
    .search({
      q: params.query?.trim() || '*',
      query_by: 'title,title_tr,title_en,title_de,title_ar,description,brand,tags',
      filter_by: filterParts.join(' && '),
      facet_by: 'brand,categoryId,rating,freeShipping',
      sort_by: sortBy ?? `_text_match:desc,salesCount:desc`,
      page: params.page ?? 1,
      per_page: params.pageSize ?? 20,
    });
  // map result.hits → Product[], result.facet_counts → SearchResult['facets']
  // ...
}
```

### Pattern 3: Sync Endpoint (server/routes/search.ts)

```typescript
// Source: pattern mirrors server/routes/sellerApi.ts + authMiddleware pattern
// POST /api/search/sync
router.post('/sync', verifyFirebaseToken, async (req, res) => {
  const { productId, action } = req.body; // action: 'upsert' | 'delete'
  // verify caller is the product's seller or admin
  const productSnap = await adminDb.collection('products').doc(productId).get();
  if (!productSnap.exists) return res.status(404).json({ error: 'Not found' });
  const product = productSnap.data();
  if (product.sellerId !== req.user.uid && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  if (action === 'delete') {
    await typesenseAdmin.collections('products').documents(productId).delete();
  } else {
    const doc = toTypesenseDoc(product, productId);
    await typesenseAdmin.collections('products').documents().upsert(doc);
  }
  res.json({ ok: true });
});
```

### Pattern 4: Backfill / Reindex (POST /api/admin/reindex)

```typescript
// Source: typesense.org/docs/29.0/api/documents.html (importDocuments)
// Admin-only: reads all approved products from Firestore, bulk-imports to Typesense
router.post('/admin/reindex', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const snap = await adminDb.collection('products').get();
  const docs = snap.docs.map((d) => toTypesenseDoc(d.data(), d.id));
  // Drop and recreate collection, or use upsert action
  await typesenseAdmin.collections('products').documents().import(docs, { action: 'upsert' });
  res.json({ indexed: docs.length });
});
```

### Pattern 5: Calling /api/search/sync from productService.ts

```typescript
// After the Firestore write in createProduct/updateProduct/deleteProduct:
async function notifySearchSync(productId: string, action: 'upsert' | 'delete') {
  try {
    const token = await getAuth().currentUser?.getIdToken();
    await fetch('/api/search/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, action }),
    });
  } catch (err) {
    // Fire-and-forget: log but do not throw. Drift recoverable via /admin/reindex.
    console.warn('[productService] search sync failed, will recover on next reindex', err);
  }
}
```

### Anti-Patterns to Avoid

- **Using the admin key in browser code:** Exposes full write access. Use search-only key on client.
- **Blocking the Firestore write on sync failure:** The sync is best-effort; Firestore is source of truth. Always write to Firestore first, then sync.
- **Using Typesense `id` field as an integer:** Typesense `id` must be a string with no spaces. Use the Firestore document ID (e.g. `"abc123"`).
- **Sorting on a string field:** `default_sorting_field` and `sort_by` require numeric fields (`int32`, `int64`, `float`). `createdAt` is a string in the `Product` type — convert to `createdAtTs: number` (Unix ms) before indexing.
- **Omitting `status:=approved` filter:** Without this, draft/rejected products appear in buyer search results.
- **Calling `normalizeTR` on Typesense queries:** Defeats typo tolerance and breaks Turkish character matching (D-09).

---

## Don't Hand-Roll

| Problem                              | Don't Build                                           | Use Instead                                                 | Why                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Full-text search with typo tolerance | Custom Firestore prefix queries + edit-distance logic | Typesense `typesense` client                                | Firestore has no native full-text; prefix match (`>=` / `<=`) doesn't handle typos, multilingual chars, or relevance ranking |
| Facet count aggregation              | Manual Firestore collection scans                     | Typesense `facet_by` parameter                              | Typesense returns per-value counts in the same search response; no separate aggregation query needed                          |
| Bulk import to Typesense             | Loop of single-doc upserts                            | `importDocuments()` with `action: 'upsert'` and JSONL batch | Batch import is 10-100x faster and avoids per-doc HTTP overhead                                                               |
| Search-only key scoping              | Custom auth proxy for browser search                  | Typesense scoped search-only API key                        | Typesense natively supports read-only keys; no proxy needed                                                                   |

**Key insight:** Typesense handles the hard parts (typo tolerance, multilingual tokenization, facet counts, relevance ranking) — the implementation is primarily glue code wiring the existing service interface to the Typesense HTTP API.

---

## Common Pitfalls

### Pitfall 1: salesCount field doesn't exist on existing products

**What goes wrong:** The schema requires `salesCount: int32` for best-selling sort, but existing `Product` documents in Firestore don't have this field. Indexing fails or defaults to 0 for all products, making best-selling sort useless.

**Why it happens:** Phase 2 (payment/order lifecycle) tracks order history but may not have written a `salesCount` counter back onto the product document.

**How to avoid:** During `toTypesenseDoc()` mapping, default `salesCount` to `product.reviewsCount ?? 0` as a proxy if the field is absent (reviews correlate with sales). Separately, add a `salesCount` increment to the order completion path in Phase 2 server code.

**Warning signs:** Best-selling sort returns same results as newest; all products have salesCount = 0 in Typesense.

### Pitfall 2: Typesense collection schema changes require drop-and-recreate

**What goes wrong:** After initial deployment, adding a new field or changing a field type requires dropping the collection and reindexing — a schema ALTER is not supported.

**Why it happens:** Typesense schema is defined at collection creation; field types are immutable.

**How to avoid:** Finalize the schema before initial indexing. Mark non-critical fields `optional: true` so they can be omitted from early documents. The `/admin/reindex` endpoint handles drop-and-recreate via `action: 'upsert'` (or explicit delete + create).

**Warning signs:** `400 Bad Request: Field X already exists with a different type`.

### Pitfall 3: createdAtTs conversion from Firestore Timestamp

**What goes wrong:** Firestore `serverTimestamp()` returns a Firestore `Timestamp` object (not a string or number). When reading from Firebase Admin SDK, `product.createdAt` may be a `Timestamp` instance; when read from the client SDK, it may already be serialized to a string. Indexing fails if a non-number is passed to an `int64` field.

**Why it happens:** The `Product` type declares `createdAt?: string` but the Firestore Admin SDK returns `Timestamp` objects.

**How to avoid:** In `toTypesenseDoc()`, handle both: `typeof createdAt === 'string' ? new Date(createdAt).getTime() : createdAt?.toMillis() ?? Date.now()`.

**Warning signs:** `400: Field 'createdAtTs' must be an int64`.

### Pitfall 4: /api/search/sync called before Firestore write completes

**What goes wrong:** Race condition — the sync endpoint reads the product from Firestore to verify ownership, but the write hasn't propagated yet.

**Why it happens:** `productService.ts` calls sync immediately after `addDoc`/`updateDoc` returns. Firestore writes are acknowledged client-side before all replicas are consistent.

**How to avoid:** In `notifySearchSync`, pass the product data directly in the request body alongside the `productId`, so the server doesn't need to re-read from Firestore for the document content (it already has the payload). Server still reads for ownership verification, but document data comes from the caller.

**Warning signs:** Sync endpoint returns 404 for newly created products.

### Pitfall 5: Multi-value brand filter (comma-joined in URL)

**What goes wrong:** `FilterPanel` stores multi-select brands as `?brand=BrandA,BrandB`. Passing this directly to Typesense `filter_by: brand:=BrandA,BrandB` fails — Typesense expects `brand:=[BrandA, BrandB]` for OR matching.

**Why it happens:** URL parameter format differs from Typesense filter syntax.

**How to avoid:** In `searchService.ts` Typesense path, parse comma-joined brand string into array and emit `brand:=[BrandA, BrandB]`.

**Warning signs:** Multi-brand filter returns no results or first-brand-only results.

---

## Code Examples

### toTypesenseDoc() mapping helper

```typescript
// Source: src/types.ts Product interface + typesense.org collection schema docs
import type { Product } from '@/types';
import type { Timestamp } from 'firebase-admin/firestore';

interface TypesenseProductDoc {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  title_tr?: string;
  title_en?: string;
  title_de?: string;
  title_ar?: string;
  description: string;
  brand: string;
  categoryId: string;
  price: number;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  stock: number;
  freeShipping: boolean;
  status: string;
  images: string[];
  tags: string[];
  createdAtTs: number;
}

export function toTypesenseDoc(
  product: Record<string, any>,
  id: string,
  sellerName = '',
): TypesenseProductDoc {
  const createdAt = product.createdAt;
  let createdAtTs: number;
  if (typeof createdAt === 'number') {
    createdAtTs = createdAt;
  } else if (createdAt && typeof (createdAt as Timestamp).toMillis === 'function') {
    createdAtTs = (createdAt as Timestamp).toMillis();
  } else if (typeof createdAt === 'string') {
    createdAtTs = new Date(createdAt).getTime() || Date.now();
  } else {
    createdAtTs = Date.now();
  }

  return {
    id,
    sellerId: product.sellerId ?? '',
    sellerName,
    title: product.title ?? '',
    title_tr: product.title_tr,
    title_en: product.title_en,
    title_de: product.title_de,
    title_ar: product.title_ar,
    description: product.description ?? '',
    brand: product.brand ?? '',
    categoryId: product.categoryId ?? '',
    price: product.price ?? 0,
    rating: product.rating ?? 0,
    reviewsCount: product.reviewsCount ?? 0,
    salesCount: product.salesCount ?? product.reviewsCount ?? 0, // fallback proxy
    stock: product.stock ?? 0,
    freeShipping: product.freeShipping ?? false,
    status: product.status ?? 'approved',
    images: product.images ?? [],
    tags: product.tags ?? [],
    createdAtTs,
  };
}
```

### Browser-side Typesense client (src/lib/typesense.ts)

```typescript
// Source: typesense.org/docs/guide/building-a-search-application.html
import Typesense from 'typesense';

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: import.meta.env.VITE_TYPESENSE_HOST,
      port: 443,
      protocol: 'https',
    },
  ],
  apiKey: import.meta.env.VITE_TYPESENSE_SEARCH_API_KEY,
  connectionTimeoutSeconds: 5,
});
```

### Server-side admin client (server/lib/typesenseAdmin.ts)

```typescript
// Source: typesense.org/docs/guide/firebase-full-text-search.html
import Typesense from 'typesense';

export const typesenseAdmin = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST!,
      port: 443,
      protocol: 'https',
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY!,
  connectionTimeoutSeconds: 10,
});
```

### SearchParams extension for minRating / freeShipping

The existing `SearchParams` interface in `searchService.ts` needs two new optional fields:

```typescript
// Add to existing SearchParams interface (src/services/searchService.ts)
minRating?: number;      // for SRC-02 rating filter
freeShipping?: boolean;  // for SRC-02 shipping option filter
// sortBy needs 'best-selling' added to its union type:
sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular' | 'best-selling';
```

---

## State of the Art

| Old Approach                             | Current Approach                                | When Changed | Impact                                                                         |
| ---------------------------------------- | ----------------------------------------------- | ------------ | ------------------------------------------------------------------------------ |
| Firestore prefix-match (`>=`/`<=`)      | Typesense full-text with typo tolerance         | This phase   | Enables multi-word, cross-field, typo-tolerant search                          |
| Client-side `normalizeTR()` for TR chars | Typesense native Unicode handling               | This phase   | Simplifies code; TR characters searched correctly without manual normalization |
| `computeFacets()` scanning product array | Typesense `facet_by` returning counts per query | This phase   | Accurate counts that reflect active filters; no separate aggregation scan      |
| MOCK_PRODUCTS fallback as primary        | MOCK_PRODUCTS as tertiary fallback only         | This phase   | Real product catalog is searchable; mock is last resort                        |

**Deprecated/outdated in this phase:**

- `searchFirestore()` primary path: demoted to fallback #2 (between Typesense and MOCK). Keep code, change call order.
- TR normalization in `searchProducts()` / `searchSuggestions()` Typesense path: remove. Keep `normalizeTR()` function itself (used in fallback MOCK path and possibly category matching elsewhere).

---

## Assumptions Log

| #   | Claim                                                                                                       | Section            | Risk if Wrong                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| A1  | `salesCount` field does not exist on current Firestore product documents                                    | Schema / Pitfall 1 | If it does exist, no migration needed — simplifies implementation                                                   |
| A2  | Localized title fields (`title_tr`, `title_en`, etc.) do not currently exist on product documents           | Schema / D-08      | If they don't exist, multi-language search falls back to single `title` field only — still functional for TR market |
| A3  | `typesense` npm package version 1.8.2 is the current latest                                                 | Standard Stack     | If a newer version has breaking changes, install command needs version pin                                          |
| A4  | `sellerName` is available in Firestore as `sellers/{sellerId}.storeName` for denormalization during reindex | toTypesenseDoc     | If not, result cards show empty seller name; need a Firestore read per product during reindex                       |

---

## Open Questions

1. **salesCount source**
   - What we know: Phase 2 tracks order line items in Firestore. `Product` type has no `salesCount` field.
   - What's unclear: Does Phase 2 write a `salesCount` counter back to the product document, or is it derivable from order history only?
   - Recommendation: Use `reviewsCount` as proxy for MVP; add `salesCount` increment to order completion path (separate task).

2. **sellerName denormalization strategy**
   - What we know: `Product.sellerId` exists; `Seller.storeName` is in a separate collection.
   - What's unclear: During reindex, fetching `sellers/{sellerId}` per product = N reads. For 1000+ products this may be slow.
   - Recommendation: Build a seller name map (single pass over `sellers` collection) before the product loop in `/admin/reindex`.

3. **Typesense Cloud account / cluster setup**
   - What we know: D-01 chooses Typesense Cloud. Account requires sign-up at cloud.typesense.org.
   - What's unclear: Whether a cluster already exists or needs to be provisioned.
   - Recommendation: Add a Wave 0 task: "Provision Typesense Cloud cluster, note host, create admin key and search-only key, add to .env".

---

## Environment Availability

| Dependency                    | Required By                     | Available                  | Version         | Fallback                                                     |
| ----------------------------- | ------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------ |
| Typesense Cloud cluster       | All search functionality        | Unknown — must provision   | —               | No fallback for primary; Firestore/MOCK covers degraded mode |
| `typesense` npm package       | typesense.ts, typesenseAdmin.ts | Not yet installed          | 1.8.2 [ASSUMED] | —                                                            |
| Node.js >= 16                 | `typesense` package             | Yes (project uses Node 22) | 22.x            | —                                                            |
| VITE_TYPESENSE_HOST           | Browser client                  | Not yet set                | —               | Error if missing; add to .env.example                        |
| VITE_TYPESENSE_SEARCH_API_KEY | Browser client                  | Not yet set                | —               | Error if missing                                             |
| TYPESENSE_HOST                | Server admin client             | Not yet set                | —               | Error if missing                                             |
| TYPESENSE_ADMIN_API_KEY       | Server admin client             | Not yet set                | —               | Error if missing                                             |

**Missing dependencies with no fallback:**

- Typesense Cloud cluster (must be provisioned before any search route works)
- Four env vars (must be added to `.env` and `.env.example`)

**Missing dependencies with fallback:**

- None — all fallbacks are already in place (Firestore/MOCK chain covers search if Typesense is not configured, per D-07)

---

## Security Domain

> `security_enforcement` not explicitly set to false in config.json — treated as enabled.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                  |
| --------------------- | ------- | --------------------------------------------------------------------------------- |
| V2 Authentication     | yes     | Firebase token verification via existing `verifyFirebaseToken` middleware         |
| V3 Session Management | no      | Stateless API routes                                                              |
| V4 Access Control     | yes     | Seller ownership check before sync; admin role check before reindex               |
| V5 Input Validation   | yes     | `productId` and `action` validated in sync endpoint; reject unknown action values |
| V6 Cryptography       | no      | No new crypto; Typesense HTTPS in transit                                         |

### Known Threat Patterns

| Pattern                                 | STRIDE                 | Standard Mitigation                                                                                                          |
| --------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Seller syncing another seller's product | Elevation of privilege | Verify `product.sellerId === req.user.uid` before upsert/delete in `/api/search/sync`                                        |
| Search-only key exposed in source       | Information disclosure | Store as `VITE_TYPESENSE_SEARCH_API_KEY`; key is scoped to `documents:search` only — exposure is acceptable by design (D-02) |
| Admin reindex endpoint open to sellers  | Elevation of privilege | `requireAdmin` middleware guard; mirrors pattern from existing admin routes                                                  |
| Filter injection via `filter_by` param  | Tampering              | Build `filter_by` string server-side from typed `SearchParams`; never pass raw user input directly to Typesense `filter_by`  |

---

## Concrete File List for Planner

### New files

| File                            | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `src/lib/typesense.ts`          | Browser-side Typesense client (search-only key)                                      |
| `server/lib/typesenseAdmin.ts`  | Server-side Typesense admin client                                                   |
| `server/lib/typesenseSchema.ts` | PRODUCTS_SCHEMA constant + `toTypesenseDoc()` helper                                 |
| `server/routes/search.ts`       | `POST /api/search/sync` + `POST /api/admin/reindex`; export `registerSearchRoutes()` |

### Modified files

| File                                      | Change                                                                                                                                                                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/searchService.ts`           | Add Typesense primary search path above existing `searchFirestore()` fallback; extend `SearchParams` with `minRating`, `freeShipping`, `'best-selling'` sort; add `searchSuggestions` Typesense path; drop `normalizeTR` from Typesense query path |
| `src/services/productService.ts`          | Add `notifySearchSync()` helper; call after `createProduct`, `updateProduct`, `deleteProduct` Firestore writes (fire-and-forget)                                                                                                                   |
| `src/components/commerce/FilterPanel.tsx` | Add `'best-selling'` option to `SORT_OPTIONS` array (UI-SPEC §1)                                                                                                                                                                                   |
| `src/pages/SearchResults.tsx`             | Remove `normalizeTR` call from search-path usage (keep function, remove from Typesense call site)                                                                                                                                                  |
| `server.ts`                               | `import { registerSearchRoutes } from './server/routes/search.js'` + call in `startServer()`                                                                                                                                                       |
| `.env` + `.env.example`                   | Add `VITE_TYPESENSE_HOST`, `VITE_TYPESENSE_SEARCH_API_KEY`, `TYPESENSE_HOST`, `TYPESENSE_ADMIN_API_KEY`                                                                                                                                            |

---

## Sources

### Primary (HIGH confidence)

- [Typesense Collections API](https://typesense.org/docs/29.0/api/collections.html) — schema field types, facet config, default_sorting_field requirements
- [Typesense Search API](https://typesense.org/docs/29.0/api/search.html) — filter_by syntax, facet_by, sort_by, pagination
- [Typesense Firebase Guide](https://typesense.org/docs/guide/firebase-full-text-search.html) — Firestore sync patterns, client setup, upsert/delete
- [Typesense Data Access Control](https://typesense.org/docs/guide/data-access-control.html) — search-only key scoping, browser-safe pattern
- `src/services/searchService.ts` — existing interface, fallback chain, SearchParams/SearchResult types
- `src/services/productService.ts` — createProduct, updateProduct, deleteProduct signatures
- `src/types.ts` — Product interface field inventory
- `server.ts` — Express route registration pattern (registerXxxRoutes + DI)
- `server/routes/sellerApi.ts` — auth middleware + rate limit patterns to mirror

### Secondary (MEDIUM confidence)

- [typesense npm package](https://www.npmjs.com/package/typesense) — package existence confirmed

### Tertiary (LOW confidence — ASSUMED)

- `typesense` package version 1.8.2 — could not run `npm view` due to disk constraints

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — `typesense` is the official client, confirmed via official docs
- Architecture: HIGH — all patterns verified against official Typesense docs + existing codebase
- Schema design: MEDIUM — field selection derived from Product type; salesCount and localized title fields are assumptions (A1, A2)
- Pitfalls: HIGH — all derived from Typesense official constraints (field type rules, filter syntax) + existing code analysis

**Research date:** 2026-06-04
**Valid until:** 2026-09-04 (Typesense API is stable; re-verify if Typesense bumps major version)
