import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Ticket, Clock, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Coupon } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  getCouponsBySeller,
  createSellerCoupon,
  updateSellerCoupon,
  deleteSellerCoupon,
} from '@/services/couponService';

const EMPTY_FORM: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'sellerId'> = {
  code: '', discountType: 'percentage', discountValue: 10,
  isActive: true, description: '',
};

export function SellerCoupons() {
  const { firebaseUser } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    getCouponsBySeller(firebaseUser.uid).then(data => {
      setCoupons(data);
      setLoading(false);
    });
  }, [firebaseUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !firebaseUser) return;
    setSaving(true);
    try {
      const created = await createSellerCoupon(firebaseUser.uid, {
        ...form, code: form.code.toUpperCase(),
      });
      setCoupons(prev => [created, ...prev]);
      setForm({ ...EMPTY_FORM });
    } finally { setSaving(false); }
  };

  const handleToggle = async (coupon: Coupon) => {
    if (!firebaseUser) return;
    await updateSellerCoupon(firebaseUser.uid, coupon.id, { isActive: !coupon.isActive });
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDelete = async (id: string) => {
    if (!firebaseUser || !confirm('Bu kuponu silmek istiyor musunuz?')) return;
    await deleteSellerCoupon(firebaseUser.uid, id);
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  const activeCount = coupons.filter(c => c.isActive).length;

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
              Kupon Yönetimi
            </h1>
            <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mt-1">
              {activeCount} aktif / {coupons.length} toplam kupon
            </p>
          </div>
          <div className="flex items-center gap-2 text-[#1A1033]/30">
            <Ticket size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Satıcı Kuponları</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Aktif', value: activeCount, icon: Tag, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Toplam Kullanım', value: coupons.reduce((s, c) => s + c.usedCount, 0), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Toplam Kupon', value: coupons.length, icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#1A1033]/5 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40">{stat.label}</p>
                <p className="text-xl font-display font-black text-[#1A1033]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="bg-white rounded-[2rem] p-6 border border-[#1A1033]/5 space-y-4">
          <h4 className="text-sm font-black uppercase text-[#1A1033]/40 tracking-widest">Yeni Kupon Oluştur</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Kupon Kodu</label>
              <input value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required placeholder="INDIRIM20"
                className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20 uppercase" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">İndirim Tipi</label>
              <select value={form.discountType}
                onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20">
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit (₺)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">İndirim Değeri</label>
              <input type="number" min={1} value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Min. Sipariş (₺)</label>
              <input type="number" min={0} value={form.minOrderAmount || ''}
                onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="İsteğe bağlı"
                className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Maks. Kullanım</label>
              <input type="number" min={1} value={form.maxUses || ''}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="Sınırsız"
                className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 mb-1 block">Son Geçerlilik</label>
              <input type="datetime-local"
                value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-all">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Oluştur
            </button>
          </div>
        </form>

        {/* Coupons List */}
        <div className="space-y-3">
          {coupons.length === 0 && (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-[#1A1033]/10">
              <Ticket size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
              <p className="text-sm font-bold text-[#1A1033]/30">Henüz kupon oluşturmadınız</p>
              <p className="text-[10px] text-[#1A1033]/20 mt-1">Müşterilerinize özel indirim kodları tanımlayın</p>
            </div>
          )}
          {coupons.map(coupon => (
            <div key={coupon.id}
              className={cn(
                'flex items-center justify-between p-5 rounded-2xl border transition-all bg-white',
                coupon.isActive ? 'border-[#1A1033]/5' : 'border-[#1A1033]/5 opacity-50'
              )}>
              <div className="flex items-center gap-4">
                <span className="font-black text-[#1A1033] tracking-widest text-sm bg-[#F8F8FA] px-3 py-1.5 rounded-xl border border-[#1A1033]/10">
                  {coupon.code}
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1A1033]">
                    {coupon.discountType === 'percentage' ? `%${coupon.discountValue}` : `${coupon.discountValue} ₺`} indirim
                    {coupon.minOrderAmount ? ` · Min. ${coupon.minOrderAmount} ₺` : ''}
                  </p>
                  <p className="text-[10px] text-[#1A1033]/40">
                    {coupon.usedCount} kullanım{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    {coupon.expiresAt ? ` · ${new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}` : ' · Süresiz'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(coupon)} className="transition-colors">
                  {coupon.isActive
                    ? <ToggleRight size={24} className="text-accent" />
                    : <ToggleLeft size={24} className="text-[#1A1033]/30" />}
                </button>
                <button onClick={() => handleDelete(coupon.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
