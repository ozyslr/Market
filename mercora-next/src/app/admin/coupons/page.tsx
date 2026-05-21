'use client';

import { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, Loader2, AlertCircle, Check } from 'lucide-react';
import { getCoupons, createCoupon, deleteCoupon } from '@/services/couponService';
import type { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch {
      setError('Kuponlar yuklenirken hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountPercent || !maxUses || !expiresAt) return;
    setSubmitting(true);
    try {
      await createCoupon({
        code: code.trim(),
        discountType: 'percentage',
        discountValue: Number(discountPercent),
        maxUses: Number(maxUses),
        expiresAt: new Date(expiresAt).toISOString(),
        isActive,
      });
      setCode('');
      setDiscountPercent('');
      setMaxUses('');
      setExpiresAt('');
      setIsActive(true);
      setShowForm(false);
      await fetchCoupons();
    } catch {
      setError('Kupon olusturulurken hata olustu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoupon(id);
      setDeleteId(null);
      await fetchCoupons();
    } catch {
      setError('Kupon silinirken hata olustu.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Kupon Yonetimi</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Kupon Ekle
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="p-6 mb-6 bg-white rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Kupon</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                placeholder="Kod"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-700 focus:border-transparent"
                required
              />
              <input
                type="number"
                placeholder="Indirim %"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-700 focus:border-transparent"
                min={1}
                max={100}
                required
              />
              <input
                type="number"
                placeholder="Maks. Kullanim"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-700 focus:border-transparent"
                min={1}
                required
              />
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-700 focus:border-transparent"
                required
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-purple-700 focus:ring-purple-700"
                  />
                  Aktif
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 text-sm transition-colors"
                >
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Yukleniyor...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-gray-500">
              <Tags className="w-10 h-10" />
              <span>Henuz kupon bulunmuyor.</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Kod</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Indirim (%)</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Kullanim</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Bitis Tarihi</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Durum</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-900">{coupon.code}</td>
                    <td className="p-4 text-sm text-gray-600">%{coupon.discountValue}</td>
                    <td className="p-4 text-sm text-gray-600">{coupon.usedCount}/{coupon.maxUses}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {coupon.isActive ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {coupon.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="p-4">
                      {deleteId === coupon.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Emin misiniz?</span>
                          <button onClick={() => handleDelete(coupon.id!)} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Evet</button>
                          <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">Hayir</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(coupon.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
