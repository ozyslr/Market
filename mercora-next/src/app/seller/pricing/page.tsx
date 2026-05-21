'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3, Tag, Percent, Calendar, Clock, Plus,
  X, Save, AlertCircle, Loader2, CheckCircle2,
  Search, TrendingUp, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getProducts, updateProduct } from '@/services/productService';
import type { Product } from '@/types';

export default function SellerPricingPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getProducts({ sellerId: user.id, includeNonApproved: true })
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() =>
    products.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
    ), [products, search]);

  const activeDiscounts = useMemo(() =>
    filtered.filter(p =>
      (p.discountPercentage ?? 0) > 0 &&
      (!p.discountEnd || new Date(p.discountEnd) > new Date())
    ).sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0)),
  [filtered]);

  const openDiscountForm = (p: Product) => {
    setSelectedProduct(p);
    setDiscountPercent(p.discountPercentage ?? 0);
    setStartDate(p.discountStart ? p.discountStart.slice(0, 16) : '');
    setEndDate(p.discountEnd ? p.discountEnd.slice(0, 16) : '');
  };

  const saveDiscount = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const oldPrice = selectedProduct.price;
      const newPrice = discountPercent > 0
        ? Math.round(oldPrice * (1 - discountPercent / 100))
        : oldPrice;

      await updateProduct(selectedProduct.id, {
        discountPercentage: discountPercent,
        discountStart: startDate ? new Date(startDate).toISOString() : '',
        discountEnd: endDate ? new Date(endDate).toISOString() : '',
        oldPrice: discountPercent > 0 ? oldPrice : 0,
        price: newPrice,
      });

      setProducts(prev => prev.map(p =>
        p.id === selectedProduct.id
          ? {
              ...p,
              discountPercentage: discountPercent,
              discountStart: startDate ? new Date(startDate).toISOString() : undefined,
              discountEnd: endDate ? new Date(endDate).toISOString() : undefined,
              oldPrice: discountPercent > 0 ? oldPrice : 0,
              price: newPrice,
            }
          : p
      ));
      setSuccessMsg(`${selectedProduct.title} için indirim kaydedildi`);
      setSelectedProduct(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('İndirim kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const removeDiscount = async (p: Product) => {
    if (!confirm(`${p.title} ürünündeki indirimi kaldırmak istediğinize emin misiniz?`)) return;
    setSaving(true);
    try {
      const restoredPrice = p.oldPrice && p.oldPrice > p.price ? p.oldPrice : p.price;
      await updateProduct(p.id, {
        discountPercentage: 0,
        discountStart: '',
        discountEnd: '',
        oldPrice: 0,
        price: restoredPrice,
      });
      setProducts(prev => prev.map(pr => pr.id === p.id ? {
        ...pr,
        discountPercentage: 0,
        discountStart: undefined,
        discountEnd: undefined,
        oldPrice: 0,
        price: restoredPrice,
      } : pr));
      setSuccessMsg(`${p.title} indirimi kaldırıldı`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('İndirim kaldırılırken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('seller.pricing')}</h1>
          <p className="text-sm text-gray-500 mt-1">Ürünlerinize indirim ve kampanya tanımlayın</p>
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-emerald-700"
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Discounts Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Tag size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Aktif İndirimler</p>
            <p className="text-lg font-bold text-gray-900">{activeDiscounts.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Package size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Toplam Ürün</p>
            <p className="text-lg font-bold text-gray-900">{products.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Percent size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Ort. İndirim Oranı</p>
            <p className="text-lg font-bold text-gray-900">
              {activeDiscounts.length > 0
                ? `%${Math.round(activeDiscounts.reduce((s, p) => s + (p.discountPercentage ?? 0), 0) / activeDiscounts.length)}`
                : '%0'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Henüz ürününüz bulunmuyor.</p>
          <p className="text-sm text-gray-400 mt-1">Önce ürün eklemelisiniz.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ürün</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Fiyat</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">İndirim</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const hasActiveDiscount = (product.discountPercentage ?? 0) > 0 &&
                    (!product.discountEnd || new Date(product.discountEnd) > new Date());
                  const isExpired = product.discountEnd && new Date(product.discountEnd) < new Date();
                  const isScheduled = product.discountStart && new Date(product.discountStart) > new Date();

                  return (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-50"
                              loading="lazy"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.title}</p>
                            <p className="text-xs text-gray-400">{product.brand || 'Markasız'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.discountPercentage ? (
                          <div>
                            <span className="text-sm font-bold text-red-600">
                              {product.price.toLocaleString('tr-TR')} ₺
                            </span>
                            <span className="text-xs text-gray-400 line-through ml-2">
                              {product.oldPrice?.toLocaleString('tr-TR')} ₺
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium">{product.price.toLocaleString('tr-TR')} ₺</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(product.discountPercentage ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold">
                            <Percent size={10} /> %{product.discountPercentage}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasActiveDiscount ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                            <Clock size={10} /> Aktif
                          </span>
                        ) : isScheduled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                            <Calendar size={10} /> Zamanlı
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">
                            Süresi Doldu
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {product.discountEnd && hasActiveDiscount && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(product.discountEnd).toLocaleDateString('tr-TR')} bitiyor
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDiscountForm(product)}
                            className="px-3 py-1.5 text-xs font-bold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                          >
                            İndirim Ekle
                          </button>
                          {hasActiveDiscount && (
                            <button
                              onClick={() => removeDiscount(product)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="İndirimi kaldır"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discount Form Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">İndirim Tanımla</h3>
                <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-900">{selectedProduct.title}</p>
                <p className="text-xs text-gray-500">Mevcut fiyat: {selectedProduct.price.toLocaleString('tr-TR')} ₺</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">İndirim Oranı (%)</label>
                  <div className="flex gap-2">
                    {[10, 20, 30, 40, 50].map(val => (
                      <button
                        key={val}
                        onClick={() => setDiscountPercent(val)}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-bold border transition-all',
                          discountPercent === val
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'border-gray-200 text-gray-500 hover:border-purple-300',
                        )}
                      >
                        %{val}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Number(e.target.value))}
                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Özel oran..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Başlangıç</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Bitiş</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {discountPercent > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3 text-sm">
                    <div className="flex justify-between text-purple-700">
                      <span>Yeni fiyat:</span>
                      <span className="font-bold">
                        {Math.round(selectedProduct.price * (1 - discountPercent / 100)).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    <div className="flex justify-between text-purple-500 text-xs mt-1">
                      <span>Kazanç:</span>
                      <span className="font-bold">{discountPercent}%</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={saveDiscount}
                  disabled={saving}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Kaydediliyor...' : 'İndirimi Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
