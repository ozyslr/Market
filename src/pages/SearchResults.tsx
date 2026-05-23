import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter, Search as SearchIcon, ChevronDown, Star,
  MapPin, Globe, ShieldCheck, Zap, History,
  TrendingUp, SlidersHorizontal, Grid, List as ListIcon,
  ArrowRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PRODUCTS } from '@/mockData';
import { getCategories } from '@/services/productService';
import { Category, FilterAttribute, Product } from '@/types';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/commerce/ProductCard';
import { useLanguage } from '@/context/LanguageContext';
import { SEO } from '@/components/common/SEO';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';

function normalizeTR(s: string): string {
  return s
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ç/g, 'c')
    .replace(/İ/g, 'i').replace(/Ş/g, 's').replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/Ö/g, 'o').replace(/Ç/g, 'c');
}

function isProductInCategory(product: Product, catId: string, allCategories: Category[]): boolean {
  if (!catId) return true;
  if (product.categoryId === catId) return true;
  
  const cat = allCategories.find(c => c.id === catId);
  if (!cat) return false;
  
  // If the category has a parent, the product must belong to that parent category
  if (cat.parentId && product.categoryId !== cat.parentId) return false;
  
  // Subcategory fallback keyword matching
  const words = new Set<string>();
  cat.name.split(/[\s&,_\/\-]+/).forEach(w => words.add(normalizeTR(w)));
  cat.slug.split(/[_\-]+/).forEach(w => words.add(normalizeTR(w)));
  
  if (cat.items) {
    cat.items.forEach(item => {
      item.name.split(/[\s&,_\/\-]+/).forEach(w => words.add(normalizeTR(w)));
      item.query.split(/[_\-]+/).forEach(w => words.add(normalizeTR(w)));
    });
  }
  
  const keywords = Array.from(words)
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 2);
    
  if (keywords.length === 0) return false;
  
  const productText = normalizeTR(`${product.title} ${product.description} ${product.brand} ${(product.tags ?? []).join(' ')}`);
  
  return keywords.some(kw => productText.includes(kw));
}

const RECENT_KEY = 'mercora_recent_searches';

function saveRecentSearch(q: string) {
  if (!q.trim()) return;
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [q, ...prev.filter(x => x !== q)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
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

  useEffect(() => {
    getCategories().then(setAllCategories);
    // Simulate brief loading for MOCK_PRODUCTS filtering
    const timer = setTimeout(() => setSearchLoading(false), 300);
    return () => clearTimeout(timer);
  }, [query, categoryId, tag, origin, delivery, sortBy, priceMin, priceMax, minRating]);

  useEffect(() => {
    if (!categoryId) { setCategoryFilterAttrs([]); return; }
    getCategories().then(cats => {
      const cat = cats.find(c => c.id === categoryId);
      setCategoryFilterAttrs(cat?.filterAttributes ?? []);
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

  useEffect(() => { if (query) saveRecentSearch(query); }, [query]);

  let results = MOCK_PRODUCTS.filter(p => {
    if (p.status !== undefined && p.status !== 'approved') return false;
    const nq = normalizeTR(query);
    const matchesQuery = !query || [p.title, p.description, p.brand, ...(p.tags ?? [])]
      .some(field => normalizeTR(field ?? '').includes(nq));
    const matchesCategory = isProductInCategory(p, categoryId, allCategories);
    const matchesTag = !tag || p.tags.includes(tag as any) || (tag === 'deals' && (p.oldPrice && p.oldPrice > p.price));
    const matchesOrigin = !origin || (origin === 'global' ? p.originCountry !== 'UK' : p.originCountry === origin);
    const matchesDelivery = !delivery || (delivery === 'prime' ? p.estimatedDeliveryDays <= 2 : true);

    const matchesAttrs = categoryFilterAttrs.every(attr => {
      const paramVal = searchParams.get(attr.key);
      if (!paramVal) return true;
      const selectedValues = paramVal.split(',');
      let productVal: string;
      if (attr.productField === 'top-level') {
        productVal = String((p as any)[attr.key] ?? '');
      } else {
        productVal = (p.attributes as Record<string, string>)?.[attr.key] ?? '';
      }
      return selectedValues.some(v => productVal.toLowerCase().includes(v.toLowerCase()));
    });

    const matchesPrice =
      (!priceMin || p.price >= Number(priceMin)) &&
      (!priceMax || p.price <= Number(priceMax));

    const matchesRating = !minRating || p.rating >= Number(minRating);

    const matchesFreeShipping = searchParams.get('freeShipping') !== '1' ||
      (p.estimatedDeliveryDays != null && p.estimatedDeliveryDays <= 3);
    const matchesAdvantageous = searchParams.get('advantageous') !== '1' ||
      (p.discountPercentage ?? 0) >= 10 || !!p.oldPrice;

    return matchesQuery && matchesCategory && matchesTag && matchesOrigin &&
           matchesDelivery && matchesAttrs && matchesPrice && matchesRating &&
           matchesFreeShipping && matchesAdvantageous;
  });

  if (sortBy) {
    results = [...results].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }

  const categoryName = allCategories.find(c => c.id === categoryId)?.name || tag || query;
  const hasActiveFilters = !!(priceMin || priceMax || minRating ||
    searchParams.get('freeShipping') === '1' ||
    searchParams.get('advantageous') === '1' ||
    categoryFilterAttrs.some(a => searchParams.get(a.key)));

  const activeFilters = useMemo(() => {
    const filters: { key: string; value: string; label: string }[] = [];
    categoryFilterAttrs.forEach(attr => {
      const val = searchParams.get(attr.key);
      if (val) val.split(',').forEach(v => filters.push({ key: attr.key, value: v, label: `${attr.label}: ${v}` }));
    });
    if (priceMin) filters.push({ key: 'price_min', value: priceMin, label: `Min: ${priceMin}₺` });
    if (priceMax) filters.push({ key: 'price_max', value: priceMax, label: `Max: ${priceMax}₺` });
    if (minRating) filters.push({ key: 'rating', value: minRating, label: `${minRating}+ ${t('filter.andAbove')}` });
    if (searchParams.get('freeShipping') === '1') filters.push({ key: 'freeShipping', value: '1', label: t('filter.freeShipping') });
    if (searchParams.get('advantageous') === '1') filters.push({ key: 'advantageous', value: '1', label: t('filter.advantageous') });
    return filters;
  }, [searchParams, categoryFilterAttrs, priceMin, priceMax, minRating]);

  const removeFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (['price_min', 'price_max', 'rating', 'freeShipping', 'advantageous'].includes(key)) {
      next.delete(key);
    } else {
      const current = next.get(key)?.split(',').filter(v => v !== value) ?? [];
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
        description={`Search results for ${categoryName || query}. Find the best deals and global artifacts on Mercora.`}
      />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Search Header / Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2 sm:mb-4">
              <Link to="/" className="hover:text-accent">Mercora Global</Link>
              <span>/</span>
              <span className="text-brand-primary">Search Results</span>
            </div>
            <h1 className="text-xl sm:text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic leading-tight">
               <span className="text-accent">{results.length}</span> Artifacts Found
               <span className="hidden sm:inline"> within "{categoryName || 'Global Catalog'}"</span>
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
                  className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest", viewMode === 'grid' ? "bg-brand-primary text-white shadow-lg" : "text-brand-primary/40 hover:text-brand-primary")}
                >
                  <Grid size={14} /> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest", viewMode === 'list' ? "bg-brand-primary text-white shadow-lg" : "text-brand-primary/40 hover:text-brand-primary")}
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
                  className="fixed inset-y-0 right-0 w-[85%] max-w-[320px] bg-white dark:bg-zinc-950 z-[70] lg:hidden flex flex-col shadow-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-primary/5">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Filter size={16} /> Curated Filters</h3>
                    <button onClick={() => setIsMobileFilterOpen(false)} className="text-brand-primary/20"><SlidersHorizontal size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                    <FilterContent
                      categoryId={categoryId}
                      categories={allCategories}
                      filterAttributes={categoryFilterAttrs}
                      searchParams={searchParams}
                      setSearchParams={setSearchParams}
                      toggleFilter={toggleFilter}
                      filteredCount={results.length}
                    />
                  </div>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4">Apply Filters</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Advanced Filters Sidebar */}
          <aside className="lg:col-span-3 space-y-6 sm:space-y-8 hidden lg:block">
            <div className="bg-white dark:bg-zinc-950 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-brand-primary/5">
               <div className="flex items-center justify-between mb-6 sm:mb-8">
                 <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-accent">Curated Filters</h3>
                 <SlidersHorizontal size={14} className="text-brand-primary/20" />
               </div>
               <FilterContent
                 categoryId={categoryId}
                 categories={allCategories}
                 filterAttributes={categoryFilterAttrs}
                 searchParams={searchParams}
                 setSearchParams={setSearchParams}
                 toggleFilter={toggleFilter}
                 filteredCount={results.length}
               />
            </div>

            {/* Strategic Banner */}
            <div className="bg-brand-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <Zap size={100} className="absolute -top-10 -right-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
               <TrendingUp size={24} className="text-accent mb-4" />
               <h4 className="text-xl font-display font-black tracking-tight leading-tight mb-4 uppercase italic">Global <br /> Dynamic <br /> Insights</h4>
               <p className="text-xs text-white/60 font-medium leading-relaxed">We've identified a 15% increase in demand for these artifacts in your region. Act fast.</p>
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
              <div className={cn(
                 "grid gap-4 sm:gap-10",
                 viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              )}>
                {results.length > 0 ? (
                  results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-brand-secondary rounded-full flex items-center justify-center mb-8 animate-bounce">
                      <SearchIcon size={40} className="text-brand-primary/10" />
                    </div>
                    <h3 className="text-3xl font-display font-black text-brand-primary opacity-20 uppercase italic">The global archives are silent.</h3>
                    <p className="text-brand-primary/40 mt-4 max-w-sm">No artifacts matched your query. Try searching for broader artisan categories or use the AI Assistant.</p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination / Load More */}
            {!searchLoading && results.length > 0 && (
              <div className="mt-20 flex flex-col items-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/20">Archiving artifacts 1 - {results.length} of {results.length}</p>
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
      {filters.map(f => (
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

// ─── Filter sub-components ────────────────────────────────────────────────────

const FilterSection: React.FC<{
  title: string;
  activeCount?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, activeCount = 0, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brand-primary/5 pb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-1 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-accent transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {title}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-accent text-white text-[9px] w-4 h-4 font-black">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

const FilterCheckbox: React.FC<{ label: string; checked: boolean; href?: string; onToggle?: () => void }> = ({ label, checked, href, onToggle }) => {
  const inner = (
    <>
      <span className={cn("w-4 h-4 rounded border transition-all shrink-0", checked ? "bg-accent border-accent" : "border-brand-primary/20")} />
      <span className="text-sm font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors">{label}</span>
    </>
  );
  if (href) {
    return <Link to={href} className="flex items-center gap-3 group">{inner}</Link>;
  }
  return (
    <label className="flex items-center gap-3 group cursor-pointer" onClick={onToggle}>
      {inner}
    </label>
  );
}

const CheckboxAttrFilter: React.FC<{
  attr: FilterAttribute;
  searchParams: URLSearchParams;
  toggleFilter: (key: string, value: string) => void;
}> = ({ attr, searchParams, toggleFilter }) => {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const opts = attr.options ?? [];
  const filtered = search ? opts.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) : opts;
  const visible = showAll ? filtered : filtered.slice(0, 5);
  const selected = searchParams.get(attr.key)?.split(',').filter(Boolean) ?? [];
  return (
    <div className="space-y-2">
      {opts.length > 7 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`${attr.label} ${t('filter.search')}...`}
          className="w-full text-xs px-2 py-1.5 rounded-xl border border-brand-primary/10 bg-brand-secondary/20 focus:outline-none focus:border-accent"
        />
      )}
      {visible.map(opt => (
        <FilterCheckbox
          key={opt.value}
          label={opt.label}
          checked={selected.includes(opt.value)}
          onToggle={() => toggleFilter(attr.key, opt.value)}
        />
      ))}
      {filtered.length > 5 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="text-[10px] font-black text-accent hover:underline uppercase tracking-widest mt-1"
        >
          {showAll ? t('filter.showLess') : `${t('filter.showMore')} (${filtered.length - 5})`}
        </button>
      )}
    </div>
  );
};

function PriceRangeFilter({ unit, minKey, maxKey, searchParams, setSearchParams }: {
  unit: string; minKey: string; maxKey: string;
  searchParams: URLSearchParams;
  setSearchParams: (p: URLSearchParams) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {([minKey, maxKey] as const).map((key, i) => (
        <div key={key} className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary/20">{unit}</span>
          <input
            type="number"
            placeholder={i === 0 ? 'Min' : 'Max'}
            defaultValue={searchParams.get(key) ?? ''}
            className="w-full pl-6 pr-2 py-2 bg-brand-secondary/30 rounded-xl text-xs font-bold outline-none"
            onBlur={e => {
              const val = e.target.value;
              const next = new URLSearchParams(searchParams);
              val ? next.set(key, val) : next.delete(key);
              setSearchParams(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function RatingFilter({ searchParams, setSearchParams }: {
  searchParams: URLSearchParams;
  setSearchParams: (p: URLSearchParams) => void;
}) {
  const { t } = useLanguage();
  const current = Number(searchParams.get('rating') ?? 0);
  return (
    <div className="space-y-1.5">
      {[4, 3, 2, 1].map(star => (
        <button
          key={star}
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            current === star ? next.delete('rating') : next.set('rating', String(star));
            setSearchParams(next);
          }}
          className={cn(
            "flex items-center gap-0.5 w-full px-2 py-1.5 rounded-xl text-xs font-bold transition-all",
            current === star ? "bg-accent/10 text-accent" : "hover:bg-brand-primary/5 text-brand-primary/60"
          )}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < star ? 'fill-yellow-400 text-yellow-400' : 'text-brand-primary/10'}
            />
          ))}
          <span className="ml-1 text-[10px]">{t('filter.andAbove')}</span>
        </button>
      ))}
    </div>
  );
}

const FilterContent = ({
  categoryId,
  categories,
  filterAttributes,
  searchParams,
  setSearchParams,
  toggleFilter,
  filteredCount,
}: {
  categoryId: string;
  categories: Category[];
  filterAttributes: FilterAttribute[];
  searchParams: URLSearchParams;
  setSearchParams: (p: URLSearchParams) => void;
  toggleFilter: (key: string, value: string) => void;
  filteredCount?: number;
}) => {
  const { t } = useLanguage();
  const hasPriceAttr = filterAttributes.some(a => a.key === 'price');
  const hasRatingAttr = filterAttributes.some(a => a.type === 'rating');
  const priceMin = searchParams.get('price_min') ?? '';
  const priceMax = searchParams.get('price_max') ?? '';
  const minRating = searchParams.get('rating') ?? '';
  const quickActive = [searchParams.get('advantageous'), searchParams.get('freeShipping')].filter(v => v === '1').length;
  const activeCategoryName = categories.find(c => c.id === categoryId)?.name;
  const activeCategory = categories.find(c => c.id === categoryId);
  const parentCategory = activeCategory?.parentId ? categories.find(c => c.id === activeCategory.parentId) : null;

  return (
    <div className="space-y-0">
      {/* Kategori başlığı */}
      {(activeCategoryName || filteredCount !== undefined) && (
        <div className="pb-3 border-b border-brand-primary/5 mb-1">
          {activeCategoryName && (
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">{activeCategoryName}</p>
          )}
          {filteredCount !== undefined && (
            <p className="text-xs text-brand-primary/50 mt-0.5">{filteredCount} ürün</p>
          )}
        </div>
      )}
      {/* Hızlı Filtreler */}
      <FilterSection title={t('filter.quickFilters')} activeCount={quickActive}>
        {([
          { param: 'advantageous', label: t('filter.advantageous') },
          { param: 'freeShipping', label: t('filter.freeShipping') },
        ] as const).map(({ param, label }) => (
          <FilterCheckbox
            key={param}
            label={label}
            checked={searchParams.get(param) === '1'}
            onToggle={() => {
              const next = new URLSearchParams(searchParams);
              searchParams.get(param) === '1' ? next.delete(param) : next.set(param, '1');
              setSearchParams(next);
            }}
          />
        ))}
      </FilterSection>

      {/* Kategoriler */}
      <FilterSection title={t('filter.categories')} activeCount={categoryId ? 1 : 0} defaultOpen={true}>
        <div className="space-y-1.5 py-1">
          {/* Back Navigation */}
          {categoryId && (
            <button
              onClick={() => {
                const nextId = activeCategory?.parentId || null;
                const next = new URLSearchParams(searchParams);
                if (nextId) {
                  next.set('categoryId', nextId);
                } else {
                  next.delete('categoryId');
                }
                next.delete('tag');
                setSearchParams(next);
              }}
              className="flex items-center gap-2 text-xs font-bold text-accent hover:text-accent/80 transition-colors pb-2 mb-2 border-b border-brand-primary/5 w-full text-left"
            >
              <ArrowRight size={12} className="rotate-180 text-accent" />
              <span>{activeCategory?.parentId ? parentCategory?.name : t('nav.all_categories') || 'Tüm Kategoriler'}</span>
            </button>
          )}

          {/* Root Level: No category selected */}
          {!categoryId && (
            <div className="space-y-1">
              {categories.filter(c => !c.parentId).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('categoryId', cat.id);
                    next.delete('tag');
                    setSearchParams(next);
                  }}
                  className="flex items-center justify-between w-full text-left py-1.5 px-2.5 rounded-xl hover:bg-brand-primary/5 text-sm font-bold text-brand-primary/60 hover:text-brand-primary transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/20 group-hover:bg-accent transition-colors" />
                    {cat.name}
                  </span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-accent transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          )}

          {/* Level 1 Active: Show L1 and its L2 child subcategories */}
          {categoryId && activeCategory && !activeCategory.parentId && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 py-1 px-2.5 text-sm font-black text-brand-primary uppercase italic">
                <span className="w-2 h-2 rounded-sm bg-accent rotate-45" />
                {activeCategory.name}
              </div>
              <div className="pl-4 space-y-1 border-l border-brand-primary/10 ml-3.5">
                {categories.filter(c => c.parentId === categoryId).map(subCat => (
                  <button
                    key={subCat.id}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set('categoryId', subCat.id);
                      next.delete('tag');
                      setSearchParams(next);
                    }}
                    className="flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xl hover:bg-brand-primary/5 text-xs font-bold text-brand-primary/60 hover:text-brand-primary transition-all group"
                  >
                    <span>{subCat.name}</span>
                    <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 text-accent transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Level 2 Active: Show parent, active L2, and its L3 sub-items */}
          {categoryId && activeCategory && activeCategory.parentId && (
            <div className="space-y-1">
              <div className="px-2.5 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                {parentCategory?.name}
              </div>
              <div className="flex items-center gap-2 py-1 px-2.5 text-sm font-black text-brand-primary uppercase italic">
                <span className="w-2 h-2 rounded-sm bg-accent rotate-45" />
                {activeCategory.name}
              </div>
              <div className="pl-4 space-y-1 border-l border-accent/20 ml-3.5">
                {(activeCategory.items || []).map(item => {
                  const isSelected = searchParams.get('tag') === item.query;
                  return (
                    <button
                      key={item.query}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        if (isSelected) {
                          next.delete('tag');
                        } else {
                          next.set('tag', item.query);
                        }
                        setSearchParams(next);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xl text-xs transition-all group",
                        isSelected 
                          ? "bg-accent/15 text-accent font-extrabold" 
                          : "hover:bg-brand-primary/5 text-brand-primary/60 font-bold hover:text-brand-primary"
                      )}
                    >
                      <span>{item.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Dinamik kategori filtreleri */}
      {filterAttributes.map(attr => {
        const activeCount =
          attr.type === 'checkbox'
            ? (searchParams.get(attr.key) ?? '').split(',').filter(Boolean).length
            : attr.type === 'rating'
            ? (searchParams.get('rating') ? 1 : 0)
            : [searchParams.get(`${attr.key}_min`), searchParams.get(`${attr.key}_max`)].filter(Boolean).length;
        return (
          <FilterSection key={attr.key} title={attr.label} activeCount={activeCount}>
            {attr.type === 'checkbox' && (
              <CheckboxAttrFilter attr={attr} searchParams={searchParams} toggleFilter={toggleFilter} />
            )}
            {attr.type === 'range' && (
              <PriceRangeFilter
                unit={attr.unit ?? '₺'}
                minKey={`${attr.key}_min`}
                maxKey={`${attr.key}_max`}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
              />
            )}
            {attr.type === 'rating' && (
              <RatingFilter searchParams={searchParams} setSearchParams={setSearchParams} />
            )}
          </FilterSection>
        );
      })}

      {/* Fiyat — sadece kategori filterAttributes'ta yoksa */}
      {!hasPriceAttr && (
        <FilterSection title={t('filter.priceRange')} activeCount={[priceMin, priceMax].filter(Boolean).length}>
          <PriceRangeFilter unit="₺" minKey="price_min" maxKey="price_max" searchParams={searchParams} setSearchParams={setSearchParams} />
        </FilterSection>
      )}

      {/* Minimum Puan — sadece kategori filterAttributes'ta yoksa */}
      {!hasRatingAttr && (
        <FilterSection title={t('filter.minRating')} activeCount={minRating ? 1 : 0}>
          <RatingFilter searchParams={searchParams} setSearchParams={setSearchParams} />
        </FilterSection>
      )}
    </div>
  );
};
