import React from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';

interface SocialProofBarProps {
  favoriteCount?: number;
  cartAddCount?: number;
  viewerCount?: number;
  bestSellerRank?: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}B`;
  return n.toString();
}

export function SocialProofBar({
  favoriteCount,
  cartAddCount,
  viewerCount,
  bestSellerRank,
}: SocialProofBarProps) {
  const hasAny = favoriteCount || cartAddCount || viewerCount || bestSellerRank;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {bestSellerRank && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-black text-yellow-700">
          🏆 En Çok Satan {bestSellerRank}.
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
          <Eye size={11} />
          {viewerCount} kişi şu an inceliyor
        </span>
      )}
    </div>
  );
}
