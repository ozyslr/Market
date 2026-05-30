import React from 'react';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { useSupportStore, TicketStatus, TicketPriority } from '@/store/useSupportStore';

const STATUS_META: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: 'Açık', cls: 'bg-red-100 text-red-700' },
  pending: { label: 'Beklemede', cls: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Çözüldü', cls: 'bg-green-100 text-green-700' },
};

const PRIORITY_META: Record<TicketPriority, { label: string; cls: string }> = {
  high: { label: 'Yüksek', cls: 'text-red-600' },
  medium: { label: 'Orta', cls: 'text-amber-600' },
  low: { label: 'Düşük', cls: 'text-[#1A1033]/40' },
};

const STATUSES: TicketStatus[] = ['open', 'pending', 'resolved'];

export function AdminSupport() {
  const { tickets, updateStatus } = useSupportStore();
  const openCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><MessageSquare size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Canlı Destek</h3>
        </div>
        {openCount > 0 && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest"><AlertTriangle size={14} /> {openCount} Açık Talep</span>
        )}
      </div>

      <div className="space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="bg-[#F8F8FA] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono font-black text-accent text-xs">{t.id}</span>
                  <span className="font-black text-sm text-[#1A1033]">{t.subject}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${PRIORITY_META[t.priority].cls}`}>● {PRIORITY_META[t.priority].label}</span>
                </div>
                <p className="text-sm text-[#1A1033]/60 italic leading-relaxed mb-2">{t.message}</p>
                <p className="text-[10px] font-bold text-[#1A1033]/30 uppercase tracking-widest">{t.customer} · {new Date(t.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              <select
                value={t.status}
                onChange={(e) => updateStatus(t.id, e.target.value as TicketStatus)}
                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer border-none ${STATUS_META[t.status].cls}`}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
            <p className="text-sm font-bold text-[#1A1033]/30 italic">Destek talebi yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
