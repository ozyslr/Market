'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { user, firebaseUser, login, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16" role="navigation" aria-label="Ana navigasyon">
          {/* Logo */}
          <Link href="/" className="text-2xl font-black italic tracking-tight text-[#1A1033]" aria-label="Mercora ana sayfa">
            MERCORA
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8" role="search" aria-label="Ürün ara">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('nav.search_placeholder')}
                aria-label={t('nav.search_placeholder')}
                className="w-full border-2 border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full bg-purple-700 text-white px-4 rounded-r-lg hover:bg-purple-800 transition-colors"
                aria-label="Ara"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language */}
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="bg-transparent text-sm font-medium cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-purple-200 rounded"
              aria-label="Dil seçin"
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
              <option value="de">DE</option>
              <option value="ar">AR</option>
            </select>

            {/* Account */}
            {firebaseUser ? (
              <Link href="/profile" className="hidden md:flex items-center gap-1 text-sm hover:text-purple-700" aria-label="Hesabım">
                <User size={18} />
                <span className="hidden lg:inline">{user?.name || t('nav.my_account')}</span>
              </Link>
            ) : (
              <button onClick={login} className="hidden md:flex items-center gap-1 text-sm hover:text-purple-700" aria-label="Giriş yap veya kaydol">
                <User size={18} />
                <span className="hidden lg:inline">{t('nav.login_or_sign_up')}</span>
              </button>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative flex items-center gap-1 text-sm hover:text-purple-700" aria-label={`Sepet${itemCount > 0 ? ` (${itemCount} ürün)` : ''}`}>
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-700 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('nav.search_placeholder')}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-purple-600 focus:outline-none"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-700">
              <Search size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-200 bg-white" role="menu">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className="block py-2 text-sm rounded-lg hover:bg-gray-50" role="menuitem" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.home_page')}
            </Link>
            <Link href="/cart" className="block py-2 text-sm rounded-lg hover:bg-gray-50" role="menuitem" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.cart')}
            </Link>
            {firebaseUser ? (
              <>
                <Link href="/profile" className="block py-2 text-sm rounded-lg hover:bg-gray-50" role="menuitem">{t('nav.my_account')}</Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block py-2 text-sm text-red-600 rounded-lg hover:bg-gray-50 w-full text-left" role="menuitem">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <button onClick={() => { login(); setMobileMenuOpen(false); }} className="block py-2 text-sm text-purple-700 rounded-lg hover:bg-gray-50 w-full text-left" role="menuitem">
                {t('nav.login_or_sign_up')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
