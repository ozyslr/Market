import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  Globe,
  CheckCircle,
  Package,
  MessageSquare,
  UserPlus,
  Share2,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  ShieldCheck,
  Zap,
  ArrowRight,
  Award,
  History,
  Copy,
  Check,
  Camera,
  Loader2,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { MOCK_USER } from '@/data/mockUser';
import { MOCK_SELLERS } from '@/data/mockSellers';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/commerce/ProductCard';
import { ProductCarousel } from '@/components/commerce/ProductCarousel';
import { useAuth } from '@/context/AuthContext';
import { useFollows } from '@/context/FollowsContext';

export function SellerStorePage() {
  const { id, slug: slugParam } = useParams();
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'default' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  >('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();

  // Route param: /seller/:id OR /store/:slug
  const routeKey = slugParam ?? id;

  // Find seller from mock data or use the first one as fallback
  const sellerData =
    MOCK_SELLERS.find((s) => s.id === routeKey || s.slug === routeKey) || MOCK_SELLERS[0];

  // Store URL (shareable, public)
  const storeSlug = sellerData.slug || sellerData.id;
  const storeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/store/${storeSlug}`
      : `https://benim-olan.com/store/${storeSlug}`;

  // Slug copy state
  const [copied, setCopied] = useState(false);
  function copyToClipboard() {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Is the logged-in user the owner of this store?
  const isOwner = !!firebaseUser && user?.id === sellerData.id;

  // Store management: logo / banner upload + about counter (owner only)
  const [aboutText, setAboutText] = useState(sellerData.description || '');
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(sellerData.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(sellerData.bannerUrl || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return; // max 2 MB
    setLogoUploading(true);
    try {
      const storageRef = ref(storage, `store-assets/${sellerData.id}/logo`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
      await updateDoc(doc(db, 'sellers', sellerData.id), {
        logoUrl: url,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // max 5 MB
    setBannerUploading(true);
    try {
      const storageRef = ref(storage, `store-assets/${sellerData.id}/banner`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setBannerUrl(url);
      await updateDoc(doc(db, 'sellers', sellerData.id), {
        bannerUrl: url,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setBannerUploading(false);
    }
  }

  async function handleSaveStore() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'sellers', sellerData.id), {
        aboutText,
        logoUrl,
        bannerUrl,
        updatedAt: new Date().toISOString(),
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const seller = {
    name: sellerData.storeName,
    origin: sellerData.origin,
    rating: sellerData.rating,
    reviewsCount: sellerData.reviewsCount,
    followers: sellerData.followersCount,
    isVerified: sellerData.isVerified,
    joinedDate: sellerData.joinedDate,
    description: sellerData.description || 'Sertifikalı Benim Olan Satıcısı.',
    banner: bannerUrl || 'https://picsum.photos/seed/shop/1920/1080?blur=4',
    avatar: logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sellerData.storeName}`,
    fulfillment: sellerData.fulfillmentHealth,
  };

  const sellerProducts = MOCK_PRODUCTS.filter((p) => p.sellerId === sellerData.id);

  const categories = React.useMemo(
    () => [...new Set(sellerProducts.map((p: any) => p.categoryId).filter(Boolean))] as string[],
    [sellerProducts],
  );

  const displayProducts = React.useMemo(() => {
    let result = sellerProducts.filter((p: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    switch (sortBy) {
      case 'price_asc':
        result = [...result].sort((a: any, b: any) => a.price - b.price);
        break;
      case 'price_desc':
        result = [...result].sort((a: any, b: any) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a: any, b: any) => b.rating - a.rating);
        break;
      case 'newest':
        result = [...result].sort(
          (a: any, b: any) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        );
        break;
    }
    return result;
  }, [sellerProducts, searchQuery, selectedCategory, sortBy]);

  const flashProducts = React.useMemo(
    () => sellerProducts.filter((p: any) => p.isFlashDeal),
    [sellerProducts],
  );

  const following = isFollowing(sellerData.id);

  async function handleFollow() {
    if (!firebaseUser) return;
    await toggleFollow(sellerData.id);
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

        <div className="absolute bottom-12 start-0 end-0">
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
                    <Star size={14} className="text-yellow-400 fill-yellow-400" /> {seller.rating} (
                    {seller.reviewsCount} değerlendirme)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-primary">
                    <UserPlus size={14} className="text-accent" /> {seller.followers} Takipçi
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
              {firebaseUser && user?.id !== sellerData.id && (
                <button
                  onClick={() => navigate(`/messages?sellerId=${sellerData.id}`)}
                  className="px-6 py-4 bg-white border-2 border-accent/20 text-accent hover:bg-accent hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2"
                >
                  <MessageSquare size={18} />
                  Mesaj Gönder
                </button>
              )}
              <button
                onClick={copyToClipboard}
                title="Mağaza bağlantısını kopyala"
                className="p-4 bg-white rounded-2xl border border-brand-primary/5 shadow-sm hover:scale-110 transition-transform"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shareable store URL */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
            Mağaza Bağlantısı
          </span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={storeUrl}
              className="flex-1 ps-3 pe-3 py-2 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium text-brand-primary/70 outline-none text-start"
            />
            <button
              onClick={copyToClipboard}
              className="p-2 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-all"
              title="Kopyala"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
          {copied && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
              Store URL copied!
            </span>
          )}
        </div>
      </div>

      {/* Store management (owner only): logo / banner upload + about counter */}
      {isOwner && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary/40">
              Mağaza Yönetimi
            </h3>
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              {/* Logo upload (circular) */}
              <div className="relative w-20 h-20 shrink-0">
                <img
                  src={
                    logoUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${sellerData.storeName}`
                  }
                  alt="Mağaza logosu"
                  className="w-20 h-20 object-cover rounded-full border-2 border-accent"
                />
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  {logoUploading ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
              {/* Banner upload (16:4) */}
              <div className="relative flex-1 w-full">
                <img
                  src={bannerUrl || 'https://picsum.photos/seed/shop/1920/480?blur=4'}
                  alt="Mağaza afişi"
                  className="w-full h-24 md:h-32 object-cover rounded-lg"
                />
                <label className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  {bannerUploading ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                </label>
              </div>
            </div>

            {/* About / description with char counter */}
            <div>
              <label className="block text-xs text-brand-primary/40 mb-1 text-start">
                Hakkında
              </label>
              <textarea
                rows={4}
                maxLength={500}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full ps-3 pe-3 py-2 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm text-brand-primary outline-none resize-none text-start"
                placeholder="Mağazanızı tanıtın..."
              />
              <div
                className={cn(
                  'text-sm text-end mt-1',
                  aboutText.length >= 500
                    ? 'text-red-500'
                    : aboutText.length >= 450
                      ? 'text-amber-500'
                      : 'text-gray-400',
                )}
              >
                {aboutText.length} / 500
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-3">
              {savedMsg && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg text-center">
                  Changes saved
                </span>
              )}
              <button
                onClick={handleSaveStore}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 bg-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Info */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand-primary/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary/30 mb-6">
              Satıcı Performansı
            </h3>
            <div className="space-y-6">
              <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-brand-primary/40">
                    Kargo Hızı
                  </span>
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                    Hızlı
                  </span>
                </div>
                <div className="text-lg font-black text-brand-primary">
                  {seller.fulfillment?.shipSpeed}
                </div>
              </div>
              <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-brand-primary/40">
                    Uyumluluk
                  </span>
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                    En Üst
                  </span>
                </div>
                <div className="text-lg font-black text-brand-primary">
                  {seller.fulfillment?.compliance}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-primary text-white rounded-[2.5rem] p-8 overflow-hidden relative group">
            <Zap
              size={100}
              className="absolute -top-10 -end-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700"
            />
            <Award size={24} className="text-accent mb-4" />
            <h4 className="text-xl font-display font-black leading-tight mb-4 uppercase italic">
              Küresel Çok Merkezli <br /> Satıcı
            </h4>
            <p className="text-xs text-white/60 font-medium leading-relaxed">
              Bu satıcı, hızlı küresel teslimat için İngiltere, Almanya ve Dubai'deki depolarda stok
              bulundurmaktadır.
            </p>
            <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all">
              Kimlik Bilgilerini Doğrula <ArrowRight size={14} />
            </button>
          </div>
        </aside>

        {/* Main Products Area */}
        <main className="lg:col-span-9">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-brand-primary/5 mb-8 overflow-x-auto">
            <div className="flex items-center gap-10">
              {[
                { id: 'products', label: 'Ürünler', count: sellerProducts.length },
                { id: 'about', label: 'Hakkında', count: null },
                { id: 'reviews', label: 'Değerlendirmeler', count: '1.2k' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'pb-6 text-sm font-black uppercase tracking-widest transition-all relative',
                    activeTab === tab.id
                      ? 'text-brand-primary'
                      : 'text-brand-primary/20 hover:text-brand-primary',
                  )}
                >
                  {tab.label}{' '}
                  {tab.count !== null && (
                    <span className="ms-1 text-[10px] opacity-40">({tab.count})</span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabSlot"
                      className="absolute bottom-0 start-0 end-0 h-1 bg-accent rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 pb-4">
              <div className="flex bg-white rounded-xl p-1 border border-brand-primary/5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'grid' ? 'bg-brand-primary text-white' : 'text-brand-primary/20',
                  )}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'list' ? 'bg-brand-primary text-white' : 'text-brand-primary/20',
                  )}
                >
                  <ListIcon size={16} />
                </button>
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
                    <Search
                      size={18}
                      className="absolute start-4 top-1/2 -translate-y-1/2 text-brand-primary/20"
                    />
                    <input
                      type="text"
                      placeholder="Mağazada ürün ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full ps-12 pe-4 py-4 bg-white rounded-2xl border border-brand-primary/5 focus:ring-4 focus:ring-accent/5 outline-none font-medium text-sm transition-all"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 bg-[#F8F8FA] rounded-xl text-xs font-bold text-[#1A1033]/60 outline-none cursor-pointer border-0 shrink-0"
                  >
                    <option value="default">Varsayılan</option>
                    <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                    <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                    <option value="rating">En Popüler</option>
                    <option value="newest">En Yeniler</option>
                  </select>
                  <button className="px-8 py-4 bg-white rounded-2xl border border-brand-primary/5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all">
                    <Filter size={16} /> Filtrele
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
                    <ProductCarousel products={flashProducts} title="" />
                  </div>
                )}

                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(['all', ...categories] as string[]).map((catId) => (
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

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-brand-primary/40 tracking-wider">
                    {displayProducts.length} sonuç
                  </span>
                </div>

                <div
                  className={cn(
                    'grid gap-8',
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1',
                  )}
                >
                  {displayProducts.map((product) => (
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
                    <h2 className="text-3xl font-display font-black tracking-tight uppercase italic text-brand-primary">
                      Hikayemiz
                    </h2>
                    <p className="text-brand-primary/60 leading-relaxed text-lg font-medium">
                      {seller.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 py-8 border-y border-brand-primary/5">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-2">
                        Konum
                      </h4>
                      <p className="font-bold text-brand-primary flex items-center gap-2">
                        <MapPin size={16} className="text-accent" /> {seller.origin}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-2">
                        Satıcı Aktif
                      </h4>
                      <p className="font-bold text-brand-primary flex items-center gap-2">
                        <History size={16} className="text-accent" /> {seller.joinedDate} tarihinden
                        beri
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-display font-black tracking-tight text-brand-primary">
                      Sertifikalar
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {[
                        'B-Corp Sertifikalı',
                        'CO2 Nötr Kargo',
                        'Adil Ücret Garantisi',
                        'Onarılabilir Tasarım',
                      ].map((badge) => (
                        <span
                          key={badge}
                          className="px-4 py-2 bg-brand-secondary rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 border border-brand-primary/5"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ek bilgiler: iade politikası + kargo notu */}
                  {(sellerData.returnPolicy || sellerData.shippingNote) && (
                    <div className="space-y-6 pt-4">
                      {sellerData.returnPolicy && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-2">
                            İade Politikası
                          </h4>
                          <p className="text-sm text-brand-primary/60 leading-relaxed">
                            {sellerData.returnPolicy}
                          </p>
                        </div>
                      )}
                      {sellerData.shippingNote && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-2">
                            Kargo Notu
                          </h4>
                          <p className="text-sm text-brand-primary/60 leading-relaxed">
                            {sellerData.shippingNote}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
                    <p className="text-6xl font-display font-black text-brand-primary">
                      {seller.rating}
                    </p>
                    <div className="flex gap-1 my-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-brand-primary/40">
                      Onaylı Sektör Puanı
                    </p>
                  </div>
                  <div className="col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-primary/5 flex flex-col justify-center">
                    <div className="space-y-4 w-full">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-4">
                          <span className="text-xs font-black text-brand-primary w-4">
                            {rating}
                          </span>
                          <div className="flex-1 h-3 bg-brand-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent px-4"
                              style={{ width: rating === 5 ? '85%' : rating === 4 ? '12%' : '1%' }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-brand-primary/40 w-12">
                            {rating === 5 ? '85%' : rating === 4 ? '12%' : '<1%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {[1, 2, 3].map((r) => (
                    <div
                      key={r}
                      className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-primary/5"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-secondary overflow-hidden">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r}`}
                              className="w-full h-full"
                              alt="Kullanıcı avatarı"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-brand-primary">Onaylı Alıcı</p>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className="text-yellow-400 fill-yellow-400"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">
                          2 hafta önce
                        </span>
                      </div>
                      <p className="text-brand-primary/60 leading-relaxed font-medium">
                        &quot;The engineering on their headsets is unparalleled. You can literally
                        hear the artisan craftsmanship in the soundstage. Global shipping was
                        surprisingly fast from Dubai to London.&quot;
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
