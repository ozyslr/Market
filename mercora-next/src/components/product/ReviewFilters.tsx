import React from 'react';
import { Search } from 'lucide-react';
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
  search: string;
  onSearch: (s: string) => void;
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

export function ReviewFilters({
  sort,
  filter,
  starFilter,
  onSort,
  onFilter,
  onStarFilter,
  total,
  filtered,
  search,
  onSearch,
}: Props) {
  return (
    <div className="space-y-3 py-4 border-y border-gray-200 dark:border-zinc-800">
      {/* Arama Barı */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Değerlendirmeler içinde ara..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs outline-none focus:ring-2 ring-accent/20 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Sıralama */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 w-12">Sırala:</span>
        {(Object.keys(SORT_LABELS) as SortOption[]).map(s => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              sort === s
                ? 'bg-accent text-white shadow-sm shadow-accent/20'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700',
            )}
          >
            {SORT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Filtrele */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 w-12">Filtre:</span>
        {(Object.keys(FILTER_LABELS) as FilterOption[]).map(f => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              filter === f
                ? 'bg-gray-900 dark:bg-white text-white dark:text-zinc-950'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700',
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
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700',
            )}
          >
            {star}★
          </button>
        ))}
      </div>

      {(filter !== 'all' || starFilter !== null || search.trim() !== '') && (
        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">
          {filtered} / {total} Yorum gösteriliyor
        </p>
      )}
    </div>
  );
}
