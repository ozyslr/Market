'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
}

export function SearchBar() {
  const router = useRouter();
  const [query_str, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('mcr_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const qry = query(
        collection(db, 'products'),
        where('isActive', '==', true),
        orderBy('rating', 'desc'),
        limit(8),
      );
      const snap = await getDocs(qry);
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as SearchSuggestion))
        .filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query_str), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query_str, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSearch = (q?: string) => {
    const term = q ?? query_str;
    if (!term.trim()) return;
    // Save to recent
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    try { sessionStorage.setItem('mcr_recent_searches', JSON.stringify(updated)); } catch { /* ignore */ }
    setIsOpen(false);
    setQuery('');
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try { sessionStorage.removeItem('mcr_recent_searches'); } catch { /* ignore */ }
  };

  // Since this is used inside the navbar, we don't render a wrapper
  return (
    <div className="relative flex-1 max-w-xl" ref={panelRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query_str}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Search products... (Ctrl+K)"
          className="w-full border-2 border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200"
          aria-label="Search products"
        />
        <button
          onClick={() => handleSearch()}
          className="absolute right-0 top-0 h-full bg-purple-700 text-white px-3 rounded-r-lg hover:bg-purple-800 transition-colors"
          aria-label="Search"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Search size={18} />
          )}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (query_str.length >= 2 || recentSearches.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={12} /> Suggestions
              </div>
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => { router.push(`/product/${s.slug}`); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 text-left transition-colors"
                >
                  {s.image && (
                    <img src={s.image} alt={s.name} className="w-8 h-8 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">£{s.price.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && suggestions.length === 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} /> Recent
                </span>
                <button onClick={clearRecent} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
              </div>
              {recentSearches.map(s => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700 transition-colors"
                >
                  <Clock size={14} className="text-gray-400" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query_str.length >= 2 && suggestions.length === 0 && !loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No products found for &ldquo;{query_str}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
