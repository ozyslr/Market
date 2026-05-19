import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function TopTicker() {
  const { t } = useLanguage();

  return (
    <div className="bg-brand-secondary text-[9px] text-brand-primary/40 h-8 flex items-center overflow-hidden border-b border-brand-primary/5">
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="font-black uppercase tracking-widest text-brand-primary/40">London {t('nav.hub_active')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="font-black uppercase tracking-widest text-brand-primary/40">Istanbul {t('nav.hub_active')}</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <TrendingUp size={12} className="text-accent" />
            <span className="font-black uppercase tracking-widest">{t('nav.market_index')}: +1.24%</span>
          </div>
        </div>
        <div className="flex items-center gap-6 font-black uppercase tracking-widest">
          <span className="hidden sm:inline">{t('nav.tax_id')}: MCR-2026-X</span>
          <span className="text-accent">{t('nav.global_support')}: +44 20 7946 0958</span>
        </div>
      </div>
    </div>
  );
}
