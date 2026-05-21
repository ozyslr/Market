'use client';

import {
  collection, query, where, getDocs, doc, getDoc, setDoc, limit,
  addDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import { Product, Category } from '@/types';
import { recordPrice } from '@/services/priceHistoryService';

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

export async function getProducts(options?: GetProductsOptions): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef);

    if (options?.categoryId) q = query(q, where('categoryId', '==', options.categoryId));
    if (options?.sellerId) q = query(q, where('sellerId', '==', options.sellerId));
    if (options?.featured && !options.categoryId && !options.sellerId) {
      q = query(q, where('featured', '==', true));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];

    return options ? applyClientFilters(products, options) : products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Product;
    }

    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
    throw error;
  }
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    if (data.price !== undefined) {
      recordPrice(id, data.price);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    throw error;
  }
}

export async function decreaseProductStock(
  items: { productId: string; quantity: number }[]
): Promise<void> {
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

export async function deleteProduct(id: string): Promise<void> {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];
    return cats.sort((a, b) => (a.menuOrder ?? 999) - (b.menuOrder ?? 999));
  } catch (error) {
    return [];
  }
}

export async function createCategory(data: Partial<Category>): Promise<string> {
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

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
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

export async function deleteCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    throw error;
  }
}
