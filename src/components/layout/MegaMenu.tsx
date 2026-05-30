import React from 'react';
import {
  Menu, ChevronRight, Zap, Package,
  Smartphone, Shirt, User, Home, ShoppingBasket, Sparkles, Baby, Dog, Mountain,
  BookOpen, Gamepad2, Car, Wrench, Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { Category } from '@/types';

function normCatName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9ğüşöçı]/g, '');
}

function getL3Items(subCat: Category): { name: string; query: string }[] {
  if (subCat.items && subCat.items.length > 0) return subCat.items;
  const idx = subCat.id.indexOf('__');
  if (idx !== -1) {
    const parentId = subCat.id.slice(0, idx);
    const groupSlug = subCat.id.slice(idx + 2);
    const parentCat = CATEGORIES.find(c => c.id === parentId);
    const group = parentCat?.subGroups?.find(
      g => g.name.toLowerCase().replace(/\s+/g, '_') === groupSlug
    );
    if (group?.items?.length) return group.items;
  }
  const parentId = subCat.parentId;
  if (!parentId) return [];
  const parentCat = CATEGORIES.find(c => c.id === parentId);
  if (!parentCat?.subGroups) return [];
  const n = normCatName(subCat.name);
  const group = parentCat.subGroups.find(g => {
    const gn = normCatName(g.name);
    return gn === n || gn.startsWith(n) || n.startsWith(gn);
  });
  return group?.items ?? [];
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Smartphone, Shirt, User, Home, ShoppingBasket, Sparkles, Baby, Dog, Mountain,
  BookOpen, Gamepad2, Car, Wrench, Briefcase,
};

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activeCategory: string | null;
  setActiveCategory: (id: string | null) => void;
}

export function MegaMenu({ isOpen, onClose, categories, activeCategory, setActiveCategory }: MegaMenuProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          className="absolute top-full start-0 end-0 bg-white dark:bg-zinc-950 border-t border-brand-primary/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] p-0 overflow-hidden z-[1000]"
          onMouseEnter={() => {}} // keep open
          onMouseLeave={onClose}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
          role="menu"
          aria-label="Kategori menüsü"
          onFocus={() => {}}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onClose(); }}
        >
          <div className="max-w-[1700px] mx-auto flex min-h-[550px]">
            {/* Left: Category Sidebar */}
            <div className="w-[300px] bg-zinc-50 dark:bg-zinc-900 border-e border-brand-primary/5 py-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/30 mb-4 px-8 underline underline-offset-8">{t('nav.categories_nav')}</h3>
              {categories.filter(c => !c.parentId).map(cat => {
                const IconComponent = ICON_MAP[cat.icon as string] || Package;
                return (
                  <button
                    key={cat.id}
                    onMouseEnter={() => setActiveCategory(cat.id)}
                    onFocus={() => setActiveCategory(cat.id)}
                    className={cn(
                      "w-full text-start px-8 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group",
                      activeCategory === cat.id
                        ? "bg-white dark:bg-zinc-950 text-accent border-e-4 border-accent"
                        : "text-brand-primary/60 hover:text-brand-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
                        <IconComponent size={14} className={activeCategory === cat.id ? "text-accent" : ""} />
                      </span>
                      {t(`category.${cat.id}`) !== `category.${cat.id}` ? t(`category.${cat.id}`) : cat.name}
                    </div>
                    <ChevronRight size={14} className={cn("transition-transform", activeCategory === cat.id ? "translate-x-1" : "opacity-0")} />
                  </button>
                );
              })}
            </div>

            {/* Middle: Subcategory Grid */}
            <div className="flex-1 p-12 bg-white dark:bg-zinc-950 overflow-y-auto no-scrollbar">
              {activeCategory ? (
                <div className="flex flex-col gap-12">
                  <div className="flex justify-between items-end border-b border-brand-primary/10 pb-4">
                    <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
                      {t(`category.${activeCategory}`) !== `category.${activeCategory}` ? t(`category.${activeCategory}`) : categories.find(c => c.id === activeCategory)?.name}
                    </h2>
                    <Link to={`/category/${activeCategory}`} onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 hover:underline">
                      {t('global.see_all')} <ChevronRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
                    {categories.filter(c => c.parentId === activeCategory).map(sub => {
                      const l3Items = getL3Items(sub);
                      return (
                        <div key={sub.id} className="space-y-3">
                          <Link
                            to={`/category/${sub.id}`}
                            onClick={onClose}
                            className="text-[11px] font-black uppercase tracking-widest text-brand-primary dark:text-white border-b border-brand-primary/10 dark:border-white/10 pb-2 mb-1 block hover:text-accent transition-colors"
                          >
                            {sub.name}
                          </Link>
                          <ul className="space-y-1.5">
                            {l3Items.map((item: { name: string; query: string }) => (
                              <li key={item.query}>
                                <Link
                                  to={`/category/${sub.id}?q=${encodeURIComponent(item.name)}`}
                                  onClick={onClose}
                                  className="text-[11px] font-medium text-brand-primary/60 dark:text-white/60 hover:text-accent transition-all inline-block hover:translate-x-1"
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                  {categories.find(c => c.id === activeCategory)?.image && (
                    <Link to={`/category/${activeCategory}`} onClick={onClose} className="mt-8 rounded-3xl overflow-hidden relative group h-[200px] cursor-pointer block border border-brand-primary/10 shadow-sm">
                      <img src={categories.find(c => c.id === activeCategory)?.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={categories.find(c => c.id === activeCategory)?.name || 'Category Promotion'} referrerPolicy="no-referrer" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8">
                        <span className="text-accent text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm">{t('home.new_arrivals') || 'New Collection'}</span>
                        <h3 className="text-white text-2xl font-display font-black uppercase italic tracking-tight">
                          {t(`category.${activeCategory}`) !== `category.${activeCategory}` ? t(`category.${activeCategory}`) : categories.find(c => c.id === activeCategory)?.name} Dünyasını Keşfet
                        </h3>
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <Menu size={48} className="mb-4" />
                  <p className="font-display font-black uppercase tracking-widest text-xl italic">{t('mega.select_category')}</p>
                </div>
              )}
            </div>

            {/* Right: Visual Banners */}
            <div className="w-[450px] bg-zinc-50 dark:bg-zinc-900 border-s border-brand-primary/5 p-8 overflow-y-auto no-scrollbar">
              {activeCategory && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/30 mb-4 px-2">
                    {t('nav.featured')} {categories.find(c => c.id === activeCategory)?.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {categories
                      .filter(c => c.parentId === activeCategory)
                      .slice(0, 4)
                      .map(sub => (
                        <Link
                          key={sub.id}
                          to={`/category/${sub.id}`}
                          onClick={onClose}
                          className="relative h-24 rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-brand-primary/5"
                        >
                          {sub.image ? (
                            <img
                              src={sub.image}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              alt={sub.name}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/5" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/70 to-transparent flex flex-col justify-center p-4">
                            <span className="text-[10px] font-black uppercase text-white tracking-[0.1em] opacity-90 group-hover:opacity-100 transition-opacity w-2/3 leading-tight">
                              {sub.name}
                            </span>
                          </div>
                        </Link>
                      ))}
                  </div>
                  <Link to={`/category/${activeCategory}`} onClick={onClose} className="mt-4 block relative rounded-[2rem] overflow-hidden h-48 shadow-lg group cursor-pointer">
                    <img
                      src={categories.find(c => c.id === activeCategory)?.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=600'}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={categories.find(c => c.id === activeCategory)?.name || 'Category Promo'}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-brand-primary/40 to-transparent p-6 flex flex-col justify-end text-white">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-1">{t('mega.regional_deal')}</span>
                      <h5 className="text-xl font-display font-black leading-tight uppercase italic mb-2">ESKİYİ YENİLE</h5>
                      <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                        Hemen İncele <Zap size={10} fill="currentColor" />
                      </span>
                    </div>
                  </Link>
                  {categories.find(c => c.id === activeCategory)?.brands && (
                    <div className="mt-6 pt-6 border-t border-brand-primary/5">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/30 mb-4 px-2">{t('nav.popular_brands')}</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {categories.find(c => c.id === activeCategory)?.brands?.map((brand, bIdx) => (
                          <div key={bIdx} className="bg-white dark:bg-zinc-800 p-2 rounded-xl border border-brand-primary/5 hover:border-accent transition-colors flex items-center justify-center">
                            <span className="text-[10px] font-bold text-center text-brand-primary/80 dark:text-white/80 truncate w-full px-1">{brand.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
