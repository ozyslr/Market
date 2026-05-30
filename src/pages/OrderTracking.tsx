import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, Package, Truck, MapPin, ArrowLeft, Navigation, Clock,
  Phone, User, ExternalLink, ChevronRight, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getOrderById, updateOrderStatus } from '@/services/orderService';
import { getTrackingStatus } from '@/services/cargoService';
import type { Order } from '@/types/order';
import type { TrackingResponse, CargoProviderName } from '@/services/cargoService';
import { cn } from '@/lib/utils';

const STEP_LABELS: Record<string, { label: string; icon: any }> = {
  pending:    { label: 'Hazırlanıyor', icon: Package },
  processing: { label: 'Paketleniyor', icon: Package },
  shipped:    { label: 'Kargoda', icon: Truck },
  delivered:  { label: 'Teslim Edildi', icon: MapPin },
  cancelled:  { label: 'İptal Edildi', icon: AlertCircle },
};

function EtaCountdown({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Teslim ediliyor...'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}s ${m}dk`);
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return <span>{remaining}</span>;
}

export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId).then(o => {
      setOrder(o);
      setLoading(false);
      if (o?.trackingNumber && o?.carrier) {
        setTrackingLoading(true);
        getTrackingStatus(o.carrier as CargoProviderName, o.trackingNumber)
          .then(t => {
            setTracking(t);
            // Kargo teslim edildiyse sipariş durumunu otomatik güncelle
            if (t.delivered && o.status === 'shipped') {
              updateOrderStatus(o.id, 'delivered').catch(() => {});
              setOrder(prev => prev ? { ...prev, status: 'delivered' } : prev);
            }
          })
          .finally(() => setTrackingLoading(false));
      }
    });
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-[#1A1033]/40">Sipariş bulunamadı</p>
    </div>
  );

  const isShipped = order.status === 'shipped' || order.status === 'delivered';
  const isDelivered = order.status === 'delivered';
  const currentStep = isDelivered ? 4 : isShipped ? 3 : order.status === 'processing' ? 2 : 1;

  const carrierUrl = order.trackingNumber && order.carrier
    ? `https://www.google.com/search?q=${encodeURIComponent(order.carrier + ' ' + order.trackingNumber)}`
    : null;

  return (
    <div className="min-h-screen bg-[#F8F8FA] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <Link to="/profile" className="inline-flex items-center gap-2 text-xs font-bold text-[#1A1033]/40 hover:text-accent">
          <ArrowLeft size={14} /> Siparişlerime Dön
        </Link>

        {/* Header */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#1A1033]/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30">
              Sipariş #{order.id.slice(-6).toUpperCase()}
            </span>
            <span className={cn(
              'px-3 py-1 rounded-xl text-[10px] font-black uppercase',
              isDelivered ? 'bg-green-50 text-green-600' :
              isShipped ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
            )}>
              {STEP_LABELS[order.status]?.label || order.status}
            </span>
          </div>

          {/* Animated Route Visualization */}
          <div className="relative py-8">
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-[#F8F8FA] rounded-full -translate-y-1/2" />
            <motion.div
              className="absolute top-1/2 left-0 h-1.5 bg-accent rounded-full -translate-y-1/2"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <div className="relative flex justify-between">
              {[
                { step: 1, label: 'Sipariş', icon: Package },
                { step: 2, label: 'Hazırlık', icon: Package },
                { step: 3, label: 'Kargo', icon: Truck },
                { step: 4, label: 'Teslimat', icon: MapPin },
              ].map(({ step, label, icon: Icon }) => {
                const done = currentStep >= step;
                const active = currentStep === step;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                    <motion.div
                      animate={active ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
                        done ? 'bg-accent text-white shadow-lg shadow-accent/20' :
                        'bg-[#F8F8FA] text-[#1A1033]/20'
                      )}
                    >
                      <Icon size={22} />
                    </motion.div>
                    <span className={cn(
                      'text-[9px] font-black uppercase tracking-widest',
                      done ? 'text-accent' : 'text-[#1A1033]/20'
                    )}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Tracking Info */}
        {isShipped && order.trackingNumber && (
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#1A1033]/5 space-y-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/60 flex items-center gap-2">
              <Navigation size={16} className="text-accent" /> Canlı Takip
            </h3>

            {/* Live indicator */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-xs font-black text-green-700">Kargo Yolda</p>
                <p className="text-[10px] text-green-600/70">
                  {order.carrier} · {order.trackingNumber}
                </p>
              </div>
            </div>

            {/* Tracking Events Timeline */}
            {trackingLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
            ) : tracking?.success ? (
              <div className="space-y-1">
                {tracking.events.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-2.5 h-2.5 rounded-full mt-1.5',
                        idx === 0 ? 'bg-accent ring-4 ring-accent/20' :
                        idx === tracking.events.length - 1 ? 'bg-green-500' : 'bg-[#1A1033]/15'
                      )} />
                      {idx < tracking.events.length - 1 && (
                        <div className="w-px flex-1 bg-[#1A1033]/10 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-xs font-black text-[#1A1033]">{event.status}</p>
                      <p className="text-[10px] text-[#1A1033]/50">{event.description}</p>
                      <p className="text-[9px] text-[#1A1033]/30 flex items-center gap-2">
                        {event.location && <span>{event.location}</span>}
                        <span>{new Date(event.timestamp).toLocaleString('tr-TR')}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-[#1A1033]/30">Takip bilgisi alınamadı</p>
              </div>
            )}

            {/* ETA */}
            {tracking?.estimatedDelivery && !tracking.delivered && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                <Clock size={20} className="text-blue-500" />
                <div>
                  <p className="text-xs font-black text-blue-700">Tahmini Teslimat</p>
                  <p className="text-sm font-bold text-blue-600">
                    {new Date(tracking.estimatedDelivery).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-[10px] text-blue-500/70 mt-0.5">
                    <EtaCountdown targetDate={tracking.estimatedDelivery} /> kaldı
                  </p>
                </div>
              </div>
            )}

            {tracking?.delivered && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-sm font-black text-green-700">Teslim Edildi</p>
                <p className="text-[10px] text-green-600/70 mt-1">Siparişiniz başarıyla teslim edildi.</p>
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#1A1033]/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/60 mb-4">Sipariş Detayı</h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} referrerPolicy="no-referrer" loading="lazy"
                  className="w-12 h-12 rounded-xl object-contain bg-[#F8F8FA] p-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#1A1033] line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-[#1A1033]/40">{item.quantity} adet</p>
                </div>
                <span className="text-xs font-black text-[#1A1033]">{item.subtotal.toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#F8F8FA] space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-[#1A1033]/40">Ara Toplam</span><span className="font-bold">{order.subtotal.toFixed(2)} ₺</span></div>
            <div className="flex justify-between"><span className="text-[#1A1033]/40">Kargo</span><span className="font-bold">{order.shipping.toFixed(2)} ₺</span></div>
            <div className="flex justify-between text-sm pt-2 border-t border-[#F8F8FA]">
              <span className="font-black uppercase">Toplam</span>
              <span className="font-black text-accent">{order.total.toFixed(2)} ₺</span>
            </div>
          </div>
        </div>

        {/* Courier Info */}
        {isShipped && order.carrier && (
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#1A1033]/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/60 mb-4">Kurye Bilgisi</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                <Truck size={28} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-black text-[#1A1033]">{order.carrier} Kargo</p>
                <p className="text-[10px] text-[#1A1033]/40">Takip No: {order.trackingNumber}</p>
              </div>
              {carrierUrl && (
                <a href={carrierUrl} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 hover:opacity-90">
                  <ExternalLink size={12} /> Takip Et
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
