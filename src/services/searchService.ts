import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Category } from '@/types';
import { MOCK_PRODUCTS, CATEGORIES } from '@/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchParams {
  query?: string;
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular';
  page?: number;
  pageSize?: number;
  tags?: string[];
  inStock?: boolean;
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  facets?: {
    categories: { id: string; name: string; count: number }[];
    brands: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeTR(s: string): string {
  return s
    .toLowerCase()
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ş/g, 's')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c');
}

/** Check whether a Firestore error indicates the client is offline / unavailable. */
function isOfflineError(error: unknown): boolean {
  if (error instanceof FirestoreError) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('unavailable') ||
      msg.includes('offline') ||
      msg.includes('failed-precondition') ||
      msg.includes('unauthenticated')
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('offline') || msg.includes('network');
  }
  return false;
}

// ─── Client-side filtering (fallback) ────────────────────────────────────────

function applySearchFilters(products: Product[], params: SearchParams): Product[] {
  let list = products.filter(
    p => p.status === undefined || p.status === 'approved',
  );

  if (params.query) {
    const nq = normalizeTR(params.query);
    list = list.filter(p =>
      [p.title, p.description, p.brand, ...(p.tags ?? [])].some(field =>
        normalizeTR(field ?? '').includes(nq),
      ),
    );
  }

  if (params.categoryId) {
    list = list.filter(p => p.categoryId === params.categoryId);
  }

  if (params.brand) {
    const nb = normalizeTR(params.brand);
    list = list.filter(p => normalizeTR(p.brand ?? '').includes(nb));
  }

  if (params.minPrice != null) {
    list = list.filter(p => p.price >= params.minPrice!);
  }

  if (params.maxPrice != null) {
    list = list.filter(p => p.price <= params.maxPrice!);
  }

  if (params.inStock) {
    list = list.filter(p => p.stock > 0);
  }

  if (params.tags && params.tags.length > 0) {
    list = list.filter(
      p =>
        p.tags &&
        params.tags!.some(t => p.tags!.includes(t)),
    );
  }

  // Sorting
  if (params.sortBy) {
    list = [...list].sort((a, b) => {
      switch (params.sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
        case 'popular':
          return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
        default:
          return 0;
      }
    });
  }

  return list;
}

function computeFacets(
  products: Product[],
  categoryId?: string,
): SearchResult['facets'] {
  const categoryMap = new Map<string, { id: string; name: string; count: number }>();
  const brandMap = new Map<string, number>();
  let priceMin = Infinity;
  let priceMax = -Infinity;

  for (const p of products) {
    // category facets
    if (!categoryMap.has(p.categoryId)) {
      const cat = CATEGORIES.find(c => c.id === p.categoryId);
      categoryMap.set(p.categoryId, {
        id: p.categoryId,
        name: cat?.name ?? p.categoryId,
        count: 0,
      });
    }
    categoryMap.get(p.categoryId)!.count++;

    // brand facets
    if (p.brand) {
      brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1);
    }

    // price range
    if (p.price < priceMin) priceMin = p.price;
    if (p.price > priceMax) priceMax = p.price;
  }

  return {
    categories: Array.from(categoryMap.values()).sort(
      (a, b) => b.count - a.count,
    ),
    brands: Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    priceRange: {
      min: priceMin === Infinity ? 0 : priceMin,
      max: priceMax === -Infinity ? 0 : priceMax,
    },
  };
}

// ─── Primary: Firestore search ───────────────────────────────────────────────

async function searchFirestore(
  params: SearchParams,
): Promise<SearchResult | null> {
  try {
    const productsRef = collection(db, 'products');
    const constraints: any[] = [];

    // Category filter
    if (params.categoryId) {
      constraints.push(where('categoryId', '==', params.categoryId));
    }

    // Brand filter
    if (params.brand) {
      constraints.push(where('brand', '==', params.brand));
    }

    // Price range — Firestore requires both bounds or none for composite index
    if (params.minPrice != null && params.maxPrice != null) {
      constraints.push(
        where('price', '>=', params.minPrice),
        where('price', '<=', params.maxPrice),
      );
    } else if (params.minPrice != null) {
      constraints.push(where('price', '>=', params.minPrice));
    } else if (params.maxPrice != null) {
      constraints.push(where('price', '<=', params.maxPrice));
    }

    // In-stock filter
    if (params.inStock) {
      constraints.push(where('stock', '>', 0));
    }

    // Keyword prefix search on title (Firestore's best approximation of "starts with")
    if (params.query) {
      const q = params.query.trim();
      if (q.length >= 2) {
        constraints.push(where('title', '>=', q));
        constraints.push(where('title', '<=', q + '\uf8ff'));
      }
    }

    // Sorting (only if no range filter conflicts with the sort field)
    if (params.sortBy && !params.minPrice && !params.maxPrice) {
      switch (params.sortBy) {
        case 'price_asc':
          constraints.push(orderBy('price', 'asc'));
          break;
        case 'price_desc':
          constraints.push(orderBy('price', 'desc'));
          break;
        case 'rating':
          constraints.push(orderBy('rating', 'desc'));
          break;
        case 'newest':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'popular':
          constraints.push(orderBy('reviewsCount', 'desc'));
          break;
      }
    }

    // Pagination
    const pageSize = params.pageSize ?? 20;
    const page = params.page ?? 1;
    constraints.push(limit(pageSize + 1)); // fetch +1 to detect hasMore

    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);

    let products = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Product[];

    const hasMore = products.length > pageSize;
    if (hasMore) products = products.slice(0, pageSize);

    // If Firestore returned empty but we had a title prefix filter, don't fall
    // through to the client — just return empty. Otherwise the mock fallback
    // would ignore the filter.
    if (products.length === 0) {
      return {
        products: [],
        totalCount: 0,
        hasMore: false,
        facets: await getFacetedFiltersFallback(params.categoryId),
      };
    }

    // Apply tags filter client-side (Firestore doesn't support array-contains-any
    // combined with other inequality filters easily)
    if (params.tags && params.tags.length > 0) {
      products = products.filter(
        p => p.tags && params.tags!.some(t => p.tags!.includes(t)),
      );
    }

    // Build facets from the full Firestore collection (lightweight count query)
    const facets = await getFacetedFiltersFallback(params.categoryId);

    return {
      products,
      totalCount: snapshot.size,
      hasMore,
      facets,
    };
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn(
        '[searchService] Firestore unavailable, falling back to MOCK_PRODUCTS',
        error,
      );
      return null; // signal fallback
    }
    // For permission errors and other non-offline failures, still fall back
    console.warn(
      '[searchService] Firestore query failed, falling back to MOCK_PRODUCTS',
      error,
    );
    return null;
  }
}

// ─── Fallback: MOCK_PRODUCTS filtering ───────────────────────────────────────

function searchMockProducts(params: SearchParams): SearchResult {
  const filtered = applySearchFilters(MOCK_PRODUCTS, params);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return {
    products: pageItems,
    totalCount: filtered.length,
    hasMore: start + pageSize < filtered.length,
    facets: computeFacets(filtered, params.categoryId),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Main product search — tries Firestore first, falls back to MOCK_PRODUCTS.
 *
 * Firestore limitations:
 * - Keyword search uses prefix matching on `title` (no full-text search).
 * - Composite queries require composite indexes for certain filter+sort combinations.
 * - Falls back gracefully when Firestore is offline.
 */
export async function searchProducts(
  params: SearchParams,
): Promise<SearchResult> {
  // Try Firestore first
  const firestoreResult = await searchFirestore(params);
  if (firestoreResult !== null) {
    return firestoreResult;
  }

  // Fallback to MOCK_PRODUCTS
  return searchMockProducts(params);
}

/**
 * Quick suggestions for the search bar dropdown (limit 6).
 * Uses Firestore prefix match with a small limit; falls back to MOCK_PRODUCTS.
 */
export async function searchSuggestions(
  searchQuery: string,
  maxResults = 6,
): Promise<Product[]> {
  if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];

  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('title', '>=', searchQuery.trim()),
      where('title', '<=', searchQuery.trim() + '\uf8ff'),
      limit(maxResults),
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as object) })) as Product[];
    }
  } catch (error) {
    console.warn(
      '[searchService] Firestore suggestions failed, falling back to MOCK_PRODUCTS',
      error,
    );
  }

  // Fallback: client-side filter on MOCK_PRODUCTS
  const nq = normalizeTR(searchQuery);
  return MOCK_PRODUCTS.filter(
    p =>
      (p.status === undefined || p.status === 'approved') &&
      [p.title, p.brand, ...(p.tags ?? [])].some(field =>
        normalizeTR(field ?? '').includes(nq),
      ),
  ).slice(0, maxResults);
}

/**
 * Get available faceted filters (categories, brands, price range) for a given
 * category or the entire catalog. Used to populate sidebar filters.
 */
export async function getFacetedFilters(
  categoryId?: string,
): Promise<SearchResult['facets']> {
  try {
    const productsRef = collection(db, 'products');
    const constraints: any[] = [];

    if (categoryId) {
      constraints.push(where('categoryId', '==', categoryId));
    }

    // Fetch a reasonable sample for facet computation
    constraints.push(limit(200));

    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const products = snapshot.docs.map(d =>
        d.data(),
      ) as Product[];
      return computeFacets(products, categoryId);
    }
  } catch (error) {
    console.warn(
      '[searchService] Firestore facets failed, falling back to MOCK_PRODUCTS',
      error,
    );
  }

  return getFacetedFiltersFallback(categoryId);
}

/**
 * Backward-compatible synchronous search — wraps the async searchProducts but
 * keeps the old signature (query: string, limitCount: number) for SearchBar.tsx.
 * Returns products directly without pagination/facets.
 */
export function searchProductsLegacy(query: string, limitCount = 6): Product[] {
  if (!query.trim() || query.trim().length < 2) return [];
  const nq = normalizeTR(query);
  return MOCK_PRODUCTS.filter(
    p =>
      (p.status === undefined || p.status === 'approved') &&
      [p.title, p.description, p.brand, ...(p.tags ?? [])].some(field =>
        normalizeTR(field ?? '').includes(nq),
      ),
  ).slice(0, limitCount);
}

// ─── Internal fallbacks ──────────────────────────────────────────────────────

function getFacetedFiltersFallback(
  categoryId?: string,
): SearchResult['facets'] {
  const pool = categoryId
    ? MOCK_PRODUCTS.filter(p => p.categoryId === categoryId)
    : MOCK_PRODUCTS;
  return computeFacets(pool, categoryId);
}
