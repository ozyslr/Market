import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, X, Percent, Zap, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActiveCampaigns } from '@/services/campaignService';
import type { Campaign } from '@/types';

interface CampaignBannerProps {
  className?: string;
}

export function CampaignBanner({ className }: CampaignBannerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    getActiveCampaigns().then(setCampaigns);
  }, []);

  const visible = campaigns.filter(c => !dismissed.includes(c.id));
  if (!visible.length) return null;

  return (
    <div className={cn('space-y-2 px-4 md:px-0', className)}>
      {visible.slice(0, 2).map(c => (
        <div
          key={c.id}
          className="relative flex items-center gap-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl px-4 py-3 overflow-hidden"
        >
          {/* Background sparkle */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-full blur-xl" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="p-1.5 bg-white/20 rounded-lg">
              {c.discountType === 'percentage' ? <Percent size={14} /> : <Zap size={14} />}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-black tracking-tight">{c.name}</p>
            {c.description && (
              <p className="text-[11px] text-white/80 font-medium">{c.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/search?campaign=${c.id}`}
              className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              İncele <ChevronRight size={12} />
            </Link>
            <button
              onClick={() => setDismissed(p => [...p, c.id])}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
