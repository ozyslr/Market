'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  DollarSign, TrendingUp, Activity, Upload, Sparkles,
  Percent, Loader2, ArrowUpRight, ArrowDownRight,
  Smartphone, Monitor, Tablet, Plus, Search, Bell,
  ChevronRight, CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getSellerAnalytics } from '@/services/sellerAnalyticsService';
import { getOrdersBySeller } from '@/services/orderService';
import type { SellerAnalytics } from '@/services/sellerAnalyticsService';
import type { Order } from '@/types/order';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}

function formatTrend(value: number): { label: string; isPositive: boolean } {
  return {
    label: `${value >= 0 ? '+' : ''}${value}%`,
    isPositive: value >= 0,
  };
}

const SPARKLINE_DATA = [
  { v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 60 }, { v: 50 }, { v: 75 }, { v: 65 },
];

const TABS = [
  { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { id: 'finance', label: 'Finans', icon: DollarSign },
  { id: 'bulk', label: 'Toplu Yükleme', icon: Upload },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────

function KPICard({
  label, value, growth, icon: Icon, color, bg,
}: {
  label: string; value: string; growth: string; icon: any; color: string; bg: string;
}) {
  const isPositive = growth.startsWith('+');
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110', bg)}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <div className="h-8 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SPARKLINE_DATA}>
              <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className={cn('text-xs font-bold flex items-center gap-0.5', isPositive ? 'text-green-600' : 'text-red-500')}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {growth}
        </span>
        <span className="text-xs text-gray-400">geçen haftaya göre</span>
      </div>
    </div>
  );
}

// ─── Device Breakdown ─────────────────────────────────────────────────────

const DEFAULT_DEVICES = [
  { name: 'Mobil', percentage: 58, color: '#7C3AED', icon: Smartphone },
  { name: 'Masaüstü', percentage: 32, color: '#3B82F6', icon: Monitor },
  { name: 'Tablet', percentage: 10, color: '#10B981', icon: Tablet },
];

function DeviceBreakdown({ devices = DEFAULT_DEVICES }: { devices?: typeof DEFAULT_DEVICES }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-6">Cihaz Dağılımı</h3>
      <div className="space-y-5">
        {devices.map((device, i) => {
          const Icon = device.icon;
          return (
            <div key={device.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">{device.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{device.percentage}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${device.percentage}%` }}
                  transition={{ duration: 1.2, delay: i * 0.15 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: device.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function SellerDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [financePeriod, setFinancePeriod] = useState<'30' | '90' | 'all'>('30');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Fetch analytics ──
  useEffect(() => {
    if (!user?.id) { setAnalyticsLoading(false); return; }
    setAnalyticsLoading(true);
    getSellerAnalytics(user.id)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [user?.id]);

  // ── Fetch orders (for finance tab) ──
  useEffect(() => {
    if (!user?.id) return;
    setOrdersLoading(true);
    getOrdersBySeller(user.id)
      .then(setSellerOrders)
      .catch(() => setSellerOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user?.id]);

  // ── Simulate bulk upload ──
  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  // ── Finance calculations ──
  const financeData = useMemo(() => {
    const cutoff = financePeriod === 'all' ? null : (() => {
      const d = new Date();
      d.setDate(d.getDate() - parseInt(financePeriod));
      return d;
    })();
    const filtered = sellerOrders.filter(o => !cutoff || new Date(o.createdAt) >= cutoff);
    const delivered = filtered.filter(o => o.status === 'delivered');
    const grossEarnings = delivered.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
    const commission = grossEarnings * 0.10;
    const netEarnings = grossEarnings - commission;
    return { filtered, delivered, grossEarnings, commission, netEarnings };
  }, [sellerOrders, financePeriod]);

  // ── Derived KPI values ──
  const kpi = useMemo(() => {
    if (!analytics) return null;
    const o = analytics.overview;
    return {
      weeklyRevenue: o.totalRevenue,
      totalOrders: o.totalOrders,
      conversionRate: o.conversionRate,
      totalViews: Math.round(o.totalOrders * (100 / (o.conversionRate || 1))),
    };
  }, [analytics]);

  const kpiTrends = useMemo(() => {
    if (!kpi) return { revenue: '+0', orders: '+0', conversion: '+0', views: '+0' };
    return {
      revenue: formatTrend(12).label,
      orders: formatTrend(8).label,
      conversion: formatTrend(-2).label,
      views: formatTrend(15).label,
    };
  }, [kpi]);

  // ── Loading state ──
  if (analyticsLoading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Analizler yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-200 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Satıcı Paneli
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.email || 'Mağaza Performansı'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/seller/products/new"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
            >
              <Plus size={14} /> Yeni Ürün
            </Link>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <nav className="flex gap-6 -mb-px">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 pb-3 pt-4 text-xs font-bold border-b-2 transition-all',
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600',
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Haftalık Ciro"
                  value={kpi ? `${formatCurrency(kpi.weeklyRevenue)} ₺` : '---'}
                  growth={kpiTrends.revenue}
                  icon={DollarSign}
                  color="#7C3AED"
                  bg="bg-gradient-to-tr from-purple-600 to-purple-400"
                />
                <KPICard
                  label="Toplam Sipariş"
                  value={kpi ? String(kpi.totalOrders) : '---'}
                  growth={kpiTrends.orders}
                  icon={ShoppingCart}
                  color="#10B981"
                  bg="bg-gradient-to-tr from-emerald-500 to-emerald-400"
                />
                <KPICard
                  label="Dönüşüm Oranı"
                  value={kpi ? `%${kpi.conversionRate}` : '---'}
                  growth={kpiTrends.conversion}
                  icon={Activity}
                  color="#3B82F6"
                  bg="bg-gradient-to-tr from-blue-500 to-blue-400"
                />
                <KPICard
                  label="Toplam Görüntülenme"
                  value={kpi ? String(kpi.totalViews) : '---'}
                  growth={kpiTrends.views}
                  icon={BarChart3}
                  color="#F59E0B"
                  bg="bg-gradient-to-tr from-amber-500 to-amber-400"
                />
              </div>

              {/* Revenue Chart + Device Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-900">Satış Performansı</h3>
                    <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                      {['7G', '30G', '90G'].map(p => (
                        <button
                          key={p}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all',
                            p === '30G'
                              ? 'bg-white text-purple-600 shadow-sm'
                              : 'text-gray-400 hover:text-gray-600',
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.revenueOverTime ?? []}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          dy={8}
                          tickFormatter={v => {
                            const d = new Date(v);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            borderRadius: '12px',
                            border: 'none',
                            padding: '12px 16px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          labelFormatter={v => new Date(v).toLocaleDateString('tr-TR')}
                          formatter={(val: any) => [`${Number(val).toLocaleString('tr-TR')} ₺`, 'Gelir']}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#7C3AED"
                          strokeWidth={3}
                          fill="url(#revenueGradient)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <DeviceBreakdown />
              </div>

              {/* Top Products */}
              {analytics && analytics.topProducts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">En Çok Satan Ürünler</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bu Dönem</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ürün</th>
                          <th className="pb-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Satış</th>
                          <th className="pb-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gelir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topProducts.slice(0, 5).map((p, i) => (
                          <tr key={p.productId} className="border-b border-gray-50 last:border-0">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-300 w-5">{String(i + 1).padStart(2, '0')}</span>
                                <span className="text-sm font-medium text-gray-900">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                                {p.unitsSold} adet
                              </span>
                            </td>
                            <td className="py-3 text-right text-sm font-bold text-gray-900">
                              {p.revenue.toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Intelligence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, label: 'Trend', title: 'Ses Ekipmanları', desc: 'Stüdyo ekipmanlarına talep %245 arttı.', color: 'text-purple-600' },
                  { icon: Package, label: 'Stok', title: 'Stok Durumu', desc: 'Aktif 38 ürün, 9 ürün tükenmek üzere.', color: 'text-blue-500' },
                  { icon: CreditCard, label: 'Ödemeler', title: 'Havale Bildirimi', desc: '3 bekleyen ödeme onayı bulunuyor.', color: 'text-emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-md transition-all">
                    <div className={cn('w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4', item.color)}>
                      <item.icon size={20} strokeWidth={2} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <h5 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h5>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Finance header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">Finans Özeti</h3>
                <div className="flex gap-2">
                  {(['30', '90', 'all'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setFinancePeriod(p)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all',
                        financePeriod === p
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white text-gray-400 border border-gray-200 hover:border-purple-300',
                      )}
                    >
                      {p === 'all' ? 'Tümü' : `Son ${p} Gün`}
                    </button>
                  ))}
                </div>
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  {/* Finance KPI cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        label: 'Brüt Kazanç',
                        value: `${financeData.grossEarnings.toLocaleString('tr-TR')} ₺`,
                        icon: TrendingUp,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                      },
                      {
                        label: 'Komisyon (%10)',
                        value: `${financeData.commission.toLocaleString('tr-TR')} ₺`,
                        icon: Percent,
                        color: 'text-purple-600',
                        bg: 'bg-purple-50',
                      },
                      {
                        label: 'Net Ödeme',
                        value: `${financeData.netEarnings.toLocaleString('tr-TR')} ₺`,
                        icon: DollarSign,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                      },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="bg-white rounded-2xl p-6 border border-gray-200 flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
                          <Icon size={20} className={color} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                          <p className="text-lg font-bold text-gray-900">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order-based earnings table */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Teslim Edilen Siparişler</h4>
                    </div>
                    {financeData.delivered.length === 0 ? (
                      <p className="text-center py-12 text-sm text-gray-400 font-medium">
                        Bu dönemde teslim edilen sipariş bulunmuyor.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sipariş</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarih</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tutar</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Komisyon</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financeData.delivered.slice(0, 15).map(o => {
                              const amt = o.totalAmount || o.total || 0;
                              const com = amt * 0.10;
                              return (
                                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                  <td className="px-4 py-3 font-mono font-bold text-xs text-gray-900">
                                    #{o.id.slice(-8).toUpperCase()}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-500">
                                    {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">
                                    {amt.toLocaleString('tr-TR')} ₺
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs font-bold text-purple-600">
                                    {com.toLocaleString('tr-TR')} ₺
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600">
                                    {(amt - com).toLocaleString('tr-TR')} ₺
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'bulk' && (
            <motion.div
              key="bulk"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Upload zone */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 lg:p-16 flex flex-col items-center justify-center text-center min-h-[400px]">
                {isUploading ? (
                  <div className="w-full max-w-md space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-500">Toplu yükleme işleniyor</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Ürün listesi.json</p>
                      </div>
                      <span className="text-3xl font-bold text-purple-600">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-purple-600 animate-pulse">
                      <Sparkles size={16} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">AI eşleme yapılıyor...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                      <Upload size={36} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Toplu Ürün Yükleme</h2>
                    <p className="text-sm text-gray-500 max-w-md mb-8">
                      CSV veya JSON dosyanızı yükleyin. AI destekli sistemimiz otomatik olarak kategorileri eşler, açıklamaları oluşturur ve ürünlerinizi hazırlar.
                    </p>
                    <button
                      onClick={simulateUpload}
                      className="px-10 py-4 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg"
                    >
                      Dosya Seç
                    </button>
                  </>
                )}
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <Sparkles size={24} className="text-purple-600 mb-4" />
                  <h4 className="text-sm font-bold text-gray-900 mb-2">AI Otomatik Düzenleme</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Yapay zeka motorumuz ürün etiketlerini otomatik genişletir, SEO açıklamaları oluşturur ve ürünlerinizi tüm pazarlar için hazırlar.
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <Package size={24} className="text-purple-600 mb-4" />
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Senkronizasyon</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Shopify, Amazon veya Etsy'den verilerinizi içe aktarın. Sistem otomatik olarak kategorileri eşler ve envanterinizi günceller.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
