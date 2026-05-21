'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'range' | 'radio';
  options: FilterOption[];
}

interface FilterPanelProps {
  groups: FilterGroup[];
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function FilterPanel({ groups, className = '', isMobileOpen, onMobileClose }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach(g => { initial[g.id] = true; });
    return initial;
  });
  const activeFilters = searchParams.get('filters')?.split(',') || [];

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get('filters')?.split(',').filter(Boolean) || [];
    const updated = current.includes(value)
      ? current.filter(f => f !== value)
      : [...current, value];
    if (updated.length > 0) {
      params.set('filters', updated.join(','));
    } else {
      params.delete('filters');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('filters');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <SlidersHorizontal size={16} />
          Filters
        </h3>
        {activeFilters.length > 0 && (
          <button onClick={clearAll} className="text-xs text-purple-700 hover:text-purple-800 font-medium">
            Clear all
          </button>
        )}
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map(f => (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
            >
              {f}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      {/* Filter groups */}
      {groups.map(group => (
        <div key={group.id} className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleGroup(group.id)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 hover:text-purple-700"
          >
            {group.label}
            {expandedGroups[group.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expandedGroups[group.id] && (
            <div className="space-y-1 mt-1">
              {group.options.map(opt => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type={group.type === 'radio' ? 'radio' : 'checkbox'}
                    checked={activeFilters.includes(opt.id)}
                    onChange={() => toggleFilter(opt.id)}
                    className="accent-purple-700"
                  />
                  <span className="text-gray-700 flex-1">{opt.label}</span>
                  {opt.count != null && (
                    <span className="text-xs text-gray-400">({opt.count})</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Mobile: render as overlay
  if (isMobileOpen) {
    return (
      <div className="fixed inset-0 z-50 md:hidden" onClick={onMobileClose}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <aside className={`hidden md:block w-64 flex-shrink-0 ${className}`}>
      {content}
    </aside>
  );
}
