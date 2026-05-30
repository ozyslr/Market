import React, { useEffect, useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useProductStore } from '@/store/useProductStore';

export function AdminAI() {
  const { orders, fetchOrders } = useOrderStore();
  const { products, fetchProducts } = useProductStore();

  useEffect(() => { fetchOrders(); fetchProducts(); }, [fetchOrders, fetchProducts]);

  const insights = useMemo(() => {
    const gmv = orders.reduce((s, o) => s + o.total, 0);
    const aov = orders.length > 0 ? gmv / orders.length : 0;

    const marketMap = new Map<string, number>();
    orders.forEach((o) => marketMap.set(o.market, (marketMap.get(o.market) || 0) + o.total));
    const topMarket = Array.from(marketMap.entries()).sort((a, b) => b[1] - a[1])[0];

    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const cancelRate = orders.length > 0 ? (cancelled / orders.length) * 100 : 0;

    return { gmv, aov, topMarket, cancelRate, productCount: products.length };
  }, [orders, products]);

  const fmt = (n: number) => `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;

  const cards = [
    {
      icon: Target,
      label: 'En Güçlü Pazar',
      title: insights.topMarket ? insights.topMarket[0] : '—',
      desc: insights.topMarket ? `${insights.topMarket[0]} pazarı ${fmt(insights.topMarket[1])} ciroyla lider. Bu bölgeye reklam bütçesi artırılabilir.` : 'Yeterli sipariş verisi yok.',
      color: 'text-accent',
    },
    {
      icon: TrendingUp,
      label: 'Sepet Optimizasyonu',
      title: fmt(insights.aov),
      desc: `Ortalama sepet tutarı ${fmt(insights.aov)}. Çapraz satış önerileriyle %10-15 artış hedeflenebilir.`,
      color: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      label: 'İptal Risk Analizi',
      title: `%${insights.cancelRate.toFixed(1)}`,
      desc: insights.cancelRate > 10
        ? 'İptal oranı yüksek. Kargo süreleri ve stok doğruluğu gözden geçirilmeli.'
        : 'İptal oranı sağlıklı seviyede. Mevcut operasyon korunmalı.',
      color: insights.cancelRate > 10 ? 'text-red-600' : 'text-blue-600',
    },
    {
      icon: Lightbulb,
      label: 'Katalog Önerisi',
      title: `${insights.productCount} Ürün`,
      desc: `Katalogda ${insights.productCount} ürün var. Yapay zeka destekli açıklama ve SEO ile görünürlük artırılabilir.`,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="bg-[#1A1033] rounded-[3.5rem] p-12 text-white relative overflow-hidden">
        <Sparkles size={220} className="absolute -bottom-16 -right-16 text-white/5" />
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center"><Sparkles size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter">Yapay Zeka Analizi</h3>
        </div>
        <p className="text-white/50 text-sm font-medium italic max-w-2xl relative z-10">Mercora AI, gerçek satış verilerinizi analiz ederek aksiyona dönük öneriler üretir. Aşağıdaki içgörüler canlı sipariş ve katalog verisinden hesaplanmıştır.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 rounded-2xl bg-[#F8F8FA] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c.color}`}>
              <c.icon size={26} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/20 mb-2 italic">{c.label}</p>
            <h4 className="text-2xl font-display font-black uppercase tracking-tight text-[#1A1033] mb-4">{c.title}</h4>
            <p className="text-[13px] font-medium text-[#1A1033]/40 italic leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
