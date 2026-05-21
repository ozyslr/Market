'use client';

import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export interface BotProduct {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sellerId: string;
  stock: number;
  isActive: boolean;
  isBotGenerated: boolean;
  tags: string[];
  createdAt: string;
}

const DEMO_TEMPLATES = [
  { name: 'Premium El Yapımı Deri Cüzdan', category: 'Aksesuar', price: 299.99, tags: ['deri', 'el yapımı', 'erkek'] },
  { name: 'Organik Pamuklu Bebek Zıbın Seti', category: 'Bebek', price: 89.99, tags: ['organik', 'pamuk', 'bebek'] },
  { name: 'Paslanmaz Çelik Termos 750ml', category: 'Ev & Yaşam', price: 149.99, tags: ['termos', 'çelik', 'seyahat'] },
  { name: 'Akıllı LED Şerit Işık 5m', category: 'Elektronik', price: 199.99, tags: ['led', 'akıllı', 'dekorasyon'] },
  { name: 'Doğal Taş Yoga Matı', category: 'Spor', price: 349.99, tags: ['yoga', 'doğal', 'spor'] },
  { name: 'Mini Bluetooth Hoparlör', category: 'Elektronik', price: 249.99, tags: ['bluetooth', 'hoparlör', 'taşınabilir'] },
  { name: 'El Yapımı Seramik Kahve Fincanı Seti', category: 'Ev & Yaşam', price: 179.99, tags: ['seramik', 'el yapımı', 'kahve'] },
  { name: 'Kanvas Bilgisayar Çantası', category: 'Aksesuar', price: 229.99, tags: ['kanvas', 'laptop', 'çanta'] },
];

export async function generateBotProducts(sellerId: string, count = 4): Promise<string[]> {
  const ids: string[] = [];
  const selected = [...DEMO_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count);

  try {
    for (const tpl of selected) {
      const ref = await addDoc(collection(db, 'products'), {
        name: tpl.name,
        description: `Yüksek kaliteli ${tpl.name}, uygun fiyatla. Bot tarafından oluşturulmuştur.`,
        price: tpl.price,
        category: tpl.category,
        images: [],
        sellerId,
        stock: Math.floor(Math.random() * 50) + 10,
        isActive: true,
        isBotGenerated: true,
        tags: tpl.tags,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      });
      ids.push(ref.id);
    }
    return ids;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
    return ids;
  }
}

export async function getBotProducts(sellerId: string): Promise<BotProduct[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId),
      where('isBotGenerated', '==', true),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BotProduct));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
    return [];
  }
}

export async function deleteBotProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

export async function getTemplateCount(): Promise<number> {
  return DEMO_TEMPLATES.length;
}
