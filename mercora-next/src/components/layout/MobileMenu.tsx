'use client';

import Link from 'next/link';
import { X, Home, ShoppingBag, User, Settings, Heart, LogOut, Store, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, firebaseUser, login, logout } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const menuItems = [
    { href: '/', label: t('nav.home_page'), icon: Home },
    { href: '/category/elektronik', label: 'Elektronik', icon: ShoppingBag },
    { href: '/category/moda', label: 'Moda', icon: ShoppingBag },
    { href: '/category/ev-yasam', label: 'Ev & Yaşam', icon: ShoppingBag },
    { href: '/category/spor', label: 'Spor', icon: ShoppingBag },
    { href: '/category/bebek-cocuk', label: 'Bebek & Çocuk', icon: ShoppingBag },
    { href: '/category/kitap-hobi', label: 'Kitap & Hobi', icon: ShoppingBag },
  ];

  const accountItems = firebaseUser ? [
    { href: '/profile', label: t('nav.my_account'), icon: User },
    { href: '/orders', label: 'My Orders', icon: ShoppingBag },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/profile', label: 'Settings', icon: Settings },
    ...(user?.role === 'seller' || user?.role === 'admin' ? [{ href: '/seller/dashboard', label: 'Seller Dashboard', icon: Store }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin Panel', icon: Settings }] : []),
  ] : [];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 left-0 bottom-0 w-72 bg-white shadow-2xl z-10 animate-in slide-in-from-left">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link href="/" className="text-xl font-black italic text-[#1A1033]" onClick={onClose}>
            MERCORA
          </Link>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {!firebaseUser && (
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => { login(); onClose(); }}
              className="w-full py-2.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-medium text-sm transition-colors"
            >
              {t('nav.login_or_sign_up')}
            </button>
          </div>
        )}

        <div className="overflow-y-auto h-full pb-20">
          {accountItems.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</div>
              {accountItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</div>
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="py-2 border-t border-gray-100 mt-2">
            <Link
              href="/support"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
            >
              <HelpCircle size={18} />
              Help & Support
            </Link>
            {firebaseUser && (
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
