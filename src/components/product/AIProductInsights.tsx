import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { generateProductInsights, ProductInsights } from '@/services/aiContentService';

interface AIProductInsightsProps {
  productTitle: string;
  description: string;
  specs?: Record<string, string>;
}

// On demand only: generating on every product view cost a Gemini call per visit and quickly hit
// the per-user rate limit (15 min / 30 requests).
export function AIProductInsights({ productTitle, description, specs }: AIProductInsightsProps) {
  const [insights, setInsights] = useState<ProductInsights | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const currentTitle = useRef(productTitle);

  // Another product: forget the previous summary.
  useEffect(() => {
    currentTitle.current = productTitle;
    setInsights(null);
    setState('idle');
  }, [productTitle]);

  const generate = async () => {
    const askedFor = productTitle;
    setState('loading');
    try {
      const result = await generateProductInsights(productTitle, description, specs);
      // The user moved to another product while Gemini was answering: drop the old summary.
      if (currentTitle.current !== askedFor) return;
      if (result) {
        setInsights(result);
        setState('idle');
      } else {
        setState('error');
      }
    } catch {
      if (currentTitle.current === askedFor) setState('error');
    }
  };

  if (!insights) {
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-brand-secondary/50 dark:bg-zinc-900 rounded-xl border border-brand-primary/5 dark:border-white/5">
        <button
          type="button"
          onClick={generate}
          disabled={state === 'loading'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 disabled:opacity-50"
        >
          {state === 'loading' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {state === 'loading' ? 'Özet hazırlanıyor…' : 'Yapay zekâ ile ürün özeti'}
        </button>
        {state === 'error' && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-primary/40 dark:text-zinc-500">
            <Info size={14} /> Özet şu an oluşturulamadı.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent rounded-full border border-accent/20 w-fit">
        <Sparkles size={10} aria-hidden="true" />
        <span className="text-[9px] font-black uppercase tracking-widest">
          Yapay Zeka ile Üretildi
        </span>
      </div>

      <p className="text-sm text-brand-primary/80 dark:text-zinc-300 leading-relaxed font-medium">
        {insights.summary}
      </p>

      {(insights.pros ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 dark:text-zinc-400">
            Avantajlar
          </h3>
          <ul className="space-y-1.5" aria-label="Ürün avantajları">
            {(insights.pros ?? []).map((pro, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2
                  size={13}
                  className="text-green-500 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-brand-primary/80 dark:text-zinc-300">
                  {pro}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(insights.cons ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 dark:text-zinc-400">
            Dezavantajlar
          </h3>
          <ul className="space-y-1.5" aria-label="Ürün dezavantajları">
            {(insights.cons ?? []).map((con, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle
                  size={13}
                  className="text-orange-400 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-brand-primary/80 dark:text-zinc-300">
                  {con}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
