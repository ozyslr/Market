import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { HomepageSection } from '../types';

const COL = 'homepage_sections';

export const DEFAULT_SECTIONS: HomepageSection[] = [
  { id: 'hero', type: 'hero', enabled: true, order: 0, config: { slides: [] } },
  { id: 'flash_deals', type: 'flash_deals', title: 'Günün Fırsatları', enabled: true, order: 1, config: { filter: 'isFlashDeal', limit: 20, flashDealEndTime: '' } },
  { id: 'popular', type: 'product_row', title: 'Popüler Ürünler', enabled: true, order: 2, config: { filter: 'bestSeller', limit: 20 } },
  { id: 'featured', type: 'product_row', title: 'Öne Çıkanlar', enabled: true, order: 3, config: { filter: 'featured', limit: 20 } },
  { id: 'new_arrivals', type: 'product_row', title: 'Yeni Gelenler', enabled: true, order: 4, config: { filter: 'newArrival', limit: 12 } },
];

export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const q = query(collection(db, COL), orderBy('order'));
    const snap = await getDocs(q);
    if (snap.empty) return DEFAULT_SECTIONS;
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HomepageSection));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return DEFAULT_SECTIONS;
  }
}

export async function upsertHomepageSection(section: HomepageSection): Promise<void> {
  try {
    const { id, ...data } = section;
    await setDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${section.id}`);
    throw error;
  }
}

export async function deleteHomepageSection(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
    throw error;
  }
}
