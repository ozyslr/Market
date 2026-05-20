'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductCard } from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/types';

export function CategoryContent({ categoryId }: { categoryId: string }) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'products'),
          where('categoryId', '==', categoryId),
          where('isActive', '==', true),
          limit(50)
        );
        const snap = await getDocs(q);
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [categoryId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 capitalize">{categoryId}</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-square" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">{t('search.popular')}</p>
        </div>
      )}
    </div>
  );
}
