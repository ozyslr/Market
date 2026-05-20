'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Settings, BarChart3, Upload, Award } from 'lucide-react';

const sellerLinks = [
  { href: '/seller/dashboard', label: 'seller.dashboard', icon: LayoutDashboard },
  { href: '/seller/inventory', label: 'seller.inventory', icon: Package },
  { href: '/seller/orders', label: 'seller.orders', icon: ShoppingCart },
  { href: '/seller/finance', label: 'seller.finance', icon: DollarSign },
  { href: '/seller/pricing', label: 'seller.pricing', icon: BarChart3 },
  { href: '/seller/analytics', label: 'seller.analytics', icon: BarChart3 },
  { href: '/seller/import', label: 'seller.import', icon: Upload },
  { href: '/seller/certificates', label: 'seller.certificates', icon: Award },
  { href: '/seller/settings', label: 'seller.settings', icon: Settings },
];

export function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-lg">{t('nav.seller_hub')}</h2>
          </div>
          <nav className="p-2 space-y-1">
            {sellerLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {t(link.label)}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
