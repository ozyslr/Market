import React, { useEffect, useState } from 'react';
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
import { SellerRatingSummary } from '@/components/product/RatingSummary';
import { getSellerStarSummary, type SellerStarSummary } from '@/services/sellerRatingService';
import { useAuth } from '@/context/AuthContext';
import { useFollows } from '@/context/FollowsContext';

export function SellerStorePage() {
  const { id, slug: slugParam } = useParams();
  const [activeTab, setActiveTab] = useState<'products' | 'all' | 'deals' | 'about' | 'reviews'>(
    'products',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'default' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  >('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<number>(0);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());

  function toggleBrand(brand: string) {
    setSelectedBrands((prev) => { const next = new Set(prev); next.has(brand) ? next.delete(brand) : next.add(brand); return next; });
  }
  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) => { const next = new Set(prev); next.has(feature) ? next.delete(feature) : next.add(feature); return next; });
  }
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

  // REV-03: live seller rating summary aggregated from approved reviews.
  const [starSummary, setStarSummary] = useState<SellerStarSummary | null>(null);
  useEffect(() => {
    let active = true;
    getSellerStarSummary(sellerData.id)
      .then((s) => {
        if (active) setStarSummary(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [sellerData.id]);
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
      const matchesBrand = selectedBrands.size === 0 || selectedBrands.has(p.brand);
      const matchesPrice = (priceMin === '' || p.price >= priceMin) && (priceMax === '' || p.price <= priceMax);
      const matchesFeatures = selectedFeatures.size === 0 || [...selectedFeatures].every((f) => {
        if (f === 'Kargo Bedava') return p.freeShipping;
        if (f === 'Hızlı Teslimat') return (p.estimatedDeliveryDays || 99) <= 3;
        if (f === 'İndirimli Ürünler') return p.oldPrice && p.oldPrice > p.price;
        if (f === 'Kuponlu Ürünler') return p.couponEligible;
        return true;
      });
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesFeatures;
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
  }, [sellerProducts, searchQuery, selectedCategory, sortBy, selectedBrands, priceMin, priceMax, selectedFeatures]);

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
      {/* Hero Banner — compact */}
      <div className="relative h-48 md:h-56 w-full overflow-hidden">
        <img
          src={seller.banner}
          alt={seller.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 to-transparent" />
        <div className="absolute bottom-4 start-0 end-0">
          <div className="max-w-7xl mx-auto px-4 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-lg p-3 ring-2 ring-white/20 overflow-hidden shrink-0">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-black text-white drop-shadow-md">
                    {seller.name}
                  </h1>
                  {seller.isVerified && <CheckCircle size={14} className="text-accent" />}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/80 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    {seller.rating} ({seller.reviewsCount})
                  </span>
                  <span>{seller.followers} Takipçi</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="px-4 py-2 bg-white text-brand-primary rounded-xl text-[11px] font-bold hover:bg-accent hover:text-white transition-all disabled:opacity-60"
              >
                {following ? 'Takibi Bırak' : 'Takip Et'}
              </button>
              <button
                onClick={copyToClipboard}
                className="p-2 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all"
                title="Paylaş"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Info Bar */}
      <div className="bg-white border-b border-brand-primary/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 md:gap-8 text-xs text-brand-primary/50">
          <span className="flex items-center gap-1.5">
            <History size={12} /> {seller.joinedDate} tarihinden beri
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={12} /> {seller.origin}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} /> Kurumsal Fatura
          </span>
          <span className="flex items-center gap-1.5">
            <Package size={12} /> Ortalama Kargo: 2-3 gün
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare size={12} /> Soru Cevaplama: ~4 saat
          </span>
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

      {/* Tabs + Search Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-8 border-b border-brand-primary/5">
        <div className="flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-6 md:gap-8">
            {[
              { id: 'products', label: 'Ana Sayfa', count: null },
              { id: 'all', label: 'Tüm Ürünler', count: sellerProducts.length },
              { id: 'deals', label: 'Fırsat Ürünleri', count: flashProducts.length },
              { id: 'reviews', label: 'Değerlendirmeler', count: seller.reviewsCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'pb-3 text-xs font-bold uppercase tracking-wide transition-all relative whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-brand-primary'
                    : 'text-brand-primary/30 hover:text-brand-primary/60',
                )}
              >
                {tab.label}{' '}
                {tab.count !== null && <span className="opacity-40">({tab.count})</span>}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tabSlot"
                    className="absolute bottom-0 start-0 end-0 h-0.5 bg-accent rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="hidden sm:block ml-4">
            <div className="relative">
              <Search
                size={14}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20"
              />
              <input
                type="text"
                placeholder="Mağazada ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab === 'products') setActiveTab('all');
                }}
                className="w-44 ps-9 pe-3 py-2 bg-white rounded-lg border border-brand-primary/10 text-xs font-medium outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className={cn('flex gap-8', activeTab === 'products' ? '' : '')}>
          {/* Sidebar — only non-homepage */}
          {activeTab !== 'products' && (
            <aside className="w-60 shrink-0 space-y-3 hidden lg:block">
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5 text-center">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="w-10 h-10 rounded-full mx-auto object-cover border border-accent/20"
                />
                <h3 className="text-xs font-bold text-brand-primary mt-1.5">{seller.name}</h3>
                <div className="flex items-center justify-center gap-1 text-[11px]">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-bold">{seller.rating}</span>
                  <span className="text-brand-primary/30">({seller.reviewsCount})</span>
                </div>
                <p className="text-[10px] text-brand-primary/40 mt-0.5">
                  {seller.followers} Takipçi
                </p>
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="flex-1 px-2 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-bold disabled:opacity-60"
                  >
                    {following ? 'Takibi Bırak' : 'Takip Et'}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="px-2 py-1.5 bg-brand-secondary rounded-lg"
                  >
                    <Share2 size={11} />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-brand-primary/5 space-y-3">
                <h3 className="text-[10px] font-black uppercase text-brand-primary/30">Filtrele</h3>
                <div>
                  <h4 className="text-[10px] font-bold text-brand-primary/50 mb-1">Kategori</h4>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={cn(
                        'block w-full text-left px-2 py-0.5 rounded text-[11px]',
                        selectedCategory === 'all'
                          ? 'bg-accent/10 text-accent font-bold'
                          : 'text-brand-primary/50 hover:bg-brand-secondary/50',
                      )}
                    >
                      Tümü
                    </button>
                    {categories.slice(0, 8).map((catId) => (
                      <button
                        key={catId}
                        onClick={() => setSelectedCategory(catId)}
                        className={cn(
                          'block w-full text-left px-2 py-0.5 rounded text-[11px]',
                          selectedCategory === catId
                            ? 'bg-accent/10 text-accent font-bold'
                            : 'text-brand-primary/50 hover:bg-brand-secondary/50',
                        )}
                      >
                        {catId.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-brand-primary/50 mb-1">Puan</h4>
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      className="block w-full text-left px-2 py-0.5 rounded text-[11px] text-brand-primary/50 hover:bg-brand-secondary/50"
                    >
                      {'★'.repeat(r)}
                      {'☆'.repeat(5 - r)} ve üzeri
                    </button>
                  ))}
                </div>
                {/* Marka */}
                <div>
                  <h4 className="text-[10px] font-bold text-brand-primary/50 mb-1 flex items-center gap-1">
                    Marka <Search size={10} className="opacity-30" />
                  </h4>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    {[...new Set(sellerProducts.map((p: any) => p.brand).filter(Boolean))]
                      .slice(0, 10)
                      .map((brand: any) => (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-[11px] text-brand-primary/50 hover:bg-brand-secondary/50"
                        >
                          <span
                            className={cn(
                              'w-3 h-3 rounded border border-brand-primary/20 flex items-center justify-center text-[7px]',
                              selectedBrands.has(brand) && 'bg-accent border-accent text-white',
                            )}
                          >
                            {selectedBrands.has(brand) ? '✓' : ''}
                          </span>
                          <span className="capitalize">{brand}</span>
                        </button>
                      ))}
                  </div>
                </div>
                {/* Fiyat */}
                <div>
                  <h4 className="text-[10px] font-bold text-brand-primary/50 mb-1">
                    Fiyat Aralığı
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-2 py-1 bg-brand-secondary/30 rounded-lg text-[10px] outline-none border-0"
                    />
                    <span className="text-brand-primary/20 text-[10px]">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-2 py-1 bg-brand-secondary/30 rounded-lg text-[10px] outline-none border-0"
                    />
                  </div>
                </div>
                {/* Renk */}
                <div>
                  <h4 className="text-[10px] font-bold text-brand-primary/50 mb-1">Renk</h4>
                  <div className="flex flex-wrap gap-1">
                    {[
                      '#000',
                      '#fff',
                      '#808080',
                      '#f00',
                      '#00f',
                      '#008000',
                      '#ff0',
                      '#ffa500',
                      '#800080',
                      '#ffc0cb',
                      '#8B4513',
                      '#0ff',
                    ].map((c) => (
                      <button
                        key={c}
                        className="w-5 h-5 rounded-full border border-brand-primary/10 hover:border-accent hover:scale-110 transition-all"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                {/* Özellikler */}
                <div>
                  <h4 className="text-[10px] font-bold text-brand-primary/50 mb-1">Özellikler</h4>
                  <div className="space-y-0.5">
                    {[
                      'Kargo Bedava',
                      'Hızlı Teslimat',
                      'İndirimli',
                      'Kuponlu',
                      'Yeni Ürün',
                      'Son Şans',
                    ].map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 px-2 py-0.5 rounded text-[11px] text-brand-primary/50 hover:bg-brand-secondary/50 cursor-pointer"
                      >
                        <span className={cn("w-3 h-3 rounded border flex items-center justify-center text-[7px]", selectedFeatures.has(item) ? "bg-accent border-accent text-white" : "border-brand-primary/20")}>{selectedFeatures.has(item) ? "✓" : ""}</span>
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'products' ? (
                /* ── ANA SAYFA ── */
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  {/* ── Sponsored Products Carousel ── */}
                  {flashProducts.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                            <Zap size={16} className="text-white" />
                          </div>
                          <h3 className="font-black text-lg text-brand-primary uppercase tracking-tight">
                            Mağazanın Flaş Ürünleri
                          </h3>
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full uppercase">
                            Sınırlı Süre
                          </span>
                        </div>
                        <button className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                          Tümünü Gör <ArrowRight size={14} />
                        </button>
                      </div>
                      <ProductCarousel products={flashProducts} title="" />
                    </section>
                  )}

                  {/* ── Trending Products ── */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Award size={16} className="text-white" />
                        </div>
                        <h3 className="font-black text-lg text-brand-primary uppercase tracking-tight">
                          Trend Ürünler
                        </h3>
                      </div>
                      <button className="text-xs font-bold text-orange-500 hover:text-orange-700 flex items-center gap-1">
                        Tümünü Gör <ArrowRight size={14} />
                      </button>
                    </div>
                    <ProductCarousel
                      products={sellerProducts.slice(0, 10).sort(() => Math.random() - 0.5)}
                      title=""
                    />
                  </section>

                  {/* ── Seller Campaign Banner ── */}
                  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent via-brand-primary to-brand-primary p-8 md:p-12">
                    <div className="relative z-10 max-w-md">
                      <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-black uppercase rounded-full">
                        {seller.name} Kampanyası
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black text-white uppercase mt-4 leading-tight">
                        {seller.name} Özel Fırsatlar
                      </h3>
                      <p className="text-white/70 text-sm mt-2">
                        Bu kampanya sadece {seller.name} mağazasında geçerlidir. Özel indirimler ve
                        fırsatlar için hemen keşfedin.
                      </p>
                      <button className="mt-6 px-6 py-3 bg-white text-brand-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all inline-flex items-center gap-2">
                        Kampanyaları Keşfet <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="absolute top-0 end-0 w-1/2 h-full opacity-10">
                      <Package size={300} className="text-white absolute -top-20 -end-20" />
                    </div>
                  </section>

                  {/* ── Category Navigation Cards ── */}
                  {categories.length > 1 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                          <Grid size={16} className="text-white" />
                        </div>
                        <h3 className="font-black text-lg text-brand-primary uppercase tracking-tight">
                          Kategoriler
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {categories.slice(0, 8).map((catId, idx) => (
                          <button
                            key={catId}
                            onClick={() => setSelectedCategory(catId)}
                            className={`group relative overflow-hidden rounded-2xl p-4 h-24 flex items-end transition-all ${
                              selectedCategory === catId
                                ? 'ring-2 ring-accent bg-brand-primary/5'
                                : 'bg-gradient-to-br from-brand-secondary to-brand-secondary/50 hover:shadow-md'
                            }`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <span className="relative z-10 text-xs font-black text-white uppercase tracking-wider">
                              {catId.replace(/-/g, ' ')}
                            </span>
                            <div
                              className="absolute top-2 end-2 w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
                              style={{
                                backgroundColor: [
                                  '#F97316',
                                  '#8B5CF6',
                                  '#06B6D4',
                                  '#10B981',
                                  '#F43F5E',
                                  '#3B82F6',
                                  '#EAB308',
                                  '#EC4899',
                                ][idx % 8],
                              }}
                            >
                              {sellerProducts.filter((p: any) => p.categoryId === catId).length}
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── Promo Image Banner ── */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-orange-200 p-8 h-48 flex items-center group cursor-pointer">
                      <div className="relative z-10">
                        <span className="text-[10px] font-black uppercase text-orange-600">
                          Yeni Sezon
                        </span>
                        <h4 className="text-xl font-black text-brand-primary uppercase mt-1">
                          İlkbahar Koleksiyonu
                        </h4>
                        <span className="text-xs text-brand-primary/60 mt-2 block">
                          %50'ye varan indirimler
                        </span>
                      </div>
                      <div className="absolute -end-10 -bottom-10 text-amber-300/40 group-hover:scale-110 transition-transform">
                        <Package size={150} />
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-100 to-pink-200 p-8 h-48 flex items-center group cursor-pointer">
                      <div className="relative z-10">
                        <span className="text-[10px] font-black uppercase text-purple-600">
                          Özel Teklif
                        </span>
                        <h4 className="text-xl font-black text-brand-primary uppercase mt-1">
                          Premium Ürünler
                        </h4>
                        <span className="text-xs text-brand-primary/60 mt-2 block">
                          Özel fiyatlarla sınırlı stok
                        </span>
                      </div>
                      <div className="absolute -end-10 -bottom-10 text-purple-300/40 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={150} />
                      </div>
                    </div>
                  </section>

                  {/* ── All Products Grid + Search/Filter ── */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                        <Package size={16} className="text-white" />
                      </div>
                      <h3 className="font-black text-lg text-brand-primary uppercase tracking-tight">
                        Daha Fazla Ürün
                      </h3>
                      <span className="text-xs text-brand-primary/40">
                        ({displayProducts.length})
                      </span>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
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
                          className="w-full ps-12 pe-4 py-3 bg-white rounded-2xl border border-brand-primary/5 focus:ring-4 focus:ring-accent/5 outline-none font-medium text-sm transition-all"
                        />
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-xs font-bold text-[#1A1033]/60 outline-none cursor-pointer border-0 shrink-0"
                      >
                        <option value="default">Varsayılan</option>
                        <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                        <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                        <option value="rating">En Popüler</option>
                        <option value="newest">En Yeniler</option>
                      </select>
                    </div>

                    {/* Category chips */}
                    {categories.length > 1 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {(['all', ...categories] as string[]).map((catId) => (
                          <button
                            key={catId}
                            onClick={() => setSelectedCategory(catId)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedCategory === catId
                                ? 'bg-brand-primary text-white'
                                : 'bg-[#F8F8FA] text-brand-primary/40 hover:text-brand-primary'
                            }`}
                          >
                            {catId === 'all' ? 'Tümü' : catId.replace(/-/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Product Grid */}
                    <div
                      className={cn(
                        'grid gap-6',
                        viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1',
                      )}
                    >
                      {displayProducts.slice(0, 12).map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {displayProducts.length > 12 && (
                      <div className="flex justify-center mt-8">
                        <button className="px-8 py-4 bg-white rounded-2xl border-2 border-brand-primary/10 font-black text-xs uppercase tracking-widest text-brand-primary hover:border-accent hover:text-accent transition-all">
                          Daha Fazla Ürün Göster
                        </button>
                      </div>
                    )}
                  </section>
                </motion.div>
              ) : activeTab === 'all' || activeTab === 'deals' ? (
                /* ── TÜM ÜRÜNLER / FIRSAT ÜRÜNLERİ ── */
                <motion.div
                  key="listing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Search + Sort */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search
                        size={16}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20"
                      />
                      <input
                        type="text"
                        placeholder="Mağazada ürün ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full ps-10 pe-4 py-3 bg-white rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="px-4 py-3 bg-white rounded-xl text-xs font-bold text-brand-primary/60 outline-none border-0 shrink-0"
                    >
                      <option value="default">Sıralama</option>
                      <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                      <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                      <option value="rating">En Popüler</option>
                      <option value="newest">En Yeniler</option>
                    </select>
                  </div>

                  {/* Category chips */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase',
                        selectedCategory === 'all'
                          ? 'bg-brand-primary text-white'
                          : 'bg-white text-brand-primary/50',
                      )}
                    >
                      Tümü
                    </button>
                    {categories.slice(0, 8).map((catId) => (
                      <button
                        key={catId}
                        onClick={() => setSelectedCategory(catId)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase',
                          selectedCategory === catId
                            ? 'bg-brand-primary text-white'
                            : 'bg-white text-brand-primary/50',
                        )}
                      >
                        {catId.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Product count */}
                  <p className="text-xs text-brand-primary/30">
                    {displayProducts.length} ürün listeleniyor
                  </p>

                  {/* Product Grid */}
                  <div
                    className={cn(
                      'grid gap-4',
                      viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
                    )}
                  >
                    {(activeTab === 'deals'
                      ? displayProducts.filter((p: any) => p.isFlashDeal || p.oldPrice)
                      : displayProducts
                    )
                      .slice(0, 24)
                      .map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                  </div>

                  {displayProducts.length > 24 && (
                    <div className="flex justify-center pt-4">
                      <button className="px-8 py-3 bg-white rounded-xl border-2 border-brand-primary/10 text-xs font-black uppercase text-brand-primary/60 hover:border-accent hover:text-accent transition-all">
                        Daha Fazla Ürün Göster
                      </button>
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
                          <History size={16} className="text-accent" /> {seller.joinedDate}{' '}
                          tarihinden beri
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
                  {starSummary && starSummary.total > 0 && (
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-primary/5">
                      <p className="text-xs font-black uppercase tracking-widest text-brand-primary/40 mb-6">
                        Onaylı Değerlendirmeler
                      </p>
                      <SellerRatingSummary summary={starSummary} />
                    </div>
                  )}
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
                          <button
                            key={rating}
                            onClick={() => setReviewFilter(reviewFilter === rating ? 0 : rating)}
                            className={cn(
                              'flex items-center gap-4 w-full text-left p-1 -mx-1 rounded-lg transition-all',
                              reviewFilter === rating
                                ? 'bg-accent/5 ring-1 ring-accent/20'
                                : 'hover:bg-brand-secondary/30',
                            )}
                          >
                            <span className="text-xs font-black text-brand-primary w-4">
                              {rating}
                            </span>
                            <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                            <div className="flex-1 h-3 bg-brand-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent"
                                style={{
                                  width:
                                    rating === 5
                                      ? '73%'
                                      : rating === 4
                                        ? '18%'
                                        : rating === 3
                                          ? '7%'
                                          : rating === 2
                                            ? '2%'
                                            : '1%',
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-brand-primary/40 w-12">
                              {rating === 5
                                ? '73%'
                                : rating === 4
                                  ? '18%'
                                  : rating === 3
                                    ? '7%'
                                    : rating === 2
                                      ? '2%'
                                      : '<1%'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {reviewFilter > 0 && (
                    <div className="flex items-center gap-2 text-sm text-brand-primary/60 mb-2">
                      <span>Filtre:</span>
                      <span className="text-yellow-400">
                        {'★'.repeat(reviewFilter)}
                        {'☆'.repeat(5 - reviewFilter)}
                      </span>
                      <button
                        onClick={() => setReviewFilter(0)}
                        className="text-[10px] text-accent font-bold hover:underline"
                      >
                        Temizle
                      </button>
                    </div>
                  )}
                  <div className="space-y-4">
                    {[
                      {
                        name: 'Ahmet Y.',
                        date: '15 Mayıs 2026',
                        rating: 5,
                        product: 'Kablosuz Kulaklık Pro',
                        text: 'Harika bir ürün. Ses kalitesi çok iyi, kargo hızlıydı. Satıcıyla iletişimim çok iyiydi.',
                        likes: 12,
                        reported: false,
                      },
                      {
                        name: 'Zeynep K.',
                        date: '3 Haziran 2026',
                        rating: 4,
                        product: 'El Yapımı Seramik Vazo',
                        text: 'Vazo çok güzel ama kargo kutusu biraz hasarlı geldi. Neyse ki ürün sağlamdı.',
                        likes: 8,
                        reported: false,
                      },
                      {
                        name: 'Mehmet D.',
                        date: '28 Mayıs 2026',
                        rating: 5,
                        product: 'Deri El Çantası',
                        text: 'Tam istediğim gibi. Malzeme kalitesi çok iyi. Kesinlikle tavsiye ederim.',
                        likes: 5,
                        reported: false,
                      },
                      {
                        name: 'Ayşe S.',
                        date: '20 Nisan 2026',
                        rating: 3,
                        product: 'Gümüş Kolye Seti',
                        text: 'Kolye güzel ama zincir biraz kısa. İade etmek istemedim, kullanıyorum.',
                        likes: 3,
                        reported: false,
                      },
                      {
                        name: 'Can B.',
                        date: '10 Mart 2026',
                        rating: 2,
                        product: 'Spor Ayakkabı',
                        text: 'Numarası biraz küçük geldi. İade süreci hızlıydı.',
                        likes: 1,
                        reported: true,
                      },
                      {
                        name: 'Elif T.',
                        date: '1 Haziran 2026',
                        rating: 5,
                        product: 'Ahşap Duvar Saati',
                        text: 'Mükemmel işçilik. Tam el yapımı. Beklediğimden de güzel çıktı.',
                        likes: 24,
                        reported: false,
                      },
                    ]
                      .filter((rv) => reviewFilter === 0 || rv.rating === reviewFilter)
                      .map((rv, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center text-brand-primary font-bold text-sm">
                                {rv.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-brand-primary">{rv.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        size={10}
                                        className={
                                          i < rv.rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-brand-primary/10'
                                        }
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-brand-primary/30">
                                    {rv.date}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {rv.reported && (
                              <span className="text-[9px] text-red-400 bg-red-50 px-2 py-0.5 rounded-full">
                                İncelendi
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-primary/60 leading-relaxed mb-3">
                            {rv.text}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-brand-primary/30">
                            <span className="bg-brand-secondary/50 px-2 py-0.5 rounded">
                              {rv.product} hakkında
                            </span>
                            <div className="flex items-center gap-3">
                              <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                                👍 {rv.likes}
                              </button>
                              <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                                🚩 Bildir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
