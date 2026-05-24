import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellerCardProps {
  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

export function SellerCard({
  sellerId,
  sellerName,
  sellerRating = 4.8,
  sellerReviewCount = 0,
  isFollowing = false,
  onToggleFollow,
}: SellerCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">Satıcı</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent text-sm uppercase shrink-0">
          {sellerName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-brand-primary truncate">{sellerName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} fill="#FBBF24" className="text-yellow-400" />
            <span className="text-[10px] font-bold text-brand-primary/60">{sellerRating.toFixed(1)}</span>
            {sellerReviewCount > 0 && (
              <span className="text-[10px] text-brand-primary/30">({sellerReviewCount})</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/seller/${sellerId}`}
          aria-label={`${sellerName} satıcı sayfasına git`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brand-primary/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-primary hover:border-accent hover:text-accent transition-all"
        >
          Satıcıya Git <ChevronRight size={12} />
        </Link>
        {onToggleFollow && (
          <button
            onClick={onToggleFollow}
            aria-label={isFollowing ? 'Satıcıyı takipten çık' : 'Satıcıyı takip et'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border',
              isFollowing
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'border-brand-primary/10 text-brand-primary/50 hover:border-accent hover:text-accent'
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
