'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function SellerOrdersPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('seller.orders')}</h1>
      <div className="text-center py-20 text-gray-500">
        <p>Sipariş yönetimi yakında eklenecek.</p>
      </div>
    </div>
  );
}
