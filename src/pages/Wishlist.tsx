import React, { useState, useEffect } from 'react';
import { Heart, Loader2, TrendingDown, Trash2, Share2, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getProducts } from '@/services/productService';
import { getPriceHistory } from '@/services/priceHistoryService';
import { Product } from '@/types';
import { ProductCard } from '@/components/commerce/ProductCard';

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-2" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-1" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function Wishlist() {
  const { user } = useAuth();
  const { wishlist, toggleWishlist, loading: wishlistLoading, wishlistCount } = useWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceDrops, setPriceDrops] = useState<Record<string, { from: number; to: number }>>({});
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getProducts()
      .then(async (all) => {
        const filtered = all.filter((p) => wishlist.includes(p.id));
        setProducts(filtered);

        const drops: Record<string, { from: number; to: number }> = {};
        await Promise.all(
          filtered.map(async (p) => {
            const history = await getPriceHistory(p.id, 10);
            if (history.length >= 2) {
              const latest = history[0].price;
              const previous = history[1].price;
              if (latest < previous) drops[p.id] = { from: previous, to: latest };
            }
          }),
        );
        setPriceDrops(drops);
      })
      .finally(() => setLoading(false));
  }, [wishlist, user]);

  const handleRemove = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleShare = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareFocus(product.id);
      setShareFeedback(product.id);
      setTimeout(() => setShareFeedback(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShareFocus(product.id);
      setShareFeedback(product.id);
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  const setShareFocus = (productId: string) => {
    // Setter for share feedback state — handled via shareFeedback directly
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="w-20 h-20 text-zinc-200 dark:text-zinc-700 mb-6" />
          <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-3">
            {t('wishlist.login_title') || 'Favori Ürünleriniz'}
          </h2>
          <p className="text-brand-primary/40 dark:text-white/40 font-bold mb-8 max-w-md">
            {t('wishlist.login_prompt') || 'İstek listenizi görüntülemek için giriş yapın.'}
          </p>
          <button
            onClick={() => navigate('/?login=1')}
            className="px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            {t('wishlist.login_cta') || 'Giriş Yap'}
          </button>
        </div>
      </div>
    );
  }

  if (loading || wishlistLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            {t('wishlist.title')}
          </h1>
        </div>
        <WishlistSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
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
          <Heart className="w-16 h-16 text-brand-primary/10 dark:text-white/10 mb-4" />
          <p className="text-brand-primary/40 dark:text-white/40 font-bold mb-6">
            {t('wishlist.empty') || 'İstek listeniz boş'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            <ShoppingCart size={18} />
            <span>{t('wishlist.explore') || 'Keşfet'}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              {/* Action buttons overlay */}
              <div className="absolute top-2 end-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleRemove(product.id, e)}
                  className="w-8 h-8 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-colors text-zinc-600 dark:text-zinc-300"
                  aria-label={t('wishlist.remove') || 'Kaldır'}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={(e) => handleShare(product, e)}
                  className="w-8 h-8 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-accent hover:text-white transition-colors text-zinc-600 dark:text-zinc-300 relative"
                  aria-label={t('wishlist.share') || 'Paylaş'}
                >
                  <Share2 size={14} />
                  {shareFeedback === product.id && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] font-black px-2 py-1 rounded whitespace-nowrap shadow-lg">
                      {t('wishlist.copied') || 'Kopyalandı!'}
                    </span>
                  )}
                </button>
              </div>

              {/* Price drop badge */}
              {priceDrops[product.id] && (
                <div className="absolute top-2 start-2 z-10 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg shadow-lg text-[9px] font-black uppercase tracking-wider">
                  <TrendingDown size={10} />
                  <span>
                    {priceDrops[product.id].from} → {priceDrops[product.id].to} ₺
                  </span>
                </div>
              )}

              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* Share button (top level) — only when there are items */}
      {products.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={async () => {
              const url = window.location.href;
              try {
                await navigator.clipboard.writeText(url);
                setShareFeedback('page');
                setTimeout(() => setShareFeedback(null), 2000);
              } catch {
                // fallback
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
          >
            <Share2 size={16} />
            <span>
              {shareFeedback === 'page'
                ? t('wishlist.copied') || 'Kopyalandı!'
                : t('wishlist.share') || 'Paylaş'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
