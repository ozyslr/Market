import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
  generateProductInsights,
  ProductInsights,
} from '@/services/aiContentService';

interface AIProductInsightsProps {
  productTitle: string;
  description: string;
  specs?: Record<string, string>;
}

export function AIProductInsights({ productTitle, description, specs }: AIProductInsightsProps) {
  const [insights, setInsights] = useState<ProductInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    generateProductInsights(productTitle, description, specs)
      .then(result => {
        if (cancelled) return;
        if (result === null) {
          setError(true);
        } else {
          setInsights(result);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [productTitle, description, specs]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-white/5 p-6 space-y-3">
        <div className="h-3 bg-brand-secondary dark:bg-zinc-800 rounded animate-pulse w-1/3" />
        <div className="h-3 bg-brand-secondary dark:bg-zinc-800 rounded animate-pulse w-full" />
        <div className="h-3 bg-brand-secondary dark:bg-zinc-800 rounded animate-pulse w-5/6" />
        <div className="h-3 bg-brand-secondary dark:bg-zinc-800 rounded animate-pulse w-4/6" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-brand-secondary/50 dark:bg-zinc-900 rounded-xl border border-brand-primary/5 dark:border-white/5">
        <Info size={14} className="text-brand-primary/30 dark:text-zinc-600 shrink-0" />
        <span className="text-xs font-bold text-brand-primary/40 dark:text-zinc-500">AI içgörüleri yüklenemedi</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 space-y-4">
      {/* Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent rounded-full border border-accent/20 w-fit">
        <Sparkles size={10} aria-hidden="true" />
        <span className="text-[9px] font-black uppercase tracking-widest">Yapay Zeka ile Üretildi</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-brand-primary/80 dark:text-zinc-300 leading-relaxed font-medium">
        {insights.summary}
      </p>

      {/* Pros */}
      {(insights.pros ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 dark:text-zinc-400">Avantajlar</h3>
          <ul className="space-y-1.5" aria-label="Ürün avantajları">
            {(insights.pros ?? []).map((pro, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium text-brand-primary/80 dark:text-zinc-300">{pro}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cons */}
      {(insights.cons ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 dark:text-zinc-400">Dezavantajlar</h3>
          <ul className="space-y-1.5" aria-label="Ürün dezavantajları">
            {(insights.cons ?? []).map((con, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle size={13} className="text-orange-400 mt-0.5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium text-brand-primary/80 dark:text-zinc-300">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
