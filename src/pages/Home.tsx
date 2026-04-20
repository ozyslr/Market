import { 
  ArrowRight, Sparkles, Zap, Shield, Globe, 
  ChevronLeft, ChevronRight, ShoppingBag, 
  Flame, Percent, Trophy, Heart, Star,
  Smartphone, Sofa, Mountain, Shirt, Coffee,
  TrendingUp, ShieldCheck, Lock
} from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { Hero } from '@/components/home/Hero';
import { ProductCard } from '@/components/commerce/ProductCard';
import { MOCK_PRODUCTS, CATEGORIES } from '@/mockData';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { fetchProducts } from '@/lib/apiProduct';
import type { Product } from '@/types';

export function Home() {
  const { t } = useLanguage();
  const dealsRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts({ limit: 40 }).then(p => {
      if (p.length > 0) setApiProducts(p);
    });
  }, []);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const products = apiProducts.length > 0 ? apiProducts : MOCK_PRODUCTS;
  const discountedProducts = products.filter(p => p.oldPrice);
  const popularProducts = products.filter(p => p.rating >= 4.7);
  const campingProducts = products.filter(p => p.categoryId === 'camping' || p.categoryId === 'sport-outdoor');
  const beautyProducts = products.filter(p => p.categoryId === 'beauty');
  const sportsProducts = products.filter(p => p.categoryId === 'sport-outdoor' || p.categoryId === 'sportswear');
  const livingRoomProducts = products.filter(p => p.categoryId === 'home' || p.categoryId === 'living-room');

  const homepageCategories = [
    { name: t('category.camping'), key: 'camping', icon: Mountain, color: 'bg-green-500' },
    { name: 'Electronics', key: 'electronics', icon: Zap, color: 'bg-blue-500' },
    { name: t('category.sportswear'), key: 'sportswear', icon: Shirt, color: 'bg-pink-500' },
    { name: t('category.living_room'), key: 'living-room', icon: Sofa, color: 'bg-orange-500' },
    { name: t('category.makeup'), key: 'makeup', icon: Sparkles, color: 'bg-purple-500' },
    { name: t('category.kitchen'), key: 'kitchen', icon: Coffee, color: 'bg-cyan-500' },
    { name: 'Accessories', key: 'accessories', icon: Heart, color: 'bg-amber-500' },
    { name: 'Fitness', key: 'fitness', icon: Trophy, color: 'bg-blue-900' },
  ];

  return (
    <div className="min-h-screen bg-brand-secondary">
      <Hero />

      {/* Category Icons Bar (Hepsiburada Style Circles) */}
      <section className="bg-white py-5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 overflow-x-auto no-scrollbar pb-2">
          {homepageCategories.map((cat, i) => (
            <Link key={i} to={`/search?category=${cat.key}`} className="flex flex-col items-center gap-3 shrink-0 group">
               <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform", cat.color)}>
                 <cat.icon size={28} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/60 group-hover:text-brand-primary transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Category Shortcuts Bar */}
      <section className="bg-white border-b border-brand-primary/5 py-4 sticky top-24 z-30 hidden md:block overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8 whitespace-nowrap">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/search?category=${cat.id}`}
              className="text-xs font-black uppercase tracking-widest text-brand-primary/60 hover:text-accent transition-colors flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-brand-primary/10 rounded-full group-hover:bg-accent transition-colors" />
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content Hub */}
      <main className="max-w-[1700px] mx-auto px-4 md:px-6 py-6 space-y-10">
        
        {/* Commercial Opportunity Board (Technical Dashboard Mood) */}
        <section className="bg-brand-primary text-white py-10 px-6 rounded-[3rem] relative overflow-hidden">
          <Globe size={400} className="absolute -top-20 -right-20 text-white/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full">{t('market.opportunity')}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Live Commercial Intelligence feed</span>
                  </div>
                </div>
                <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter uppercase italic leading-none">{t('market.insight')}</h2>
              </div>
              <div className="flex items-center gap-8 border-l border-white/10 pl-8">
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">UK/TR Corridor</p>
                    <p className="text-2xl font-display font-black text-green-500 tracking-tighter cursor-help" title="Bullish momentum on cross-border transactions">+4.2% <span className="text-xs">Vol</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">Hub Clearance</p>
                    <p className="text-2xl font-display font-black tracking-tighter">98.2 <span className="text-xs opacity-40">Mins</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Ticker Column 1: Scarcity */}
              <div className="bg-white/5 border border-white/5 rounded-[3.5rem] p-10 group hover:bg-white/10 transition-all border-l-4 border-l-red-500 backdrop-blur-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic flex items-center gap-2">
                    <Zap size={14} className="text-red-500" /> {t('market.scarcity')}
                  </h3>
                  <Link to="/search" className="p-2 bg-white/5 rounded-full text-white/20 group-hover:text-white transition-all group-hover:bg-accent">
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="space-y-10">
                  {products.slice(4, 7).map((p, i) => (
                    <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center justify-between group/item">
                      <div className="flex items-center gap-5">
                        <span className="text-xs font-black text-white/10 italic">0{i+1}</span>
                        <div>
                          <p className="text-sm font-black line-clamp-1 group-hover/item:text-accent transition-colors">{p.title}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">London Hub · <span className="text-red-500 animate-pulse">2 left</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-red-500">£{p.price}</p>
                        <TrendingUp size={12} className="text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Ticker Column 2: Rising Demand */}
              <div className="bg-white/5 border border-white/5 rounded-[3.5rem] p-10 group hover:bg-white/10 transition-all border-l-4 border-l-green-500 backdrop-blur-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic flex items-center gap-2">
                    <TrendingUp size={14} className="text-green-500" /> {t('market.trending')}
                  </h3>
                  <Link to="/search" className="p-2 bg-white/5 rounded-full text-white/20 group-hover:text-white transition-all group-hover:bg-accent">
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="space-y-10">
                  {products.slice(9, 12).map((p, i) => (
                    <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center justify-between group/item">
                      <div className="flex items-center gap-5">
                        <span className="text-xs font-black text-white/10 italic">0{i+1}</span>
                        <div>
                          <p className="text-sm font-black line-clamp-1 group-hover/item:text-accent transition-colors">{p.title}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Market Heat: <span className="text-green-500">Extreme</span></p>
                        </div>
                      </div>
                      <div className="text-right text-green-500">
                        <p className="text-sm font-black">£{p.price}</p>
                        <TrendingUp size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 3: Logistics Integrity */}
              <div className="bg-accent rounded-[3.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-accent/20">
                <Shield size={300} className="absolute -bottom-20 -right-20 text-white/10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000" />
                <div className="relative z-10 h-full flex flex-col pt-4">
                  <div className="flex items-center gap-3 mb-8">
                    <Zap size={20} className="text-white fill-white" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Export Integrity</h3>
                  </div>
                  <div className="flex-1 space-y-10">
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase mb-3 tracking-widest opacity-60">
                        <span>Intl. Clearance Rate</span>
                        <span>99.4%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                          initial={{ width: 0 }} 
                          whileInView={{ width: '99.4%' }} 
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-relaxed">Artisan artifacts moving from <span className="text-white underline decoration-white/20 underline-offset-4">Istanbul Hub</span> to UK mainland are optimized via AI-compliance engines, ensuring <span className="italic">Zero Friction</span> at borders.</p>
                    </div>
                    <button className="mt-auto w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-accent transition-all shadow-xl active:scale-95">Explore Global Reach</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Flash Deals / İndirimli Ürünler */}
        <section className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-brand-primary/5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <Flame size={20} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Market Pulse Deals</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic text-balance">Flash Artifacts <br /> <span className="text-accent underline decoration-brand-primary decoration-4 underline-offset-8 italic">{t('flash.deals')}</span></h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-secondary/50 rounded-xl border border-brand-primary/5">
                <span className="text-[10px] font-black uppercase text-brand-primary/40 text-nowrap">ENDS:</span>
                <span className="text-sm font-mono font-black text-brand-primary">02:44:12</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => scroll(dealsRef, 'left')}
                  className="p-3 border border-brand-primary/5 bg-white rounded-xl hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => scroll(dealsRef, 'right')}
                  className="p-3 border border-brand-primary/5 bg-white rounded-xl hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div 
            ref={dealsRef}
            className="flex gap-6 overflow-x-auto no-scrollbar pb-6"
          >
            {discountedProducts.map(product => (
              <div key={product.id} className="w-[280px] md:w-[320px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>

        {/* Global Spotlight Bento */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 aspect-video md:aspect-auto bg-brand-primary rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden group">
            <div className="relative z-10 h-full flex flex-col justify-end">
              <span className="text-accent font-bold uppercase tracking-widest text-[10px] mb-4">Product Spotlights</span>
              <h3 className="text-4xl md:text-5xl font-display font-black leading-none mb-6 italic">Artisan <br />Electronics <br />Hub</h3>
              <p className="text-white/40 text-sm mb-8 max-w-[240px]">London & Istanbul warehouses are restocked with 2026 tech artifacts.</p>
              <button className="w-fit px-8 py-4 bg-accent text-white rounded-2xl font-bold flex items-center gap-2 group-hover:gap-4 transition-all uppercase text-[10px] tracking-widest">
                Discover <ArrowRight size={20} />
              </button>
            </div>
            <img 
              src="https://placehold.co/800x800/1a1a2e/ffffff?text=Tech" 
              className="absolute top-0 right-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000" 
              alt="" 
            />
          </div>

          <div className="md:col-span-1 bg-white border border-brand-primary/5 rounded-[2.5rem] p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <Percent size={24} />
              </div>
              <h3 className="text-2xl font-display font-black text-brand-primary uppercase italic">Premium <br />Offers</h3>
              <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest mt-2">Up to 60% Global Off</p>
            </div>
            <div className="mt-8 relative z-10">
               <Link to="/search" className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">See All <ArrowRight size={12} /></Link>
            </div>
            <Smartphone size={140} className="absolute -bottom-10 -right-10 text-brand-primary/5 rotate-12 group-hover:rotate-0 transition-all duration-700" />
          </div>

          <div className="md:col-span-1 bg-brand-secondary rounded-[2.5rem] p-8 text-brand-primary relative overflow-hidden group border border-brand-primary/5">
            <div className="relative z-10">
              <Trophy size={40} className="text-accent mb-6 fill-accent" />
              <h3 className="text-2xl font-display font-black uppercase italic">Best of <br />Mercora</h3>
              <p className="text-brand-primary/40 text-xs mt-2 font-medium">Top artifacts by curator vote.</p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-2 relative z-10">
               {[1,2,3,4].map(i => (
                 <div key={i} className="aspect-square bg-white rounded-xl shadow-sm border border-brand-primary/5 p-2 group-hover:scale-105 transition-all">
                    <img src={`https://placehold.co/100x100/1a1a2e/ffffff?text=${i}`} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Selected from Popular Section */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-10 bg-accent rounded-full" />
               <h2 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic">{t('home.best_sellers')}</h2>
            </div>
            <Link to="/search" className="text-xs font-black uppercase tracking-widest text-brand-primary/40 hover:text-accent transition-colors flex items-center gap-2">
              {t('global.see_all')} <ChevronRight size={14} />
            </Link>
          </div>
          
          <div 
            ref={popularRef}
            className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
          >
            {popularProducts.slice(0, 10).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Global Categories Grid (Shopify Hub Style) */}
        <section className="bg-brand-primary rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative">
          <Globe size={400} className="absolute -top-20 -right-20 text-white/5 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter mb-12 uppercase italic">{t('global.discover')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-white">
              {[
                { name: t('category.camping'), id: 'camping', icon: Mountain },
                { name: t('category.makeup'), id: 'makeup', icon: Sparkles },
                { name: t('category.sportswear'), id: 'sportswear', icon: Shirt },
                { name: t('category.accessories'), id: 'accessories', icon: Heart },
                { name: t('category.living_room'), id: 'living-room', icon: Sofa },
                { name: t('category.kitchen'), id: 'kitchen', icon: Coffee },
              ].map((item, i) => (
                <Link 
                  key={i} 
                  to={`/search?category=${item.id}`}
                  className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-white hover:text-brand-primary transition-all group"
                >
                  <item.icon size={32} className="text-accent group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Specific Category Spotlights: Camping / Spor */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-brand-primary/5 flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-black uppercase italic">{t('category.camping')}</h3>
              <Link to="/search?category=camping" className="text-[10px] font-black uppercase tracking-widest text-accent">{t('global.see_all')}</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {campingProducts.slice(0, 4).map(product => (
                 <Link key={product.id} to={`/product/${product.slug}`} className="flex flex-col gap-3 group/item">
                    <div className="aspect-square bg-brand-secondary/40 rounded-2xl p-4 overflow-hidden">
                       <img src={product.images[0]} className="w-full h-full object-contain mix-blend-multiply group-hover/item:scale-110 transition-transform" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-xs font-bold text-brand-primary line-clamp-1">{product.title}</span>
                    <span className="text-sm font-black text-accent">£{product.price}</span>
                 </Link>
               ))}
            </div>
          </div>

          <div className="bg-pink-50 dark:bg-pink-950/20 rounded-[2.5rem] p-8 border border-pink-100 dark:border-pink-900/20 flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-black uppercase italic text-pink-950">{t('category.makeup')}</h3>
              <Link to="/search?category=beauty" className="text-[10px] font-black uppercase tracking-widest text-pink-600">{t('global.see_all')}</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {beautyProducts.slice(0, 4).map(product => (
                 <Link key={product.id} to={`/product/${product.slug}`} className="flex flex-col gap-3 group/item">
                    <div className="aspect-square bg-white rounded-2xl p-4 overflow-hidden shadow-sm group-hover/item:shadow-lg transition-all">
                       <img src={product.images[0]} className="w-full h-full object-contain mix-blend-multiply group-hover/item:scale-110 transition-transform" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-xs font-bold text-pink-950 line-clamp-1">{product.title}</span>
                    <span className="text-sm font-black text-pink-600">£{product.price}</span>
                 </Link>
               ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-[2.5rem] p-8 border border-blue-100 dark:border-blue-900/20 flex flex-col group">
             <div className="flex items-center justify-between mb-8 text-blue-900">
                <h3 className="text-2xl font-display font-black uppercase italic">{t('category.sportswear')}</h3>
                <Link to="/search?category=sportswear" className="text-[10px] font-black uppercase tracking-widest text-blue-600">{t('global.see_all')}</Link>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {sportsProducts.slice(0, 4).map(product => (
                  <Link key={product.id} to={`/product/${product.slug}`} className="flex flex-col gap-3 group/item">
                     <div className="aspect-square bg-white rounded-2xl p-4 overflow-hidden shadow-sm group-hover/item:shadow-lg transition-all">
                        <img src={product.images[0]} className="w-full h-full object-contain mix-blend-multiply group-hover/item:scale-110 transition-transform" alt="" referrerPolicy="no-referrer" />
                     </div>
                     <span className="text-xs font-bold text-blue-900 line-clamp-1">{product.title}</span>
                     <span className="text-sm font-black text-blue-600">£{product.price}</span>
                  </Link>
                ))}
             </div>
          </div>
        </section>

        {/* Products for Everyone (Grid Density) */}
        <section className="bg-white rounded-[3.5rem] p-8 md:p-12 border border-brand-primary/5">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-2 h-10 bg-brand-primary rounded-full" />
              <h2 className="text-3xl font-display font-black tracking-tighter text-brand-primary uppercase italic">{t('home.for_everyone')}</h2>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {products.slice(0, 24).map(p => (
                <div key={p.id} className="group cursor-pointer">
                   <Link to={`/product/${p.slug}`}>
                    <div className="aspect-square bg-brand-secondary/30 rounded-3xl p-4 overflow-hidden mb-4 relative">
                        <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" alt="" referrerPolicy="no-referrer" />
                        <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-xl rounded-full flex items-center justify-center text-brand-primary/20 hover:text-accent transition-colors">
                          <Heart size={14} />
                        </div>
                    </div>
                    <h4 className="text-xs font-bold text-brand-primary line-clamp-1 mb-1">{p.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-brand-primary">£{p.price}</span>
                      {p.oldPrice && <span className="text-[10px] text-brand-primary/40 line-through">£{p.oldPrice}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <Star size={10} fill="#FF5200" className="text-accent" />
                        <span className="text-[9px] font-black text-brand-primary/40 leading-none">{p.rating} (300+)</span>
                    </div>
                   </Link>
                </div>
              ))}
           </div>
        </section>

        {/* Home & Living Highlight */}
        <section className="bg-gradient-to-r from-cyan-50 dark:from-cyan-950/20 to-white dark:to-surface rounded-[3rem] p-8 md:p-12 border border-cyan-100 dark:border-cyan-900/20 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
           <div className="relative z-10 flex-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 mb-4 block">New Living Collection</span>
              <h2 className="text-5xl font-display font-black tracking-tighter text-brand-primary uppercase italic mb-8">Living Room <br /> <span className="text-cyan-500">Artifacts</span></h2>
              <div className="grid grid-cols-3 gap-6">
                 {livingRoomProducts.slice(0, 3).map(p => (
                   <Link key={p.id} to={`/product/${p.slug}`} className="group">
                      <div className="w-full aspect-square bg-white rounded-2xl shadow-xl p-4 mb-4 overflow-hidden group-hover:-translate-y-2 transition-transform">
                         <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt="" referrerPolicy="no-referrer" />
                      </div>
                      <p className="text-[10px] font-black text-brand-primary/40 line-clamp-1 group-hover:text-cyan-600 transition-colors uppercase italic">{p.title}</p>
                   </Link>
                 ))}
              </div>
              <button className="mt-12 px-10 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-600 transition-all flex items-center gap-2">
                 {t('global.see_all')} <ChevronRight size={18} />
              </button>
           </div>
           <div className="relative z-10 w-full md:w-1/3 aspect-square bg-white rounded-[2.5rem] shadow-2xl p-10 rotate-3 hover:rotate-0 transition-transform duration-700">
              <img src="https://placehold.co/600x600/4a148c/ffffff?text=Living" className="w-full h-full object-cover rounded-xl" alt="" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl">
                 <p className="text-[10px] font-black text-brand-primary/40 uppercase mb-1">Starting from</p>
                 <p className="text-3xl font-display font-black text-accent">£299.00</p>
              </div>
           </div>
           <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-200/20 blur-[100px] rounded-full" />
        </section>

        {/* Global Roadmap Grid */}
        <section className="py-8 text-center space-y-10">
           <div>
             <h2 className="text-5xl font-display font-black tracking-tighter text-brand-primary mb-6 uppercase italic">Built for Global Commerce</h2>
             <p className="text-brand-primary/40 max-w-2xl mx-auto font-medium">Why the world's finest artisans choose Mercora over legacy platforms.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-brand-primary">
              {[
                { title: 'AI Tax Engine', desc: 'Real-time HS-Code classification.', icon: <Sparkles className="text-accent" size={32} /> },
                { title: 'Multi-Escrow', desc: 'Funds released upon verified delivery.', icon: <Shield className="text-blue-500" size={32} /> },
                { title: 'Logistics Hubs', desc: 'Istanbul, London & Frankfurt Restocked.', icon: <Globe className="text-green-500" size={32} /> }
              ].map((f, i) => (
                <div key={i} className="bg-white p-10 rounded-[3rem] border border-brand-primary/5 hover:-translate-y-2 transition-all">
                   <div className="w-16 h-16 bg-brand-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center">{f.icon}</div>
                   <h3 className="text-xl font-display font-black uppercase italic mb-4">{f.title}</h3>
                   <p className="text-brand-primary/60 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Premium Trust Banner (CEO Strategic Pillar) */}
        <section className="bg-white border border-brand-primary/5 rounded-[4rem] p-12 md:p-20 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-secondary/50 to-transparent pointer-events-none" />
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                 <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-white mb-10 rotate-3 group-hover:rotate-0 transition-transform shadow-2xl">
                    <Shield size={40} className="fill-white/20" />
                 </div>
                 <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-brand-primary uppercase italic mb-8">Mercora <br /> <span className="text-accent">Protection</span></h2>
                 <p className="text-lg font-medium text-brand-primary/60 max-w-xl leading-relaxed mb-10 italic">
                    Security for global artisans. Every transaction is covered by Mercora Guard™ — from hub synchronization to doorstep delivery. Built for trust, optimized for trade.
                 </p>
                 <div className="flex flex-wrap gap-8">
                    {[
                      { icon: ShieldCheck, text: 'Customs Warranty' },
                      { icon: Lock, text: 'Escrow Settlements' },
                      { icon: Globe, text: 'Inter-hub Protection' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-brand-primary/5 rounded-lg flex items-center justify-center text-brand-primary">
                            <item.icon size={16} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">{item.text}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="w-full md:w-[400px] aspect-square bg-brand-secondary/30 rounded-[3rem] p-8 border border-white relative group-hover:scale-105 transition-transform duration-700">
                 <img src="https://placehold.co/800x800/263238/ffffff?text=Security" className="w-full h-full object-cover rounded-2xl grayscale brightness-110" alt="Security" referrerPolicy="no-referrer" />
                 <div className="absolute -bottom-6 -right-6 bg-accent text-white p-6 rounded-[2rem] shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                    <p className="text-2xl font-display font-black italic uppercase leading-none">100% SECURE</p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60 italic">Mercora Standard</p>
                 </div>
              </div>
           </div>
        </section>

      </main>

      {/* Modern High-End Footer */}
      <footer className="bg-brand-primary text-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-8">
              <Zap size={24} className="text-accent fill-accent" />
              <span className="text-2xl font-display font-black tracking-tighter uppercase italic">Mercora</span>
            </div>
            <p className="text-white/40 text-xs leading-relaxed mb-8 max-w-[200px]">
              The global commerce bridge for artisans and premium collectors. Based in London & Istanbul.
            </p>
            <div className="flex gap-4">
               {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-accent transition-colors cursor-pointer" />)}
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">{t('footer.corporate')}</h4>
            <ul className="space-y-4 text-xs font-bold text-white/60">
              <li className="hover:text-white transition-colors cursor-pointer">{t('footer.about')}</li>
              <li className="hover:text-white transition-colors cursor-pointer">{t('footer.careers')}</li>
              <li className="hover:text-white transition-colors cursor-pointer">Sustainability</li>
              <li className="hover:text-white transition-colors cursor-pointer">Global Logistics</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">{t('footer.support')}</h4>
            <ul className="space-y-4 text-xs font-bold text-white/60">
              <li className="hover:text-white transition-colors cursor-pointer">{t('footer.help')}</li>
              <li className="hover:text-white transition-colors cursor-pointer">Order Tracking</li>
              <li className="hover:text-white transition-colors cursor-pointer">Return Policy</li>
              <li className="hover:text-white transition-colors cursor-pointer">Customs & Tax</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Newsletter</h4>
            <p className="text-xs text-white/40 font-medium">New artisan drops and market insights directly to your inbox.</p>
            <div className="flex gap-2">
               <input type="text" placeholder="Email address" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs focus:ring-1 focus:ring-accent outline-none" />
               <button className="p-3 bg-accent rounded-xl hover:scale-105 active:scale-95 transition-all"><ArrowRight size={18} /></button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-widest text-white/20">
          <p>© 2026 Mercora Global. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Cookies</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
