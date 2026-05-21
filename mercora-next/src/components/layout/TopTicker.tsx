'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TickerItem {
  text: string;
  link?: string;
}

const DEFAULT_TICKERS: TickerItem[] = [
  { text: 'Free shipping on orders over £50', link: '/shipping' },
  { text: 'Summer Sale — up to 40% off!', link: '/collection/summer-sale' },
  { text: 'New sellers welcome — start selling today', link: '/sell/apply' },
];

export function TopTicker() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<TickerItem[]>(DEFAULT_TICKERS);

  // Load from campaigns or CMS
  useEffect(() => {
    async function loadTickers() {
      try {
        const { getActiveCampaigns } = await import('@/services/campaignService');
        const campaigns = await getActiveCampaigns();
        if (campaigns.length > 0) {
          setItems(campaigns.map(c => ({
            text: c.description || c.name,
            link: c.type === 'banner' ? undefined : undefined,
          })));
        }
      } catch {
        // Use defaults
      }
    }
    loadTickers();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (!isVisible || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, items.length]);

  if (!isVisible) return null;

  const current = items[currentIndex];

  return (
    <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white text-xs font-medium">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-1">
          <Sparkles size={14} className="text-yellow-300 flex-shrink-0" />
          {current ? (
            current.link ? (
              <Link href={current.link} className="flex items-center gap-1 hover:underline">
                {current.text}
                <ChevronRight size={12} />
              </Link>
            ) : (
              <span>{current.text}</span>
            )
          ) : (
            <span>Welcome to Mercora</span>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-white/70 hover:text-white transition-colors flex-shrink-0"
          aria-label="Dismiss announcement"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
