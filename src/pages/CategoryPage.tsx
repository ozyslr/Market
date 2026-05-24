import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronRight, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Category, Product } from '@/types';
import { getCategories, getProducts } from '@/services/productService';
import { ProductCard } from '@/components/commerce/ProductCard';
import { Breadcrumb, BreadcrumbItem } from '@/components/common/Breadcrumb';
import { SEO } from '@/components/common/SEO';
import { breadcrumbSchema } from '@/components/seo/schemas';
import { Skeleton, ProductCardSkeleton, ProductGridSkeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'default', label: 'Önerilen' },
  { value: 'price-asc', label: 'En Düşük Fiyat' },
  { value: 'price-desc', label: 'En Yüksek Fiyat' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'newest', label: 'En Yeni' },
];

export function CategoryPage() {
  const { lang } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qFilter = searchParams.get('q') || '';

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCategories(),
      getProducts({ categoryId: id }),
    ]).then(([cats, prods]) => {
      setAllCategories(cats);
      setProducts(prods);
    }).finally(() => setLoading(false));
  }, [id]);

  const category = allCategories.find(c => c.id === id);
  const parentCategory = category?.parentId
    ? allCategories.find(c => c.id === category.parentId)
    : null;
  const subCategories = allCategories.filter(c => c.parentId === id);

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    if (parentCategory) {
      items.push({ label: parentCategory.name, href: `/category/${parentCategory.id}` });
    }
    items.push({ label: category?.name ?? id ?? '' });
    return items;
  }, [category, parentCategory, id]);

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

  const heroBg = category?.bannerUrl || category?.image;

  if (!loading && !category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-brand-primary/40">
        <Package size={48} />
        <p className="text-lg font-black uppercase italic">Kategori bulunamadı</p>
        <Link to="/" className="text-accent font-bold text-sm hover:underline">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <SEO
        title={category?.name || 'Kategori'}
        description={`${category?.name || 'Kategori'} sayfası — Benim Olan'da ${category?.name || 'kategori'} ürünlerini keşfedin.`}
        canonical={`/category/${id}`}
        lang={lang}
        jsonLd={
          breadcrumbSchema([
            { name: 'Ana Sayfa', url: '/' },
            ...(parentCategory ? [{ name: parentCategory.name, url: `/category/${parentCategory.id}` }] : []),
            { name: category?.name || 'Kategori', url: `/category/${id}` },
          ])
        }
      />
      <div className={cn(
        'relative overflow-hidden',
        heroBg ? 'h-32 md:h-44' : 'h-20 md:h-28 bg-gradient-to-r from-brand-primary to-zinc-700'
      )}>
        {heroBg && (
          <img
            src={heroBg}
            alt={category?.name}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/85 via-brand-primary/60 to-transparent" />
        <div className="relative h-full max-w-[1700px] mx-auto px-4 lg:px-8 flex flex-col justify-center gap-2">
          <Breadcrumb items={breadcrumbItems} light />
          {loading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h1 className="text-2xl md:text-4xl font-display font-black uppercase italic text-white tracking-tight leading-none">
              {category?.name}
            </h1>
          )}
          {category?.description && (
            <p className="text-white/60 text-xs font-bold hidden md:block">{category.description}</p>
          )}
        </div>
      </div>

      {/* Sub-category chips */}
      {(subCategories.length > 0 || (category?.items?.length ?? 0) > 0) && (
        <div className="border-b border-brand-primary/5 dark:border-white/5 bg-white dark:bg-zinc-950 sticky top-[152px] z-10">
          <div className="max-w-[1700px] mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
              <Link
                to={`/category/${id}`}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border',
                  !qFilter
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'border-brand-primary/10 text-brand-primary/60 dark:text-white/60 hover:border-accent hover:text-accent dark:border-white/10'
                )}
              >
                Tümü
              </Link>
              {subCategories.length > 0
                ? subCategories.map(sub => (
                    <Link
                      key={sub.id}
                      to={`/category/${sub.id}`}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border border-brand-primary/10 dark:border-white/10 text-brand-primary/60 dark:text-white/60 hover:border-accent hover:text-accent transition-all"
                    >
                      {sub.name}
                    </Link>
                  ))
                : category?.items?.map(item => (
                    <Link
                      key={item.query}
                      to={`/category/${id}?q=${encodeURIComponent(item.name)}`}
                      className={cn(
                        'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border',
                        qFilter === item.name
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'border-brand-primary/10 text-brand-primary/60 dark:text-white/60 hover:border-accent hover:text-accent dark:border-white/10'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
        <p className="text-xs font-bold text-brand-primary/40 dark:text-white/40 shrink-0">
          {loading ? '...' : `${sortedProducts.length} ürün`}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          {/* Filtrele → SearchResults */}
          <button
            onClick={() => navigate(`/search?categoryId=${id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-primary/10 dark:border-white/10 text-[11px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-white/60 hover:border-accent hover:text-accent transition-all"
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

      {/* Products Grid */}
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 pb-16">
        {loading ? (
          <ProductGridSkeleton count={10} />
        ) : sortedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-brand-primary/30 dark:text-white/30"
          >
            <Package size={48} strokeWidth={1} />
            <p className="text-lg font-black uppercase italic">Bu kategoride ürün bulunamadı</p>
            <Link to="/" className="text-accent font-bold text-sm hover:underline flex items-center gap-1">
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
