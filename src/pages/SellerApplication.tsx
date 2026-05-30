import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Store, CheckCircle, Loader2, ArrowLeft, Upload, FileText, Globe, Phone, Mail, Package, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { submitApplication } from '@/services/sellerApplicationService';
import { uploadImage } from '@/lib/storage';

const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const CATEGORIES = [
  'Elektronik', 'Moda', 'Ev & Yaşam', 'Spor & Outdoor',
  'Aksesuar', 'Oyuncak & Hobi', 'Kozmetik', 'Kitap',
  'Müzik & Enstrüman', 'Otomotiv', 'Bahçe', 'Sanat & El İşi',
];

const EXPERIENCE_OPTIONS = [
  { value: '0-1', label: '0-1 yıl (Yeni başladım)' },
  { value: '1-3', label: '1-3 yıl' },
  { value: '3-5', label: '3-5 yıl' },
  { value: '5+', label: '5+ yıl (Uzman)' },
];

const MONTHLY_TARGETS = [
  { value: '0-10000', label: '₺0 - ₺10.000' },
  { value: '10000-50000', label: '₺10.000 - ₺50.000' },
  { value: '50000-200000', label: '₺50.000 - ₺200.000' },
  { value: '200000+', label: '₺200.000+' },
];

export function SellerApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docError, setDocError] = useState('');

  const [form, setForm] = useState({
    storeName: '',
    phone: '',
    origin: 'TR',
    taxId: '',
    businessRegistration: '',
    website: '',
    productCategories: [] as string[],
    monthlySalesTarget: '',
    experience: '',
  });

  const set = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file || !user) return;
    setDocError('');
    if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
      setDocError('Yalnızca JPG, PNG, WEBP veya PDF yükleyebilirsiniz.');
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setDocError('Dosya boyutu en fazla 5 MB olabilir.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, `kyc/${user.id}`);
      setDocs(prev => [...prev, { name: file.name, url }]);
    } catch {
      setDocError('Belge yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (url: string) => setDocs(prev => prev.filter(d => d.url !== url));
  const toggleCategory = (cat: string) => {
    setForm(p => ({
      ...p,
      productCategories: p.productCategories.includes(cat)
        ? p.productCategories.filter(c => c !== cat)
        : [...p.productCategories, cat],
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitApplication({
        userId: user.id,
        userEmail: user.email || '',
        userName: user.name || '',
        ...form,
        slug: form.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        socialMedia: [],
        kycDocuments: docs,
      });
      setSubmitted(true);
    } catch {
      // handled by service
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-brand-primary/5 p-12 max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black uppercase italic text-brand-primary dark:text-white mb-3">Başvuru Alındı!</h2>
          <p className="text-sm text-brand-primary/60 dark:text-white/60 mb-2">
            Satıcı başvurunuz başarıyla gönderildi.
          </p>
          <p className="text-xs text-brand-primary/40 dark:text-white/40 mb-8">
            Ekibimiz başvurunuzu en kısa sürede değerlendirecek. Sonuç e-posta adresinize bildirilecektir.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest"
          >
            Ana Sayfaya Dön
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')} className="flex items-center gap-2 text-sm font-bold text-brand-primary/50 hover:text-brand-primary transition-colors mb-6">
          <ArrowLeft size={16} /> {step > 1 ? 'Geri' : 'Ana Sayfa'}
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
            <Store className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic text-brand-primary dark:text-white">Satıcı Başvurusu</h1>
            <p className="text-xs text-brand-primary/50 font-bold">Benim Olan'da satış yapmaya başlayın</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all',
                step >= s ? 'bg-violet-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-brand-primary/30'
              )}>{s}</div>
              {s < 3 && <div className={cn('flex-1 h-1 rounded', step > s ? 'bg-violet-600' : 'bg-zinc-100 dark:bg-zinc-800')} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        <motion.div
          key={step}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-brand-primary/5 p-8"
        >
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black uppercase italic text-brand-primary dark:text-white">Mağaza Bilgileri</h2>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">Mağaza Adı *</label>
                <input
                  value={form.storeName}
                  onChange={e => set('storeName', e.target.value)}
                  placeholder="Örn: TeknoDükkan"
                  className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">Telefon *</label>
                <div className="flex gap-2">
                  <select
                    value={form.origin}
                    onChange={e => set('origin', e.target.value)}
                    className="px-3 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="TR">🇹🇷 +90</option>
                    <option value="UK">🇬🇧 +44</option>
                    <option value="US">🇺🇸 +1</option>
                    <option value="DE">🇩🇪 +49</option>
                  </select>
                  <input
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="5XX XXX XX XX"
                    className="flex-1 px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">Vergi No (opsiyonel)</label>
                  <input
                    value={form.taxId}
                    onChange={e => set('taxId', e.target.value)}
                    placeholder="Vergi no"
                    className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">Web Siteniz (opsiyonel)</label>
                  <input
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://"
                    className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">
                  KYC Belgeleri (kimlik / vergi levhası — opsiyonel)
                </label>
                <label className={cn(
                  'flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors text-sm font-bold',
                  uploading
                    ? 'border-brand-primary/10 text-brand-primary/30 cursor-wait'
                    : 'border-violet-300 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                )}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Yükleniyor…' : 'Belge Yükle (JPG, PNG, PDF · max 5 MB)'}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleDocUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {docError && <p className="text-xs font-bold text-red-500 mt-1.5">{docError}</p>}
                {docs.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {docs.map(d => (
                      <li key={d.url} className="flex items-center gap-2 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                        <FileText size={14} className="text-violet-600 shrink-0" />
                        <span className="flex-1 truncate font-bold text-brand-primary dark:text-white">{d.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDoc(d.url)}
                          className="text-brand-primary/40 hover:text-red-500 font-black"
                          aria-label="Belgeyi kaldır"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.storeName.trim() || !form.phone.trim() || uploading}
                  className="w-full py-3.5 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Devam <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black uppercase italic text-brand-primary dark:text-white">Kategoriler & Deneyim</h2>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-2">Satmak İstediğiniz Kategoriler *</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                        form.productCategories.includes(cat)
                          ? 'bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                          : 'bg-white dark:bg-zinc-800 border-brand-primary/10 text-brand-primary/60 hover:border-violet-300'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">Satış Deneyiminiz</label>
                <select
                  value={form.experience}
                  onChange={e => set('experience', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Seçiniz</option>
                  {EXPERIENCE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">Aylık Hedef Satış Hacmi</label>
                <select
                  value={form.monthlySalesTarget}
                  onChange={e => set('monthlySalesTarget', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Seçiniz</option>
                  {MONTHLY_TARGETS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-3.5 border border-brand-primary/10 text-brand-primary font-black text-sm rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest">
                  Geri
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={form.productCategories.length === 0}
                  className="flex-1 py-3.5 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Devam <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black uppercase italic text-brand-primary dark:text-white">Önizleme & Onay</h2>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Mağaza Adı</span>
                  <span className="font-bold text-brand-primary dark:text-white">{form.storeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Telefon</span>
                  <span className="font-bold text-brand-primary dark:text-white">{form.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Kategoriler</span>
                  <span className="font-bold text-brand-primary dark:text-white">{form.productCategories.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Deneyim</span>
                  <span className="font-bold text-brand-primary dark:text-white">
                    {EXPERIENCE_OPTIONS.find(o => o.value === form.experience)?.label || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Hedef</span>
                  <span className="font-bold text-brand-primary dark:text-white">
                    {MONTHLY_TARGETS.find(o => o.value === form.monthlySalesTarget)?.label || '—'}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Başvurunuz incelendikten sonra e-posta ile bilgilendirileceksiniz.
                  Ortalama değerlendirme süresi 1-3 iş günüdür.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(2)} className="flex-1 py-3.5 border border-brand-primary/10 text-brand-primary font-black text-sm rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest">
                  Düzenle
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  {submitting ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
