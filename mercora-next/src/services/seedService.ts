'use client';

import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

const SEED_PRODUCTS = [
  { name: 'Wireless Bluetooth Kulaklık', category: 'Elektronik', price: 449.99, stock: 50 },
  { name: 'Organik Pamuklu Havlu Seti', category: 'Ev & Yaşam', price: 89.99, stock: 120 },
  { name: 'Paslanmaz Çelik Su Şişesi', category: 'Spor', price: 129.99, stock: 200 },
  { name: 'El Yapımı Zeytinyağı Sabunu', category: 'Kişisel Bakım', price: 34.99, stock: 300 },
  { name: 'Akıllı LED Ampul Renkli', category: 'Elektronik', price: 79.99, stock: 150 },
  { name: 'Deri Cüzdan Erkek', category: 'Aksesuar', price: 199.99, stock: 40 },
  { name: "Bebek Pamuklu Tulum 3'lü Set", category: 'Bebek', price: 149.99, stock: 60 },
  { name: 'Meyve Sıkacağı 800W', category: 'Ev & Yaşam', price: 399.99, stock: 25 },
  { name: 'Yoga Matı 6mm', category: 'Spor', price: 179.99, stock: 80 },
  { name: 'Taşınabilir Şarj Cihazı 10000mAh', category: 'Elektronik', price: 249.99, stock: 100 },
];

export async function seedProducts(sellerId: string): Promise<number> {
  let count = 0;
  try {
    for (const p of SEED_PRODUCTS) {
      await addDoc(collection(db, 'products'), {
        ...p,
        description: `Yüksek kaliteli ${p.name}, uygun fiyatla.`,
        images: [],
        sellerId,
        isActive: true,
        isBotGenerated: true,
        tags: p.name.toLowerCase().split(' '),
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      });
      count++;
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
    return count;
  }
}

export async function seedCategories(): Promise<number> {
  const categories = [
    { name: 'Elektronik', slug: 'elektronik', icon: 'electronics' },
    { name: 'Ev & Yaşam', slug: 'ev-yasam', icon: 'home' },
    { name: 'Spor', slug: 'spor', icon: 'sports' },
    { name: 'Kişisel Bakım', slug: 'kisisel-bakim', icon: 'spa' },
    { name: 'Aksesuar', slug: 'aksesuar', icon: 'watch' },
    { name: 'Bebek', slug: 'bebek', icon: 'child_care' },
    { name: 'Giyim', slug: 'giyim', icon: 'checkroom' },
    { name: 'Kitap & Hobi', slug: 'kitap-hobi', icon: 'menu_book' },
  ];

  let count = 0;
  try {
    for (const c of categories) {
      await addDoc(collection(db, 'categories'), {
        ...c,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      count++;
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'categories');
    return count;
  }
}

export async function clearSeedData(): Promise<void> {
  try {
    const collections = ['products', 'categories'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      const deletions = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
      await Promise.all(deletions);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'seed data');
  }
}
