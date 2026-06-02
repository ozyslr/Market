import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Globe2,
  Settings,
  Bell,
  Search,
  TrendingUp,
  Info,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
  Users,
  Sparkles,
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  X,
  Zap,
  LogOut,
  ArrowDownRight,
  Activity,
  CreditCard,
  MessageSquare,
  Briefcase,
  RefreshCcw,
  Loader2,
  Percent,
  ShoppingBasket,
  Smartphone,
  Monitor,
  Laptop,
  Globe,
  Megaphone,
  Plus,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// Inline sparkline data for KPI card decoration
const SPARKLINE_DATA = [
  { v: 10 },
  { v: 25 },
  { v: 15 },
  { v: 45 },
  { v: 30 },
  { v: 60 },
  { v: 50 },
  { v: 75 },
  { v: 65 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return amount.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatTrend(value: number): { label: string; isPositive: boolean } {
  return {
    label: `${value >= 0 ? '+' : ''}${value}%`,
    isPositive: value >= 0,
  };
}

// --- COMPONENTS ---

const KPICard = ({ label, value, growth, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-[#F8F8FA] shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
    <div className="flex justify-between items-start mb-8">
      <div
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110',
          bg,
        )}
      >
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <div className="text-end">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1033]/30 mb-1">
          {label}
        </p>
        <h3 className="text-3xl font-display font-black text-[#1A1033] tracking-tighter leading-none">
          {value}
        </h3>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 font-black text-[10px] uppercase">
        <span className={cn(growth.startsWith('+') ? 'text-green-500' : 'text-red-500')}>
          {growth.startsWith('+') ? (
            <ArrowUpRight size={14} className="inline me-1" />
          ) : (
            <ArrowDownRight size={14} className="inline me-1" />
          )}
          {growth}
        </span>
        <span className="text-[#1A1033]/20 tracking-widest whitespace-nowrap">
          Geçen haftaya göre
        </span>
      </div>
      <div className="h-8 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SPARKLINE_DATA}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              fill={color}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

import { useAuth } from '@/context/AuthContext';
import { getOrdersBySeller } from '@/services/orderService';
import { getSellerAnalytics, SellerAnalytics } from '@/services/sellerAnalyticsService';
import { Order } from '@/types/order';

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financePeriod, setFinancePeriod] = useState<'30' | '90' | 'all'>('30');
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid!;
    setFinanceLoading(true);
    getOrdersBySeller(uid)
      .then((orders) => {
        setSellerOrders(orders);
        setFinanceLoading(false);
      })
      .catch(() => setFinanceLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setAnalyticsLoading(false);
      return;
    }
    setAnalyticsLoading(true);
    getSellerAnalytics(user.id)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [user?.id]);

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  if (analyticsLoading && !analytics) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-[#F9423A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/30 animate-pulse">
            Analytics Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-zinc-50 dark:bg-zinc-950 text-[#1A1033] relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl px-4 lg:px-12 py-4 lg:py-6 flex items-center justify-between border-b border-brand-primary/5 dark:border-white/5 gap-4">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <h1 className="text-xl lg:text-3xl font-display font-black uppercase italic tracking-tight text-brand-primary dark:text-white">
              Mağaza{' '}
              <span className="text-[#F9423A] underline underline-offset-4 lg:underline-offset-8 decoration-2 lg:decoration-4">
                Performansı
              </span>
            </h1>
            <p className="text-[8px] lg:text-[10px] font-black text-brand-primary/30 dark:text-white/30 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-1 lg:mt-2">
              Genel Satış ve Operasyonlar
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative group">
            <Search
              className="absolute start-6 top-1/2 -translate-y-1/2 text-brand-primary/20 dark:text-white/20 group-focus-within:text-[#F9423A] transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Ürün, Sipariş veya SKU Ara..."
              className="w-full ps-16 pe-10 py-3 bg-zinc-50 dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 ring-[#F9423A]/10 transition-all lg:py-4 lg:rounded-[1.75rem] text-brand-primary dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-8 border-s border-brand-primary/10 ps-4 lg:pl-8 shrink-0">
          <button className="p-2 lg:p-3.5 text-brand-primary/30 dark:text-white/30 hover:text-[#F9423A] transition-all bg-white dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-xl lg:rounded-2xl shadow-sm">
            <Bell className="w-5 h-5 lg:w-[22px] lg:h-[22px]" strokeWidth={2.5} />
          </button>
          <button className="px-4 py-2 lg:px-8 lg:py-4 bg-[#F9423A] text-white rounded-xl lg:rounded-[1.5rem] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#F9423A]/20 hover:scale-105 transition-all flex items-center gap-2 lg:gap-3 hover:bg-orange-600">
            <span className="hidden xs:inline">Yeni Ürün Ekle</span> <Plus size={16} />
          </button>
        </div>
      </header>

      {/* Dynamic Content Canvas */}
      <div className="p-4 md:p-8 lg:p-12 max-w-[1700px] mx-auto space-y-8 lg:space-y-12 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <KPICard
                  label="Haftalık Ciro"
                  value={analytics ? `${formatCurrency(analytics.weeklyRevenue)}` : '---'}
                  growth={analytics ? formatTrend(analytics.revenueTrend).label : '+0%'}
                  icon={DollarSign}
                  color="#F9423A"
                  bg="bg-gradient-to-tr from-[#F9423A] to-orange-500"
                />
                <KPICard
                  label="Toplam Sipariş"
                  value={analytics ? String(analytics.totalOrders) : '---'}
                  growth={analytics ? formatTrend(analytics.orderTrend).label : '+0%'}
                  icon={ShoppingCart}
                  color="#10B981"
                  bg="bg-gradient-to-tr from-[#10B981] to-emerald-400"
                />
                <KPICard
                  label="Dönüşüm Oranı"
                  value={analytics ? `%${analytics.conversionRate}` : '---'}
                  growth={analytics ? formatTrend(analytics.conversionTrend).label : '+0%'}
                  icon={Activity}
                  color="#3B82F6"
                  bg="bg-gradient-to-tr from-[#3B82F6] to-blue-400"
                />
                <KPICard
                  label="Toplam Görüntülenme"
                  value={analytics ? String(analytics.totalViews) : '---'}
                  growth={analytics ? formatTrend(analytics.viewsTrend).label : '+0%'}
                  icon={BarChart3}
                  color="#F59E0B"
                  bg="bg-gradient-to-tr from-[#F59E0B] to-orange-400"
                />
              </div>

              {/* Main Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-[4rem] p-12 border border-brand-primary/5 dark:border-white/5 shadow-sm group">
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
                      Satış Performansı
                    </h3>
                    <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-2xl border border-brand-primary/5 dark:border-white/5">
                      {['7G', '14G', '30G'].map((p) => (
                        <button
                          key={p}
                          className={cn(
                            'px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                            p === '7G'
                              ? 'bg-white dark:bg-zinc-800 text-[#F9423A] shadow-sm'
                              : 'text-brand-primary/30 dark:text-white/30 hover:text-[#F9423A]',
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[420px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.dailyRevenue ?? []}>
                        <defs>
                          <linearGradient id="purpleG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F9423A" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#F9423A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#1A1033"
                          strokeOpacity={0.03}
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#1A1033', opacity: 0.3, fontWeight: 800 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#1A1033', opacity: 0.3, fontWeight: 800 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1033',
                            borderRadius: '24px',
                            border: 'none',
                            padding: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                          }}
                          itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#F9423A"
                          strokeWidth={5}
                          fill="url(#purpleG)"
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-10">
                  <div className="bg-[#1A1033] rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                    <Smartphone
                      size={300}
                      className="absolute -bottom-20 -end-20 text-white/5 opacity-40 group-hover:scale-125 transition-transform duration-1000 pointer-events-none"
                    />
                    <h3 className="text-2xl font-display font-black uppercase italic mb-10 relative z-10">
                      Cihaz Dağılımı
                    </h3>
                    <div className="space-y-10 relative z-10">
                      {(
                        analytics?.deviceBreakdown ?? [
                          { name: 'Mobil', percentage: 58, color: '#F9423A' },
                          { name: 'Masaüstü', percentage: 32, color: '#3B82F6' },
                          { name: 'Tablet', percentage: 10, color: '#10B981' },
                        ]
                      ).map((device, i) => (
                        <div key={device.name} className="space-y-4">
                          <div className="flex justify-between items-baseline text-[11px] font-black uppercase tracking-widest text-white/40">
                            <span>{device.name}</span>
                            <span className="text-white">{device.percentage}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${device.percentage}%` }}
                              transition={{ duration: 1.5, delay: i * 0.2 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: device.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-accent rounded-[3.5rem] p-12 text-white shadow-2xl shadow-accent/20 flex-1 flex flex-col relative group">
                    <DollarSign
                      size={120}
                      className="absolute -bottom-10 -end-10 text-white/10 group-hover:rotate-12 transition-transform duration-700"
                    />
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-8 italic">
                      Mevcut Bakiye
                    </p>
                    <h4 className="text-5xl font-display font-black tracking-tighter mb-4">
                      £4,850.00
                    </h4>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">
                      Onaylandı & Ödemeye Hazır
                    </p>
                    <button className="w-full mt-auto py-5 bg-white text-[#1A1033] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                      Ödeme Talep Et
                    </button>
                  </div>
                </div>
              </div>

              {/* En Çok Satan Ürünler */}
              {analytics && analytics.topProducts.length > 0 && (
                <div className="bg-white rounded-[4rem] p-12 border border-brand-primary/5 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
                      En Çok Satan Ürünler
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/30">
                      Bu Hafta
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brand-primary/5">
                          <th className="pb-4 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                            Ürün
                          </th>
                          <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                            Görüntülenme
                          </th>
                          <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                            Satış
                          </th>
                          <th className="pb-4 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                            Gelir
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topProducts.slice(0, 5).map((p, i) => (
                          <tr key={p.id} className="border-b border-brand-primary/5 last:border-0">
                            <td className="py-5">
                              <div className="flex items-center gap-4">
                                <span className="text-[11px] font-black text-brand-primary/20 w-6">
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-brand-primary">{p.name}</p>
                                  <p className="text-[11px] text-brand-primary/40 font-medium">
                                    {formatCurrency(p.price)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 text-center text-sm font-bold text-brand-primary/60">
                              {p.views}
                            </td>
                            <td className="py-5 text-center">
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-black">
                                {p.sales} adet
                              </span>
                            </td>
                            <td className="py-5 text-end text-sm font-black text-brand-primary">
                              {formatCurrency(p.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Market Intelligence Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  {
                    icon: TrendingUp,
                    label: 'Trend Analizi',
                    title: 'Ses Dalgası',
                    desc: '"Stüdyo Ekipmanları" için talep son haftada %245 arttı.',
                    color: 'text-accent',
                  },
                  {
                    icon: ShieldCheck,
                    label: 'Uyum Merkezi',
                    title: 'Vergi Güncellemesi',
                    desc: 'Tüm AB satışları için KDV doğrulaması tamamlandı.',
                    color: 'text-blue-500',
                  },
                  {
                    icon: Zap,
                    label: 'Sistem Durumu',
                    title: 'Senkronizasyon',
                    desc: 'Mağaza verileri tüm sunuculara başarıyla dağıtıldı.',
                    color: 'text-green-500',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white p-10 rounded-[3rem] border border-[#F8F8FA] shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl bg-[#F8F8FA] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform',
                        item.color,
                      )}
                    >
                      <item.icon size={26} strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/20 mb-3 italic">
                      {item.label}
                    </p>
                    <h5 className="text-xl font-display font-black text-[#1A1033] mb-4 uppercase tracking-tight">
                      {item.title}
                    </h5>
                    <p className="text-[13px] font-medium text-[#1A1033]/40 italic leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'bulk' ? (
            <motion.div
              key="bulk"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="bg-white rounded-[4rem] p-16 border-2 border-dashed border-[#1A1033]/5 min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                {isUploading ? (
                  <div className="w-full max-w-md space-y-10 scale-110">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-black uppercase text-[#1A1033]/50 text-start">
                          Toplu İşlem Devam Ediyor
                        </p>
                        <p className="text-[10px] font-bold text-[#1A1033]/30 italic text-start mt-1">
                          Envanter_2026_Q2.json
                        </p>
                      </div>
                      <p className="text-4xl font-display font-black text-accent tracking-tighter">
                        {uploadProgress}%
                      </p>
                    </div>
                    <div className="h-2 w-full bg-[#F8F8FA] rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className="h-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-3 text-accent animate-pulse">
                      <Sparkles size={18} />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                        Yapay Zeka Eşleniyor...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-28 h-28 bg-accent/5 rounded-[3rem] flex items-center justify-center text-accent mb-12 shadow-2xl shadow-accent/5">
                      <Upload size={48} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-6">
                      Toplu Yükleme
                    </h2>
                    <p className="max-w-md text-[#1A1033]/40 text-sm font-medium italic leading-relaxed mb-12">
                      Shopify, Amazon veya Etsy&apos;den JSON veya CSV verilerinizi buraya bırakın.
                      Yapay zeka kategorileri, HS kodlarını otomatik olarak eşler ve ürün
                      açıklamalarını oluşturur.
                    </p>
                    <button
                      onClick={simulateUpload}
                      className="px-16 py-6 bg-[#1A1033] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-black/30 hover:bg-accent hover:scale-105 transition-all"
                    >
                      Dosya Seç
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-[#1A1033] rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                  <Sparkles
                    size={160}
                    className="absolute -bottom-20 -start-20 text-white/5 opacity-50 group-hover:scale-125 transition-transform duration-1000"
                  />
                  <h4 className="text-2xl font-display font-black uppercase italic mb-6 relative z-10">
                    Yapay Zeka Otomatik Yakalama
                  </h4>
                  <p className="text-white/50 text-sm leading-relaxed italic mb-10 relative z-10">
                    Yapay zeka motorumuz ürün etiketlerini genişletir, SEO açıklamaları oluşturur ve
                    listelerinizi platformumuz için otomatik olarak optimize eder.
                  </p>
                  <button className="px-8 py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 relative z-10">
                    Detayları Gör
                  </button>
                </div>
                <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm relative overflow-hidden group">
                  <Package
                    size={160}
                    className="absolute -bottom-20 -end-20 text-[#1A1033]/5 group-hover:scale-125 transition-transform duration-1000"
                  />
                  <h4 className="text-2xl font-display font-black uppercase italic mb-6 text-[#1A1033]">
                    Senkronizasyon İstatistikleri
                  </h4>
                  <div className="grid grid-cols-2 gap-8 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-[#1A1033]/30 uppercase tracking-widest mb-1">
                        Toplam Kapasite
                      </p>
                      <p className="text-2xl font-display font-black text-[#1A1033]">50.000 SKU</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#1A1033]/30 uppercase tracking-widest mb-1">
                        Günlük Limit
                      </p>
                      <p className="text-2xl font-display font-black text-accent">Sınırsız</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'finance' ? (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
                  Finans Özeti
                </h3>
                <div className="flex gap-2">
                  {(['30', '90', 'all'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFinancePeriod(p)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${financePeriod === p ? 'bg-[#1A1033] text-white' : 'bg-white text-[#1A1033]/40 border border-[#F8F8FA]'}`}
                    >
                      {p === 'all' ? 'Tümü' : `Son ${p} Gün`}
                    </button>
                  ))}
                </div>
              </div>

              {financeLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : (
                (() => {
                  const cutoff =
                    financePeriod === 'all'
                      ? null
                      : (() => {
                          const d = new Date();
                          d.setDate(d.getDate() - parseInt(financePeriod));
                          return d;
                        })();
                  const filtered = sellerOrders.filter(
                    (o) => !cutoff || new Date(o.createdAt) >= cutoff,
                  );
                  const delivered = filtered.filter((o) => o.status === 'delivered');
                  const grossEarnings = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
                  const commission = grossEarnings * 0.1;
                  const netEarnings = grossEarnings - commission;

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          {
                            label: 'Brüt Kazanç',
                            value: `${grossEarnings.toLocaleString('tr-TR')} ₺`,
                            icon: TrendingUp,
                            color: 'text-blue-500',
                            bg: 'bg-blue-50',
                          },
                          {
                            label: 'Komisyon Kesintisi (%10)',
                            value: `${commission.toLocaleString('tr-TR')} ₺`,
                            icon: Percent,
                            color: 'text-[#F9423A]',
                            bg: 'bg-[#F9423A]/10',
                          },
                          {
                            label: 'Net Ödeme',
                            value: `${netEarnings.toLocaleString('tr-TR')} ₺`,
                            icon: DollarSign,
                            color: 'text-green-500',
                            bg: 'bg-green-50',
                          },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                          <div
                            key={label}
                            className="bg-white rounded-[2.5rem] p-8 flex items-center gap-4 border border-[#F8F8FA] shadow-sm"
                          >
                            <div
                              className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}
                            >
                              <Icon size={20} className={color} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mb-0.5">
                                {label}
                              </p>
                              <p className="text-xl font-black text-[#1A1033]">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-[#F8F8FA] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-[#F8F8FA]">
                          <h4 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/40">
                            Sipariş Bazında Kazanç
                          </h4>
                        </div>
                        {delivered.length === 0 ? (
                          <p className="text-center py-12 text-[#1A1033]/30 font-bold text-sm">
                            Bu dönem teslim edilen sipariş yok
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-[#F8F8FA]">
                                  <th className="px-8 py-4 text-start text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                                    Sipariş No
                                  </th>
                                  <th className="px-8 py-4 text-start text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                                    Tarih
                                  </th>
                                  <th className="px-8 py-4 text-end text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                                    Tutar
                                  </th>
                                  <th className="px-8 py-4 text-end text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                                    Komisyon
                                  </th>
                                  <th className="px-8 py-4 text-end text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                                    Net
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {delivered.slice(0, 15).map((o) => {
                                  const amt = o.totalAmount || 0;
                                  const com = amt * 0.1;
                                  return (
                                    <tr
                                      key={o.id}
                                      className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50"
                                    >
                                      <td className="px-8 py-4 font-bold text-xs text-[#1A1033]">
                                        {o.id.slice(0, 10)}...
                                      </td>
                                      <td className="px-8 py-4 text-xs text-[#1A1033]/50">
                                        {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                                      </td>
                                      <td className="px-8 py-4 text-end text-xs font-bold">
                                        {amt.toLocaleString('tr-TR')} ₺
                                      </td>
                                      <td className="px-8 py-4 text-end text-xs text-[#F9423A] font-bold">
                                        {com.toLocaleString('tr-TR')} ₺
                                      </td>
                                      <td className="px-8 py-4 text-end text-xs font-bold text-green-600">
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
                  );
                })()
              )}
            </motion.div>
          ) : (
            <div className="text-center py-40 bg-white border border-[#F8F8FA] rounded-[5rem] shadow-sm">
              <Activity size={48} className="mx-auto text-accent mb-10 animate-pulse" />
              <h3 className="text-3xl font-display font-black uppercase italic text-[#1A1033]/20 tracking-widest">
                Veriler <span className="text-accent">Yükleniyor...</span>
              </h3>
              <p className="text-[11px] font-black text-[#1A1033]/20 uppercase tracking-[0.4em] mt-6">
                Mağaza verileri getiriliyor
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}
