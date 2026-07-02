import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  limit,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  increment,
  writeBatch,
  documentId,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Category } from '../types';
import { MOCK_PRODUCTS, CATEGORIES } from '../mockData';
import { recordPrice } from './priceHistoryService';

export interface GetProductsOptions {
  categoryId?: string;
  limit?: number;
  featured?: boolean;
  sellerId?: string;
  bestSeller?: boolean;
  newArrival?: boolean;
  isFlashDeal?: boolean;
  isTrending?: boolean;
  isAiPick?: boolean;
  hasDiscount?: boolean;
  tag?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  brand?: string;
  inStock?: boolean;
  includeNonApproved?: boolean;
}

function isApproved(p: Product): boolean {
  return p.status === undefined || p.status === 'approved';
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureProductHasSlug(product: Product): Product {
  if (product.slug) return product;
  return {
    ...product,
    slug: generateSlug(product.title),
  };
}

/**
 * Client-side filters for multi-attribute options that Firestore can't
 * combine in a single composite query (range filters, computed fields,
 * array membership). Fires AFTER the Firestore-level constraints.
 */
function applyClientFilters(products: Product[], options: GetProductsOptions): Product[] {
  let list = products;
  if (!options.includeNonApproved) list = list.filter(isApproved);
  if (options.bestSeller) list = list.filter((p) => p.bestSeller);
  if (options.newArrival) list = list.filter((p) => p.newArrival);
  if (options.isAiPick) list = list.filter((p) => p.isAiPick);
  if (options.hasDiscount)
    list = list.filter((p) => (p.discountPercentage ?? 0) > 0 || !!p.oldPrice);
  if (options.tag) list = list.filter((p) => p.tags?.includes(options.tag!));
  if (options.brand)
    list = list.filter((p) => p.brand?.toLowerCase() === options.brand!.toLowerCase());
  if (options.inStock) list = list.filter((p) => p.stock > 0);
  if (options.priceMin != null) list = list.filter((p) => p.price >= options.priceMin!);
  if (options.priceMax != null) list = list.filter((p) => p.price <= options.priceMax!);
  if (options.minRating != null) list = list.filter((p) => p.rating >= options.minRating!);
  if (options.limit) list = list.slice(0, options.limit);
  return list;
}

/**
 * Fetch multiple products by their document IDs in one pass.
 * Firestore `in` supports max 10 values, so ids are chunked in 10s.
 * Returns ONLY the products that exist — callers detect missing/invalid
 * ids by diffing requested ids against the returned ids. No mock fallback.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  try {
    const productsRef = collection(db, 'products');
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const q = query(productsRef, where(documentId(), 'in', chunk));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
      }),
    );

    const found = results.flat().map(ensureProductHasSlug);
    // Preserve requested order, drop missing ids.
    const byId = new Map(found.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Product => p != null);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products/byIds');
    throw error;
  }
}

export async function getProducts(options?: GetProductsOptions) {
  try {
    const productsRef = collection(db, 'products');
    const constraints: any[] = [];
    const clientFilters: GetProductsOptions = options ? { ...options } : {};

    // ── Firestore-level constraints (backed by composite indexes) ──────────
    if (options?.categoryId) {
      constraints.push(where('categoryId', '==', options.categoryId));
      // Already handled at Firestore level — remove from client pass
      delete clientFilters.categoryId;
    }
    if (options?.sellerId) {
      constraints.push(where('sellerId', '==', options.sellerId));
      delete clientFilters.sellerId;
    }
    if (options?.featured) {
      constraints.push(where('featured', '==', true));
      delete clientFilters.featured;
    }
    if (options?.isFlashDeal) {
      constraints.push(where('isFlashDeal', '==', true));
      delete clientFilters.isFlashDeal;
    }
    if (options?.isTrending) {
      constraints.push(where('isTrending', '==', true));
      delete clientFilters.isTrending;
    }

    // Always filter approved products at Firestore level (unless explicitly opted out)
    if (!options?.includeNonApproved) {
      constraints.push(where('status', '==', 'approved'));
      delete clientFilters.includeNonApproved;
    }

    // ── Ordering & limit ──────────────────────────────────────────────────
    constraints.push(orderBy('createdAt', 'desc'));
    const pageLimit = options?.limit ?? 50;
    constraints.push(limit(pageLimit));

    // ── Execute ───────────────────────────────────────────────────────────
    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);
    let products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];

    if (products.length === 0) products = MOCK_PRODUCTS;

    // Ensure all products have slugs
    products = products.map(ensureProductHasSlug);

    // Apply any remaining client-side filters
    const remainingClientFilters = Object.values(clientFilters).some(
      (v) => v != null && v !== false,
    );
    if (options && remainingClientFilters) {
      console.warn(
        '[productService] Some filters could not be pushed to Firestore — ' +
          'consider adding composite indexes for:',
        Object.keys(clientFilters).filter(
          (k) =>
            clientFilters[k as keyof GetProductsOptions] != null &&
            clientFilters[k as keyof GetProductsOptions] !== false,
        ),
      );
      return applyClientFilters(products, clientFilters);
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    const fallback = options ? applyClientFilters(MOCK_PRODUCTS, options) : MOCK_PRODUCTS;
    return fallback.map(ensureProductHasSlug);
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const product = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Product;
      return ensureProductHasSlug(product);
    }

    // Try to find in mock products by slug
    let product = MOCK_PRODUCTS.find((p) => p.slug === slug);

    // If not found, try by generated slug
    if (!product) {
      product = MOCK_PRODUCTS.find((p) => generateSlug(p.title) === slug);
    }

    // If still not found, try partial match (slug starts with or contains key words)
    if (!product) {
      const slugWords = slug.split('-').filter((w) => w.length > 2);
      product = MOCK_PRODUCTS.find((p) => {
        const productSlug = p.slug || generateSlug(p.title);
        return (
          slugWords.some((word) => productSlug.includes(word)) &&
          slugWords.every((word) => productSlug.includes(word))
        );
      });
    }

    return product ? ensureProductHasSlug(product) : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    let product = MOCK_PRODUCTS.find((p) => p.slug === slug);
    if (!product) {
      product = MOCK_PRODUCTS.find((p) => generateSlug(p.title) === slug);
    }
    if (!product) {
      const slugWords = slug.split('-').filter((w) => w.length > 2);
      product = MOCK_PRODUCTS.find((p) => {
        const productSlug = p.slug || generateSlug(p.title);
        return (
          slugWords.some((word) => productSlug.includes(word)) &&
          slugWords.every((word) => productSlug.includes(word))
        );
      });
    }
    return product ? ensureProductHasSlug(product) : null;
  }
}

export async function createProduct(data: Omit<Product, 'id'>) {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Fire-and-forget Typesense sync
    syncToTypesense(docRef.id, { ...data, id: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
    throw error;
  }
}

export async function updateProduct(id: string, data: Partial<Product>) {
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    if (data.price !== undefined) {
      recordPrice(id, data.price);
    }
    // Fire-and-forget Typesense sync
    syncToTypesense(id, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    throw error;
  }
}

export interface StockCheckItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface StockCheckResult {
  passed: boolean;
  failures: { productId: string; variantId?: string; available: number; requested: number }[];
}

/**
 * Validate stock availability BEFORE creating an order.
 * Call this before checkout to show user-friendly errors.
 */
export async function validateCartStock(items: StockCheckItem[]): Promise<StockCheckResult> {
  const failures: StockCheckResult['failures'] = [];

  for (const { productId, variantId, quantity } of items) {
    try {
      const snap = await getDoc(doc(db, 'products', productId));
      if (!snap.exists()) {
        failures.push({ productId, variantId, available: 0, requested: quantity });
        continue;
      }
      const product = snap.data() as Product;

      if (variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === variantId);
        const available = variant?.stock ?? 0;
        if (available < quantity) {
          failures.push({ productId, variantId, available, requested: quantity });
        }
      } else {
        const available = product.stock ?? 0;
        if (available < quantity) {
          failures.push({ productId, available, requested: quantity });
        }
      }
    } catch {
      failures.push({ productId, variantId, available: 0, requested: quantity });
    }
  }

  return { passed: failures.length === 0, failures };
}

/**
 * Atomically decrease stock for ordered items using a Firestore transaction.
 * Throws with detailed error if any item has insufficient stock.
 * Supports both product-level and variant-level stock.
 */
export async function decreaseProductStock(items: StockCheckItem[]): Promise<void> {
  if (items.length === 0) return;

  try {
    await runTransaction(db, async (tx) => {
      for (const { productId, variantId, quantity } of items) {
        const ref = doc(db, 'products', productId);
        const snap = await tx.get(ref);

        if (!snap.exists()) {
          throw new Error(`STOCK_ERROR: Ürün bulunamadı (${productId})`);
        }

        const product = snap.data() as Product;

        if (variantId && product.variants) {
          // Decrement per-variant stock
          const variantIndex = product.variants.findIndex((v) => v.id === variantId);
          if (variantIndex === -1) {
            throw new Error(`STOCK_ERROR: Varyant bulunamadı (${variantId})`);
          }
          const available = product.variants[variantIndex].stock ?? 0;
          if (available < quantity) {
            throw new Error(
              `STOCK_ERROR: Yetersiz stok — ${product.title} (${product.variants[variantIndex].sku}) ` +
                `mevcut: ${available}, istenen: ${quantity}`,
            );
          }
          // Update variant stock in-place
          const updatedVariants = [...product.variants];
          updatedVariants[variantIndex] = {
            ...updatedVariants[variantIndex],
            stock: available - quantity,
          };
          // Also decrement total stock
          const totalStock = (product.stock ?? 0) - quantity;
          tx.update(ref, {
            stock: Math.max(0, totalStock),
            variants: updatedVariants,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Decrement product-level stock
          const available = product.stock ?? 0;
          if (available < quantity) {
            throw new Error(
              `STOCK_ERROR: Yetersiz stok — ${product.title} ` +
                `mevcut: ${available}, istenen: ${quantity}`,
            );
          }
          tx.update(ref, {
            stock: available - quantity,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  } catch (error: any) {
    if (error?.message?.startsWith('STOCK_ERROR:')) {
      throw error; // Re-throw our custom errors
    }
    handleFirestoreError(error, OperationType.UPDATE, 'products/stock');
    throw error;
  }
}

/**
 * Atomically restore stock when an order is cancelled or refunded.
 * Supports both product-level and variant-level stock.
 */
export async function restoreProductStock(items: StockCheckItem[]): Promise<void> {
  if (items.length === 0) return;

  try {
    await runTransaction(db, async (tx) => {
      for (const { productId, variantId, quantity } of items) {
        const ref = doc(db, 'products', productId);
        const snap = await tx.get(ref);

        if (!snap.exists()) continue;

        const product = snap.data() as Product;

        if (variantId && product.variants) {
          const variantIndex = product.variants.findIndex((v) => v.id === variantId);
          if (variantIndex === -1) continue;
          const updatedVariants = [...product.variants];
          updatedVariants[variantIndex] = {
            ...updatedVariants[variantIndex],
            stock: (updatedVariants[variantIndex].stock ?? 0) + quantity,
          };
          tx.update(ref, {
            stock: (product.stock ?? 0) + quantity,
            variants: updatedVariants,
            updatedAt: new Date().toISOString(),
          });
        } else {
          tx.update(ref, {
            stock: (product.stock ?? 0) + quantity,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'products/stock');
    throw error;
  }
}

export async function deleteProduct(id: string) {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    // Fire-and-forget Typesense sync
    syncDeleteFromTypesense(id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    throw error;
  }
}

export async function getCategories() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[];
    return cats.sort((a, b) => (a.menuOrder ?? 999) - (b.menuOrder ?? 999));
  } catch (error) {
    return CATEGORIES;
  }
}

export async function seedDefaultCategories(): Promise<void> {
  const existingSnap = await getDocs(collection(db, 'categories'));
  const existing = existingSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);

  // Group ALL same-name entries into arrays so duplicates are visible
  const byName = new Map<string, Array<{ id: string; parentId?: string }>>();
  for (const c of existing) {
    const key = c.name.toLowerCase().trim();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push({ id: c.id, parentId: c.parentId });
  }

  for (const cat of CATEGORIES) {
    const nameKey = cat.name.toLowerCase().trim();
    let parentDocId: string;

    const catEntries = byName.get(nameKey) ?? [];
    if (catEntries.length > 0) {
      parentDocId = catEntries[0].id;
    } else {
      const catSnap = await getDoc(doc(db, 'categories', cat.id));
      if (!catSnap.exists()) {
        await setDoc(doc(db, 'categories', cat.id), {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon ?? '',
          image: cat.image ?? '',
          description: cat.description ?? '',
          createdAt: new Date().toISOString(),
        });
      }
      parentDocId = cat.id;
      byName.set(nameKey, [{ id: cat.id }]);
    }

    for (const group of cat.subGroups ?? []) {
      const groupKey = group.name.toLowerCase().trim();
      const groupEntries = byName.get(groupKey) ?? [];

      // Prefer entry that already has a parentId; otherwise take first
      const canonical = groupEntries.find((e) => e.parentId) ?? groupEntries[0];

      if (canonical) {
        // Fix canonical if it lacks parentId
        if (!canonical.parentId) {
          await updateDoc(doc(db, 'categories', canonical.id), { parentId: parentDocId });
        }
        // Delete every OTHER orphan entry with this name (duplicate top-level entries)
        for (const dup of groupEntries) {
          if (dup.id !== canonical.id && !dup.parentId) {
            await deleteDoc(doc(db, 'categories', dup.id));
          }
        }
      } else {
        const childId = `${cat.id}__${group.name.toLowerCase().replace(/\s+/g, '_')}`;
        const childSnap = await getDoc(doc(db, 'categories', childId));
        if (!childSnap.exists()) {
          await setDoc(doc(db, 'categories', childId), {
            name: group.name,
            slug: childId,
            parentId: parentDocId,
            icon: '',
            image: '',
            description: '',
            createdAt: new Date().toISOString(),
          });
        }
        byName.set(groupKey, [{ id: childId, parentId: parentDocId }]);
      }
    }
  }
}

export async function createCategory(data: Partial<Category>) {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'categories');
    throw error;
  }
}

export async function updateCategory(id: string, data: Partial<Category>) {
  try {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, 'categories', id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    throw error;
  }
}

export async function deleteCategory(id: string) {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    throw error;
  }
}

export interface SearchSuggestion {
  type: 'product' | 'category' | 'brand';
  label: string;
  sublabel?: string;
  href: string;
  image?: string;
}

export function searchSuggestions(q: string, topN = 6): SearchSuggestion[] {
  if (!q || q.trim().length < 2) return [];
  const norm = q.toLowerCase().trim();

  const results: SearchSuggestion[] = [];

  // Product matches
  const productMatches = MOCK_PRODUCTS.filter(
    (p) => p.title.toLowerCase().includes(norm) || (p.brand ?? '').toLowerCase().includes(norm),
  ).slice(0, 4);
  for (const p of productMatches) {
    results.push({
      type: 'product',
      label: p.title,
      sublabel: p.brand,
      href: `/product/${p.slug}`,
      image: p.images[0],
    });
  }

  // Category matches (L1 + L2)
  const catMatches = CATEGORIES.filter((c) => c.name.toLowerCase().includes(norm)).slice(0, 3);
  for (const c of catMatches) {
    results.push({ type: 'category', label: c.name, href: `/category/${c.id}` });
  }

  // Brand dedup
  const brands = new Set<string>();
  for (const p of MOCK_PRODUCTS) {
    if (p.brand && p.brand.toLowerCase().includes(norm)) brands.add(p.brand);
  }
  for (const brand of Array.from(brands).slice(0, 2)) {
    results.push({
      type: 'brand',
      label: brand,
      href: `/search?brand=${encodeURIComponent(brand)}`,
    });
  }

  return results.slice(0, topN);
}

// ─── Batch Product Updates ──────────────────────────────────────────────────

export interface ProductBulkUpdate {
  productId: string;
  price?: number;
  stock?: number;
}

export interface BatchProductResult {
  successCount: number;
  failCount: number;
  errors: { productId: string; error: string }[];
}

/**
 * Atomically update price and/or stock for multiple products in a single batch write.
 * Supports up to 500 products per batch (Firestore limit).
 */
export async function batchUpdateProducts(
  updates: ProductBulkUpdate[],
): Promise<BatchProductResult> {
  if (updates.length === 0) return { successCount: 0, failCount: 0, errors: [] };
  if (updates.length > 500) throw new Error('En fazla 500 ürün aynı anda güncellenebilir.');

  const result: BatchProductResult = { successCount: 0, failCount: 0, errors: [] };
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const { productId, price, stock } of updates) {
    const data: Record<string, any> = { updatedAt: now };
    if (price !== undefined) data.price = price;
    if (stock !== undefined) data.stock = stock;
    batch.update(doc(db, 'products', productId), data);
  }

  try {
    await batch.commit();
    result.successCount = updates.length;

    // Record price history for price changes
    for (const { productId, price } of updates) {
      if (price !== undefined) {
        try {
          await recordPrice(productId, price);
        } catch {
          /* non-blocking */
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'products/batch');
    result.failCount = updates.length;
    result.errors = updates.map((u) => ({
      productId: u.productId,
      error: 'Batch update başarısız',
    }));
  }

  return result;
}

// ── Typesense sync helpers (fire-and-forget) ────────────────────────────────

async function syncToTypesense(id: string, data: Record<string, any>) {
  try {
    const secret = import.meta.env.VITE_TYPESENSE_SYNC_SECRET || 'dev-secret';
    const baseUrl = window.location.origin;
    await fetch(`${baseUrl}/api/typesense/sync/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Typesense-Sync-Secret': secret,
      },
      body: JSON.stringify({
        id,
        title: data.title || '',
        description: data.description || '',
        price: data.price || 0,
        categoryId: data.categoryId || '',
        brand: data.brand || '',
        rating: data.rating || 0,
        imageUrl: data.images?.[0] || data.imageUrl || '',
        storeId: data.storeId || '',
        language: data.language || 'tr',
        tags: data.tags || [],
        createdAt: data.createdAt?._seconds || Math.floor(Date.now() / 1000),
      }),
    });
  } catch {
    // Fire-and-forget: don't block the product operation on sync failure
  }
}

async function syncDeleteFromTypesense(id: string) {
  try {
    const secret = import.meta.env.VITE_TYPESENSE_SYNC_SECRET || 'dev-secret';
    const baseUrl = window.location.origin;
    await fetch(`${baseUrl}/api/typesense/sync/product/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'X-Typesense-Sync-Secret': secret },
    });
  } catch {
    // Fire-and-forget
  }
}
