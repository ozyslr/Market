import React from 'react';
import { cn } from '@/lib/utils';

export type SortOption = 'newest' | 'helpful' | 'highest' | 'lowest';
export type FilterOption = 'all' | 'photos' | 'verified';

interface Props {
  sort: SortOption;
  filter: FilterOption;
  starFilter: number | null;
  onSort: (s: SortOption) => void;
  onFilter: (f: FilterOption) => void;
  onStarFilter: (star: number | null) => void;
  total: number;
  filtered: number;
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'En Yeni',
  helpful: 'En Yararlı',
  highest: 'En Yüksek',
  lowest: 'En Düşük',
};

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'Tümü',
  photos: 'Fotoğraflı',
  verified: 'Onaylı Alıcı',
};

export function ReviewFilters({ sort, filter, starFilter, onSort, onFilter, onStarFilter, total, filtered }: Props) {
  return (
    <div className="space-y-3 py-4 border-y border-brand-primary/5">
      {/* Sıralama */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 w-12">Sırala:</span>
        {(Object.keys(SORT_LABELS) as SortOption[]).map(s => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              sort === s
                ? 'bg-accent text-white shadow-sm shadow-accent/20'
                : 'bg-brand-secondary/50 text-brand-primary/50 hover:bg-brand-secondary',
            )}
          >
            {SORT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Filtrele */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 w-12">Filtre:</span>
        {(Object.keys(FILTER_LABELS) as FilterOption[]).map(f => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              filter === f
                ? 'bg-brand-primary text-white'
                : 'bg-brand-secondary/50 text-brand-primary/50 hover:bg-brand-secondary',
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
        {[5, 4, 3, 2, 1].map(star => (
          <button
            key={star}
            onClick={() => onStarFilter(starFilter === star ? null : star)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              starFilter === star
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-brand-secondary/50 text-brand-primary/50 hover:bg-brand-secondary',
            )}
          >
            {star}★
          </button>
        ))}
      </div>

      {(filter !== 'all' || starFilter !== null) && (
        <p className="text-[10px] font-bold text-brand-primary/40">
          {filtered} / {total} yorum gösteriliyor
        </p>
      )}
    </div>
  );
}
