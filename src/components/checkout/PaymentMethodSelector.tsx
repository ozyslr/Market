import React from 'react';
import { CreditCard, Building2, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/types/order';

interface Option {
  key: PaymentMethod;
  label: string;
  description: string;
  icon: React.ElementType;
  regions: string[];
}

const OPTIONS: Option[] = [
  { key: 'stripe', label: 'Stripe', description: 'Kredi / Banka Kartı (EU/UK/US)', icon: CreditCard, regions: ['EU', 'UK', 'US', 'GLOBAL'] },
  { key: 'iyzico', label: 'iyzico', description: 'Kredi Kartı / Taksit (Türkiye)', icon: CreditCard, regions: ['TR'] },
  { key: 'manual', label: 'Havale / EFT', description: 'Banka havalesi ile ödeme', icon: Banknote, regions: ['TR', 'EU', 'UK', 'US', 'GLOBAL'] },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  region: string;
}

export function PaymentMethodSelector({ selected, onChange, region }: PaymentMethodSelectorProps) {
  const available = OPTIONS.filter(o => o.regions.includes(region) || o.regions.includes('GLOBAL'));

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Ödeme Yöntemi</p>
      <div className="grid grid-cols-1 gap-2">
        {available.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              'flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-start',
              selected === opt.key
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-[#1A1033]/10 bg-[#F8F8FA] hover:border-accent/40'
            )}
          >
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all',
              selected === opt.key ? 'bg-accent text-white' : 'bg-white text-[#1A1033]/40 border border-[#1A1033]/10'
            )}>
              <opt.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-black transition-colors',
                selected === opt.key ? 'text-accent' : 'text-[#1A1033]'
              )}>
                {opt.label}
              </p>
              <p className="text-[10px] font-medium text-[#1A1033]/50">{opt.description}</p>
            </div>
            {selected === opt.key && (
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
