import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MenuItem {
  id: string;
  label: string;
  link: string;
  imageUrl?: string;
  children?: MenuItem[];
  order: number;
  enabled: boolean;
}

const DEFAULT_MENU: MenuItem[] = [
  {
    id: 'all',
    label: 'Tüm Ürünler',
    link: '/store/{sellerId}?category=all',
    order: 1,
    enabled: true,
  },
  {
    id: 'new',
    label: 'Yeni Gelenler',
    link: '/store/{sellerId}?sort=newest',
    order: 2,
    enabled: true,
  },
  { id: 'deals', label: 'Fırsatlar', link: '/store/{sellerId}?tag=deals', order: 3, enabled: true },
  {
    id: 'about',
    label: 'Hakkımızda',
    link: '/store/{sellerId}?tab=about',
    order: 4,
    enabled: true,
  },
];

export async function getSellerMenu(sellerId: string): Promise<MenuItem[]> {
  try {
    const ref = doc(db, 'sellerMenus', sellerId);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data().items as MenuItem[];
  } catch {}
  return DEFAULT_MENU;
}

export async function saveSellerMenu(sellerId: string, items: MenuItem[]): Promise<void> {
  const ref = doc(db, 'sellerMenus', sellerId);
  await setDoc(ref, { items, sellerId, updatedAt: new Date().toISOString() });
}
