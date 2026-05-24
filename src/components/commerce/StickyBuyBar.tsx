import React from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface StickyBuyBarProps {
  visible: boolean;
  price: number;
  currency?: string;
  productTitle: string;
  canAdd: boolean;
  onAddToCart: () => void;
  onBuyNow?: () => void;
}

export function StickyBuyBar({
  visible,
  price,
  currency = 'gbp',
  productTitle,
  canAdd,
  onAddToCart,
  onBuyNow,
}: StickyBuyBarProps) {
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
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-primary/5 shadow-2xl px-4 py-3"
          role="region"
          aria-label="Hızlı satın al"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-brand-primary/40 font-bold truncate">{productTitle}</p>
              <p className="text-lg font-black text-brand-primary">{symbol}{price.toFixed(2)}</p>
            </div>
            {onBuyNow && (
              <button
                type="button"
                onClick={onBuyNow}
                aria-label="Hemen satın al"
                className="px-4 py-3 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Zap size={13} /> Hemen Al
              </button>
            )}
            <button
              type="button"
              onClick={onAddToCart}
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
