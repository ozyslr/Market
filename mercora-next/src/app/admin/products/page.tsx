'use client';

import { useState, useEffect } from 'react';
import { Search, Check, X, Star, TrendingUp, Loader2, AlertCircle, Package } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  sellerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  featured: boolean;
  bestSeller: boolean;
  image?: string;
}

const STATUS_FILTERS = ['Tümü', 'Bekleyen', 'Onaylı', 'Reddedildi', 'Taslak'] as const;
const STATUS_LABELS: Record<string, string> = { pending: 'Bekleyen', approved: 'Onaylı', rejected: 'Reddedildi', draft: 'Taslak' };
const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', draft: 'bg-gray-100 text-gray-800' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tümü');
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.title || data.name || '',
          category: data.categoryId || data.category || '',
          price: data.price || 0,
          sellerName: data.sellerName || data.sellerId || '',
          status: data.status || 'draft',
          featured: data.featured || false,
          bestSeller: data.bestSeller || false,
          image: data.images?.[0] || '',
        } as ProductItem;
      });
      setProducts(list);
    } catch {
      setError('Ürünler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleApprove = async (id: string) => {
    setUpdating((p) => ({ ...p, [`approve-${id}`]: true }));
    try {
      await updateDoc(doc(db, 'products', id), { status: 'approved' });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
    } catch {
      setError('Onaylama başarısız.');
    } finally {
      setUpdating((p) => ({ ...p, [`approve-${id}`]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setUpdating((p) => ({ ...p, [`reject-${rejectModal.id}`]: true }));
    try {
      await updateDoc(doc(db, 'products', rejectModal.id), { status: 'rejected', rejectionReason: rejectReason });
      setProducts((prev) => prev.map((p) => (p.id === rejectModal.id ? { ...p, status: 'rejected' } : p)));
      setRejectModal(null);
      setRejectReason('');
    } catch {
      setError('Reddetme başarısız.');
    } finally {
      setUpdating((p) => ({ ...p, [`reject-${rejectModal.id}`]: false }));
    }
  };

  const handleToggle = async (id: string, field: 'featured' | 'bestSeller', value: boolean) => {
    setUpdating((p) => ({ ...p, [`${field}-${id}`]: true }));
    try {
      await updateDoc(doc(db, 'products', id), { [field]: value });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    } catch {
      setError('Güncelleme başarısız.');
    } finally {
      setUpdating((p) => ({ ...p, [`${field}-${id}`]: false }));
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Tümü' || STATUS_LABELS[p.status] === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-700 mx-auto" />
          <p className="mt-4 text-gray-500">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">Hata</p>
          <p className="text-gray-500 mt-1">{error}</p>
          <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ürün Yönetimi</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  statusFilter === s ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">Henüz ürün bulunamadı</p>
          <p className="text-gray-500 mt-1">{search ? 'Aramanızla eşleşen ürün yok.' : 'Henüz hiçbir ürün eklenmemiş.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Görsel</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Ürün Adı</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Kategori</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Fiyat</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Satıcı</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Durum</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleToggle(product.id, 'featured', !product.featured)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                          product.featured ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
                        }`}
                        disabled={updating[`featured-${product.id}`]}
                      >
                        <Star className="w-3 h-3" /> Öne Çıkan
                      </button>
                      <button
                        onClick={() => handleToggle(product.id, 'bestSeller', !product.bestSeller)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                          product.bestSeller ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'
                        }`}
                        disabled={updating[`bestSeller-${product.id}`]}
                      >
                        <TrendingUp className="w-3 h-3" /> Çok Satan
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{product.category}</td>
                  <td className="p-4 text-gray-900 font-medium">{product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                  <td className="p-4 text-gray-600">{product.sellerName}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[product.status]}`}>
                      {STATUS_LABELS[product.status]}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {product.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(product.id)}
                          disabled={updating[`approve-${product.id}`]}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                        >
                          {updating[`approve-${product.id}`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                      )}
                      {product.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectModal(product)}
                          disabled={updating[`reject-${product.id}`]}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                        >
                          {updating[`reject-${product.id}`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ürünü Reddet</h3>
            <p className="text-gray-500 mb-4">
              <strong className="text-gray-900">{rejectModal.name}</strong> ürününü reddetmek için bir neden belirtin.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reddetme nedeni..."
              className="w-full border border-gray-200 rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                İptal
              </button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
