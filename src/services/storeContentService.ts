import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type BlockType = 'flash_products' | 'trending_products' | 'campaign_banner' | 'category_cards' | 'promo_banner' | 'product_grid';

export interface ContentBlock {
  id: string;
  type: BlockType;
  title: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
}

const DEFAULT_BLOCKS: ContentBlock[] = [
  { id: 'flash', type: 'flash_products', title: 'Flaş Ürünler', enabled: true, order: 1, config: {} },
  { id: 'trending', type: 'trending_products', title: 'Trend Ürünler', enabled: true, order: 2, config: {} },
  { id: 'campaign', type: 'campaign_banner', title: 'Kampanyalar', enabled: true, order: 3, config: { title: 'Sezonun En İyi Fırsatları', description: 'Özel indirimler ve kampanyalar sizi bekliyor.' } },
  { id: 'categories', type: 'category_cards', title: 'Kategoriler', enabled: true, order: 4, config: {} },
  { id: 'promo', type: 'promo_banner', title: 'Öne Çıkanlar', enabled: true, order: 5, config: { leftTitle: 'İlkbahar Koleksiyonu', leftDesc: '%50 indirim', rightTitle: 'Premium Ürünler', rightDesc: 'Özel fiyatlar' } },
  { id: 'products', type: 'product_grid', title: 'Daha Fazla Ürün', enabled: true, order: 6, config: { pageSize: 12 } },
];

export async function getContentBlocks(sellerId: string): Promise<ContentBlock[]> {
  try {
    const ref = doc(db, 'storeContentBlocks', sellerId);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data().blocks as ContentBlock[];
  } catch {}
  return DEFAULT_BLOCKS;
}

export async function saveContentBlocks(sellerId: string, blocks: ContentBlock[]): Promise<void> {
  const ref = doc(db, 'storeContentBlocks', sellerId);
  await setDoc(ref, { blocks, sellerId, updatedAt: new Date().toISOString() });
}
