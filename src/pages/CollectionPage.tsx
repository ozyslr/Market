import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet as HelmetOrig } from 'react-helmet-async';
import { SlidersHorizontal, X, Package, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '@/types';
import { getProducts, GetProductsOptions } from '@/services/productService';
import { ProductCard } from '@/components/commerce/ProductCard';
import { Breadcrumb, BreadcrumbItem } from '@/components/common/Breadcrumb';
import { FilterPanel, ActiveFilters } from '@/components/commerce/FilterPanel';
import { cn } from '@/lib/utils';

// React 19 class component type compat
const Helmet = HelmetOrig as any;

// ---------------------------------------------------------------------------
// Collection config
// ---------------------------------------------------------------------------
interface CollectionMeta {
  label: string;
  description: string;
  heroGradient: string;
  baseFilter: GetProductsOptions;
}

const COLLECTIONS: Record<string, CollectionMeta> = {
  'best-sellers': {
    label: 'En Çok Satanlar',
    description: 'Müşterilerimizin en çok tercih ettiği ürünler',
    heroGradient: 'from-amber-600 via-orange-500 to-yellow-400',
    baseFilter: { bestSeller: true },
  },
  'new-arrivals': {
    label: 'Yeni Gelenler',
    description: 'Platforma yeni eklenen ürünleri keşfedin',
    heroGradient: 'from-emerald-600 via-teal-500 to-cyan-400',
    baseFilter: { newArrival: true },
  },
  'flash-deals': {
    label: 'Flash Fırsatları',
    description: 'Sınırlı süreli özel indirimler',
    heroGradient: 'from-red-600 via-rose-500 to-pink-400',
    baseFilter: { isFlashDeal: true },
  },
  deals: {
    label: 'Fırsatlar',
    description: 'İndirimli ürünlerde büyük tasarruf fırsatları',
    heroGradient: 'from-violet-600 via-purple-500 to-indigo-400',
    baseFilter: { hasDiscount: true },
  },
  featured: {
    label: 'Öne Çıkanlar',
    description: 'Editörlerimizin seçtiği özel koleksiyon',
    heroGradient: 'from-brand-primary via-zinc-700 to-zinc-500',
    baseFilter: { featured: true },
  },
};

const SORT_OPTIONS = [
  { value: 'default',    label: 'Önerilen' },
  { value: 'price-asc',  label: 'En Düşük Fiyat' },
  { value: 'price-desc', label: 'En Yüksek Fiyat' },
  { value: 'rating',     label: 'En Yüksek Puan' },
  { value: 'discount',   label: 'En Yüksek İndirim' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function CollectionPage() {
  const { type = 'featured' } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const config = COLLECTIONS[type];

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Redirect if unknown collection type
  useEffect(() => {
    if (!config) navigate('/', { replace: true });
  }, [config, navigate]);

  // Fetch base products for this collection
  useEffect(() => {
    if (!config) return;
    setLoading(true);
    setFilters({});
    setSortBy('default');
    getProducts(config.baseFilter)
      .then(setAllProducts)
      .finally(() => setLoading(false));
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive available brands from loaded products
  const availableBrands = useMemo(
    () => [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort() as string[],
    [allProducts]
  );

  // Apply UI-level filters + sort
  const displayProducts = useMemo(() => {
    let list = [...allProducts];

    if (filters.priceMin != null) list = list.filter(p => p.price >= filters.priceMin!);
    if (filters.priceMax != null) list = list.filter(p => p.price <= filters.priceMax!);
    if (filters.rating != null) list = list.filter(p => p.rating >= filters.rating!);
    if (filters.brands?.length) list = list.filter(p => filters.brands!.includes(p.brand));
    if (filters.inStock) list = list.filter(p => p.stock > 0);

    switch (sortBy) {
      case 'price-asc':  return list.sort((a, b) => a.price - b.price);
      case 'price-desc': return list.sort((a, b) => b.price - a.price);
      case 'rating':     return list.sort((a, b) => b.rating - a.rating);
      case 'discount':   return list.sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0));
      default:           return list;
    }
  }, [allProducts, filters, sortBy]);

  const handleFilterChange = useCallback((f: ActiveFilters) => setFilters(f), []);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Ana Sayfa', href: '/' },
    { label: config?.label ?? '' },
  ];

  if (!config) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Helmet>
        <title>{config.label} — Benim Olan</title>
        <meta name="description" content={config.description} />
      </Helmet>

      {/* Hero Banner */}
      <div className={cn('relative h-32 md:h-44 overflow-hidden bg-gradient-to-r', config.heroGradient)}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative h-full max-w-[1700px] mx-auto px-4 lg:px-8 flex flex-col justify-center gap-2">
          <Breadcrumb items={breadcrumbItems} light />
          <h1 className="text-2xl md:text-4xl font-display font-black uppercase italic text-white tracking-tight leading-none">
            {config.label}
          </h1>
          <p className="text-white/70 text-xs font-bold hidden md:block">{config.description}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-xs font-bold text-brand-primary/40 dark:text-white/40 shrink-0">
            {loading ? '...' : `${displayProducts.length} ürün`}
          </p>
          <div className="flex items-center gap-3 ml-auto">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-primary/10 dark:border-white/10 text-[11px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-white/60 hover:border-accent hover:text-accent transition-all lg:hidden"
            >
              <SlidersHorizontal size={13} /> Filtrele
            </button>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-brand-primary/10 dark:border-white/10 text-[11px] font-black bg-transparent text-brand-primary dark:text-white outline-none cursor-pointer hover:border-accent transition-all"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar filter */}
          <div className="hidden lg:block w-60 shrink-0">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              brands={availableBrands}
            />
          </div>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-3/4 bg-brand-secondary/30 dark:bg-zinc-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4 text-brand-primary/30 dark:text-white/30"
              >
                <Package size={48} strokeWidth={1} />
                <p className="text-lg font-black uppercase italic">Bu koleksiyonda ürün bulunamadı</p>
                <Link to="/" className="text-accent font-bold text-sm hover:underline flex items-center gap-1">
                  Ana Sayfaya Dön <ChevronRight size={14} />
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-zinc-900 z-50 overflow-y-auto p-4 lg:hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-black uppercase tracking-widest">Filtreler</span>
                <button onClick={() => setMobileFilterOpen(false)}>
                  <X size={20} className="text-brand-primary/50" />
                </button>
              </div>
              <FilterPanel
                filters={filters}
                onChange={f => { handleFilterChange(f); }}
                brands={availableBrands}
                className="border-none p-0 bg-transparent dark:bg-transparent"
              />
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="mt-4 w-full py-3 bg-accent text-white font-black text-sm rounded-2xl"
              >
                Sonuçları Gör ({displayProducts.length})
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
