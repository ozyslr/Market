'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/types';

export function ProductDetailContent({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const wishlisted = isWishlisted(product.id);
  const inStock = product.stock > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-purple-700">{t('nav.home_page')}</Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${product.categoryId}`} className="hover:text-purple-700">{product.categoryId}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    i === selectedImage ? 'border-purple-700' : 'border-gray-200'
                  }`}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.round(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {product.rating || 0} ({product.reviewsCount || 0} {t('product.reviews')})
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {product.currency || '£'}{product.price.toLocaleString()}
            </span>
            {product.oldPrice && (
              <span className="text-lg text-gray-400 line-through ml-2">
                {product.currency || '£'}{product.oldPrice.toLocaleString()}
              </span>
            )}
            {product.discountPercentage && (
              <span className="ml-2 bg-red-100 text-red-700 text-sm font-bold px-2 py-1 rounded">
                -{product.discountPercentage}%
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {inStock ? (
              <span className="text-green-700 text-sm font-semibold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                {t('product.inStock')} ({product.stock} adet)
              </span>
            ) : (
              <span className="text-red-600 text-sm font-semibold">{t('product.outOfStock')}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Quantity + Add to Cart */}
          {inStock && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => addItem(product.id, quantity)}
                className="flex-1 bg-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                {t('product.addToCart')}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border ${
                  wishlisted ? 'border-red-200 bg-red-50' : 'border-gray-300'
                }`}
              >
                <Heart size={20} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
              </button>
            </div>
          )}

          {/* Trust Badges */}
          <div className="border-t border-gray-200 pt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <Truck size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-medium">{t('badge.free_shipping')}</p>
            </div>
            <div className="text-center">
              <Shield size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-medium">{t('trust.safe_payment')}</p>
            </div>
            <div className="text-center">
              <RotateCcw size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-medium">{t('trust.easy_return')}</p>
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="font-bold mb-3">{t('product.specifications')}</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="col-span-2 grid grid-cols-2">
                    <dt className="text-gray-500">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
