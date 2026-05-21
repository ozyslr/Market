'use client';

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export interface AppSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  currency: string;
  taxRate: number;
  shippingThreshold: number;
  shippingCost: number;
  commissionRate: number;
  minPayout: number;
  sellerCommissionRate: number;
  supportEmail: string;
  supportPhone?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  seo?: {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    metaKeywords?: string;
  };
  maintenanceMode: boolean;
  updatedAt: string;
  updatedBy: string;
}

const DOC_ID = 'app_settings';
const COL = 'settings';

export async function getSettings(): Promise<AppSettings | null> {
  try {
    const snap = await getDoc(doc(db, COL, DOC_ID));
    return snap.exists() ? (snap.data() as AppSettings) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COL}/${DOC_ID}`);
    return null;
  }
}

export async function saveSettings(data: AppSettings): Promise<void> {
  try {
    await setDoc(doc(db, COL, DOC_ID), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COL}/${DOC_ID}`);
    throw error;
  }
}

export async function updateSettings(data: Partial<AppSettings> & { updatedBy: string }): Promise<void> {
  try {
    await updateDoc(doc(db, COL, DOC_ID), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${DOC_ID}`);
    throw error;
  }
}
