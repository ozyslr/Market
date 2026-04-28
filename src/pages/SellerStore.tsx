import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, MapPin, Globe, CheckCircle, Package, 
  MessageSquare, UserPlus, Share2, Search,
  Filter, Grid, List as ListIcon, ShieldCheck,
  Zap, ArrowRight, Award, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PRODUCTS, MOCK_USER } from '@/mockData';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/commerce/ProductCard';

export function SellerStorePage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'products' | 'campaigns' | 'about' | 'reviews'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [following, setFollowing] = useState(false);

  // Hardcoded for the prototype, usually we'd fetch by ID
  const seller = {
    name: "AuraAudio Engineering",
    origin: "Berlin, Germany",
    rating: 4.9,
    reviewsCount: 1250,
    followers: 8400,
    isVerified: true,
    joinedDate: "Mar 2022",
    description: "Pioneering the future of artisan audio. Every piece is hand-calibrated in our Berlin workshop using sustainable materials and revolutionary driver technology.",
    banner: "https://placehold.co/1920x1080/1a1a2e/ffffff?text=Store",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AA"
  };

  const sellerProducts = MOCK_PRODUCTS.filter(p => p.categoryId === 'electronics');

  return (
    <div className="min-h-screen bg-brand-secondary/30 pb-20">
      {/* Hero Banner */}
      <div className="relative h-96 w-full overflow-hidden">
        <img src={seller.banner} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 to-transparent" />
        
        <div className="absolute bottom-12 left-0 right-0">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl p-6 ring-8 ring-white/10 overflow-hidden">
                <img src={seller.avatar} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-brand-primary">
                    {seller.name}
                  </h1>
                  {seller.isVerified && <CheckCircle size={24} className="text-accent" />}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-primary">
                    <MapPin size={14} className="text-accent" /> {seller.origin}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-primary">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" /> {seller.rating} ({seller.reviewsCount} reviews)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-primary">
                    <UserPlus size={14} className="text-accent" /> {seller.followers} Followers
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <button
                 onClick={() => setFollowing(f => !f)}
                 className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center gap-2 border-2 ${following ? 'bg-white text-brand-primary border-brand-primary' : 'bg-brand-primary text-white border-brand-primary hover:bg-accent'}`}
               >
                 {following ? '✓ Takip Ediliyor' : '+ Takip Et'}
               </button>
               <button className="p-4 bg-white rounded-2xl border border-brand-primary/5 shadow-sm hover:scale-110 transition-transform">
                 <Share2 size={18} />
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Info */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand-primary/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary/30 mb-6">Fulfillment Health</h3>
            <div className="space-y-6">
              <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-brand-primary/40">Ship Speed</span>
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Fast</span>
                </div>
                <div className="text-lg font-black text-brand-primary">98% Within 24hr</div>
              </div>
              <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-brand-primary/40">Compliance</span>
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Top Tier</span>
                </div>
                <div className="text-lg font-black text-brand-primary">Level 4 Escrow</div>
              </div>
            </div>
          </div>

          <div className="bg-brand-primary text-white rounded-[2.5rem] p-8 overflow-hidden relative group">
            <Zap size={100} className="absolute -top-10 -right-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            <Award size={24} className="text-accent mb-4" />
            <h4 className="text-xl font-display font-black leading-tight mb-4 uppercase italic">Global Multi-Hub <br /> Seller</h4>
            <p className="text-xs text-white/60 font-medium leading-relaxed">This merchant stocks inventory in UK, Germany, and Dubai fulfillment centers for rapid global delivery.</p>
            <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all">
              Verify Credentials <ArrowRight size={14} />
            </button>
          </div>
        </aside>

        {/* Main Products Area */}
        <main className="lg:col-span-9">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-brand-primary/5 mb-8 overflow-x-auto">
             <div className="flex items-center gap-10">
               {[
                 { id: 'products', label: 'Tüm Ürünler', count: sellerProducts.length },
                 { id: 'campaigns', label: 'Kampanyalar', count: 3 },
                 { id: 'reviews', label: 'Değerlendirmeler', count: '1.2k' },
                 { id: 'about', label: 'Hakkında', count: null },
               ].map((tab) => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "pb-6 text-sm font-black uppercase tracking-widest transition-all relative",
                    activeTab === tab.id ? "text-brand-primary" : "text-brand-primary/20 hover:text-brand-primary"
                  )}
                 >
                   {tab.label} {tab.count !== null && <span className="ml-1 text-[10px] opacity-40">({tab.count})</span>}
                   {activeTab === tab.id && (
                     <motion.div layoutId="activeTabSlot" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full" />
                   )}
                 </button>
               ))}
             </div>
             
             <div className="flex items-center gap-4 pb-4">
                <div className="flex bg-white rounded-xl p-1 border border-brand-primary/5">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-brand-primary text-white" : "text-brand-primary/20")}
                  ><Grid size={16} /></button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-brand-primary text-white" : "text-brand-primary/20")}
                  ><ListIcon size={16} /></button>
                </div>
             </div>
          </div>

          <AnimatePresence mode='wait'>
            {activeTab === 'campaigns' ? (
              <motion.div
                key="campaigns"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-black uppercase tracking-tight text-brand-primary mb-6">Mağaza Kampanyaları</h2>
                {[
                  { title: '3 Al 2 Öde', desc: 'Seçili ürünlerde geçerli kampanya', badge: 'AKTİF', color: 'green', until: '30 Nisan 2026' },
                  { title: '%15 İndirim', desc: '£50 üzeri alışverişlerde geçerli', badge: 'AKTİF', color: 'green', until: '15 Mayıs 2026' },
                  { title: 'Ücretsiz Kargo', desc: '£30 üzeri tüm siparişlerde', badge: 'SÜREKLİ', color: 'blue', until: '—' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white border border-brand-primary/10 rounded-2xl p-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${c.color === 'green' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      🏷️
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-brand-primary">{c.title}</p>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${c.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-sm text-brand-primary/60">{c.desc}</p>
                      <p className="text-[10px] text-brand-primary/40 mt-1">Bitiş: {c.until}</p>
                    </div>
                    <Link
                      to="/search"
                      className="px-4 py-2 bg-accent text-white text-xs font-black uppercase rounded-xl hover:opacity-90 transition-all"
                    >
                      Alışveriş Yap
                    </Link>
                  </div>
                ))}
              </motion.div>
            ) : activeTab === 'products' ? (
              <motion.div 
                key="products"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                   <div className="relative flex-1">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/20" />
                      <input 
                        type="text" 
                        placeholder="Search items in this workshop..." 
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-brand-primary/5 focus:ring-4 focus:ring-accent/5 outline-none font-medium text-sm transition-all"
                      />
                   </div>
                   <button className="px-8 py-4 bg-white rounded-2xl border border-brand-primary/5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all">
                     <Filter size={16} /> Filters
                   </button>
                </div>

                <div className={cn(
                  "grid gap-8",
                  viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {sellerProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </motion.div>
            ) : activeTab === 'about' ? (
              <motion.div
                key="about" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-brand-primary/5"
              >
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-display font-black tracking-tight uppercase italic text-brand-primary">The Artisan's Manifest</h2>
                    <p className="text-brand-primary/60 leading-relaxed text-lg font-medium">
                      {seller.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 py-8 border-y border-brand-primary/5">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-2">Location</h4>
                      <p className="font-bold text-brand-primary flex items-center gap-2">
                        <MapPin size={16} className="text-accent" /> {seller.origin}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-2">Merchant Active</h4>
                    <p className="font-bold text-brand-primary flex items-center gap-2">
                      <History size={16} className="text-accent" /> Since {seller.joinedDate}
                    </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-display font-black tracking-tight text-brand-primary">Certified Sustainable Production</h3>
                    <div className="flex flex-wrap gap-3">
                      {[
                        'B-Corp Certified', 'CO2 Neutral fulfillment', 'Artisan Wage Guaranteed', 'Repairable Design'
                      ].map(badge => (
                        <span key={badge} className="px-4 py-2 bg-brand-secondary rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 border border-brand-primary/5">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reviews"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="col-span-1 bg-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-sm border border-brand-primary/5">
                      <p className="text-6xl font-display font-black text-brand-primary">{seller.rating}</p>
                      <div className="flex gap-1 my-4">
                         {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />)}
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-brand-primary/40">Verified Industry Score</p>
                   </div>
                   <div className="col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-primary/5 flex flex-col justify-center">
                      <div className="space-y-4 w-full">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-4">
                            <span className="text-xs font-black text-brand-primary w-4">{rating}</span>
                            <div className="flex-1 h-3 bg-brand-secondary rounded-full overflow-hidden">
                               <div 
                                className="h-full bg-accent px-4" 
                                style={{ width: rating === 5 ? '85%' : rating === 4 ? '12%' : '1%' }} 
                               />
                            </div>
                            <span className="text-[10px] font-black text-brand-primary/40 w-12">{rating === 5 ? '85%' : rating === 4 ? '12%' : '<1%'}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  {[1, 2, 3].map((r) => (
                    <div key={r} className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-primary/5">
                       <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-brand-secondary overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r}`} className="w-full h-full" />
                           </div>
                           <div>
                             <p className="font-bold text-brand-primary">Verified Curator</p>
                             <div className="flex gap-0.5 mt-1">
                               {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}
                             </div>
                           </div>
                         </div>
                         <span className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">2 weeks ago</span>
                       </div>
                       <p className="text-brand-primary/60 leading-relaxed font-medium">
                         "The engineering on their headsets is unparalleled. You can literally hear the artisan craftsmanship in the soundstage. Global shipping was surprisingly fast from Dubai to London."
                       </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
