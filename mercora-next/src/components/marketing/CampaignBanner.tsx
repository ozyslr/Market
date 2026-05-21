'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Clock } from 'lucide-react';

interface CampaignBannerData {
  id: string;
  name: string;
  description?: string;
  discountPercent?: number;
  bannerImage?: string;
  endDate: string;
  link?: string;
}

export function CampaignBanner() {
  const [campaign, setCampaign] = useState<CampaignBannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { getActiveCampaigns } = await import('@/services/campaignService');
        const campaigns = await getActiveCampaigns();
        const bannerCampaign = campaigns.find(c => c.type === 'banner');
        if (bannerCampaign) {
          setCampaign(bannerCampaign);
        }
      } catch {
        // silent
      }
    }
    load();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!campaign?.endDate) return;
    const update = () => {
      const diff = new Date(campaign.endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      setTimeLeft(days > 0 ? `${days}d ${hours}h left` : `${hours}h left`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [campaign?.endDate]);

  if (!campaign || dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {campaign.discountPercent && (
            <span className="bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
              -{campaign.discountPercent}%
            </span>
          )}
          <p className="text-sm font-medium truncate">
            {campaign.description || campaign.name}
          </p>
          {timeLeft && (
            <span className="flex items-center gap-1 text-xs text-white/70 flex-shrink-0">
              <Clock size={12} />
              {timeLeft}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={campaign.link || '/'}
            className="text-xs font-semibold bg-white text-purple-700 px-4 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
          >
            View Deal
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss campaign"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
