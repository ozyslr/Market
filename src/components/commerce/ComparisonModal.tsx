import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useComparison } from '@/hooks/useComparison';
import { useCart } from '@/context/CartContext';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComparisonModal({ isOpen, onClose }: ComparisonModalProps) {
  const { items } = useComparison();
  const { addItem } = useCart();

  // Collect all unique spec keys across all items
  const allSpecKeys = Array.from(
    new Set(
      items.flatMap(item => Object.keys(item.specifications ?? {}))
    )
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Ürün karşılaştırma"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto border border-brand-primary/5 dark:border-white/5 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-primary/5 dark:border-white/5 shrink-0">
                <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary dark:text-white">
                  Ürün Karşılaştırma
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Karşılaştırmayı kapat"
                  className="w-8 h-8 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center hover:bg-accent hover:text-white transition-colors text-brand-primary dark:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="overflow-y-auto flex-1">
                {/* Product headers row */}
                <div
                  className="grid gap-4 p-6 border-b border-brand-primary/5 dark:border-white/5"
                  style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
                >
                  {items.map(item => (
                    <div key={item.id} className="flex flex-col items-center gap-3 text-center">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-brand-primary/5 dark:border-white/5">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand-secondary dark:bg-zinc-800" />
                        )}
                      </div>
                      <p className="text-xs font-black text-brand-primary dark:text-white line-clamp-2">{item.title}</p>
                      <p className="text-sm font-black text-accent">
                        {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                      <button
                        type="button"
                        onClick={() => addItem(item.id, 1)}
                        aria-label={`${item.title} sepete ekle`}
                        className="px-4 py-2 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary transition-colors"
                      >
                        Sepete Ekle
                      </button>
                    </div>
                  ))}
                </div>

                {/* Spec rows */}
                {allSpecKeys.length > 0 ? (
                  <div>
                    {allSpecKeys.map((key, rowIdx) => (
                      <div
                        key={key}
                        className={`px-6 py-3 ${rowIdx % 2 === 0 ? 'bg-brand-secondary/30 dark:bg-zinc-800/30' : ''}`}
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-zinc-500 mb-2">{key}</p>
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                          {items.map(item => (
                            <p key={item.id} className="text-xs font-bold text-brand-primary dark:text-white">
                              {(item.specifications ?? {})[key] ?? '—'}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-xs font-bold text-brand-primary/30 dark:text-zinc-600">Bu ürünlerin karşılaştırılabilir özellikleri bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
