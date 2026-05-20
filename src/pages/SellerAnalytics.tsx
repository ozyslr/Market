import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, DollarSign, ShoppingCart, Activity, Users, RefreshCcw,
  Loader2, ChevronRight, Package, AlertCircle, BarChart3, ArrowUpRight,
  ArrowDownRight, Percent,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getSellerAnalytics, SellerAnalytics } from '@/services/sellerAnalyticsService';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart,
} from 'recharts';

type Period = '7d' | '30d' | '90d' | '1y';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 Gun',
  '30d': '30 Gun',
  '90d': '90 Gun',
  '1y': '1 Yil',
};

const STATUS_LABELS: Record<string, string> = {
  delivered: 'Teslim Edildi',
  processing: 'Isleniyor',
  shipped: 'Kargoda',
  pending: 'Bekliyor',
  cancelled: 'Iptal',
  refunded: 'Iade',
  returned: 'Geri Gonderildi',
  paid: 'Odendi',
};

const STATUS_COLORS: Record<string, string> = {
  delivered: '#10B981',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  pending: '#F59E0B',
  cancelled: '#EF4444',
  refunded: '#F97316',
  returned: '#EC4899',
  paid: '#06B6D4',
};

const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#F97316', '#EC4899'];

function formatCurrency(amount: number): string {
  return amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ₺';
}

function formatCompact(amount: number): string {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'B';
  return amount.toLocaleString('tr-TR');
}

// ── Skeleton ────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#1A1033]/5 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="w-10 h-10 rounded-xl bg-zinc-200" />
        <div className="w-16 h-4 rounded bg-zinc-200" />
      </div>
      <div className="space-y-2">
        <div className="w-20 h-3 rounded bg-zinc-200" />
        <div className="w-28 h-7 rounded bg-zinc-200" />
      </div>
      <div className="w-24 h-3 rounded bg-zinc-200" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-[#1A1033]/5 p-6 space-y-4 animate-pulse">
      <div className="w-32 h-4 rounded bg-zinc-200" />
      <div className="h-[300px] rounded-xl bg-zinc-100" />
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: { value: number; isPositive: boolean };
}

function KPICard({ label, value, subtext, icon: Icon, color, bg, trend }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#1A1033]/5 p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
          <Icon size={18} className={color} />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full',
            trend.isPositive ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50',
          )}>
            {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-0.5">{label}</p>
        <p className="text-xl font-display font-black text-[#1A1033] tracking-tight">{value}</p>
        {subtext && <p className="text-[10px] text-[#1A1033]/30 mt-0.5">{subtext}</p>}
      </div>
    </motion.div>
  );
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-xl text-xs space-y-1">
      <p className="font-bold text-[#1A1033]">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Gelir' ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    getSellerAnalytics(user.id, period)
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Bir hata olustu'))
      .finally(() => setLoading(false));
  }, [user?.id, period]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
            <h2 className="text-lg font-bold text-red-700 mb-1">Veri Yuklenemedi</h2>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 transition-colors"
            >
              <RefreshCcw size={14} /> Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
              Analitik
            </h1>
            <p className="text-xs text-[#1A1033]/40 mt-1 font-bold uppercase tracking-widest">
              Satis ve performans goruntuleme
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-[#1A1033]/5 p-1">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all',
                  period === key
                    ? 'bg-[#1A1033] text-white shadow-sm'
                    : 'text-[#1A1033]/40 hover:text-[#1A1033]/70',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          /* ── Loading State ────────────────────────────────────────────────── */
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><SkeletonChart /></div>
              <div><SkeletonChart /></div>
            </div>
          </div>
        ) : !data ? (
          /* ── Empty State ──────────────────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-[#1A1033]/5 p-16 text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-[#1A1033]/20" />
            <h2 className="text-lg font-bold text-[#1A1033] mb-2">Henuz Veri Yok</h2>
            <p className="text-sm text-[#1A1033]/40 max-w-md mx-auto leading-relaxed">
              Henuz hic siparis bulunmuyor. Urun ekleyip satis yapmaya basladiktan sonra
              analitik verileriniz burada goruntulenecek.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <KPICard
                label="Toplam Gelir"
                value={formatCurrency(data.overview.totalRevenue)}
                subtext={`${data.overview.totalOrders} siparis`}
                icon={DollarSign}
                color="text-emerald-600"
                bg="bg-emerald-100"
                trend={{ value: 12, isPositive: true }}
              />
              <KPICard
                label="Toplam Siparis"
                value={data.overview.totalOrders.toLocaleString('tr-TR')}
                subtext={`Ort. ${formatCurrency(data.overview.averageOrderValue)}`}
                icon={ShoppingCart}
                color="text-blue-600"
                bg="bg-blue-100"
                trend={{ value: 8, isPositive: true }}
              />
              <KPICard
                label="Donusum Orani"
                value={`%${data.overview.conversionRate}`}
                subtext="Goruntuleme / Satis"
                icon={Activity}
                color="text-purple-600"
                bg="bg-purple-100"
                trend={{ value: 2.1, isPositive: true }}
              />
              <KPICard
                label="Aktif Urun"
                value={`${data.overview.activeProducts} / ${data.overview.totalProducts}`}
                subtext={`%${data.overview.totalProducts > 0 ? Math.round(data.overview.activeProducts / data.overview.totalProducts * 100) : 0} stokta`}
                icon={Package}
                color="text-amber-600"
                bg="bg-amber-100"
              />
            </motion.div>

            {/* ── Revenue Chart + Status Breakdown ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Revenue over time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-white rounded-2xl border border-[#1A1033]/5 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60">
                    Gelir Grafigi
                  </h2>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-[#1A1033]/50">Gelir</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      <span className="font-bold text-[#1A1033]/50">Siparis</span>
                    </span>
                  </div>
                </div>

                {data.revenueOverTime.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.revenueOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#1A1033' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => {
                            const d = new Date(v);
                            return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 10, fill: '#1A1033' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => formatCompact(v)}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10, fill: '#1A1033' }}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 'auto']}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="Gelir"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4, fill: '#10B981' }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          name="Siparis"
                          stroke="#60A5FA"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#60A5FA' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center">
                    <p className="text-sm text-[#1A1033]/30 font-bold">Bu donemde veri bulunmuyor</p>
                  </div>
                )}
              </motion.div>

              {/* Order status breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-[#1A1033]/5 p-6"
              >
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60 mb-4">
                  Siparis Durumu
                </h2>

                {data.orderStatusBreakdown.length > 0 ? (
                  <>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.orderStatusBreakdown}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {data.orderStatusBreakdown.map((entry, idx) => (
                              <Cell
                                key={entry.status}
                                fill={STATUS_COLORS[entry.status] || PIE_COLORS[idx % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                                  <p className="font-bold">{STATUS_LABELS[payload[0].name] || payload[0].name}</p>
                                  <p className="font-semibold text-zinc-600">{payload[0].value} siparis</p>
                                </div>
                              ) : null
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 mt-2">
                      {data.orderStatusBreakdown.slice(0, 5).map(entry => (
                        <div key={entry.status} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[entry.status] || '#999' }}
                            />
                            <span className="font-semibold text-[#1A1033]/60">
                              {STATUS_LABELS[entry.status] || entry.status}
                            </span>
                          </div>
                          <span className="font-black text-[#1A1033]">{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-[#1A1033]/30 font-bold">Veri yok</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Top Products + Customer Metrics ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Top Products Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white rounded-2xl border border-[#1A1033]/5 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-[#1A1033]/5 flex items-center justify-between">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60">
                    En Cok Satan Urunler
                  </h2>
                </div>

                {data.topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1A1033]/5">
                          {['Urun', 'Adet', 'Gelir'].map(h => (
                            <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.topProducts.slice(0, 8).map((product, idx) => (
                          <tr
                            key={product.productId}
                            className="border-b border-[#1A1033]/5 hover:bg-[#F8F8FA] transition-colors"
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-lg bg-[#1A1033]/5 flex items-center justify-center text-[9px] font-black text-[#1A1033]/40">
                                  {idx + 1}
                                </span>
                                <span className="text-[12px] font-bold text-[#1A1033] truncate max-w-[240px]">
                                  {product.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[12px] font-bold text-[#1A1033]">{product.unitsSold}</td>
                            <td className="px-5 py-3 text-[12px] font-black text-emerald-600">
                              {formatCurrency(product.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Package size={28} className="mx-auto mb-2 text-[#1A1033]/20" />
                    <p className="text-xs text-[#1A1033]/40 font-bold">Henuz satilan urun yok</p>
                  </div>
                )}
              </motion.div>

              {/* Customer Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-[#1A1033]/5 p-6 space-y-6"
              >
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60">
                  Musteri Metrikleri
                </h2>

                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Users size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/50">Tekil Musteri</p>
                        <p className="text-lg font-black text-blue-700">
                          {data.customerMetrics.uniqueCustomers.toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                        <RefreshCcw size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-600/50">Tekrar Eden</p>
                        <p className="text-lg font-black text-purple-700">
                          {data.customerMetrics.repeatCustomers.toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-purple-500">
                      {data.customerMetrics.uniqueCustomers > 0
                        ? `%${Math.round(data.customerMetrics.repeatCustomers / data.customerMetrics.uniqueCustomers * 100)}`
                        : '%0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Percent size={16} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/50">Iade Orani</p>
                        <p className="text-lg font-black text-orange-700">%{data.customerMetrics.returnRate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini bar chart showing order status */}
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-3">
                    Siparis Dagilimi
                  </p>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden flex">
                    {data.orderStatusBreakdown.slice(0, 5).map(entry => {
                      const total = data.orderStatusBreakdown.reduce((s, e) => s + e.count, 0);
                      const pct = total > 0 ? (entry.count / total) * 100 : 0;
                      if (pct < 1) return null;
                      return (
                        <div
                          key={entry.status}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: STATUS_COLORS[entry.status] || '#999',
                          }}
                          title={`${STATUS_LABELS[entry.status] || entry.status}: ${entry.count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {data.orderStatusBreakdown.slice(0, 4).map(entry => (
                      <span key={entry.status} className="flex items-center gap-1 text-[9px] font-bold text-[#1A1033]/40">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[entry.status] || '#999' }}
                        />
                        {STATUS_LABELS[entry.status] || entry.status}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
