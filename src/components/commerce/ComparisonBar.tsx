import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, BarChart } from 'lucide-react';
import { useComparison } from '@/hooks/useComparison';

interface ComparisonBarProps {
  onOpen: () => void;
}

export function ComparisonBar({ onOpen }: ComparisonBarProps) {
  const { items, removeItem, clearAll } = useComparison();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="region"
          aria-label="Ürün karşılaştırma çubuğu"
          className="fixed bottom-20 md:bottom-6 start-1/2 -translate-x-1/2 z-40 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-brand-primary/10 dark:border-white/10 px-4 py-3 flex items-center gap-3"
        >
          {/* Thumbnail slots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, idx) => {
              const item = items[idx];
              return item ? (
                <div key={item.id} className="relative w-10 h-10 rounded-lg overflow-hidden border border-brand-primary/10 dark:border-white/10 shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center">
                      <BarChart size={12} className="text-brand-primary/30 dark:text-zinc-600" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`${item.title} karşılaştırmadan çıkar`}
                    className="absolute -top-1 -end-1 w-4 h-4 bg-brand-primary dark:bg-white text-white dark:text-brand-primary rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <X size={8} />
                  </button>
                </div>
              ) : (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-lg border border-dashed border-brand-primary/20 dark:border-white/20 shrink-0"
                  aria-hidden="true"
                />
              );
            })}
          </div>

          <span className="text-[10px] font-black text-brand-primary/60 dark:text-zinc-400 whitespace-nowrap">
            {items.length} ürün karşılaştırılıyor
          </span>

          <button
            type="button"
            onClick={onOpen}
            disabled={items.length < 2}
            aria-label="Karşılaştır"
            className="px-4 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-primary transition-colors shrink-0"
          >
            Karşılaştır
          </button>

          <button
            type="button"
            onClick={clearAll}
            aria-label="Karşılaştırmayı temizle"
            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-zinc-500 hover:text-brand-primary dark:hover:text-white transition-colors shrink-0"
          >
            Temizle
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
