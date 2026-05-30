import React, { useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function AdminSettings() {
  const { siteName, supportEmail, commissionRate, currency, maintenanceMode, updateSettings } = useSettingsStore();
  const [form, setForm] = useState({ siteName, supportEmail, commissionRate: String(commissionRate), currency, maintenanceMode });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      siteName: form.siteName.trim(),
      supportEmail: form.supportEmail.trim(),
      commissionRate: parseFloat(form.commissionRate) || 0,
      currency: form.currency,
      maintenanceMode: form.maintenanceMode,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm max-w-3xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><Settings size={24} /></div>
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Site Ayarları</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-[#1A1033] uppercase tracking-widest mb-2">Site Adı</label>
            <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#1A1033] uppercase tracking-widest mb-2">Destek E-postası</label>
            <input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} type="email" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#1A1033] uppercase tracking-widest mb-2">Komisyon Oranı (%)</label>
            <input value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} type="number" min={0} max={100} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#1A1033] uppercase tracking-widest mb-2">Para Birimi</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none">
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#F8F8FA] rounded-2xl px-6 py-5">
          <div>
            <p className="text-sm font-black text-[#1A1033]">Bakım Modu</p>
            <p className="text-[11px] font-bold text-[#1A1033]/40 italic">Açıkken site ziyaretçilere kapalı görünür.</p>
          </div>
          <button type="button" onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })} className={`w-14 h-8 rounded-full transition-colors relative ${form.maintenanceMode ? 'bg-accent' : 'bg-[#1A1033]/15'}`}>
            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <button type="submit" className="w-full py-4 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:scale-[1.01] transition-transform flex items-center justify-center gap-2">
          {saved ? <><CheckCircle2 size={18} /> Kaydedildi</> : <><Save size={18} /> Ayarları Kaydet</>}
        </button>
      </form>
    </div>
  );
}
