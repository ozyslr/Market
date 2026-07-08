import React, { useState, useEffect, useMemo } from 'react';
import { getAllOrders } from '@/services/orderService';
import { Order } from '@/types/order';
import { TrendingUp, DollarSign, Percent, Loader2 } from 'lucide-react';

const DEFAULT_COMMISSION = 0.1;

type Period = '30' | '90' | 'all';

export function AdminFinance() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30');

  useEffect(() => {
    getAllOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (period === 'all') return orders;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(period));
    return orders.filter((o) => new Date(o.createdAt) >= cutoff);
  }, [orders, period]);

  const delivered = filtered.filter((o) => o.status === 'delivered');
  const gmv = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const commission = gmv * DEFAULT_COMMISSION;
  const sellerPayouts = gmv - commission;

  // Per-seller breakdown
  const bySellerMap = new Map<string, number>();
  delivered.forEach((o) => {
    o.items?.forEach((item: { sellerId?: string; price: number; quantity: number }) => {
      const sid = item.sellerId || 'unknown';
      bySellerMap.set(sid, (bySellerMap.get(sid) || 0) + item.price * item.quantity);
    });
  });
  const bySeller = Array.from(bySellerMap.entries())
    .map(([sellerId, amount]) => ({ sellerId, amount, commission: amount * DEFAULT_COMMISSION }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
          Finans Takibi
        </h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="bg-[#F8F8FA] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
        >
          <option value="30">Son 30 Gün</option>
          <option value="90">Son 90 Gün</option>
          <option value="all">Tümü</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: 'Brüt Satış Hacmi (GMV)',
            value: `${gmv.toLocaleString('tr-TR')} ₺`,
            icon: TrendingUp,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            label: 'Komisyon Geliri (%10)',
            value: `${commission.toLocaleString('tr-TR')} ₺`,
            icon: Percent,
            color: 'text-accent',
            bg: 'bg-accent/10',
          },
          {
            label: 'Satıcı Ödemesi',
            value: `${sellerPayouts.toLocaleString('tr-TR')} ₺`,
            icon: DollarSign,
            color: 'text-green-500',
            bg: 'bg-green-50',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#F8F8FA] rounded-2xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mb-0.5">
                {label}
              </p>
              <p className="text-xl font-black text-brand-primary">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {bySeller.length > 0 && (
        <div>
          <h4 className="text-sm font-black uppercase text-brand-primary/40 tracking-widest mb-4">
            Satıcı Bazında Dökümü (İlk 10)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F8F8FA]">
                  <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                    Satıcı ID
                  </th>
                  <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                    Satış
                  </th>
                  <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                    Komisyon
                  </th>
                  <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody>
                {bySeller.map((row) => (
                  <tr
                    key={row.sellerId}
                    className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50"
                  >
                    <td className="py-3 font-bold text-brand-primary text-xs">
                      {row.sellerId.slice(0, 12)}...
                    </td>
                    <td className="py-3 text-end text-xs font-bold">
                      {row.amount.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-3 text-end text-xs text-accent font-bold">
                      {row.commission.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-3 text-end text-xs font-bold text-green-600">
                      {(row.amount - row.commission).toLocaleString('tr-TR')} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {delivered.length === 0 && (
        <p className="text-center py-8 text-brand-primary/30 font-bold">
          Bu dönem için teslim edilmiş sipariş yok
        </p>
      )}
    </div>
  );
}
