import React, { useState, useEffect } from 'react';
import { Heart, Loader2, TrendingDown } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { getProducts } from '@/services/productService';
import { getPriceHistory } from '@/services/priceHistoryService';
import { Product } from '@/types';
import { ProductCard } from '@/components/commerce/ProductCard';

export function Wishlist() {
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceDrops, setPriceDrops] = useState<Record<string, { from: number; to: number }>>({});

  useEffect(() => {
    getProducts()
      .then(async all => {
        const filtered = all.filter(p => wishlist.includes(p.id));
        setProducts(filtered);

        const drops: Record<string, { from: number; to: number }> = {};
        await Promise.all(filtered.map(async p => {
          const history = await getPriceHistory(p.id, 10);
          if (history.length >= 2) {
            const latest = history[0].price;
            const previous = history[1].price;
            if (latest < previous) drops[p.id] = { from: previous, to: latest };
          }
        }));
        setPriceDrops(drops);
      })
      .finally(() => setLoading(false));
  }, [wishlist]);

  if (loading || wishlistLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
          {t('wishlist.title')}
        </h1>
        {products.length > 0 && (
          <span className="ms-2 px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-black">
            {products.length}
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="w-16 h-16 text-[#1A1033]/10 mb-4" />
          <p className="text-[#1A1033]/40 font-bold">{t('wishlist.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map(product => (
            <div key={product.id} className="relative">
              {priceDrops[product.id] && (
                <div className="absolute top-2 start-2 z-10 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg shadow-lg text-[9px] font-black uppercase tracking-wider">
                  <TrendingDown size={10} />
                  <span>{priceDrops[product.id].from} → {priceDrops[product.id].to} ₺</span>
                </div>
              )}
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
