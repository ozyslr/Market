import React, { useState } from 'react';
import { Star, Truck, ShieldCheck, ChevronRight, ShoppingCart, Globe, TrendingUp, Eye, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { useLanguage } from '@/context/LanguageContext';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const currentMarket = MARKETS['UK']; // Default for demo
  const tax = calculateTotal(product.price, 12, currentMarket, product.originCountry === 'UK');

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isWishlisted = wishlistItems.some((p) => p.id === product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantityInCart > 1) {
      updateQuantity(product.id, quantityInCart - 1);
    } else {
      removeItem(product.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setIsOpen(true);
  };

  return (
    <>
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-brand-primary/5 dark:border-white/5 hover:border-brand-primary/20 dark:hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col h-full relative"
      >
        {/* Image Section */}
        <div className="relative aspect-[3/4] overflow-hidden bg-brand-secondary/30 dark:bg-zinc-800">
          <Link to={`/product/${product.slug}`} className="block w-full h-full relative">
            <img 
              src={product.images[0]} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </Link>
          
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 hidden md:block">
            {quantityInCart > 0 ? (
              <div 
                className="w-full h-9 bg-white dark:bg-zinc-800 rounded-lg shadow-lg flex items-center justify-between px-2 border border-brand-primary/10"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <button 
                  onClick={handleDecrement}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-brand-secondary dark:bg-zinc-700 text-brand-primary dark:text-white hover:bg-accent hover:text-white transition-colors"
                >
                  -
                </button>
                <span className="text-xs font-bold text-brand-primary dark:text-white">{quantityInCart}</span>
                <button 
                  onClick={handleIncrement}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-brand-secondary dark:bg-zinc-700 text-brand-primary dark:text-white hover:bg-accent hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            ) : (
              <button 
                onClick={handleAddToCart}
                className="w-full py-2.5 bg-brand-primary dark:bg-white text-white dark:text-brand-primary text-xs font-bold rounded-lg shadow-lg hover:bg-accent hover:text-white dark:hover:bg-accent dark:hover:text-white transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {t('product.add_cart')}
              </button>
            )}
          </div>
          
          {/* Quick View Trigger - Only shown on hover on desktop */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowQuickView(true);
            }}
            className={cn(
              "absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-brand-primary shadow-sm border border-brand-primary/5 transition-all duration-300 hover:bg-accent hover:text-white group/view",
              isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 hidden md:flex"
            )}
          >
            <Eye size={16} />
          </button>

          {/* Wishlist Toggle - top-left, always visible */}
          <button
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            className={cn(
              "absolute top-3 left-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 active:scale-90",
              isWishlisted
                ? "bg-[#F9423A] text-white border-[#F9423A]"
                : "bg-white/90 text-brand-primary/50 border-brand-primary/5 hover:text-[#F9423A]"
            )}
          >
            <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Info Section */}
        <div className="p-3 flex flex-col flex-1">
          <Link to={`/product/${product.slug}`} className="flex flex-col mb-1 flex-1">
            <span className="text-xs font-bold text-brand-primary dark:text-zinc-100 leading-tight uppercase line-clamp-1 mb-0.5">
              {product.sellerId || "MERCORA"} 
            </span>
            <span className="text-xs text-brand-primary/70 dark:text-zinc-400 line-clamp-2 leading-snug">
              {product.title}
            </span>
          </Link>
          
          <div className="flex items-center gap-1 mb-2">
             <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "#FFC000" : "none"} className={i < Math.floor(product.rating) ? "text-[#FFC000]" : "text-gray-300"} />
                ))}
             </div>
             <span className="text-[10px] text-gray-500">({product.reviewsCount || 42})</span>
          </div>

          <div className="mt-auto space-y-1">
            <div className="flex flex-col">
               {product.oldPrice && <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">{product.oldPrice.toFixed(2)} TL</span>}
               <div className="flex items-start text-brand-primary dark:text-white">
                  <span className="text-lg font-bold leading-none tracking-tight">{Math.floor(product.price)}</span>
                  <span className="text-[10px] font-bold mt-0.5 ml-0.5 leading-none">,{Math.floor((product.price % 1) * 100).toString().padStart(2, '0')} TL</span>
               </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
               <div className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[9px] font-bold rounded">
                  Ücretsiz Kargo
               </div>
            </div>
            {/* Mobile quick add (visible unconditionally on mobile, hidden on desktop ) */}
            <div className="mt-3 md:hidden">
              {quantityInCart > 0 ? (
                <div 
                  className="w-full h-9 bg-brand-secondary/50 dark:bg-zinc-800 rounded-lg flex items-center justify-between px-2 border border-brand-primary/10"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <button 
                    onClick={handleDecrement}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-zinc-700 text-brand-primary dark:text-white hover:bg-accent hover:text-white transition-colors shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-brand-primary dark:text-white">{quantityInCart}</span>
                  <button 
                    onClick={handleIncrement}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-zinc-700 text-brand-primary dark:text-white hover:bg-accent hover:text-white transition-colors shadow-sm"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-2 border border-brand-primary/20 dark:border-white/20 text-brand-primary dark:text-white text-xs font-bold rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
                >
                  {t('product.add_cart')}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-primary/40 backdrop-blur-sm"
              onClick={() => setShowQuickView(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 flex flex-col md:flex-row border border-white/20"
            >
              <button 
                onClick={() => setShowQuickView(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-accent hover:text-white transition-all z-20"
              >
                <X size={20} />
              </button>

              {/* Product Gallery */}
              <div className="w-full md:w-1/2 bg-brand-secondary/30 p-8 flex items-center justify-center relative">
                <img 
                  src={product.images[0]} 
                  alt={product.title} 
                  className="max-w-full max-h-[400px] object-contain mix-blend-multiply drop-shadow-2xl" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-8 left-8 flex gap-2">
                  {product.images.slice(0, 3).map((img, i) => (
                    <div key={i} className="w-12 h-12 bg-white rounded-xl p-1 border border-brand-primary/5 shadow-sm">
                      <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Details */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
                <div className="mb-8">
                  <span className="px-3 py-1 bg-brand-secondary text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">
                    {product.categoryId}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display font-black text-brand-primary leading-tight uppercase italic mb-4">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} className={i < Math.floor(product.rating) ? "text-accent" : "text-gray-300"} />
                      ))}
                      <span className="text-xs font-bold text-gray-400 ml-1">({product.rating})</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <span className="text-xs font-bold text-green-600 uppercase flex items-center gap-1">
                      <ShieldCheck size={14} /> In Stock
                    </span>
                  </div>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-4">
                  {product.description || "Premium quality product with exceptional design and durability. Perfect for modern lifestyles, this item combines functionality with aesthetic appeal."}
                </p>

                <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    {product.oldPrice && (
                      <span className="block text-sm text-gray-400 line-through mb-1">
                        £{product.oldPrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-3xl font-black text-accent tracking-tighter">
                      £{product.price.toFixed(2)}
                    </span>
                  </div>
                  <Link 
                    to={`/product/${product.slug}`}
                    className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-accent hover:shadow-xl hover:shadow-accent/30 transition-all active:scale-95"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
