import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Loader2, Zap,
  ArrowUp, ArrowDown, Minus, ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getProducts } from '@/services/productService';
import { analyzeProductBatch, getCategoryBenchmarks, ProductPriceAnalysis, PriceAnalysisSummary } from '@/services/priceAnalysisService';
import type { Product } from '@/types';

const POSITION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  lowest:        { label: 'En Düşük',      color: 'text-green-600 bg-green-50',   icon: ArrowDown },
  below_average: { label: 'Ort. Altı',     color: 'text-blue-600 bg-blue-50',     icon: TrendingDown },
  average:       { label: 'Ortalama',      color: 'text-amber-600 bg-amber-50',   icon: Minus },
  above_average: { label: 'Ort. Üstü',     color: 'text-orange-600 bg-orange-50', icon: TrendingUp },
  highest:       { label: 'En Yüksek',     color: 'text-red-600 bg-red-50',       icon: ArrowUp },
};

export function SellerPriceAnalysis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<ProductPriceAnalysis[]>([]);
  const [summary, setSummary] = useState<PriceAnalysisSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    getProducts({ sellerId: user.id, includeNonApproved: false }).then(products => {
      const batch = analyzeProductBatch(
        products.map(p => ({
          id: p.id, name: p.title, image: p.images?.[0] || '',
          category: (p as any).categoryId || 'Genel', price: p.price,
        }))
      );
      setAnalyses(batch.analyses);
      setSummary(batch.summary);
      setLoading(false);
    });
  }, [user]);

  const categories = useMemo(() => [...new Set(analyses.map(a => a.category))], [analyses]);
  const filtered = selectedCategory === 'all' ? analyses : analyses.filter(a => a.category === selectedCategory);

  if (loading) return (
    <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
  );

  if (!summary) return (
    <div className="text-center py-24"><p className="text-sm font-bold text-[#1A1033]/30">Analiz edilecek ürün yok</p></div>
  );

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
              Rakip Fiyat Analizi
            </h1>
            <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mt-1">
              Trendyol · Hepsiburada · Amazon TR · N11 karşılaştırması
            </p>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Analiz Edilen', value: summary.analyzedProducts, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'En Ucuz', value: summary.cheapest, icon: Target, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Ort. Altı', value: summary.belowMarket, icon: TrendingDown, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Ort. Üstü', value: summary.aboveMarket, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Rekabet Puanı', value: `${summary.avgCompetitiveness}/100`, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-5 border border-[#1A1033]/5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40">{stat.label}</p>
              <p className="text-xl font-display font-black text-[#1A1033]">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Estimated Impact Banner */}
        {summary.estimatedMonthlyImpact !== 0 && (
          <div className={cn(
            "rounded-2xl p-6 flex items-center gap-4",
            summary.estimatedMonthlyImpact > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          )}>
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
              summary.estimatedMonthlyImpact > 0 ? "bg-green-500" : "bg-red-500")}>
              <DollarSign size={28} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1A1033]">
                {summary.estimatedMonthlyImpact > 0
                  ? `Fiyat optimizasyonu ile aylık +${summary.estimatedMonthlyImpact.toFixed(0)} ₺ potansiyel kazanç`
                  : `Fiyatlarınız piyasa ortalamasının üzerinde — ${Math.abs(summary.estimatedMonthlyImpact).toFixed(0)} ₺ kayıp riski`}
              </p>
              <p className="text-[10px] text-[#1A1033]/50 mt-0.5">30 adet/ay satış varsayımı ile hesaplanmıştır</p>
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory('all')}
              className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                selectedCategory === 'all' ? 'bg-[#1A1033] text-white' : 'bg-white text-[#1A1033]/40 border border-[#1A1033]/5')}>
              Tümü
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  selectedCategory === cat ? 'bg-[#1A1033] text-white' : 'bg-white text-[#1A1033]/40 border border-[#1A1033]/5')}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Product Analysis Table */}
        <div className="bg-white rounded-[2rem] border border-[#1A1033]/5 overflow-hidden">
          <div className="p-6 border-b border-[#1A1033]/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/60">Ürün Bazlı Analiz</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="bg-[#F8F8FA] text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                  <th className="px-6 py-4">Ürün</th>
                  <th className="px-6 py-4">Senin Fiyatın</th>
                  <th className="px-6 py-4">Piyasa Ort.</th>
                  <th className="px-6 py-4">En Düşük</th>
                  <th className="px-6 py-4">En Yüksek</th>
                  <th className="px-6 py-4">Konum</th>
                  <th className="px-6 py-4">Önerilen</th>
                  <th className="px-6 py-4">Etki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F8FA]">
                {filtered.map(a => {
                  const pos = POSITION_CONFIG[a.position];
                  const PosIcon = pos.icon;
                  return (
                    <tr key={a.productId} className="hover:bg-[#F8F8FA]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {a.productImage && (
                            <img src={a.productImage} alt={a.productName} className="w-10 h-10 rounded-xl object-contain bg-[#F8F8FA] p-1" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-[#1A1033] line-clamp-1 max-w-[200px]">{a.productName}</p>
                            <p className="text-[9px] text-[#1A1033]/40">{a.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-[#1A1033]">{a.yourPrice.toFixed(2)} ₺</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#1A1033]/60">{a.marketAverage.toFixed(2)} ₺</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-green-600">{a.marketLow.toFixed(2)} ₺</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-red-500">{a.marketHigh.toFixed(2)} ₺</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase', pos.color)}>
                          <PosIcon size={10} /> {pos.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-accent">{a.recommendedPrice.toFixed(2)} ₺</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-xs font-bold', a.potentialImpact > 0 ? 'text-green-600' : a.potentialImpact < -50 ? 'text-red-500' : 'text-[#1A1033]/40')}>
                          {a.potentialImpact > 0 ? '+' : ''}{a.potentialImpact.toFixed(0)} ₺/ay
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitor Detail (expandable row preview) */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-[#1A1033]/5 p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/60 mb-4">Rakip Platform Detayı</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Trendyol', 'Hepsiburada', 'AmazonTR', 'N11'] as const).map(platform => {
                const platformPrices = filtered.flatMap(a => a.competitors.filter(c => c.platform === platform));
                const avgPrice = platformPrices.length > 0
                  ? platformPrices.reduce((s, c) => s + c.price, 0) / platformPrices.length
                  : 0;
                const cheaperCount = platformPrices.filter(c => {
                  const analysis = filtered.find(a => a.competitors.includes(c));
                  return analysis && c.price < analysis.yourPrice;
                }).length;
                return (
                  <div key={platform} className="bg-[#F8F8FA] rounded-2xl p-4">
                    <p className="text-[10px] font-black text-[#1A1033] mb-2">{platform}</p>
                    <p className="text-lg font-display font-black text-[#1A1033]">{avgPrice.toFixed(2)} ₺</p>
                    <p className="text-[9px] text-[#1A1033]/40 mt-0.5">Ortalama fiyat</p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className={cn('text-[9px] font-bold', cheaperCount > filtered.length / 2 ? 'text-red-500' : 'text-green-500')}>
                        {cheaperCount} üründe senden ucuz
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
