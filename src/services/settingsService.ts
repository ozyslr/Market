import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SiteSettings } from '../types';

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 'global',
  siteName: 'Mercora',
  maintenanceMode: false,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    return snap.exists() ? (snap.data() as SiteSettings) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSiteSettings(data: Partial<SiteSettings>): Promise<void> {
  await setDoc(
    doc(db, 'settings', 'global'),
    { ...data, id: 'global', updatedAt: serverTimestamp() },
    { merge: true }
  );
}
