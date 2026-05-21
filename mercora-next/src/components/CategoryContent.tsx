'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { SlidersHorizontal, ChevronRight, Package } from 'lucide-react';
import { getCategories, getProducts } from '@/services/productService';
import { ProductCard } from '@/components/ProductCard';
import { Breadcrumb, type BreadcrumbItem } from '@/components/common/Breadcrumb';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import type { Product, Category } from '@/types';

const SORT_OPTIONS = [
  { value: 'default', label: 'Önerilen' },
  { value: 'price-asc', label: 'En Düşük Fiyat' },
  { value: 'price-desc', label: 'En Yüksek Fiyat' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'newest', label: 'En Yeni' },
];

export function CategoryContent({ categoryId }: { categoryId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFilter = searchParams.get('q') || '';

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCategories(),
      getProducts({ categoryId }),
    ]).then(([cats, prods]) => {
      setAllCategories(cats);
      setProducts(prods);
    }).finally(() => setLoading(false));
  }, [categoryId]);

  const category = allCategories.find(c => c.id === categoryId);
  const parentCategory = category?.parentId
    ? allCategories.find(c => c.id === category.parentId)
    : null;
  const subCategories = allCategories.filter(c => c.parentId === categoryId);

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    if (parentCategory) {
      items.push({ label: parentCategory.name, href: `/category/${parentCategory.id}` });
    }
    items.push({ label: category?.name ?? categoryId ?? '' });
    return items;
  }, [category, parentCategory, categoryId]);

  const sortedProducts = useMemo(() => {
    let list = qFilter
      ? products.filter(p =>
          p.title.toLowerCase().includes(qFilter.toLowerCase()) ||
          (p.brand ?? '').toLowerCase().includes(qFilter.toLowerCase())
        )
      : products;

    switch (sortBy) {
      case 'price-asc':  return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...list].sort((a, b) => b.price - a.price);
      case 'rating':     return [...list].sort((a, b) => b.rating - a.rating);
      default:           return list;
    }
  }, [products, sortBy, qFilter]);

  const heroBg = category?.image;

  if (!loading && !category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-400">
        <Package size={48} />
        <p className="text-lg font-bold italic">Kategori bulunamadı</p>
        <Link href="/" className="text-purple-600 font-medium text-sm hover:underline">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero/Banner */}
      <div className={cn(
        'relative overflow-hidden',
        heroBg ? 'h-32 md:h-44' : 'h-20 md:h-28 bg-gradient-to-r from-gray-900 to-gray-700'
      )}>
        {heroBg && (
          <img
            src={heroBg}
            alt={category?.name}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/60 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-8 flex flex-col justify-center gap-2">
          <Breadcrumb items={breadcrumbItems} />
          {loading ? (
            <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
          ) : (
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-none">
              {category?.name}
            </h1>
          )}
          {category?.description && (
            <p className="text-white/60 text-xs font-medium hidden md:block">{category.description}</p>
          )}
        </div>
      </div>

      {/* Sub-category chips */}
      {subCategories.length > 0 && (
        <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
              <Link
                href={`/category/${categoryId}`}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border',
                  !qFilter
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-gray-200 text-gray-500 hover:border-purple-600 hover:text-purple-600'
                )}
              >
                Tümü
              </Link>
              {subCategories.map(sub => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-500 hover:border-purple-600 hover:text-purple-600 transition-all"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
        <p className="text-xs font-bold text-gray-400 shrink-0">
          {loading ? '...' : `${sortedProducts.length} ürün`}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => router.push(`/search?categoryId=${categoryId}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-500 hover:border-purple-600 hover:text-purple-600 transition-all"
          >
            <SlidersHorizontal size={13} /> Filtrele
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-transparent text-gray-900 outline-none cursor-pointer hover:border-purple-600 transition-all"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-16">
        {loading ? (
          <SearchResultsSkeleton count={10} />
        ) : sortedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-gray-300"
          >
            <Package size={48} strokeWidth={1} />
            <p className="text-lg font-bold italic text-gray-400">Bu kategoride ürün bulunamadı</p>
            <Link
              href="/"
              className="text-purple-600 font-medium text-sm hover:underline flex items-center gap-1"
            >
              Ana Sayfaya Dön <ChevronRight size={14} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
