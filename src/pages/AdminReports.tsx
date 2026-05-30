import React, { useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, ShoppingBasket, Receipt } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useOrderStore, ExtendedOrder } from '@/store/useOrderStore';

const STATUS_LABELS: Record<ExtendedOrder['status'], string> = {
  pending: 'Beklemede',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<ExtendedOrder['status'], string> = {
  pending: '#F59E0B',
  processing: '#FB923C',
  shipped: '#3B82F6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

export function AdminReports() {
  const { orders, fetchOrders } = useOrderStore();
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const { gmv, aov, byMarket, byStatus } = useMemo(() => {
    const gmv = orders.reduce((s, o) => s + o.total, 0);
    const aov = orders.length > 0 ? gmv / orders.length : 0;

    const marketMap = new Map<string, number>();
    orders.forEach((o) => marketMap.set(o.market, (marketMap.get(o.market) || 0) + o.total));
    const byMarket = Array.from(marketMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const statusMap = new Map<ExtendedOrder['status'], number>();
    orders.forEach((o) => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1));
    const byStatus = Array.from(statusMap.entries()).map(([key, value]) => ({ name: STATUS_LABELS[key], value, color: STATUS_COLORS[key] }));

    return { gmv, aov, byMarket, byStatus };
  }, [orders]);

  const fmt = (n: number) => `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-accent rounded-[3rem] p-10 text-white shadow-2xl shadow-accent/20 relative overflow-hidden group">
          <TrendingUp size={120} className="absolute -bottom-8 -right-8 text-white/10 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4 italic">Toplam GMV</p>
          <h4 className="text-3xl font-display font-black tracking-tighter">{fmt(gmv)}</h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Sipariş Sayısı</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-[#1A1033] flex items-center gap-3">{orders.length} <ShoppingBasket size={26} className="text-[#1A1033]/20" /></h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Ortalama Sepet (AOV)</p>
          <h4 className="text-3xl font-display font-black tracking-tighter text-[#1A1033] flex items-center gap-3">{fmt(aov)} <Receipt size={26} className="text-[#1A1033]/20" /></h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><BarChart3 size={24} /></div>
            <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Pazara Göre Ciro</h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMarket}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1033" strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1A1033', opacity: 0.4, fontWeight: 800 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1A1033', opacity: 0.3, fontWeight: 800 }} tickFormatter={(v) => `₺${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1033', borderRadius: '16px', border: 'none' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" fill="#6D28D9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-10">Sipariş Durumu Dağılımı</h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} innerRadius={70} outerRadius={110} paddingAngle={6} dataKey="value" stroke="none">
                  {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1033', borderRadius: '16px', border: 'none' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4 justify-center">
            {byStatus.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
