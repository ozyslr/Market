import React from 'react';
import {
  X, ChevronRight, UserPlus, LogOut, Sun, Moon, Zap,
  Smartphone, Shirt, Home, Trophy, Sparkles, Car, Baby,
  UtensilsCrossed, Briefcase, Dog, BookOpen, Grid3X3,
  ShoppingBag, Heart, MessageSquare, User,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage, isRTL } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useNotifications } from '@/context/NotificationContext';
import { Category } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  electronics: Smartphone,
  fashion: Shirt,
  home: Home,
  sports: Trophy,
  beauty: Sparkles,
  automotive: Car,
  baby: Baby,
  food: UtensilsCrossed,
  office: Briefcase,
  pet: Dog,
  books: BookOpen,
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

/** Clamp a count to "99+" if it exceeds 99, else return its string form. */
const formatBadgeCount = (count: number): string | null =>
  count > 0 ? (count > 99 ? '99+' : String(count)) : null;

export function MobileMenu({ isOpen, onClose, categories, onOpenAuth }: MobileMenuProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { lang, setLang, availableLanguages } = useLanguage();
  const { itemCount: cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { unreadCount: notifUnreadCount } = useNotifications();

  const rtl = isRTL(lang);
  const offscreenX = rtl ? '100%' : '-100%';

  const cartBadge = formatBadgeCount(cartCount);
  const wishlistBadge = formatBadgeCount(wishlistCount);
  const notifBadge = formatBadgeCount(notifUnreadCount);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-primary/60 backdrop-blur-sm z-[10000]"
          />
          <motion.div
            id="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mobil menü"
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 start-0 bottom-0 w-full max-w-[320px] bg-white dark:bg-zinc-950 z-[10001] shadow-2xl flex flex-col"
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
          >
            <div className="p-6 bg-brand-primary text-white flex items-center justify-between">
              <Link to="/" onClick={onClose} className="flex items-center" aria-label="Benim Olan ana sayfa">
                <img src="/logo.png" alt="Benim Olan" className="h-7 w-auto object-contain brightness-0 invert" />
              </Link>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Menüyü kapat">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              {user ? (
                <div className="mb-8 p-4 bg-brand-secondary/20 dark:bg-zinc-900 rounded-2xl flex items-center gap-4 border border-brand-primary/5">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-black text-lg shrink-0">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-brand-primary/40 dark:text-white/40 tracking-widest">{t('nav.hello')},</p>
                    <p className="text-sm font-black dark:text-white truncate">{user.name}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-brand-primary/10 dark:hover:bg-white/10 transition-colors shrink-0"
                    aria-label={t('nav.my_account')}
                  >
                    <User size={18} className="text-brand-primary/40 dark:text-white/40" />
                  </Link>
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
                  <motion.div
                    className="grid grid-cols-1 gap-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {categories.filter(c => !c.parentId).map(cat => {
                      const IconComponent = CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS[cat.id] || Grid3X3;
                      return (
                        <motion.div key={cat.id} variants={itemVariants}>
                          <Link
                            to={`/category/${cat.id}`}
                            onClick={onClose}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-secondary dark:hover:bg-zinc-900 transition-colors group"
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <IconComponent size={18} className="text-brand-primary/40 dark:text-white/40 group-hover:text-accent transition-colors shrink-0" />
                              <span className="text-sm font-black dark:text-white truncate">{cat.name || t(`category.${cat.id}`)}</span>
                            </span>
                            <ChevronRight size={16} className={cn("shrink-0 text-brand-primary/20 group-hover:text-accent transition-colors", rtl && "rotate-180")} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-brand-primary/30 dark:text-white/30 tracking-[0.3em]">{t('nav.my_account')}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: t('nav.orders_list'), path: '/profile' },
                      { label: t('nav.orders'), path: '/profile' },
                      { label: t('nav.favorite'), path: '/profile' },
                      { label: t('footer.help'), path: '/' },
                      ...(user ? [{ label: t('nav.my_account') as string, path: '/profile' }] : []),
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
              {/* Quick Actions — cart, wishlist, notifications */}
              <div className="grid grid-cols-3 gap-2">
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="relative flex flex-col items-center gap-1 p-3 bg-brand-secondary/50 dark:bg-zinc-900 rounded-2xl hover:bg-brand-secondary dark:hover:bg-zinc-800 transition-colors"
                  aria-label={t('nav.cart')}
                >
                  <ShoppingBag size={20} className="text-brand-primary/60 dark:text-white/60" />
                  <span className="text-[10px] font-black uppercase text-brand-primary/40 dark:text-white/40">{t('nav.cart_short', 'Sepet')}</span>
                  {cartBadge && (
                    <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center">
                      {cartBadge}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="relative flex flex-col items-center gap-1 p-3 bg-brand-secondary/50 dark:bg-zinc-900 rounded-2xl hover:bg-brand-secondary dark:hover:bg-zinc-800 transition-colors"
                  aria-label={t('nav.favorite')}
                >
                  <Heart size={20} className="text-brand-primary/60 dark:text-white/60" />
                  <span className="text-[10px] font-black uppercase text-brand-primary/40 dark:text-white/40">{t('nav.favorite_short', 'Favori')}</span>
                  {wishlistBadge && (
                    <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                      {wishlistBadge}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="relative flex flex-col items-center gap-1 p-3 bg-brand-secondary/50 dark:bg-zinc-900 rounded-2xl hover:bg-brand-secondary dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Mesajlar"
                >
                  <MessageSquare size={20} className="text-brand-primary/60 dark:text-white/60" />
                  <span className="text-[10px] font-black uppercase text-brand-primary/40 dark:text-white/40">Mesaj</span>
                  {notifBadge && (
                    <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">
                      {notifBadge}
                    </span>
                  )}
                </Link>
              </div>

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
