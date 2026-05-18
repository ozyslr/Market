import React, { useState, useRef, useEffect } from 'react';
import { Star, ShieldCheck, ShoppingCart, Eye, X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/services/analyticsService';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useLanguage();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addItem } = useCart();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { trackEvent('view', product.id, user?.id); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product.id, user?.id]);
  const [showQuickView, setShowQuickView] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [imgIdx, setImgIdx] = useState(0);
  const [quickViewImgIdx, setQuickViewImgIdx] = useState(0);
  const imgCount = Math.min(product.images.length, 4);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imgCount <= 1) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const zone = Math.floor(((e.clientX - left) / width) * imgCount);
    setImgIdx(Math.min(zone, imgCount - 1));
  };
  const currentMarket = MARKETS['UK']; // Default for demo
  const tax = calculateTotal(product.price, 12, currentMarket, product.originCountry === 'UK');

  const handleAddToCart = () => {
    addItem(product.id);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setImgIdx(0); }}
        className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-brand-primary/5 dark:border-white/5 hover:border-brand-primary/20 dark:hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col h-full relative"
      >
        {/* Image Section */}
        <div
          className="relative aspect-3/4 overflow-hidden bg-brand-secondary/30 dark:bg-zinc-800"
          onMouseMove={handleImageMouseMove}
        >
          <Link to={`/product/${product.slug}`} className="block w-full h-full relative">
            <img
              src={product.images[imgIdx]}
              alt={product.title}
              className="w-full h-full object-cover transition-opacity duration-150"
              referrerPolicy="no-referrer"
            />
            {/* Quick Add overlay button (Desktop mostly) */}
            <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 hidden md:block">
              <button
                onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
                className="w-full py-2.5 bg-violet-600 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-black hover:text-white transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {t('product.addToCart')}
              </button>
            </div>
          </Link>
          {/* Dot indicators — outside Link, above cart overlay */}
          {imgCount > 1 && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1 z-20 pointer-events-none">
              {[...Array(imgCount)].map((_, i) => (
                <span key={i} className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors duration-150',
                  i === imgIdx ? 'bg-white' : 'bg-white/40'
                )} />
              ))}
            </div>
          )}
          
          {/* Wishlist toggle */}
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
            className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-brand-primary/5 transition-all duration-200 hover:scale-110 z-10"
          >
            <Heart size={14} className={isWishlisted(product.id) ? 'fill-red-500 text-red-500' : 'text-[#1A1033]/40'} />
          </button>

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
                  {t('product.freeShipping')}
               </div>
            </div>
            {/* Mobile quick add (visible unconditionally on mobile, hidden on desktop ) */}
            <div className="mt-3 md:hidden">
              <button
                onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
                className="w-full py-2 border border-brand-primary/20 dark:border-white/20 text-brand-primary dark:text-white text-xs font-bold rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
              >
                {t('product.addToCart')}
              </button>
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowQuickView(false); setQuickViewImgIdx(0); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row"
              style={{ maxHeight: '90vh' }}
            >
              {/* Close */}
              <button
                onClick={() => { setShowQuickView(false); setQuickViewImgIdx(0); }}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-zinc-700 rounded-full text-gray-400 hover:text-accent shadow z-20 transition-colors"
              >
                <X size={15} />
              </button>

              {/* LEFT: Image Gallery — 58% */}
              <div className="w-full md:w-[58%] relative bg-[#F8F8FA] dark:bg-zinc-800 flex flex-col" style={{ minHeight: 380 }}>
                {/* Free shipping badge */}
                {product.estimatedDeliveryDays != null && product.estimatedDeliveryDays <= 3 && (
                  <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-[#26A541] text-white text-[9px] font-black uppercase rounded tracking-widest shadow-sm">
                    KARGO BEDAVA
                  </div>
                )}

                {/* Main image */}
                <div className="flex-1 relative flex items-center justify-center px-8 py-6">
                  <img
                    src={product.images[quickViewImgIdx]}
                    alt={product.title}
                    className="max-w-full max-h-[300px] md:max-h-[360px] object-contain transition-opacity duration-100"
                    referrerPolicy="no-referrer"
                  />
                  {/* Prev / Next arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setQuickViewImgIdx(i => (i - 1 + product.images.length) % product.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-zinc-700 rounded-full shadow flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setQuickViewImgIdx(i => (i + 1) % product.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-zinc-700 rounded-full shadow flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 px-4 pb-4 justify-center">
                    {product.images.slice(0, 6).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setQuickViewImgIdx(i)}
                        className={cn(
                          'w-11 h-11 rounded-lg border-2 overflow-hidden bg-white shrink-0 transition-all',
                          i === quickViewImgIdx ? 'border-accent' : 'border-transparent hover:border-gray-300'
                        )}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Product Details — 42% */}
              <div className="w-full md:w-[42%] flex flex-col overflow-y-auto border-l border-gray-100 dark:border-zinc-700" style={{ maxHeight: '90vh' }}>
                <div className="flex flex-col flex-1 p-5">
                  {/* Category · Seller */}
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {product.categoryId}
                    {product.sellerId && (
                      <> · <Link to={`/seller/${product.sellerId}`} onClick={() => setShowQuickView(false)} className="text-accent hover:underline">{product.sellerId}</Link></>
                    )}
                  </p>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#1A1033] dark:text-white leading-snug mb-3">
                    {product.title}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < Math.floor(product.rating) ? '#FFC000' : 'none'} className={i < Math.floor(product.rating) ? 'text-[#FFC000]' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">{product.rating}</span>
                    <span className="text-[9px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400">{product.reviewsCount || 42} Değerlendirme</span>
                  </div>

                  {/* Discount badge */}
                  {product.discountPercentage && (
                    <div className="inline-flex items-center px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg mb-3 self-start">
                      <span className="text-[10px] font-black text-orange-500">Sepette %{product.discountPercentage} İndirim</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    {product.oldPrice && (
                      <span className="block text-xs text-gray-400 line-through mb-0.5">{product.oldPrice.toFixed(2)} TL</span>
                    )}
                    <div className="flex items-start text-[#E53935]">
                      <span className="text-2xl font-black leading-none tracking-tight">{Math.floor(product.price)}</span>
                      <span className="text-xs font-black mt-0.5 ml-0.5">,{Math.floor((product.price % 1) * 100).toString().padStart(2, '0')} TL</span>
                    </div>
                  </div>

                  {/* Variant selectors */}
                  {product.attributes && Object.entries(product.attributes).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="mb-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        {key}: <span className="text-[#1A1033] dark:text-white normal-case font-bold">{selectedVariants[key] || value}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[value].map(v => (
                          <button
                            key={v}
                            onClick={() => setSelectedVariants(prev => ({ ...prev, [key]: v }))}
                            className={cn(
                              'px-3 py-1.5 text-xs font-bold rounded-lg border transition-all',
                              (selectedVariants[key] === v || !selectedVariants[key])
                                ? 'border-accent text-accent bg-accent/10'
                                : 'border-gray-200 text-gray-500 hover:border-accent/40'
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex-1" />

                  {/* CTA */}
                  <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 py-3 bg-[#FF6000] text-white font-black text-sm rounded-xl hover:bg-[#E55500] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={15} />
                        {addedToCart ? 'Eklendi ✓' : 'Sepete Ekle'}
                      </button>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className={cn(
                          'w-12 flex items-center justify-center rounded-xl border-2 transition-all',
                          isWishlisted(product.id) ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300'
                        )}
                      >
                        <Heart size={17} className={isWishlisted(product.id) ? 'fill-red-500' : ''} />
                      </button>
                    </div>
                    <Link
                      to={`/product/${product.slug}`}
                      onClick={() => setShowQuickView(false)}
                      className="flex items-center justify-center w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-accent transition-colors"
                    >
                      Ürün Detayına Git →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
