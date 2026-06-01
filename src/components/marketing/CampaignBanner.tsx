import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, X, Percent, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActiveCampaigns } from '@/services/campaignService';
import type { Campaign } from '@/types';

interface CampaignBannerProps {
  className?: string;
}

export function CampaignBanner({ className }: CampaignBannerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    getActiveCampaigns().then(setCampaigns);
  }, []);

  const visible = campaigns.filter(c => !dismissed.includes(c.id));

  // Auto-rotate carousel
  useEffect(() => {
    if (visible.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visible.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [visible.length]);

  // Reset index when campaigns change
  useEffect(() => {
    setCurrentIndex(0);
  }, [visible.length]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % visible.length);
  }, [visible.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + visible.length) % visible.length);
  }, [visible.length]);

  if (!visible.length) return null;

  const current = visible[currentIndex];

  return (
    <div className={cn('space-y-2 px-4 md:px-0', className)}>
      <div className="relative overflow-hidden rounded-xl">
        {/* Carousel slide */}
        <div className="relative">
          <div
            key={current.id}
            className="relative flex items-center gap-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 py-3 overflow-hidden"
          >
            {/* Background sparkle */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -end-4 w-16 h-16 bg-white rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -start-4 w-12 h-12 bg-white rounded-full blur-xl" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="p-1.5 bg-white/20 rounded-lg">
                {current.discountType === 'percentage' ? <Percent size={14} /> : <Zap size={14} />}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-black tracking-tight">{current.name}</p>
              {current.description && (
                <p className="text-[11px] text-white/80 font-medium">{current.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/search?campaign=${current.id}`}
                className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                İncele <ChevronRight size={12} />
              </Link>
              <button
                onClick={() => {
                  setDismissed(p => [...p, current.id]);
                  // If we dismissed the last item, reset to previous
                  setCurrentIndex(prev => Math.min(prev, visible.length - 2));
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation arrows — only when multiple campaigns */}
        {visible.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute start-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Önceki kampanya"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={goNext}
              className="absolute end-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Sonraki kampanya"
            >
              <ChevronRight size={12} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {visible.length > 1 && (
          <div className="absolute bottom-1.5 start-1/2 -translate-x-1/2 flex items-center gap-1">
            {visible.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === currentIndex
                    ? 'bg-white w-3'
                    : 'bg-white/40 hover:bg-white/70'
                )}
                aria-label={`Kampanya ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
