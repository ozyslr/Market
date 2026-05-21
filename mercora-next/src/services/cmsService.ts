'use client';

import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished: boolean;
  layout?: 'default' | 'full_width' | 'landing';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CMSSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  order: number;
  isActive: boolean;
}

const PAGES_COL = 'cmsPages';
const SLIDES_COL = 'cmsSlides';

export async function createCMSPage(data: Omit<CMSPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, PAGES_COL), { ...data, createdAt: now, updatedAt: now });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PAGES_COL);
    throw error;
  }
}

export async function getCMSPages(): Promise<CMSPage[]> {
  try {
    const q = query(collection(db, PAGES_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CMSPage));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PAGES_COL);
    return [];
  }
}

export async function getCMSPageBySlug(slug: string): Promise<CMSPage | null> {
  try {
    const pages = await getCMSPages();
    return pages.find(p => p.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function updateCMSPage(id: string, data: Partial<CMSPage>): Promise<void> {
  try {
    await updateDoc(doc(db, PAGES_COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PAGES_COL}/${id}`);
    throw error;
  }
}

export async function deleteCMSPage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PAGES_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PAGES_COL}/${id}`);
  }
}

export async function getSlides(): Promise<CMSSlide[]> {
  try {
    const q = query(collection(db, SLIDES_COL), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CMSSlide));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SLIDES_COL);
    return [];
  }
}

export async function saveSlide(data: Omit<CMSSlide, 'id'>): Promise<string> {
  try {
    const ref = await addDoc(collection(db, SLIDES_COL), data);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SLIDES_COL);
    throw error;
  }
}

export async function deleteSlide(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SLIDES_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SLIDES_COL}/${id}`);
  }
}
