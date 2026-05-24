import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  orderId: string;
  total: number;
  currency: string;
  onClose: () => void;
}

export function OneClickSuccessModal({ orderId, total, currency, onClose }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const deliveryStr = deliveryDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

  const getCurrencySymbol = (curr: string): string => {
    const upper = curr.toUpperCase();
    switch (upper) {
      case 'TRY':
        return '₺';
      case 'GBP':
        return '£';
      case 'EUR':
        return '€';
      default:
        return upper;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="text-green-600" size={36} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            {t('checkout.success.title', 'Siparişiniz Alındı!')}
          </h2>

          <p className="text-sm text-gray-500">
            {t('checkout.success.orderNumber', 'Sipariş No:')}
            {' '}
            <span className="font-mono font-semibold text-gray-800">
              #{orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>

          <div className="bg-gray-50 rounded-xl p-4 w-full text-left">
            <p className="text-sm text-gray-500">
              {t('checkout.success.totalAmount', 'Toplam Tutar')}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {getCurrencySymbol(currency)}
              {total.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t('checkout.success.estimatedDelivery', 'Tahmini teslimat:')} {deliveryStr}
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('checkout.success.continueShopping', 'Alışverişe Devam Et')}
            </button>
            <button
              onClick={() => {
                navigate('/profile?tab=orders');
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {t('checkout.success.viewOrders', 'Siparişleri Gör')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
