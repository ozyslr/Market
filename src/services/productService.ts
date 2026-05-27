import { collection, query, where, getDocs, doc, getDoc, setDoc, limit, addDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
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

function applyClientFilters(products: Product[], options: GetProductsOptions): Product[] {
  let list = products;
  if (!options.includeNonApproved) list = list.filter(isApproved);
  if (options.categoryId) list = list.filter(p => p.categoryId === options.categoryId);
  if (options.featured) list = list.filter(p => p.featured);
  if (options.sellerId) list = list.filter(p => p.sellerId === options.sellerId);
  if (options.bestSeller) list = list.filter(p => p.bestSeller);
  if (options.newArrival) list = list.filter(p => p.newArrival);
  if (options.isFlashDeal) list = list.filter(p => p.isFlashDeal);
  if (options.isTrending) list = list.filter(p => p.isTrending);
  if (options.isAiPick) list = list.filter(p => p.isAiPick);
  if (options.hasDiscount) list = list.filter(p => (p.discountPercentage ?? 0) > 0 || !!p.oldPrice);
  if (options.tag) list = list.filter(p => p.tags?.includes(options.tag!));
  if (options.brand) list = list.filter(p => p.brand?.toLowerCase() === options.brand!.toLowerCase());
  if (options.inStock) list = list.filter(p => p.stock > 0);
  if (options.priceMin != null) list = list.filter(p => p.price >= options.priceMin!);
  if (options.priceMax != null) list = list.filter(p => p.price <= options.priceMax!);
  if (options.minRating != null) list = list.filter(p => p.rating >= options.minRating!);
  if (options.limit) list = list.slice(0, options.limit);
  return list;
}

export async function getProducts(options?: GetProductsOptions) {
  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef);

    // Apply simple single-field Firestore filters to narrow the dataset
    if (options?.categoryId) q = query(q, where('categoryId', '==', options.categoryId));
    if (options?.sellerId) q = query(q, where('sellerId', '==', options.sellerId));
    if (options?.featured && !options.categoryId && !options.sellerId) {
      q = query(q, where('featured', '==', true));
    }

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];

    if (products.length === 0) products = MOCK_PRODUCTS;

    // Ensure all products have slugs
    products = products.map(ensureProductHasSlug);

    return options ? applyClientFilters(products, options) : products;
  } catch (error) {
    console.error("Error fetching products:", error);
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
    let product = MOCK_PRODUCTS.find(p => p.slug === slug);

    // If not found, try by generated slug
    if (!product) {
      product = MOCK_PRODUCTS.find(p => generateSlug(p.title) === slug);
    }

    // If still not found, try partial match (slug starts with or contains key words)
    if (!product) {
      const slugWords = slug.split('-').filter(w => w.length > 2);
      product = MOCK_PRODUCTS.find(p => {
        const productSlug = p.slug || generateSlug(p.title);
        return slugWords.some(word => productSlug.includes(word)) &&
               slugWords.every(word => productSlug.includes(word));
      });
    }

    return product ? ensureProductHasSlug(product) : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    let product = MOCK_PRODUCTS.find(p => p.slug === slug);
    if (!product) {
      product = MOCK_PRODUCTS.find(p => generateSlug(p.title) === slug);
    }
    if (!product) {
      const slugWords = slug.split('-').filter(w => w.length > 2);
      product = MOCK_PRODUCTS.find(p => {
        const productSlug = p.slug || generateSlug(p.title);
        return slugWords.some(word => productSlug.includes(word)) &&
               slugWords.every(word => productSlug.includes(word));
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
      updatedAt: serverTimestamp()
    });
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
      updatedAt: serverTimestamp()
    });
    if (data.price !== undefined) {
      recordPrice(id, data.price);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    throw error;
  }
}

export async function decreaseProductStock(items: { productId: string; quantity: number }[]): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      for (const { productId, quantity } of items) {
        const ref = doc(db, 'products', productId);
        const snap = await tx.get(ref);
        if (snap.exists()) {
          const current = (snap.data().stock as number) ?? 0;
          tx.update(ref, { stock: Math.max(0, current - quantity) });
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'products/stock');
  }
}

export async function deleteProduct(id: string) {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    throw error;
  }
}

export async function getCategories() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];
    return cats.sort((a, b) => (a.menuOrder ?? 999) - (b.menuOrder ?? 999));
  } catch (error) {
    return CATEGORIES;
  }
}

export async function seedDefaultCategories(): Promise<void> {
  const existingSnap = await getDocs(collection(db, 'categories'));
  const existing = existingSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));

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
          name: cat.name, slug: cat.slug, icon: cat.icon ?? '',
          image: cat.image ?? '', description: cat.description ?? '',
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
      const canonical = groupEntries.find(e => e.parentId) ?? groupEntries[0];

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
            name: group.name, slug: childId, parentId: parentDocId,
            icon: '', image: '', description: '',
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
      createdAt: serverTimestamp()
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
      updatedAt: serverTimestamp()
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
  const productMatches = MOCK_PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(norm) || (p.brand ?? '').toLowerCase().includes(norm)
  ).slice(0, 4);
  for (const p of productMatches) {
    results.push({ type: 'product', label: p.title, sublabel: p.brand, href: `/product/${p.slug}`, image: p.images[0] });
  }

  // Category matches (L1 + L2)
  const catMatches = CATEGORIES.filter(c => c.name.toLowerCase().includes(norm)).slice(0, 3);
  for (const c of catMatches) {
    results.push({ type: 'category', label: c.name, href: `/category/${c.id}` });
  }

  // Brand dedup
  const brands = new Set<string>();
  for (const p of MOCK_PRODUCTS) {
    if (p.brand && p.brand.toLowerCase().includes(norm)) brands.add(p.brand);
  }
  for (const brand of Array.from(brands).slice(0, 2)) {
    results.push({ type: 'brand', label: brand, href: `/search?brand=${encodeURIComponent(brand)}` });
  }

  return results.slice(0, topN);
}
