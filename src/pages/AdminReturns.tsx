import React from 'react';
import { RefreshCcw, Check, X, RotateCcw } from 'lucide-react';
import { useReturnStore, ReturnStatus } from '@/store/useReturnStore';

const STATUS_META: Record<ReturnStatus, { label: string; cls: string }> = {
  requested: { label: 'Talep Edildi', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Onaylandı', cls: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
  refunded: { label: 'İade Edildi', cls: 'bg-green-100 text-green-700' },
};

export function AdminReturns() {
  const { returns, updateStatus } = useReturnStore();
  const fmt = (n: number) => `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

  const pending = returns.filter((r) => r.status === 'requested').length;
  const refunded = returns.filter((r) => r.status === 'refunded').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Toplam Talep</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-[#1A1033]">{returns.length}</h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Bekleyen</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-amber-600">{pending}</h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">İade Edilen Tutar</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-green-600">{fmt(refunded)}</h4>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><RefreshCcw size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">İade Talepleri</h3>
        </div>

        {returns.length === 0 ? (
          <div className="text-center py-16">
            <RotateCcw size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
            <p className="text-sm font-bold text-[#1A1033]/30 italic">İade talebi yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-primary/5 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">
                  <th className="px-6 py-5">İade ID</th>
                  <th className="px-6 py-5">Sipariş</th>
                  <th className="px-6 py-5">Müşteri</th>
                  <th className="px-6 py-5">Sebep</th>
                  <th className="px-6 py-5">Tutar</th>
                  <th className="px-6 py-5">Durum</th>
                  <th className="px-6 py-5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/5">
                {returns.map((r) => (
                  <tr key={r.id} className="group hover:bg-brand-secondary/30 transition-colors">
                    <td className="px-6 py-6"><span className="font-mono font-black text-accent">{r.id}</span></td>
                    <td className="px-6 py-6 text-sm font-bold text-[#1A1033]/60">{r.orderId}</td>
                    <td className="px-6 py-6 font-bold text-sm text-[#1A1033]">{r.buyerName}</td>
                    <td className="px-6 py-6 text-sm text-[#1A1033]/40 italic max-w-[200px] truncate">{r.reason}</td>
                    <td className="px-6 py-6 font-black text-[#1A1033]">{fmt(r.amount)}</td>
                    <td className="px-6 py-6"><span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${STATUS_META[r.status].cls}`}>{STATUS_META[r.status].label}</span></td>
                    <td className="px-6 py-6 text-right">
                      {r.status === 'requested' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => updateStatus(r.id, 'approved')} title="Onayla" className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"><Check size={16} /></button>
                          <button onClick={() => updateStatus(r.id, 'rejected')} title="Reddet" className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><X size={16} /></button>
                        </div>
                      ) : r.status === 'approved' ? (
                        <button onClick={() => updateStatus(r.id, 'refunded')} className="px-4 py-2 rounded-lg bg-[#1A1033] text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">İadeyi Tamamla</button>
                      ) : (
                        <span className="text-[10px] font-bold text-[#1A1033]/20 uppercase tracking-widest">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
