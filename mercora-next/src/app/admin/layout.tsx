'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, CreditCard, Tags, MessageSquare, BarChart3, Settings, Shield, Star, FileText, Palette } from 'lucide-react';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Kategoriler', icon: Tags },
  { href: '/admin/sellers', label: 'Satıcılar', icon: Users },
  { href: '/admin/products', label: 'Ürünler', icon: Package },
  { href: '/admin/orders', label: 'Siparişler', icon: ShoppingCart },
  { href: '/admin/payments', label: 'Ödemeler', icon: CreditCard },
  { href: '/admin/coupons', label: 'Kuponlar', icon: Tags },
  { href: '/admin/campaigns', label: 'Kampanyalar', icon: BarChart3 },
  { href: '/admin/reviews', label: 'Yorumlar', icon: Star },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/reports', label: 'Raporlar', icon: FileText },
  { href: '/admin/analytics', label: 'Analitik', icon: BarChart3 },
  { href: '/admin/cms', label: 'CMS', icon: Palette },
  { href: '/admin/support', label: 'Destek', icon: MessageSquare },
  { href: '/admin/chat', label: 'Canlı Sohbet', icon: MessageSquare },
  { href: '/admin/returns', label: 'İadeler', icon: ShoppingCart },
  { href: '/admin/finance', label: 'Finans', icon: CreditCard },
  { href: '/admin/languages', label: 'Diller', icon: Palette },
  { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <Link href="/admin" className="font-bold text-lg text-purple-700">Admin Panel</Link>
          </div>
          <nav className="p-2 space-y-1">
            {adminLinks.map(link => {
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
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
