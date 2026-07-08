import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Seller } from '@/types';
import { Loader2, Save, Store, Truck, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'store' | 'shipping' | 'payout';

interface FormState {
  storeName: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  returnPolicy: string;
  estimatedDeliveryDays: number;
  shippingNote: string;
  payoutMethod: 'bank_transfer' | 'paypal';
  payoutIban: string;
  payoutEmail: string;
}

export function SellerSettings() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('store');
  const [form, setForm] = useState<FormState>({
    storeName: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    returnPolicy: '',
    estimatedDeliveryDays: 3,
    shippingNote: '',
    payoutMethod: 'bank_transfer',
    payoutIban: '',
    payoutEmail: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, 'sellers', user.id))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as Seller;
          setSeller({ ...data, id: snap.id });
          setForm((prev) => ({
            ...prev,
            storeName: data.storeName || '',
            description: data.description || '',
            logoUrl: data.logoUrl || '',
            bannerUrl: data.bannerUrl || '',
            returnPolicy: data.returnPolicy || '',
            shippingNote: (data as any).shippingNote || '',
            estimatedDeliveryDays: data.estimatedDeliveryDays ?? 3,
          }));
        } else {
          // Satıcı kaydı henüz oluşturulmamış — boş profil yarat
          setDoc(doc(db, 'sellers', user.id), {
            userId: user.id,
            storeName: '',
            description: '',
            logoUrl: '',
            bannerUrl: '',
            createdAt: serverTimestamp(),
          }).then(() => setSeller({ id: user.id, userId: user.id, storeName: '' } as any));
        }
      })
      .catch(() => {
        /* sessiz hata — loading false yapılacak */
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'sellers', user.id), {
        storeName: form.storeName,
        description: form.description,
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        returnPolicy: form.returnPolicy,
        shippingNote: form.shippingNote,
        estimatedDeliveryDays: form.estimatedDeliveryDays,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: Tab; label: string; icon: typeof Store }[] = [
    { key: 'store', label: 'Mağaza Bilgileri', icon: Store },
    { key: 'shipping', label: 'Kargo & İade', icon: Truck },
    { key: 'payout', label: 'Ödeme Ayarları', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-brand-primary/40 font-bold">Satıcı profili bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-black uppercase italic tracking-tight text-brand-primary mb-8">
        Mağaza Ayarları
      </h1>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-colors',
              activeTab === key
                ? 'bg-accent text-white'
                : 'bg-[#F8F8FA] text-brand-primary/60 hover:bg-accent/10',
            )}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-8 border border-[#F8F8FA] shadow-sm space-y-5">
        {activeTab === 'store' && (
          <>
            <Field
              label="Mağaza Adı"
              value={form.storeName}
              onChange={(v) => setForm((p) => ({ ...p, storeName: v }))}
            />
            <Field
              label="Mağaza Açıklaması"
              value={form.description}
              onChange={(v) => setForm((p) => ({ ...p, description: v }))}
              type="textarea"
              placeholder="Mağazanızı tanıtın..."
            />
            <Field
              label="Logo URL"
              value={form.logoUrl}
              onChange={(v) => setForm((p) => ({ ...p, logoUrl: v }))}
              placeholder="https://..."
            />
            <Field
              label="Banner URL"
              value={form.bannerUrl}
              onChange={(v) => setForm((p) => ({ ...p, bannerUrl: v }))}
              placeholder="https://..."
            />
            {form.logoUrl && (
              <div>
                <p className="text-[10px] font-black uppercase text-brand-primary/40 mb-2">
                  Logo Önizleme
                </p>
                <img
                  src={form.logoUrl}
                  alt={form.storeName + ' logo'}
                  className="w-16 h-16 rounded-xl object-cover border border-[#F8F8FA]"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'shipping' && (
          <>
            <Field
              label="İade Politikası"
              value={form.returnPolicy}
              onChange={(v) => setForm((p) => ({ ...p, returnPolicy: v }))}
              type="textarea"
              placeholder="Müşterilerinize sunduğunuz iade koşulları..."
            />
            <div>
              <label className="block text-[10px] font-black uppercase text-brand-primary/40 mb-1">
                Tahmini Teslimat (Gün)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.estimatedDeliveryDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, estimatedDeliveryDays: Number(e.target.value) }))
                }
                className="w-24 border border-[#F8F8FA] rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <Field
              label="Kargo Notu"
              value={form.shippingNote}
              onChange={(v) => setForm((p) => ({ ...p, shippingNote: v }))}
              type="textarea"
              placeholder="Kargo hakkında ek bilgi..."
            />
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-brand-primary/40">
                Bölgesel Kargo Ücretleri (₺)
              </p>
              {[
                { key: 'shippingMarmara', label: 'Marmara', val: form as any, default: 29.9 },
                { key: 'shippingEge', label: 'Ege', val: form as any, default: 34.9 },
                { key: 'shippingIcAnadolu', label: 'İç Anadolu', val: form as any, default: 39.9 },
                { key: 'shippingAkdeniz', label: 'Akdeniz', val: form as any, default: 39.9 },
                { key: 'shippingKaradeniz', label: 'Karadeniz', val: form as any, default: 44.9 },
                {
                  key: 'shippingDogu',
                  label: 'Doğu/G.Doğu Anadolu',
                  val: form as any,
                  default: 49.9,
                },
              ].map((region) => (
                <div
                  key={region.key}
                  className="flex items-center justify-between bg-[#F8F8FA] rounded-xl px-4 py-2.5"
                >
                  <span className="text-xs font-bold text-brand-primary">{region.label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={region.val[region.key] ?? (region as any).default}
                      onChange={(e) =>
                        setForm((p: any) => ({
                          ...p,
                          [region.key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-20 text-end bg-white rounded-lg px-2 py-1 text-xs font-bold outline-none border border-transparent focus:border-accent/20"
                    />
                    <span className="text-[10px] text-brand-primary/40">₺</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'payout' && (
          <div className="space-y-5">
            <div className="p-4 bg-yellow-50 rounded-2xl text-xs text-yellow-700 font-bold">
              Ödeme bilgileri admin onayından geçer. Değişiklikler 1-2 iş günü içinde aktif olur.
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-brand-primary/40 mb-2">
                Ödeme Yöntemi
              </label>
              <div className="flex gap-4">
                {(['bank_transfer', 'paypal'] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={m}
                      checked={form.payoutMethod === m}
                      onChange={() => setForm((p) => ({ ...p, payoutMethod: m }))}
                      className="accent-accent"
                    />
                    <span className="text-sm font-bold text-brand-primary">
                      {m === 'bank_transfer' ? 'Banka Transferi' : 'PayPal'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {form.payoutMethod === 'bank_transfer' ? (
              <Field
                label="IBAN"
                value={form.payoutIban}
                onChange={(v) => setForm((p) => ({ ...p, payoutIban: v }))}
                placeholder="TR..."
              />
            ) : (
              <Field
                label="PayPal E-Posta"
                value={form.payoutEmail}
                onChange={(v) => setForm((p) => ({ ...p, payoutEmail: v }))}
                placeholder="email@example.com"
              />
            )}
          </div>
        )}

        <div className="pt-4 border-t border-[#F8F8FA] flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-black text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saved ? 'Kaydedildi ✓' : saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const cls =
    'w-full border border-[#F8F8FA] rounded-xl p-3 text-sm focus:outline-none focus:border-accent';
  return (
    <div>
      <label className="block text-[10px] font-black uppercase text-brand-primary/40 mb-1">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}
