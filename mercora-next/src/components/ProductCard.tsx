'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();
  const wishlisted = isWishlisted(product.id);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : product.discountPercentage || 0;

  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <Link href={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        {product.promotionStatus === 'active' && (
          <div className="absolute top-0 left-0 z-10 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-br-md shadow-xs">
            REKLAM
          </div>
        )}
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingCart size={48} />
          </div>
        )}

        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}

        <button
          onClick={e => { e.preventDefault(); toggleWishlist(product.id); }}
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
          aria-label="Add to wishlist"
        >
          <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
        </button>
      </Link>

      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-purple-700 transition-colors min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-1">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-500">{product.rating || 0} ({product.reviewsCount || 0})</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {product.currency || '£'}{product.price.toLocaleString()}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-gray-400 line-through ml-1">
                {product.currency || '£'}{product.oldPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(product.id)}
            className="p-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
            aria-label={t('product.addToCart')}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
