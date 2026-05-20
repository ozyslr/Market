import React, { useState, useEffect } from 'react';
import {
  Package, Heart, MapPin, Settings, Star, ShoppingBag,
  TrendingUp, Wallet, Zap, LayoutDashboard, ArrowRight,
  Camera, Clock, Truck, CheckCircle2, XCircle, RefreshCw, RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { MOCK_USER, MOCK_PRODUCTS } from '@/mockData';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { getOrdersByUser } from '@/services/orderService';
import { Order, OrderStatus } from '@/types/order';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { ProductCard } from '@/components/commerce/ProductCard';

type ProfileTab = 'overview' | 'orders' | 'favorites' | 'addresses' | 'settings';

const TABS: { key: ProfileTab; labelKey: string; icon: React.ElementType }[] = [
  { key: 'overview', labelKey: 'profile.overview', icon: LayoutDashboard },
  { key: 'orders', labelKey: 'profile.orders', icon: Package },
  { key: 'favorites', labelKey: 'profile.favorites', icon: Heart },
  { key: 'addresses', labelKey: 'profile.addresses', icon: MapPin },
  { key: 'settings', labelKey: 'profile.settings', icon: Settings },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pending:          { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20',   icon: Clock },
  paid:             { color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',       icon: CheckCircle2 },
  processing:       { color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',       icon: RefreshCw },
  shipped:          { color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20',   icon: Truck },
  delivered:        { color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20',     icon: CheckCircle2 },
  cancelled:        { color: 'text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',         icon: XCircle },
  refunded:         { color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-900/20',       icon: RotateCcw },
  return_requested: { color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20',   icon: RotateCcw },
  returned:         { color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-900/20',       icon: RotateCcw },
};

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all',       label: 'Tümü' },
  { value: 'pending',   label: 'Bekliyor' },
  { value: 'processing',label: 'Hazırlanıyor' },
  { value: 'shipped',   label: 'Kargoda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
];

const OrderCard: React.FC<{ order: Order; expanded?: boolean }> = ({ order, expanded = false }) => {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon as React.ElementType;

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
          <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', cfg.color, cfg.bg)}>
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
            const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
            return (
              <div key={idx} className="shrink-0 w-14 h-14 rounded-xl bg-brand-secondary/50 dark:bg-zinc-800 p-1.5">
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
        <button className="flex-1 py-2 bg-brand-secondary dark:bg-zinc-800 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
          Takip Et
        </button>
        <button className="flex-1 py-2 border border-brand-primary/10 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 hover:border-accent hover:text-accent transition-all">
          Tekrar Satın Al
        </button>
      </div>
    </div>
  );
}

export function UserProfilePage() {
  const { user: authUser, firebaseUser } = useAuth();
  const { t } = useLanguage();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const user = authUser ? { ...MOCK_USER, name: authUser.name, email: authUser.email } : MOCK_USER;

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    (searchParams.get('tab') as ProfileTab) ?? 'overview'
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!firebaseUser) return;
    setOrdersLoading(true);
    getOrdersByUser(firebaseUser.uid).then(data => {
      setOrders(data);
      setOrdersLoading(false);
    });
  }, [firebaseUser]);

  function changeTab(tab: ProfileTab) {
    setActiveTab(tab);
    setSearchParams({ tab });
  }

  const wishlistProducts = MOCK_PRODUCTS.filter(p => wishlist.includes(p.id));
  const filteredOrders: Order[] = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === (statusFilter as OrderStatus));

  const avatarSrc = (authUser as { photoURL?: string } | null)?.photoURL
    ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <div className="min-h-screen bg-brand-secondary/30 dark:bg-zinc-950">
      {/* Profile Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-brand-primary/5 pt-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 py-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-brand-secondary dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-700 shadow-lg">
                <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <button
                onClick={() => changeTab('settings')}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-accent rounded-lg shadow-md flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Camera size={12} className="text-white" />
              </button>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-display font-black tracking-tight text-brand-primary dark:text-white">
                  {user.name}
                </h1>
                <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">
                  {user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'Satıcı' : 'Prime'}
                </span>
              </div>
              <p className="text-sm text-brand-primary/50 dark:text-zinc-400">
                {user.email} • {user.country}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 sm:gap-6 shrink-0">
              {[
                { label: t('profile.totalSpent'),  value: `$${(user.spentTotal ?? 0).toLocaleString()}`, color: 'text-green-500' },
                { label: t('profile.activeOrders'), value: String(user.orders?.length ?? 0),             color: 'text-blue-500' },
                { label: t('profile.savedItems'),   value: String(wishlist.length),                      color: 'text-red-400' },
                { label: t('profile.rewardPoints'), value: '4,250',                                      color: 'text-accent' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className={cn('text-xl font-black leading-none mb-0.5', s.color)}>{s.value}</p>
                  <p className="text-[9px] font-bold text-brand-primary/40 dark:text-zinc-500 uppercase tracking-widest leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => changeTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all',
                  activeTab === tab.key
                    ? 'text-accent border-accent'
                    : 'text-brand-primary/40 dark:text-zinc-500 border-transparent hover:text-brand-primary dark:hover:text-zinc-300'
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
            <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-brand-primary/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-display font-black tracking-tight text-brand-primary dark:text-white uppercase">
                  {t('profile.orders')}
                </h2>
                <button onClick={() => changeTab('orders')} className="text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-1 hover:gap-2 transition-all">
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
                  <Link to="/" className="inline-block px-5 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
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
              <Zap size={100} className="absolute -top-6 -right-6 text-white/5" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={13} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">AI-Driven Insights</span>
                  </div>
                  <h2 className="text-3xl font-display font-black tracking-tighter leading-tight uppercase italic mb-3">
                    Curated<br />Just for You
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-xs">
                    Based on your browsing, we've unlocked exclusive access to artisan collections.
                  </p>
                  <Link to="/" className="inline-flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                    Keşfet <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_PRODUCTS.slice(0, 4).map(p => (
                    <Link key={p.id} to={`/product/${p.slug}`}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-24 h-24 bg-white/10 backdrop-blur rounded-2xl border border-white/10 p-2.5"
                      >
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
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
                  <button onClick={() => changeTab('favorites')} className="text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-1 hover:gap-2 transition-all">
                    Tümünü Gör <ArrowRight size={11} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {wishlistProducts.slice(0, 4).map(p => (
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
              {STATUS_FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all',
                    statusFilter === opt.value
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-brand-primary/50 dark:text-zinc-400 border border-brand-primary/10 hover:border-accent/30'
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
                <Link to="/" className="inline-block px-6 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {t('profile.startShopping')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => (
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
                <Link to="/" className="mt-4 inline-block px-6 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {t('profile.startShopping')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlistProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
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

        {/* ── SETTINGS ─────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-xl">
            <ProfileSettings />
          </div>
        )}
      </div>
    </div>
  );
}
