'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  Store, CheckCircle, Loader2, ArrowLeft,
  ChevronRight, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { submitApplication } from '@/services/sellerApplicationService';

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

export default function SellerApplyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Başvuru Alındı!</h2>
          <p className="text-sm text-gray-500 mb-2">
            Satıcı başvurunuz başarıyla gönderildi.
          </p>
          <p className="text-xs text-gray-400 mb-8">
            Ekibimiz başvurunuzu en kısa sürede değerlendirecek. Sonuç e-posta adresinize bildirilecektir.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition-colors uppercase tracking-widest"
          >
            Ana Sayfaya Dön
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> {step > 1 ? 'Geri' : 'Ana Sayfa'}
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
            <Store className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Satıcı Başvurusu</h1>
            <p className="text-xs text-gray-500 font-medium">Mercora&apos;da satış yapmaya başlayın</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0',
                step >= s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
              )}>{s}</div>
              {s < 3 && <div className={cn('flex-1 h-1 rounded', step > s ? 'bg-purple-600' : 'bg-gray-100')} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        <motion.div
          key={step}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
        >
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Mağaza Bilgileri</h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Mağaza Adı *</label>
                <input
                  value={form.storeName}
                  onChange={e => set('storeName', e.target.value)}
                  placeholder="Örn: TeknoDükkan"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon *</label>
                <div className="flex gap-2">
                  <select
                    value={form.origin}
                    onChange={e => set('origin', e.target.value)}
                    className="px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Vergi No (opsiyonel)</label>
                  <input
                    value={form.taxId}
                    onChange={e => set('taxId', e.target.value)}
                    placeholder="Vergi no"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Web Siteniz (opsiyonel)</label>
                  <input
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.storeName.trim() || !form.phone.trim()}
                  className="w-full py-3.5 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Devam <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Kategoriler &amp; Deneyim</h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Satmak İstediğiniz Kategoriler *</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                        form.productCategories.includes(cat)
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Satış Deneyiminiz</label>
                <select
                  value={form.experience}
                  onChange={e => set('experience', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seçiniz</option>
                  {EXPERIENCE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Aylık Hedef Satış Hacmi</label>
                <select
                  value={form.monthlySalesTarget}
                  onChange={e => set('monthlySalesTarget', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seçiniz</option>
                  {MONTHLY_TARGETS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest"
                >
                  Geri
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={form.productCategories.length === 0}
                  className="flex-1 py-3.5 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Devam <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Önizleme &amp; Onay</h2>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mağaza Adı</span>
                  <span className="font-bold text-gray-900">{form.storeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Telefon</span>
                  <span className="font-bold text-gray-900">{form.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kategoriler</span>
                  <span className="font-bold text-gray-900">{form.productCategories.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deneyim</span>
                  <span className="font-bold text-gray-900">
                    {EXPERIENCE_OPTIONS.find(o => o.value === form.experience)?.label || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hedef</span>
                  <span className="font-bold text-gray-900">
                    {MONTHLY_TARGETS.find(o => o.value === form.monthlySalesTarget)?.label || '—'}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-700">
                  Başvurunuz incelendikten sonra e-posta ile bilgilendirileceksiniz.
                  Ortalama değerlendirme süresi 1-3 iş günüdür.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest"
                >
                  Düzenle
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
