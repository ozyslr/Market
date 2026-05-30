import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { ReviewStats } from '@/services/reviewService';
import { Review } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  rating: number;
  stats: ReviewStats;
  activeStarFilter: number | null;
  onStarFilter: (star: number | null) => void;
  reviews: Review[];
  onScrollToReviews?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  quality: 'Ürün Kalitesi',
  shipping: 'Kargo Hızı',
  description: 'Açıklamaya Uygunluk',
};

export function RatingSummary({ rating, stats, activeStarFilter, onStarFilter, reviews, onScrollToReviews }: Props) {
  const hasCategories = Object.values(stats.avgCategoryRatings).some(v => v > 0);
  const [selectedPhotoReview, setSelectedPhotoReview] = useState<{ review: Review; photo: string } | null>(null);

  const reviewsWithPhotos = reviews.filter(r => r.photos && r.photos.length > 0);
  const totalPhotosCount = reviewsWithPhotos.reduce((acc, r) => acc + (r.photos?.length || 0), 0);

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-brand-primary/5">
      {/* Sol: Genel skor + kategori puanları */}
      <div className="flex flex-col items-center md:items-start gap-3">
        <button
          onClick={onScrollToReviews}
          className="text-7xl font-display font-black text-brand-primary italic leading-none dark:text-white hover:opacity-75 transition-opacity"
        >
          {rating.toFixed(1)}
        </button>
        <button
          onClick={onScrollToReviews}
          className="flex items-center gap-1 hover:scale-110 transition-transform cursor-pointer"
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const fillAmount = Math.max(0, Math.min(1, rating - i));
            return (
              <div key={i} className="relative w-5 h-5">
                <Star size={20} className="absolute text-yellow-200 dark:text-yellow-700" />
                <div className="absolute overflow-hidden h-5" style={{ width: `${fillAmount * 100}%` }}>
                  <Star size={20} fill="#FBBF24" className="text-yellow-400" />
                </div>
              </div>
            );
          })}
        </button>
        <button
          onClick={onScrollToReviews}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/40 dark:text-zinc-500 hover:text-brand-primary dark:hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {stats.total} değerlendirme
        </button>

        {hasCategories && (
          <div className="w-full space-y-2 mt-2">
            {Object.entries(stats.avgCategoryRatings).map(([key, val]) =>
              val > 0 ? (
                <div key={key}>
                  <div className="flex justify-between text-[10px] font-bold text-brand-primary/50 dark:text-zinc-400 mb-1">
                    <span>{CATEGORY_LABELS[key] ?? key}</span>
                    <span>{val.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-brand-secondary dark:bg-zinc-800 rounded-full">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
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
      <div className="md:col-span-2 space-y-2 self-center w-full">
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
                isActive ? 'bg-accent/10' : 'hover:bg-brand-secondary/50 dark:hover:bg-zinc-800/50',
              )}
            >
              <span className="text-[10px] font-black w-4 text-brand-primary/60 dark:text-zinc-400 text-end">{star}</span>
              <Star size={11} fill="#FBBF24" className="text-yellow-400 shrink-0" />
              <div className="flex-1 h-2.5 bg-brand-secondary dark:bg-zinc-800 rounded-full overflow-hidden border border-brand-primary/5 dark:border-white/5">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold w-8 text-brand-primary/40 dark:text-zinc-500 text-end">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Alt: Yorum Fotoğrafları Şeridi */}
      {reviewsWithPhotos.length > 0 && (
        <div className="md:col-span-3 border-t border-brand-primary/5 dark:border-white/5 pt-6 mt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-zinc-500 mb-3">
            Müşteri Fotoğrafları ({totalPhotosCount})
          </p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {reviewsWithPhotos.map(r =>
              r.photos?.map((photo, index) => (
                <button
                  key={`${r.id}-${index}`}
                  onClick={() => setSelectedPhotoReview({ review: r, photo })}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-brand-primary/5 dark:border-white/5 hover:border-accent transition-all shrink-0 hover:scale-105"
                >
                  <img src={photo} className="w-full h-full object-cover" alt="Review media" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Yorum Fotoğrafı Lightbox Görünümü */}
      {selectedPhotoReview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={() => setSelectedPhotoReview(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden max-w-4xl w-full flex flex-col md:flex-row shadow-2xl relative border border-brand-primary/5 dark:border-white/5"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 end-4 z-10 w-10 h-10 bg-black/10 hover:bg-black/20 text-brand-primary dark:text-white rounded-full flex items-center justify-center transition-colors"
              onClick={() => setSelectedPhotoReview(null)}
            >
              <X size={18} />
            </button>
            {/* Sol Taraf: Görsel */}
            <div className="md:w-1/2 bg-black flex items-center justify-center min-h-[300px] max-h-[60vh]">
              <img src={selectedPhotoReview.photo} className="max-w-full max-h-full object-contain" alt="" />
            </div>
            {/* Sağ Taraf: Detaylar */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center font-black text-accent uppercase text-sm shrink-0">
                    {selectedPhotoReview.review.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-brand-primary dark:text-white">{selectedPhotoReview.review.userName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          fill={i < selectedPhotoReview.review.rating ? '#FF5200' : 'none'}
                          className={i < selectedPhotoReview.review.rating ? 'text-accent' : 'text-brand-primary/10 dark:text-white/10'}
                        />
                      ))}
                      <span className="text-[10px] text-brand-primary/30 dark:text-zinc-500 ms-2">
                        {selectedPhotoReview.review.createdAt.split('T')[0]}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-brand-primary/70 dark:text-zinc-300 leading-relaxed font-medium">
                  {selectedPhotoReview.review.comment}
                </p>
              </div>
              {selectedPhotoReview.review.verified && (
                <div className="mt-4 flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/30 w-fit">
                  <CheckCircle2 size={11} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Onaylı Alıcı</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CompactRatingProps {
  rating: number;
  reviewsCount: number;
  onScrollToReviews?: () => void;
}

export function CompactRating({ rating, reviewsCount, onScrollToReviews }: CompactRatingProps) {
  const Wrapper = onScrollToReviews ? 'button' : 'div';
  return (
    <Wrapper
      {...(onScrollToReviews ? { onClick: onScrollToReviews } : {})}
      className={`flex items-center gap-2 transition-opacity${onScrollToReviews ? ' hover:opacity-75 cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <div key={i} className="relative w-4 h-4">
              <Star size={16} className="absolute text-yellow-200 dark:text-yellow-700" />
              <div className="absolute overflow-hidden h-4" style={{ width: `${fill * 100}%` }}>
                <Star size={16} fill="#FBBF24" className="text-yellow-400" />
              </div>
            </div>
          );
        })}
      </div>
      <span className="text-sm font-black text-brand-primary">{rating.toFixed(1)}</span>
      <span className="text-xs text-brand-primary/40 underline decoration-dotted">
        {reviewsCount} değerlendirme
      </span>
    </Wrapper>
  );
}
