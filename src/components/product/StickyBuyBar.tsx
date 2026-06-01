import React from 'react';
import { ShoppingCart, Zap, Minus, Plus, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Product } from '@/types';

interface StickyBuyBarProps {
  product: Product;
  selectedAttrs: Record<string, string>;
  onVariantChange: (attr: string, value: string) => void;
  visible: boolean;
  quantity: number;
  price: number;
  currency?: string;
  onAddToCart: (variantId?: string) => void;
  onBuyNow?: () => void;
  oneClickLoading?: boolean;
  onQuantityChange?: (qty: number) => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function StickyBuyBar({
  product,
  selectedAttrs,
  onVariantChange,
  visible,
  quantity,
  price,
  currency = 'gbp',
  onAddToCart,
  onBuyNow,
  oneClickLoading = false,
  onQuantityChange,
  isFavorited = false,
  onToggleFavorite,
}: StickyBuyBarProps) {
  const hasVariants = (product.variantAttributes?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0;
  const stickyVariant = hasVariants
    ? product.variants!.find(v => (product.variantAttributes ?? []).every(attr => v.attributes[attr] === selectedAttrs[attr]))
    : undefined;
  const allSelected = !hasVariants || (product.variantAttributes ?? []).every(attr => selectedAttrs[attr]);
  const canAdd = allSelected && (!hasVariants || !!stickyVariant);

  const CURRENCY_SYMBOLS: Record<string, string> = { gbp: '£', try: '₺', usd: '$', eur: '€' };
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency.toUpperCase();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="md:hidden fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-brand-primary/5 shadow-2xl px-4 py-3 space-y-2"
          role="region"
          aria-label="Hızlı satın al"
        >
          {/* Compact variant pills for mobile sticky bar */}
          {hasVariants && product.variantAttributes!.map(attr => {
            const uniqueValues = [...new Set(product.variants!.map(v => v.attributes[attr]).filter(Boolean))];
            return (
              <div key={attr} className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[9px] font-black uppercase text-brand-primary/40 whitespace-nowrap">{attr}:</span>
                {uniqueValues.map(val => (
                  <button
                    key={val}
                    onClick={() => onVariantChange(attr, val)}
                    disabled={!product.variants!.some(v => v.attributes[attr] === val && v.stock > 0)}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all whitespace-nowrap',
                      selectedAttrs[attr] === val
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-brand-primary/10 text-brand-primary/60 hover:border-accent/40'
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-brand-primary/40 font-bold truncate">{product.title}</p>
              <p className="text-lg font-black text-brand-primary">{symbol}{price.toFixed(2)}</p>
            </div>
            {/* Quantity selector */}
            <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 font-bold text-sm"
                aria-label="Azalt"
              >
                <Minus size={12} />
              </button>
              <span className="w-7 text-center font-bold text-sm text-gray-700 select-none">{quantity}</span>
              <button
                type="button"
                onClick={() => onQuantityChange?.(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 font-bold text-sm"
                aria-label="Arttır"
              >
                <Plus size={12} />
              </button>
            </div>
            {/* Favorite button */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all border',
                  isFavorited
                    ? 'text-red-500 border-red-200 bg-red-50'
                    : 'text-brand-primary/30 border-brand-primary/10 hover:text-red-400 hover:border-red-200'
                )}
              >
                <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            )}
            {onBuyNow && (
              <button
                type="button"
                onClick={onBuyNow}
                disabled={oneClickLoading}
                aria-label="Hemen satın al"
                className="px-4 py-3 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Zap size={13} /> {oneClickLoading ? '...' : 'Hemen Al'}
              </button>
            )}
            <button
              type="button"
              onClick={() => canAdd && onAddToCart(stickyVariant?.id)}
              disabled={!canAdd}
              aria-label={canAdd ? 'Sepete ekle' : 'Stokta yok'}
              className={cn(
                'px-5 py-3 text-white text-[10px] font-black uppercase rounded-xl flex items-center gap-1.5 shrink-0 shadow-lg',
                canAdd ? 'bg-accent shadow-accent/20' : 'bg-brand-primary/20 cursor-not-allowed'
              )}
            >
              <ShoppingCart size={13} /> Sepete Ekle
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
