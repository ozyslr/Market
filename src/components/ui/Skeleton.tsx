import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton atom — animasyonlu shimmer efekti
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%]',
      className
    )}
  />
);

/**
 * Ürün kartı skeleton'u — ProductCard ile aynı boyut/şekil
 */
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-brand-primary/5 overflow-hidden">
    {/* Image */}
    <Skeleton className="aspect-square w-full rounded-none" />
    {/* Content */}
    <div className="p-4 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  </div>
);

/**
 * Ürün grid skeleton'u — belirtilen sayıda kart
 */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Kategori listesi skeleton'u
 */
export const CategoryListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 shrink-0">
        <Skeleton className="w-20 h-20 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>
);

/**
 * Ürün detay sayfası skeleton'u
 */
export const ProductDetailSkeleton: React.FC = () => (
  <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
    {/* Breadcrumbs */}
    <div className="flex gap-2 mb-8">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>

    {/* Main content */}
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Gallery */}
      <div className="lg:col-span-7 space-y-4">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Product info */}
      <div className="lg:col-span-5 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-10 w-32" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Tablo satırı skeleton'u — admin/seller listeleri için
 */
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <div className="flex items-center gap-4 p-4 border-b border-brand-primary/5">
    {Array.from({ length: cols }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-4', i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'flex-1')}
      />
    ))}
  </div>
);

/**
 * Arama sonuçları skeleton'u
 */
export const SearchResultsSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Filters bar */}
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24 rounded-xl" />
      <Skeleton className="h-10 w-32 rounded-xl" />
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
    {/* Results */}
    <ProductGridSkeleton count={6} />
  </div>
);
