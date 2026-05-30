import React, { useEffect } from 'react';
import { CreditCard, TrendingUp, Wallet, Banknote } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { usePayoutStore, COMMISSION_RATE, PayoutStatus } from '@/store/usePayoutStore';

const STATUS_META: Record<PayoutStatus, { label: string; cls: string }> = {
  pending: { label: 'Beklemede', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: 'İşleniyor', cls: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Ödendi', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
};

const NEXT_STATUS: PayoutStatus[] = ['pending', 'processing', 'paid', 'rejected'];

export function AdminFinance() {
  const { orders, fetchOrders } = useOrderStore();
  const { requests, updateRequestStatus } = usePayoutStore();

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const gmv = orders.reduce((sum, o) => sum + o.total, 0);
  const commissionRevenue = gmv * COMMISSION_RATE;
  const pendingPayouts = requests.filter((r) => r.status === 'pending' || r.status === 'processing').reduce((s, r) => s + r.amount, 0);
  const paidPayouts = requests.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0);

  const fmt = (n: number) => `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-accent rounded-[3rem] p-10 text-white shadow-2xl shadow-accent/20 relative overflow-hidden group">
          <TrendingUp size={120} className="absolute -bottom-8 -right-8 text-white/10 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4 italic">Komisyon Geliri (%{(COMMISSION_RATE * 100).toFixed(0)})</p>
          <h4 className="text-3xl font-display font-black tracking-tighter">{fmt(commissionRevenue)}</h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Toplam GMV</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-[#1A1033]">{fmt(gmv)}</h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Bekleyen Ödeme</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-amber-600">{fmt(pendingPayouts)}</h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Ödenen Toplam</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-green-600">{fmt(paidPayouts)}</h4>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><Wallet size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Satıcı Ödeme Talepleri</h3>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-16">
            <Banknote size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
            <p className="text-sm font-bold text-[#1A1033]/30 italic">Bekleyen ödeme talebi yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-primary/5 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">
                  <th className="px-6 py-5">Talep ID</th>
                  <th className="px-6 py-5">Tutar</th>
                  <th className="px-6 py-5">IBAN</th>
                  <th className="px-6 py-5">Tarih</th>
                  <th className="px-6 py-5 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/5">
                {requests.map((r) => (
                  <tr key={r.id} className="group hover:bg-brand-secondary/30 transition-colors">
                    <td className="px-6 py-6"><span className="font-mono font-black text-accent">{r.id}</span></td>
                    <td className="px-6 py-6 font-black text-[#1A1033]">{fmt(r.amount)}</td>
                    <td className="px-6 py-6 text-sm font-bold text-[#1A1033]/60 tracking-wider">{r.iban}</td>
                    <td className="px-6 py-6 text-sm text-[#1A1033]/40">{new Date(r.requestedAt).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-6 text-right">
                      <select
                        value={r.status}
                        onChange={(e) => updateRequestStatus(r.id, e.target.value as PayoutStatus)}
                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer border-none ${STATUS_META[r.status].cls}`}
                      >
                        {NEXT_STATUS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                      </select>
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
