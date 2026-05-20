'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function SellerImportPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('seller.import')}</h1>
      <div className="text-center py-20 text-gray-500">
        <p>Ürün içe aktarma yakında eklenecek.</p>
      </div>
    </div>
  );
}
