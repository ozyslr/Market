import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Percent, Zap, Calendar, Tag, Megaphone,
  Loader2, AlertCircle, ChevronRight,
} from 'lucide-react';
import { getActiveCampaigns } from '@/services/campaignService';
import { SEO } from '@/components/common/SEO';
import type { Campaign, CampaignTargetType } from '@/types';
import { cn } from '@/lib/utils';

const TARGET_LABELS: Record<CampaignTargetType, string> = {
  all_products: 'Tüm Ürünler',
  category: 'Kategoriye Özel',
  brand: 'Markaya Özel',
  specific_products: 'Belirli Ürünler',
};

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'all_products', label: 'Genel' },
  { key: 'category', label: 'Kategori' },
  { key: 'brand', label: 'Marka' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const navigate = useNavigate();
  const isPercentage = campaign.discountType === 'percentage';

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate('/search?tag=deals')}
      className="relative bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-brand-primary/5 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-start overflow-hidden group text-brand-primary dark:text-white"
    >
      {/* Background decoration */}
      <div className="absolute -top-6 -end-6 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl group-hover:from-accent/20 transition-all" />

      {/* Discount badge */}
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4",
        isPercentage
          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
      )}>
        {isPercentage ? <Percent size={12} /> : <Zap size={12} />}
        {isPercentage ? `%${campaign.discountValue}` : `${campaign.discountValue.toLocaleString('tr-TR')} TL`} İndirim
      </div>

      {/* Title & description */}
      <h3 className="text-lg font-black tracking-tight mb-1.5">{campaign.name}</h3>
      {campaign.description && (
        <p className="text-xs text-brand-primary/60 dark:text-white/60 leading-relaxed mb-4 line-clamp-2">
          {campaign.description}
        </p>
      )}

      {/* Meta */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/40 dark:text-white/40">
          <Tag size={12} />
          <span>{TARGET_LABELS[campaign.targetType]}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/40 dark:text-white/40">
          <Calendar size={12} />
          <span>{formatDate(campaign.startDate)} &mdash; {formatDate(campaign.endDate)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 pt-4 border-t border-brand-primary/5 dark:border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
          İncele <ChevronRight size={12} />
        </span>
      </div>
    </motion.button>
  );
}

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    setError(null);
    getActiveCampaigns()
      .then(setCampaigns)
      .catch(() => setError('Kampanyalar yüklenirken bir hata oluştu.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? campaigns
    : campaigns.filter(c => c.targetType === filter);

  return (
    <div className="min-h-screen bg-brand-secondary dark:bg-brand-secondary pb-20">
      <SEO title="Kampanyalar" description="Aktif kampanyalar ve fırsatlar" lang="tr" />

      {/* Header */}
      <div className="bg-gradient-to-br from-accent to-purple-700 text-white pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone size={28} />
            <h1 className="text-3xl md:text-5xl font-display font-black uppercase italic tracking-tight">
              Kampanyalar
            </h1>
          </div>
          <p className="text-white/70 text-sm font-medium max-w-xl">
            Kaçırılmayacak fırsatlar ve özel kampanyalar seni bekliyor.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-5 mb-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === f.key
                  ? "bg-accent text-white shadow-lg"
                  : "bg-white dark:bg-zinc-900 text-brand-primary/50 dark:text-white/50 border border-brand-primary/5 dark:border-white/5 hover:border-accent/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="text-sm text-brand-primary/40 font-medium">Kampanyalar yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle size={40} className="text-red-400 mb-3" />
            <p className="text-sm font-bold text-red-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Megaphone size={48} className="text-brand-primary/20 dark:text-white/20 mb-4" />
            <h3 className="text-lg font-black text-brand-primary/40 dark:text-white/40 mb-1">
              Aktif Kampanya Yok
            </h3>
            <p className="text-xs text-brand-primary/30 dark:text-white/30 font-medium">
              Bu kategoride şu an aktif bir kampanya bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((campaign, i) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
