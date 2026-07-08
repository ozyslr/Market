import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, UserPlus, Award, Zap, Truck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSellerStarSummary, type SellerStarSummary } from '@/services/sellerRatingService';
import { SellerRatingSummary } from './RatingSummary';

interface SellerCardProps {
  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  sellerFollowersCount?: number;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  onAskQuestion?: () => void;
  responseRate?: number;
  onTimeShipping?: number;
}

export function SellerCard({
  sellerId,
  sellerName,
  sellerRating = 4.8,
  sellerReviewCount = 0,
  sellerFollowersCount,
  isFollowing = false,
  onToggleFollow,
  onAskQuestion,
  responseRate,
  onTimeShipping,
}: SellerCardProps) {
  // REV-03: aggregate the seller's approved reviews across all their products.
  const [starSummary, setStarSummary] = useState<SellerStarSummary | null>(null);

  useEffect(() => {
    let active = true;
    getSellerStarSummary(sellerId)
      .then((s) => {
        if (active) setStarSummary(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [sellerId]);

  return (
    <div className="py-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">
        Satıcı
      </p>
      <div className="flex items-center gap-3">
        <Link to={`/seller/${sellerId}`} className="shrink-0">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent text-sm uppercase shrink-0 hover:bg-accent/20 transition-colors">
            {sellerName.charAt(0)}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/seller/${sellerId}`} className="hover:text-accent transition-colors">
            <p className="text-sm font-black text-brand-primary truncate">{sellerName}</p>
          </Link>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} fill="#FBBF24" className="text-yellow-400" />
            <span className="text-[10px] font-bold text-brand-primary/60">
              {sellerRating.toFixed(1)}
            </span>
            {sellerReviewCount > 0 && (
              <span className="text-[10px] text-brand-primary/30">({sellerReviewCount})</span>
            )}
            {sellerFollowersCount !== undefined && (
              <span className="text-[10px] text-brand-primary/30 flex items-center gap-0.5 ms-1">
                <Users size={10} /> {sellerFollowersCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Premium badge */}
      {(sellerRating ?? 0) >= 4.5 && (
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 border border-yellow-400/20 rounded-full w-fit"
          aria-label="Premium satıcı rozeti"
        >
          <Award size={10} aria-hidden="true" />
          <span className="text-[9px] font-black uppercase tracking-widest">Premium Satıcı</span>
        </div>
      )}

      {/* Trust metrics row */}
      {(responseRate !== undefined || onTimeShipping !== undefined) && (
        <div className="flex flex-wrap gap-2">
          {responseRate !== undefined && responseRate >= 90 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-[9px] font-black">
              <Zap size={9} aria-hidden="true" />
              Hızlı Cevap
            </div>
          )}
          {onTimeShipping !== undefined && onTimeShipping >= 95 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-[9px] font-black">
              <Truck size={9} aria-hidden="true" />
              Zamanında Kargo
            </div>
          )}
        </div>
      )}

      {/* Seller rating summary — aggregated approved reviews (REV-03) */}
      {starSummary && starSummary.total > 0 && (
        <div className="pt-1">
          <SellerRatingSummary summary={starSummary} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Link
          to={`/seller/${sellerId}`}
          aria-label={`${sellerName} satıcı sayfasına git`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-brand-primary/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-primary hover:border-accent hover:text-accent transition-all"
        >
          Satıcıya Git <ChevronRight size={12} />
        </Link>
        {onAskQuestion && (
          <button
            type="button"
            onClick={onAskQuestion}
            aria-label="Satıcıya soru sor"
            className="flex items-center gap-1.5 px-3 py-2 border border-brand-primary/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-primary/60 hover:border-accent hover:text-accent transition-all"
          >
            Satıcıya Sor
          </button>
        )}
        {onToggleFollow && (
          <button
            onClick={onToggleFollow}
            aria-label={isFollowing ? 'Satıcıyı takipten çık' : 'Satıcıyı takip et'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border',
              isFollowing
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'border-brand-primary/10 text-brand-primary/50 hover:border-accent hover:text-accent',
            )}
          >
            <UserPlus size={12} />
            {isFollowing ? 'Takipte' : 'Takip Et'}
          </button>
        )}
      </div>
    </div>
  );
}
