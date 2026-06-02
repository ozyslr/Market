import React, { useState, useEffect } from 'react';
import {
  Package,
  Heart,
  MapPin,
  Settings,
  Star,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Zap,
  LayoutDashboard,
  ArrowRight,
  Camera,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  RotateCcw,
  Store,
  CreditCard,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { MOCK_SELLERS } from '@/data/mockSellers';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { useFollows } from '@/context/FollowsContext';
import { ReturnRequestModal } from '@/components/profile/ReturnRequestModal';
import { getOrdersByUser } from '@/services/orderService';
import { Order, OrderStatus } from '@/types/order';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { SavedPaymentMethod } from '@/components/profile/SavedPaymentMethod';
import { ProductCard } from '@/components/commerce/ProductCard';
import { ReorderButton } from '@/components/commerce/ReorderButton';
import { getUserTracks, untrackPrice, PriceTrack } from '@/services/priceTrackService';

type ProfileTab =
  | 'overview'
  | 'orders'
  | 'favorites'
  | 'pricetracks'
  | 'stores'
  | 'addresses'
  | 'payment'
  | 'settings';

const TABS: { key: ProfileTab; labelKey: string; icon: React.ElementType }[] = [
  { key: 'overview', labelKey: 'profile.overview', icon: LayoutDashboard },
  { key: 'orders', labelKey: 'profile.orders', icon: Package },
  { key: 'favorites', labelKey: 'profile.favorites', icon: Heart },
  { key: 'pricetracks', labelKey: 'profile.priceAlerts', icon: TrendingUp },
  { key: 'stores', labelKey: 'profile.followedStores', icon: Store },
  { key: 'addresses', labelKey: 'profile.addresses', icon: MapPin },
  { key: 'payment', labelKey: 'profile.payment', icon: CreditCard },
  { key: 'settings', labelKey: 'profile.settings', icon: Settings },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: Clock },
  paid: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle2 },
  processing: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: RefreshCw },
  shipped: { color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: Truck },
  delivered: {
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: CheckCircle2,
  },
  cancelled: { color: 'text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  refunded: { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: RotateCcw },
  return_requested: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: RotateCcw,
  },
  returned: { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: RotateCcw },
};

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'processing', label: 'Hazırlanıyor' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
];

const OrderCard: React.FC<{ order: Order; expanded?: boolean }> = ({ order, expanded = false }) => {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon as React.ElementType;
  const navigate = useNavigate();
  const [showReturn, setShowReturn] = useState(false);

  // İade yalnızca teslim edilmiş siparişlerde mümkün
  const canReturn = order.status === 'delivered';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-brand-primary/5 hover:border-accent/20 transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-black text-brand-primary dark:text-white">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500 font-medium mt-0.5 uppercase tracking-widest">
            {new Date(order.createdAt).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
              cfg.color,
              cfg.bg,
            )}
          >
            <StatusIcon size={10} /> {order.status}
          </span>
          <span className="text-sm font-black text-brand-primary dark:text-white">
            {order.currency} {order.total.toFixed(2)}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
          {order.items.map((item, idx) => {
            const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
            return (
              <div
                key={idx}
                className="shrink-0 w-14 h-14 rounded-xl bg-brand-secondary/50 dark:bg-zinc-800 p-1.5"
              >
                <img
                  src={item.image || product?.images[0]}
                  alt={item.name || product?.title}
                  loading="lazy"
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/orders/${order.id}`)}
          className="flex-1 py-2 bg-brand-secondary dark:bg-zinc-800 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
        >
          Takip Et
        </button>
        {['delivered', 'paid'].includes(order.status) && (
          <ReorderButton orderId={order.id} userId={order.userId} className="flex-1" />
        )}
        {canReturn && (
          <button
            onClick={() => setShowReturn(true)}
            className="flex-1 py-2 border border-brand-primary/10 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 hover:border-accent hover:text-accent transition-all"
          >
            İade Talebi
          </button>
        )}
      </div>

      {showReturn && <ReturnRequestModal order={order} onClose={() => setShowReturn(false)} />}
    </div>
  );
};

function DataDeletionButton() {
  const [showModal, setShowModal] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { getAuth } = await import('firebase/auth');
      const current = getAuth().currentUser;
      if (!current) throw new Error('Oturum bulunamadi');
      const token = await current.getIdToken();
      const res = await fetch('/api/compliance/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Istek gonderilemedi');
      }
      setDone(true);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {done ? (
        <p className="text-[10px] font-bold text-green-600 dark:text-green-400">
          Silme talebiniz alinmistir. Admin onayindan sonra isleme alinacaktir.
        </p>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
        >
          Verilerimi Sil
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[16000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-brand-primary/10">
            <h3 className="text-sm font-black text-brand-primary dark:text-white mb-2">
              Veri Silme Talebi
            </h3>
            <p className="text-[11px] text-brand-primary/60 dark:text-white/60 mb-4">
              Verileriniz kalici olarak silinecektir. Bu islem geri alinamaz. Devam etmek
              istediginize emin misiniz?
            </p>
            {error && <p className="text-[10px] text-red-500 mb-3">{error}</p>}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Silme sebebinizi kisaca aciklayin (en az 5 karakter)"
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-brand-primary dark:text-white border border-brand-primary/10 mb-4 resize-none h-20"
              minLength={5}
              maxLength={500}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting || reason.length < 5}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-40"
              >
                {submitting ? 'Gonderiliyor...' : 'Onayla ve Gonder'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-brand-primary/10 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Iptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function UserProfilePage() {
  const { user: authUser, firebaseUser, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const { followedSellers, toggleFollow, loading: followsLoading } = useFollows();
  const { items: cartItems, updateQuantity, removeItem } = useCart();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    (searchParams.get('tab') as ProfileTab) ?? 'overview',
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [tracks, setTracks] = useState<PriceTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser || activeTab !== 'pricetracks') return;
    setTracksLoading(true);
    getUserTracks(firebaseUser.uid)
      .then((data) => {
        setTracks(data);
      })
      .catch((err) => {
        console.error('Error fetching price tracks:', err);
      })
      .finally(() => {
        setTracksLoading(false);
      });
  }, [firebaseUser, activeTab]);

  const handleRemoveTrack = async (productId: string) => {
    if (!firebaseUser) return;
    try {
      await untrackPrice(firebaseUser.uid, productId);
      setTracks((prev) => prev.filter((t) => t.productId !== productId));
    } catch (err) {
      console.error('Error untracking price:', err);
    }
  };

  const trackedProducts = tracks
    .map((track) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === track.productId);
      return { track, product };
    })
    .filter(
      (item): item is { track: PriceTrack; product: (typeof MOCK_PRODUCTS)[0] } =>
        item.product !== undefined,
    );

  useEffect(() => {
    if (!firebaseUser) return;
    setOrdersLoading(true);
    getOrdersByUser(firebaseUser.uid).then((data) => {
      setOrders(data);
      setOrdersLoading(false);
    });
  }, [firebaseUser]);

  function changeTab(tab: ProfileTab) {
    setActiveTab(tab);
    setSearchParams({ tab });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-secondary/30 dark:bg-zinc-950">
        <div className="w-10 h-10 border-2 border-brand-primary/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser) return <Navigate to="/" replace />;

  const totalSpent = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const activeOrdersCount = orders.filter((o) =>
    ['pending', 'processing', 'shipped', 'paid'].includes(o.status),
  ).length;
  const userRole = authUser.role;

  const wishlistProducts = MOCK_PRODUCTS.filter((p) => wishlist.includes(p.id));
  const cartLineItems = cartItems
    .map((it) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === it.productId);
      return product ? { item: it, product } : null;
    })
    .filter(
      (x): x is { item: (typeof cartItems)[number]; product: (typeof MOCK_PRODUCTS)[number] } =>
        x !== null,
    );
  const cartTotal = cartLineItems.reduce(
    (s, { item, product }) => s + product.price * item.quantity,
    0,
  );
  const filteredOrders: Order[] =
    statusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === (statusFilter as OrderStatus));

  const avatarSrc =
    authUser.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser.name)}`;

  return (
    <div className="min-h-screen bg-brand-secondary/30 dark:bg-zinc-950">
      {/* Profile Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-brand-primary/5 pt-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 py-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-brand-secondary dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-700 shadow-lg">
                <img
                  src={avatarSrc}
                  alt={authUser.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <button
                onClick={() => changeTab('settings')}
                className="absolute -bottom-1.5 -end-1.5 w-7 h-7 bg-accent rounded-lg shadow-md flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Camera size={12} className="text-white" />
              </button>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-display font-black tracking-tight text-brand-primary dark:text-white">
                  {authUser.name}
                </h1>
                <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">
                  {userRole === 'admin' ? 'Admin' : userRole === 'seller' ? 'Satıcı' : 'Üye'}
                </span>
              </div>
              <p className="text-sm text-brand-primary/50 dark:text-zinc-400">{authUser.email}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 sm:gap-6 shrink-0">
              {[
                {
                  label: t('profile.totalSpent'),
                  value: ordersLoading
                    ? '…'
                    : `$${totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  color: 'text-green-500',
                },
                {
                  label: t('profile.activeOrders'),
                  value: ordersLoading ? '…' : String(activeOrdersCount),
                  color: 'text-blue-500',
                },
                {
                  label: t('profile.savedItems'),
                  value: String(wishlist.length),
                  color: 'text-red-400',
                },
                { label: t('profile.rewardPoints'), value: '0', color: 'text-accent' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className={cn('text-xl font-black leading-none mb-0.5', s.color)}>{s.value}</p>
                  <p className="text-[9px] font-bold text-brand-primary/40 dark:text-zinc-500 uppercase tracking-widest leading-tight">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => changeTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all',
                  activeTab === tab.key
                    ? 'text-accent border-accent'
                    : 'text-brand-primary/40 dark:text-zinc-500 border-transparent hover:text-brand-primary dark:hover:text-zinc-300',
                )}
              >
                <tab.icon size={13} />
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-20">
        {/* ── OVERVIEW ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Sepetim — hızlı erişim mini-widget */}
            {cartLineItems.length > 0 && (
              <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-brand-primary/5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-display font-black tracking-tight text-brand-primary dark:text-white uppercase flex items-center gap-2">
                    <ShoppingBag size={16} className="text-accent" /> {t('cart.title', 'Sepetim')}
                  </h2>
                  <Link
                    to="/cart"
                    className="text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Tümünü Gör <ArrowRight size={11} />
                  </Link>
                </div>
                <div className="space-y-3">
                  {cartLineItems.map(({ item, product }) => (
                    <div
                      key={`${item.productId}-${item.variantId ?? ''}`}
                      className="flex items-center gap-3"
                    >
                      <Link
                        to={`/product/${product.slug}`}
                        className="w-14 h-14 rounded-xl bg-brand-secondary/40 dark:bg-zinc-800 overflow-hidden shrink-0"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${product.slug}`}
                          className="text-xs font-bold text-brand-primary dark:text-white line-clamp-1 hover:text-accent transition-colors"
                        >
                          {product.title}
                        </Link>
                        <p className="text-[11px] font-black text-accent mt-0.5">
                          {product.price.toFixed(2)} TL
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-brand-secondary/40 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variantId)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Azalt"
                          className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center disabled:opacity-30 hover:text-accent transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black text-brand-primary dark:text-white w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variantId)
                          }
                          aria-label="Arttır"
                          className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center hover:text-accent transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        aria-label={t('cart.remove', 'Kaldır')}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-primary/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-brand-primary/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary/50 dark:text-white/50">
                    {t('cart.total', 'Toplam')}
                  </span>
                  <span className="text-lg font-display font-black text-brand-primary dark:text-white">
                    {cartTotal.toFixed(2)} TL
                  </span>
                </div>
                <Link
                  to="/cart"
                  className="mt-4 w-full py-3 bg-accent text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
                >
                  {t('cart.checkout', 'Ödemeye Geç')} <ArrowRight size={13} />
                </Link>
              </section>
            )}

            <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-brand-primary/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-display font-black tracking-tight text-brand-primary dark:text-white uppercase">
                  {t('profile.orders')}
                </h2>
                <button
                  onClick={() => changeTab('orders')}
                  className="text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Tümünü Gör <ArrowRight size={11} />
                </button>
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-primary/20 border-t-accent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingBag size={32} className="mx-auto text-brand-primary/10 mb-3" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary/30 mb-4">
                    {t('profile.noOrders')}
                  </p>
                  <Link
                    to="/"
                    className="inline-block px-5 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    {t('profile.startShopping')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order: Order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>

            {/* AI Insights */}
            <section className="bg-brand-primary dark:bg-zinc-800 rounded-3xl p-8 text-white relative overflow-hidden">
              <Zap size={100} className="absolute -top-6 -end-6 text-white/5" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={13} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                      AI-Driven Insights
                    </span>
                  </div>
                  <h2 className="text-3xl font-display font-black tracking-tighter leading-tight uppercase italic mb-3">
                    Curated
                    <br />
                    Just for You
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-xs">
                    Based on your browsing, we&apos;ve unlocked exclusive access to artisan
                    collections.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    Keşfet <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_PRODUCTS.slice(0, 4).map((p) => (
                    <Link key={p.id} to={`/product/${p.slug}`}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-24 h-24 bg-white/10 backdrop-blur rounded-2xl border border-white/10 p-2.5"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* Wishlist preview */}
            {wishlistProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-display font-black tracking-tight text-brand-primary dark:text-white uppercase">
                    {t('profile.favorites')}
                  </h2>
                  <button
                    onClick={() => changeTab('favorites')}
                    className="text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Tümünü Gör <ArrowRight size={11} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {wishlistProducts.slice(0, 4).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── ORDERS ───────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all',
                    statusFilter === opt.value
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-brand-primary/50 dark:text-zinc-400 border border-brand-primary/10 hover:border-accent/30',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-accent rounded-full animate-spin" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-brand-primary/5">
                <ShoppingBag size={36} className="mx-auto text-brand-primary/10 mb-3" />
                <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary/30 mb-4">
                  {t('profile.noOrders')}
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {t('profile.startShopping')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} expanded />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FAVORITES ────────────────────────────────── */}
        {activeTab === 'favorites' && (
          <div>
            {wishlistLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-accent rounded-full animate-spin" />
              </div>
            ) : wishlistProducts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-brand-primary/5">
                <Heart size={36} className="mx-auto text-brand-primary/10 mb-3" />
                <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary/30 mb-1">
                  Henüz favori ürün yok
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block px-6 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {t('profile.startShopping')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlistProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRICE TRACKS ─────────────────────────────── */}
        {activeTab === 'pricetracks' && (
          <div>
            {tracksLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-accent rounded-full animate-spin" />
              </div>
            ) : trackedProducts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-brand-primary/5">
                <TrendingUp size={36} className="mx-auto text-brand-primary/10 mb-3" />
                <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary/30 mb-4">
                  {t('profile.noPriceAlerts')}
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {t('profile.startShopping')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trackedProducts.map(({ track, product }) => {
                  const priceDiff = track.originalPrice - product.price;
                  const hasDropped = priceDiff > 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-brand-primary/5 dark:border-white/5 shadow-sm flex flex-col justify-between hover:border-accent/20 transition-all relative overflow-hidden"
                    >
                      {hasDropped && (
                        <div className="absolute top-0 end-0 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-es-xl flex items-center gap-1">
                          <span>↓</span> {t('profile.priceDropped')}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <Link
                            to={`/product/${product.slug}`}
                            className="w-20 h-20 bg-brand-secondary dark:bg-zinc-800 rounded-2xl p-2 overflow-hidden border border-brand-primary/5 dark:border-white/5 flex items-center justify-center shrink-0"
                          >
                            <img
                              src={product.images[0]}
                              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal rounded-xl animate-fade-in"
                              alt={product.title}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/product/${product.slug}`}
                              className="hover:text-accent transition-colors"
                            >
                              <h3 className="text-sm font-black text-brand-primary dark:text-white truncate">
                                {product.title}
                              </h3>
                            </Link>
                            <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500 font-medium mt-1">
                              {t('nav.watchlist')}:{' '}
                              {new Date(track.addedAt).toLocaleDateString(
                                lang === 'tr' ? 'tr-TR' : 'en-US',
                              )}
                            </p>

                            <div className="mt-3 flex items-center gap-4">
                              <div>
                                <p className="text-[9px] font-bold text-brand-primary/40 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                                  {t('profile.originalPrice')}
                                </p>
                                <p className="text-sm font-black text-brand-primary/60 dark:text-zinc-400 line-through">
                                  ${track.originalPrice.toFixed(2)}
                                </p>
                              </div>

                              <div>
                                <p className="text-[9px] font-bold text-brand-primary/40 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                                  {t('profile.currentPrice')}
                                </p>
                                <p
                                  className={cn(
                                    'text-base font-black',
                                    hasDropped
                                      ? 'text-green-500'
                                      : 'text-brand-primary dark:text-white',
                                  )}
                                >
                                  ${product.price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-brand-primary/5 dark:border-white/5 mt-4">
                        <Link
                          to={`/product/${product.slug}`}
                          className="flex-1 py-2.5 bg-brand-secondary dark:bg-zinc-800 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-brand-primary hover:text-white transition-all"
                        >
                          {t('product.origin')}
                        </Link>
                        <button
                          onClick={() => handleRemoveTrack(product.id)}
                          className="flex-1 py-2.5 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                        >
                          {t('profile.removeTrack')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FOLLOWED STORES ─────────────────────────── */}
        {activeTab === 'stores' && (
          <div>
            {followsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-accent rounded-full animate-spin" />
              </div>
            ) : followedSellers.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-brand-primary/5">
                <Store size={36} className="mx-auto text-brand-primary/10 mb-3" />
                <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary/30 mb-4">
                  {t('profile.noFollowedStores')}
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {t('profile.startShopping')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {followedSellers.map((sellerId) => {
                  const seller = MOCK_SELLERS.find((s) => s.id === sellerId);
                  if (!seller) return null;
                  return (
                    <div
                      key={seller.id}
                      className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-brand-primary/5 dark:border-white/5 shadow-sm flex flex-col justify-between hover:border-accent/20 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-brand-secondary dark:bg-zinc-800 rounded-2xl p-2 overflow-hidden border border-brand-primary/5 dark:border-white/5 flex items-center justify-center shrink-0">
                            <img
                              src={
                                seller.logoUrl ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${seller.storeName}`
                              }
                              className="w-full h-full object-cover rounded-xl"
                              alt={seller.storeName}
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h3 className="text-sm font-black text-brand-primary dark:text-white truncate">
                                {seller.storeName}
                              </h3>
                              {seller.isVerified && (
                                <span
                                  className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold"
                                  title="Doğrulanmış Satıcı"
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-brand-primary/40 dark:text-zinc-500">
                              <div className="flex items-center gap-1">
                                <Star size={12} fill="#FF5200" className="text-accent" />
                                <span className="font-bold text-brand-primary dark:text-white">
                                  {seller.rating}
                                </span>
                              </div>
                              <span>•</span>
                              <span>{seller.followersCount} Takipçi</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-brand-primary/60 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                          {seller.description}
                        </p>
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-brand-primary/5 dark:border-white/5 mt-auto">
                        <Link
                          to={`/seller/${seller.id}`}
                          className="flex-1 py-2.5 bg-brand-secondary dark:bg-zinc-800 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-brand-primary hover:text-white transition-all"
                        >
                          {t('profile.visitStore')}
                        </Link>
                        <button
                          onClick={() => toggleFollow(seller.id)}
                          className="px-4 py-2.5 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                        >
                          {t('profile.unfollow')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ADDRESSES ────────────────────────────────── */}
        {activeTab === 'addresses' && (
          <div className="max-w-xl">
            <ProfileSettings defaultOpen="addresses" />
          </div>
        )}

        {/* ── PAYMENT ──────────────────────────────────── */}
        {activeTab === 'payment' && <SavedPaymentMethod />}

        {/* ── SETTINGS ─────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-xl">
            <ProfileSettings />
            {/* Data Deletion Danger Zone */}
            <div className="mt-8 p-5 border border-red-200 dark:border-red-800 rounded-2xl bg-red-50/30 dark:bg-red-950/20">
              <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">
                Verilerimi Sil
              </h3>
              <p className="text-[10px] text-red-500/70 dark:text-red-400/60 mb-4">
                Bu islem hesabinizdaki tum kisisel verileri kalici olarak siler. Siparis gecmisi
                anonimlestirilir. Bu islem geri alinamaz.
              </p>
              <DataDeletionButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
