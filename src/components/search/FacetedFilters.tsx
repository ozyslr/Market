import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchFilters {
  categoryId?: string;
  brand?: string[];
  priceMin?: number;
  priceMax?: number;
  rating?: number;
}

interface Props {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
  categories?: { id: string; name: string }[];
  className?: string;
}

export function FacetedFilters({ filters, onChange, categories, className }: Props) {
  const hasFilters =
    filters.categoryId ||
    (filters.brand?.length ?? 0) > 0 ||
    filters.rating ||
    filters.priceMin ||
    filters.priceMax;
  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Filtrele</h3>
        {hasFilters && (
          <button
            onClick={() => onChange({})}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
          >
            <X size={12} />
            Temizle
          </button>
        )}
      </div>
      {categories && categories.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Kategori</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  onChange({
                    ...filters,
                    categoryId: filters.categoryId === cat.id ? undefined : cat.id,
                  })
                }
                className={cn(
                  'flex items-center justify-between w-full text-left px-2 py-1 rounded text-sm',
                  filters.categoryId === cat.id
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-zinc-300 hover:bg-zinc-700/50',
                )}
              >
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Fiyat Aralığı</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full bg-zinc-800 text-white text-sm rounded border border-zinc-700 px-2 py-1.5 outline-none focus:border-emerald-500"
          />
          <span className="text-zinc-500">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full bg-zinc-800 text-white text-sm rounded border border-zinc-700 px-2 py-1.5 outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Puan</h4>
        {[4, 3, 2, 1].map((v) => (
          <button
            key={v}
            onClick={() => onChange({ ...filters, rating: filters.rating === v ? undefined : v })}
            className={cn(
              'block w-full text-left px-2 py-1 rounded text-sm',
              filters.rating === v
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'text-zinc-300 hover:bg-zinc-700/50',
            )}
          >
            {'★'.repeat(v)}
            {'☆'.repeat(5 - v)}
          </button>
        ))}
      </div>
    </div>
  );
}
