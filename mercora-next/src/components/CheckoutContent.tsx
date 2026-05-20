'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, ChevronRight } from 'lucide-react';

export function CheckoutContent() {
  const { t } = useLanguage();
  const { items, clearCart } = useCart();
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState({ fullName: '', line1: '', city: '', country: 'Türkiye', postalCode: '' });

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      router.push('/profile?redirect=/checkout');
      return;
    }
    // Placeholder — will integrate Stripe/iyzico in Phase 1.4
    alert('Ödeme entegrasyonu yapılıyor...');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.checkout')}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipping */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-bold text-lg mb-4">{t('checkout.shipping_info')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-purple-600 focus:outline-none"
              placeholder="Ad Soyad"
              value={address.fullName}
              onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))}
              required
            />
            <input
              className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-purple-600 focus:outline-none"
              placeholder="Adres"
              value={address.line1}
              onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))}
              required
            />
            <input
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-purple-600 focus:outline-none"
              placeholder="Şehir"
              value={address.city}
              onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
              required
            />
            <input
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-purple-600 focus:outline-none"
              placeholder="Posta Kodu"
              value={address.postalCode}
              onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-bold text-lg mb-4">{t('cart.summary')}</h2>
          {items.map(item => (
            <div key={item.productId} className="flex justify-between text-sm py-2 border-b last:border-0">
              <span className="text-gray-600">{item.title || item.productId} x{item.quantity}</span>
              <span className="font-medium">{((item.price || 0) * item.quantity).toLocaleString()} TL</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
            <span>{t('cart.total')}</span>
            <span>{total.toLocaleString()} TL</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
        >
          <Lock size={18} />
          Ödemeyi Tamamla
          <ChevronRight size={18} />
        </button>
      </form>
    </div>
  );
}
