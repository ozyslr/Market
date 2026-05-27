import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ZoomIn, X, Play, RotateCcw } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  title: string;
  videoUrl?: string;
  has360View?: boolean;
  extraActions?: React.ReactNode;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (url.includes('youtu.be/')) {
    const parts = url.split('youtu.be/');
    const id = parts[1]?.split(/[?&#]/)[0];
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
  }
  if (url.includes('youtube.com')) {
    const match = url.match(/[?&]v=([^&#]+)/);
    const id = match?.[1];
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
  }
  return null;
}

export function ProductGallery({ images, title, videoUrl, has360View, extraActions }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  }, []);

  const totalSlots = images.length + (videoUrl ? 1 : 0);

  const prev = useCallback(() => setActiveImage(i => (i - 1 + totalSlots) % totalSlots), [totalSlots]);
  const next = useCallback(() => setActiveImage(i => (i + 1) % totalSlots), [totalSlots]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, prev, next]);

  useEffect(() => {
    setActiveImage(i => Math.min(i, Math.max(0, totalSlots - 1)));
  }, [totalSlots]);

  const isVideoActive = activeImage === images.length && videoUrl !== undefined;

  return (
    <>
      <div>
        <div
          ref={imageRef}
          className={cn(
            'w-full bg-white rounded-2xl border border-brand-primary/5 overflow-hidden relative flex items-center justify-center group aspect-[4/5]',
            !isVideoActive && 'cursor-zoom-in'
          )}
          onClick={() => { if (!isVideoActive && images.length > 0) setLightboxOpen(true); }}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={handleMouseMove}
          role={!isVideoActive && images.length > 0 ? 'button' : undefined}
          tabIndex={!isVideoActive && images.length > 0 ? 0 : undefined}
          aria-label={!isVideoActive && images.length > 0 ? 'Görseli büyüt' : undefined}
          onKeyDown={!isVideoActive && images.length > 0 ? (e) => { if (e.key === 'Enter' || e.key === ' ') setLightboxOpen(true); } : undefined}
        >
            <AnimatePresence mode="wait">
              {isVideoActive ? (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                  onClick={e => e.stopPropagation()}
                >
                  {(() => {
                    const embedUrl = getYouTubeEmbedUrl(videoUrl);
                    return embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title="Ürün videosu"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                      />
                    ) : (
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        aria-label="Ürün videosu"
                        className="w-full h-full object-contain"
                      />
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                  style={
                    zoom
                      ? {
                          transform: 'scale(2)',
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }
                      : undefined
                  }
                >
                  <OptimizedImage
                    src={images[activeImage]}
                    alt={title}
                    className="w-full h-full object-contain"
                    containerClassName="w-full h-full"
                    lazy={false}
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!isVideoActive && !zoom && (
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 text-white rounded-full text-[9px] font-black uppercase tracking-wider">
                  <ZoomIn size={11} /> Büyüt
                </div>
              </div>
            )}

            {has360View && !isVideoActive && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-[9px] font-black rounded-lg pointer-events-none">
                <RotateCcw size={12} />
                360°
              </div>
            )}

            {totalSlots > 1 && !zoom && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); prev(); }}
                  aria-label="Önceki görsel"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white transition-all"
                >
                  <ChevronLeft size={16} className="text-brand-primary" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); next(); }}
                  aria-label="Sonraki görsel"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white transition-all"
                >
                  <ChevronRight size={16} className="text-brand-primary" />
                </button>
              </>
            )}

            {extraActions && (
              <div className="absolute top-4 right-4 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                {extraActions}
              </div>
            )}
          </div>

        {totalSlots > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onMouseEnter={() => setActiveImage(i)}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'w-[72px] h-[72px] rounded-xl border-2 p-1 bg-white shrink-0 overflow-hidden transition-all',
                  activeImage === i
                    ? 'border-accent shadow-md shadow-accent/20'
                    : 'border-brand-primary/10 opacity-60 hover:opacity-100 hover:border-brand-primary/30'
                )}
              >
                <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </button>
            ))}
            {videoUrl && (
              <button
                type="button"
                onMouseEnter={() => setActiveImage(images.length)}
                onClick={() => setActiveImage(images.length)}
                aria-label="Videoyu oynat"
                className={cn(
                  'w-[72px] h-[72px] rounded-xl border-2 bg-black shrink-0 overflow-hidden transition-all flex items-center justify-center',
                  activeImage === images.length
                    ? 'border-accent shadow-md shadow-accent/20'
                    : 'border-brand-primary/10 opacity-60 hover:opacity-100 hover:border-brand-primary/30'
                )}
              >
                <Play size={20} className="text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 md:p-8"
          >
            <div className="w-full flex justify-end">
              <button
                onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
                aria-label="Kapat"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 w-full max-w-5xl flex items-center gap-4 my-4">
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                aria-label="Önceki görsel"
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="flex-1 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  src={images.length > 0 ? images[Math.min(activeImage, images.length - 1)] : ''}
                  alt={title}
                  className="max-h-[70vh] max-w-full object-contain select-none"
                />
              </div>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                aria-label="Sonraki görsel"
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight size={22} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" onClick={e => e.stopPropagation()}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'w-14 h-14 rounded-lg border-2 p-1 bg-white shrink-0',
                    activeImage === i ? 'border-accent' : 'border-transparent opacity-40 hover:opacity-80'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => { setActiveImage(images.length); setLightboxOpen(false); }}
                  aria-label="Videoyu oynat"
                  className={cn(
                    'w-14 h-14 rounded-lg border-2 bg-black shrink-0 flex items-center justify-center',
                    activeImage === images.length ? 'border-accent' : 'border-transparent opacity-40 hover:opacity-80'
                  )}
                >
                  <Play size={18} className="text-white" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}