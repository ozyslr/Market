import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../mockData';

export async function getPendingProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    const firestoreProducts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    if (firestoreProducts.length > 0) return firestoreProducts;
    return MOCK_PRODUCTS.filter(p => p.status === 'pending');
  } catch {
    return MOCK_PRODUCTS.filter(p => p.status === 'pending');
  }
}

export async function approveProduct(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', id), {
      status: 'approved',
      moderationNote: '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('approveProduct error:', error);
    throw error;
  }
}

export async function rejectProduct(id: string, note: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', id), {
      status: 'rejected',
      moderationNote: note,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('rejectProduct error:', error);
    throw error;
  }
}

export async function requestChanges(id: string, note: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', id), {
      status: 'draft',
      moderationNote: note,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('requestChanges error:', error);
    throw error;
  }
}
