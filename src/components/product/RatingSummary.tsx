import React from 'react';
import { Star } from 'lucide-react';
import { ReviewStats } from '@/services/reviewService';
import { cn } from '@/lib/utils';

interface Props {
  rating: number;
  stats: ReviewStats;
  activeStarFilter: number | null;
  onStarFilter: (star: number | null) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  quality: 'Ürün Kalitesi',
  shipping: 'Kargo Hızı',
  description: 'Açıklamaya Uygunluk',
};

export function RatingSummary({ rating, stats, activeStarFilter, onStarFilter }: Props) {
  const hasCategories = Object.values(stats.avgCategoryRatings).some(v => v > 0);

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-brand-primary/5">
      {/* Sol: Genel skor + kategori puanları */}
      <div className="flex flex-col items-center md:items-start gap-3">
        <span className="text-7xl font-display font-black text-brand-primary italic leading-none">
          {rating.toFixed(1)}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={20}
              fill={i < Math.round(rating) ? '#FF5200' : 'none'}
              className={i < Math.round(rating) ? 'text-accent' : 'text-brand-primary/10'}
            />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/40">
          {stats.total} değerlendirme
        </span>

        {hasCategories && (
          <div className="w-full space-y-2 mt-2">
            {Object.entries(stats.avgCategoryRatings).map(([key, val]) =>
              val > 0 ? (
                <div key={key}>
                  <div className="flex justify-between text-[10px] font-bold text-brand-primary/50 mb-1">
                    <span>{CATEGORY_LABELS[key] ?? key}</span>
                    <span>{val.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-brand-secondary rounded-full">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>

      {/* Sağ: Yıldız dağılımı */}
      <div className="md:col-span-2 space-y-2 self-center">
        {[5, 4, 3, 2, 1].map(star => {
          const count = stats.distribution[star] || 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          const isActive = activeStarFilter === star;
          return (
            <button
              key={star}
              onClick={() => onStarFilter(isActive ? null : star)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors',
                isActive ? 'bg-accent/10' : 'hover:bg-brand-secondary/50',
              )}
            >
              <span className="text-[10px] font-black w-4 text-brand-primary/60 text-right">{star}</span>
              <Star size={11} fill="#FF5200" className="text-accent shrink-0" />
              <div className="flex-1 h-2.5 bg-brand-secondary rounded-full overflow-hidden border border-brand-primary/5">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold w-8 text-brand-primary/40 text-right">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
