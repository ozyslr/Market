import React from 'react';
import { Truck, Loader2, Check } from 'lucide-react';
import type { ShippingRate, CargoProviderName } from '@/services/cargoService';
import { getAvailableCarriers } from '@/services/cargoService';
import { cn } from '@/lib/utils';

const CARRIER_LABELS: Record<string, string> = Object.fromEntries(
  getAvailableCarriers().map((c) => [c.name, c.label]),
);

export interface ShippingSectionProps {
  ratesLoading: boolean;
  shipRates: ShippingRate[];
  selectedCarrier: CargoProviderName | null;
  onSelectCarrier: (carrier: CargoProviderName) => void;
  curSym: string;
  convertTRY: (tryAmount: number) => number;
}

export function ShippingSection({
  ratesLoading,
  shipRates,
  selectedCarrier,
  onSelectCarrier,
  curSym,
  convertTRY,
}: ShippingSectionProps) {
  if (!ratesLoading && shipRates.length === 0) return null;

  return (
    <div className="mb-4 pt-4 border-t border-brand-primary/5">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-3 flex items-center gap-1.5">
        <Truck size={12} className="text-accent" /> Kargo Seçimi
      </p>
      {ratesLoading ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-[#F8F8FA] rounded-xl">
          <Loader2 size={14} className="animate-spin text-accent" />
          <span className="text-[11px] font-bold text-brand-primary/50">
            Kargo ücretleri hesaplanıyor...
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {shipRates.map((rate) => {
            const active = selectedCarrier === rate.provider;
            return (
              <button
                key={rate.provider}
                type="button"
                onClick={() => onSelectCarrier(rate.provider)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border-2 transition-all text-start',
                  active
                    ? 'border-accent bg-accent/5'
                    : 'border-brand-primary/10 bg-[#F8F8FA] hover:border-accent/40',
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                      active ? 'border-accent bg-accent' : 'border-brand-primary/20',
                    )}
                  >
                    {active && <Check size={9} className="text-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-black text-brand-primary truncate">
                      {CARRIER_LABELS[rate.provider] ?? rate.provider}
                    </span>
                    <span className="block text-[9px] font-bold text-brand-primary/40">
                      {rate.estimatedDays} iş günü
                    </span>
                  </span>
                </span>
                <span className="text-[11px] font-black text-brand-primary shrink-0">
                  {curSym}
                  {convertTRY(rate.cost).toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
