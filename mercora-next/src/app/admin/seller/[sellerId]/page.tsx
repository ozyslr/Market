'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UserCheck, Package, ShoppingCart, Star, Percent, Wallet, Shield,
  Ban, Check, X, Loader2, AlertCircle, Mail, Calendar, Store, ImageIcon,
  ChevronRight, ExternalLink, RefreshCw, Edit3, Clock, DollarSign,
  ChevronDown, ChevronUp, AlertTriangle, MoreHorizontal, Search,
  Plus, Eye, Activity,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
  updateDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import type { Seller } from '@/types/index';
import type { Product } from '@/types/index';
import type { Order } from '@/types/order';
import { getSellerAnalytics, type SellerAnalytics } from '@/services/sellerAnalyticsService';
import { getCommissionRules, type CommissionRule } from '@/services/commissionService';
import {
  getSellerBalance, getPayoutHistory,
  type SellerBalance, type PayoutRequest,
} from '@/services/sellerPayoutService';

/* ──────────────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────────────── */

type ActiveTab =
  | 'profile' | 'products' | 'orders' | 'performance'
  | 'commission' | 'payout' | 'actions';

interface TabDef {
  key: ActiveTab;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const TABS: TabDef[] = [
  { key: 'profile', label: 'Profil', icon: Store },
  { key: 'products', label: 'Urunler', icon: Package },
  { key: 'orders', label: 'Siparisler', icon: ShoppingCart },
  { key: 'performance', label: 'Performans', icon: Star },
  { key: 'commission', label: 'Komisyon', icon: Percent },
  { key: 'payout', label: 'Odeme', icon: Wallet },
  { key: 'actions', label: 'Aksiyonlar', icon: Shield },
];

/* ──────────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────────── */

function formatDate(value: unknown): string {
  if (!value) return '-';
  try {
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString('tr-TR');
    if (typeof value === 'object' && 'toDate' in (value as any)) {
      const d = (value as any).toDate();
      return d.toLocaleDateString('tr-TR');
    }
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR');
  } catch {
    return '-';
  }
}

function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '0,00 TL';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

function statusBadge(status: string | undefined): { label: string; cls: string } {
  switch (status) {
    case 'active':
      return { label: 'Aktif', cls: 'bg-green-100 text-green-700' };
    case 'suspended':
      return { label: 'Askida', cls: 'bg-red-100 text-red-700' };
    case 'pending':
      return { label: 'Beklemede', cls: 'bg-yellow-100 text-yellow-700' };
    case 'banned':
      return { label: 'Yasaklandi', cls: 'bg-gray-100 text-gray-600' };
    default:
      return { label: status || 'Bilinmiyor', cls: 'bg-gray-100 text-gray-500' };
  }
}

function orderStatusBadge(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Odenmis', cls: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Hazirlaniyor', cls: 'bg-indigo-100 text-indigo-700' },
    shipped: { label: 'Kargoda', cls: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Teslim Edildi', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Iptal', cls: 'bg-red-100 text-red-700' },
    refunded: { label: 'Iade', cls: 'bg-gray-100 text-gray-600' },
    return_requested: { label: 'Iade Talebi', cls: 'bg-orange-100 text-orange-700' },
    returned: { label: 'Iade Edildi', cls: 'bg-gray-100 text-gray-600' },
  };
  return map[status] || { label: status, cls: 'bg-gray-100 text-gray-500' };
}

/* ──────────────────────────────────────────────────────────────────────────────
   Skeleton
   ────────────────────────────────────────────────────────────────────────────── */

function SkeletonBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-full" style={{ width: `${60 + Math.random() * 40}%` }} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Empty State
   ────────────────────────────────────────────────────────────────────────────── */

function EmptyState({ icon: Icon, message, sub }: { icon: React.FC<React.SVGProps<SVGSVGElement>>; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon className="w-12 h-12 mb-3" />
      <p className="text-gray-500 font-medium">{message}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Error Block
   ────────────────────────────────────────────────────────────────────────────── */

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-red-500">
      <AlertCircle className="w-12 h-12 mb-3" />
      <p className="text-red-600 font-medium mb-2">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Tekrar Dene
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Main Page Component
   ────────────────────────────────────────────────────────────────────────────── */

export default function AdminSellerViewPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = React.use(params);

  /* ── state ──────────────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // seller
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [sellerError, setSellerError] = useState<string | null>(null);

  // products
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // analytics (performance)
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // commission
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);

  // payout
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // actions
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // expanded sections
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  /* ── fetch seller (always) ─────────────────────────────────────────────── */
  const fetchSeller = useCallback(async () => {
    setSellerLoading(true);
    setSellerError(null);
    try {
      const snap = await getDoc(doc(db, 'sellers', sellerId));
      if (!snap.exists()) {
        setSeller(null);
        setSellerError('Satıcı bulunamadı veya silinmiş.');
        return;
      }
      setSeller({ id: snap.id, ...snap.data() } as Seller);
    } catch {
      setSellerError('Satıcı bilgileri yüklenirken hata oluştu.');
    } finally {
      setSellerLoading(false);
    }
  }, [sellerId]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const snap = await getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId)));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    } catch {
      setProductsError('Ürünler yüklenirken hata oluştu.');
    } finally {
      setProductsLoading(false);
    }
  }, [sellerId]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const snap = await getDocs(query(
        collection(db, 'orders'),
        where('sellerIds', 'array-contains', sellerId),
        orderBy('createdAt', 'desc'),
      ));
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch {
      setOrdersError('Siparişler yüklenirken hata oluştu.');
    } finally {
      setOrdersLoading(false);
    }
  }, [sellerId]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await getSellerAnalytics(sellerId, '30d');
      setAnalytics(data);
    } catch {
      setAnalyticsError('Performans verileri yüklenirken hata oluştu.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [sellerId]);

  const fetchCommission = useCallback(async () => {
    setCommissionLoading(true);
    try {
      const rules = await getCommissionRules();
      setCommissionRules(rules);
    } catch {
      // silently fail – non-critical section
    } finally {
      setCommissionLoading(false);
    }
  }, []);

  const fetchPayout = useCallback(async () => {
    setPayoutLoading(true);
    try {
      const [b, p] = await Promise.all([
        getSellerBalance(sellerId),
        getPayoutHistory(sellerId),
      ]);
      setBalance(b);
      setPayouts(p);
    } catch {
      // silently fail
    } finally {
      setPayoutLoading(false);
    }
  }, [sellerId]);

  /* ── initial load ──────────────────────────────────────────────────────── */
  useEffect(() => {
    fetchSeller();
  }, [fetchSeller]);

  /* ── lazy load section data ────────────────────────────────────────────── */
  useEffect(() => {
    if (!seller) return;

    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'performance') fetchAnalytics();
    if (activeTab === 'commission') fetchCommission();
    if (activeTab === 'payout') fetchPayout();
    if (activeTab === 'actions') fetchProducts(); // needed for product count
  }, [activeTab, seller, fetchProducts, fetchOrders, fetchAnalytics, fetchCommission, fetchPayout]);

  /* ── actions ────────────────────────────────────────────────────────────── */
  const handleToggleStatus = async () => {
    if (!seller) return;
    const newStatus = seller.status === 'active' ? 'suspended' : 'active';
    setActionProcessing('status');
    setActionFeedback(null);
    try {
      await updateDoc(doc(db, 'sellers', sellerId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setSeller(prev => prev ? { ...prev, status: newStatus as Seller['status'] } : prev);
      setActionFeedback({ type: 'success', msg: `Satıcı ${newStatus === 'active' ? 'aktifleştirildi' : 'donduruldu'}.` });
    } catch {
      setActionFeedback({ type: 'error', msg: 'Durum güncellenirken hata oluştu.' });
    } finally {
      setActionProcessing(null);
    }
  };

  const handleNotify = async () => {
    setActionProcessing('notify');
    setActionFeedback(null);
    try {
      const { createNotification } = await import('@/services/notificationService');
      await createNotification(
        seller?.userId || sellerId,
        'moderation',
        'Yonetici Bildirimi',
        'Hesabiniz yonetici tarafindan incelenmistir.',
      );
      setActionFeedback({ type: 'success', msg: 'Bildirim gonderildi.' });
    } catch {
      setActionFeedback({ type: 'error', msg: 'Bildirim gonderilemedi.' });
    } finally {
      setActionProcessing(null);
    }
  };

  /* ── guard: global error / deleted seller ──────────────────────────────── */
  if (sellerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-7 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded mb-3" style={{ width: `${50 + Math.random() * 40}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sellerError && !seller) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Satıcı Bulunamadi</h2>
            <p className="text-gray-500 mb-6">{sellerError}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={fetchSeller}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </button>
              <Link
                href="/admin/sellers"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Satıcilara Don
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sellerStatus = statusBadge(seller?.status);

  /* ────────────────────────────────────────────────────────────────────────
     Render
     ──────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/admin/sellers" className="hover:text-blue-600 transition-colors">Saticilar</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">
            {seller?.storeName || sellerId}
          </span>
        </nav>

        {/* ── Action Feedback ────────────────────────────────────────────── */}
        {actionFeedback && (
          <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg text-sm font-medium border ${
            actionFeedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {actionFeedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.msg}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="ml-auto text-sm hover:underline"
            >
              Kapat
            </button>
          </div>
        )}

        {/* ── Header Card ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Logo */}
            <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {seller?.logoUrl ? (
                <img
                  src={seller.logoUrl}
                  alt={seller?.storeName || 'Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {seller?.storeName || 'Isimsiz Magaza'}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sellerStatus.cls}`}>
                  <Shield className="w-3 h-3" />
                  {sellerStatus.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-gray-500">
                {seller?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {seller.email}
                  </span>
                )}
                {seller?.joinedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Katilim: {formatDate(seller.joinedDate)}
                  </span>
                )}
                {seller?.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    {seller.rating.toFixed(1)} ({seller.reviewsCount || 0} degerlendirme)
                  </span>
                )}
                {seller?.slug && (
                  <Link
                    href={`/seller/${seller.slug}`}
                    target="_blank"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Magazayi Goruntule
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Banner preview */}
          {seller?.bannerUrl && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 max-h-32">
              <img
                src={seller.bannerUrl}
                alt="Banner"
                className="w-full h-32 object-cover"
              />
            </div>
          )}
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Package} label="Urunler" value={products.length.toString()} loading={productsLoading} />
          <StatCard icon={ShoppingCart} label="Siparisler" value={analytics?.overview.totalOrders.toString() || '-'} loading={analyticsLoading} />
          <StatCard icon={DollarSign} label="Gelir" value={formatCurrency(analytics?.overview.totalRevenue)} loading={analyticsLoading} />
          <StatCard icon={Star} label="Puan" value={seller?.rating?.toFixed(1) || '-'} loading={sellerLoading || analyticsLoading} />
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex overflow-x-auto gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ─────────────────────────────────────────────────── */}

        {/* ═══ PROFILE ═══ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profil Bilgileri</h2>

            {sellerError && !seller ? (
              <ErrorBlock message={sellerError} onRetry={fetchSeller} />
            ) : !seller ? (
              <EmptyState icon={Store} message="Satıcı bilgisi bulunamadı." />
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField label="Magaza Adi" value={seller.storeName || '-'} />
                <ProfileField label="E-posta" value={seller.email || '-'} />
                <ProfileField label="Aciklama" value={seller.description || '-'} fullWidth />
                <ProfileField label="Durum" value={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sellerStatus.cls}`}>{sellerStatus.label}</span>} />
                <ProfileField label="Katilim Tarihi" value={formatDate(seller.joinedDate)} />
                <ProfileField label="Puan" value={seller.rating != null ? `${seller.rating.toFixed(1)} / 5.0` : '-'} />
                <ProfileField label="Degerlendirme Sayisi" value={(seller.reviewsCount || 0).toString()} />
                <ProfileField label="Takipci" value={(seller.followersCount || 0).toString()} />
                <ProfileField label="Dogrulandi" value={seller.isVerified ? 'Evet' : 'Hayir'} />
                <ProfileField label="Ulke/Mensei" value={seller.origin || '-'} />
                {seller.slug && (
                  <ProfileField
                    label="Magaza Linki"
                    value={
                      <Link href={`/seller/${seller.slug}`} target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        /seller/{seller.slug} <ExternalLink className="w-3 h-3" />
                      </Link>
                    }
                  />
                )}
                {seller.returnPolicy && <ProfileField label="Iade Politikasi" value={seller.returnPolicy} fullWidth />}
              </dl>
            )}
          </div>
        )}

        {/* ═══ PRODUCTS ═══ */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Urunler ({products.length})</h2>
              <Link
                href={`/admin/products?sellerId=${sellerId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Tumunu Gor
              </Link>
            </div>

            {productsLoading ? (
              <div className="p-6"><SkeletonBlock rows={4} /></div>
            ) : productsError ? (
              <div className="p-6"><ErrorBlock message={productsError} onRetry={fetchProducts} /></div>
            ) : products.length === 0 ? (
              <EmptyState icon={Package} message="Henuz urun bulunmuyor." sub="Bu satıcı henuz herhangi bir urun eklememis." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 pl-4 text-sm font-semibold text-gray-900">Urun</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-900">Fiyat</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-900">Stok</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-900">Durum</th>
                      <th className="text-right p-3 pr-4 text-sm font-semibold text-gray-900">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 20).map(product => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{product.title}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-700">{formatCurrency(product.price)}</td>
                        <td className="p-3">
                          <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'approved' || product.isActive
                              ? 'bg-green-100 text-green-700'
                              : product.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {product.status === 'approved' || product.isActive ? 'Aktif' : product.status === 'pending' ? 'Beklemede' : product.status || 'Pasif'}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Duzenle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length > 20 && (
                  <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-100">
                    +{products.length - 20} urun daha var. <Link href={`/admin/products?sellerId=${sellerId}`} className="text-blue-600 hover:underline">Tumunu goruntule</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ ORDERS ═══ */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Siparisler ({orders.length})</h2>
            </div>

            {ordersLoading ? (
              <div className="p-6"><SkeletonBlock rows={5} /></div>
            ) : ordersError ? (
              <div className="p-6"><ErrorBlock message={ordersError} onRetry={fetchOrders} /></div>
            ) : orders.length === 0 ? (
              <EmptyState icon={ShoppingCart} message="Henuz siparis yok." />
            ) : (
              <div>
                {orders.slice(0, 30).map(order => {
                  const isExpanded = expandedOrder === order.id;
                  const oStatus = orderStatusBadge(order.status);

                  return (
                    <div key={order.id} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-mono text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${oStatus.cls}`}>
                            {oStatus.label}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(order.total || order.totalAmount)}</span>
                          <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{`${order.items?.length || 0} urun`}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs">Odeme</span>
                              <p className="font-medium text-gray-900">{order.paymentMethod || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">Odeme Durumu</span>
                              <p className="font-medium text-gray-900">{order.paymentStatus || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">Kargo</span>
                              <p className="font-medium text-gray-900">{order.trackingNumber ? `${order.carrier || ''} ${order.trackingNumber}` : '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">Toplam</span>
                              <p className="font-medium text-gray-900">{formatCurrency(order.total || order.totalAmount)}</p>
                            </div>
                          </div>

                          {order.items && order.items.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Urunler</span>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                                  <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.name || item.title}</p>
                                    <p className="text-xs text-gray-500">{item.quantity} adet x {formatCurrency(item.price)}</p>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.subtotal || item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-3 h-3" />
                              Siparis Detayi
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {orders.length > 30 && (
                  <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-100">
                    +{orders.length - 30} siparis daha var.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ PERFORMANCE ═══ */}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performans</h2>

            {analyticsLoading ? (
              <SkeletonBlock rows={6} />
            ) : analyticsError ? (
              <ErrorBlock message={analyticsError} onRetry={fetchAnalytics} />
            ) : !analytics ? (
              <EmptyState icon={Activity} message="Henuz performans verisi yok." />
            ) : (
              <div className="space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBox label="Toplam Siparis" value={analytics.overview.totalOrders.toString()} />
                  <MetricBox label="Toplam Gelir" value={formatCurrency(analytics.overview.totalRevenue)} />
                  <MetricBox label="Ortalama Sepet" value={formatCurrency(analytics.overview.averageOrderValue)} />
                  <MetricBox label="Donusum Orani" value={`${analytics.overview.conversionRate}%`} />
                  <MetricBox label="Aktif Urun" value={analytics.overview.activeProducts.toString()} />
                  <MetricBox label="Toplam Urun" value={analytics.overview.totalProducts.toString()} />
                  <MetricBox label="Musteri Sayisi" value={analytics.customerMetrics.uniqueCustomers.toString()} />
                  <MetricBox label="Iade Orani" value={`${analytics.customerMetrics.returnRate}%`} />
                </div>

                {/* Top Products */}
                {analytics.topProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">En Cok Satan Urunler</h3>
                    <div className="space-y-2">
                      {analytics.topProducts.slice(0, 5).map((p, i) => (
                        <div key={p.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                            <span className="text-sm font-medium text-gray-900">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{p.unitsSold} adet</span>
                            <span className="font-medium text-gray-700">{formatCurrency(p.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Breakdown */}
                {analytics.orderStatusBreakdown.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Siparis Durum Dagilimi</h3>
                    <div className="flex flex-wrap gap-2">
                      {analytics.orderStatusBreakdown.map(s => (
                        <span key={s.status} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${orderStatusBadge(s.status).cls}`}>
                          {orderStatusBadge(s.status).label} ({s.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller ratings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500">Satıcı Puani</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">{seller?.rating?.toFixed(1) || '-'}</span>
                      <span className="text-sm text-gray-500">/ 5.0</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{seller?.reviewsCount || 0} degerlendirme</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500">Tekrar Eden Musteri</span>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.customerMetrics.repeatCustomers}</p>
                    <p className="text-xs text-gray-400 mt-1">{analytics.customerMetrics.uniqueCustomers > 0
                      ? Math.round((analytics.customerMetrics.repeatCustomers / analytics.customerMetrics.uniqueCustomers) * 100)
                      : 0}% musteri tekrari
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ COMMISSION ═══ */}
        {activeTab === 'commission' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Komisyon Bilgileri</h2>

            {commissionLoading ? (
              <SkeletonBlock rows={3} />
            ) : commissionRules.length === 0 ? (
              <EmptyState icon={Percent} message="Henuz komisyon kurali tanimlanmamis." sub="Admin panelinden komisyon kurallarini ekleyin." />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {commissionRules.filter(r => r.isActive).map(rule => {
                    const overriddenRate = rule.sellerOverrides?.[sellerId];
                    return (
                      <div key={rule.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">{rule.name}</span>
                          {overriddenRate != null && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Ozel</span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          %{overriddenRate ?? rule.rate}
                        </div>
                        {rule.minAmount != null && (
                          <p className="text-xs text-gray-500 mt-1">Min: {formatCurrency(rule.minAmount)}</p>
                        )}
                        {rule.maxAmount != null && (
                          <p className="text-xs text-gray-500">Max: {formatCurrency(rule.maxAmount)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {commissionRules.filter(r => r.isActive).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aktif komisyon kurali bulunamadi.</p>
                )}

                <div className="pt-3">
                  <Link
                    href="/admin/sellers?tab=commission"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Komisyon Kurallarini Duzenle
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PAYOUT ═══ */}
        {activeTab === 'payout' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Odeme Bilgileri</h2>

            {payoutLoading ? (
              <SkeletonBlock rows={4} />
            ) : (
              <div className="space-y-6">
                {/* Balance */}
                {balance ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricBox label="Toplam Kazanc" value={formatCurrency(balance.totalEarned)} />
                    <MetricBox label="Toplam Komisyon" value={formatCurrency(balance.totalCommission)} />
                    <MetricBox label="Kullanilabilir Bakiye" value={formatCurrency(balance.availableBalance)} />
                    <MetricBox label="Bekleyen Bakiye" value={formatCurrency(balance.pendingBalance)} />
                  </div>
                ) : (
                  <EmptyState icon={Wallet} message="Henuz bakiye bilgisi yok." sub="Satıcı henuz hic satis yapmamis olabilir." />
                )}

                {/* Payout History */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Odeme Gecmisi</h3>
                  {payouts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      Henuz odeme talebi yok.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left p-3 text-sm font-semibold text-gray-900">Tarih</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-900">Tutar</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-900">Ucret</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-900">Net</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-900">Yontem</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-900">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payouts.map(p => (
                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3 text-sm text-gray-700">{formatDate(p.createdAt)}</td>
                              <td className="p-3 text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                              <td className="p-3 text-sm text-gray-600">{formatCurrency(p.fee)}</td>
                              <td className="p-3 text-sm font-medium text-gray-900">{formatCurrency(p.netAmount)}</td>
                              <td className="p-3 text-sm text-gray-600">{p.method || '-'}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  p.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                  p.status === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {p.status === 'completed' ? 'Tamamlandi' :
                                   p.status === 'processing' ? 'Isleniyor' :
                                   p.status === 'failed' ? 'Basarisiz' : 'Bekliyor'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ACTIONS ═══ */}
        {activeTab === 'actions' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Aksiyonlar</h2>

            {sellerError && !seller ? (
              <ErrorBlock message={sellerError} onRetry={fetchSeller} />
            ) : !seller ? (
              <EmptyState icon={Shield} message="Satıcı bulunamadi." />
            ) : (
              <div className="space-y-4">
                {/* Suspend / Activate */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {seller.status === 'active' ? 'Satıciyi Dondur' : 'Satıciyi Aktiflestir'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {seller.status === 'active'
                          ? 'Satıcının magazasi gecici olarak devre disi birakilacak ve urunleri goruntulenmeyecek.'
                          : 'Satıcının magazasi tekrar aktif hale getirilecek.'}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleStatus}
                      disabled={actionProcessing === 'status'}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors shrink-0 ${
                        seller.status === 'active'
                          ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                          : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {actionProcessing === 'status' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : seller.status === 'active' ? (
                        <Ban className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {seller.status === 'active' ? 'Dondur' : 'Aktiflestir'}
                    </button>
                  </div>
                </div>

                {/* Send Notification */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Bildirim Gonder</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Satıcıya sistem bildirimi gonder.</p>
                    </div>
                    <button
                      onClick={handleNotify}
                      disabled={actionProcessing === 'notify'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {actionProcessing === 'notify' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Bildirim Gonder
                    </button>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Hizli Linkler</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/sellers?tab=commission`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Percent className="w-4 h-4" />
                      Komisyon Duzenle
                    </Link>
                    <Link
                      href={`/admin/products?sellerId=${sellerId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Urunleri Yonet
                    </Link>
                    <Link
                      href={`/admin/orders?sellerId=${sellerId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Siparisleri Gor
                    </Link>
                    {seller?.slug && (
                      <Link
                        href={`/seller/${seller.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Magazayi Goruntule
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Seller ID (footer) ────────────────────────────────────────────── */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Satıcı ID: {sellerId}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon, label, value, loading,
}: {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
      ) : (
        <div className="text-xl font-bold text-gray-900">{value}</div>
      )}
    </div>
  );
}

function ProfileField({
  label, value, fullWidth,
}: {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-900">
        {typeof value === 'string' && value === '-' ? (
          <span className="text-gray-400">-</span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

/* ── ChevronLeft for breadcrumb back link ─────────────────────────────────── */
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
