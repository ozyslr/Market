import React, { useState } from 'react';
import { Search, ArrowRight, TrendingUp, Smartphone, Coffee, Package, Clock, Zap, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MOCK_PRODUCTS } from '@/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { searchProducts } from '@/services/searchService';
import { OptimizedImage } from '@/components/common/OptimizedImage';

export function SearchBar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof MOCK_PRODUCTS>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 h-full flex items-center relative" role="search" aria-label="Ürün ara">
      <input
        type="text"
        placeholder={t('nav.search_placeholder')}
        aria-label={t('nav.search_placeholder') || 'Ürün ara'}
        value={searchQuery}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
        onChange={e => {
          const val = e.target.value;
          setSearchQuery(val);
          setSuggestions(searchProducts(val));
        }}
        className="w-full h-full px-4 pr-14 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 border border-brand-primary/10 text-brand-primary dark:text-white placeholder:text-brand-primary/40 focus:border-accent focus:shadow-[0_0_20px_rgba(109,40,217,0.15)] outline-none transition-all"
      />

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {isSearchFocused && (searchQuery.length > 0 || suggestions.length > 0) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-primary/5 z-[998]"
              onClick={() => setIsSearchFocused(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-950 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl border border-brand-primary/5 p-6 z-[1000] overflow-hidden"
            >
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-brand-primary/5 pb-6 md:pb-0 md:pr-8">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp size={14} className="text-accent" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{t('search.popular')}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { text: 'iPhone 15 Pro', icon: Smartphone },
                        { text: 'Samsung S24', icon: Smartphone },
                        { text: 'Stanley Cup', icon: Coffee },
                        { text: 'Lego Icons', icon: Package },
                        { text: 'Air Fryer', icon: Zap },
                        { text: 'Smart Watch', icon: Clock },
                      ].map((item) => (
                        <button
                          key={item.text}
                          onMouseDown={() => {
                            setSearchQuery(item.text);
                            navigate(`/search?q=${encodeURIComponent(item.text)}`);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-brand-secondary hover:bg-accent group rounded-xl transition-all text-left"
                        >
                          <item.icon size={12} className="text-brand-primary/30 group-hover:text-white transition-colors" />
                          <span className="text-[10px] font-bold text-brand-primary group-hover:text-white transition-colors truncate">{item.text}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-8 p-4 bg-brand-secondary/50 rounded-2xl border border-brand-primary/5">
                      <p className="text-[9px] font-black uppercase text-brand-primary/30 mb-2">{t('search.featured_category')}</p>
                      <Link to="/search?categoryId=electronics" className="flex items-center justify-between group">
                        <span className="text-xs font-black uppercase italic text-brand-primary group-hover:text-accent transition-colors">{t('category.electronics')}</span>
                        <ArrowRight size={14} className="text-accent group-hover:translate-x-1 transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-span-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-4">{t('search.products')}</h4>
                  <div className="space-y-3">
                    {(suggestions.length > 0 ? suggestions : MOCK_PRODUCTS.slice(0, 4)).map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-brand-secondary transition-all group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden border border-brand-primary/5 shrink-0 p-1">
                          <OptimizedImage
                            src={p.images[0]}
                            alt={p.title}
                            className="w-full h-full object-contain"
                            containerClassName="w-full h-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black truncate text-brand-primary dark:text-white uppercase leading-tight">{p.title}</p>
                          <p className="text-[10px] font-bold text-accent">{p.currency} {p.price}</p>
                        </div>
                        <ArrowRight size={14} className="text-brand-primary/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Link
        to="/visual-search"
        className="absolute right-14 h-full px-3 flex items-center justify-center text-brand-primary/30 hover:text-accent transition-colors"
        aria-label="Görsel ile ara"
      >
        <Camera size={18} strokeWidth={2} />
      </Link>
      <button type="submit" className="absolute right-0 h-full px-6 bg-accent rounded-r-xl text-white hover:bg-accent-dark transition-all flex items-center justify-center shadow-lg shadow-accent/20">
        <Search size={22} strokeWidth={3} />
      </button>
    </form>
  );
}
