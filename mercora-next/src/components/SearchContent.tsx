'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { FilterPanel, type FilterGroup } from '@/components/commerce/FilterPanel';
import { useLanguage } from '@/context/LanguageContext';
import { searchProducts, getFacetedFilters } from '@/services/searchService';
import type { Product } from '@/types';

interface FacetInfo {
  categories: { id: string; name: string; count: number }[];
  brands: { name: string; count: number }[];
  priceRange: { min: number; max: number };
}

export function SearchContent({ query: initialQuery, categoryId }: { query: string; categoryId: string }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [showFilters, setShowFilters] = useState(false);
  const [facets, setFacets] = useState<FacetInfo | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load facets on mount
  useEffect(() => {
    getFacetedFilters(selectedCategory || undefined).then(f => setFacets(f ?? null));
  }, [selectedCategory]);

  // Search
  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchProducts({
        query: debouncedQuery || undefined,
        categoryId: selectedCategory || undefined,
        sortBy: sortBy as any,
        page,
        pageSize: 20,
        ...(priceRange.min ? { minPrice: Number(priceRange.min) } : {}),
        ...(priceRange.max ? { maxPrice: Number(priceRange.max) } : {}),
      });
      setProducts(result.products);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedCategory, sortBy, page, priceRange]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('');
    setSortBy('popular');
    setPriceRange({ min: '', max: '' });
    setPage(1);
  };

  const hasActiveFilters = debouncedQuery || selectedCategory || priceRange.min || priceRange.max;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('nav.search_placeholder')}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 pl-12 text-sm focus:border-purple-600 focus:outline-none"
          />
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 border-2 rounded-xl transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-purple-600 text-purple-600 bg-purple-50'
              : 'border-gray-300 text-gray-500 hover:border-gray-400'
          }`}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">{totalCount} sonuç</span>
          <div className="flex flex-wrap gap-2 ml-2">
            {debouncedQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                "{debouncedQuery}"
                <button onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}><X size={14} /></button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('')}><X size={14} /></button>
              </span>
            )}
            {(priceRange.min || priceRange.max) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                {priceRange.min || '0'} - {priceRange.max || '∞'} {t('cart.currency') || 'TL'}
                <button onClick={() => setPriceRange({ min: '', max: '' })}><X size={14} /></button>
              </span>
            )}
          </div>
          <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-gray-600 ml-2">
            Temizle
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        {showFilters && facets && (
          <FilterPanel
            groups={[
              ...(facets.categories.length > 0 ? [{
                id: 'category',
                label: 'Kategoriler',
                type: 'checkbox' as const,
                options: facets.categories.map(c => ({ id: c.id, label: c.name, count: c.count })),
              }] : []),
              ...(facets.brands.length > 0 ? [{
                id: 'brand',
                label: 'Markalar',
                type: 'checkbox' as const,
                options: facets.brands.map(b => ({ id: b.name, label: b.name, count: b.count })),
              }] : []),
            ]}
          />
        )}

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-square" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-30 hover:border-gray-400 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-gray-600">
                  {t('search.page') || 'Sayfa'} {page}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-30 hover:border-gray-400 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {debouncedQuery ? `${t('search.no_results') || 'Sonuç bulunamadı'}` : t('search.popular') || 'Popüler Ürünler'}
              </h2>
              <p className="text-gray-500">
                {debouncedQuery
                  ? `"${debouncedQuery}" ${t('search.try_different') || 'için sonuç bulunamadı, farklı bir arama deneyin'}`
                  : t('search.browse') || 'Kategorilere göz atın'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
