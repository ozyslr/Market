import React, { useState, useEffect } from 'react';
import { getSiteSettings, saveSiteSettings } from '@/services/settingsService';
import { SiteSettings } from '@/types';
import { Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

export function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>({ id: 'global', siteName: 'Benim Olan', maintenanceMode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteSettings().then(data => { setSettings(data); setLoading(false); });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm max-w-2xl">
      <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-8">Site Ayarları</h3>

      <form onSubmit={handleSave} className="space-y-6">
        {[
          { label: 'Site Adı', key: 'siteName' as const, placeholder: 'Benim Olan' },
          { label: 'Logo URL', key: 'logoUrl' as const, placeholder: 'https://...' },
          { label: 'İletişim E-postası', key: 'contactEmail' as const, placeholder: 'info@benimolan.com' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">{label}</label>
            <input value={(settings[key] as string) || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
          </div>
        ))}

        {settings.logoUrl && (
          <div className="p-3 bg-[#F8F8FA] rounded-xl inline-block">
            <img src={settings.logoUrl} alt="Logo önizleme" className="h-10 object-contain" referrerPolicy="no-referrer" loading="lazy" />
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-[#F8F8FA] rounded-2xl">
          <div>
            <p className="text-sm font-black text-[#1A1033]">Bakım Modu</p>
            <p className="text-[10px] text-[#1A1033]/40">Aktifken site ziyaretçilere bakım sayfası gösterir</p>
          </div>
          <button type="button" onClick={() => setSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))} className="transition-colors">
            {settings.maintenanceMode ? <ToggleRight size={28} className="text-accent" /> : <ToggleLeft size={28} className="text-[#1A1033]/30" />}
          </button>
        </div>

        {settings.maintenanceMode && (
          <div>
            <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Bakım Mesajı</label>
            <textarea value={settings.maintenanceMessage || ''} onChange={e => setSettings(s => ({ ...s, maintenanceMessage: e.target.value }))}
              rows={3} placeholder="Sitemiz bakım çalışmaları nedeniyle geçici olarak kapalıdır."
              className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none resize-none" />
          </div>
        )}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-[#1A1033] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-accent transition-all">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? 'Kaydedildi ✓' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}
