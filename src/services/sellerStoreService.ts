import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface StoreConfig {
  storeName: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  brandColor: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  contactEmail: string;
  contactPhone: string;
  returnPolicy: string;
  shippingNote: string;
  lowStockThreshold: number;
  updatedAt: string;
}

const DEFAULT_CONFIG: StoreConfig = {
  storeName: '',
  description: '',
  logoUrl: '',
  bannerUrl: '',
  brandColor: '#6418E5',
  socialLinks: {},
  contactEmail: '',
  contactPhone: '',
  returnPolicy: '14 gün iade hakkı',
  shippingNote: '3-5 iş günü içinde kargo',
  lowStockThreshold: 5,
  updatedAt: '',
};

export async function getStoreConfig(sellerId: string): Promise<StoreConfig> {
  try {
    const ref = doc(db, 'storeConfigs', sellerId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { ...DEFAULT_CONFIG, ...snap.data() } as StoreConfig;
  } catch {}
  return DEFAULT_CONFIG;
}

export async function saveStoreConfig(
  sellerId: string,
  config: Partial<StoreConfig>,
): Promise<void> {
  const ref = doc(db, 'storeConfigs', sellerId);
  await setDoc(
    ref,
    {
      ...config,
      sellerId,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
