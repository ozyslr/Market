import { collection, query, where, getDocs, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';

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
