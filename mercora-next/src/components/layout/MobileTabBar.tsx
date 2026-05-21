'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User, Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export function MobileTabBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { firebaseUser } = useAuth();

  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/cart', label: 'Cart', icon: ShoppingBag, badge: itemCount },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
    { href: firebaseUser ? '/profile' : '/', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map(tab => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-purple-700' : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <tab.icon size={20} />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-700 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
