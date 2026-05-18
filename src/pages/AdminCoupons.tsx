import React, { useState, useEffect } from 'react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/services/couponService';
import { Coupon } from '@/types';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMPTY: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'> = {
  code: '', discountType: 'percentage', discountValue: 10,
  isActive: true, description: '',
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCoupons().then(data => { setCoupons(data); setLoading(false); });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    try {
      const newCoupon = await createCoupon({ ...form, code: form.code.toUpperCase() });
      setCoupons(prev => [newCoupon, ...prev]);
      setForm({ ...EMPTY });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kuponu silmek istiyor musunuz?')) return;
    await deleteCoupon(id);
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm space-y-8">
      <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Kupon & İndirim</h3>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-[#F8F8FA] rounded-3xl p-6 space-y-4">
        <h4 className="text-sm font-black uppercase text-[#1A1033]/40 tracking-widest">Yeni Kupon Oluştur</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Kupon Kodu</label>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              required placeholder="MERCORA10"
              className="w-full px-3 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20 uppercase" />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">İndirim Tipi</label>
            <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
              className="w-full px-3 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20">
              <option value="percentage">Yüzde (%)</option>
              <option value="fixed">Sabit (₺)</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">İndirim Değeri</label>
            <input type="number" min={1} value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Min. Sipariş (₺)</label>
            <input type="number" min={0} value={form.minOrderAmount || ''} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
              placeholder="İsteğe bağlı"
              className="w-full px-3 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Maks. Kullanım</label>
            <input type="number" min={1} value={form.maxUses || ''} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="Sınırsız"
              className="w-full px-3 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Son Geçerlilik</label>
            <input type="datetime-local" value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
              className="w-full px-3 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-all">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Oluştur
          </button>
        </div>
      </form>

      {/* Coupons List */}
      <div className="space-y-3">
        {coupons.length === 0 && <p className="text-center py-8 text-[#1A1033]/30 font-bold text-sm">Henüz kupon yok</p>}
        {coupons.map(coupon => (
          <div key={coupon.id} className={cn('flex items-center justify-between p-4 rounded-2xl border transition-colors', coupon.isActive ? 'bg-[#F8F8FA] border-transparent' : 'bg-white border-[#F8F8FA] opacity-60')}>
            <div className="flex items-center gap-4">
              <span className="font-black text-[#1A1033] tracking-widest text-sm bg-white px-3 py-1.5 rounded-xl border border-[#1A1033]/10">{coupon.code}</span>
              <div>
                <p className="text-xs font-bold text-[#1A1033]">
                  {coupon.discountType === 'percentage' ? `%${coupon.discountValue}` : `${coupon.discountValue} ₺`} indirim
                  {coupon.minOrderAmount ? ` · Min. ${coupon.minOrderAmount} ₺` : ''}
                </p>
                <p className="text-[10px] text-[#1A1033]/40">
                  {coupon.usedCount} kullanım{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                  {coupon.expiresAt ? ` · ${new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleToggle(coupon)} className="transition-colors">
                {coupon.isActive ? <ToggleRight size={24} className="text-accent" /> : <ToggleLeft size={24} className="text-[#1A1033]/30" />}
              </button>
              <button onClick={() => handleDelete(coupon.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
