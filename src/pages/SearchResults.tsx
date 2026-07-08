import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  Search as SearchIcon,
  Star,
  MapPin,
  Globe,
  ShieldCheck,
  Zap,
  History,
  TrendingUp,
  SlidersHorizontal,
  Grid,
  List as ListIcon,
  ArrowRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { getCategories } from '@/services/productService';
import { getFacetedFilters, normalizeTR } from '@/services/searchService';
import { Category, FilterAttribute, Product } from '@/types';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/commerce/ProductCard';
import { FilterPanel, ActiveFilters, FacetCounts } from '@/components/commerce/FilterPanel';
import { useLanguage } from '@/context/LanguageContext';
import { SEO } from '@/components/common/SEO';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';

function mapSortValue(v: string): string {
  switch (v) {
    case 'price-asc':
      return 'price-asc';
    case 'price-desc':
      return 'price-desc';
    case 'best-selling':
      return 'popular';
    case 'rating':
      return 'rating';
    case 'newest':
      return 'newest';
    default:
      return v;
  }
}

function isProductInCategory(product: Product, catId: string, allCategories: Category[]): boolean {
  if (!catId) return true;
  if (product.categoryId === catId) return true;

  const cat = allCategories.find((c) => c.id === catId);
  if (!cat) return false;

  // If the category has a parent, the product must belong to that parent category
  if (cat.parentId && product.categoryId !== cat.parentId) return false;

  // Subcategory fallback keyword matching
  const words = new Set<string>();
  cat.name.split(/[\s&,_/-]+/).forEach((w) => words.add(normalizeTR(w)));
  cat.slug.split(/[_-]+/).forEach((w) => words.add(normalizeTR(w)));

  if (cat.items) {
    cat.items.forEach((item) => {
      item.name.split(/[\s&,_/-]+/).forEach((w) => words.add(normalizeTR(w)));
      item.query.split(/[_-]+/).forEach((w) => words.add(normalizeTR(w)));
    });
  }

  const keywords = Array.from(words)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 2);

  if (keywords.length === 0) return false;

  const productText = normalizeTR(
    `${product.title} ${product.description} ${product.brand} ${(product.tags ?? []).join(' ')}`,
  );

  return keywords.some((kw) => productText.includes(kw));
}

const RECENT_KEY = 'mercora_recent_searches';

function saveRecentSearch(q: string) {
  if (!q.trim()) return;
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [q, ...prev.filter((x) => x !== q)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* empty */
  }
}

export function SearchResultsPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const origin = searchParams.get('origin') || '';
  const delivery = searchParams.get('delivery') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  const minRating = searchParams.get('rating') || '';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoryFilterAttrs, setCategoryFilterAttrs] = useState<FilterAttribute[]>([]);
  const [searchLoading, setSearchLoading] = useState(true);
  const [facetCounts, setFacetCounts] = useState<FacetCounts>({});

  useEffect(() => {
    getCategories().then(setAllCategories);
    // Simulate brief loading for MOCK_PRODUCTS filtering
    const timer = setTimeout(() => setSearchLoading(false), 300);
    return () => clearTimeout(timer);
  }, [query, categoryId, tag, origin, delivery, sortBy, priceMin, priceMax, minRating]);

  useEffect(() => {
    if (!categoryId) {
      setCategoryFilterAttrs([]);
      return;
    }
    getCategories().then((cats) => {
      const cat = cats.find((c) => c.id === categoryId);
      setCategoryFilterAttrs(cat?.filterAttributes ?? []);
    });
  }, [categoryId]);

  // Fetch dynamic facet counts (brands, categories) for the sidebar
  useEffect(() => {
    getFacetedFilters(categoryId || undefined).then((facets) => {
      setFacetCounts({
        brands: facets?.brands ?? [],
      });
    });
  }, [categoryId]);

  const toggleFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    const current = next.get(key)?.split(',').filter(Boolean) ?? [];
    const idx = current.indexOf(value);
    if (idx === -1) current.push(value);
    else current.splice(idx, 1);
    current.length ? next.set(key, current.join(',')) : next.delete(key);
    setSearchParams(next);
  };

  useEffect(() => {
    if (query) saveRecentSearch(query);
  }, [query]);

  // Derive brand and stock params
  const brandsParam = searchParams.get('brand') || '';
  const selectedBrands = brandsParam ? brandsParam.split(',') : [];
  const inStockParam = searchParams.get('inStock') === '1';

  let results = MOCK_PRODUCTS.filter((p) => {
    if (p.status !== undefined && p.status !== 'approved') return false;
    const nq = normalizeTR(query);
    const matchesQuery =
      !query ||
      [p.title, p.description, p.brand, ...(p.tags ?? [])].some((field) =>
        normalizeTR(field ?? '').includes(nq),
      );
    const matchesCategory = isProductInCategory(p, categoryId, allCategories);
    const matchesTag =
      !tag ||
      (p.tags ?? []).includes(tag as any) ||
      (tag === 'deals' && p.oldPrice && p.oldPrice > p.price);
    const matchesOrigin =
      !origin || (origin === 'global' ? p.originCountry !== 'UK' : p.originCountry === origin);
    const matchesDelivery =
      !delivery || (delivery === 'prime' ? (p.estimatedDeliveryDays ?? 99) <= 2 : true);

    const matchesAttrs = categoryFilterAttrs.every((attr) => {
      const paramVal = searchParams.get(attr.key);
      if (!paramVal) return true;
      const selectedValues = paramVal.split(',');
      let productVal: string;
      if (attr.productField === 'top-level') {
        productVal = String((p as any)[attr.key] ?? '');
      } else {
        productVal = (p.attributes as Record<string, string>)?.[attr.key] ?? '';
      }
      return selectedValues.some((v) => productVal.toLowerCase().includes(v.toLowerCase()));
    });

    const matchesPrice =
      (!priceMin || p.price >= Number(priceMin)) && (!priceMax || p.price <= Number(priceMax));

    const matchesRating = !minRating || p.rating >= Number(minRating);

    // Brand filter (from FilterPanel)
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);

    // In stock filter (from FilterPanel)
    const matchesInStock = !inStockParam || (p.stock ?? 0) > 0;

    const matchesFreeShipping =
      searchParams.get('freeShipping') !== '1' ||
      (p.estimatedDeliveryDays != null && p.estimatedDeliveryDays <= 3);
    const matchesAdvantageous =
      searchParams.get('advantageous') !== '1' || (p.discountPercentage ?? 0) >= 10 || !!p.oldPrice;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesTag &&
      matchesOrigin &&
      matchesDelivery &&
      matchesAttrs &&
      matchesPrice &&
      matchesRating &&
      matchesBrand &&
      matchesInStock &&
      matchesFreeShipping &&
      matchesAdvantageous
    );
  });

  if (sortBy) {
    const mappedSort = mapSortValue(sortBy);
    results = [...results].sort((a, b) => {
      if (mappedSort === 'price-asc') return a.price - b.price;
      if (mappedSort === 'price-desc') return b.price - a.price;
      if (mappedSort === 'rating') return b.rating - a.rating;
      if (mappedSort === 'popular') return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
      if (mappedSort === 'newest') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      return 0;
    });
  }

  const categoryName = allCategories.find((c) => c.id === categoryId)?.name || tag || query;
  const hasActiveFilters = !!(
    priceMin ||
    priceMax ||
    minRating ||
    searchParams.get('freeShipping') === '1' ||
    searchParams.get('advantageous') === '1' ||
    selectedBrands.length > 0 ||
    inStockParam ||
    categoryFilterAttrs.some((a) => searchParams.get(a.key))
  );

  // ActiveFilters derived from URL searchParams for FilterPanel
  const panelFilters: ActiveFilters = useMemo(
    () => ({
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      rating: minRating ? Number(minRating) : undefined,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
      inStock: inStockParam || undefined,
      freeShipping: searchParams.get('freeShipping') === '1' || undefined,
    }),
    [
      priceMin,
      priceMax,
      minRating,
      selectedBrands.join(','),
      inStockParam,
      searchParams.get('freeShipping'),
    ],
  );

  // FilterPanel onChange -> sync to URL params
  const handleFilterPanelChange = useCallback(
    (f: ActiveFilters) => {
      const next = new URLSearchParams(searchParams);
      if (f.priceMin != null) next.set('price_min', String(f.priceMin));
      else next.delete('price_min');
      if (f.priceMax != null) next.set('price_max', String(f.priceMax));
      else next.delete('price_max');
      if (f.rating != null) next.set('rating', String(f.rating));
      else next.delete('rating');
      if (f.brands && f.brands.length > 0) next.set('brand', f.brands.join(','));
      else next.delete('brand');
      if (f.inStock) next.set('inStock', '1');
      else next.delete('inStock');
      if (f.freeShipping) next.set('freeShipping', '1');
      else next.delete('freeShipping');
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  // Sort change handler
  const handleSortChange = useCallback(
    (sort: string) => {
      const next = new URLSearchParams(searchParams);
      if (sort) next.set('sortBy', sort);
      else next.delete('sortBy');
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  // Active filters bar items (from URL params)
  const activeFilters = useMemo(() => {
    const filters: { key: string; value: string; label: string }[] = [];
    categoryFilterAttrs.forEach((attr) => {
      const val = searchParams.get(attr.key);
      if (val)
        val
          .split(',')
          .forEach((v) => filters.push({ key: attr.key, value: v, label: `${attr.label}: ${v}` }));
    });
    if (priceMin) filters.push({ key: 'price_min', value: priceMin, label: `Min: ${priceMin}₺` });
    if (priceMax) filters.push({ key: 'price_max', value: priceMax, label: `Max: ${priceMax}₺` });
    if (minRating)
      filters.push({
        key: 'rating',
        value: minRating,
        label: `${minRating}+ ${t('filter.andAbove')}`,
      });
    if (searchParams.get('freeShipping') === '1')
      filters.push({ key: 'freeShipping', value: '1', label: t('filter.freeShipping') });
    if (searchParams.get('advantageous') === '1')
      filters.push({ key: 'advantageous', value: '1', label: t('filter.advantageous') });
    if (inStockParam) filters.push({ key: 'inStock', value: '1', label: t('product.inStock') });
    if (selectedBrands.length > 0) {
      selectedBrands.forEach((b) => filters.push({ key: 'brand', value: b, label: b }));
    }
    return filters;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams,
    categoryFilterAttrs,
    priceMin,
    priceMax,
    minRating,
    inStockParam,
    selectedBrands.join(','),
  ]);

  const removeFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (
      [
        'price_min',
        'price_max',
        'rating',
        'freeShipping',
        'advantageous',
        'inStock',
        'brand',
      ].includes(key)
    ) {
      if (key === 'brand') {
        const current =
          next
            .get('brand')
            ?.split(',')
            .filter((v) => v !== value) ?? [];
        current.length ? next.set('brand', current.join(',')) : next.delete('brand');
      } else {
        next.delete(key);
      }
    } else {
      const current =
        next
          .get(key)
          ?.split(',')
          .filter((v) => v !== value) ?? [];
      current.length ? next.set(key, current.join(',')) : next.delete(key);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    const q = searchParams.get('q');
    const cid = searchParams.get('categoryId');
    if (q) next.set('q', q);
    if (cid) next.set('categoryId', cid);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-brand-secondary/20 pt-24 sm:pt-32 pb-10 sm:pb-20">
      <SEO
        title={`${results.length} Artifacts Found ${categoryName ? `- ${categoryName}` : ''}`}
        description={`Search results for ${categoryName || query}. Find the best deals and global artifacts on Benim Olan.`}
      />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Search Header / Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2 sm:mb-4">
              <Link to="/" className="hover:text-accent">
                Benim Olan Global
              </Link>
              <span>/</span>
              <span className="text-brand-primary">Search Results</span>
            </div>
            <h1 className="text-xl sm:text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic leading-tight">
              <span className="text-accent">{results.length}</span> Artifacts Found
              <span className="hidden sm:inline">
                {' '}
                within &quot;{categoryName || 'Global Catalog'}&quot;
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-950 rounded-2xl border border-brand-primary/5 shadow-sm text-[10px] font-black uppercase tracking-widest text-brand-primary"
            >
              <Filter size={14} /> {t('global.filter')}
            </button>

            <div className="flex bg-white dark:bg-zinc-950 rounded-2xl p-1 sm:p-1.5 border border-brand-primary/5 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest',
                  viewMode === 'grid'
                    ? 'bg-brand-primary text-white shadow-lg'
                    : 'text-brand-primary/40 hover:text-brand-primary',
                )}
              >
                <Grid size={14} /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest',
                  viewMode === 'list'
                    ? 'bg-brand-primary text-white shadow-lg'
                    : 'text-brand-primary/40 hover:text-brand-primary',
                )}
              >
                <ListIcon size={14} /> List
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          {/* Mobile Filter Drawer Overlay */}
          <AnimatePresence>
            {isMobileFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 end-0 w-[85%] max-w-[320px] bg-white dark:bg-zinc-950 z-[70] lg:hidden flex flex-col shadow-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-primary/5">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Filter size={16} /> Curated Filters
                    </h3>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="text-brand-primary/20"
                    >
                      <SlidersHorizontal size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                    <FilterPanel
                      filters={panelFilters}
                      onChange={handleFilterPanelChange}
                      facetCounts={facetCounts}
                      sortBy={sortBy}
                      onSortChange={handleSortChange}
                      className="border-none p-0 bg-transparent dark:bg-transparent shadow-none"
                    />
                    {categoryId && (
                      <CategoryAwareFilters
                        categoryId={categoryId}
                        categories={allCategories}
                        filterAttributes={categoryFilterAttrs}
                        searchParams={searchParams}
                        setSearchParams={setSearchParams}
                        toggleFilter={toggleFilter}
                        advantageous={searchParams.get('advantageous') === '1'}
                        filteredCount={results.length}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4"
                  >
                    Apply Filters
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Advanced Filters Sidebar */}
          <aside className="lg:col-span-3 space-y-6 sm:space-y-8 hidden lg:block">
            <div className="bg-white dark:bg-zinc-950 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-brand-primary/5">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-accent">
                  Curated Filters
                </h3>
                <SlidersHorizontal size={14} className="text-brand-primary/20" />
              </div>
              <FilterPanel
                filters={panelFilters}
                onChange={handleFilterPanelChange}
                facetCounts={facetCounts}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                className="border-none p-0 bg-transparent dark:bg-transparent shadow-none"
              />
              {categoryId && (
                <CategoryAwareFilters
                  categoryId={categoryId}
                  categories={allCategories}
                  filterAttributes={categoryFilterAttrs}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  toggleFilter={toggleFilter}
                  advantageous={searchParams.get('advantageous') === '1'}
                  filteredCount={results.length}
                />
              )}
            </div>

            {/* Strategic Banner */}
            <div className="bg-brand-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <Zap
                size={100}
                className="absolute -top-10 -end-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700"
              />
              <TrendingUp size={24} className="text-accent mb-4" />
              <h4 className="text-xl font-display font-black tracking-tight leading-tight mb-4 uppercase italic">
                Global <br /> Dynamic <br /> Insights
              </h4>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                We&apos;ve identified a 15% increase in demand for these artifacts in your region.
                Act fast.
              </p>
              <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all">
                View Market Pulse <ArrowRight size={14} />
              </button>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="lg:col-span-9">
            <ActiveFiltersBar
              filters={activeFilters}
              onRemove={removeFilter}
              onClearAll={clearAllFilters}
            />
            {searchLoading ? (
              <SearchResultsSkeleton />
            ) : (
              <div
                className={cn(
                  'grid gap-4 sm:gap-10',
                  viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1',
                )}
              >
                {results.length > 0 ? (
                  results.map((product) => <ProductCard key={product.id} product={product} />)
                ) : (
                  <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-brand-secondary rounded-full flex items-center justify-center mb-8 animate-bounce">
                      <SearchIcon size={40} className="text-brand-primary/10" />
                    </div>
                    <h3 className="text-3xl font-display font-black text-brand-primary opacity-20 uppercase italic">
                      The global archives are silent.
                    </h3>
                    <p className="text-brand-primary/40 mt-4 max-w-sm">
                      No artifacts matched your query. Try searching for broader artisan categories
                      or use the AI Assistant.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination / Load More */}
            {!searchLoading && results.length > 0 && (
              <div className="mt-20 flex flex-col items-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/20">
                  Archiving artifacts 1 - {results.length} of {results.length}
                </p>
                <button className="px-12 py-5 bg-white border border-brand-primary/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-primary hover:text-white transition-all shadow-xl shadow-brand-primary/5">
                  Load Global Feed
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Category-Aware Dynamic Filters ─────────────────────────────────────────

const CategoryAwareFilters: React.FC<{
  categoryId: string;
  categories: Category[];
  filterAttributes: FilterAttribute[];
  searchParams: URLSearchParams;
  setSearchParams: (p: URLSearchParams) => void;
  toggleFilter: (key: string, value: string) => void;
  advantageous: boolean;
  filteredCount: number;
}> = ({ filterAttributes, searchParams, setSearchParams, toggleFilter, filteredCount }) => {
  if (filterAttributes.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-brand-primary/5">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40 mb-4">
        Product Attributes
      </h4>
      {filterAttributes.map((attr) => {
        const currentVal = searchParams.get(attr.key);
        if (attr.type === 'checkbox' && attr.options) {
          return (
            <div key={attr.key} className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/60 mb-2">
                {attr.label}
              </p>
              {attr.options.map((opt) => {
                const selected = currentVal?.split(',').includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 py-1 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => toggleFilter(attr.key, opt.value)}
                      className="accent-accent rounded"
                    />
                    <span className="text-brand-primary/70">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          );
        }
        if (attr.type === 'range') {
          const min = searchParams.get(`${attr.key}_min`) || '';
          const max = searchParams.get(`${attr.key}_max`) || '';
          return (
            <div key={attr.key} className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/60 mb-2">
                {attr.label} {attr.unit ? `(${attr.unit})` : ''}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={min}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    e.target.value
                      ? next.set(`${attr.key}_min`, e.target.value)
                      : next.delete(`${attr.key}_min`);
                    setSearchParams(next);
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-brand-primary/10 rounded-lg bg-brand-secondary/20"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={max}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    e.target.value
                      ? next.set(`${attr.key}_max`, e.target.value)
                      : next.delete(`${attr.key}_max`);
                    setSearchParams(next);
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-brand-primary/10 rounded-lg bg-brand-secondary/20"
                />
              </div>
            </div>
          );
        }
        if (attr.type === 'rating') {
          return (
            <div key={attr.key} className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/60 mb-2">
                {attr.label}
              </p>
              {[4, 3, 2, 1].map((r) => (
                <label key={r} className="flex items-center gap-2 py-1 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name={attr.key}
                    checked={currentVal === String(r)}
                    onChange={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set(attr.key, String(r));
                      setSearchParams(next);
                    }}
                    className="accent-accent"
                  />
                  <span className="flex items-center gap-1 text-brand-primary/70">
                    {Array.from({ length: r }).map((_, i) => (
                      <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px]">& up</span>
                  </span>
                </label>
              ))}
            </div>
          );
        }
        return null;
      })}

      {/* Quick toggles */}
      <div className="pt-4 mt-4 border-t border-brand-primary/5 space-y-2">
        <label className="flex items-center gap-2 py-1 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={searchParams.get('freeShipping') === '1'}
            onChange={() => toggleFilter('freeShipping', '1')}
            className="accent-accent rounded"
          />
          <Zap size={12} className="text-green-500" />
          <span className="text-brand-primary/70">Free Shipping</span>
        </label>
        <label className="flex items-center gap-2 py-1 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={searchParams.get('advantageous') === '1'}
            onChange={() => toggleFilter('advantageous', '1')}
            className="accent-accent rounded"
          />
          <TrendingUp size={12} className="text-red-500" />
          <span className="text-brand-primary/70">Advantageous (10%+ discount)</span>
        </label>
      </div>

      <p className="text-[10px] text-brand-primary/30 mt-4">{filteredCount} results</p>
    </div>
  );
};

// ─── Active Filters Bar ───────────────────────────────────────────────────────

const ActiveFiltersBar: React.FC<{
  filters: { key: string; value: string; label: string }[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}> = ({ filters, onRemove, onClearAll }) => {
  const { t } = useLanguage();
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pb-4 mb-2">
      {filters.map((f) => (
        <button
          key={`${f.key}-${f.value}`}
          onClick={() => onRemove(f.key, f.value)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black hover:bg-accent/20 transition-all"
        >
          {f.label} <X size={10} />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="px-3 py-1.5 text-[10px] font-black text-brand-primary/40 hover:text-brand-primary transition-colors underline underline-offset-2"
      >
        {t('filter.clearAll')}
      </button>
    </div>
  );
};
