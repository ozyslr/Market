'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { getCrossSellRecommendations, getSellerRecommendations, getTrendingRecommendations } from '@/services/recommendationService';

interface ProductSummary {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug?: string;
  rating?: number;
}

interface ProductRecommendationsProps {
  type: 'cross-sell' | 'seller' | 'trending';
  currentProductId?: string;
  category?: string;
  sellerId?: string;
  title?: string;
  maxResults?: number;
}

export function ProductRecommendations({
  type,
  currentProductId,
  category,
  sellerId,
  title,
  maxResults = 4,
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let results: ProductSummary[] = [];
        switch (type) {
          case 'cross-sell':
            if (category) {
              results = await getCrossSellRecommendations(currentProductId || '', category, [], maxResults);
            }
            break;
          case 'seller':
            if (sellerId) {
              results = await getSellerRecommendations(sellerId, currentProductId, maxResults);
            }
            break;
          case 'trending':
            results = await getTrendingRecommendations(maxResults);
            break;
        }
        setProducts(results);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, currentProductId, category, sellerId, maxResults]);

  if (loading) {
    return (
      <section className="my-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title || 'Recommended for you'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: maxResults }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="my-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title || 'Recommended for you'}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => (
          <Link
            key={p.id}
            href={`/product/${p.slug || p.id}`}
            className="group"
          >
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
              <OptimizedImage
                src={p.images?.[0] || ''}
                alt={p.name}
                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700">
              {p.name}
            </h4>
            <p className="text-sm font-bold text-purple-700">£{p.price.toFixed(2)}</p>
            {p.rating != null && p.rating > 0 && (
              <p className="text-xs text-gray-400">
                {'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5 - Math.round(p.rating))}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
