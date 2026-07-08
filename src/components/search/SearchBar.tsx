import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { searchProducts } from '../../services/typesenseService';
import { useLanguage } from '../../context/LanguageContext';

interface SearchBarProps {
  className?: string;
  onSearch?: (query: string) => void;
  variant?: 'navbar' | 'page';
}

export function SearchBar({ className, onSearch, variant = 'page' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { lang } = useLanguage();

  const handleSuggest = useCallback(
    async (q: string) => {
      if (!q || q.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const result = await searchProducts(q, undefined, lang, '_text_match:desc', 1, 5);
        setSuggestions(result.hits || []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [lang],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSuggest(val), 300);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      onSearch?.(query.trim());
    }
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      )
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search
          size={variant === 'navbar' ? 16 : 18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={variant === 'navbar' ? 'Ürün ara...' : 'Ürün, marka veya kategori ara...'}
          className={cn(
            'w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-lg border border-zinc-700',
            'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none',
            variant === 'navbar' ? 'pl-9 pr-8 py-1.5 text-sm' : 'pl-11 pr-10 py-3 text-base',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setShowDropdown(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={variant === 'navbar' ? 14 : 16} />
            )}
          </button>
        )}
      </form>
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
        >
          {suggestions.map((hit: any, i: number) => {
            const doc = hit.document || hit;
            return (
              <button
                key={doc.id || i}
                onClick={() => {
                  setShowDropdown(false);
                  window.location.href = `/product/${doc.id || hit.id}`;
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-zinc-700/50 border-b border-zinc-700/50 last:border-b-0"
              >
                {doc.imageUrl && (
                  <img
                    src={doc.imageUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover bg-zinc-700 flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p
                    className="text-sm text-white truncate"
                    dangerouslySetInnerHTML={{ __html: hit.highlights?.[0]?.snippet || doc.title }}
                  />
                  <p className="text-xs text-zinc-400">
                    {doc.price != null ? `₺${Number(doc.price).toFixed(2)}` : ''}
                    {doc.brand ? ` · ${doc.brand}` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
