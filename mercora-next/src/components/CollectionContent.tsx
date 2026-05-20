'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductCard } from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/types';

const collectionQueries: Record<string, { field: string; label: string }> = {
  'best-sellers': { field: 'salesCount', label: 'Çok Satanlar' },
  'new-arrivals': { field: 'createdAt', label: 'Yeni Gelenler' },
  'flash-deals': { field: 'discountPercentage', label: 'Fırsatlar' },
};

export function CollectionContent({ type }: { type: string }) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const config = collectionQueries[type];

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const constraints: any[] = [where('isActive', '==', true)];
        if (type === 'flash-deals') {
          constraints.push(where('discountPercentage', '>', 0));
          constraints.push(orderBy('discountPercentage', 'desc'));
        } else if (config) {
          constraints.push(orderBy(config.field, 'desc'));
        }
        constraints.push(limit(50));
        const snap = await getDocs(query(collection(db, 'products'), ...constraints));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [type]);

  const title = config?.label || type;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-square" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p>Bu koleksiyonda henüz ürün bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
