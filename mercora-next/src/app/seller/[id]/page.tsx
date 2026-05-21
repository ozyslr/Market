'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star, MapPin, Globe, CheckCircle, Package,
  MessageSquare, UserPlus, Share2, Search,
  Filter, Grid, List as ListIcon, ShieldCheck,
  Zap, ArrowRight, Award, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/ProductCard';
import { ProductCarousel } from '@/components/commerce/ProductCarousel';
import { useAuth } from '@/context/AuthContext';
import { useFollows } from '@/context/FollowsContext';
import type { Seller, Product } from '@/types';

interface SellerDetail extends Seller {
  fulfillment?: {
    shipSpeed: string;
    compliance: string;
  };
}

export default function SellerStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sellerData, setSellerData] = useState<SellerDetail | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { firebaseUser } = useAuth();
  const { isFollowing, follow, unfollow, loading: followLoading } = useFollows();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const sellerDoc = await getDoc(doc(db, 'sellers', id));
        if (!sellerDoc.exists()) {
          setError('Satıcı bulunamadı.');
          setLoading(false);
          return;
        }
        const sellerRaw = sellerDoc.data() as SellerDetail;
        const seller: SellerDetail = {
          id: sellerDoc.id,
          userId: sellerRaw.userId || '',
          storeName: sellerRaw.storeName || 'Mercora Artisan',
          slug: sellerRaw.slug || id,
          rating: sellerRaw.rating ?? 4.8,
          reviewsCount: sellerRaw.reviewsCount ?? 0,
          followersCount: sellerRaw.followersCount ?? 0,
          origin: sellerRaw.origin || 'Global',
          joinedDate: sellerRaw.joinedDate || '2024',
          isVerified: sellerRaw.isVerified ?? true,
          description: sellerRaw.description || 'Certified Mercora Artisan.',
          bannerUrl: sellerRaw.bannerUrl,
          logoUrl: sellerRaw.logoUrl,
          fulfillment: sellerRaw.fulfillment || { shipSpeed: '2-4 Days', compliance: '99.8%' },
        };
        setSellerData(seller);

        const productsQuery = query(
          collection(db, 'products'),
          where('sellerId', '==', id)
        );
        const productsSnap = await getDocs(productsQuery);
        const products: Product[] = [];
        productsSnap.forEach((docSnap) => {
          products.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        setSellerProducts(products);
      } catch (err) {
        console.error('Seller fetch error:', err);
        setError('Satıcı bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const seller = useMemo(() => {
    if (!sellerData) return null;
    return {
      name: sellerData.storeName,
      origin: sellerData.origin,
      rating: sellerData.rating,
      reviewsCount: sellerData.reviewsCount,
      followers: sellerData.followersCount,
      isVerified: sellerData.isVerified,
      joinedDate: sellerData.joinedDate,
      description: sellerData.description || 'Certified Mercora Artisan.',
      banner: sellerData.bannerUrl || 'https://picsum.photos/seed/shop/1920/1080?blur=4',
      avatar: sellerData.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sellerData.storeName}`,
      fulfillment: sellerData.fulfillment,
    };
  }, [sellerData]);

  const categories = useMemo(
    () => [...new Set(sellerProducts.map((p) => p.categoryId).filter(Boolean))] as string[],
    [sellerProducts],
  );

  const displayProducts = useMemo(() => {
    let result = sellerProducts.filter((p) => {
      const matchesSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    switch (sortBy) {
      case 'price_asc':  result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price_desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'rating':     result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'newest':     result = [...result].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      ); break;
    }
    return result;
  }, [sellerProducts, searchQuery, selectedCategory, sortBy]);

  const flashProducts = useMemo(
    () => sellerProducts.filter((p) => p.isFlashDeal),
    [sellerProducts],
  );

  const following = sellerData ? isFollowing(sellerData.id) : false;

  async function handleFollow() {
    if (!firebaseUser || !sellerData) return;
    if (following) {
      await unfollow(sellerData.id);
    } else {
      await follow(sellerData.id, sellerData.storeName, sellerData.logoUrl);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-secondary/30 pb-20">
        <div className="h-96 w-full bg-brand-secondary animate-pulse" />
        <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand-primary/5 space-y-6">
              <div className="h-4 w-24 bg-brand-secondary rounded animate-pulse" />
              <div className="h-16 bg-brand-secondary rounded-2xl animate-pulse" />
              <div className="h-16 bg-brand-secondary rounded-2xl animate-pulse" />
            </div>
            <div className="bg-brand-primary rounded-[2.5rem] p-8">
              <div className="h-48 bg-white/10 rounded-2xl animate-pulse" />
            </div>
          </aside>
          <main className="lg:col-span-9">
            <div className="flex gap-10 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-32 bg-brand-secondary rounded animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-brand-secondary rounded-2xl animate-pulse" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !seller) {
    return (
      <div className="min-h-screen bg-brand-secondary/30 pb-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-brand-secondary rounded-full mx-auto mb-6 flex items-center justify-center">
            <Package size={40} className="text-brand-primary/20" />
          </div>
          <h2 className="text-2xl font-display font-black text-brand-primary mb-3">
            Satıcı Bulunamadı
          </h2>
          <p className="text-brand-primary/60 font-medium mb-8">
            {error || 'Bu satıcı mağazası mevcut değil veya kaldırılmış olabilir.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-secondary/30 pb-20">
      {/* Hero Banner */}
      <div className="relative h-96 w-full overflow-hidden">
        <img
          src={seller.banner}
          alt={seller.name + ' banner'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 to-transparent" />

        <div className="absolute bottom-12 left-0 right-0">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl p-6 ring-8 ring-white/10 overflow-hidden">
                <img
                  src={seller.avatar}
                  alt={seller.name + ' logo'}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
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
                onClick={handleFollow}
                disabled={followLoading}
                className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {following ? 'Takibi Bırak' : 'Takip Et'}
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
                <div className="text-lg font-black text-brand-primary">{seller.fulfillment?.shipSpeed}</div>
              </div>
              <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-brand-primary/40">Compliance</span>
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Top Tier</span>
                </div>
                <div className="text-lg font-black text-brand-primary">{seller.fulfillment?.compliance}</div>
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
                { id: 'products', label: 'Artisan Artifacts', count: sellerProducts.length },
                { id: 'about', label: 'Workshop Story', count: null },
                { id: 'reviews', label: 'Trust Metrics', count: '1.2k' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'products' | 'about' | 'reviews')}
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

          <AnimatePresence mode="wait">
            {activeTab === 'products' ? (
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
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-brand-primary/5 focus:ring-4 focus:ring-accent/5 outline-none font-medium text-sm transition-all"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 bg-[#F8F8FA] rounded-xl text-xs font-bold text-[#1A1033]/60 outline-none cursor-pointer border-0 shrink-0"
                  >
                    <option value="default">Varsayılan</option>
                    <option value="price_asc">Fiyat: Artan</option>
                    <option value="price_desc">Fiyat: Azalan</option>
                    <option value="rating">En Yüksek Puan</option>
                    <option value="newest">En Yeni</option>
                  </select>
                  <button className="px-8 py-4 bg-white rounded-2xl border border-brand-primary/5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all">
                    <Filter size={16} /> Filters
                  </button>
                </div>

                {flashProducts.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={16} className="text-red-500" />
                      <h3 className="font-black text-[#1A1033] uppercase tracking-tight text-sm">
                        Flaş Ürünler
                      </h3>
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full uppercase">
                        Sınırlı Süre
                      </span>
                    </div>
                    <ProductCarousel products={flashProducts.map(p => ({ ...p, name: p.title }))} title="" />
                  </div>
                )}

                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(['all', ...categories] as string[]).map(catId => (
                      <button
                        key={catId}
                        onClick={() => setSelectedCategory(catId)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedCategory === catId
                            ? 'bg-[#1A1033] text-white'
                            : 'bg-[#F8F8FA] text-[#1A1033]/40 hover:text-[#1A1033]'
                        }`}
                      >
                        {catId === 'all' ? 'Tümü' : catId}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {displayProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-brand-secondary rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Package size={32} className="text-brand-primary/20" />
                    </div>
                    <h3 className="text-xl font-display font-black text-brand-primary mb-2">Henüz ürün bulunamadı</h3>
                    <p className="text-brand-primary/40 font-medium">
                      {searchQuery ? 'Aramanızla eşleşen ürün bulunamadı.' : 'Bu satıcının henüz ürünü bulunmuyor.'}
                    </p>
                  </div>
                ) : (
                  <div className={cn(
                    "grid gap-8",
                    viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                  )}>
                    {displayProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
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
                    <h2 className="text-3xl font-display font-black tracking-tight uppercase italic text-brand-primary">The Artisan&apos;s Manifest</h2>
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
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />)}
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
                              className="h-full bg-accent"
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
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r}`} className="w-full h-full" alt="Kullanıcı avatarı" loading="lazy" />
                          </div>
                          <div>
                            <p className="font-bold text-brand-primary">Verified Curator</p>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">2 weeks ago</span>
                      </div>
                      <p className="text-brand-primary/60 leading-relaxed font-medium">
                        &quot;The engineering on their headsets is unparalleled. You can literally hear the artisan craftsmanship in the soundstage. Global shipping was surprisingly fast from Dubai to London.&quot;
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
