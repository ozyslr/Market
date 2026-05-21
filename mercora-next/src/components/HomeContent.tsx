'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { Hero } from '@/components/home/Hero';
import { StoryBar } from '@/components/commerce/StoryBar';
import { ProductRecommendations } from '@/components/commerce/ProductRecommendations';
import { useLanguage } from '@/context/LanguageContext';
import type { Product, Category } from '@/types';

interface HomeContentProps {
  featured: Product[];
  bestSellers: Product[];
  flashDeals: Product[];
  categories: Category[];
}

export function HomeContent({ featured, bestSellers, flashDeals, categories }: HomeContentProps) {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero Section */}
      <Hero />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="flex-shrink-0 px-5 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-purple-300 hover:text-purple-700 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Story Bar */}
      <StoryBar />

      {/* Flash Deals */}
      {flashDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              <span className="text-red-600">{t('flash.deals')}</span>
            </h2>
            <Link href="/search?filter=flash" className="text-sm text-purple-700 font-medium hover:underline">
              {t('flash.view')}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {flashDeals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('home.popular_products')}</h2>
            <Link href="/search" className="text-sm text-purple-700 font-medium hover:underline">
              {t('global.see_all')}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <ProductRecommendations type="trending" maxResults={8} />
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('home.best_sellers')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {featured.length === 0 && bestSellers.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('global.discover')}
          </h2>
          <p className="text-gray-500 mb-8">
            Henüz ürün bulunamadı. Firebase Admin SDK yapılandırmasını kontrol edin.
          </p>
          <Link
            href="/sell"
            className="inline-block bg-purple-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors"
          >
            {t('nav.sell')}
          </Link>
        </section>
      )}
    </div>
  );
}
