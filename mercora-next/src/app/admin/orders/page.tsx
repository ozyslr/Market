'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/order';

const STATUS_FILTERS = [
  'Tümü', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned',
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  return_requested: 'bg-gray-100 text-gray-800',
  returned: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  return_requested: 'Return Requested',
  returned: 'Returned',
};

const STATUS_OPTIONS: OrderStatus[] = [
  'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tümü');
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getAllOrders } = await import('@/services/orderService');
      const data = await getAllOrders();
      setOrders(data ?? []);
    } catch {
      setError('Siparişler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setUpdating((p) => ({ ...p, [orderId]: true }));
    try {
      const { updateOrderStatus } = await import('@/services/orderService');
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch {
      setError('Durum güncellenirken bir hata oluştu.');
    } finally {
      setUpdating((p) => ({ ...p, [orderId]: false }));
    }
  };

  const filtered = orders.filter((o) => {
    const query = search.toLowerCase();
    const matchSearch =
      o.id.slice(-8).toLowerCase().includes(query) ||
      o.userEmail.toLowerCase().includes(query);
    const matchStatus =
      statusFilter === 'Tümü' ||
      STATUS_LABELS[o.status] === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-700 mx-auto" />
          <p className="mt-4 text-gray-500">Siparişler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">Hata</p>
          <p className="text-gray-500 mt-1">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sipariş no veya e-posta ara..."
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
                  statusFilter === s
                    ? 'bg-purple-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">Henüz sipariş bulunamadı</p>
          <p className="text-gray-500 mt-1">
            {search
              ? 'Aramanızla eşleşen sipariş yok.'
              : 'Henüz hiçbir sipariş oluşturulmamış.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Sipariş No</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Müşteri</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Tutar</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Durum</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Tarih</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm font-medium text-gray-900">
                    {order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4 text-gray-600">{order.userEmail}</td>
                  <td className="p-4 font-medium text-gray-900">
                    {(order.total ?? order.totalAmount ?? 0).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusUpdate(order.id, e.target.value as OrderStatus)
                      }
                      disabled={updating[order.id]}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    {updating[order.id] && (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-700 inline ml-2" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
