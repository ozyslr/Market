import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Percent,
  BarChart3,
  RefreshCw,
  Package,
  Store,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/DataStates';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportData {
  // KPI overview
  totalGMV: number;
  orderCount: number;
  avgOrderValue: number;
  deliveredRate: number;
  cancelRate: number;

  // Revenue trend
  revenueTrend: { label: string; revenue: number; orders: number }[];

  // Top sellers
  topSellers: { sellerId: string; storeName: string; orderCount: number; totalRevenue: number }[];

  // Top products
  topProducts: { productId: string; name: string; unitsSold: number; totalRevenue: number }[];

  // Category distribution
  categoryDistribution: { name: string; value: number }[];
}

interface OrderDoc {
  id: string;
  totalAmount?: number;
  total?: number;
  status?: string;
  sellerIds?: string[];
  items?: Array<{
    productId: string;
    name: string;
    sellerId: string;
    price: number;
    quantity: number;
  }>;
  category?: string;
  createdAt?: string;
}

// ─── Period ─────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 Gun',
  '30d': '30 Gun',
  '90d': '90 Gun',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return (
    amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL'
  );
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M TL';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'B TL';
  return formatCurrency(amount);
}

function daysInPeriod(period: Period): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90;
}

function cutoffDate(period: Period): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysInPeriod(period));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// ─── Chart Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-800 border border-brand-primary/10 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs space-y-1">
      <p className="font-bold text-brand-primary dark:text-white">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}:{' '}
          {typeof entry.value === 'number' && entry.name.includes('Gelir')
            ? formatCurrency(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Overview Card ──────────────────────────────────────────────────────────

function OverviewCard({
  label,
  value,
  icon: Icon,
  bg,
  loading,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  bg: string;
  loading?: boolean;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40 dark:text-white/40 mb-2">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-brand-primary/5 dark:bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-2xl font-display font-black text-brand-primary dark:text-white tracking-tighter">
              {value}
            </h3>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg',
            bg,
          )}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      {trend && !loading && (
        <div
          className={cn(
            'flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full w-fit',
            trend.isPositive
              ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
              : 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
          )}
        >
          {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminReports() {
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<ReportData>({
    totalGMV: 0,
    orderCount: 0,
    avgOrderValue: 0,
    deliveredRate: 0,
    cancelRate: 0,
    revenueTrend: [],
    topSellers: [],
    topProducts: [],
    categoryDistribution: [],
  });

  // ─── Load all report data ────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { collection, getDocs, query: fq, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const cutoff = cutoffDate(period);

      // Fetch orders
      const ordersSnap = await getDocs(fq(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const orders: OrderDoc[] = ordersSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as OrderDoc[];

      // Fetch products for name resolution
      const productsSnap = await getDocs(collection(db, 'products'));
      const productNameMap: Record<string, string> = {};
      const productData: Record<string, { category?: string }> = {};
      productsSnap.docs.forEach((d) => {
        const p = d.data();
        productNameMap[d.id] = p.name || p.title || d.id;
        productData[d.id] = { category: p.category };
      });

      // Fetch sellers for store name resolution
      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const sellerNameMap: Record<string, string> = {};
      sellersSnap.docs.forEach((d) => {
        const s = d.data();
        sellerNameMap[d.id] = s.storeName || s.name || d.id;
      });

      // Filter to period
      const filtered = orders.filter((o) => {
        if (!o.createdAt) return false;
        return new Date(o.createdAt) >= cutoff;
      });

      // ── Compute KPIs ───────────────────────────────────────────────────
      const totalGMV = filtered.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
      const orderCount = filtered.length;
      const avgOrderValue = orderCount > 0 ? totalGMV / orderCount : 0;
      const deliveredCount = filtered.filter((o) => o.status === 'delivered').length;
      const cancelledCount = filtered.filter((o) => o.status === 'cancelled').length;
      const deliveredRate = orderCount > 0 ? (deliveredCount / orderCount) * 100 : 0;
      const cancelRate = orderCount > 0 ? (cancelledCount / orderCount) * 100 : 0;

      // ── Revenue Trend (daily buckets) ──────────────────────────────────
      const dayMap: Record<string, { revenue: number; orders: number }> = {};
      const dayCount = daysInPeriod(period);
      for (let i = dayCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = { revenue: 0, orders: 0 };
      }
      filtered.forEach((o) => {
        if (o.createdAt) {
          const key = o.createdAt.slice(0, 10);
          if (dayMap[key]) {
            dayMap[key].revenue += o.totalAmount || o.total || 0;
            dayMap[key].orders += 1;
          }
        }
      });
      const revenueTrend = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, val]) => ({
          label: formatDateLabel(date),
          revenue: val.revenue,
          orders: val.orders,
        }));

      // ── Top Sellers ────────────────────────────────────────────────────
      const sellerStats: Record<string, { orderCount: number; totalRevenue: number }> = {};
      filtered.forEach((o) => {
        const amount = o.totalAmount || o.total || 0;
        const ids = o.sellerIds || [];
        ids.forEach((sid) => {
          if (!sellerStats[sid]) sellerStats[sid] = { orderCount: 0, totalRevenue: 0 };
          sellerStats[sid].orderCount += 1;
          sellerStats[sid].totalRevenue += amount / (ids.length || 1);
        });
      });
      const topSellers = Object.entries(sellerStats)
        .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)
        .map(([sellerId, stats]) => ({
          sellerId,
          storeName: sellerNameMap[sellerId] || sellerId,
          ...stats,
        }));

      // ── Top Products ───────────────────────────────────────────────────
      const productStats: Record<string, { unitsSold: number; totalRevenue: number }> = {};
      filtered.forEach((o) => {
        const items = o.items || [];
        items.forEach((item) => {
          if (!productStats[item.productId])
            productStats[item.productId] = { unitsSold: 0, totalRevenue: 0 };
          productStats[item.productId].unitsSold += item.quantity || 1;
          productStats[item.productId].totalRevenue += (item.price || 0) * (item.quantity || 1);
        });
      });
      const topProducts = Object.entries(productStats)
        .sort(([, a], [, b]) => b.unitsSold - a.unitsSold)
        .slice(0, 10)
        .map(([productId, stats]) => ({
          productId,
          name: productNameMap[productId] || productId,
          ...stats,
        }));

      // ── Category Distribution ──────────────────────────────────────────
      const catMap: Record<string, number> = {};
      filtered.forEach((o) => {
        const items = o.items || [];
        items.forEach((item) => {
          const cat = productData[item.productId]?.category || 'Diger';
          // Category may be a comma-separated string
          const cats = typeof cat === 'string' ? cat.split(',').map((c) => c.trim()) : [cat];
          cats.forEach((c) => {
            catMap[c] = (catMap[c] || 0) + (item.quantity || 1);
          });
        });
      });
      const PIE_COLORS = [
        '#6418E5',
        '#F9423A',
        '#10B981',
        '#3B82F6',
        '#F59E0B',
        '#8B5CF6',
        '#EC4899',
        '#06B6D4',
        '#F97316',
        '#84CC16',
      ];
      const categoryDistribution = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      // Color assignment
      categoryDistribution.forEach((item, idx) => {
        (item as any).color = PIE_COLORS[idx % PIE_COLORS.length];
      });

      setData({
        totalGMV,
        orderCount,
        avgOrderValue,
        deliveredRate,
        cancelRate,
        revenueTrend,
        topSellers,
        topProducts,
        categoryDistribution,
      });
    } catch (err) {
      console.error('AdminReports load error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            Raporlar{' '}
            <span className="text-accent underline underline-offset-4 decoration-2">Analitik</span>
          </h1>
          <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mt-1">
            Satis performansi, kategori dagilimi ve trend analizi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-2xl p-1 shadow-sm">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  period === key
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-brand-primary/40 dark:text-white/40 hover:text-brand-primary dark:hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-white/60 hover:text-accent transition-colors shadow-sm"
          >
            <RefreshCw size={14} /> Yenile
          </button>
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────────────────────── */}
      {error && <ErrorState message="Rapor verileri yuklenemedi." onRetry={loadData} />}

      {!error && (
        <>
          {/* ── Overview KPI Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <OverviewCard
              label="Toplam GMV"
              value={loading ? '' : formatCompact(data.totalGMV)}
              icon={DollarSign}
              bg="bg-gradient-to-tr from-[#F9423A] to-orange-500"
              loading={loading}
            />
            <OverviewCard
              label="Siparis Sayisi"
              value={loading ? '' : data.orderCount.toLocaleString('tr-TR')}
              icon={ShoppingBag}
              bg="bg-gradient-to-tr from-[#3B82F6] to-[#60A5FA]"
              loading={loading}
            />
            <OverviewCard
              label="Ort. Siparis Degeri"
              value={loading ? '' : formatCurrency(data.avgOrderValue)}
              icon={TrendingUp}
              bg="bg-gradient-to-tr from-[#8B5CF6] to-[#A78BFA]"
              loading={loading}
            />
            <OverviewCard
              label="Teslim Orani"
              value={loading ? '' : `%${data.deliveredRate.toFixed(1)}`}
              icon={BarChart3}
              bg="bg-gradient-to-tr from-[#10B981] to-[#34D399]"
              loading={loading}
              trend={{ value: Math.round(data.deliveredRate), isPositive: true }}
            />
            <OverviewCard
              label="Iptal Orani"
              value={loading ? '' : `%${data.cancelRate.toFixed(1)}`}
              icon={Percent}
              bg="bg-gradient-to-tr from-[#EF4444] to-[#F87171]"
              loading={loading}
              trend={{ value: Math.round(data.cancelRate), isPositive: false }}
            />
          </div>

          {/* ── Revenue Trend Chart ──────────────────────────────────────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 lg:p-10">
            <SectionHeader title="Gelir Trendi" subtitle={`Son ${daysInPeriod(period)} gun`} />
            {loading ? (
              <LoadingState label="Gelir verileri yukleniyor..." />
            ) : data.revenueTrend.length === 0 ? (
              <EmptyState title="Veri bulunamadi" description="Secilen donemde gelir verisi yok." />
            ) : (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.revenueTrend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6418E5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6418E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-brand-primary/5 dark:text-white/5"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                      stroke="currentColor"
                      className="text-brand-primary/20 dark:text-white/20"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                      stroke="currentColor"
                      className="text-brand-primary/20 dark:text-white/20"
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}B` : String(v)
                      }
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Gelir"
                      stroke="#6418E5"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Top Sellers + Category Distribution ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Top Sellers Table */}
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="p-6 lg:p-10 border-b border-brand-primary/5 dark:border-white/5">
                <SectionHeader title="En Cok Satan Magazalar" subtitle="Top 10 / gore" />
              </div>
              {loading ? (
                <LoadingState label="Magaza verileri yukleniyor..." />
              ) : data.topSellers.length === 0 ? (
                <div className="p-10">
                  <EmptyState
                    title="Magaza verisi bulunamadi"
                    description="Secilen donemde magaza satisi yok."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-start">
                    <thead>
                      <tr className="bg-[#F8F8FA] dark:bg-zinc-950 text-[10px] font-black uppercase tracking-widest text-brand-primary/30 dark:text-white/30">
                        <th className="px-8 py-5 text-start">#</th>
                        <th className="px-6 py-5 text-start">Magaza</th>
                        <th className="px-6 py-5 text-center">Siparis</th>
                        <th className="px-8 py-5 text-end">Gelir</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {data.topSellers.map((seller, idx) => (
                        <tr
                          key={seller.sellerId}
                          className="border-b border-[#F8F8FA] dark:border-white/5 last:border-0 hover:bg-[#F8F8FA]/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-8 py-5">
                            <span
                              className={cn(
                                'w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black',
                                idx < 3
                                  ? 'bg-accent text-white'
                                  : 'bg-[#F8F8FA] dark:bg-zinc-800 text-brand-primary/30 dark:text-white/30',
                              )}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Store size={14} className="text-accent" />
                              </div>
                              <p className="font-bold text-brand-primary dark:text-white truncate max-w-[200px]">
                                {seller.storeName}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center font-mono font-bold text-brand-primary/60 dark:text-white/60">
                            {seller.orderCount}
                          </td>
                          <td className="px-8 py-5 text-end font-mono font-black text-brand-primary dark:text-white">
                            {formatCurrency(seller.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Category Pie Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 lg:p-10">
              <SectionHeader title="Kategori Dagilimi" subtitle="Satis adedine gore" />
              {loading ? (
                <LoadingState label="Kategori verileri yukleniyor..." />
              ) : data.categoryDistribution.length === 0 ? (
                <EmptyState
                  title="Kategori verisi yok"
                  description="Secilen donemde kategori verisi bulunamadi."
                />
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {data.categoryDistribution.map((entry, idx) => (
                          <Cell key={entry.name} fill={(entry as any).color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0];
                          return (
                            <div className="bg-white dark:bg-zinc-800 border border-brand-primary/10 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs">
                              <p className="font-bold text-brand-primary dark:text-white">
                                {d.name}
                              </p>
                              <p className="font-semibold" style={{ color: d.color }}>
                                {d.value} adet
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        formatter={(value: string) => (
                          <span className="text-brand-primary/60 dark:text-white/60">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ── Top Products Table ───────────────────────────────────────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-6 lg:p-10 border-b border-brand-primary/5 dark:border-white/5">
              <SectionHeader title="En Cok Satan Urunler" subtitle="Top 10 / satis adedine gore" />
            </div>
            {loading ? (
              <LoadingState label="Urun verileri yukleniyor..." />
            ) : data.topProducts.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  title="Urun verisi bulunamadi"
                  description="Secilen donemde urun satisi yok."
                />
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-start">
                  <thead>
                    <tr className="bg-[#F8F8FA] dark:bg-zinc-950 text-[10px] font-black uppercase tracking-widest text-brand-primary/30 dark:text-white/30">
                      <th className="px-8 py-5 text-start">#</th>
                      <th className="px-6 py-5 text-start">Urun</th>
                      <th className="px-6 py-5 text-center">Satis Adedi</th>
                      <th className="px-8 py-5 text-end">Toplam Gelir</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {data.topProducts.map((product, idx) => (
                      <tr
                        key={product.productId}
                        className="border-b border-[#F8F8FA] dark:border-white/5 last:border-0 hover:bg-[#F8F8FA]/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-8 py-5">
                          <span
                            className={cn(
                              'w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black',
                              idx < 3
                                ? 'bg-accent text-white'
                                : 'bg-[#F8F8FA] dark:bg-zinc-800 text-brand-primary/30 dark:text-white/30',
                            )}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                              <Package size={14} className="text-accent" />
                            </div>
                            <p className="font-bold text-brand-primary dark:text-white truncate max-w-[250px]">
                              {product.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-mono font-bold text-brand-primary/60 dark:text-white/60">
                          {product.unitsSold}
                        </td>
                        <td className="px-8 py-5 text-end font-mono font-black text-brand-primary dark:text-white">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="py-12 flex flex-col items-center justify-center text-center opacity-20 hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white mb-4">
          <ShieldCheck size={18} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary dark:text-white">
          Rapor ve Analitik Modulu
        </p>
        <p className="text-[8px] font-bold text-brand-primary/30 dark:text-white/30 uppercase tracking-widest mt-1">
          Benim Olan Admin / 2026
        </p>
      </div>
    </div>
  );
}
