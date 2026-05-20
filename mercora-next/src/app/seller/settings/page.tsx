'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function SellerSettingsPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('seller.settings')}</h1>
      <div className="text-center py-20 text-gray-500">
        <p>Satıcı ayarları yakında eklenecek.</p>
      </div>
    </div>
  );
}
