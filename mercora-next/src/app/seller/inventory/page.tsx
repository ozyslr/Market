'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function SellerInventoryPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('seller.inventory')}</h1>
      <div className="text-center py-20 text-gray-500">
        <p>Envanter yönetimi yakında eklenecek.</p>
      </div>
    </div>
  );
}
