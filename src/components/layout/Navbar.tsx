import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, User, Globe, Menu, X, ChevronDown,
  Package, ShieldCheck, Zap, ArrowRight, MapPin,
  CreditCard, LogOut, ChevronRight, TrendingUp, Moon, Sun,
  Smartphone, Home, Sparkles, Mountain, Shirt, UtensilsCrossed, BookOpen, Gamepad2
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  electronics: <Smartphone size={14} />,
  home: <Home size={14} />,
  beauty: <Sparkles size={14} />,
  'sport-outdoor': <Mountain size={14} />,
  fashion: <Shirt size={14} />,
  'food-gourmet': <UtensilsCrossed size={14} />,
  'books-digital': <BookOpen size={14} />,
  'toys-games': <Gamepad2 size={14} />,
};
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CATEGORIES, MOCK_USER } from '@/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const cartTotal = useCartStore((s) => s.totalItems())
  const cartPrice = useCartStore((s) => s.totalPrice())
  const authUser = useAuthStore((s) => s.user)
  const { darkMode, toggleDarkMode } = useUIStore()
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Global Status Ticker (Topmost Bar) */}
      <div className="bg-brand-primary text-[9px] text-white/40 h-8 flex items-center overflow-hidden border-b border-white/5">
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="font-black uppercase tracking-widest text-white/60">London Hub: Active</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <span className="font-black uppercase tracking-widest text-white/60">Istanbul Hub: Active</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
               <TrendingUp size={12} className="text-accent" />
               <span className="font-black uppercase tracking-widest">Market Index: +1.24%</span>
            </div>
          </div>
          <div className="flex items-center gap-6 font-black uppercase tracking-widest">
            <span className="hidden sm:inline">Tax ID: MCR-2026-X</span>
            <span className="text-accent">Global Support: +44 20 7946 0958</span>
          </div>
        </div>
      </div>

      {/* Top Header Section (Amazon Style Search Centric) */}
      <div className={cn(
        "transition-all duration-300 border-b border-white/5",
        isScrolled ? "bg-white shadow-xl py-3" : "bg-brand-primary text-white py-4"
      )}>
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 flex items-center gap-8">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-accent/20">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className={cn(
              "font-display font-bold text-3xl tracking-tighter uppercase italic",
              isScrolled ? "text-brand-primary" : "text-white"
            )}>Mercora</span>
          </Link>

          {/* Location Hub */}
          <button className={cn(
            "hidden xl:flex items-center gap-2 text-left hover:border-white/20 p-2 rounded-lg transition-all shrink-0",
            isScrolled ? "text-brand-primary/60" : "text-white/60"
          )}>
            <MapPin size={18} />
            <div className="text-[10px] uppercase font-black tracking-widest leading-none">
              {t('nav.deliver_to')}: <br />
              <span className={cn("text-xs font-black", isScrolled ? "text-brand-primary" : "text-white")}>{MOCK_USER.country} Hub</span>
            </div>
          </button>

          {/* Search Bar (Big & Bold) */}
          <form onSubmit={handleSearch} className="flex-1 max-w-4xl h-11 group">
            <div className="relative flex items-center h-full">
              <div className="absolute left-0 h-full flex items-center px-4 bg-brand-secondary/40 border-r border-brand-primary/5 rounded-l-2xl text-[10px] font-black uppercase tracking-widest text-brand-primary cursor-pointer hover:bg-brand-secondary/50 transition-colors hidden md:flex">
                {t('nav.departments')} <ChevronDown size={14} className="ml-1 opacity-40" />
              </div>
              <input 
                type="text" 
                placeholder={t('nav.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full h-full md:pl-32 pl-4 pr-14 rounded-2xl text-sm font-black transition-all outline-none border",
                  isScrolled 
                    ? "bg-brand-secondary/20 border-brand-primary/5 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent"
                    : "bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:bg-white focus:text-brand-primary focus:border-accent"
                )}
              />
              <button type="submit" className="absolute right-0 h-full px-5 bg-accent rounded-r-2xl text-white hover:bg-brand-primary transition-all flex items-center justify-center shadow-lg shadow-accent/20">
                <Search size={20} strokeWidth={3} />
              </button>
            </div>
          </form>

          {/* User & Global Hub */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
             <div className="hidden lg:flex relative group items-center gap-1 cursor-pointer p-2 rounded-lg transition-all border border-transparent hover:border-white/10">
                <Globe size={18} className={isScrolled ? "text-brand-primary/60" : "text-white/60"} />
                <span className={cn("text-xs font-black uppercase tracking-widest", isScrolled ? "text-brand-primary" : "text-white")}>{lang}</span>
                <ChevronDown size={14} className="opacity-40" />
                
                {/* Language Dropdown */}
                <div className="absolute top-full right-0 w-40 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-brand-primary z-[60]"><div className="bg-white shadow-2xl rounded-2xl border border-brand-primary/5 p-4">
                   <button 
                     onClick={() => setLang('en')}
                     className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-secondary transition-colors", lang === 'en' ? "text-accent" : "")}
                   >
                     English - EN
                   </button>
                   <button 
                     onClick={() => setLang('tr')}
                     className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-secondary transition-colors", lang === 'tr' ? "text-accent" : "")}
                   >
                     Türkçe - TR
                   </button>
                </div>
                </div>
             </div>

             {/* Dark Mode Toggle */}
             <button
               onClick={toggleDarkMode}
               className="p-2 rounded-lg transition-all hover:bg-white/10"
               title={darkMode ? 'Light mode' : 'Dark mode'}
             >
               {darkMode
                 ? <Sun size={20} className={isScrolled ? 'text-brand-primary' : 'text-white'} />
                 : <Moon size={20} className={isScrolled ? 'text-brand-primary' : 'text-white'} />
               }
             </button>

             <div className="relative group p-2 rounded-lg transition-all border border-transparent hover:border-white/10 cursor-pointer">
                <div className="flex items-center gap-3">
                   <div className="hidden xl:block text-right">
                      <p className={cn("text-[9px] font-black uppercase opacity-40", isScrolled ? "" : "text-white")}>{t('nav.hello')}</p>
                      <p className={cn("text-xs font-black flex items-center", isScrolled ? "text-brand-primary" : "text-white uppercase italic tracking-tighter")}>{t('nav.account')} <ChevronDown size={14} className="ml-1 opacity-20" /></p>
                   </div>
                   <User size={22} className={isScrolled ? "text-brand-primary" : "text-white"} />
                </div>
                {/* Account Dropdown Overlay */}
                <div className="absolute top-full right-0 w-80 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-brand-primary cursor-auto pointer-events-none group-hover:pointer-events-auto z-50"><div className="bg-white shadow-2xl rounded-[2rem] border border-brand-primary/5 p-8 overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent" />
                   <div className="space-y-6">
                      <Link to="/profile" className="block w-full py-4 bg-accent text-white rounded-xl font-black uppercase tracking-widest text-xs text-center shadow-xl shadow-accent/20 hover:bg-brand-primary transition-all">Sign In / Register</Link>
                      <div className="pt-4 border-t border-brand-primary/5 grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-brand-primary/30 tracking-[0.2em] mb-4">My Lists</h4>
                            <Link to="/wishlist" className="block text-xs font-bold hover:text-accent">Favourites</Link>
                            <Link to="/profile" className="block text-xs font-bold hover:text-accent">Saved Items</Link>
                         </div>
                         <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-brand-primary/30 tracking-[0.2em] mb-4">Account</h4>
                            <Link to="/profile" className="block text-xs font-bold hover:text-accent">Orders</Link>
                            <Link to="/profile" className="block text-xs font-bold hover:text-accent">Global Wallet</Link>
                            <Link to="/seller/dashboard" className="block text-xs font-black text-accent uppercase italic transition-colors">Seller Hub</Link>
                            {authUser?.role === 'admin' && (
                              <Link to="/admin" className="block text-xs font-black text-red-500 uppercase italic transition-colors hover:text-red-600">
                                Admin Panel
                              </Link>
                            )}
                         </div>
                      </div>
                   </div>
                </div></div>
             </div>

             <Link to="/cart" className="relative group p-2 hover:bg-brand-primary/5 rounded-lg flex items-center gap-3">
                <div className="hidden xl:flex flex-col items-end leading-none mr-2">
                   <p className={cn("text-[9px] font-black uppercase tracking-widest text-accent mb-1")}>Global Wallet</p>
                   <p className={cn("text-xs font-black", isScrolled ? "text-brand-primary" : "text-white")}>£{cartPrice.toFixed(2)}</p>
                </div>
                <div className="relative">
                   <ShoppingBag size={26} className={isScrolled ? "text-brand-primary" : "text-white"} />
                   {cartTotal > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-brand-primary">{cartTotal}</span>
                   )}
                </div>
                <div className="hidden lg:block leading-none">
                   <p className={cn("text-[9px] font-black uppercase opacity-40", isScrolled ? "" : "text-white")}>{t('nav.cart')}</p>
                   <p className={cn("text-xs font-black mt-1", isScrolled ? "text-brand-primary" : "text-white")}>£{cartPrice.toFixed(2)}</p>
                </div>
             </Link>
          </div>
        </div>
      </div>

      {/* Secondary Ribbon (Hepsiburada Style Categories) */}
      <div className={cn(
        "transition-all duration-300 py-2.5",
        isScrolled ? "bg-white border-b border-brand-primary/5 text-brand-primary" : "bg-brand-primary/95 text-white/80"
      )}>
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 flex items-center justify-between">
           <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button 
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-accent transition-colors shrink-0"
              >
                <Menu size={18} /> {t('nav.all_categories')}
              </button>
              {[
                t('nav.deals'), 'Best Prices', 'Imported Goods', 'Mercora Prime', t('home.best_sellers'), 'Gift Finder', 'Brands'
              ].map((item, i) => (
                <Link key={i} to={`/search?q=${encodeURIComponent(String(item))}`} className="text-[10px] font-black uppercase tracking-widest hover:text-accent transition-all hidden md:block opacity-60 hover:opacity-100">
                  {item}
                </Link>
              ))}
           </div>
           <div className="hidden xl:flex items-center gap-6">
              <Link to="/seller/dashboard" className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 group">
                 <Zap size={14} className="group-hover:animate-pulse" /> {t('nav.sell')}
              </Link>
           </div>
        </div>
      </div>

      {/* Mega Menu Overlay */}
      <AnimatePresence>
        {isMegaMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-brand-primary/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] p-0 overflow-hidden"
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <div className="max-w-[1600px] mx-auto grid grid-cols-5 h-[500px]">
              {/* Left Side: Main Categories */}
              <div className="col-span-1 bg-brand-secondary/30 border-r border-brand-primary/5 py-8 px-4 overflow-y-auto custom-scrollbar">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary/30 mb-6 px-4">Global Departments</h3>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onMouseEnter={() => setActiveCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all font-display font-black text-base group",
                      activeCategory === cat.id ? "bg-white text-brand-primary shadow-lg shadow-brand-primary/5 translate-x-1" : "text-brand-primary/60 hover:text-brand-primary"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        activeCategory === cat.id ? "bg-accent text-white scale-110" : "bg-brand-primary/5 text-brand-primary/30"
                      )}>
                        {CATEGORY_ICONS[cat.id] ?? <Package size={14} />}
                      </div>
                      {cat.name}
                    </span>
                    <ChevronRight size={16} className={cn("transition-all", activeCategory === cat.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2")} />
                  </button>
                ))}
              </div>

              {/* Center: Subcategories */}
              <div className="col-span-3 py-10 px-12 overflow-y-auto custom-scrollbar">
                {activeCategory ? (
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.find(c => c.id === activeCategory)?.subCategories?.map(sub => (
                      <Link
                        key={sub.id}
                        to={`/search?category=${sub.id}`}
                        onClick={() => setIsMegaMenuOpen(false)}
                        className="flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-brand-secondary transition-all group border border-transparent hover:border-brand-primary/5"
                      >
                        <span className="text-sm font-bold text-brand-primary/70 group-hover:text-brand-primary transition-colors">{sub.name}</span>
                        <ChevronRight size={14} className="text-accent opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-brand-secondary/30 rounded-full flex items-center justify-center mb-6 text-brand-primary/10 animate-pulse">
                      <ShoppingBag size={40} />
                    </div>
                    <h4 className="text-2xl font-display font-black text-brand-primary/20 italic tracking-tighter leading-none">Hover to explore the <br /> global ecosystem</h4>
                  </div>
                )}
              </div>

              {/* Right Side: Visual Content */}
              <div className="col-span-1 border-l border-brand-primary/5 p-8 flex flex-col justify-end">
                <div className="relative group overflow-hidden rounded-[2.5rem] h-full flex flex-col">
                  <img src="https://placehold.co/600x900/1a1a2e/ffffff?text=Artisan" className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000" />
                  <div className="relative mt-auto p-8 text-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Join the movement</span>
                    <h3 className="text-3xl font-display font-black mt-2 leading-none uppercase">Become a <br /> Global <br /> Artisan</h3>
                    <p className="text-xs text-white/60 mt-4 leading-relaxed font-medium">Connect with 50M+ buyers across the UK, EU, and Middle East.</p>
                    <button className="mt-8 flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:gap-5 transition-all">
                      Start Selling <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu (Simplified) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-[60] bg-white h-screen w-[80%] shadow-2xl md:hidden flex flex-col"
          >
            <div className="p-6 bg-brand-primary text-white flex items-center justify-between">
              <span className="font-display font-black text-2xl uppercase italic">Mercora</span>
              <button onClick={() => setIsMenuOpen(false)}><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-brand-primary/30 tracking-[0.2em]">Personal</h4>
                <Link to="/profile" className="block text-2xl font-display font-black">My Profile</Link>
                <Link to="/orders" className="block text-2xl font-display font-black">My Orders</Link>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-brand-primary/30 tracking-[0.2em]">Explore</h4>
                {CATEGORIES.map(cat => (
                  <Link key={cat.id} to={`/category/${cat.id}`} className="block text-xl font-bold">{cat.name}</Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
