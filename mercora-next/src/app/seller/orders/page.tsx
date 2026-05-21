'use client';

import { useState, useEffect } from 'react';
import {
  Package, Truck, Clock, AlertTriangle,
  Search, MapPin, Globe,
  ArrowRight, Download, BarChart2, MessageSquare,
  ShieldCheck, RefreshCw, Loader2,
  RotateCcw, ThumbsUp, ThumbsDown, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getOrdersBySeller, updateOrderStatus } from '@/services/orderService';
import { getReturnRequests, updateReturnStatus, type ReturnRequest } from '@/services/returnService';
import type { Order } from '@/types/order';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

const CARRIERS = ['PTT', 'Yurtiçi', 'Aras', 'MNG', 'Sürat', 'UPS', 'DHL'];

export default function SellerOrdersPage() {
  const { firebaseUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipTarget, setShipTarget] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('PTT');
  const [shipping, setShipping] = useState(false);

  // Returns state
  const [showReturns, setShowReturns] = useState(false);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }
    setError(null);
    getOrdersBySeller(firebaseUser.uid)
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Siparişler yüklenirken bir hata oluştu.');
        setLoading(false);
      });
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser || !showReturns) return;
    setLoadingReturns(true);
    getReturnRequests(firebaseUser.uid)
      .then(data => {
        setReturns(data);
        setLoadingReturns(false);
      })
      .catch(() => setLoadingReturns(false));
  }, [firebaseUser, showReturns]);

  const now = Date.now();
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const attentionCount = orders.filter(o => o.status === 'return_requested' || o.status === 'refunded').length;
  const revenue24h = orders
    .filter(o => new Date(o.createdAt).getTime() > now - 86_400_000)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const handleShip = async () => {
    if (!shipTarget) return;
    setShipping(true);
    try {
      await updateOrderStatus(shipTarget.id, 'shipped', {
        trackingNumber: trackingNumber.trim() || undefined,
        carrier,
        shippedAt: new Date().toISOString(),
      });
      setOrders(prev => prev.map(o =>
        o.id === shipTarget.id
          ? { ...o, status: 'shipped', trackingNumber, carrier, shippedAt: new Date().toISOString() }
          : o
      ));
      setShipTarget(null);
      setTrackingNumber('');
    } catch {
      // Error handled silently
    } finally {
      setShipping(false);
    }
  };

  const handleApproveReturn = async (r: ReturnRequest) => {
    setProcessingReturn(true);
    try {
      await updateReturnStatus(r.id, 'approved', 'İade onaylandı. Kargonuzu bekliyoruz.');
      setReturns(prev => prev.map(rr => rr.id === r.id ? { ...rr, status: 'approved' } : rr));
    } catch {
      // handled
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleRejectReturn = async (r: ReturnRequest) => {
    setProcessingReturn(true);
    try {
      await updateReturnStatus(r.id, 'rejected', 'İade talebi reddedildi.');
      setReturns(prev => prev.map(rr => rr.id === r.id ? { ...rr, status: 'rejected' } : rr));
    } catch {
      // handled
    } finally {
      setProcessingReturn(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const buyer = o.shippingAddress?.fullName || o.userEmail || '';
    return (filter === 'all' || o.status === filter) &&
      (o.id.toLowerCase().includes(search.toLowerCase()) || buyer.toLowerCase().includes(search.toLowerCase()));
  });

  // ── Loading State ──
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Yönetimi</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="h-10 bg-gray-200 rounded-lg w-64" />
          </div>
          <table className="w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={6} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Yönetimi</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle size={36} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download size={14} /> Dışa Aktar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <RefreshCw size={14} /> Toplu Gönderim
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Bekleyen Gönderim', value: String(pendingCount), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Kargoda', value: String(shippedCount), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'İade / İnceleme', value: String(attentionCount), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '24s Ciro', value: `${revenue24h.toLocaleString('tr-TR')} TL`, icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['all', 'pending', 'shipped', 'delivered'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'all' ? 'Tümü' : tab === 'pending' ? 'Bekleyen' : tab === 'shipped' ? 'Kargoda' : 'Teslim'}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-2 self-center" />
            <button
              onClick={() => setShowReturns(!showReturns)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                showReturns ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <RotateCcw size={12} /> İadeler
            </button>
          </div>
          <div className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Sipariş no veya alıcı adı ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Sipariş</th>
                <th className="px-6 py-4">Alıcı</th>
                <th className="px-6 py-4">Teslimat</th>
                <th className="px-6 py-4">Tutar</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Package size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">Sipariş bulunamadı</p>
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Filtreyi Temizle
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-mono font-medium text-gray-900 text-sm">
                          #{order.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package size={16} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.shippingAddress?.fullName || order.userEmail || '—'}
                          </p>
                          <p className="text-xs text-blue-600">
                            {order.items?.length || 0} ürün
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {order.shippingAddress ? `${order.shippingAddress.city}, ${order.shippingAddress.country}` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-base font-bold text-gray-900">
                        {order.currency || 'TL'} {order.total?.toFixed(2) || '0.00'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-50 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                        'bg-orange-50 text-orange-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-500' :
                          order.status === 'shipped' ? 'bg-blue-500' :
                          order.status === 'cancelled' ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`} />
                        {order.status === 'pending' ? 'Bekliyor' :
                         order.status === 'processing' ? 'İşleniyor' :
                         order.status === 'shipped' ? 'Kargoda' :
                         order.status === 'delivered' ? 'Teslim' :
                         order.status === 'cancelled' ? 'İptal' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button
                            onClick={() => { setShipTarget(order); setCarrier('PTT'); setTrackingNumber(''); }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                          >
                            Kargoya Ver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom bar */}
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filteredOrders.length} sipariş
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(i => (
              <button
                key={i}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                  i === 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {i}
              </button>
            ))}
            <button className="w-8 h-8 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100">
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Returns Section ── */}
      {showReturns && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden mt-6">
          <div className="p-4 border-b border-amber-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <RotateCcw size={16} className="text-amber-500" /> İade Yönetimi
            </h2>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              {returns.filter(r => r.status === 'requested').length} bekleyen
            </span>
          </div>

          {loadingReturns ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">İade talebi yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Sipariş</th>
                    <th className="px-6 py-4">Ürün</th>
                    <th className="px-6 py-4">Sebep</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {returns.map(r => (
                    <tr key={r.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-gray-900">
                          #{r.orderId.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {r.items.map(i => i.name).join(', ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {r.items.reduce((s, i) => s + i.quantity, 0)} adet
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 max-w-[200px] truncate">{r.reason}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.status === 'requested' ? 'bg-amber-50 text-amber-700' :
                          r.status === 'approved' ? 'bg-green-50 text-green-700' :
                          r.status === 'rejected' ? 'bg-red-50 text-red-700' :
                          r.status === 'received' ? 'bg-blue-50 text-blue-700' :
                          r.status === 'refunded' ? 'bg-purple-50 text-purple-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {r.status === 'requested' && (
                            <>
                              <button
                                onClick={() => handleApproveReturn(r)}
                                disabled={processingReturn}
                                className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 disabled:opacity-50"
                                title="Onayla"
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <button
                                onClick={() => handleRejectReturn(r)}
                                disabled={processingReturn}
                                className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 disabled:opacity-50"
                                title="Reddet"
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedReturn(r)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Detay
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Ship Modal ── */}
      {shipTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Kargo Bilgileri</h3>
              <button onClick={() => setShipTarget(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Sipariş #{shipTarget.id.slice(-6).toUpperCase()}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Kargo Firması</label>
              <select
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {CARRIERS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Takip Numarası (opsiyonel)</label>
              <input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="örn. TR1234567890"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShipTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                İptal
              </button>
              <button
                onClick={handleShip}
                disabled={shipping}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {shipping ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</> : 'Kargoya Ver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return Detail Modal ── */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedReturn(null)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">İade Detayı</h3>
              <button onClick={() => setSelectedReturn(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedReturn.status === 'requested' ? 'bg-amber-50 text-amber-700' :
                selectedReturn.status === 'approved' ? 'bg-green-50 text-green-700' :
                selectedReturn.status === 'rejected' ? 'bg-red-50 text-red-700' :
                selectedReturn.status === 'refunded' ? 'bg-purple-50 text-purple-700' :
                'bg-gray-50 text-gray-500'
              }`}>{selectedReturn.status}</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sipariş</span>
                <span className="font-medium font-mono">#{selectedReturn.orderId.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Talep Tarihi</span>
                <span className="font-medium">{new Date(selectedReturn.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Müşteri</span>
                <span className="font-medium">{selectedReturn.userEmail}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">İade Sebebi</p>
                <p className="text-sm font-medium text-gray-900">{selectedReturn.reason}</p>
              </div>
              {selectedReturn.details && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Açıklama</p>
                  <p className="text-sm text-gray-700">{selectedReturn.details}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedReturn(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Kapat
              </button>
              {selectedReturn.status === 'requested' && (
                <>
                  <button
                    onClick={async () => {
                      setProcessingReturn(true);
                      try {
                        await updateReturnStatus(selectedReturn.id, 'approved', 'İade onaylandı.');
                        setReturns(prev => prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'approved' } : r));
                        setSelectedReturn(prev => prev ? { ...prev, status: 'approved' } : null);
                      } catch { /* handled */ } finally { setProcessingReturn(false); }
                    }}
                    disabled={processingReturn}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    İadeyi Onayla
                  </button>
                  <button
                    onClick={async () => {
                      setProcessingReturn(true);
                      try {
                        await updateReturnStatus(selectedReturn.id, 'rejected', 'İade reddedildi.');
                        setReturns(prev => prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'rejected' } : r));
                        setSelectedReturn(prev => prev ? { ...prev, status: 'rejected' } : null);
                      } catch { /* handled */ } finally { setProcessingReturn(false); }
                    }}
                    disabled={processingReturn}
                    className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Reddet
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
