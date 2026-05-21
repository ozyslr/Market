'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Loader2, ArrowLeft, Package, Truck, MapPin,
  CreditCard, Calendar, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { getOrderById } from '@/services/orderService';
import type { Order } from '@/types/order';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:      { label: 'Sipariş Alındı',    color: 'text-amber-600 bg-amber-50',  icon: Clock },
  paid:         { label: 'Ödeme Onaylandı',    color: 'text-blue-600 bg-blue-50',    icon: CreditCard },
  processing:   { label: 'Hazırlanıyor',       color: 'text-purple-600 bg-purple-50', icon: Package },
  shipped:      { label: 'Kargoya Verildi',    color: 'text-blue-600 bg-blue-50',    icon: Truck },
  delivered:    { label: 'Teslim Edildi',      color: 'text-green-600 bg-green-50',  icon: CheckCircle },
  cancelled:    { label: 'İptal Edildi',       color: 'text-red-600 bg-red-50',      icon: XCircle },
  refunded:     { label: 'İade Edildi',        color: 'text-red-600 bg-red-50',      icon: XCircle },
  return_requested: { label: 'İade Talep Edildi', color: 'text-orange-600 bg-orange-50', icon: XCircle },
  returned:     { label: 'İade Tamamlandı',    color: 'text-gray-600 bg-gray-50',    icon: XCircle },
};

const PAYMENT_LABELS: Record<string, string> = {
  stripe: 'Kredi Kartı (Stripe)',
  iyzico: 'Kredi Kartı (Iyzico)',
  paytr:  'Kredi Kartı (PayTR)',
  manual: 'Havale/EFT',
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-lg font-bold text-gray-900 mb-2">Sipariş bulunamadı</p>
        <p className="text-sm text-gray-500 mb-6">Bu sipariş numarasına ait kayıt bulunamadı.</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:underline"
        >
          <ArrowLeft size={14} /> Siparişlerime Dön
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/orders"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} /> Siparişlerim
        </Link>
        {order.trackingNumber && (
          <Link
            href={`/track/${orderId}`}
            className="text-sm font-medium text-purple-600 hover:underline"
          >
            Kargo Takibi →
          </Link>
        )}
      </div>

      {/* Order ID & Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Sipariş No</p>
            <h1 className="text-lg font-bold text-gray-900 font-mono">
              #{order.id.slice(-8).toUpperCase()}
            </h1>
          </div>
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold', statusInfo.color)}>
            <StatusIcon size={14} />
            {statusInfo.label}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} />
            {new Date(order.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <CreditCard size={14} />
            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Teslimat Adresi</h2>
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="text-gray-400">{order.shippingAddress.phone}</p>
            </div>
          </div>
        )}

        {/* Carrier Info */}
        {(order.carrier || order.trackingNumber) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={16} className="text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Kargo Bilgisi</h2>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              {order.carrier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Firma</span>
                  <span className="font-medium text-gray-900">{order.carrier}</span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Takip No</span>
                  <span className="font-medium font-mono text-gray-900">{order.trackingNumber}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Kargoya Verilme</span>
                  <span className="font-medium text-gray-900">
                    {new Date(order.shippedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
              <Link
                href={`/track/${orderId}`}
                className="inline-block mt-2 text-sm font-medium text-purple-600 hover:underline"
              >
                Kargo Takibi →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Sipariş Kalemleri ({order.items?.length || 0})</h2>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name || item.title || 'Ürün'}
                  className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  <Link href={`/product/${item.productId}`} className="hover:text-purple-600 transition-colors">
                    {item.name || item.title}
                  </Link>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.price.toLocaleString('tr-TR')} ₺ x {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900 shrink-0">
                {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Özet</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Ara Toplam</span>
            <span>{order.subtotal?.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Kargo</span>
            <span>{order.shipping === 0 ? 'Ücretsiz' : `${order.shipping?.toLocaleString('tr-TR')} ₺`}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>KDV</span>
            <span>{order.tax?.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Toplam</span>
            <span>{(order.totalAmount ?? order.total)?.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>
    </div>
  );
}
