import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/commerce/ProductCard';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import { useLanguage } from '@/context/LanguageContext';

export function WishlistPage() {
  const { t } = useLanguage();
  const items = useWishlistStore((state) => state.items);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const addItem = useCartStore((state) => state.addItem);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const addAllToCart = () => {
    items.forEach((p) => addItem(p, 1));
    setIsOpen(true);
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#f2f4f7] dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-12 text-center transition-colors duration-300">
        <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-zinc-900 border border-brand-primary/5 shadow-sm flex items-center justify-center mb-8">
          <Heart size={40} className="text-accent" />
        </div>
        <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
          {t('wishlist.empty_title') !== 'wishlist.empty_title' ? t('wishlist.empty_title') : 'Favori Listen Boş'}
        </h2>
        <p className="text-brand-primary/40 dark:text-white/40 text-xs font-bold uppercase tracking-widest mt-4 max-w-sm">
          {t('wishlist.empty_desc') !== 'wishlist.empty_desc' ? t('wishlist.empty_desc') : 'Beğendiğin ürünleri kalbe dokunarak buraya ekle, daha sonra kolayca bul.'}
        </p>
        <Link
          to="/"
          className="mt-10 px-8 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg shadow-accent/20"
        >
          {t('wishlist.start_shopping') !== 'wishlist.start_shopping' ? t('wishlist.start_shopping') : 'Alışverişe Başla'}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f4f7] dark:bg-zinc-950 min-h-screen pb-20 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Heart size={22} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white leading-none">
                {t('wishlist.title') !== 'wishlist.title' ? t('wishlist.title') : 'Favorilerim'}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mt-1">
                {items.length} {t('wishlist.products') !== 'wishlist.products' ? t('wishlist.products') : 'Ürün'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={addAllToCart}
              className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg shadow-accent/20"
            >
              <ShoppingCart size={14} /> {t('wishlist.add_all') !== 'wishlist.add_all' ? t('wishlist.add_all') : 'Tümünü Sepete Ekle'}
            </button>
            <button
              onClick={clearWishlist}
              className="flex items-center gap-2 px-5 py-3 border border-brand-primary/10 dark:border-white/10 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
            >
              <Trash2 size={14} /> {t('wishlist.clear') !== 'wishlist.clear' ? t('wishlist.clear') : 'Temizle'}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
