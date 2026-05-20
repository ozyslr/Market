import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShoppingCart, CheckCircle, Package, Truck, MapPin, XCircle, ArrowLeft } from 'lucide-react';
import { getOrderById } from '@/services/orderService';
import { Order } from '@/types/order';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'pending',   labelKey: 'order.placed',    icon: ShoppingCart },
  { key: 'confirmed', labelKey: 'order.confirmed',  icon: CheckCircle },
  { key: 'preparing', labelKey: 'order.preparing',  icon: Package },
  { key: 'shipped',   labelKey: 'order.shipped',    icon: Truck },
  { key: 'delivered', labelKey: 'order.delivered',  icon: MapPin },
];

function getCarrierUrl(carrier: string, trackingNo: string): string {
  const map: Record<string, string> = {
    PTT:      `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${trackingNo}`,
    Yurtiçi: `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${trackingNo}`,
    Aras:    `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNo}`,
    MNG:     `https://www.mngkargo.com.tr/gonderi-sorgulama?trackNo=${trackingNo}`,
    Sürat:   `https://www.suratkargo.com.tr/KargoTakip/index?trackingNo=${trackingNo}`,
  };
  return map[carrier] ?? `https://www.google.com/search?q=${encodeURIComponent(carrier + ' ' + trackingNo)}`;
}

function stepIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0, confirmed: 1, preparing: 2,
    shipped: 3, delivered: 4,
  };
  return map[status] ?? -1;
}

export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-[#1A1033]/40 font-bold mb-6">Sipariş bulunamadı.</p>
        <Link to="/profile" className="text-accent font-black text-sm underline">Siparişlerime Dön</Link>
      </div>
    );
  }

  const current = stepIndex(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'return_requested' || order.status === 'returned';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/profile" className="flex items-center gap-2 text-xs font-black text-[#1A1033]/40 hover:text-accent mb-8 uppercase tracking-widest">
        <ArrowLeft size={14} /> Siparişlerime Dön
      </Link>

      <div className="bg-white rounded-[3rem] p-8 border border-[#F8F8FA] shadow-sm mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30 mb-1">{t('order.tracking')}</p>
            <h1 className="text-lg font-display font-black uppercase italic tracking-tight text-[#1A1033]">#{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-xs text-[#1A1033]/40 mt-1">{new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30 mb-1">Toplam</p>
            <p className="text-xl font-black text-[#1A1033]">{order.totalAmount?.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-bold text-red-600">
              {order.status === 'returned' ? 'İade Tamamlandı' : order.status === 'return_requested' ? 'İade Talep Edildi' : 'Sipariş İptal Edildi'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#F8F8FA]" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-accent transition-all duration-700"
              style={{ width: current >= 0 ? `${(current / (STEPS.length - 1)) * 100}%` : '0%' }}
            />
            <div className="relative flex justify-between">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= current;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white',
                      done ? 'border-accent text-accent' : 'border-[#F8F8FA] text-[#1A1033]/20'
                    )}>
                      <Icon size={14} />
                    </div>
                    <span className={cn('text-[9px] font-black uppercase tracking-wide text-center max-w-[56px] leading-tight', done ? 'text-accent' : 'text-[#1A1033]/30')}>
                      {t(step.labelKey)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tracking info */}
      {(order.trackingNumber || order.carrier) && (
        <div className="bg-white rounded-[3rem] p-8 border border-[#F8F8FA] shadow-sm mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30 mb-5">Kargo Bilgileri</h2>
          <div className="space-y-2">
            {order.carrier && (
              <div className="flex justify-between">
                <span className="text-xs text-[#1A1033]/40 font-bold">Kargo Firması</span>
                <span className="text-xs font-black text-[#1A1033]">{order.carrier}</span>
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-xs text-[#1A1033]/40 font-bold">Takip Numarası</span>
                <span className="text-xs font-black font-mono text-[#1A1033]">{order.trackingNumber}</span>
              </div>
            )}
            {order.shippedAt && (
              <div className="flex justify-between">
                <span className="text-xs text-[#1A1033]/40 font-bold">Kargoya Verildi</span>
                <span className="text-xs font-black text-[#1A1033]">
                  {new Date(order.shippedAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
            {order.trackingNumber && (
              <a
                href={getCarrierUrl(order.carrier ?? '', order.trackingNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-[10px] font-black text-accent hover:underline uppercase tracking-widest"
              >
                Kargo Takip Sayfasına Git →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="bg-white rounded-[3rem] p-8 border border-[#F8F8FA] shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30 mb-5">Sipariş Kalemleri</h2>
        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#F8F8FA] last:border-0">
              <div className="flex items-center gap-3">
                {item.image && <img src={item.image} alt={item.title} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" loading="lazy" />}
                <div>
                  <p className="text-xs font-bold text-[#1A1033] line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-[#1A1033]/40">x{item.quantity}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-[#1A1033]">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
