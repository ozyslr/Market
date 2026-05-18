import React, { useState } from 'react';
import { Star, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActiveFilters {
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  brands?: string[];
  inStock?: boolean;
  freeShipping?: boolean;
}

interface FilterPanelProps {
  filters: ActiveFilters;
  onChange: (f: ActiveFilters) => void;
  brands?: string[];
  className?: string;
}

const PRICE_PRESETS = [
  { label: '0 – 500 TL',    min: 0,    max: 500  },
  { label: '500 – 1000 TL', min: 500,  max: 1000 },
  { label: '1000 – 2500 TL',min: 1000, max: 2500 },
  { label: '2500 TL +',     min: 2500, max: undefined },
];

export function FilterPanel({ filters, onChange, brands = [], className }: FilterPanelProps) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [priceMinInput, setPriceMinInput] = useState(filters.priceMin?.toString() ?? '');
  const [priceMaxInput, setPriceMaxInput] = useState(filters.priceMax?.toString() ?? '');

  const visibleBrands = showAllBrands ? brands : brands.slice(0, 8);

  const update = (patch: Partial<ActiveFilters>) => onChange({ ...filters, ...patch });

  const clearAll = () => {
    setPriceMinInput('');
    setPriceMaxInput('');
    onChange({});
  };

  const hasActive =
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.rating != null ||
    (filters.brands?.length ?? 0) > 0 ||
    filters.inStock ||
    filters.freeShipping;

  const applyPrice = () => {
    const min = priceMinInput !== '' ? Number(priceMinInput) : undefined;
    const max = priceMaxInput !== '' ? Number(priceMaxInput) : undefined;
    update({ priceMin: min, priceMax: max });
  };

  const toggleBrand = (brand: string) => {
    const current = filters.brands ?? [];
    const next = current.includes(brand)
      ? current.filter(b => b !== brand)
      : [...current, brand];
    update({ brands: next.length > 0 ? next : undefined });
  };

  return (
    <aside className={cn('bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-white/5 p-5 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-brand-primary dark:text-white">Filtreler</span>
        {hasActive && (
          <button onClick={clearAll} className="flex items-center gap-1 text-[10px] font-bold text-accent hover:underline">
            <X size={11} /> Temizle
          </button>
        )}
      </div>

      {/* Price Range */}
      <section>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mb-3">Fiyat Aralığı</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRICE_PRESETS.map(preset => {
            const active =
              filters.priceMin === preset.min &&
              (preset.max == null ? filters.priceMax == null : filters.priceMax === preset.max);
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setPriceMinInput(preset.min.toString());
                  setPriceMaxInput(preset.max?.toString() ?? '');
                  update({ priceMin: preset.min, priceMax: preset.max });
                }}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                  active
                    ? 'bg-accent text-white border-accent'
                    : 'border-brand-primary/10 dark:border-white/10 text-brand-primary/60 dark:text-white/60 hover:border-accent hover:text-accent'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMinInput}
            onChange={e => setPriceMinInput(e.target.value)}
            onBlur={applyPrice}
            className="w-full px-3 py-2 rounded-xl border border-brand-primary/10 dark:border-white/10 bg-transparent text-xs font-bold text-brand-primary dark:text-white outline-none focus:border-accent transition-colors"
          />
          <span className="text-brand-primary/30 dark:text-white/30 text-xs">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMaxInput}
            onChange={e => setPriceMaxInput(e.target.value)}
            onBlur={applyPrice}
            className="w-full px-3 py-2 rounded-xl border border-brand-primary/10 dark:border-white/10 bg-transparent text-xs font-bold text-brand-primary dark:text-white outline-none focus:border-accent transition-colors"
          />
        </div>
      </section>

      {/* Rating */}
      <section>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mb-3">Minimum Puan</p>
        <div className="flex gap-1.5 flex-wrap">
          {[4, 3, 2, 1].map(r => (
            <button
              key={r}
              onClick={() => update({ rating: filters.rating === r ? undefined : r })}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all',
                filters.rating === r
                  ? 'bg-amber-400 text-white border-amber-400'
                  : 'border-brand-primary/10 dark:border-white/10 text-brand-primary/60 dark:text-white/60 hover:border-amber-400 hover:text-amber-500'
              )}
            >
              <Star size={10} fill="currentColor" /> {r}+
            </button>
          ))}
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mb-3">Marka</p>
          <div className="space-y-1.5">
            {visibleBrands.map(brand => (
              <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.brands?.includes(brand) ?? false}
                  onChange={() => toggleBrand(brand)}
                  className="w-3.5 h-3.5 accent-accent rounded"
                />
                <span className="text-xs text-brand-primary/70 dark:text-white/70 group-hover:text-brand-primary dark:group-hover:text-white transition-colors truncate">
                  {brand}
                </span>
              </label>
            ))}
          </div>
          {brands.length > 8 && (
            <button
              onClick={() => setShowAllBrands(v => !v)}
              className="mt-2 flex items-center gap-1 text-[10px] font-bold text-accent hover:underline"
            >
              {showAllBrands ? <><ChevronUp size={11} /> Daha Az</> : <><ChevronDown size={11} /> +{brands.length - 8} Marka</>}
            </button>
          )}
        </section>
      )}

      {/* Checkboxes */}
      <section className="space-y-2">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={e => update({ inStock: e.target.checked || undefined })}
            className="w-3.5 h-3.5 accent-accent rounded"
          />
          <span className="text-xs text-brand-primary/70 dark:text-white/70 group-hover:text-brand-primary dark:group-hover:text-white transition-colors">
            Sadece Stokta Olanlar
          </span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!filters.freeShipping}
            onChange={e => update({ freeShipping: e.target.checked || undefined })}
            className="w-3.5 h-3.5 accent-accent rounded"
          />
          <span className="text-xs text-brand-primary/70 dark:text-white/70 group-hover:text-brand-primary dark:group-hover:text-white transition-colors">
            Ücretsiz Kargo
          </span>
        </label>
      </section>
    </aside>
  );
}
