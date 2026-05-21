'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  bgColor: string;
  accentColor: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    title: 'Summer Sale',
    subtitle: 'Up to 40% off on selected items. Limited time offer.',
    cta: 'Shop Now',
    link: '/collection/summer-sale',
    bgColor: 'from-purple-900 via-purple-800 to-indigo-900',
    accentColor: 'bg-yellow-400 text-purple-900',
  },
  {
    title: 'Sell on Mercora',
    subtitle: 'Join thousands of sellers and grow your business.',
    cta: 'Start Selling',
    link: '/sell/apply',
    bgColor: 'from-emerald-900 via-emerald-800 to-teal-900',
    accentColor: 'bg-white text-emerald-900',
  },
  {
    title: 'New Arrivals',
    subtitle: 'Discover the latest products from top sellers.',
    cta: 'Browse Now',
    link: '/collection/new-arrivals',
    bgColor: 'from-orange-900 via-orange-800 to-red-900',
    accentColor: 'bg-white text-orange-900',
  },
];

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);

  const next = useCallback(() => setCurrent(prev => (prev + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(prev => (prev - 1 + slides.length) % slides.length), [slides.length]);

  // Auto-rotate
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next, slides.length]);

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden rounded-2xl mx-4 md:mx-8 my-4">
      <div className={`relative bg-gradient-to-r ${slide.bgColor} min-h-[300px] md:min-h-[400px] flex items-center transition-all duration-700`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 px-8 md:px-16 py-12 md:py-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl">
            {slide.title}
          </h2>
          <p className="text-white/80 text-sm md:text-lg mb-6 max-w-xl">
            {slide.subtitle}
          </p>
          <Link
            href={slide.link}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 ${slide.accentColor}`}
          >
            {slide.cta}
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
