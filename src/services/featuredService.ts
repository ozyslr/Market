import { collection, query, where, getDocs, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, FeaturedDeal } from '@/types';

const PRODUCTS_COL = 'products';

export async function getFeaturedProducts(count = 8): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COL),
      where('featured', '==', true),
      where('status', '==', 'approved'),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch {
    return [];
  }
}

export async function toggleFeatured(productId: string, featured: boolean): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COL, productId), { featured });
}

export async function getFeaturedDeals(): Promise<FeaturedDeal[]> {
  try {
    const q = query(
      collection(db, 'featuredDeals'),
      where('active', '==', true),
      limit(10)
    );
    const snap = await getDocs(q);
    const now = new Date().toISOString();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as FeaturedDeal))
      .filter(d => !d.endsAt || d.endsAt >= now)
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}
