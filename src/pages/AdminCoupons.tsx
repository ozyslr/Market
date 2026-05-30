import React, { useState } from 'react';
import { Tag, Trash2, Plus, Percent, Banknote, Truck } from 'lucide-react';
import { useCouponStore, CouponType } from '@/store/useCouponStore';

const TYPE_META: Record<CouponType, { label: string; icon: any; cls: string }> = {
  percentage: { label: 'Yüzde', icon: Percent, cls: 'bg-purple-100 text-purple-700' },
  fixed: { label: 'Sabit Tutar', icon: Banknote, cls: 'bg-green-100 text-green-700' },
  freeshipping: { label: 'Ücretsiz Kargo', icon: Truck, cls: 'bg-blue-100 text-blue-700' },
};

export function AdminCoupons() {
  const { catalog, error, addCoupon, deleteCoupon } = useCouponStore();
  const [form, setForm] = useState<{ code: string; type: CouponType; value: string; minOrder: string; description: string }>({
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    description: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = addCoupon({
      code: form.code,
      type: form.type,
      value: parseFloat(form.value) || 0,
      minOrder: parseFloat(form.minOrder) || 0,
      description: form.description.trim() || form.code.trim().toUpperCase(),
    });
    if (ok) setForm({ code: '', type: 'percentage', value: '', minOrder: '', description: '' });
  };

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><Tag size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Yeni Kupon Oluştur</h3>
        </div>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="KOD" className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-black uppercase tracking-wider border border-transparent focus:border-accent/20 outline-none" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })} className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none">
            <option value="percentage">Yüzde (%)</option>
            <option value="fixed">Sabit Tutar (₺)</option>
            <option value="freeshipping">Ücretsiz Kargo</option>
          </select>
          <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} type="number" min={0} placeholder={form.type === 'percentage' ? 'Oran %' : 'Tutar ₺'} disabled={form.type === 'freeshipping'} className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none disabled:opacity-40" />
          <input value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} type="number" min={0} placeholder="Min Sepet ₺" className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          <button type="submit" className="py-3 bg-[#1A1033] text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"><Plus size={16} /> Ekle</button>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Açıklama (opsiyonel)" className="lg:col-span-5 px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
        </form>
        {error && <p className="text-[12px] font-bold text-red-500 mt-4">{error}</p>}
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-10">Aktif Kuponlar ({catalog.length})</h3>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-primary/5 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">
                <th className="px-6 py-5">Kod</th>
                <th className="px-6 py-5">Tür</th>
                <th className="px-6 py-5">Değer</th>
                <th className="px-6 py-5">Min Sepet</th>
                <th className="px-6 py-5">Açıklama</th>
                <th className="px-6 py-5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {catalog.map((c) => {
                const meta = TYPE_META[c.type];
                return (
                  <tr key={c.code} className="group hover:bg-brand-secondary/30 transition-colors">
                    <td className="px-6 py-6"><span className="font-mono font-black text-accent">{c.code}</span></td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${meta.cls}`}><meta.icon size={12} /> {meta.label}</span>
                    </td>
                    <td className="px-6 py-6 font-black text-[#1A1033]">{c.type === 'percentage' ? `%${c.value}` : c.type === 'fixed' ? `${c.value}₺` : '—'}</td>
                    <td className="px-6 py-6 text-sm font-bold text-[#1A1033]/60">{c.minOrder > 0 ? `${c.minOrder}₺` : 'Yok'}</td>
                    <td className="px-6 py-6 text-sm text-[#1A1033]/40 italic max-w-[260px] truncate">{c.description}</td>
                    <td className="px-6 py-6 text-right">
                      <button onClick={() => deleteCoupon(c.code)} className="p-2 text-[#1A1033]/40 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {catalog.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#1A1033]/40 text-sm font-bold">Henüz kupon yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
