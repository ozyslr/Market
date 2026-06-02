import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Loader2,
  Package,
  Truck,
  MapPin,
  XCircle,
  ChevronRight,
  Clock,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserOrderSets } from '@/services/orderService';
import { ReorderButton } from '@/components/commerce/ReorderButton';
import type { OrderSet, OrderSetStatus } from '@/types/order';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────

type FilterKey = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface FilterTab {
  key: FilterKey;
  label: string;
  statuses: OrderSetStatus[];
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'Tümü', statuses: [] },
  { key: 'processing', label: 'İşleniyor', statuses: ['pending', 'paid', 'processing'] },
  { key: 'shipped', label: 'Kargoda', statuses: ['shipped'] },
  { key: 'delivered', label: 'Teslim Edildi', statuses: ['delivered'] },
  {
    key: 'cancelled',
    label: 'İptal',
    statuses: ['cancelled', 'refunded', 'return_requested', 'return_rejected'] as OrderSetStatus[],
  },
];

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; icon: React.ComponentType<{ size?: number }> }
> = {
  pending: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
  },
  paid: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Package,
  },
  processing: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Package,
  },
  shipped: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    icon: Truck,
  },
  delivered: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    icon: MapPin,
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    icon: XCircle,
  },
  refunded: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    icon: AlertCircle,
  },
  return_requested: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    icon: AlertCircle,
  },
  returned: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-600 dark:text-zinc-400',
    icon: XCircle,
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    icon: CheckCircle2,
  },
  return_approved: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    icon: AlertCircle,
  },
  return_rejected: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-600 dark:text-zinc-400',
    icon: XCircle,
  },
  on_hold: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: Clock,
  },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  refunded: 'İade Edildi',
  return_requested: 'İade Talep Edildi',
  returned: 'İade Tamamlandı',
  completed: 'Tamamlandı',
  return_approved: 'İade Onaylandı',
  return_rejected: 'İade Reddedildi',
  on_hold: 'Beklemede',
};

// ─── Skeleton ────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-zinc-800 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
        <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24" />
      </div>
      <div className="flex gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-24" />
      </div>
    </div>
  );
}

function OrderHistorySkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mb-8" />
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24 shrink-0" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderSetStatus }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = style.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
        style.bg,
        style.text,
      )}
    >
      <Icon size={12} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Format helpers ──────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatPrice(amount: number, currency = 'TRY'): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// ─── Order Card ──────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderSet }) {
  const subOrderCount = order.subOrderIds?.length || 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-zinc-800 p-5 mb-4 hover:shadow-lg transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-zinc-500 mb-1">
            Siparis #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-brand-primary/50 dark:text-zinc-500 flex items-center gap-1">
            <Clock size={11} />
            {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Sub-order count and quick info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-brand-primary/5 flex items-center justify-center shrink-0">
          <Package size={24} className="text-brand-primary/30" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-primary/70 dark:text-zinc-300">
            {subOrderCount > 1
              ? `${subOrderCount} farkli satcidan siparis`
              : 'Tek satcidan siparis'}
          </p>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-display font-black text-brand-primary dark:text-white">
            {formatPrice(order.totalAmount, order.currency)}
          </p>
          <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500 font-bold">
            {subOrderCount} alt siparis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/orders/${order.id}`}
            className="flex items-center gap-1 py-2 px-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Eye size={12} />
            Detay
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

export function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getUserOrderSets()
      .then(setOrders)
      .catch((err) => {
        console.error('[OrderHistory] Failed to load orders:', err);
        setError('Siparisler yuklenirken bir hata olustu.');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredOrders = useMemo(() => {
    const tab = FILTER_TABS.find((t) => t.key === activeFilter);
    if (!tab || tab.statuses.length === 0) return orders;
    return orders.filter((o) => tab.statuses.includes(o.status));
  }, [orders, activeFilter]);

  // ── Not logged in ────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-brand-primary/30 dark:text-white/30" />
          </div>
          <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-3">
            Siparişlerim
          </h2>
          <p className="text-sm text-brand-primary/50 dark:text-zinc-400 font-bold mb-8">
            Siparişlerinizi görüntülemek için giriş yapın.
          </p>
          <button
            onClick={() => navigate('/?login=1')}
            className="px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return <OrderHistorySkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
          Siparişlerim
        </h1>
        {orders.length > 0 && (
          <span className="ms-1 px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-[10px] font-black">
            {orders.length}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.statuses.length === 0
              ? orders.length
              : orders.filter((o) => tab.statuses.includes(o.status)).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
                activeFilter === tab.key
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-brand-primary/60 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
              )}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-sm font-bold text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-accent text-white rounded-xl font-black text-xs hover:opacity-90 transition-opacity"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-brand-primary/20 dark:text-white/20" />
          </div>
          <p className="text-lg font-display font-black text-brand-primary dark:text-white mb-2">
            {activeFilter === 'all' ? 'Henüz siparişiniz yok' : 'Bu kategoride sipariş bulunamadı'}
          </p>
          <p className="text-sm text-brand-primary/50 dark:text-zinc-400 font-bold mb-8 max-w-sm">
            {activeFilter === 'all'
              ? 'Alışverişe başlayın, siparişleriniz burada görünecek.'
              : 'Farklı bir filtre seçmeyi deneyin.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            <ShoppingBag size={18} />
            <span>Alışverişe Başla</span>
          </Link>
        </div>
      )}

      {/* Order list */}
      {!error && filteredOrders.length > 0 && (
        <div>
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
