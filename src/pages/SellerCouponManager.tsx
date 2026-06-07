import React, { useState, useEffect } from 'react';
import {
  Plus,
  Loader2,
  Check,
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  ShoppingBag,
} from 'lucide-react';
import {
  getSellerCoupons,
  createCoupon,
  updateCoupon,
  type SellerCoupon,
} from '../services/sellerCouponService';
import { useAuth } from '../context/AuthContext';

export function SellerCouponManager() {
  const { user } = useAuth();
  const sellerId = (user as any)?.sellerId || user?.id || '';
  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as const,
    value: 10,
    minOrderAmount: 0,
    maxUses: 100,
    startsAt: new Date().toISOString().slice(0, 10),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getSellerCoupons(sellerId).then((c) => {
      setCoupons(c);
      setLoading(false);
    });
  }, [sellerId]);

  async function handleCreate() {
    setCreating(true);
    await createCoupon({
      sellerId,
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.value,
      minOrderAmount: form.minOrderAmount || undefined,
      maxUses: form.maxUses || undefined,
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
      enabled: true,
    });
    const updated = await getSellerCoupons(sellerId);
    setCoupons(updated);
    setCreating(false);
    setShowForm(false);
    setForm({
      code: '',
      type: 'percentage',
      value: 10,
      minOrderAmount: 0,
      maxUses: 100,
      startsAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
  }

  async function toggleCoupon(id: string, enabled: boolean) {
    await updateCoupon(id, { enabled } as any);
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, enabled } : c)));
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-primary uppercase">Kupon Yönetimi</h1>
          <p className="text-xs text-brand-primary/40 mt-1">İndirim kuponları oluştur ve yönet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-accent text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:opacity-90"
        >
          <Plus size={14} /> Yeni Kupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-brand-primary/10 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-brand-primary/40 uppercase">
                Kupon Kodu
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="YAZ2025"
                className="w-full mt-1 px-3 py-2.5 bg-brand-secondary/30 rounded-xl border-0 text-sm font-bold outline-none focus:ring-1 focus:ring-accent uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-primary/40 uppercase">
                İndirim Türü
              </label>
              <div className="flex gap-2 mt-1">
                {[
                  { key: 'percentage', label: 'Yüzde (%)', icon: Percent },
                  { key: 'fixed', label: 'Sabit (TL)', icon: DollarSign },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setForm({ ...form, type: t.key as any })}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5',
                      form.type === t.key
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-secondary/30 text-brand-primary/60',
                    )}
                  >
                    <t.icon size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-primary/40 uppercase">
                {form.type === 'percentage' ? 'İndirim %' : 'İndirim TL'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2.5 bg-brand-secondary/30 rounded-xl border-0 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-primary/40 uppercase">
                Min. Sipariş Tutarı
              </label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2.5 bg-brand-secondary/30 rounded-xl border-0 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-primary/40 uppercase">
                Başlangıç
              </label>
              <input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 bg-brand-secondary/30 rounded-xl border-0 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-primary/40 uppercase">Bitiş</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 bg-brand-secondary/30 rounded-xl border-0 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-brand-secondary/30 rounded-xl text-xs font-bold"
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.code}
              className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{' '}
              Oluştur
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {coupons.map((c) => (
          <div
            key={c.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border bg-white',
              c.enabled ? 'border-brand-primary/10' : 'border-brand-primary/5 opacity-50',
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-secondary flex items-center justify-center text-brand-primary">
              <Tag size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-brand-primary">
                {c.code}{' '}
                <span className="text-[10px] font-normal text-brand-primary/40">
                  {c.type === 'percentage' ? `%${c.value}` : `₺${c.value}`} indirim
                </span>
              </p>
              <p className="text-[10px] text-brand-primary/30">
                {c.startsAt?.slice(0, 10)} → {c.expiresAt?.slice(0, 10)} · {c.usedCount}/
                {c.maxUses || '∞'} kullanım · Min: ₺{c.minOrderAmount || 0}
              </p>
            </div>
            <button
              onClick={() => toggleCoupon(c.id!, !c.enabled)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] font-bold',
                c.enabled ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400',
              )}
            >
              {c.enabled ? 'Aktif' : 'Pasif'}
            </button>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="text-center py-12 text-brand-primary/30 text-sm">
            Henüz kupon oluşturulmamış
          </div>
        )}
      </div>
    </div>
  );
}
function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
