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
import type { Product, SponsoredSlot } from '@/types';
import { injectSponsoredProducts } from './adService';

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
  sponsoredSlots?: SponsoredSlot[];
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
    return error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('network');
  }
  return false;
}

// ─── Client-side filtering ───────────────────────────────────────────────────

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
    list = list.filter(p => normalizeTR(p.brand ?? '').includes(normalizeTR(params.brand!)));
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
    list = list.filter(p => p.tags && params.tags!.some(t => p.tags!.includes(t)));
  }

  if (params.sortBy) {
    list = [...list].sort((a, b) => {
      switch (params.sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'newest': return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
        case 'popular': return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
        default: return 0;
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
    if (!categoryMap.has(p.categoryId)) {
      categoryMap.set(p.categoryId, {
        id: p.categoryId,
        name: p.categoryId,
        count: 0,
      });
    }
    categoryMap.get(p.categoryId)!.count++;

    if (p.brand) {
      brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1);
    }

    if (p.price < priceMin) priceMin = p.price;
    if (p.price > priceMax) priceMax = p.price;
  }

  return {
    categories: Array.from(categoryMap.values()).sort((a, b) => b.count - a.count),
    brands: Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    priceRange: {
      min: priceMin === Infinity ? 0 : priceMin,
      max: priceMax === -Infinity ? 0 : priceMax,
    },
  };
}

// ─── Firestore search ────────────────────────────────────────────────────────

async function searchFirestore(params: SearchParams): Promise<SearchResult | null> {
  try {
    const productsRef = collection(db, 'products');
    const constraints: any[] = [];

    if (params.categoryId) {
      constraints.push(where('categoryId', '==', params.categoryId));
    }

    if (params.brand) {
      constraints.push(where('brand', '==', params.brand));
    }

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

    if (params.inStock) {
      constraints.push(where('stock', '>', 0));
    }

    if (params.query) {
      const q = params.query.trim();
      if (q.length >= 2) {
        constraints.push(where('title', '>=', q));
        constraints.push(where('title', '<=', q + '\uf8ff'));
      }
    }

    if (params.sortBy && !params.minPrice && !params.maxPrice) {
      switch (params.sortBy) {
        case 'price_asc': constraints.push(orderBy('price', 'asc')); break;
        case 'price_desc': constraints.push(orderBy('price', 'desc')); break;
        case 'rating': constraints.push(orderBy('rating', 'desc')); break;
        case 'newest': constraints.push(orderBy('createdAt', 'desc')); break;
        case 'popular': constraints.push(orderBy('reviewsCount', 'desc')); break;
      }
    }

    const pageSize = params.pageSize ?? 20;
    const page = params.page ?? 1;
    constraints.push(limit(pageSize + 1));

    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);

    let products = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    const hasMore = products.length > pageSize;
    if (hasMore) products = products.slice(0, pageSize);

    if (products.length === 0) {
      return {
        products: [],
        totalCount: 0,
        hasMore: false,
        facets: await getFacetedFiltersFallback(params.categoryId),
      };
    }

    if (params.tags && params.tags.length > 0) {
      products = products.filter(p => p.tags && params.tags!.some(t => p.tags!.includes(t)));
    }

    const facets = await getFacetedFiltersFallback(params.categoryId);

    return { products, totalCount: snapshot.size, hasMore, facets };
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('[searchService] Firestore unavailable', error);
      return null;
    }
    console.warn('[searchService] Firestore query failed', error);
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const firestoreResult = await searchFirestore(params);
  if (firestoreResult !== null) {
    return firestoreResult;
  }

  return {
    products: [],
    totalCount: 0,
    hasMore: false,
    facets: await getFacetedFiltersFallback(params.categoryId),
  };
}

export async function searchSuggestions(
  q: string,
  maxResults = 6,
): Promise<Product[]> {
  if (!q.trim() || q.trim().length < 2) return [];

  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(query(
      productsRef,
      where('title', '>=', q.trim()),
      where('title', '<=', q.trim() + '\uf8ff'),
      limit(maxResults),
    ));

    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    }
  } catch (error) {
    console.warn('[searchService] Firestore suggestions failed', error);
  }

  return [];
}

export async function getFacetedFilters(
  categoryId?: string,
): Promise<SearchResult['facets']> {
  try {
    const productsRef = collection(db, 'products');
    const constraints: any[] = [];
    if (categoryId) {
      constraints.push(where('categoryId', '==', categoryId));
    }
    constraints.push(limit(200));

    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const products = snapshot.docs.map(d => d.data()) as Product[];
      return computeFacets(products, categoryId)!;
    }
  } catch (error) {
    console.warn('[searchService] Firestore facets failed', error);
  }

  return getFacetedFiltersFallback(categoryId);
}

// ─── Internal fallbacks ──────────────────────────────────────────────────────

async function getFacetedFiltersFallback(
  categoryId?: string,
): Promise<SearchResult['facets']> {
  try {
    const productsRef = collection(db, 'products');
    const constraints: any[] = [];
    if (categoryId) {
      constraints.push(where('categoryId', '==', categoryId));
    }
    constraints.push(limit(200));
    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(d => d.data()) as Product[];
    return computeFacets(products, categoryId) ?? { categories: [], brands: [], priceRange: { min: 0, max: 0 } };
  } catch {
    return { categories: [], brands: [], priceRange: { min: 0, max: 0 } };
  }
}
