'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Eye, MousePointerClick, DollarSign, TrendingUp,
  RefreshCcw, AlertCircle, BarChart3, Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { getSellerAdAnalytics } from '@/services/adService';
import type { SellerAdAnalytics } from '@/types';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 Gün',
  '30d': '30 Gün',
  '90d': '90 Gün',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="w-20 h-3 rounded bg-gray-200" />
            <div className="w-28 h-7 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="w-32 h-4 rounded bg-gray-200" />
            <div className="h-[280px] rounded-xl bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="w-40 h-5 rounded bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function KPICard({ label, value, subtext, icon: Icon, color, bg }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900 tracking-tight">{value}</p>
        {subtext && <p className="text-[10px] text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </motion.div>
  );
}

// ─── Chart Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-xl text-xs space-y-1">
      <p className="font-bold text-gray-900">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Harcama' ? formatCurrency(entry.value) : entry.value.toLocaleString('tr-TR')}
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdAnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<SellerAdAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getSellerAdAnalytics(user.id, period);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, period]);

  useEffect(() => { load(); }, [load]);

  // Build daily chart data from campaigns
  const dailyChartData = data?.campaigns
    .flatMap(c => {
      // If campaigns have dailyBreakdown-like data from the service
      // For now, derive a simple daily view from campaign totals
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      return Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        return {
          date: dateStr,
          impressions: Math.round(c.impressions / days),
          clicks: Math.round(c.clicks / days),
          spend: c.spend / days,
        };
      });
    })
    .reduce<{ date: string; impressions: number; clicks: number; spend: number }[]>((acc, curr) => {
      const existing = acc.find(a => a.date === curr.date);
      if (existing) {
        existing.impressions += curr.impressions;
        existing.clicks += curr.clicks;
        existing.spend += curr.spend;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, [])
    .sort((a, b) => a.date.localeCompare(b.date, 'tr-TR')) || [];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold uppercase italic tracking-tighter text-gray-900">
              Reklam Analitik
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">
              Reklam performansını görüntüleyin
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all',
                  period === key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-700',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading ? (
          <SkeletonPage />
        ) : error ? (
          /* ── Error ─────────────────────────────────────────────────────── */
          <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
            <h2 className="text-lg font-bold text-red-700 mb-1">Veri Yüklenemedi</h2>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 transition-colors"
            >
              <RefreshCcw size={14} /> Tekrar Dene
            </button>
          </div>
        ) : !data || data.campaigns.length === 0 ? (
          /* ── Empty ─────────────────────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Henüz Veri Yok</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Henüz hiç reklam kampanyanız bulunmuyor. Reklam kampanyaları oluşturup
              yayınlamaya başladıktan sonra performans verileriniz burada görüntülenecek.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ───────────────────────────────────────────────── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <KPICard
                label="Toplam Gösterim"
                value={data.totalImpressions.toLocaleString('tr-TR')}
                icon={Eye}
                color="text-blue-600"
                bg="bg-blue-100"
              />
              <KPICard
                label="Toplam Tıklama"
                value={data.totalClicks.toLocaleString('tr-TR')}
                icon={MousePointerClick}
                color="text-purple-600"
                bg="bg-purple-100"
              />
              <KPICard
                label="Toplam Harcama"
                value={formatCurrency(data.totalSpend)}
                subtext={`${data.activeCampaigns} aktif kampanya`}
                icon={DollarSign}
                color="text-emerald-600"
                bg="bg-emerald-100"
              />
              <KPICard
                label="Ortalama Tıklama Oranı"
                value={`%${data.averageCtr.toFixed(2)}`}
                icon={TrendingUp}
                color="text-amber-600"
                bg="bg-amber-100"
              />
            </motion.div>

            {/* ── Charts ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Impressions & Clicks Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                  Günlük Gösterim & Tıklama
                </h2>
                {dailyChartData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="impressions" name="Gösterim" stroke="#3B82F6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="clicks" name="Tıklama" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
                    Grafik verisi bulunamadı
                  </div>
                )}
              </motion.div>

              {/* Daily Spend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                  Günlük Harcama
                </h2>
                {dailyChartData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => formatCurrency(v)} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="spend" name="Harcama" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
                    Grafik verisi bulunamadı
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Campaign Detail Table ────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Kampanya Detayları
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Kampanya</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Durum</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Gösterim</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tıklama</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">TO</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Harcama</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ort. TBM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c, i) => (
                      <tr key={c.id} className={cn('border-b border-gray-50 hover:bg-gray-50/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 text-xs">{c.campaignName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">CPC: {formatCurrency(c.cpcBid)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-block px-2 py-0.5 text-[10px] font-bold rounded-full',
                            c.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            c.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                            c.status === 'exhausted' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                          )}>
                            {c.status === 'active' ? 'Aktif' :
                             c.status === 'paused' ? 'Duraklatıldı' :
                             c.status === 'exhausted' ? 'Bütçe Tükendi' :
                             c.status === 'pending' ? 'Onay Bekliyor' :
                             c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600">{c.impressions.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600">{c.clicks.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">%{c.ctr.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">{formatCurrency(c.spend)}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600">{formatCurrency(c.avgCpc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
