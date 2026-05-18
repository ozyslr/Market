import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, products }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="mt-12 mb-12 group/carousel">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-brand-primary uppercase italic">{title}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-3 border border-brand-primary/5 bg-white rounded-xl shadow-sm hover:bg-accent hover:text-white transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-3 border border-brand-primary/5 bg-white rounded-xl shadow-sm hover:bg-accent hover:text-white transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar pb-6 scroll-smooth"
      >
        {products.map(p => (
          <div key={p.id} className="w-[260px] md:w-[280px] shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
};
