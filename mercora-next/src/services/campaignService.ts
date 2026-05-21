'use client';

import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export type CampaignType = 'discount' | 'banner' | 'coupon' | 'flash_sale';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  description?: string;
  discountPercent?: number;
  maxDiscount?: number;
  minOrder?: number;
  bannerImage?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  targetCategory?: string;
  targetSeller?: string;
  usageLimit?: number;
  usedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const COL = 'campaigns';

export async function createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, COL), { ...data, createdAt: now, updatedAt: now });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
  }
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  try {
    const all = await getCampaigns();
    const now = new Date().toISOString();
    return all.filter(c => c.status === 'active' && c.startDate <= now && c.endDate >= now);
  } catch {
    return [];
  }
}
