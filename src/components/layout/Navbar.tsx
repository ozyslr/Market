import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, User, Globe, Menu, X, ChevronDown,
  Package, ShieldCheck, Shield, Zap, ArrowRight, Star, MapPin,
  Heart, CreditCard, LogOut, ChevronRight, TrendingUp,
  Sun, Moon, LayoutDashboard, Wallet, ArrowUpRight, Briefcase,
  Smartphone, Shirt, Home, ShoppingBasket, Sparkles, Baby, Dog, Mountain, Coffee, Clock,
  BookOpen, Gamepad2, Car, Wrench,
  Mail, Lock, Eye, EyeOff, UserPlus, Bell, CheckCheck
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MOCK_PRODUCTS, CATEGORIES } from '@/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

import { getCategories } from '@/services/productService';
import { searchProducts } from '@/services/searchService';
import { Category } from '@/types';
import { useLocationStore } from '@/context/LocationContext';
import { LocationModal } from '@/components/layout/LocationModal';

function normCatName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9ğüşöçı]/g, '');
}

function getL3Items(subCat: Category): { name: string; query: string }[] {
  // 1. Firestore'da items varsa önce kullan
  if (subCat.items && subCat.items.length > 0) return subCat.items;

  // 2. Seeded kategoriler: parentId__slug formatı
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

  // 3. Manuel eklenen kategoriler: parentId + isim benzerliği
  const parentId = subCat.parentId;
  if (!parentId) return [];
  const parentCat = CATEGORIES.find(c => c.id === parentId);
  if (!parentCat?.subGroups) return [];
  const norm = normCatName(subCat.name);
  const group = parentCat.subGroups.find(g => {
    const gn = normCatName(g.name);
    return gn === norm || gn.startsWith(norm) || norm.startsWith(gn);
  });
  return group?.items ?? [];
}

export function Navbar() {
  const { lang, setLang, t, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, login, loginWithEmail, registerWithEmail, logout } = useAuth();
  const { itemCount } = useCart();
  const { selectedLocation, isLocationModalOpen, setIsLocationModalOpen } = useLocationStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(authEmail, authPassword);
      } else {
        if (!authName.trim()) { setAuthError(t('auth.error.nameRequired')); setAuthLoading(false); return; }
        await registerWithEmail(authEmail, authName.trim(), authPassword);
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError(t('auth.error.invalidCredentials'));
      } else if (code === 'auth/email-already-in-use') {
        setAuthError(t('auth.error.emailInUse'));
      } else if (code === 'auth/weak-password') {
        setAuthError(t('auth.error.weakPassword'));
      } else {
        setAuthError(t('auth.error.generic'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof MOCK_PRODUCTS>([]);
  const { notifications, unreadCount, markRead, markAllAsRead } = useNotifications();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(data => { setCategories(data); });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Global Status Ticker (Topmost Bar) */}
      <div className="bg-brand-secondary text-[9px] text-brand-primary/40 h-8 flex items-center overflow-hidden border-b border-brand-primary/5">
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              <span className="font-black uppercase tracking-widest text-brand-primary/40">London {t('nav.hub_active')}</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
               <span className="font-black uppercase tracking-widest text-brand-primary/40">Istanbul {t('nav.hub_active')}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
               <TrendingUp size={12} className="text-accent" />
               <span className="font-black uppercase tracking-widest">{t('nav.market_index')}: +1.24%</span>
            </div>
          </div>
          <div className="flex items-center gap-6 font-black uppercase tracking-widest">
            <span className="hidden sm:inline">{t('nav.tax_id')}: MCR-2026-X</span>
            <span className="text-accent">{t('nav.global_support')}: +44 20 7946 0958</span>
          </div>
        </div>
      </div>

      {/* Top Header Section (Amazon Style Search Centric) */}
      <div className={cn(
        "transition-all duration-300 border-b border-brand-primary/5 bg-white dark:bg-zinc-950",
        isScrolled ? "shadow-xl py-3" : "py-4"
      )}>
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 flex items-center gap-8">
          
          {/* Hamburger Menu (Mobile Only) */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 rounded-lg transition-all text-brand-primary dark:text-white"
          >
            <Menu size={24} />
          </button>

            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-xl flex items-center justify-center text-white rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-accent/20">
                <Zap size={20} className="sm:size-[24px]" fill="currentColor" />
              </div>
              <span className="font-display font-bold text-xl sm:text-3xl tracking-tighter uppercase italic text-brand-primary dark:text-white">Mercora</span>
            </Link>
  
            {/* Mobile Header Icons (Right side) */}
            <div className="flex sm:hidden items-center gap-1 md:gap-3 ml-auto">
               <div className="flex items-center gap-1 xl:gap-2 mr-2">
                  <div className="relative p-2" onClick={() => setIsMenuOpen(true)}>
                     <Globe size={20} className="text-brand-primary dark:text-white" />
                     <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">{lang.toUpperCase()}</span>
                  </div>
               </div>

               <Link to="/cart" className="relative p-2">
                 <ShoppingBag size={22} className="text-brand-primary dark:text-white" />
                 <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">3</span>
               </Link>
            </div>
          
          {/* Search Bar (Big & Bold) - Hidden on very small screens, or full width */}
          <div className="flex-1 max-w-4xl h-11 group hidden sm:flex items-center gap-3">
            {/* Location Selector (Iconic Hepsiburada Feature) */}
            <div 
              onClick={() => setIsLocationModalOpen(true)}
              className="flex flex-col px-3 py-1 bg-brand-secondary/50 dark:bg-zinc-900 border border-brand-primary/5 rounded-xl cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all whitespace-nowrap min-w-[140px] text-brand-primary dark:text-white"
            >
               <div className="flex items-center gap-1 opacity-60">
                 <MapPin size={10} className="text-accent" />
                 <span className="text-[8px] font-black uppercase tracking-widest">{t('nav.location_select')}</span>
                 <ChevronDown size={10} />
               </div>
               <div className="text-[10px] font-black uppercase tracking-tighter truncate">{selectedLocation}</div>
            </div>

            <form onSubmit={handleSearch} className="flex-1 h-full flex items-center relative">
              <input 
                type="text" 
                placeholder={t('nav.search_placeholder')}
                value={searchQuery}
                onFocus={() => { setIsSearchFocused(true); }}
                onBlur={() => { setTimeout(() => setIsSearchFocused(false), 200); }}
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
                       {/* Popular Searches / Autocomplete */}
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
                               { text: 'Smart Watch', icon: Clock }
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
                                <span className="text-xs font-black uppercase italic italic text-brand-primary group-hover:text-accent transition-colors">{t('category.electronics')}</span>
                                <ArrowRight size={14} className="text-accent group-hover:translate-x-1 transition-all" />
                             </Link>
                          </div>
                          </div>
                       </div>

                       {/* Recommended Products */}
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
                                   <img 
                                     src={p.images[0]} 
                                     alt={p.title} 
                                     className="w-full h-full object-contain" 
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

              <button type="submit" className="absolute right-0 h-full px-6 bg-accent rounded-r-xl text-white hover:bg-accent-dark transition-all flex items-center justify-center shadow-lg shadow-accent/20">
                <Search size={22} strokeWidth={3} />
              </button>
            </form>
          </div>

          {/* User & Global Hub */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0 ml-auto">
             {/* Theme Toggle */}
             <button 
               onClick={toggleTheme}
               className="p-2 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent flex items-center justify-center text-brand-primary dark:text-white"
               title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
             >
               {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>

             {/* Language Dropdown */}
             <div className="relative group p-2 rounded-xl cursor-pointer hidden sm:flex items-center justify-center text-brand-primary dark:text-white hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors">
                <Globe size={20} className="group-hover:text-accent transition-colors" />
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-accent/20 uppercase">{lang}</span>
                {/* Dropdown Content */}
                <div className="absolute top-[calc(100%)] right-0 w-48 bg-white dark:bg-zinc-950 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl border border-brand-primary/10 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all group-hover:translate-y-0 z-[10000]">
                   <div className="px-3 py-2 border-b border-brand-primary/5 dark:border-white/5 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40">Dil / Language</span>
                   </div>
                   {availableLanguages && availableLanguages.map((l) => (
                     <button 
                       key={l.code}
                       onClick={() => setLang(l.code as any)} 
                       className={cn("w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between group/lang", lang === l.code ? "bg-accent/10 text-accent" : "hover:bg-brand-secondary dark:hover:bg-zinc-900 text-brand-primary border-transparent dark:text-white")}
                     >
                        <div className="flex items-center gap-3">
                           <span className="text-lg">{l.flag}</span>
                           <span>{l.name}</span>
                        </div>
                        {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>}
                     </button>
                   ))}
                </div>
             </div>

             {/* Favorilerim */}
             <Link to="/profile" className="hidden lg:flex items-center gap-2 group p-2 hover:text-mercora-red transition-colors text-brand-primary dark:text-white">
                <Heart size={20} className="group-hover:-translate-y-1 transition-transform" />
                <span className="text-xs font-bold whitespace-nowrap">Favorilerim</span>
             </Link>

             {/* Hesabım Dropdown */}
              <div className="relative group p-2 rounded-lg transition-all hover:text-mercora-red cursor-pointer hidden sm:flex text-brand-primary dark:text-white items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2">
                  <User size={20} className="group-hover:-translate-y-1 transition-transform" />
                  <div className="hidden xl:flex flex-col">
                    {user ? (
                      <span className="text-[10px] opacity-70 leading-none">Hoş geldin, {user.name.split(' ')[0]}</span>
                    ) : null}
                    <span className="text-xs font-bold leading-none mt-0.5">Hesabım</span>
                  </div>
                </Link>
                {/* Advanced Account Mega Dropdown Overlay */}
                <div className="absolute top-[calc(100%)] right-0 w-[460px] bg-white dark:bg-zinc-950 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[2.5rem] border border-brand-primary/10 p-8 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all group-hover:translate-y-0 text-brand-primary dark:text-white cursor-auto z-[10000] pointer-events-none group-hover:pointer-events-auto">
                  {user ? (
                    <div className="flex flex-col gap-6">
                      {/* User Header with Level */}
                      <Link to="/profile" className="flex items-center gap-5 p-5 bg-gradient-to-br from-brand-secondary/50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-brand-primary/5 dark:border-white/5 rounded-3xl relative overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[40px] -mr-16 -mt-16" />
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-16 h-16 rounded-3xl object-cover shadow-[0_10px_20px_-10px_rgba(249,66,58,0.5)] relative z-10 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-tr from-mercora-red to-yellow-500 rounded-3xl flex items-center justify-center text-white font-display font-black text-2xl shadow-[0_10px_20px_-10px_rgba(249,66,58,0.5)] relative z-10 shrink-0">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 relative z-10">
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-lg leading-none">{user.name}</h4>
                             <span className="px-2 py-0.5 bg-brand-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg">Elite</span>
                          </div>
                          <p className="text-xs opacity-60 line-clamp-1 mb-2">{user.email}</p>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 h-1.5 bg-brand-primary/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full w-[70%]" />
                             </div>
                             <span className="text-[9px] font-bold text-brand-primary/60">3.5k Puan</span>
                          </div>
                        </div>
                      </Link>

                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 rounded-2xl bg-brand-primary text-white group/stat cursor-pointer custom-hover-effect">
                            <div className="flex justify-between items-start mb-2">
                               <Wallet size={16} className="text-accent group-hover/stat:rotate-12 transition-transform" />
                               <ArrowUpRight size={14} className="text-white/40" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">Cüzdan Bakiyesi</span>
                            <span className="text-xl font-display font-black">2.450,00 ₺</span>
                         </div>
                         <div className="p-4 rounded-2xl border border-brand-primary/10 dark:border-white/10 hover:border-accent hover:bg-accent/5 transition-colors group/stat cursor-pointer flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                               <Package size={16} className="text-brand-primary dark:text-white group-hover/stat:text-accent transition-colors" />
                               <span className="w-5 h-5 bg-mercora-red text-white rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 block mb-1">Aktif Sipariş</span>
                            <span className="text-xs font-bold leading-tight">Yarın Teslim Edilecek</span>
                         </div>
                      </div>

                      {/* Advanced Options Grid */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-2 border-t border-brand-primary/5">
                        <div className="flex flex-col gap-3">
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary/30 dark:text-white/30 flex items-center gap-1.5">
                              <ShoppingBag size={12} /> Alışveriş
                           </span>
                           <Link to="/profile?tab=orders" className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link">
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> Tüm Siparişlerim
                           </Link>
                           <Link to="/profile?tab=returns" className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link">
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> İade Taleplerim
                           </Link>
                           <Link to="/profile?tab=reviews" className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link">
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> Değerlendirmelerim
                           </Link>
                        </div>
                        <div className="flex flex-col gap-3">
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary/30 dark:text-white/30 flex items-center gap-1.5">
                              <Heart size={12} /> Listelerim
                           </span>
                           <Link to="/profile?tab=favorites" className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link">
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> Favorilerim
                           </Link>
                           <Link to="/profile?tab=collections" className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link">
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> Öğrenci İndirimleri
                           </Link>
                           <Link to="/profile?tab=coupons" className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link">
                              <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> Kuponlarım
                           </Link>
                        </div>
                      </div>

                      {/* Specialist Sections */}
                      <div className="flex flex-col gap-2 mt-2 bg-brand-secondary/30 dark:bg-zinc-800/30 p-4 rounded-2xl border border-brand-primary/5">
                         <span className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary/60 dark:text-white/60 mb-2">Uzman Portalları</span>
                         <div className="grid grid-cols-2 gap-3">
                            {(user.email.includes('admin') || user.email === 'ozyslr@gmail.com') && (
                              <Link to="/admin" className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:scale-105 transition-transform flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Zap size={14} /></div>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold">Admin Paneli</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Sistem</span>
                                 </div>
                              </Link>
                            )}
                            {user.role === 'moderator' && (
                              <Link to="/moderator" className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:scale-105 transition-transform flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Shield size={14} /></div>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold">Moderatör</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Panel</span>
                                 </div>
                              </Link>
                            )}
                            <Link to="/seller/dashboard" className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:scale-105 transition-transform flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Briefcase size={14} /></div>
                               <div className="flex flex-col">
                                  <span className="text-xs font-bold">Satıcı Paneli</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Mağaza</span>
                               </div>
                            </Link>
                         </div>
                      </div>

                      <div className="border-t border-brand-primary/5 dark:border-white/5 pt-4 flex items-center gap-4">
                        <Link to="/profile?tab=settings" className="flex-1 py-3 text-center bg-zinc-50 dark:bg-zinc-900 text-brand-primary dark:text-white rounded-xl font-bold text-xs hover:bg-zinc-100 transition-colors">
                           Ayarlar
                        </Link>
                        <button onClick={logout} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors" aria-label="Çıkış Yap">
                          <LogOut size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Promo or Welcome Section */}
                      <div className="bg-gradient-to-r from-mercora-red to-orange-500 rounded-xl p-4 text-white">
                        <h4 className="font-bold text-sm mb-1">Hesabınıza Giriş Yapın</h4>
                        <p className="text-xs opacity-90 mb-4">Size özel kampanyalardan ve indirimlerden faydalanın.</p>
                        <button onClick={() => openAuth('login')} className="w-full py-3 bg-white dark:bg-zinc-800 text-mercora-red rounded-xl font-black text-sm shadow-md hover:scale-105 transition-transform">
                          Giriş Yap
                        </button>
                      </div>
                      <button onClick={() => openAuth('register')} className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 text-brand-primary dark:text-white border border-brand-primary/10 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        Üye Ol
                      </button>

                      <div className="grid grid-cols-2 gap-4 mt-2 border-t border-brand-primary/5 pt-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center"><Package size={14} /></div>
                            <span className="text-[10px] font-bold leading-tight">Sipariş<br/>Takibi</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center"><Heart size={14} /></div>
                            <span className="text-[10px] font-bold leading-tight">Favori<br/>Ürünler</span>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
             </div>

             {/* Bildirimler */}
             {user && (
               <div className="relative hidden sm:block">
                 <button
                   onClick={() => setShowNotifPanel(p => !p)}
                   className="relative p-2 rounded-lg hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors text-brand-primary dark:text-white"
                   aria-label="Bildirimler"
                 >
                   <Bell size={20} />
                   {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 w-4 h-4 bg-mercora-red text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm">
                       {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                   )}
                 </button>
                 <AnimatePresence>
                   {showNotifPanel && (
                     <>
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="fixed inset-0 z-[9998]"
                         onClick={() => setShowNotifPanel(false)}
                       />
                       <motion.div
                         initial={{ opacity: 0, y: 8, scale: 0.97 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 8, scale: 0.97 }}
                         transition={{ duration: 0.15 }}
                         className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white dark:bg-zinc-950 border border-brand-primary/10 dark:border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] z-[9999] overflow-hidden"
                       >
                         <div className="flex items-center justify-between px-4 py-3 border-b border-brand-primary/5 dark:border-white/5">
                           <span className="text-xs font-black uppercase tracking-widest text-brand-primary dark:text-white">Bildirimler</span>
                           {unreadCount > 0 && (
                             <button
                               onClick={() => markAllAsRead()}
                               className="flex items-center gap-1 text-[10px] font-bold text-accent hover:underline"
                             >
                               <CheckCheck size={12} /> Tümünü Oku
                             </button>
                           )}
                         </div>
                         <div className="max-h-80 overflow-y-auto divide-y divide-brand-primary/5 dark:divide-white/5">
                           {notifications.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-10 gap-2 text-brand-primary/40 dark:text-white/40">
                               <Bell size={28} strokeWidth={1.5} />
                               <p className="text-xs font-bold">Bildirim yok</p>
                             </div>
                           ) : (
                             notifications.map(n => (
                               <button
                                 key={n.id}
                                 onClick={() => {
                                   if (!n.read) markRead(n.id);
                                   if (n.link) { navigate(n.link); setShowNotifPanel(false); }
                                 }}
                                 className={`w-full text-left px-4 py-3 hover:bg-brand-secondary/50 dark:hover:bg-zinc-900 transition-colors flex items-start gap-3 ${!n.read ? 'bg-accent/5' : ''}`}
                               >
                                 <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-accent' : 'bg-transparent'}`} />
                                 <div className="flex-1 min-w-0">
                                   <p className="text-[11px] font-bold text-brand-primary dark:text-white leading-tight">{n.title}</p>
                                   <p className="text-[10px] text-brand-primary/60 dark:text-white/60 mt-0.5 leading-tight">{n.message}</p>
                                 </div>
                               </button>
                             ))
                           )}
                         </div>
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
               </div>
             )}

             {/* Sepetim */}
             <Link to="/cart" className="relative group p-2 hover:bg-mercora-red/5 rounded-lg flex items-center gap-2 transition-colors">
                <div className="relative text-brand-primary dark:text-white group-hover:text-mercora-red transition-colors">
                   <ShoppingBag size={22} className="group-hover:-translate-y-1 transition-transform" />
                   {itemCount > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-mercora-red text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">{itemCount}</span>
                   )}
                </div>
                <div className="hidden lg:block leading-none">
                   <span className="text-xs font-bold text-brand-primary dark:text-white whitespace-nowrap group-hover:text-mercora-red transition-colors">Sepetim</span>
                </div>
             </Link>
          </div>
        </div>

        {/* Mobile Search Bar & Location (Only visible on mobile) */}
        <div className="px-4 pb-3 sm:hidden transition-all duration-300 bg-white dark:bg-zinc-950">
           <div className="flex items-center gap-2 mb-3">
              <div 
                onClick={() => setIsLocationModalOpen(true)}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold border whitespace-nowrap overflow-hidden transition-all bg-brand-secondary/30 border-brand-primary/5 text-brand-primary dark:text-white"
              >
                 <MapPin size={14} className="text-accent shrink-0" />
                 <span className="truncate">{selectedLocation}</span>
                 <ChevronRight size={14} className="ml-auto opacity-40 shrink-0" />
              </div>
           </div>

           <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                placeholder={t('nav.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 px-4 pr-12 rounded-xl text-sm font-black transition-all outline-none border shadow-sm bg-white dark:bg-zinc-900 border-brand-primary/10 text-brand-primary dark:text-white placeholder:text-brand-primary/40"
              />
              <button type="submit" className="absolute right-0 h-full px-4 text-accent">
                <Search size={18} strokeWidth={3} />
              </button>
           </form>
        </div>
      </div>

      {/* Secondary Ribbon (Hepsiburada Style Categories) */}
      <div className={cn(
        "transition-all duration-300 py-2.5 hidden sm:block",
        "bg-white dark:bg-zinc-900 border-b border-brand-primary/10 text-brand-primary dark:text-white/80"
      )}>
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 flex items-center justify-between">
           <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button 
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-accent transition-colors shrink-0 z-[1000]"
              >
                <Menu size={18} /> {t('nav.all_categories')}
              </button>
              {[
                { name: t('nav.deals'),           path: '/collection/deals' },
                { name: t('home.best_sellers'),   path: '/collection/best-sellers' },
                { name: 'Yeni Gelenler',           path: '/collection/new-arrivals' },
                { name: 'Flash Fırsatları',        path: '/collection/flash-deals' },
                { name: 'Öne Çıkanlar',            path: '/collection/featured' },
                { name: 'Mercora Prime',           path: '/search?delivery=prime' },
                { name: 'Gift Finder',             path: '/search?tag=gift' },
              ].map((item, i) => (
                <Link key={i} to={item.path} className="text-[10px] font-black uppercase tracking-widest hover:text-accent transition-all hidden md:block opacity-60 hover:opacity-100">
                  {item.name}
                </Link>
              ))}
           </div>
           <div className="hidden xl:flex items-center gap-6">
              <Link to="/sell" className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 group">
                 <LayoutDashboard size={14} className="group-hover:rotate-12 transition-transform" /> {t('nav.sell')}
              </Link>
           </div>
        </div>
      </div>

      {/* Mega Menu Overlay - Complete Visual Overhaul */}
      <AnimatePresence>
        {isMegaMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-950 border-t border-brand-primary/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] p-0 overflow-hidden z-[1000]"
            onMouseEnter={() => setIsMegaMenuOpen(true)}
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <div className="max-w-[1700px] mx-auto flex min-h-[550px]">
              {/* Left Column: Sidebar with hover switching */}
              <div className="w-[300px] bg-zinc-50 dark:bg-zinc-900 border-r border-brand-primary/5 py-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/30 mb-4 px-8 underline underline-offset-8">{t('nav.categories_nav')}</h3>
                {categories.filter(c => !c.parentId).map(cat => {
                  const IconComponent = {
                    Smartphone, Shirt, User, Home, ShoppingBasket, Sparkles, Baby, Dog, Mountain,
                    BookOpen, Gamepad2, Car, Wrench, Briefcase,
                  }[cat.icon as string] || Package;

                  return (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setActiveCategory(cat.id)}
                      className={cn(
                        "w-full text-left px-8 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group",
                        activeCategory === cat.id 
                          ? "bg-white dark:bg-zinc-950 text-accent border-r-4 border-accent" 
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

              {/* Middle Column: Detailed Sub-links Grid with Images (Image 2/3 Style) */}
              <div className="flex-1 p-12 bg-white dark:bg-zinc-950 overflow-y-auto no-scrollbar">
                {activeCategory ? (
                   <div className="flex flex-col gap-12">
                      <div className="flex justify-between items-end border-b border-brand-primary/10 pb-4">
                         <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
                            {t(`category.${activeCategory}`) !== `category.${activeCategory}` ? t(`category.${activeCategory}`) : categories.find(c => c.id === activeCategory)?.name}
                         </h2>
                         <Link to={`/category/${activeCategory}`} className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 hover:underline">
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
                                onClick={() => setIsMegaMenuOpen(false)}
                                className="text-[11px] font-black uppercase tracking-widest text-brand-primary dark:text-white border-b border-brand-primary/10 dark:border-white/10 pb-2 mb-1 block hover:text-accent transition-colors"
                              >
                                {sub.name}
                              </Link>
                              <ul className="space-y-1.5">
                                {l3Items.map((item: { name: string; query: string }) => (
                                  <li key={item.query}>
                                    <Link
                                      to={`/category/${sub.id}?q=${encodeURIComponent(item.name)}`}
                                      onClick={() => setIsMegaMenuOpen(false)}
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

                      {/* Image-rich category promotion */}
                      {categories.find(c => c.id === activeCategory)?.image && (
                          <Link to={`/category/${activeCategory}`} className="mt-8 rounded-3xl overflow-hidden relative group h-[200px] cursor-pointer block border border-brand-primary/10 shadow-sm">
                             <img src={categories.find(c => c.id === activeCategory)?.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Category Promotion" referrerPolicy="no-referrer" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8">
                                <span className="text-accent text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm">{t('home.new_arrivals') || 'New Collection'}</span>
                                <h3 className="text-white text-2xl font-display font-black uppercase italic tracking-tight">{t(`category.${activeCategory}`) !== `category.${activeCategory}` ? t(`category.${activeCategory}`) : categories.find(c => c.id === activeCategory)?.name} Dünyasını Keşfet</h3>
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
 
              {/* Right Column: Visual Banners & Resimli Menüler */}
              <div className="w-[450px] bg-zinc-50 dark:bg-zinc-900 border-l border-brand-primary/5 p-8 overflow-y-auto no-scrollbar">
                {activeCategory && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/30 mb-4 px-2">{t('nav.featured')} {categories.find(c => c.id === activeCategory)?.name}</h4>
                     
                     {/* Dynamic L2 Subcategory Image Tiles */}
                     <div className="grid grid-cols-2 gap-3">
                        {categories
                          .filter(c => c.parentId === activeCategory)
                          .slice(0, 4)
                          .map(sub => (
                            <Link
                              key={sub.id}
                              to={`/category/${sub.id}`}
                              onClick={() => setIsMegaMenuOpen(false)}
                              className="relative h-24 rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-brand-primary/5"
                            >
                              {sub.image ? (
                                <img
                                  src={sub.image}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
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
                          ))
                        }
                     </div>

                     {/* Main Category Promo Banner */}
                     <Link to={`/category/${activeCategory}`} className="mt-4 block relative rounded-[2rem] overflow-hidden h-48 shadow-lg group cursor-pointer">
                        <img 
                           src={categories.find(c => c.id === activeCategory)?.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=600'} 
                           className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                           alt="Category Promo"
                           referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-brand-primary/40 to-transparent p-6 flex flex-col justify-end text-white">
                           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-1">{t('mega.regional_deal')}</span>
                           <h5 className="text-xl font-display font-black leading-tight uppercase italic mb-2">ESKİYİ YENİLE</h5>
                           <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                              Hemen İncele <Zap size={10} fill="currentColor" />
                           </span>
                        </div>
                     </Link>

                     {/* Brands list if any */}
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

      {/* Mobile Menu (Simplified & Minimalist) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-brand-primary/60 backdrop-blur-sm z-[10000]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-full max-w-[320px] bg-white dark:bg-zinc-950 z-[10001] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-brand-primary text-white flex items-center justify-between">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <Zap size={20} fill="currentColor" className="text-accent" />
                  <span className="font-display font-black text-xl uppercase italic tracking-tighter">Mercora</span>
                </Link>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
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
                      onClick={() => openAuth('login')}
                      className="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                    >
                      Giriş Yap <Zap size={14} fill="currentColor" />
                    </button>
                    <button
                      onClick={() => openAuth('register')}
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
                          onClick={() => setIsMenuOpen(false)}
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
                          onClick={() => setIsMenuOpen(false)}
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
                  onClick={() => {
                    toggleTheme();
                  }}
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
                        <span className="text-sm mr-2">{l.flag}</span>
                        {l.code}
                     </button>
                   ))}
                </div>
                {user && (
                   <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
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

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-brand-primary/5 sm:hidden z-[2000] pb-safe">
         <div className="flex items-center justify-around h-16">
            {[
              { label: t('nav.home_page'), icon: Home, path: '/' },
              { label: t('nav.categories_nav'), icon: Menu, path: '#', action: () => setIsMenuOpen(true) },
              { label: t('nav.favorite'), icon: Heart, path: '/profile' },
              { label: t('nav.orders_list'), icon: Package, path: '/profile' },
              { label: t('nav.my_account'), icon: User, path: '/profile' }
            ].map((item, i) => (
              item.path === '#' ? (
                <button 
                  key={i} 
                  onClick={item.action}
                  className="flex flex-col items-center justify-center gap-1 flex-1 text-brand-primary/40 dark:text-white/40"
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              ) : (
                <Link 
                  key={i} 
                  to={item.path} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
                    location.pathname === item.path ? "text-accent" : "text-brand-primary/40 dark:text-white/40"
                  )}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </Link>
              )
            ))}
         </div>
      </div>
      {/* Location Modal */}
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />


      {/* Auth Modal (Login / Register) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[12000]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] bg-white dark:bg-zinc-950 z-[12001] shadow-2xl rounded-[2.5rem] overflow-hidden border border-brand-primary/5 dark:border-white/5"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-brand-primary to-zinc-800 p-8 pb-6 text-white overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-[40px]" />
                <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-5 right-5 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10">
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <span className="font-display font-black text-xl uppercase italic tracking-tighter">Mercora</span>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 bg-white/10 p-1 rounded-2xl relative z-10">
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className={cn('flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all', authMode === 'login' ? 'bg-white text-brand-primary shadow' : 'text-white/70 hover:text-white')}
                  >
                    Giriş Yap
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    className={cn('flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all', authMode === 'register' ? 'bg-white text-brand-primary shadow' : 'text-white/70 hover:text-white')}
                  >
                    Üye Ol
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="p-8 space-y-4">
                {authMode === 'register' && (
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30" />
                    <input
                      type="text"
                      placeholder={t('form.fullname')}
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-brand-primary/10 dark:border-white/10 bg-brand-secondary/30 dark:bg-zinc-900 text-sm font-bold text-brand-primary dark:text-white placeholder:text-brand-primary/30 focus:border-accent outline-none transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30" />
                  <input
                    type="email"
                    placeholder={t('form.email')}
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-brand-primary/10 dark:border-white/10 bg-brand-secondary/30 dark:bg-zinc-900 text-sm font-bold text-brand-primary dark:text-white placeholder:text-brand-primary/30 focus:border-accent outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('form.password')}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3.5 rounded-2xl border border-brand-primary/10 dark:border-white/10 bg-brand-secondary/30 dark:bg-zinc-900 text-sm font-bold text-brand-primary dark:text-white placeholder:text-brand-primary/30 focus:border-accent outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/30 hover:text-brand-primary transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {authError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Lütfen bekleyin...' : authMode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                </button>

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-brand-primary/10 dark:bg-white/10" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">veya</span>
                  <div className="flex-1 h-px bg-brand-primary/10 dark:bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={async () => { await login(); setIsAuthModalOpen(false); }}
                  className="w-full py-3.5 border border-brand-primary/10 dark:border-white/10 rounded-2xl font-bold text-sm text-brand-primary dark:text-white hover:bg-brand-secondary/50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google ile devam et
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
