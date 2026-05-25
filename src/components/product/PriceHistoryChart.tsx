import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getPriceHistory, PriceEntry } from '@/services/priceHistoryService';

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number;
  currency?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = { gbp: '£', try: '₺', usd: '$', eur: '€' };

export function PriceHistoryChart({ productId, currentPrice, currency }: PriceHistoryChartProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<PriceEntry[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getPriceHistory(productId)
      .then(data => {
        if (!cancelled) {
          setEntries(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [productId]);

  if (error) return null;

  const symbol = CURRENCY_SYMBOLS[currency?.toLowerCase() ?? ''] ?? (currency?.toUpperCase() ?? '');

  // Sort ascending by recordedAt (oldest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const minPrice = sortedEntries.length > 0 ? Math.min(...sortedEntries.map(e => e.price)) : null;
  const maxPrice = sortedEntries.length > 0 ? Math.max(...sortedEntries.map(e => e.price)) : null;
  const trend: 'up' | 'down' | 'stable' = sortedEntries.length >= 2
    ? sortedEntries[sortedEntries.length - 1].price > sortedEntries[0].price ? 'up'
    : sortedEntries[sortedEntries.length - 1].price < sortedEntries[0].price ? 'down'
    : 'stable'
    : 'stable';

  const chartData = sortedEntries.map(e => ({
    date: new Date(e.recordedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    price: e.price,
  }));

  return (
    <div className="border border-brand-primary/5 dark:border-white/5 rounded-2xl overflow-hidden">
      {/* Header row — always visible, click to toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-secondary/50 dark:hover:bg-zinc-800/50 transition-colors"
        aria-expanded={open}
        aria-label="Fiyat geçmişini göster"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary dark:text-white">Fiyat Geçmişi</span>
        </div>
        <ChevronDown size={14} className={`text-brand-primary/40 dark:text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Collapsible body — AnimatePresence */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {loading ? (
                /* Loading skeleton: 3 gray bars */
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-3 bg-brand-secondary dark:bg-zinc-800 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                /* Empty state */
                <div className="flex items-center gap-2 py-4 text-brand-primary/30 dark:text-zinc-600">
                  <TrendingUp size={14} />
                  <span className="text-xs font-bold">Fiyat geçmişi henüz mevcut değil</span>
                </div>
              ) : (
                <>
                  {/* Stats row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-accent text-white text-[9px] font-black rounded-lg">{symbol}{currentPrice.toFixed(2)}</span>
                    {minPrice !== null && <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[9px] font-black rounded-lg border border-green-200/50 dark:border-green-800/30">En Düşük {symbol}{minPrice.toFixed(2)}</span>}
                    {maxPrice !== null && <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[9px] font-black rounded-lg border border-red-200/50 dark:border-red-800/30">En Yüksek {symbol}{maxPrice.toFixed(2)}</span>}
                    {trend === 'down' && <span className="flex items-center gap-0.5 text-[9px] font-black text-green-500"><TrendingDown size={10} />Düşüyor</span>}
                    {trend === 'up' && <span className="flex items-center gap-0.5 text-[9px] font-black text-red-400"><TrendingUp size={10} />Artıyor</span>}
                  </div>

                  {/* Recharts AreaChart */}
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF5200" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF5200" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Fiyat']}
                        contentStyle={{ fontSize: 10, fontWeight: 700, borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="price" stroke="#FF5200" strokeWidth={2} fill="url(#priceGradient)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
