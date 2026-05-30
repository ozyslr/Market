import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Power } from 'lucide-react';
import { useCampaignStore } from '@/store/useCampaignStore';

export function AdminCampaigns() {
  const { campaigns, addCampaign, toggleActive, removeCampaign } = useCampaignStore();
  const [form, setForm] = useState({ title: '', discountPercent: '', startDate: '', endDate: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    addCampaign({
      title: form.title.trim(),
      discountPercent: parseFloat(form.discountPercent) || 0,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    });
    setForm({ title: '', discountPercent: '', startDate: '', endDate: '' });
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR');

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><Megaphone size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Yeni Kampanya</h3>
        </div>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kampanya Adı" className="lg:col-span-2 px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          <input value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} type="number" min={0} max={100} placeholder="İndirim %" className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} type="date" className="px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          <button type="submit" className="lg:col-span-5 py-3 bg-[#1A1033] text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"><Plus size={16} /> Kampanya Ekle</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${c.active ? 'bg-green-100 text-green-700' : 'bg-[#1A1033]/5 text-[#1A1033]/40'}`}>{c.active ? 'Aktif' : 'Pasif'}</span>
              <button onClick={() => removeCampaign(c.id)} className="p-2 text-[#1A1033]/30 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
            <h4 className="text-xl font-display font-black uppercase tracking-tight text-[#1A1033] mb-2">{c.title}</h4>
            <p className="text-4xl font-display font-black text-accent tracking-tighter mb-4">%{c.discountPercent}</p>
            <p className="text-[10px] font-bold text-[#1A1033]/30 uppercase tracking-widest mb-6">{fmtDate(c.startDate)} — {fmtDate(c.endDate)}</p>
            <button onClick={() => toggleActive(c.id)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${c.active ? 'bg-[#F8F8FA] text-[#1A1033]/50 hover:bg-[#1A1033]/5' : 'bg-accent text-white hover:scale-[1.02]'}`}><Power size={14} /> {c.active ? 'Durdur' : 'Başlat'}</button>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="lg:col-span-3 text-center py-16 bg-white rounded-[3rem] border border-[#F8F8FA]">
            <Megaphone size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
            <p className="text-sm font-bold text-[#1A1033]/30 italic">Henüz kampanya yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
