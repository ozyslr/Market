import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Banner {
  imageUrl: string;
  link?: string;
  title?: string;
  order: number;
}

interface Props {
  banners: Banner[];
  autoPlayMs?: number;
}

export function BannerCarousel({ banners, autoPlayMs = 4000 }: Props) {
  const sorted = [...banners].sort((a, b) => a.order - b.order);
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % sorted.length);
  }, [sorted.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + sorted.length) % sorted.length);
  }, [sorted.length]);

  // Auto-play
  useEffect(() => {
    if (sorted.length <= 1) return;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [next, autoPlayMs, sorted.length]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (sorted.length === 0) return null;
  if (sorted.length === 1) {
    const b = sorted[0];
    const img = (
      <img
        src={b.imageUrl}
        alt={b.title || 'Banner'}
        className="w-full h-full object-cover"
        loading="eager"
        referrerPolicy="no-referrer"
      />
    );
    return (
      <div className="relative w-full h-[200px] sm:h-[300px] lg:h-[420px] rounded-2xl overflow-hidden">
        {b.link ? <Link to={b.link}>{img}</Link> : img}
        {b.title && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h2 className="text-white text-xl font-black uppercase">{b.title}</h2>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[200px] sm:h-[300px] lg:h-[420px] rounded-2xl overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {sorted.map((b, i) => (
        <div
          key={i}
          className={cn(
            'absolute inset-0 transition-opacity duration-500',
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        >
          {b.link ? (
            <Link to={b.link}>
              <img
                src={b.imageUrl}
                alt={b.title || `Banner ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
              />
            </Link>
          ) : (
            <img
              src={b.imageUrl}
              alt={b.title || `Banner ${i + 1}`}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
              referrerPolicy="no-referrer"
            />
          )}
          {b.title && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h2 className="text-white text-xl font-black uppercase">{b.title}</h2>
            </div>
          )}
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Önceki"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Sonraki"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {sorted.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              i === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80',
            )}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
