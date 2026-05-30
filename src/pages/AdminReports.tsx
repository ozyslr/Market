import React, { useState, useEffect } from 'react';
import { Loader2, Download, TrendingUp, ShoppingBag, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { getAllOrders as getOrders } from '@/services/orderService';
import { Order } from '@/types/order';

export function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    getOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    if (period === 'all') return true;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return new Date(o.createdAt) >= new Date(Date.now() - days * 86400000);
  });

  const gmv = filtered.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avg = filtered.length ? gmv / filtered.length : 0;
  const deliveredRate = filtered.length
    ? (filtered.filter(o => o.status === 'delivered').length / filtered.length) * 100
    : 0;
  const cancelRate = filtered.length
    ? (filtered.filter(o => o.status === 'cancelled').length / filtered.length) * 100
    : 0;

  function exportCSV() {
    const rows = [
      ['Sipariş ID', 'Tarih', 'Alıcı ID', 'Tutar', 'Durum'],
      ...filtered.map(o => [
        o.id,
        new Date(o.createdAt).toLocaleDateString('tr-TR'),
        o.buyerId,
        (o.totalAmount || 0).toFixed(2),
        o.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapor-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const KPIS = [
    { label: 'Toplam Sipariş', value: String(filtered.length), icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'Toplam GMV', value: `${gmv.toLocaleString('tr-TR')} ₺`, icon: DollarSign, color: 'text-accent' },
    { label: 'Ort. Sipariş Değeri', value: `${avg.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Teslim Oranı', value: `${deliveredRate.toFixed(1)}%`, icon: CheckCircle, color: 'text-green-600' },
    { label: 'İptal Oranı', value: `${cancelRate.toFixed(1)}%`, icon: XCircle, color: 'text-red-500' },
  ];

  const statusColor = (status: string) => {
    if (status === 'delivered') return 'bg-green-100 text-green-700';
    if (status === 'cancelled') return 'bg-red-100 text-red-600';
    if (status === 'shipped') return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-display font-black uppercase italic tracking-tight text-[#1A1033]">Satış Raporları</h2>
        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
                period === p ? 'bg-accent text-white' : 'bg-[#F8F8FA] text-[#1A1033]/60 hover:bg-accent/10'
              }`}
            >
              {p === '7d' ? '7 Gün' : p === '30d' ? '30 Gün' : p === '90d' ? '90 Gün' : 'Tümü'}
            </button>
          ))}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1033] text-white rounded-xl text-xs font-black hover:bg-accent transition-colors"
          >
            <Download size={12} /> CSV İndir
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {KPIS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-[#F8F8FA] shadow-sm">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="text-[10px] font-black uppercase text-[#1A1033]/40 mb-1">{label}</p>
            <p className="text-lg font-black text-[#1A1033]">{value}</p>
          </div>
        ))}
      </div>

      {/* Sipariş Tablosu */}
      <div className="bg-white rounded-3xl border border-[#F8F8FA] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F8F8FA]">
          <p className="text-xs font-black uppercase text-[#1A1033]/40">
            Son Siparişler ({filtered.length} toplam)
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#1A1033]/30 font-bold text-sm">Bu dönemde sipariş bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F8F8FA]">
                  {['Sipariş ID', 'Tarih', 'Alıcı', 'Tutar', 'Durum'].map(h => (
                    <th key={h} className="text-start p-3 font-black text-[#1A1033]/40 uppercase text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map(o => (
                  <tr key={o.id} className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50">
                    <td className="p-3 font-mono text-[10px] text-accent">#{o.id.slice(-8).toUpperCase()}</td>
                    <td className="p-3 text-[#1A1033]/60">{new Date(o.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td className="p-3 text-[#1A1033]/60 max-w-[120px] truncate">{o.buyerId}</td>
                    <td className="p-3 font-bold text-[#1A1033]">{(o.totalAmount || 0).toLocaleString('tr-TR')} ₺</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusColor(o.status)}`}>
                        {o.status}
                      </span>
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
