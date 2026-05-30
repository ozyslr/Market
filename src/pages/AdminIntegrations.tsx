import React from 'react';
import { Share2, Plug, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function AdminIntegrations() {
  const { integrations, toggleIntegration } = useSettingsStore();
  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><Share2 size={24} /></div>
            <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Entegrasyonlar</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">{connectedCount}/{integrations.length} Bağlı</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {integrations.map((i) => (
          <div key={i.id} className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${i.connected ? 'bg-green-100 text-green-600' : 'bg-[#F8F8FA] text-[#1A1033]/30'}`}>
                <Plug size={22} />
              </div>
              {i.connected && <CheckCircle2 size={20} className="text-green-500" />}
            </div>
            <h4 className="text-lg font-display font-black uppercase tracking-tight text-[#1A1033] mb-1">{i.name}</h4>
            <p className="text-[12px] font-medium text-[#1A1033]/40 italic mb-6 leading-relaxed">{i.description}</p>
            <button onClick={() => toggleIntegration(i.id)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i.connected ? 'bg-[#F8F8FA] text-[#1A1033]/50 hover:bg-red-50 hover:text-red-600' : 'bg-accent text-white hover:scale-[1.02]'}`}>
              {i.connected ? 'Bağlantıyı Kes' : 'Bağlan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
