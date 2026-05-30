import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FeaturedDeal } from '../types';

const COL = 'featuredDeals';

export async function getAllDeals(): Promise<FeaturedDeal[]> {
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as FeaturedDeal))
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getActiveDeals(): Promise<FeaturedDeal[]> {
  try {
    const now = new Date().toISOString();
    const q = query(collection(db, COL), where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as FeaturedDeal))
      .filter(d => !d.endsAt || d.endsAt >= now)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function createDeal(data: Omit<FeaturedDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedDeal> {
  try {
    const id = `deal-${Date.now()}`;
    const deal: FeaturedDeal = { ...data, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, COL, id), deal);
    return deal;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COL);
    throw error;
  }
}

export async function updateDeal(id: string, data: Partial<FeaturedDeal>): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deleteDeal(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
    throw error;
  }
}

export async function reorderDeals(deals: { id: string; order: number }[]): Promise<void> {
  try {
    await Promise.all(deals.map(d => updateDoc(doc(db, COL, d.id), { order: d.order })));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COL);
    throw error;
  }
}
