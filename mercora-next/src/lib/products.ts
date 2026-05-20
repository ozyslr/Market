'use cache';

import { cacheLife } from 'next/cache';
import { adminDb } from './firebase-admin';
import type { Product, Category } from '@/types';

/**
 * Fetch featured products from Firestore (server-side)
 * Cached with cacheLife('hours') — ISR-like behavior
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  cacheLife('hours');
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('products')
      .where('isActive', '==', true)
      .where('featured', '==', true)
      .limit(20)
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (err) {
    console.error('Failed to fetch featured products:', err);
    return [];
  }
}

/**
 * Fetch best seller products
 */
export async function getBestSellerProducts(): Promise<Product[]> {
  cacheLife('hours');
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('products')
      .where('isActive', '==', true)
      .where('bestSeller', '==', true)
      .limit(20)
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch {
    return [];
  }
}

/**
 * Fetch flash deal products
 */
export async function getFlashDealProducts(): Promise<Product[]> {
  cacheLife('hours');
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('products')
      .where('isActive', '==', true)
      .where('isFlashDeal', '==', true)
      .limit(10)
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch {
    return [];
  }
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<Category[]> {
  cacheLife('hours');
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('categories')
      .orderBy('menuOrder', 'asc')
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch {
    return [];
  }
}

/**
 * Fetch a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  cacheLife('hours');
  if (!adminDb) return null;

  try {
    const snap = await adminDb.collection('products')
      .where('slug', '==', slug)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Product;
  } catch {
    return null;
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  cacheLife('hours');
  if (!adminDb) return null;

  try {
    const doc = await adminDb.collection('products').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Product;
  } catch {
    return null;
  }
}

/**
 * Search products by query
 */
export async function searchProducts(query: string): Promise<Product[]> {
  cacheLife('minutes');
  if (!adminDb || !query.trim()) return [];

  try {
    const keywords = query.toLowerCase().split(' ').filter(Boolean);
    const snap = await adminDb.collection('products')
      .where('isActive', '==', true)
      .limit(50)
      .get();

    const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

    // Client-side filtering for text search
    return products.filter(p => {
      const searchText = `${p.title} ${p.description} ${p.brand} ${(p.tags || []).join(' ')}`.toLowerCase();
      return keywords.every(k => searchText.includes(k));
    });
  } catch {
    return [];
  }
}
