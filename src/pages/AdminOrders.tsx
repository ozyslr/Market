import React, { useEffect, useState } from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import { useOrderStore, ExtendedOrder } from '@/store/useOrderStore';

type OrderStatus = ExtendedOrder['status'];

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'Beklemede', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: 'Hazırlanıyor', cls: 'bg-orange-100 text-orange-700' },
  shipped: { label: 'Kargoda', cls: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Teslim Edildi', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal', cls: 'bg-red-100 text-red-700' },
};

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function AdminOrders() {
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore();
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [query, setQuery] = useState('');

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const matchStatus = filter === 'all' || o.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || o.id.toLowerCase().includes(q) || o.buyerName.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col min-h-[500px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><ShoppingBag size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Sipariş Merkezi</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1033]/20" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID veya müşteri ara..." className="pl-11 pr-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none w-full lg:w-72" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {(['all', ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-[#1A1033] text-white' : 'bg-[#F8F8FA] text-[#1A1033]/40 hover:text-[#1A1033]'}`}>
            {s === 'all' ? `Tümü (${orders.length})` : STATUS_META[s].label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-primary/5 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">
              <th className="px-6 py-5">Sipariş ID</th>
              <th className="px-6 py-5">Müşteri</th>
              <th className="px-6 py-5">Tutar</th>
              <th className="px-6 py-5">Pazar</th>
              <th className="px-6 py-5">Tarih</th>
              <th className="px-6 py-5 text-right">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/5">
            {filtered.map((o) => (
              <tr key={o.id} className="group hover:bg-brand-secondary/30 transition-colors">
                <td className="px-6 py-6"><span className="font-mono font-black text-accent">{o.id}</span></td>
                <td className="px-6 py-6 font-bold text-sm text-[#1A1033]">{o.buyerName}</td>
                <td className="px-6 py-6 font-black text-[#1A1033]">{o.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                <td className="px-6 py-6 text-sm font-bold text-[#1A1033]/40">{o.market}</td>
                <td className="px-6 py-6 text-sm text-[#1A1033]/40">{new Date(o.createdAt).toLocaleDateString('tr-TR')}</td>
                <td className="px-6 py-6 text-right">
                  <select
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer border-none ${STATUS_META[o.status].cls}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#1A1033]/40 text-sm font-bold">Sipariş bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
