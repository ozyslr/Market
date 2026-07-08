import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  subtext?: string;
  openInNewTab?: boolean;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, products, subtext, openInNewTab = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -600 : 600, behavior: 'smooth' });
    }
  };

  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm md:text-base font-black tracking-tight text-brand-primary dark:text-white uppercase italic leading-tight">{title}</h2>
          {subtext && <p className="text-[11px] text-brand-primary/40 dark:text-white/40 mt-0.5">{subtext}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Önceki"
            className="w-8 h-8 rounded-full border border-brand-primary/10 dark:border-white/10 flex items-center justify-center text-brand-primary/50 dark:text-white/50 hover:border-accent hover:text-accent transition-all"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Sonraki"
            className="w-8 h-8 rounded-full border border-brand-primary/10 dark:border-white/10 flex items-center justify-center text-brand-primary/50 dark:text-white/50 hover:border-accent hover:text-accent transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {products.map(p => (
          <div key={p.id} className="w-[170px] md:w-[190px] shrink-0">
            <ProductCard product={p} openInNewTab={openInNewTab} />
          </div>
        ))}
      </div>
    </section>
  );
};
