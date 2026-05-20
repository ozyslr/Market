'use cache';

import { cacheLife } from 'next/cache';
import { MainLayout } from '@/components/layout/MainLayout';
import { getFeaturedProducts, getBestSellerProducts, getFlashDealProducts, getCategories } from '@/lib/products';
import { HomeContent } from '@/components/HomeContent';

export default async function HomePage() {
  cacheLife('hours');

  const [featured, bestSellers, flashDeals, categories] = await Promise.all([
    getFeaturedProducts(),
    getBestSellerProducts(),
    getFlashDealProducts(),
    getCategories(),
  ]);

  return (
    <MainLayout>
      <HomeContent
        featured={featured}
        bestSellers={bestSellers}
        flashDeals={flashDeals}
        categories={categories}
      />
    </MainLayout>
  );
}
