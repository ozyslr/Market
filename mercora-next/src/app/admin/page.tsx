'use client';

import { Users, Package, ShoppingCart, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Toplam Kullanıcı', value: '0', icon: Users, color: 'bg-blue-500' },
    { label: 'Toplam Ürün', value: '0', icon: Package, color: 'bg-purple-500' },
    { label: 'Toplam Sipariş', value: '0', icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Toplam Gelir', value: '0 TL', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
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
        <h2 className="font-bold text-lg mb-4">Yönetim Paneli</h2>
        <p className="text-gray-500">
          Firebase bağlantısı yapıldığında veriler burada görüntülenecek.
        </p>
      </div>
    </div>
  );
}
