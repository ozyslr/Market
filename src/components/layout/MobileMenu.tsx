import React from 'react';
import { X, ChevronRight, UserPlus, LogOut, Sun, Moon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function MobileMenu({ isOpen, onClose, categories, onOpenAuth }: MobileMenuProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { lang, setLang, availableLanguages } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-primary/60 backdrop-blur-sm z-[10000]"
          />
          <motion.div
            id="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mobil menü"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 start-0 bottom-0 w-full max-w-[320px] bg-white dark:bg-zinc-950 z-[10001] shadow-2xl flex flex-col"
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
          >
            <div className="p-6 bg-brand-primary text-white flex items-center justify-between">
              <Link to="/" onClick={onClose} className="flex items-center gap-2">
                <Zap size={20} fill="currentColor" className="text-accent" />
                <span className="font-display font-black text-xl uppercase italic tracking-tighter">BENIM OLAN</span>
              </Link>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Menüyü kapat">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              {user ? (
                <div className="mb-8 p-4 bg-brand-secondary/20 dark:bg-zinc-900 rounded-2xl flex items-center gap-4 border border-brand-primary/5">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-black text-lg">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-brand-primary/40 dark:text-white/40 tracking-widest">{t('nav.hello')},</p>
                    <p className="text-sm font-black dark:text-white">{user.name}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 mb-8">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                  >
                    Giriş Yap <Zap size={14} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="flex-1 py-4 bg-brand-secondary dark:bg-zinc-800 text-brand-primary dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    Üye Ol <UserPlus size={14} />
                  </button>
                </div>
              )}

              <div className="space-y-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.3em]">{t('nav.categories_nav')}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {categories.filter(c => !c.parentId).map(cat => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-secondary dark:hover:bg-zinc-900 transition-colors group"
                      >
                        <span className="text-sm font-black dark:text-white">{cat.name || t(`category.${cat.id}`)}</span>
                        <ChevronRight size={16} className="text-brand-primary/20 group-hover:text-accent transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-brand-primary/30 dark:text-white/30 tracking-[0.3em]">{t('nav.my_account')}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: t('nav.orders_list'), path: '/profile' },
                      { label: t('nav.orders'), path: '/profile' },
                      { label: t('nav.favorite'), path: '/profile' },
                      { label: t('footer.help'), path: '/' },
                    ].map((link, idx) => (
                      <Link
                        key={idx}
                        to={link.path}
                        onClick={onClose}
                        className="block p-3 text-sm font-bold text-brand-primary/60 dark:text-white/60 hover:text-brand-primary dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-brand-primary/5 space-y-3">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-4 bg-brand-secondary/50 dark:bg-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest text-brand-primary dark:text-white"
              >
                Theme Switcher
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                {availableLanguages && availableLanguages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code as any)}
                    className={cn("flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors border whitespace-nowrap min-w-[80px]", lang === l.code ? "bg-brand-primary text-white border-transparent" : "bg-transparent text-brand-primary dark:text-white border-brand-primary/10")}
                  >
                    <span className="text-sm me-2">{l.flag}</span>
                    {l.code}
                  </button>
                ))}
              </div>
              {user && (
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full mt-4 p-4 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  Log Out <LogOut size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
