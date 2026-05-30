import { 
  ArrowRight, Sparkles, Zap, Shield, Globe, 
  ChevronLeft, ChevronRight, ShoppingBag, 
  Flame, Percent, Trophy, Heart, Star,
  Smartphone, Sofa, Mountain, Shirt, Coffee,
  TrendingUp, ShieldCheck, Lock, ShoppingBasket,
  Package, Clock, Baby, Dog, Home as HomeIcon
} from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { Hero } from '@/components/home/Hero';
import { ProductCard } from '@/components/commerce/ProductCard';
import { MOCK_PRODUCTS, CATEGORIES } from '@/mockData';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Product, Category } from '@/types';
import { SEO } from '@/components/common/SEO';
import { getProducts, getCategories } from '@/services/productService';
import { useCartStore } from '@/store/useCartStore';

const CountdownTimer = ({ hours = 5, minutes = 42, seconds = 18 }) => {
  const [timeLeft, setTimeLeft] = useState(hours * 3600 + minutes * 60 + seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
  const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 text-brand-primary dark:text-white">
      <span className="font-bold text-sm bg-brand-secondary/50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-brand-primary/5">Kalan Zaman</span>
      <div className="bg-[#F9423A] text-white w-8 h-8 rounded flex items-center justify-center font-bold text-sm">{h}</div>
      <span className="font-bold text-[#F9423A]">:</span>
      <div className="bg-[#F9423A] text-white w-8 h-8 rounded flex items-center justify-center font-bold text-sm">{m}</div>
      <span className="font-bold text-[#F9423A]">:</span>
      <div className="bg-[#F9423A] text-white w-8 h-8 rounded flex items-center justify-center font-bold text-sm">{s}</div>
    </div>
  );
};

const ProductRow = ({ title, products, showViewAll = true, linkTo = "/search" }: { title: string; products: Product[]; showViewAll?: boolean; linkTo?: string }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  const handleScroll = () => {
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 20);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-6 relative">
      <div className="flex items-center justify-between px-4 md:px-0">
         <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-display font-black tracking-tight text-brand-primary uppercase italic">{title}</h2>
         </div>
         {showViewAll && (
           <button 
             onClick={() => setIsExpanded(!isExpanded)}
             className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 hover:text-accent transition-colors flex items-center gap-1"
           >
              {isExpanded ? "Daha Az Gör" : t('global.see_all')} <ChevronRight size={14} className={isExpanded ? "rotate-90 transition-transform" : "transition-transform"} />
           </button>
         )}
      </div>
      
      {isExpanded ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-4 md:px-0">
          {products.map(product => (
             <div key={product.id} className="h-full">
               <ProductCard product={product} />
             </div>
          ))}
        </div>
      ) : (
        <div className="relative group/row">
           {showLeftArrow && (
             <button 
               onClick={() => scroll('left')}
               className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-2xl border border-brand-primary/5 flex items-center justify-center text-brand-primary hover:bg-accent hover:text-white transition-all hidden md:group-hover/row:flex"
             >
                <ChevronLeft size={24} />
             </button>
           )}
           
           <button 
             onClick={() => scroll('right')}
             className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-2xl border border-brand-primary/5 flex items-center justify-center text-brand-primary hover:bg-accent hover:text-white transition-all hidden md:group-hover/row:flex"
           >
              <ChevronRight size={24} />
           </button>

           <div 
             ref={rowRef}
             onScroll={handleScroll}
             className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-8 px-4 md:px-0"
           >
             {products.map(product => (
               <div key={product.id} className="w-[180px] md:w-[240px] shrink-0">
                 <ProductCard product={product} />
               </div>
             ))}
           </div>
        </div>
      )}
    </section>
  );
};

export function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showAllDeals, setShowAllDeals] = useState(false);
  const [showAllTechDeals, setShowAllTechDeals] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(fetchedProducts);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Home data load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const flashDeals = products.filter(p => p.oldPrice && p.oldPrice > p.price).slice(0, 6);

  const nextDeal = () => {
    if (flashDeals.length === 0) return;
    setActiveDealIndex((prev) => (prev + 1) % flashDeals.length);
  };
  
  const prevDeal = () => {
    if (flashDeals.length === 0) return;
    setActiveDealIndex((prev) => (prev - 1 + flashDeals.length) % flashDeals.length);
  };

  const currentDeal = flashDeals[activeDealIndex];

  const popularProducts = products.filter(p => p.bestSeller || p.rating >= 4.7);
  const electronicsProducts = products.filter(p => p.categoryId === 'electronics' && p.featured);
  const fashionProducts = products.filter(p => p.categoryId === 'moda' || p.categoryId === 'fashion');
  const flashDealProducts = products.filter(p => p.isFlashDeal);

  return (
    <div className="min-h-screen bg-brand-secondary dark:bg-brand-secondary transition-colors duration-300">
      <SEO 
        title={t('nav.home_page')} 
        description="Mercora - The next-generation global commerce ecosystem connecting artisans to the world."
      />
      
      {/* Trendyol Style Quick Categories (Stories) */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm border-b border-brand-primary/5 pb-2 md:pb-4 pt-4 md:pt-6 mb-4 md:mb-8">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 relative group/menu">
           <div className="relative">
              <button 
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-brand-primary/5 hidden md:group-hover/menu:flex items-center justify-center text-brand-primary hover:bg-accent hover:text-white transition-all"
                onClick={() => document.getElementById('iconic-menu-scroll')?.scrollBy({ left: -300, behavior: 'smooth' })}
              >
                 <ChevronLeft size={20} />
              </button>
              <button 
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-brand-primary/5 hidden md:group-hover/menu:flex items-center justify-center text-brand-primary hover:bg-accent hover:text-white transition-all"
                onClick={() => document.getElementById('iconic-menu-scroll')?.scrollBy({ left: 300, behavior: 'smooth' })}
              >
                 <ChevronRight size={20} />
              </button>

              <div 
                id="iconic-menu-scroll"
                className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
              >
                 {[...categories, ...categories.slice(0, 5)].map((menu, i) => (
                   <Link 
                     key={i} 
                     to={`/search?categoryId=${menu.id}`} 
                     className="flex flex-col items-center gap-2 group cursor-pointer shrink-0 w-[72px] md:w-[90px]"
                   >
                      <div className="relative">
                         <div className="w-[64px] h-[64px] md:w-[80px] md:h-[80px] rounded-full p-[3px] bg-gradient-to-tr from-accent via-[#FF8A00] to-yellow-400">
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 bg-white">
                               <img 
                                 src={menu.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${menu.id}`} 
                                 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                 alt={menu.name} 
                                 referrerPolicy="no-referrer" 
                               />
                            </div>
                         </div>
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold text-[#333] dark:text-zinc-300 text-center leading-tight line-clamp-2">
                         {t(`category.${menu.id}`) !== `category.${menu.id}` ? t(`category.${menu.id}`) : menu.name}
                      </span>
                   </Link>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <section className="px-4 md:px-0 mb-8">
        <div className="max-w-[1700px] mx-auto md:px-6 flex flex-col lg:flex-row gap-4 lg:gap-6 rounded-[2rem] overflow-hidden">
           {/* Hero section takes 75% on large screens */}
           <div className="w-full lg:w-3/4">
              <Hero />
           </div>
           
           {/* Deals section takes 25% on large screens */}
           <div className="hidden lg:flex w-full lg:w-1/4 flex-col gap-4">
              <div className="bg-[#F9423A] rounded-[2rem] p-6 text-white h-full flex flex-col items-center justify-center text-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=400')] bg-cover bg-center mix-blend-overlay opacity-20 group-hover:scale-110 transition-transform duration-700"></div>
                 <h3 className="text-3xl font-display font-black uppercase italic mb-2 relative z-10">FIRSATI YAKALA</h3>
                 <CountdownTimer hours={8} minutes={15} seconds={40} />
                 
                 <div className="mt-8 bg-white text-brand-primary p-4 rounded-2xl w-full text-left relative z-10 shadow-2xl group-hover:-translate-y-2 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F9423A] mb-1 block">{t('product.limited_stock') || 'Sınırlı Stok'}</span>
                    <h4 className="text-sm font-bold truncate mb-2">{currentDeal?.title || 'Apple AirPods Pro 2'}</h4>
                    <div className="flex items-end justify-between">
                       <div>
                          <span className="text-xs line-through text-brand-primary/40 block">{currentDeal?.currency || '₺'}{currentDeal?.oldPrice?.toFixed(2) || '8.999'}</span>
                          <span className="text-lg font-black text-[#F9423A]">{currentDeal?.currency || '₺'}{currentDeal?.price?.toFixed(2) || '6.499'}</span>
                       </div>
                       {(() => {
                          const dealItem = currentDeal ? useCartStore(state => state.items).find(item => item.product.id === currentDeal.id) : null;
                          const dealQuantity = dealItem ? dealItem.quantity : 0;
                          
                          if (dealQuantity > 0) {
                            return (
                              <div 
                                className="w-[84px] h-8 bg-brand-secondary/50 dark:bg-zinc-800 rounded-lg flex items-center justify-between px-1 border border-brand-primary/10"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              >
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    import('@/store/useCartStore').then(module => {
                                      const store = module.useCartStore.getState();
                                      if (dealQuantity > 1) {
                                        store.updateQuantity(currentDeal.id, dealQuantity - 1);
                                      } else {
                                        store.removeItem(currentDeal.id);
                                      }
                                    });
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-zinc-700 text-brand-primary dark:text-white hover:bg-accent hover:text-white transition-colors shadow-sm text-sm font-bold"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold text-brand-primary dark:text-white">{dealQuantity}</span>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    import('@/store/useCartStore').then(module => {
                                      module.useCartStore.getState().addItem(currentDeal);
                                    });
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-zinc-700 text-brand-primary dark:text-white hover:bg-accent hover:text-white transition-colors shadow-sm text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if(currentDeal) {
                                  import('@/store/useCartStore').then(module => {
                                    const store = module.useCartStore.getState();
                                    store.addItem(currentDeal);
                                    store.setIsOpen(true);
                                  });
                                }
                              }}
                              className="w-8 h-8 bg-brand-primary text-white rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                            >
                               <ChevronRight size={16} />
                            </button>
                          );
                       })()}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <section className="pt-8 pb-6 px-4 md:px-6">
        <div className="max-w-[1700px] mx-auto space-y-12">
          {/* Flash Deals Row */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-display font-black tracking-tighter text-brand-primary dark:text-white uppercase italic">{t('home.deals_of_day') || 'Günün Fırsatları'}</h2>
                 <div className="hidden md:flex flex-col">
                    <CountdownTimer hours={5} minutes={42} seconds={18} />
                 </div>
              </div>
              <button onClick={() => setShowAllDeals(!showAllDeals)} className="text-[#F9423A] text-sm font-bold xl:block">
                {showAllDeals ? (t('home.see_less') || "Daha Az Gör") : `${t('global.see_all') || 'Tümünü Gör'} >`}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 relative">
               {MOCK_PRODUCTS.slice(4, showAllDeals ? MOCK_PRODUCTS.length : 10).map((product, i) => (
                 <div key={i} className="h-full">
                    <ProductCard product={product} />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1700px] mx-auto px-4 md:px-6 space-y-16 pb-20">
        
        {/* Swipable Popular Products Section */}
        <ProductRow 
           title={t('home.popular_picks') || "Popüler ürünlerden seçtik"} 
           products={popularProducts.slice(0, 20)} 
           linkTo="/search?sortBy=rating"
        />

        {/* Banner Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { 
               to: "/search?categoryId=fashion", 
               img: "https://images.unsplash.com/photo-1491147334573-44cbb4602074?auto=format&fit=crop&q=80&w=800",
               title: t('hero.slide2.title'),
               subtitle: t('mega.best_sellers'),
               color: 'accent'
             },
             { 
               to: "/search?categoryId=electronics", 
               img: "https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=800",
               title: t('hero.slide1.title'),
               subtitle: t('hero.slide1.subtitle'),
               color: 'brand-primary'
             },
             { 
               to: "/search?categoryId=home", 
               img: "https://images.unsplash.com/photo-1616489953149-8835051a34a8?auto=format&fit=crop&q=80&w=800",
               title: t('hero.slide2.title'),
               subtitle: t('mega.regional_deal'),
               color: 'indigo-500'
             }
           ].map((banner, i) => (
             <Link key={i} to={banner.to} className="group relative aspect-[14/6] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:-translate-y-2 border border-brand-primary/5">
                <img src={banner.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={banner.title} referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/60 via-brand-primary/20 to-transparent p-10 flex flex-col justify-center">
                   <span className="text-accent text-[8px] font-black uppercase tracking-[0.4em] mb-2 drop-shadow-lg">{banner.subtitle}</span>
                   <h3 className="text-white text-3xl font-display font-black uppercase italic leading-none drop-shadow-2xl">{banner.title}</h3>
                   <div className="mt-6 flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('hero.cta')}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                   </div>
                </div>
             </Link>
           ))}
        </div>

        {/* Flaş İndirimler Grid */}
        <section className="space-y-10">
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-8 bg-red-500 rounded-full" />
                 <h2 className="text-2xl font-display font-black tracking-tighter text-brand-primary dark:text-white uppercase italic">{t('admin.flash_deals')}</h2>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                 <h3 className="text-4xl font-display font-black text-brand-primary dark:text-white uppercase italic tracking-tight leading-none">
                    {t('home.tech_days_started') || (
                      <>TEKNOLOJİ <span className="text-accent">GÜNLERİ</span> BAŞLADI</>
                    )}
                 </h3>
                 <button onClick={() => setShowAllTechDeals(!showAllTechDeals)} className="inline-flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 transition-all">
                    {showAllTechDeals ? (t('home.see_less') || "Daha Az Gör") : t('global.see_all')} <ChevronRight size={14} className={showAllTechDeals ? "rotate-90 transition-transform" : "transition-transform"} />
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {flashDealProducts.slice(0, showAllTechDeals ? flashDealProducts.length : 6).map((p) => (
                <div key={p.id} className="relative">
                   <ProductCard product={p} />
                </div>
              ))}
           </div>
        </section>

        {/* Erkek Ayakkabı Swipable Section */}
        <ProductRow 
           title={t('home.mens_shoes') || "Erkek Ayakkabı"} 
           products={fashionProducts.slice(0, 20)} 
           linkTo="/search?categoryId=fashion"
        />

        {/* Electronics Spotlight Swipable Section */}
        <ProductRow 
           title={t('home.electronics_deals') || "Elektronik Fırsatları"} 
           products={electronicsProducts.slice(0, 20)} 
           linkTo="/search?categoryId=electronics"
        />

        {/* Spotlight Promotion Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <section className="bg-accent-soft/30 dark:bg-zinc-800/20 rounded-[2.5rem] p-8 border border-accent-soft dark:border-zinc-800 relative group overflow-hidden">
              <div className="relative z-10">
                 <span className="px-3 py-1 bg-white text-accent text-[9px] font-black uppercase tracking-[0.2em] rounded-full inline-block shadow-sm mb-4">{t('category.baby') !== 'category.baby' ? t('category.baby') : 'Anne Bebek'}</span>
                 <h2 className="text-2xl font-display font-black text-brand-primary dark:text-white uppercase italic tracking-tighter mb-6 leading-tight">{t('hero.deals_every_day') || 'YENİ SEZON BEBEK MODASI'}</h2>
                 <button className="px-6 py-3 bg-accent text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-accent-dark transition-all shadow-lg">{t('global.discover') || 'KEŞFET'}</button>
              </div>
              <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=300" className="absolute -bottom-10 -right-10 w-48 rotate-12 group-hover:rotate-0 transition-transform duration-700 opacity-40 group-hover:opacity-100" referrerPolicy="no-referrer" />
           </section>
           <section className="bg-brand-secondary/50 dark:bg-zinc-800/20 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800 relative group overflow-hidden">
               <div className="relative z-10">
                  <span className="px-3 py-1 bg-white text-accent text-[9px] font-black uppercase tracking-[0.2em] rounded-full inline-block shadow-sm mb-4">{t('category.fashion') !== 'category.fashion' ? t('category.fashion') : 'Moda'}</span>
                  <h2 className="text-2xl font-display font-black text-brand-primary dark:text-white uppercase italic tracking-tighter mb-6 leading-tight">{t('home.promo_fashion_title') || 'MODADA DÜNYA MARKALARI'}</h2>
                  <button className="px-6 py-3 bg-brand-primary dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-accent transition-all shadow-lg">{t('global.see_all') || 'GÖRÜNTÜLE'}</button>
               </div>
           </section>
           <section className="bg-brand-primary dark:bg-zinc-900 rounded-[2.5rem] p-8 relative group overflow-hidden text-white border dark:border-white/10">
              <div className="relative z-10">
                 <span className="px-3 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full inline-block mb-4">{t('category.sport') !== 'category.sport' ? t('category.sport') : 'Spor'}</span>
                 <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter mb-6 leading-tight">{t('home.promo_sport_title') || 'OUTDOOR MACERASI BAŞLASIN'}</h2>
                 <button className="px-6 py-3 bg-white text-brand-primary dark:text-zinc-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-lg">{t('product.buy_now') || 'ALIŞVERİŞE BAŞLA'}</button>
              </div>
           </section>
        </div>

                 {/* Brands/Stores Strip */}
         <section className="bg-white dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-[2rem] p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl md:text-2xl font-display font-black tracking-tighter text-brand-primary dark:text-white uppercase italic">{t('home.featured_brands') || 'Öne Çıkan Markalar'}</h2>
               <button className="text-brand-primary/60 hover:text-[#F9423A] font-bold text-[10px] md:text-xs transition-colors uppercase tracking-widest hidden md:block">{t('home.all_brands') || 'Tüm Markalar'} &gt;</button>
            </div>
            <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-4">
               {[
                 { name: 'Apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=120&h=120&fit=crop' },
                 { name: 'Samsung', logo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=120&h=120&fit=crop' },
                 { name: 'Nike', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop' },
                 { name: 'Adidas', logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=120&h=120&fit=crop' },
                 { name: 'Puma', logo: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=120&h=120&fit=crop' },
                 { name: 'Sony', logo: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94bc?w=120&h=120&fit=crop' },
                 { name: 'Lego', logo: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=120&h=120&fit=crop' },
                 { name: 'Bosch', logo: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=120&h=120&fit=crop' },
                 { name: 'Dyson', logo: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=120&h=120&fit=crop' },
               ].map((brand, idx) => (
                 <div key={idx} className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer w-[70px] md:w-[90px]">
                    <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full overflow-hidden border border-brand-primary/10 dark:border-white/10 p-2 bg-white group-hover:border-[#F9423A] transition-colors shadow-sm">
                       <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover rounded-full mix-blend-multiply" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-center text-brand-primary dark:text-white group-hover:text-[#F9423A] transition-colors truncate w-full">{brand.name}</span>
                 </div>
               ))}
            </div>
         </section>

         {/* Discovery Grid: Sizin İçin Seçtiklerimiz */}
         <ProductRow 
            title={t('home.picked_for_you') || "Senin İçin Seçtiklerimiz"} 
            products={MOCK_PRODUCTS.slice(0, 20)} 
         />
      </main>
    </div>
  );
}
