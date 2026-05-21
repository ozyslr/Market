'use client';

import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProductSummary {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  rating: number;
  createdAt: string;
}

export async function getCrossSellRecommendations(
  productId: string,
  category: string,
  excludeIds: string[] = [],
  maxResults = 8,
): Promise<ProductSummary[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('rating', 'desc'),
      limit(maxResults + excludeIds.length + 1),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ProductSummary))
      .filter(p => p.id !== productId && !excludeIds.includes(p.id))
      .slice(0, maxResults);
  } catch {
    return [];
  }
}

export async function getUpsellRecommendations(
  productId: string,
  minPrice: number,
  category: string,
  maxResults = 4,
): Promise<ProductSummary[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      where('isActive', '==', true),
      where('price', '>=', minPrice * 1.2),
      orderBy('price', 'asc'),
      limit(maxResults + 1),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ProductSummary))
      .filter(p => p.id !== productId)
      .slice(0, maxResults);
  } catch {
    return [];
  }
}

export async function getSellerRecommendations(
  sellerId: string,
  excludeProductId?: string,
  maxResults = 8,
): Promise<ProductSummary[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId),
      where('isActive', '==', true),
      orderBy('rating', 'desc'),
      limit(maxResults + 1),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ProductSummary))
      .filter(p => p.id !== excludeProductId)
      .slice(0, maxResults);
  } catch {
    return [];
  }
}

export async function getCategoryRecommendations(
  category: string,
  excludeIds: string[] = [],
  maxResults = 12,
): Promise<ProductSummary[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(maxResults + excludeIds.length),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ProductSummary))
      .filter(p => !excludeIds.includes(p.id))
      .slice(0, maxResults);
  } catch {
    return [];
  }
}

export async function getTrendingRecommendations(maxResults = 10): Promise<ProductSummary[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('isActive', '==', true),
      where('isTrending', '==', true),
      limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductSummary));
  } catch {
    return [];
  }
}
