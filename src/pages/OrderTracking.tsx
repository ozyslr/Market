import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  Package,
  Truck,
  MapPin,
  ArrowLeft,
  Navigation,
  Clock,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  Gift,
  HelpCircle,
  Store,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrderById, updateOrderStatus, getOrderSetDetail } from '@/services/orderService';
import { getTrackingStatus } from '@/services/cargoService';
import { ReorderButton } from '@/components/commerce/ReorderButton';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { SellerOrderActions } from '@/components/orders/SellerOrderActions';
import { useAuth } from '@/context/AuthContext';
import type { Order, OrderSet, SubOrder } from '@/types/order';
import type { TrackingResponse, CargoProviderName } from '@/services/cargoService';
import type { ReturnRequest, ReturnReason, ReturnStatus } from '@/types/returns';
import { cn } from '@/lib/utils';

// ─── Return reason labels (TR) ────────────────────────────────────────────
const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  wrong_item: 'Yanlış Ürün',
  damaged: 'Hasarlı Ürün',
  not_as_described: 'Açıklamaya Uymuyor',
  changed_mind: 'Fikir Değişikliği',
  other: 'Diğer',
};

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: 'İade Talebi Alındı',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  label_sent: 'İade Etiketi Gönderildi',
  received: 'Ürün Alındı',
  refunded: 'İade Edildi',
};

// ─── Constants ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, { label: string; icon: any }> = {
  pending: { label: 'Hazırlanıyor', icon: Package },
  processing: { label: 'Paketleniyor', icon: Package },
  shipped: { label: 'Kargoda', icon: Truck },
  delivered: { label: 'Teslim Edildi', icon: MapPin },
  cancelled: { label: 'İptal Edildi', icon: AlertCircle },
};

const TIMELINE_STEPS = [
  { key: 'ordered', label: 'Sipariş Alındı', icon: CheckCircle2 },
  { key: 'preparing', label: 'Hazırlanıyor', icon: Package },
  { key: 'shipped', label: 'Kargoya Verildi', icon: Truck },
  { key: 'delivered', label: 'Teslim Edildi', icon: MapPin },
] as const;

const PAYMENT_META: Record<string, { icon: any; label: string }> = {
  stripe: { icon: CreditCard, label: 'Kredi Kartı' },
  iyzico: { icon: CreditCard, label: 'Kredi Kartı' },
  paytr: { icon: CreditCard, label: 'Kredi Kartı' },
  manual: { icon: Gift, label: 'Havale / EFT' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function getStepDate(order: Order, stepKey: string): Date | null {
  switch (stepKey) {
    case 'ordered':
      return order.createdAt ? new Date(order.createdAt) : null;
    case 'preparing':
      if (order.paidAt) return new Date(order.paidAt);
      if (['processing', 'shipped', 'delivered'].includes(order.status) && order.createdAt)
        return new Date(order.createdAt);
      return null;
    case 'shipped':
      if (order.shippedAt) return new Date(order.shippedAt);
      if (['shipped', 'delivered'].includes(order.status) && order.updatedAt)
        return new Date(order.updatedAt);
      return null;
    case 'delivered':
      if (order.status === 'delivered' && order.updatedAt) return new Date(order.updatedAt);
      return null;
    case 'cancelled':
      return order.updatedAt ? new Date(order.updatedAt) : null;
    default:
      return null;
  }
}

// ─── D. Enhanced ETA Countdown ──────────────────────────────────────────

function EtaCountdown({ targetDate }: { targetDate: string }) {
  const target = new Date(targetDate).getTime();
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [target]);

  const { days, hours, minutes } = remaining;
  const label =
    days > 0
      ? `${days} gün ${hours} saat`
      : hours > 0
        ? `${hours} saat ${minutes} dk`
        : minutes > 0
          ? `${minutes} dakika`
          : 'Teslim ediliyor...';

  const isImminent = days === 0 && hours < 1;
  const colorClass =
    days > 3
      ? 'text-green-600 dark:text-green-400'
      : days >= 1
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <motion.span
      className={cn('inline-flex items-center gap-1.5 text-xs font-bold', colorClass)}
      animate={isImminent ? { scale: [1, 1.04, 1] } : {}}
      transition={isImminent ? { repeat: Infinity, duration: 2 } : {}}
    >
      <Clock size={14} />
      <span>{label}</span>
    </motion.span>
  );
}

// ─── A. Vertical Timeline ───────────────────────────────────────────────

function LegacyOrderTimeline({ order, currentStep }: { order: Order; currentStep: number }) {
  const isCancelled = order.status === 'cancelled';

  const timelineSteps = isCancelled
    ? [
        { key: 'ordered' as const, label: 'Sipariş Alındı', icon: CheckCircle2 },
        { key: 'cancelled' as const, label: 'İptal Edildi', icon: AlertCircle },
      ]
    : [...TIMELINE_STEPS];

  // For cancelled: step 0 (ordered) is completed, step 1 (cancelled) is active-in-red
  // For normal: convert 1-based currentStep to 0-based active index
  const activeIndex = isCancelled ? 1 : currentStep - 1;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800">
      <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 mb-6 flex items-center gap-2">
        <Navigation size={16} className="text-accent" /> Sipariş Durumu
      </h3>

      <div className="relative">
        {timelineSteps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isCancelledStep = isCancelled && step.key === 'cancelled';
          const date = getStepDate(order, step.key);

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.12 }}
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {/* Connector line (gradient) */}
              {idx < timelineSteps.length - 1 && (
                <div className="absolute start-5 top-10 bottom-0 w-0.5 overflow-hidden rounded-full">
                  <div className="h-full w-full bg-[#F8F8FA] dark:bg-zinc-800" />
                  <motion.div
                    className={cn(
                      'absolute top-0 start-0 w-full rounded-full',
                      isCancelled && idx === 0
                        ? 'bg-gradient-to-b from-accent to-red-500'
                        : 'bg-gradient-to-b from-accent via-accent to-accent/40',
                    )}
                    initial={{ height: '0%' }}
                    animate={{ height: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.15 }}
                  />
                </div>
              )}

              {/* Icon circle */}
              <motion.div
                animate={
                  isActive && !isCompleted && !isCancelledStep
                    ? { scale: [1, 1.12, 1] }
                    : isCompleted
                      ? { scale: [0.9, 1] }
                      : isCancelledStep
                        ? { scale: [1, 1.08, 1] }
                        : {}
                }
                transition={{ duration: 0.4 }}
                className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  isCompleted
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : isCancelledStep
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                      : isActive
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'bg-[#F8F8FA] dark:bg-zinc-800 text-brand-primary/20 dark:text-zinc-600',
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <CheckCircle2 size={18} />
                  </motion.div>
                ) : (
                  <step.icon size={18} />
                )}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <p
                  className={cn(
                    'text-sm font-black',
                    isCancelledStep
                      ? 'text-red-600 dark:text-red-400'
                      : isCompleted || isActive
                        ? 'text-brand-primary dark:text-white'
                        : 'text-brand-primary/20 dark:text-zinc-600',
                  )}
                >
                  {step.label}
                </p>
                {date && (
                  <p
                    className={cn(
                      'text-[11px] mt-0.5',
                      isCompleted || isActive
                        ? 'text-brand-primary/50 dark:text-zinc-400'
                        : 'text-brand-primary/20 dark:text-zinc-600',
                    )}
                  >
                    {date.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {isActive && !isCompleted && !isCancelled && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-widest text-accent"
                  >
                    Su Anda Burada
                  </motion.span>
                )}
                {isCancelledStep && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-widest text-red-500"
                  >
                    Siparis Iptal Edildi
                  </motion.span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── C. Carrier Tracking Card ───────────────────────────────────────────

function CarrierTrackingCard({
  order,
  tracking,
}: {
  order: Order;
  tracking: TrackingResponse | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!order.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const carrierUrl =
    order.trackingNumber && order.carrier
      ? `https://www.google.com/search?q=${encodeURIComponent(order.carrier + ' ' + order.trackingNumber)}`
      : null;

  const lastEvent = tracking?.events?.[0] ?? null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800">
      <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 mb-5 flex items-center gap-2">
        <Truck size={16} className="text-accent" /> Kargo Takibi
      </h3>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center shrink-0">
          <Truck size={28} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-brand-primary dark:text-white text-sm">
            {order.carrier} Kargo
          </p>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-[11px] text-brand-primary/60 dark:text-zinc-400 font-mono bg-[#F8F8FA] dark:bg-zinc-800 px-2 py-0.5 rounded-lg truncate max-w-[180px]">
              {order.trackingNumber}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-[#F8F8FA] dark:hover:bg-zinc-800 transition-colors shrink-0"
              title="Takip numarasini kopyala"
            >
              {copied ? (
                <CheckCircle2 size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-brand-primary/40 dark:text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Last tracking status */}
      {lastEvent && (
        <div className="mt-5 pt-4 border-t border-[#F8F8FA] dark:border-zinc-800">
          <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500 mb-1 font-bold uppercase tracking-wider">
            Son Guncelleme
          </p>
          <p className="text-xs font-bold text-brand-primary/80 dark:text-zinc-300">
            {lastEvent.status}
          </p>
          <p className="text-[10px] text-brand-primary/50 dark:text-zinc-400">
            {lastEvent.description}
          </p>
          <p className="text-[9px] text-brand-primary/30 dark:text-zinc-500 mt-0.5">
            {new Date(lastEvent.timestamp).toLocaleString('tr-TR')}
          </p>
        </div>
      )}

      {/* Tracking button */}
      {carrierUrl && (
        <a
          href={carrierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <ExternalLink size={14} /> Kargoyu Takip Et
        </a>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

// ─── Return status badge ─────────────────────────────────────────────────

function ReturnStatusBadge({ activeReturn }: { activeReturn: ReturnRequest }) {
  const label = RETURN_STATUS_LABELS[activeReturn.status] ?? activeReturn.status;
  const colorClass =
    activeReturn.status === 'pending'
      ? 'bg-amber-50 text-amber-700'
      : activeReturn.status === 'approved' || activeReturn.status === 'label_sent'
        ? 'bg-green-50 text-green-700'
        : activeReturn.status === 'rejected'
          ? 'bg-red-50 text-red-700'
          : activeReturn.status === 'refunded'
            ? 'bg-purple-50 text-purple-700'
            : 'bg-blue-50 text-blue-700';

  return (
    <div className="mt-3 space-y-2">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest',
          colorClass,
        )}
      >
        <RotateCcw size={12} />
        {label}
      </div>
      {activeReturn.returnLabelUrl && (
        <a
          href={activeReturn.returnLabelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[10px] font-bold text-accent underline hover:opacity-80"
        >
          İade Etiketini İndir
        </a>
      )}
      {activeReturn.rejectionReason && (
        <p className="text-[10px] text-red-600 font-bold">
          Red sebebi: {activeReturn.rejectionReason}
        </p>
      )}
    </div>
  );
}

// ─── Per-SubOrder return section ──────────────────────────────────────────

function SubOrderReturnSection({
  orderSetId,
  subOrderId,
}: {
  orderSetId: string;
  subOrderId: string;
}) {
  const { firebaseUser } = useAuth();
  const [returnFormState, setReturnFormState] = useState<
    'idle' | 'form' | 'submitting' | 'submitted'
  >('idle');
  const [returnReason, setReturnReason] = useState<ReturnReason>('wrong_item');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);
  const [activeReturn, setActiveReturn] = useState<ReturnRequest | null>(null);
  const [fetchingReturn, setFetchingReturn] = useState(true);

  // Fetch existing return for this subOrder
  useEffect(() => {
    let cancelled = false;
    async function fetchActiveReturn() {
      setFetchingReturn(true);
      try {
        const q = query(
          collection(db, 'returns'),
          where('subOrderId', '==', subOrderId),
          orderBy('createdAt', 'desc'),
          limit(1),
        );
        const snap = await getDocs(q);
        if (!cancelled && !snap.empty) {
          const doc = snap.docs[0];
          setActiveReturn({ id: doc.id, ...doc.data() } as ReturnRequest);
        }
      } catch {
        // non-blocking — no return found or permission denied
      } finally {
        if (!cancelled) setFetchingReturn(false);
      }
    }
    fetchActiveReturn();
    return () => {
      cancelled = true;
    };
  }, [subOrderId, returnFormState === 'submitted']);

  const handleSubmit = async () => {
    if (!firebaseUser) return;
    setReturnFormState('submitting');
    setReturnError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/orders/${orderSetId}/subOrders/${subOrderId}/return-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: returnReason,
          ...(returnNotes.trim() ? { notes: returnNotes.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setReturnFormState('submitted');
      } else if (res.status === 409 && data?.error === 'return_window_expired') {
        setReturnError('İade süresi doldu');
        setReturnFormState('form');
      } else if (res.status === 409) {
        setReturnError('Bu sipariş için zaten bir iade talebi mevcut');
        setReturnFormState('form');
      } else {
        setReturnError(data?.error ?? `Hata: ${res.status}`);
        setReturnFormState('form');
      }
    } catch {
      setReturnError('Ağ hatası. Lütfen tekrar deneyin.');
      setReturnFormState('form');
    }
  };

  if (fetchingReturn) return null;

  // Already has an active return
  if (activeReturn || returnFormState === 'submitted') {
    return activeReturn ? (
      <ReturnStatusBadge activeReturn={activeReturn} />
    ) : (
      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700">
        <RotateCcw size={12} /> İade Talebi Alındı
      </div>
    );
  }

  // Form state
  if (returnFormState === 'form' || returnFormState === 'submitting') {
    return (
      <div className="mt-3 space-y-3 p-4 bg-[#F8F8FA] dark:bg-zinc-800/50 rounded-2xl border border-brand-primary/5 dark:border-zinc-700">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400">
          İade Sebebi
        </p>
        <select
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
          disabled={returnFormState === 'submitting'}
          className="w-full text-xs font-bold bg-white dark:bg-zinc-900 border border-brand-primary/10 dark:border-zinc-700 rounded-xl px-3 py-2 text-brand-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        >
          {(Object.entries(RETURN_REASON_LABELS) as [ReturnReason, string][]).map(
            ([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ),
          )}
        </select>
        <textarea
          value={returnNotes}
          onChange={(e) => setReturnNotes(e.target.value)}
          maxLength={500}
          placeholder="Ek açıklama (isteğe bağlı)"
          disabled={returnFormState === 'submitting'}
          rows={3}
          className="w-full text-xs bg-white dark:bg-zinc-900 border border-brand-primary/10 dark:border-zinc-700 rounded-xl px-3 py-2 text-brand-primary dark:text-white placeholder-[#1A1033]/30 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none disabled:opacity-50"
        />
        {returnError && <p className="text-[10px] font-bold text-red-600">{returnError}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={returnFormState === 'submitting'}
            className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {returnFormState === 'submitting' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : null}
            Gönder
          </button>
          <button
            onClick={() => {
              setReturnFormState('idle');
              setReturnError(null);
            }}
            disabled={returnFormState === 'submitting'}
            className="px-4 py-2 border border-brand-primary/10 dark:border-zinc-700 text-brand-primary/60 dark:text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F8F8FA] dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            İptal
          </button>
        </div>
      </div>
    );
  }

  // Idle — show button
  return (
    <button
      onClick={() => setReturnFormState('form')}
      data-return-request
      className="mt-1 px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
    >
      İade Talebi Oluştur
    </button>
  );
}

export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderSet, setOrderSet] = useState<(OrderSet & { subOrders: SubOrder[] }) | null>(null);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [useNewModel, setUseNewModel] = useState(false);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;

    // Try new OrderSet API first, fall back to old Order model
    getOrderSetDetail(orderId)
      .then((os) => {
        setOrderSet(os);
        setUseNewModel(true);
        setLoading(false);
      })
      .catch(() => {
        // Fall back to old Order model
        getOrderById(orderId).then((o) => {
          setOrder(o);
          setUseNewModel(false);
          setLoading(false);
          if (o?.trackingNumber && o?.carrier) {
            setTrackingLoading(true);
            getTrackingStatus(o.carrier as CargoProviderName, o.trackingNumber)
              .then((t) => {
                setTracking(t);
                // Auto-update order status to delivered when tracking confirms delivery
                if (t.delivered && o.status === 'shipped') {
                  updateOrderStatus(o.id, 'delivered').catch(() => {});
                  setOrder((prev) => (prev ? { ...prev, status: 'delivered' } : prev));
                }
              })
              .finally(() => setTrackingLoading(false));
          }
        });
      });
  }, [orderId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  if (!order && !orderSet)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-brand-primary/40">Siparis bulunamadi</p>
      </div>
    );

  if (useNewModel && orderSet) {
    // ─── New OrderSet + SubOrder render ──────────────────────────────────────
    const totalItems = orderSet.subOrders.reduce(
      (sum, so) => sum + so.items.reduce((si, i) => si + i.quantity, 0),
      0,
    );

    return (
      <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back */}
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-primary/40 dark:text-zinc-500 hover:text-accent transition-colors"
          >
            <ArrowLeft size={14} /> Siparislerime Don
          </Link>

          {/* OrderSet Summary Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 dark:text-zinc-500">
                  Siparis #{orderSet.id.slice(-6).toUpperCase()}
                </span>
                <p className="text-xs text-brand-primary/50 dark:text-zinc-400 mt-1">
                  {new Date(orderSet.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-brand-primary/40 dark:text-zinc-500">
                  {totalItems} urun, {orderSet.subOrders.length} alt siparis
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  {orderSet.status}
                </span>
                <span className="text-xl font-black text-brand-primary dark:text-white">
                  {orderSet.totalAmount.toFixed(2)} {orderSet.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Order lifecycle timeline (OrderSet level) */}
          <OrderTimeline status={orderSet.status} />

          {/* SubOrders */}
          {orderSet.subOrders.map((subOrder) => (
            <div
              key={subOrder.id}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800"
            >
              {/* SubOrder header with seller + status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-accent" />
                  <span className="text-xs font-black text-brand-primary dark:text-white">
                    Satici: {subOrder.sellerId.slice(0, 12)}
                  </span>
                </div>
                <SellerOrderActions
                  subOrderId={subOrder.id}
                  orderSetId={orderSet.id}
                  currentStatus={subOrder.status}
                  onTransition={() => {
                    getOrderSetDetail(orderSet.id)
                      .then((os) => setOrderSet(os))
                      .catch(() => {});
                  }}
                />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {subOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-xl bg-[#F8F8FA]/50 dark:bg-zinc-800/30"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-12 h-12 rounded-lg object-contain bg-white dark:bg-zinc-900 p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-primary dark:text-white line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500">
                        {item.quantity} adet x {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs font-black text-brand-primary dark:text-white shrink-0">
                      {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* SubOrder footer */}
              <div className="mt-4 pt-3 border-t border-[#F8F8FA] dark:border-zinc-800 flex justify-between text-xs">
                <span className="text-brand-primary/40 dark:text-zinc-500">Ara Toplam</span>
                <span className="font-bold text-brand-primary dark:text-white">
                  {subOrder.subtotal.toFixed(2)}
                </span>
              </div>

              {/* Shipping tracking section — shown when shipped or delivered */}
              {(subOrder.status === 'shipped' || subOrder.status === 'delivered') && (
                <div className="mt-4 pt-4 border-t border-[#F8F8FA] dark:border-zinc-800 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 dark:text-zinc-400 flex items-center gap-2">
                    <Truck size={13} className="text-accent" /> Kargo Takibi
                  </h4>

                  {/* Carrier + tracking number */}
                  {(subOrder.carrier || subOrder.trackingNumber) && (
                    <div className="flex items-center gap-3 flex-wrap">
                      {subOrder.carrier && (
                        <span className="text-xs font-bold text-brand-primary dark:text-white">
                          {subOrder.carrier}
                        </span>
                      )}
                      {subOrder.trackingNumber && (
                        <code className="text-[11px] font-mono bg-[#F8F8FA] dark:bg-zinc-800 text-brand-primary/60 dark:text-zinc-400 px-2 py-0.5 rounded-lg">
                          {subOrder.trackingNumber}
                        </code>
                      )}
                    </div>
                  )}

                  {/* currentTrackingStatus badge */}
                  {(() => {
                    const STATUS_LABELS: Record<string, string> = {
                      pre_transit: 'Gönderime Hazırlanıyor',
                      in_transit: 'Yolda',
                      out_for_delivery: 'Dağıtımda',
                      delivered: 'Teslim Edildi',
                      'Kabul Edildi': 'Kabul Edildi',
                      Yolda: 'Yolda',
                      Dağıtımda: 'Dağıtımda',
                      'Teslim Edildi': 'Teslim Edildi',
                    };
                    const raw = subOrder.currentTrackingStatus;
                    const label = raw ? (STATUS_LABELS[raw] ?? raw) : 'Durum Bekleniyor';
                    const isDeliveredStatus = raw === 'delivered' || raw === 'Teslim Edildi';
                    return (
                      <span
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest',
                          isDeliveredStatus
                            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                            : raw === 'out_for_delivery' || raw === 'Dağıtımda'
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
                        )}
                      >
                        {label}
                      </span>
                    );
                  })()}

                  {/* estimatedDelivery */}
                  {subOrder.estimatedDelivery && (
                    <p className="text-xs text-brand-primary/50 dark:text-zinc-400 flex items-center gap-1.5">
                      <Clock size={12} className="text-accent shrink-0" />
                      Tahmini Teslimat:{' '}
                      <span className="font-bold text-brand-primary dark:text-white">
                        {new Date(subOrder.estimatedDelivery).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  )}

                  {/* Return request section (delivered within 14 days) */}
                  {subOrder.status === 'delivered' &&
                    subOrder.deliveredAt &&
                    (() => {
                      const daysElapsed =
                        (Date.now() - new Date(subOrder.deliveredAt).getTime()) / 86400000;
                      return daysElapsed <= 14 ? (
                        <SubOrderReturnSection orderSetId={orderSet.id} subOrderId={subOrder.id} />
                      ) : (
                        <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500 font-bold">
                          İade süresi doldu (14 gün)
                        </p>
                      );
                    })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Old Order model (existing render, unchanged) ──────────────────────────
  const o = order!;
  const isShipped = o.status === 'shipped' || o.status === 'delivered';
  const isDelivered = o.status === 'delivered';
  const currentStep = isDelivered ? 4 : isShipped ? 3 : o.status === 'processing' ? 2 : 1;

  const paymentMeta = PAYMENT_META[o.paymentMethod] || PAYMENT_META.stripe;

  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-primary/40 dark:text-zinc-500 hover:text-accent transition-colors"
        >
          <ArrowLeft size={14} /> Siparişlerime Dön
        </Link>

        {/* ───── E. Order Summary Card ───── */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Left: order id + date + item count */}
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 dark:text-zinc-500">
                Sipariş #{o.id.slice(-6).toUpperCase()}
              </span>
              <p className="text-xs text-brand-primary/50 dark:text-zinc-400 mt-1">
                {new Date(o.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-brand-primary/40 dark:text-zinc-500">
                {o.items.length} ürün
              </p>
            </div>
            {/* Right: status badge + total */}
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  'px-3 py-1 rounded-xl text-[10px] font-black uppercase',
                  isDelivered
                    ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
                    : isShipped
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      : o.status === 'cancelled'
                        ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
                )}
              >
                {STEP_LABELS[o.status]?.label || o.status}
              </span>
              <span className="text-xl font-black text-brand-primary dark:text-white">
                {o.total.toFixed(2)} ₺
              </span>
            </div>
          </div>

          {/* Payment method + Quick actions */}
          <div className="mt-5 pt-4 border-t border-[#F8F8FA] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <paymentMeta.icon size={14} className="text-brand-primary/40 dark:text-zinc-500" />
              <span className="text-[10px] text-brand-primary/40 dark:text-zinc-500 uppercase tracking-wider">
                {paymentMeta.label}
                {o.installment && o.installment > 1 ? ` (${o.installment} taksit)` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {['delivered', 'paid'].includes(o.status) && (
                <ReorderButton orderId={o.id} userId={o.userId} />
              )}
              <Link
                to="/iletisim"
                className="flex items-center gap-1.5 py-2 px-3 border border-brand-primary/10 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 hover:border-accent hover:text-accent transition-all"
              >
                <HelpCircle size={12} />
                Destek
              </Link>
            </div>
          </div>
        </div>

        {/* ───── A. Vertical Timeline ───── */}
        <LegacyOrderTimeline order={o} currentStep={currentStep} />

        {/* ───── B. Order Items Grid ───── */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 mb-6">
            Sipariş Detayı
          </h3>

          <div className="space-y-3">
            {o.items.map((item, i) => (
              <Link
                key={i}
                to={`/urun/${item.productId}`}
                className="flex items-center gap-4 p-3 rounded-2xl bg-[#F8F8FA]/50 dark:bg-zinc-800/30 hover:bg-[#F8F8FA] dark:hover:bg-zinc-800 transition-colors group"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-16 h-16 rounded-xl object-contain bg-white dark:bg-zinc-900 p-2 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-primary dark:text-white line-clamp-2 group-hover:text-accent transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500 mt-1">
                    {item.quantity} adet x {item.price.toFixed(2)} ₺
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-brand-primary dark:text-white">
                    {item.subtotal.toFixed(2)} ₺
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-brand-primary/20 dark:text-zinc-600 shrink-0"
                />
              </Link>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-[#F8F8FA] dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-primary/40 dark:text-zinc-500">Ara Toplam</span>
              <span className="font-bold text-brand-primary dark:text-white">
                {o.subtotal.toFixed(2)} ₺
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-primary/40 dark:text-zinc-500">Kargo</span>
              <span className="font-bold text-brand-primary dark:text-white">
                {o.shipping.toFixed(2)} ₺
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-[#F8F8FA] dark:border-zinc-800">
              <span className="font-black uppercase text-brand-primary dark:text-white">
                Toplam
              </span>
              <span className="font-black text-accent">{o.total.toFixed(2)} ₺</span>
            </div>
          </div>

          {/* Reorder (kept below items for consistency) */}
          {['delivered', 'paid'].includes(o.status) && (
            <div className="mt-6 pt-4 border-t border-[#F8F8FA] dark:border-zinc-800 flex justify-center">
              <ReorderButton orderId={o.id} userId={o.userId} />
            </div>
          )}
        </div>

        {/* ───── C. Carrier Tracking Card ───── */}
        {isShipped && o.trackingNumber && o.carrier && (
          <CarrierTrackingCard order={o} tracking={tracking} />
        )}

        {/* ───── Live Tracking Info (kept from original) ───── */}
        {isShipped && o.trackingNumber && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-brand-primary/5 dark:border-zinc-800 space-y-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 flex items-center gap-2">
              <Navigation size={16} className="text-accent" /> Canlı Takip
            </h3>

            {/* Live indicator */}
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-2xl p-4">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-xs font-black text-green-700 dark:text-green-400">Kargo Yolda</p>
                <p className="text-[10px] text-green-600/70 dark:text-green-400/60">
                  {o.carrier} · {o.trackingNumber}
                </p>
              </div>
            </div>

            {/* Tracking Events Timeline */}
            {trackingLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : tracking?.success ? (
              <div className="space-y-1">
                {tracking.events.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-2.5 h-2.5 rounded-full mt-1.5',
                          idx === 0
                            ? 'bg-accent ring-4 ring-accent/20'
                            : idx === tracking.events.length - 1
                              ? 'bg-green-500'
                              : 'bg-brand-primary/15 dark:bg-zinc-700',
                        )}
                      />
                      {idx < tracking.events.length - 1 && (
                        <div className="w-px flex-1 bg-brand-primary/10 dark:bg-zinc-800 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-xs font-black text-brand-primary dark:text-white">
                        {event.status}
                      </p>
                      <p className="text-[10px] text-brand-primary/50 dark:text-zinc-400">
                        {event.description}
                      </p>
                      <p className="text-[9px] text-brand-primary/30 dark:text-zinc-500 flex items-center gap-2">
                        {event.location && <span>{event.location}</span>}
                        <span>{new Date(event.timestamp).toLocaleString('tr-TR')}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-brand-primary/30 dark:text-zinc-500">
                  Takip bilgisi alınamadı
                </p>
              </div>
            )}

            {/* ETA */}
            {tracking?.estimatedDelivery && !tracking.delivered && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 flex items-center gap-3">
                <Clock size={20} className="text-blue-500" />
                <div>
                  <p className="text-xs font-black text-blue-700 dark:text-blue-400">
                    Tahmini Teslimat
                  </p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-300">
                    {new Date(tracking.estimatedDelivery).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-[10px] text-blue-500/70 dark:text-blue-300/60 mt-0.5 flex items-center gap-1">
                    <EtaCountdown targetDate={tracking.estimatedDelivery} /> kaldi
                  </p>
                </div>
              </div>
            )}

            {tracking?.delivered && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-2xl p-4 text-center">
                <p className="text-sm font-black text-green-700 dark:text-green-400">
                  Teslim Edildi
                </p>
                <p className="text-[10px] text-green-600/70 dark:text-green-400/60 mt-1">
                  Siparişiniz başarıyla teslim edildi.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
