import React, { useState, useEffect } from 'react';
import { Save, Eye, Upload, Loader2, Check, Globe, Mail, Phone, Instagram, Facebook, Twitter, Youtube, Link2, RotateCcw } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { getStoreConfig, saveStoreConfig, type StoreConfig } from '../services/sellerStoreService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const DEFAULT_COLORS = ['#6418E5', '#1A1033', '#F97316', '#06B6D4', '#10B981', '#F43F5E', '#3B82F6', '#EAB308', '#8B5CF6', '#EC4899'];

export function SellerStoreSettings() {
  const { user } = useAuth();
  const sellerId = (user as any)?.sellerId || user?.id || '';
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    getStoreConfig(sellerId).then((c) => { setConfig(c); setLoading(false); });
  }, [sellerId]);

  function update<K extends keyof StoreConfig>(key: K, val: StoreConfig[K]) {
    setConfig((prev) => prev ? { ...prev, [key]: val } : prev);
  }

  function updateSocial(platform: keyof StoreConfig['socialLinks'], val: string) {
    setConfig((prev) => prev ? { ...prev, socialLinks: { ...prev.socialLinks, [platform]: val } } : prev);
  }

  async function handleUpload(type: 'logo' | 'banner', file: File) {
    const setter = type === 'logo' ? setLogoUploading : setBannerUploading;
    setter(true);
    try {
      const storageRef = ref(storage, `store-assets/${sellerId}/${type}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      update(type === 'logo' ? 'logoUrl' : 'bannerUrl', url);
    } finally { setter(false); }
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await saveStoreConfig(sellerId, config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-accent" /></div>;
  if (!config) return <div className="text-center py-20 text-brand-primary/40">Mağaza bulunamadı</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-primary uppercase tracking-tight">Mağaza Ayarları</h1>
          <p className="text-sm text-brand-primary/40 mt-1">Mağaza sayfanızı özelleştirin</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl flex items-center gap-1"><Check size={14} /> Kaydedildi</span>}
          <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Kaydet
          </button>
          <a href={`/store/${sellerId}`} target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-white rounded-xl border border-brand-primary/10 font-black text-xs uppercase tracking-widest text-brand-primary/60 hover:text-accent transition-all flex items-center gap-2">
            <Eye size={14} /> Önizle
          </a>
        </div>
      </div>

      {/* Banner Upload */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">Mağaza Görselleri</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-2">Banner (1920×480 önerilir)</label>
            <div className="relative h-32 rounded-xl overflow-hidden bg-brand-secondary">
              {config.bannerUrl ? <img src={config.bannerUrl} alt="Banner" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-brand-primary/20 text-sm">Banner yüklenmemiş</div>}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                {bannerUploading ? <Loader2 size={20} className="text-white animate-spin" /> : <Upload size={20} className="text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('banner', e.target.files[0])} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-2">Logo (400×400 önerilir)</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-secondary shrink-0">
                {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-brand-primary/20 text-[10px]">Logo</div>}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  {logoUploading ? <Loader2 size={14} className="text-white animate-spin" /> : <Upload size={14} className="text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('logo', e.target.files[0])} />
                </label>
              </div>
              <div className="text-xs text-brand-primary/40">Kare logo önerilir. Max 2MB.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Info */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">Mağaza Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-1">Mağaza Adı</label>
            <input type="text" value={config.storeName} onChange={(e) => update('storeName', e.target.value)} className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-primary/40 mb-1">İletişim E-posta</label>
            <div className="relative"><Mail size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20" /><input type="email" value={config.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className="w-full ps-10 pe-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20" /></div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-brand-primary/40 mb-1">Mağaza Açıklaması</label>
          <textarea rows={3} value={config.description} onChange={(e) => update('description', e.target.value)} className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 resize-none" />
        </div>
      </section>

      {/* Brand Color */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">Marka Rengi</h2>
        <div className="flex flex-wrap gap-3">
          {DEFAULT_COLORS.map((color) => (
            <button key={color} onClick={() => update('brandColor', color)} className={cn('w-10 h-10 rounded-xl transition-all', config.brandColor === color ? 'ring-2 ring-offset-2 ring-accent scale-110' : 'hover:scale-105')} style={{ backgroundColor: color }} />
          ))}
          <input type="color" value={config.brandColor} onChange={(e) => update('brandColor', e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0" />
        </div>
      </section>

      {/* Social Links */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary/30">Sosyal Medya</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'instagram' as const, icon: Instagram, label: 'Instagram' },
            { key: 'facebook' as const, icon: Facebook, label: 'Facebook' },
            { key: 'twitter' as const, icon: Twitter, label: 'Twitter / X' },
            { key: 'youtube' as const, icon: Youtube, label: 'YouTube' },
            { key: 'website' as const, icon: Link2, label: 'Web Sitesi' },
          ].map(({ key, icon: Icon, label }) => (
            <div key={key}><label className="block text-xs font-bold text-brand-primary/40 mb-1">{label}</label>
              <div className="relative"><Icon size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/20" />
                <input type="url" value={config.socialLinks?.[key] || ''} onChange={(e) => updateSocial(key, e.target.value)} placeholder={`${label} linki`} className="w-full ps-10 pe-4 py-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
