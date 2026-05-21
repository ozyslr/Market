'use client';
import { useState, useEffect } from 'react';
import { Package, Check, X, Loader2, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { getAllReturnRequests, updateReturnStatus } from '@/services/returnService';
import type { ReturnRequest } from '@/services/returnService';

type FilterTab = 'all' | 'requested' | 'approved' | 'rejected';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'requested', label: 'Bekleyen' },
  { key: 'approved', label: 'Onaylanan' },
  { key: 'rejected', label: 'Reddedilen' },
];

const statusCfg: Record<string, { color: string; label: string }> = {
  requested: { color: 'bg-yellow-100 text-yellow-800', label: 'Bekleyen' },
  approved: { color: 'bg-green-100 text-green-800', label: 'Onaylanan' },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Reddedilen' },
  completed: { color: 'bg-blue-100 text-blue-800', label: 'Tamamlandı' },
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReturns();
  }, []);

  async function loadReturns() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllReturnRequests();
      setReturns(data);
    } catch {
      setError('Iade talepleri yuklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    setUpdatingId(id);
    try {
      await updateReturnStatus(id, status as any);
      setReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: status as ReturnRequest['status'] } : r))
      );
    } catch {
      setError('Durum guncellenirken hata oluştu.');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = returns
    .filter((r) => (activeTab === 'all' ? true : r.status === activeTab))
    .filter((r) => !searchTerm || r.orderId.includes(searchTerm) || r.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase())));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Iade talepleri yukleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={loadReturns} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-7 h-7 text-purple-700" />
            <h1 className="text-2xl font-bold text-gray-900">Iade Yönetimi</h1>
          </div>
          <button onClick={loadReturns} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw className="w-4 h-4" /> Yenile
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-purple-700 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sipariş no veya ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 w-64"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henuz iade talebi bulunmuyor.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-gray-500 font-medium">Sipariş No</th>
                    <th className="text-left p-3 text-gray-500 font-medium">Urun</th>
                    <th className="text-center p-3 text-gray-500 font-medium">Miktar</th>
                    <th className="text-left p-3 text-gray-500 font-medium">Sebep</th>
                    <th className="text-center p-3 text-gray-500 font-medium">Durum</th>
                    <th className="text-left p-3 text-gray-500 font-medium">Tarih</th>
                    <th className="text-center p-3 text-gray-500 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const cfg = statusCfg[r.status] || statusCfg.requested;
                    const itemStr = r.items?.map((i) => `${i.name} (x${i.quantity})`).join(', ') || '-';
                    const totalQty = r.items?.reduce((a, i) => a + i.quantity, 0) || 0;
                    return (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{r.orderId}</td>
                        <td className="p-3 text-gray-700 max-w-[200px] truncate">{itemStr}</td>
                        <td className="p-3 text-center text-gray-700">{totalQty}</td>
                        <td className="p-3 text-gray-500 max-w-[200px] truncate">{r.reason}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</td>
                        <td className="p-3 text-center">
                          {r.status === 'requested' ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStatusUpdate(r.id, 'approved')}
                                disabled={updatingId === r.id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 transition"
                                title="Onayla"
                              >
                                {updatingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(r.id, 'rejected')}
                                disabled={updatingId === r.id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition"
                                title="Reddet"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
