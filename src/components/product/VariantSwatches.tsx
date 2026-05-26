import React from 'react';
import { cn } from '@/lib/utils';

interface VariantOption {
  value: string;
  label?: string;
  image?: string;
  colorHex?: string;
  inStock: boolean;
}

interface VariantSwatchesProps {
  attributeName: string;
  options: VariantOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export function VariantSwatches({
  attributeName,
  options,
  selectedValue,
  onSelect,
}: VariantSwatchesProps) {
  const hasImages = options.some(o => o.image);
  const hasColors = options.some(o => o.colorHex);
  const isVisual = hasImages || hasColors;

  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
        {attributeName}
        {selectedValue && (
          <span className="ml-2 text-brand-primary normal-case font-bold">: {selectedValue}</span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => option.inStock && onSelect(option.value)}
            disabled={!option.inStock}
            title={option.label || option.value}
            className={cn(
              'transition-all relative',
              isVisual
                ? 'w-11 h-11 rounded-full p-0.5 border-2'
                : 'px-3 py-1.5 rounded-xl text-xs font-black border-2',
              selectedValue === option.value
                ? isVisual
                  ? 'border-accent shadow-md shadow-accent/20'
                  : 'border-accent bg-accent/10 text-accent'
                : option.inStock
                  ? isVisual
                    ? 'border-brand-primary/10 hover:border-accent/40'
                    : 'border-brand-primary/10 text-brand-primary hover:border-accent/40'
                  : 'border-brand-primary/5 text-brand-primary/20 cursor-not-allowed'
            )}
          >
            {option.image ? (
              <img
                src={option.image}
                alt={option.label || option.value}
                className="w-full h-full rounded-full object-cover"
              />
            ) : option.colorHex ? (
              <span
                className="block w-full h-full rounded-full"
                style={{ backgroundColor: option.colorHex }}
              />
            ) : (
              option.label || option.value
            )}
            {!option.inStock && isVisual && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-full h-0.5 bg-brand-primary/20 rotate-45 absolute" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
