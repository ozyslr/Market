'use client';

import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export function CartContent() {
  const { t } = useLanguage();
  const { items, removeItem, updateQuantity } = useCart();

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
        <p className="text-gray-500 mb-6">Sepetinizde henüz ürün bulunmuyor.</p>
        <Link
          href="/"
          className="inline-block bg-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors"
        >
          {t('nav.home_page')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.cart')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                ) : 'No Image'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                <p className="text-sm text-gray-500">{(item.price || 0).toLocaleString()} TL</p>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="px-3 py-1 font-medium text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="font-bold text-gray-900 w-20 text-right">
                {((item.price || 0) * item.quantity).toLocaleString()} TL
              </p>
              <button
                onClick={() => removeItem(item.productId)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit">
          <h3 className="font-bold text-lg mb-4">{t('cart.summary')}</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('cart.summary')}</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} ürün</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>{t('cart.total')}</span>
              <span>{total.toLocaleString()} TL</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="block w-full bg-purple-700 text-white text-center px-6 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors"
          >
            {t('cart.checkout')}
          </Link>
        </div>
      </div>
    </div>
  );
}
