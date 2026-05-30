import React from 'react';
import { Home, Menu, Heart, Package, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface MobileTabBarProps {
  onOpenMenu: () => void;
}

export function MobileTabBar({ onOpenMenu }: MobileTabBarProps) {
  const location = useLocation();
  const { t } = useLanguage();

  const items = [
    { label: t('nav.home_page'), icon: Home, path: '/' },
    { label: t('nav.categories_nav'), icon: Menu, path: '#', action: onOpenMenu },
    { label: t('nav.favorite'), icon: Heart, path: '/profile' },
    { label: t('nav.orders_list'), icon: Package, path: '/profile' },
    { label: t('nav.my_account'), icon: User, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 start-0 end-0 bg-white dark:bg-zinc-900 border-t border-brand-primary/5 sm:hidden z-[2000] pb-safe" role="navigation" aria-label="Mobil alt navigasyon">
      <div className="flex items-center justify-around h-16">
        {items.map((item, i) =>
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
        )}
      </div>
    </div>
  );
}
