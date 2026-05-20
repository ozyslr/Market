'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export function WishlistContent() {
  const { t } = useLanguage();
  const { wishlist, loading } = useWishlist();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('wishlist.empty_title')}</h2>
        <p className="text-gray-500 mb-6">{t('wishlist.empty_desc')}</p>
        <Link href="/" className="inline-block bg-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors">
          {t('nav.home_page')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.wishlist')}</h1>
      <p className="text-gray-500">{wishlist.length} ürün</p>
      {/* Product grid would be rendered here with full product data */}
      <div className="mt-4 text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-400">Ürün detayları yükleniyor...</p>
      </div>
    </div>
  );
}
