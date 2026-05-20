'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

export default function SellerDashboardPage() {
  const { t } = useLanguage();
  const { firebaseUser } = useAuth();

  const stats = [
    { label: 'Toplam Ürün', value: '0', icon: Package, color: 'bg-blue-500' },
    { label: 'Bekleyen Sipariş', value: '0', icon: ShoppingCart, color: 'bg-orange-500' },
    { label: 'Bu Ay Kazanç', value: '0 TL', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Dönüşüm', value: '%0', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('seller.dashboard')}</h1>
      {firebaseUser && (
        <p className="text-sm text-gray-500 mb-6">{firebaseUser.email}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="font-bold text-lg mb-4">Hoş Geldiniz</h2>
        <p className="text-gray-500">
          Satıcı paneliniz hazır. Ürünlerinizi ekleyerek satışa başlayabilirsiniz.
        </p>
      </div>
    </div>
  );
}
