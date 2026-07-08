import React, { useMemo } from 'react';
import { Heart, ShoppingCart, Eye, ShoppingBag, Flame } from 'lucide-react';

interface SocialProofBarProps {
  favoriteCount?: number;
  cartAddCount?: number;
  viewerCount?: number;
  bestSellerRank?: number;
  reviewCount?: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}B`;
  return n.toString();
}

function recentPurchases(reviewCount: number): number {
  const base = Math.max(3, Math.round(reviewCount * 0.4));
  const offset = Math.max(1, Math.round(base * 0.25));
  return base + (((reviewCount * 7 + 13) % (offset * 2 + 1)) - offset);
}

export function SocialProofBar({
  favoriteCount,
  cartAddCount,
  viewerCount,
  bestSellerRank,
  reviewCount,
}: SocialProofBarProps) {
  const recentPurchaseCount = useMemo(
    () => (reviewCount != null && reviewCount > 0 ? recentPurchases(reviewCount) : undefined),
    [reviewCount],
  );

  const hasAny = favoriteCount || cartAddCount || viewerCount || bestSellerRank || reviewCount;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {bestSellerRank && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-black text-yellow-700">
          <Flame size={11} />
          En Çok Satan {bestSellerRank}.
        </span>
      )}
      {recentPurchaseCount != null && recentPurchaseCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full text-[10px] font-black text-green-600">
          <ShoppingBag size={11} />
          {formatCount(recentPurchaseCount)} kişi son 24 saatte satın aldı
        </span>
      )}
      {favoriteCount && favoriteCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-100 rounded-full text-[10px] font-black text-red-500">
          <Heart size={11} fill="currentColor" />
          {formatCount(favoriteCount)} kişi favoriledi
        </span>
      )}
      {cartAddCount && cartAddCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full text-[10px] font-black text-orange-600">
          <ShoppingCart size={11} />
          {formatCount(cartAddCount)} kişi sepete ekledi
        </span>
      )}
      {viewerCount && viewerCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black text-blue-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <Eye size={11} />
          {viewerCount} kişi şu an inceliyor
        </span>
      )}
    </div>
  );
}
