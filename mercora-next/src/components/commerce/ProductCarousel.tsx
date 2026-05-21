'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface CarouselProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug?: string;
  rating?: number;
}

interface ProductCarouselProps {
  title: string;
  products: CarouselProduct[];
  viewAllLink?: string;
}

export function ProductCarousel({ title, products, viewAllLink }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  if (!products.length) return null;

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link href={viewAllLink} className="text-sm text-purple-700 hover:text-purple-800 font-medium">
              View all
            </Link>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-1.5 rounded-full border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-1.5 rounded-full border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
      >
        {products.map(product => (
          <Link
            key={product.id}
            href={`/product/${product.slug || product.id}`}
            className="flex-shrink-0 w-40 md:w-48 group"
          >
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
              <OptimizedImage
                src={product.images?.[0] || ''}
                alt={product.name}
                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm font-bold text-purple-700">
              £{product.price.toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
