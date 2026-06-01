import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, User, Globe, Menu, ChevronDown,
  Package, ShieldCheck, Shield, Zap, ArrowRight, Star, MapPin,
  Heart, CreditCard, LogOut, ChevronRight, TrendingUp,
  Sun, Moon, LayoutDashboard, Wallet, ArrowUpRight, Briefcase,
  Smartphone, Shirt, Home, ShoppingBasket, Sparkles, Baby, Dog, Mountain, Coffee, Clock,
  BookOpen, Gamepad2, Car, Wrench,
  Mail, Lock, Eye, EyeOff, UserPlus, Bell, CheckCheck,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLocationStore } from '@/context/LocationContext';
import { getCategories } from '@/services/productService';
import { getOrdersByUser } from '@/services/orderService';
import { Category } from '@/types';

import { TopTicker } from './TopTicker';
import { SearchBar } from './SearchBar';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { MobileTabBar } from './MobileTabBar';
import { NotificationsPanel } from './NotificationsPanel';
import { AuthModal } from './AuthModal';
import { LocationModal } from './LocationModal';

export function Navbar() {
  const { lang, setLang, t, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const { selectedLocation, isLocationModalOpen, setIsLocationModalOpen } = useLocationStore();
  const favoriteCount = wishlist.length;
  const favoriteBadge = favoriteCount > 30 ? '30+' : favoriteCount > 0 ? String(favoriteCount) : null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(data => { setCategories(data); });
  }, []);

  useEffect(() => {
    if (!user) { setActiveOrdersCount(null); return; }
    const ACTIVE_STATUSES = ['pending', 'processing', 'shipped', 'paid', 'confirmed'];
    getOrdersByUser(user.id).then(orders => {
      setActiveOrdersCount(orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length);
    }).catch(() => setActiveOrdersCount(0));
  }, [user?.id]);

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 start-0 end-0 z-50 transition-all duration-300" aria-label="Ana navigasyon">
      <TopTicker />

      {/* Main Header */}
      <div className={cn(
        "transition-all duration-300 border-b border-brand-primary/5 bg-white dark:bg-zinc-950",
        isScrolled ? "shadow-xl py-3" : "py-4"
      )}>
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 flex items-center gap-8">

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 rounded-lg transition-all text-brand-primary dark:text-white"
            aria-label={t('nav.open_menu') || 'Menüyü aç'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu-panel"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0" aria-label="Benim Olan ana sayfa">
            <img
              src="/logo.png"
              alt="Benim Olan"
              className="h-7 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform dark:brightness-0 dark:invert"
            />
          </Link>

          {/* Mobile Header Icons (Right side) */}
          <div className="flex sm:hidden items-center gap-1 md:gap-3 ms-auto">
            <div className="flex items-center gap-1 xl:gap-2 me-2">
              <div className="relative p-2" onClick={() => setIsMenuOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsMenuOpen(true); } }} aria-label={t('nav.language') || 'Dil'}>
                <Globe size={20} className="text-brand-primary dark:text-white" />
                <span className="absolute -top-1 -end-1 bg-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">{lang.toUpperCase()}</span>
              </div>
            </div>
            <Link to="/cart" className="relative p-2" aria-label={t('nav.cart') || 'Sepet'}>
              <ShoppingBag size={22} className="text-brand-primary dark:text-white" />
              <span className="absolute -top-1 -end-1 bg-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">3</span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="flex-1 max-w-4xl h-11 group hidden sm:flex items-center gap-3">
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
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0 ms-auto">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent flex items-center justify-center text-brand-primary dark:text-white"
              aria-label={theme === 'light' ? 'Karanlık moda geç' : 'Aydınlık moda geç'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Language Dropdown */}
            <div
              className="relative group p-2 rounded-xl cursor-pointer hidden sm:flex items-center justify-center text-brand-primary dark:text-white hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
              onMouseEnter={() => setIsLangMenuOpen(true)}
              onMouseLeave={() => setIsLangMenuOpen(false)}
              onFocus={() => setIsLangMenuOpen(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsLangMenuOpen(false); }}
            >
              <button
                onClick={() => setIsLangMenuOpen(p => !p)}
                className="flex items-center justify-center"
                aria-label={t('nav.language') || 'Dil seç'}
                aria-expanded={isLangMenuOpen}
                aria-haspopup="true"
              >
                <Globe size={20} className="group-hover:text-accent transition-colors" />
                <span className="absolute -top-1 -end-1 bg-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-accent/20 uppercase">{lang}</span>
              </button>
              {isLangMenuOpen && (
                <div
                  className="absolute top-[calc(100%)] end-0 w-48 bg-white dark:bg-zinc-950 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl border border-brand-primary/10 p-2 z-[10000]"
                  role="menu"
                  aria-label={t('nav.language') || 'Dil seç'}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setIsLangMenuOpen(false); } }}
                >
                  <div className="px-3 py-2 border-b border-brand-primary/5 dark:border-white/5 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40">{t('nav.language') || 'Dil / Language'}</span>
                  </div>
                  {availableLanguages && availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as any); setIsLangMenuOpen(false); }}
                      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setIsLangMenuOpen(false); } }}
                      role="menuitem"
                      className={cn("w-full text-start px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between group/lang", lang === l.code ? "bg-accent/10 text-accent" : "hover:bg-brand-secondary dark:hover:bg-zinc-900 text-brand-primary dark:text-white")}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{l.flag}</span>
                        <span>{l.name}</span>
                      </div>
                      {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Favorites */}
            <button
              type="button"
              onClick={() => user ? navigate('/profile?tab=favorites') : setIsAuthModalOpen(true)}
              className="hidden lg:flex items-center gap-2 group p-2 hover:text-mercora-red transition-colors text-brand-primary dark:text-white"
            >
              <div className="relative">
                <Heart size={20} className="group-hover:-translate-y-1 transition-transform" />
                {favoriteBadge && (
                  <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-0.5 bg-accent text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm leading-none">
                    {favoriteBadge}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold whitespace-nowrap">Favorilerim</span>
            </button>

            {/* Messages */}
            {user && (
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="hidden lg:flex items-center gap-2 group p-2 hover:text-accent transition-colors text-brand-primary dark:text-white"
              >
                <div className="relative">
                  <MessageSquare size={20} className="group-hover:-translate-y-1 transition-transform" />
                </div>
                <span className="text-xs font-bold whitespace-nowrap">Mesajlar</span>
              </button>
            )}

            {/* Account Dropdown */}
            <div
              className="relative p-2 rounded-lg transition-all hover:text-mercora-red cursor-pointer hidden sm:flex text-brand-primary dark:text-white items-center gap-2"
              onMouseEnter={() => setIsAccountMenuOpen(true)}
              onMouseLeave={() => setIsAccountMenuOpen(false)}
              onFocus={() => setIsAccountMenuOpen(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsAccountMenuOpen(false); }}
            >
              <button
                onClick={() => setIsAccountMenuOpen(p => !p)}
                className="flex items-center gap-2"
                aria-label={t('nav.my_account') || 'Hesabım'}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="true"
              >
                <User size={20} className="group-hover:-translate-y-1 transition-transform" />
                <div className="hidden xl:flex flex-col">
                  {user ? (
                    <span className="text-[10px] opacity-70 leading-none">Hoş geldin, {user.name.split(' ')[0]}</span>
                  ) : null}
                  <span className="text-xs font-bold leading-none mt-0.5">Hesabım</span>
                </div>
              </button>
              {isAccountMenuOpen && (
                <div
                  className="absolute top-[calc(100%)] end-0 w-[460px] bg-white dark:bg-zinc-950 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[2.5rem] border border-brand-primary/10 p-8 text-brand-primary dark:text-white cursor-auto z-[10000]"
                  role="menu"
                  aria-label="Hesap menüsü"
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setIsAccountMenuOpen(false); } }}
                >
                {user ? (
                  <div className="flex flex-col gap-6">
                    <Link to="/profile" className="flex items-center gap-5 p-5 bg-gradient-to-br from-brand-secondary/50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-brand-primary/5 dark:border-white/5 rounded-3xl relative overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
                      <div className="absolute top-0 end-0 w-32 h-32 bg-accent/10 rounded-full blur-[40px] -me-16 -mt-16" />
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-16 h-16 rounded-3xl object-cover shadow-[0_10px_20px_-10px_rgba(249,66,58,0.5)] relative z-10 shrink-0" referrerPolicy="no-referrer" loading="lazy" />
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
                            <div className="h-full bg-accent rounded-full w-[5%]" />
                          </div>
                          <span className="text-[9px] font-bold text-brand-primary/60">0 Puan</span>
                        </div>
                      </div>
                    </Link>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-brand-primary text-white group/stat cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <Wallet size={16} className="text-accent group-hover/stat:rotate-12 transition-transform" />
                          <ArrowUpRight size={14} className="text-white/40" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">Toplam Harcama</span>
                        <span className="text-xl font-display font-black">
                          {user.currency === 'GBP' ? '£' : user.currency === 'USD' ? '$' : '₺'}
                          {(user.spentTotal ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Link to="/profile?tab=orders" className="p-4 rounded-2xl border border-brand-primary/10 dark:border-white/10 hover:border-accent hover:bg-accent/5 transition-colors group/stat flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <Package size={16} className="text-brand-primary dark:text-white group-hover/stat:text-accent transition-colors" />
                          {activeOrdersCount !== null && activeOrdersCount > 0 && (
                            <span className="w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-[9px] font-bold">{activeOrdersCount > 9 ? '9+' : activeOrdersCount}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 block mb-1">Aktif Sipariş</span>
                        <span className="text-xs font-bold leading-tight">
                          {activeOrdersCount === null ? '…' : activeOrdersCount === 0 ? 'Sipariş yok' : `${activeOrdersCount} aktif`}
                        </span>
                      </Link>
                    </div>

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
                        <button
                          type="button"
                          onClick={() => { setIsAccountMenuOpen(false); window.dispatchEvent(new CustomEvent('open-live-chat')); }}
                          className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link text-start"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> Canlı Destek
                        </button>
                        <Link to="/support" onClick={() => setIsAccountMenuOpen(false)} className="text-xs font-bold hover:text-mercora-red transition-colors py-1 flex items-center gap-2 group/link">
                          <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/link:bg-mercora-red transition-colors" /> Destek Talebi
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

                    <div className="flex flex-col gap-2 mt-2 bg-brand-secondary/30 dark:bg-zinc-800/30 p-4 rounded-2xl border border-brand-primary/5">
                      <span className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary/60 dark:text-white/60 mb-2">Uzman Portalları</span>
                      <div className="grid grid-cols-2 gap-3">
                        {(user.email?.includes('admin') || user.email === 'ozyslr@gmail.com') && (
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
                        <span className="text-[10px] font-bold leading-tight">Sipariş<br />Takibi</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center"><Heart size={14} /></div>
                        <span className="text-[10px] font-bold leading-tight">Favori<br />Ürünler</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
            <NotificationsPanel
              show={showNotifPanel}
              onToggle={() => setShowNotifPanel(p => !p)}
              onClose={() => setShowNotifPanel(false)}
            />

            {/* Cart */}
            <Link to="/cart" className="relative group p-2 hover:bg-mercora-red/5 rounded-lg flex items-center gap-2 transition-colors" aria-label={t('nav.cart') || 'Sepet'}>
              <div className="relative text-brand-primary dark:text-white group-hover:text-mercora-red transition-colors">
                <ShoppingBag size={22} className="group-hover:-translate-y-1 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-mercora-red text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">{itemCount}</span>
                )}
              </div>
              <div className="hidden lg:block leading-none">
                <span className="text-xs font-bold text-brand-primary dark:text-white whitespace-nowrap group-hover:text-mercora-red transition-colors">Sepetim</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="px-4 pb-3 sm:hidden transition-all duration-300 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-2 mb-3">
            <div
              onClick={() => setIsLocationModalOpen(true)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold border whitespace-nowrap overflow-hidden transition-all bg-brand-secondary/30 border-brand-primary/5 text-brand-primary dark:text-white"
            >
              <MapPin size={14} className="text-accent shrink-0" />
              <span className="truncate">{selectedLocation}</span>
              <ChevronRight size={14} className="ms-auto opacity-40 shrink-0" />
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); const q = (e.target as any).querySelector('input')?.value; if (q?.trim()) navigate(`/search?q=${encodeURIComponent(q)}`); }} className="relative group" role="search" aria-label="Ürün ara">
            <input
              type="text"
              placeholder={t('nav.search_placeholder')}
              aria-label={t('nav.search_placeholder') || 'Ürün ara'}
              className="w-full h-11 px-4 pe-12 rounded-xl text-sm font-black transition-all outline-none border shadow-sm bg-white dark:bg-zinc-900 border-brand-primary/10 text-brand-primary dark:text-white placeholder:text-brand-primary/40"
            />
            <button type="submit" className="absolute end-0 h-full px-4 text-accent" aria-label="Ara">
              <Search size={18} strokeWidth={3} />
            </button>
          </form>
        </div>
      </div>

      {/* Secondary Category Ribbon */}
      <div role="navigation" aria-label="Kategori hızlı erişim" className={cn(
        "transition-all duration-300 py-2.5 hidden sm:block",
        "bg-white dark:bg-zinc-900 border-b border-brand-primary/10 text-brand-primary dark:text-white/80"
      )}>
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onFocus={() => setIsMegaMenuOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setIsMegaMenuOpen(false); } }}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-accent transition-colors shrink-0 z-[1000]"
              aria-label={t('nav.all_categories')}
              aria-expanded={isMegaMenuOpen}
              aria-haspopup="true"
            >
              <Menu size={18} /> {t('nav.all_categories')}
            </button>
            {[
              { name: t('nav.deals'), path: '/collection/deals' },
              { name: t('home.best_sellers'), path: '/collection/best-sellers' },
              { name: 'Yeni Gelenler', path: '/collection/new-arrivals' },
              { name: 'Flash Fırsatları', path: '/collection/flash-deals' },
              { name: 'Öne Çıkanlar', path: '/collection/featured' },
              { name: 'Benim Olan Prime', path: '/search?delivery=prime' },
              { name: 'Gift Finder', path: '/search?tag=gift' },
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

      <MegaMenu
        isOpen={isMegaMenuOpen}
        onClose={() => setIsMegaMenuOpen(false)}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categories={categories}
        onOpenAuth={openAuth}
      />

      <MobileTabBar onOpenMenu={() => setIsMenuOpen(true)} />

      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
