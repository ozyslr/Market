import React, { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  Upload,
  Loader2,
  Check,
  Globe,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Link2,
  RotateCcw,
  Shield,
  TrendingUp,
  Package,
  ArrowUpCircle,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Play,
  Image,
  LayoutGrid,
  Megaphone,
  Info,
  Calendar,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { getStoreConfig, saveStoreConfig, type StoreConfig } from '../services/sellerStoreService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import {
  getSellerTierStatus,
  getTierConfig,
  type SellerTierStatus,
} from '../services/sellerTierService';
import { getProducts, getCategories } from '../services/productService';

const DEFAULT_COLORS = [
  '#6418E5',
  '#1A1033',
  '#F97316',
  '#06B6D4',
  '#10B981',
  '#F43F5E',
  '#3B82F6',
  '#EAB308',
  '#8B5CF6',
  '#EC4899',
];

const FALLBACK_CATEGORIES = [
  'Elektronik',
  'Moda',
  'Ev & Yaşam',
  'Kozmetik',
  'Spor',
  'Bebek',
  'Kitap',
  'Otomotiv',
  'Market',
  'Pet Shop',
];

export function SellerStoreSettings() {
  const { user } = useAuth();
  const sellerId = (user as any)?.sellerId || user?.id || '';
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('banners');
  const [savingTab, setSavingTab] = useState<string | null>(null);
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [newBanner, setNewBanner] = useState({ imageUrl: '', title: '', link: '' });
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [tierStatus, setTierStatus] = useState<SellerTierStatus | null>(null);
  const [tierLoading, setTierLoading] = useState(true);

  useEffect(() => {
    getStoreConfig(sellerId).then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, [sellerId]);

  useEffect(() => {
    if (!sellerId) return;
    (async () => {
      try {
        const [products, tierConfig] = await Promise.all([
          getProducts({ sellerId }),
          getTierConfig('starter'),
        ]);
        const productCount = products.length;
        const status = await getSellerTierStatus(sellerId, productCount, 0, 0);
        setTierStatus(status);
      } catch {
        /* tier fetch is non-critical */
      } finally {
        setTierLoading(false);
      }
    })();
  }, [sellerId]);

  function update<K extends keyof StoreConfig>(key: K, val: StoreConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  function updateSocial(platform: keyof StoreConfig['socialLinks'], val: string) {
    setConfig((prev) =>
      prev ? { ...prev, socialLinks: { ...prev.socialLinks, [platform]: val } } : prev,
    );
  }

  async function handleUpload(type: 'logo' | 'banner', file: File) {
    const setter = type === 'logo' ? setLogoUploading : setBannerUploading;
    setter(true);
    try {
      const storageRef = ref(storage, `store-assets/${sellerId}/${type}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      update(type === 'logo' ? 'logoUrl' : 'bannerUrl', url);
    } finally {
      setter(false);
    }
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await saveStoreConfig(sellerId, config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleTabSave(tabName: string) {
    if (!config) return;
    setSavingTab(tabName);
    await saveStoreConfig(sellerId, config);
    setSavingTab(null);
    setSavedTab(tabName);
    setTimeout(() => setSavedTab(null), 3000);
  }

  // Load categories for showcase tab
  useEffect(() => {
    getCategories()
      .then((cats) => {
        const names = cats.map((c) => c.name).filter(Boolean);
        setCategoryOptions(names.length > 0 ? names : FALLBACK_CATEGORIES);
      })
      .catch(() => setCategoryOptions(FALLBACK_CATEGORIES));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  if (!config)
    return <div className="text-center py-20 text-brand-primary/40">Mağaza bulunamadı</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-primary uppercase tracking-tight">
            Mağaza Ayarları
          </h1>
          <p className="text-sm text-brand-primary/40 mt-1">Mağaza sayfanızı özelleştirin</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl flex items-center gap-1">
              <Check size={14} /> Kaydedildi
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Kaydet
          </button>
          <a
            href={`/store/${sellerId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 bg-white rounded-xl border border-brand-primary/10 font-black text-xs uppercase tracking-widest text-brand-primary/60 hover:text-accent transition-all flex items-center gap-2"
          >
            <Eye size={14} /> Önizle
          </a>
        </div>
      </div>

      {/* Banner Upload */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
          Mağaza Görselleri
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-2">
              Banner (1920×480 önerilir)
            </label>
            <div className="relative h-32 rounded-xl overflow-hidden bg-brand-secondary">
              {config.bannerUrl ? (
                <img src={config.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-brand-primary/20 text-sm">
                  Banner yüklenmemiş
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                {bannerUploading ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <Upload size={20} className="text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload('banner', e.target.files[0])}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-2">
              Logo (400×400 önerilir)
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-secondary shrink-0">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-brand-primary/20 text-[10px]">
                    Logo
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  {logoUploading ? (
                    <Loader2 size={14} className="text-white animate-spin" />
                  ) : (
                    <Upload size={14} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload('logo', e.target.files[0])}
                  />
                </label>
              </div>
              <div className="text-xs text-brand-primary/40">Kare logo önerilir. Max 2MB.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Info */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
          Mağaza Bilgileri
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-1">Mağaza Adı</label>
            <input
              type="text"
              value={config.storeName}
              onChange={(e) => update('storeName', e.target.value)}
              className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-1">
              İletişim E-posta
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20"
              />
              <input
                type="email"
                value={config.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                className="w-full ps-10 pe-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-brand-primary/40 mb-1">
            Mağaza Açıklaması
          </label>
          <textarea
            rows={3}
            value={config.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 resize-none"
          />
        </div>
      </section>

      {/* Brand Color */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
          Marka Rengi
        </h2>
        <div className="flex flex-wrap gap-3">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => update('brandColor', color)}
              className={cn(
                'w-10 h-10 rounded-xl transition-all',
                config.brandColor === color
                  ? 'ring-2 ring-offset-2 ring-accent scale-110'
                  : 'hover:scale-105',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={config.brandColor}
            onChange={(e) => update('brandColor', e.target.value)}
            className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
          />
        </div>
      </section>

      {/* Low Stock Alert Threshold */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
          Dusuk Stok Uyarisi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-1">
              Stok Esik Degeri
            </label>
            <p className="text-[10px] text-brand-primary/30 mb-2">
              Stok bu sayinin altina dustugunde size bildirim gonderilir.
            </p>
            <input
              type="number"
              min={1}
              max={999}
              value={config.lowStockThreshold ?? 5}
              onChange={(e) => update('lowStockThreshold', parseInt(e.target.value) || 5)}
              className="w-28 px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
            <div className="text-xs text-amber-700 font-medium">
              Her urun icin ayrica urun detay sayfasindan ozel esik degeri tanimlayabilirsiniz.
              Urune ozel esik, bu genel ayari gecersiz kilar.
            </div>
          </div>
        </div>
      </section>

      {/* Tier / Paketim */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
          Paketim
        </h2>
        {tierLoading ? (
          <div className="flex items-center gap-2 text-brand-primary/40">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-medium">Paket bilgisi yukleniyor...</span>
          </div>
        ) : tierStatus ? (
          <div className="space-y-4">
            {/* Tier badge + stats row */}
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest',
                  tierStatus.currentTier === 'platinum'
                    ? 'bg-purple-100 text-purple-700'
                    : tierStatus.currentTier === 'gold'
                      ? 'bg-yellow-100 text-yellow-700'
                      : tierStatus.currentTier === 'silver'
                        ? 'bg-gray-100 text-gray-600'
                        : tierStatus.currentTier === 'bronze'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-brand-secondary text-brand-primary/60',
                )}
              >
                <Shield size={12} className="inline me-1" />
                {tierStatus.tierConfig.label} Paketi
              </span>
              <div className="flex items-center gap-6 text-xs text-brand-primary/50">
                <span className="flex items-center gap-1.5">
                  <Package size={13} />
                  <strong className="text-brand-primary">{tierStatus.productCount}</strong>/{' '}
                  {tierStatus.tierConfig.maxProducts} urun
                  {tierStatus.remainingSlots > 0 && (
                    <span className="text-green-600 font-bold">
                      ({tierStatus.remainingSlots} kaldi)
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={13} />
                  Komisyon:{' '}
                  <strong className="text-brand-primary">
                    %{tierStatus.tierConfig.commissionRate}
                  </strong>
                </span>
                {tierStatus.tierConfig.monthlyFee > 0 && (
                  <span className="font-bold text-amber-600">
                    Aylik: {tierStatus.tierConfig.monthlyFee.toLocaleString('tr-TR')} TL
                  </span>
                )}
              </div>
            </div>

            {/* Features / Benefits */}
            <div>
              <p className="text-xs font-bold text-brand-primary/40 mb-2">Paket Ozellikleri</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tierStatus.tierConfig.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-brand-secondary/20 rounded-xl px-3 py-2"
                  >
                    <Check size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-brand-primary/70">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cap warning + upgrade CTA */}
            {tierStatus.atCap && tierStatus.nextTier && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">Urun limitine ulastiniz!</p>
                  <p className="text-xs text-red-600 mt-0.5">{tierStatus.recommendation}</p>
                  <a
                    href="/seller/subscription"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-accent transition-all"
                  >
                    <ArrowUpCircle size={12} />
                    {tierStatus.nextTier} Paketine Yuksel
                  </a>
                </div>
              </div>
            )}

            {/* Near-cap warning */}
            {!tierStatus.atCap &&
              tierStatus.remainingSlots < 10 &&
              tierStatus.remainingSlots > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700 font-medium">
                    Sadece {tierStatus.remainingSlots} urun hakkiniz kaldi. Limitinize
                    yaklasiyorsunuz.
                    {tierStatus.nextTier && (
                      <a
                        href="/seller/subscription"
                        className="ms-2 underline underline-offset-2 text-amber-800 font-bold"
                      >
                        Yukselt
                      </a>
                    )}
                  </p>
                </div>
              )}

            {/* Recommendation footer */}
            {tierStatus.recommendation && !tierStatus.atCap && (
              <p className="text-xs text-brand-primary/40 italic">{tierStatus.recommendation}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-brand-primary/30">Paket bilgisi alinamadi.</p>
        )}
      </section>

      {/* Social Links */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
          Sosyal Medya
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'instagram' as const, icon: Instagram, label: 'Instagram' },
            { key: 'facebook' as const, icon: Facebook, label: 'Facebook' },
            { key: 'twitter' as const, icon: Twitter, label: 'Twitter / X' },
            { key: 'youtube' as const, icon: Youtube, label: 'YouTube' },
            { key: 'website' as const, icon: Link2, label: 'Web Sitesi' },
          ].map(({ key, icon: Icon, label }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-brand-primary/40 mb-1">{label}</label>
              <div className="relative">
                <Icon
                  size={14}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20"
                />
                <input
                  type="url"
                  value={config.socialLinks?.[key] || ''}
                  onChange={(e) => updateSocial(key, e.target.value)}
                  placeholder={`${label} linki`}
                  className="w-full ps-10 pe-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mağaza Ozellestirme v2 ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-brand-primary/5 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-brand-primary/5 overflow-x-auto">
          {[
            { key: 'banners', label: 'Banner Yonetimi', icon: Image },
            { key: 'showcase', label: 'Kategori Vitrini', icon: LayoutGrid },
            { key: 'campaign', label: 'Kampanya', icon: Megaphone },
            { key: 'video', label: 'Video', icon: Play },
            { key: 'about', label: 'Hakkimizda', icon: Info },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-brand-primary/40 hover:text-brand-primary/60',
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {savedTab === activeTab && (
            <div className="mb-4 text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl flex items-center gap-1 w-fit">
              <Check size={14} /> Kaydedildi
            </div>
          )}

          {/* ── Banner Yonetimi ── */}
          {activeTab === 'banners' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
                Banner Yonetimi
              </h3>
              <p className="text-xs text-brand-primary/40">
                Magaza sayfanizda gosterilecek bannerlar. En fazla 5 banner ekleyebilirsiniz.
              </p>

              {(config.banners?.length ?? 0) > 0 && (
                <div className="space-y-3">
                  {config.banners!.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 bg-brand-secondary/20 rounded-xl"
                    >
                      <div className="w-24 h-[60px] rounded-lg overflow-hidden bg-brand-secondary shrink-0">
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.title || `Banner ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-brand-primary/20">
                            <Image size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">
                          {b.title || 'Basliksiz'}
                        </p>
                        {b.link && (
                          <p className="text-xs text-brand-primary/40 truncate">{b.link}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const updated = (config.banners || []).filter((_, idx) => idx !== i);
                          update('banners', updated);
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showBannerForm ? (
                <div className="space-y-3 p-4 bg-brand-secondary/20 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                      Gorsel URL
                    </label>
                    <input
                      type="url"
                      value={newBanner.imageUrl}
                      onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-white rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                      Baslik (opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={newBanner.title}
                      onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                      placeholder="Banner basligi"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                      Link (opsiyonel)
                    </label>
                    <input
                      type="url"
                      value={newBanner.link}
                      onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-white rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!newBanner.imageUrl) return;
                        const updated = [
                          ...(config.banners || []),
                          { ...newBanner, order: (config.banners || []).length },
                        ];
                        update('banners', updated);
                        setNewBanner({ imageUrl: '', title: '', link: '' });
                        setShowBannerForm(false);
                      }}
                      disabled={!newBanner.imageUrl}
                      className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40"
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => {
                        setShowBannerForm(false);
                        setNewBanner({ imageUrl: '', title: '', link: '' });
                      }}
                      className="px-4 py-2 text-brand-primary/40 rounded-lg text-xs font-bold hover:text-brand-primary/60 transition-all"
                    >
                      Iptal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowBannerForm(true)}
                  disabled={(config.banners?.length ?? 0) >= 5}
                  className="px-4 py-2 bg-brand-secondary/40 rounded-lg text-xs font-bold text-brand-primary/60 hover:text-accent hover:bg-brand-secondary/60 transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Plus size={14} />
                  Banner Ekle ({config.banners?.length ?? 0}/5)
                </button>
              )}

              <div className="pt-2">
                <button
                  onClick={() => handleTabSave('banners')}
                  disabled={savingTab === 'banners'}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingTab === 'banners' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{' '}
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* ── Kategori Vitrini ── */}
          {activeTab === 'showcase' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
                Kategori Vitrini
              </h3>
              <p className="text-xs text-brand-primary/40">
                Magaza sayfanizda one cikarilacak kategorileri secin.
              </p>

              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => {
                  const selected = (config.showcaseCategories || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        const current = config.showcaseCategories || [];
                        const updated = selected
                          ? current.filter((c) => c !== cat)
                          : [...current, cat];
                        update('showcaseCategories', updated);
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                        selected
                          ? 'bg-accent text-white border-accent'
                          : 'bg-brand-secondary/30 text-brand-primary/50 border-brand-primary/5 hover:border-accent/30',
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {(config.showcaseCategories?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-bold text-brand-primary/40 mb-2">
                    Secilen Kategoriler:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {config.showcaseCategories!.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold"
                      >
                        {cat}
                        <button
                          onClick={() =>
                            update(
                              'showcaseCategories',
                              (config.showcaseCategories || []).filter((c) => c !== cat),
                            )
                          }
                          className="hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => handleTabSave('showcase')}
                  disabled={savingTab === 'showcase'}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingTab === 'showcase' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{' '}
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* ── Kampanya ── */}
          {activeTab === 'campaign' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
                Kampanya
              </h3>

              {/* Toggle */}
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={config.campaignBanner?.active ?? false}
                  onChange={(e) =>
                    update('campaignBanner', {
                      ...(config.campaignBanner || {
                        title: '',
                        imageUrl: '',
                        active: false,
                      }),
                      active: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded accent-accent"
                />
                <span className="text-sm font-bold text-brand-primary">
                  {config.campaignBanner?.active ? 'Aktif' : 'Pasif'}
                </span>
              </label>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                    Baslik
                  </label>
                  <input
                    type="text"
                    value={config.campaignBanner?.title ?? ''}
                    onChange={(e) =>
                      update('campaignBanner', {
                        ...(config.campaignBanner || {
                          title: '',
                          imageUrl: '',
                          active: false,
                        }),
                        title: e.target.value,
                      })
                    }
                    placeholder="Kampanya basligi"
                    className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                    Aciklama (opsiyonel)
                  </label>
                  <textarea
                    rows={3}
                    value={config.campaignBanner?.description ?? ''}
                    onChange={(e) =>
                      update('campaignBanner', {
                        ...(config.campaignBanner || {
                          title: '',
                          imageUrl: '',
                          active: false,
                        }),
                        description: e.target.value,
                      })
                    }
                    placeholder="Kampanya aciklamasi"
                    className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                    Gorsel URL
                  </label>
                  <input
                    type="url"
                    value={config.campaignBanner?.imageUrl ?? ''}
                    onChange={(e) =>
                      update('campaignBanner', {
                        ...(config.campaignBanner || {
                          title: '',
                          imageUrl: '',
                          active: false,
                        }),
                        imageUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                      Link (opsiyonel)
                    </label>
                    <input
                      type="url"
                      value={config.campaignBanner?.link ?? ''}
                      onChange={(e) =>
                        update('campaignBanner', {
                          ...(config.campaignBanner || {
                            title: '',
                            imageUrl: '',
                            active: false,
                          }),
                          link: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                      Bitis Tarihi (opsiyonel)
                    </label>
                    <div className="relative">
                      <Calendar
                        size={14}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20"
                      />
                      <input
                        type="date"
                        value={config.campaignBanner?.endDate?.split('T')[0] ?? ''}
                        onChange={(e) =>
                          update('campaignBanner', {
                            ...(config.campaignBanner || {
                              title: '',
                              imageUrl: '',
                              active: false,
                            }),
                            endDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                        className="w-full ps-10 pe-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview card */}
              {(config.campaignBanner?.title || config.campaignBanner?.imageUrl) && (
                <div className="rounded-xl border border-brand-primary/10 overflow-hidden">
                  {config.campaignBanner.imageUrl && (
                    <img
                      src={config.campaignBanner.imageUrl}
                      alt={config.campaignBanner.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4 bg-brand-secondary/10">
                    <p className="text-sm font-bold text-brand-primary">
                      {config.campaignBanner.title || 'Basliksiz'}
                    </p>
                    {config.campaignBanner.description && (
                      <p className="text-xs text-brand-primary/50 mt-1">
                        {config.campaignBanner.description}
                      </p>
                    )}
                    {config.campaignBanner.endDate && (
                      <p className="text-xs text-red-500 mt-1 font-bold">
                        Sona eris:{' '}
                        {new Date(config.campaignBanner.endDate).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => handleTabSave('campaign')}
                  disabled={savingTab === 'campaign'}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingTab === 'campaign' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{' '}
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* ── Video ── */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
                Video
              </h3>
              <p className="text-xs text-brand-primary/40">
                YouTube veya Vimeo video linki ekleyin.
              </p>

              <div>
                <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                  Video URL
                </label>
                <div className="relative">
                  <Play
                    size={14}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20"
                  />
                  <input
                    type="url"
                    value={config.videoUrl ?? ''}
                    onChange={(e) => update('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full ps-10 pe-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              {/* Video Preview */}
              {(config.videoUrl ?? '') &&
                (() => {
                  let embedUrl = '';
                  const url = config.videoUrl ?? '';
                  const ytMatch = url.match(
                    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
                  );
                  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
                  if (ytMatch) {
                    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                  } else if (vmMatch) {
                    embedUrl = `https://player.vimeo.com/video/${vmMatch[1]}`;
                  }

                  if (embedUrl) {
                    return (
                      <div className="rounded-xl overflow-hidden bg-black aspect-video">
                        <iframe
                          src={embedUrl}
                          allowFullScreen
                          className="w-full h-full"
                          title="Video onizleme"
                        />
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-amber-600 font-medium">
                      Gecerli bir YouTube veya Vimeo URLsi girin. Onizleme burada gorunecek.
                    </p>
                  );
                })()}

              <div className="pt-2">
                <button
                  onClick={() => handleTabSave('video')}
                  disabled={savingTab === 'video'}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingTab === 'video' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{' '}
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* ── Hakkimizda ── */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">
                Hakkimizda
              </h3>

              <div>
                <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                  Hakkimizda Yazisi (HTML desteklenir)
                </label>
                <textarea
                  rows={8}
                  value={config.aboutHtml ?? config.description ?? ''}
                  onChange={(e) => update('aboutHtml', e.target.value)}
                  placeholder="Magazaniz hakkinda detayli bilgi..."
                  className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-primary/40 mb-1">
                    Kurulus Yili
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={config.foundedYear ?? ''}
                    onChange={(e) =>
                      update('foundedYear', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="2020"
                    className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleTabSave('about')}
                  disabled={savingTab === 'about'}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingTab === 'about' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{' '}
                  Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
