# Phase 4: Search & Discovery - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 10 (4 new, 6 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File                         | Role             | Data Flow        | Closest Analog                                               | Match Quality |
| ----------------------------------------- | ---------------- | ---------------- | ------------------------------------------------------------ | ------------- |
| `src/lib/typesense.ts`                    | config/lib       | request-response | `src/lib/firebase.ts` (client init)                          | role-match    |
| `server/lib/typesenseAdmin.ts`            | config/lib       | request-response | `src/lib/firebase-admin.ts` (admin init)                     | role-match    |
| `server/lib/typesenseSchema.ts`           | utility          | transform        | `server/lib/schemas.ts`                                      | role-match    |
| `server/routes/search.ts`                 | route/controller | request-response | `server/routes/commission.ts` + `server/routes/sellerApi.ts` | exact         |
| `src/services/searchService.ts`           | service          | request-response | itself (modify)                                              | exact         |
| `src/services/productService.ts`          | service          | CRUD             | itself (modify)                                              | exact         |
| `src/components/commerce/FilterPanel.tsx` | component        | event-driven     | itself (modify)                                              | exact         |
| `src/pages/SearchResults.tsx`             | page             | request-response | itself (modify)                                              | exact         |
| `server.ts`                               | config/entry     | request-response | itself (modify)                                              | exact         |
| `.env` / `.env.example`                   | config           | —                | existing `.env.example`                                      | exact         |

---

## Pattern Assignments

### `src/lib/typesense.ts` (config/lib, request-response)

**Analog:** `src/lib/firebase.ts` (client-side SDK init with env vars)

**Imports pattern** — mirror the existing client lib pattern:

```typescript
// src/lib/typesense.ts
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

**Convention note:** `src/lib/` holds shared client-side singletons initialised from `import.meta.env`. Export a named singleton (`typesenseClient`), not a factory. No default export.

---

### `server/lib/typesenseAdmin.ts` (config/lib, request-response)

**Analog:** `src/lib/firebase-admin.ts` (server-side SDK init from `process.env`)

**Pattern** — server libs use `process.env`, not `import.meta.env`:

```typescript
// server/lib/typesenseAdmin.ts
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

**Convention note:** Server libs live under `server/lib/`. Named export of singleton. Import in route files as `import { typesenseAdmin } from '../lib/typesenseAdmin.js'` (`.js` extension for ESM).

---

### `server/lib/typesenseSchema.ts` (utility, transform)

**Analog:** `server/lib/schemas.ts` (Zod schema definitions exported as named consts)

**Imports pattern** (from `server/lib/schemas.ts` lines 1-5):

```typescript
import { z } from 'zod';
export const createProductSchema = z.object({ ... });
```

**Pattern for typesenseSchema.ts** — export named const + named function:

```typescript
// server/lib/typesenseSchema.ts
import type { Timestamp } from 'firebase-admin/firestore';

export const PRODUCTS_SCHEMA = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'sellerId', type: 'string', facet: false },
    { name: 'sellerName', type: 'string' },
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
    { name: 'salesCount', type: 'int32' },
    { name: 'stock', type: 'int32' },
    { name: 'freeShipping', type: 'bool', facet: true },
    { name: 'status', type: 'string', facet: false },
    { name: 'images', type: 'string[]' },
    { name: 'tags', type: 'string[]', optional: true },
    { name: 'createdAtTs', type: 'int64' },
  ],
  default_sorting_field: 'salesCount',
} as const;

export function toTypesenseDoc(
  product: Record<string, any>,
  id: string,
  sellerName = '',
): Record<string, any> {
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
    salesCount: product.salesCount ?? product.reviewsCount ?? 0,
    stock: product.stock ?? 0,
    freeShipping: product.freeShipping ?? false,
    status: product.status ?? 'approved',
    images: product.images ?? [],
    tags: product.tags ?? [],
    createdAtTs,
  };
}
```

---

### `server/routes/search.ts` (route/controller, request-response)

**Analog:** `server/routes/commission.ts` (Firebase-token-authenticated routes with DI deps object)

**Route registration signature** — copy exactly from `server/routes/commission.ts` (line 1 pattern) and `server/routes/orders.ts` (line 363 call site):

```typescript
// server/routes/search.ts
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { typesenseAdmin } from '../lib/typesenseAdmin.js';
import { toTypesenseDoc, PRODUCTS_SCHEMA } from '../lib/typesenseSchema.js';

interface SearchRouteDeps {
  adminDb: Firestore;
  verifyFirebaseToken: (req: any, res: any, next: any) => Promise<void>;
  verifyAdmin: (req: any, res: any, next: any) => Promise<void>;
}

export function registerSearchRoutes(app: Express, deps: SearchRouteDeps) {
  const { adminDb, verifyFirebaseToken, verifyAdmin } = deps;
  // routes here
}
```

**Call site in server.ts** (mirror line 366 pattern):

```typescript
registerSearchRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin });
```

**Auth + ownership check pattern** — copy from `server/routes/sellerApi.ts` lines 298-302:

```typescript
// POST /api/search/sync — seller token + ownership
router.post('/api/search/sync', verifyFirebaseToken, async (req: any, res: any) => {
  const { productId, action } = req.body;
  if (!productId || !['upsert', 'delete'].includes(action))
    return res.status(400).json({ error: 'productId and action required' });

  const productSnap = await adminDb.collection('products').doc(productId).get();
  if (!productSnap.exists) return res.status(404).json({ error: 'Ürün bulunamadı' });
  const product = productSnap.data()!;
  if (product.sellerId !== req.uid && req.decodedToken?.role !== 'admin')
    return res.status(403).json({ error: 'Bu ürün size ait değil' });

  try {
    if (action === 'delete') {
      await typesenseAdmin.collections('products').documents(productId).delete();
    } else {
      const doc = toTypesenseDoc(product, productId, product.sellerName ?? '');
      await typesenseAdmin.collections('products').documents().upsert(doc);
    }
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
```

**Admin reindex pattern** — uses `verifyAdmin` middleware (from `authMiddleware.ts` `verifyAdmin`, line 47):

```typescript
// POST /api/admin/reindex — admin only
app.post('/api/admin/reindex', verifyAdmin, async (req: any, res: any) => {
  try {
    // Ensure collection exists
    try {
      await typesenseAdmin.collections('products').retrieve();
    } catch {
      await typesenseAdmin.collections().create(PRODUCTS_SCHEMA as any);
    }

    // Build seller name map (single pass — avoids N reads per product)
    const sellersSnap = await adminDb.collection('sellers').get();
    const sellerNames = new Map<string, string>();
    for (const d of sellersSnap.docs) sellerNames.set(d.id, d.data().storeName ?? '');

    const snap = await adminDb.collection('products').get();
    const docs = snap.docs.map((d) =>
      toTypesenseDoc(d.data(), d.id, sellerNames.get(d.data().sellerId) ?? ''),
    );
    await typesenseAdmin.collections('products').documents().import(docs, { action: 'upsert' });
    return res.json({ indexed: docs.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
```

**Error handling pattern** (verbatim from sellerApi.ts lines 202-205):

```typescript
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
```

---

### `src/services/searchService.ts` — MODIFIED (service, request-response)

**Analog:** itself — already fully read above.

**SearchParams extension** — add to existing `SearchParams` interface (lines 18-29):

```typescript
// Add inside existing SearchParams interface
minRating?: number;
freeShipping?: boolean;
// Extend existing sortBy union:
sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular' | 'best-selling';
```

**Typesense primary path insertion** — insert new `searchTypesense()` function before `searchFirestore()` (line 195). Mirror the `searchFirestore()` function signature: `async function searchTypesense(params: SearchParams): Promise<SearchResult | null>`. Returns `null` on any error (same fallback signal as Firestore path uses at lines 305-318).

**Primary search order** in `searchProducts()` (lines 348-394): replace `searchFirestore()` call at line 352 with:

```typescript
// Try Typesense first (D-06/D-07)
const typesenseResult = await searchTypesense(params);
if (typesenseResult !== null) {
  result = typesenseResult;
} else {
  // Fallback #2: Firestore
  const firestoreResult = await searchFirestore(params);
  result = firestoreResult ?? searchMockProducts(params);
}
```

**normalizeTR removal** — in `searchTypesense()` do NOT call `normalizeTR` on the query. Keep `normalizeTR` function itself (used in `applySearchFilters` MOCK fallback path at lines 88-102 and `searchProductsLegacy`). Do not delete it.

**Fallback error pattern** — mirror lines 304-317 exactly:

```typescript
  } catch (error) {
    console.warn('[searchService] Typesense unavailable, falling back to Firestore', error);
    return null; // signal fallback
  }
```

---

### `src/services/productService.ts` — MODIFIED (service, CRUD)

**Analog:** itself — write functions at lines 150-176.

**notifySearchSync helper** — add as a module-private fire-and-forget function. Copy the `handleFirestoreError` + `throw` pattern for the Firestore write itself (lines 156-159) but for the sync call use warn+swallow (never block the caller):

```typescript
// Add after imports in productService.ts
import { getAuth } from 'firebase/auth';

async function notifySearchSync(productId: string, action: 'upsert' | 'delete'): Promise<void> {
  try {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) return; // not authenticated — skip sync (server will 401)
    await fetch('/api/search/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, action }),
    });
  } catch (err) {
    // Fire-and-forget: log but do not throw. Drift recoverable via /api/admin/reindex.
    console.warn('[productService] search sync failed, will recover on next reindex', err);
  }
}
```

**Hook into createProduct** (after line 155 `return docRef.id`):

```typescript
notifySearchSync(docRef.id, 'upsert'); // fire-and-forget
return docRef.id;
```

**Hook into updateProduct** (after line 168 `updateDoc` await):

```typescript
notifySearchSync(id, 'upsert'); // fire-and-forget
```

**deleteProduct hook** — find `deleteDoc` call in productService.ts and add after it:

```typescript
notifySearchSync(id, 'delete'); // fire-and-forget
```

---

### `src/components/commerce/FilterPanel.tsx` — MODIFIED (component, event-driven)

**Analog:** itself. Minimal change — add `'best-selling'` to the `SORT_OPTIONS` array.

**Pattern to find and extend:**

```typescript
// Find the SORT_OPTIONS (or equivalent) array and add:
{ value: 'best-selling', label: t('sort.bestSelling') ?? 'En Çok Satan' }
```

**Convention:** The component uses the `LanguageContext` `t()` function for labels. Follow the same pattern as existing sort options. No other changes to FilterPanel in this phase.

---

### `src/pages/SearchResults.tsx` — MODIFIED (page, request-response)

**Analog:** itself.

**normalizeTR removal** — search for the call site where `normalizeTR` is applied to the search query _before_ calling `searchProducts()`. Remove only that call. The `normalizeTR` import can be removed if it is only used at that call site. Do not remove `normalizeTR` from `searchService.ts` itself.

---

### `server.ts` — MODIFIED (entry, request-response)

**Analog:** itself. Mirror the existing route registration pattern exactly.

**Import to add** (copy pattern from lines 18-24):

```typescript
import { registerSearchRoutes } from './server/routes/search.js';
```

**Registration call to add** (copy pattern from line 366):

```typescript
registerSearchRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin });
```

Place this call alongside the other `registerXxxRoutes` calls (after line 369, before the Vite/static catch-all).

---

## Shared Patterns

### Firebase Token Verification

**Source:** `src/lib/authMiddleware.ts` lines 32-45
**Apply to:** `server/routes/search.ts` — both endpoints use `verifyFirebaseToken`; reindex uses `verifyAdmin`

```typescript
// verifyFirebaseToken attaches req.uid, req.decodedToken
// verifyAdmin additionally checks decoded.role === 'admin'
// Access ownership with: req.uid, req.decodedToken?.role
```

### Error Response Format

**Source:** `server/routes/sellerApi.ts` lines 202-205, 228-230
**Apply to:** All handlers in `server/routes/search.ts`

```typescript
// Success:
return res.json({ ok: true });
return res.json({ indexed: docs.length });
// Error:
return res.status(400).json({ error: 'message' });
return res.status(403).json({ error: 'Bu ürün size ait değil' });
return res.status(404).json({ error: 'Ürün bulunamadı' });
return res.status(500).json({ error: err.message });
```

### Service-Layer Fallback Pattern

**Source:** `src/services/searchService.ts` lines 304-318
**Apply to:** `searchTypesense()` function in modified `searchService.ts`

```typescript
// Return null to signal fallback — never throw from the primary path
} catch (error) {
  console.warn('[searchService] Typesense unavailable, falling back', error);
  return null;
}
```

### handleFirestoreError Pattern (for productService additions)

**Source:** `src/services/productService.ts` lines 156-159

```typescript
} catch (error) {
  handleFirestoreError(error, OperationType.CREATE, 'products');
  throw error;
}
// The notifySearchSync call is OUTSIDE this try/catch — it is fire-and-forget
// and must never propagate errors to the Firestore write caller.
```

### Route Module Export Signature

**Source:** `server/routes/commission.ts` + call site `server.ts` line 366
**Apply to:** `server/routes/search.ts`

```typescript
export function registerSearchRoutes(app: Express, deps: SearchRouteDeps): void;
// Called as: registerSearchRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin });
```

### ESM Import Extensions

**Source:** `server.ts` lines 14-28 (all `.js` extensions on local imports)
**Apply to:** All imports in `server/routes/search.ts` and `server/lib/typesenseAdmin.ts`

```typescript
import { typesenseAdmin } from '../lib/typesenseAdmin.js'; // .js — required for ESM
import { toTypesenseDoc } from '../lib/typesenseSchema.js';
```

---

## No Analog Found

All files have close analogs in the codebase. No files require fallback to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `server/routes/`, `server/lib/`, `src/lib/`, `src/services/`, `src/pages/`, `src/components/commerce/`
**Files scanned:** 8 (sellerApi.ts, authMiddleware.ts, searchService.ts, productService.ts, server.ts, commission route pattern, server/lib/schemas.ts, server/lib/validate.ts)
**Pattern extraction date:** 2026-06-04
