import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Filter, Search as SearchIcon, Star, 
  MapPin, ShieldCheck, Zap,
  TrendingUp, SlidersHorizontal, Grid, List as ListIcon,
  ArrowRight, Flame, Percent, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '@/mockData';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/commerce/ProductCard';
import { useLanguage } from '@/context/LanguageContext';
import { SEO } from '@/components/common/SEO';
import { useProductStore } from '@/store/useProductStore';

export function SearchResultsPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { products, isLoading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  let results = products.filter(p => {
    const matchesQuery = !query || p.title.toLowerCase().includes(query.toLowerCase()) || 
                       p.description?.toLowerCase().includes(query.toLowerCase()) ||
                       p.brand?.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !categoryId || p.categoryId === categoryId;
    
    let matchesTag = true;
    if (tag === 'deals') {
      matchesTag = (p.oldPrice && p.oldPrice > p.price) || p.isFlashDeal === true;
    } else if (tag) {
      matchesTag = p.tags?.includes(tag) || false;
    }

    return matchesQuery && matchesCategory && matchesTag;
  });

  if (sortBy) {
    results = [...results].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }

  const categoryName = CATEGORIES.find(c => c.id === categoryId)?.name || tag || query || 'Tüm Ürünler';

  // Dynamic Banners based on route params
  const renderBanner = () => {
    if (tag === 'deals') {
      return (
        <div className="w-full rounded-[2.5rem] bg-gradient-to-r from-red-600 via-[#F9423A] to-orange-500 p-8 sm:p-12 text-white relative overflow-hidden mb-8 sm:mb-12 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
          <div className="relative z-10 flex flex-col items-start gap-4">
            <span className="px-4 py-1.5 bg-white text-[#F9423A] text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
              <Flame size={14} className="animate-pulse" /> Sınırlı Süre
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-black uppercase italic tracking-tighter leading-none drop-shadow-xl">
              Flaş <br /> İndirimler
            </h1>
            <p className="text-white/80 font-bold max-w-md">Seçili ürünlerde %70'e varan dev indirimleri kaçırmayın. Stoklar tükenmeden sepetinize ekleyin.</p>
          </div>
        </div>
      );
    }

    if (categoryId === 'fashion' || categoryId === 'moda') {
      return (
         <div className="w-full rounded-[2.5rem] bg-zinc-900 p-8 sm:p-12 text-white relative overflow-hidden mb-8 sm:mb-12 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
          <div className="relative z-10 flex flex-col items-start gap-4">
            <span className="px-4 py-1.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
              <Tag size={14} /> Yeni Sezon
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-black uppercase italic tracking-tighter leading-none drop-shadow-xl">
              Erkek <br /> Ayakkabı Modası
            </h1>
            <p className="text-white/80 font-bold max-w-md">Adımlarınıza stil katacak en son trendler. Şıklık ve konfor bir arada.</p>
          </div>
        </div>
      )
    }

    if (categoryId === 'electronics' || categoryId === 'elektronik') {
      return (
         <div className="w-full rounded-[2.5rem] bg-blue-900 p-8 sm:p-12 text-white relative overflow-hidden mb-8 sm:mb-12 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
          <div className="relative z-10 flex flex-col items-start gap-4">
            <span className="px-4 py-1.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
              <Zap size={14} /> Teknoloji Günleri
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-black uppercase italic tracking-tighter leading-none drop-shadow-xl">
              Elektronik <br /> Fırsatları
            </h1>
            <p className="text-white/80 font-bold max-w-md">En yeni cihazlar, akıllı telefonlar ve bilgisayarlarda rakipsiz fiyatlar.</p>
          </div>
        </div>
      )
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-brand-secondary/20 pt-24 sm:pt-32 pb-10 sm:pb-20">
      <SEO 
        title={`${results.length} Sonuç Bulundu ${categoryName ? `- ${categoryName}` : ''}`}
        description={`Mercora'da ${categoryName || query} için arama sonuçları. En iyi fırsatları keşfedin.`}
      />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        
        {renderBanner()}

        {/* Search Header / Breadcrumb */}
        {!renderBanner() && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div>
              <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2 sm:mb-4">
                <Link to="/" className="hover:text-accent">Anasayfa</Link>
                <span>/</span>
                <span className="text-brand-primary">Arama Sonuçları</span>
              </div>
              <h1 className="text-xl sm:text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic leading-tight">
                 <span className="text-accent">{results.length}</span> Ürün Bulundu
                 <span className="hidden sm:inline"> "{categoryName}" için</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 shrink-0">
               <button 
                 onClick={() => setIsMobileFilterOpen(true)}
                 className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-950 rounded-2xl border border-brand-primary/5 shadow-sm text-[10px] font-black uppercase tracking-widest text-brand-primary"
               >
                 <Filter size={14} /> Filtrele
               </button>
               
               <div className="flex bg-white dark:bg-zinc-950 rounded-2xl p-1 sm:p-1.5 border border-brand-primary/5 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest", viewMode === 'grid' ? "bg-brand-primary text-white shadow-lg" : "text-brand-primary/40 hover:text-brand-primary")}
                  >
                    <Grid size={14} /> Izgara
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest", viewMode === 'list' ? "bg-brand-primary text-white shadow-lg" : "text-brand-primary/40 hover:text-brand-primary")}
                  >
                    <ListIcon size={14} /> Liste
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* If we rendered a banner, we still need the filter button on mobile */}
        {renderBanner() && (
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h2 className="text-xl font-display font-black text-brand-primary italic uppercase">{results.length} Ürün Listeleniyor</h2>
            <button 
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-950 rounded-2xl border border-brand-primary/5 shadow-sm text-[10px] font-black uppercase tracking-widest text-brand-primary"
            >
              <Filter size={14} /> Filtrele
            </button>
          </div>
        )}

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
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Filter size={16} /> Filtreler</h3>
                    <button onClick={() => setIsMobileFilterOpen(false)} className="text-brand-primary/20"><SlidersHorizontal size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                     <FilterContent categoryId={categoryId} setSearchParams={setSearchParams} />
                  </div>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4">Filtreleri Uygula</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Advanced Filters Sidebar */}
          <aside className="lg:col-span-3 space-y-6 sm:space-y-8 hidden lg:block">
            <div className="bg-white dark:bg-zinc-950 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-brand-primary/5">
               <div className="flex items-center justify-between mb-6 sm:mb-8">
                 <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-accent">Gelişmiş Filtreler</h3>
                 <SlidersHorizontal size={14} className="text-brand-primary/20" />
               </div>

               <FilterContent categoryId={categoryId} setSearchParams={setSearchParams} />
            </div>

            {/* Strategic Banner (Optional) */}
            <div className="bg-brand-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <Zap size={100} className="absolute -top-10 -right-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
               <TrendingUp size={24} className="text-accent mb-4" />
               <h4 className="text-xl font-display font-black tracking-tight leading-tight mb-4 uppercase italic">Premium <br /> Avantajları</h4>
               <p className="text-xs text-white/60 font-medium leading-relaxed">Seçili ürünlerde Premium üyelere özel ekstra %10 indirim ve ücretsiz kargo avantajı.</p>
               <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all">
                 Premium'a Katıl <ArrowRight size={14} />
               </button>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="lg:col-span-9">
            {isLoading ? (
              <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-brand-secondary rounded-full flex items-center justify-center mb-8 animate-spin">
                  <SearchIcon size={40} className="text-brand-primary/10" />
                </div>
                <h3 className="text-3xl font-display font-black text-brand-primary opacity-20 uppercase italic">Ürünler Yükleniyor...</h3>
              </div>
            ) : (
              <>
                <div className={cn(
                   "grid gap-4 sm:gap-6 lg:gap-8",
                   viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
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
                      <h3 className="text-3xl font-display font-black text-brand-primary opacity-20 uppercase italic">Sonuç Bulunamadı.</h3>
                      <p className="text-brand-primary/40 mt-4 max-w-sm">Aramanızla eşleşen ürün bulunamadı. Lütfen filtrelerinizi temizleyin veya farklı bir arama yapın.</p>
                      <button 
                        onClick={() => setSearchParams({})} 
                        className="mt-6 px-6 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Pagination / Load More */}
                {results.length > 0 && (
                  <div className="mt-20 flex flex-col items-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/20">Gösterilen Ürün: {results.length}</p>
                    <button className="px-12 py-5 bg-white border border-brand-primary/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-primary hover:text-white transition-all shadow-xl shadow-brand-primary/5">
                      Daha Fazla Ürün Yükle
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const FilterContent = ({ categoryId, setSearchParams }: { categoryId: string, setSearchParams: any }) => (
  <div className="space-y-10">
    {/* Category Filter */}
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Kategoriler</h4>
      <div className="space-y-2">
        {CATEGORIES.map(cat => (
          <label key={cat.id} className="flex items-center gap-3 group cursor-pointer">
            <input 
              type="checkbox" 
              checked={categoryId === cat.id} 
              onChange={() => setSearchParams({ categoryId: cat.id })}
              className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent transition-all" 
            />
            <span className="text-sm font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors">{cat.name}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Brand/Store Filter Placeholder */}
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Markalar</h4>
      <div className="space-y-2">
        {['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony'].map(brand => (
          <label key={brand} className="flex items-center gap-3 group cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent" />
            <span className="text-sm font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors">{brand}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Price Filter */}
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Fiyat Aralığı</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary/20">₺</span>
          <input type="number" placeholder="En Az" className="w-full pl-6 pr-2 py-2 bg-brand-secondary/30 rounded-xl text-xs font-bold outline-none" />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary/20">₺</span>
          <input type="number" placeholder="En Çok" className="w-full pl-6 pr-2 py-2 bg-brand-secondary/30 rounded-xl text-xs font-bold outline-none" />
        </div>
      </div>
      <button className="w-full py-2 bg-brand-secondary/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-secondary transition-colors">
        Ara
      </button>
    </div>

    {/* Certifications */}
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Özel Fırsatlar</h4>
      <div className="space-y-2">
        {[
          { id: 'deals', label: 'Flaş İndirimler', icon: <Flame size={14} className="text-[#F9423A]" /> },
          { id: 'free-shipping', label: 'Ücretsiz Kargo', icon: <MapPin size={14} className="text-blue-500" /> },
          { id: 'verified', label: 'Onaylı Satıcı', icon: <ShieldCheck size={14} className="text-green-500" /> }
        ].map(item => (
          <label key={item.id} className="flex items-center gap-3 group cursor-pointer">
            <input 
              type="checkbox" 
              onChange={(e) => {
                if (e.target.checked && item.id === 'deals') setSearchParams({ tag: 'deals' });
                else setSearchParams({});
              }}
              className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent" 
            />
            <span className="text-sm font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors flex items-center gap-2">
               {item.icon} {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  </div>
);
