'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Users, Package, Receipt, Download, Loader2,
  TrendingUp, ShoppingCart, DollarSign, AlertCircle,
  ChevronDown, Calendar,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getAllOrders } from '@/services/orderService';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { Order } from '@/types/order';

type Tab = 'sales' | 'products' | 'users' | 'tax';

const TABS: { key: Tab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { key: 'sales', label: 'Satış', icon: TrendingUp },
  { key: 'products', label: 'Ürün', icon: Package },
  { key: 'users', label: 'Kullanıcı', icon: Users },
  { key: 'tax', label: 'Vergi', icon: Receipt },
];

const PIE_COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor', paid: 'Ödendi', processing: 'Hazırlanıyor',
  shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal',
  refunded: 'İade', return_requested: 'İade Talep', returned: 'İade Edildi',
};

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'30' | '90' | 'all'>('30');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getAllOrders(),
      getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))).then(s =>
        s.docs.map(d => ({ id: d.id, ...d.data() }))
      ),
      getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))).then(s =>
        s.docs.map(d => ({ id: d.id, ...d.data() }))
      ),
    ]).then(([o, p, u]) => {
      setOrders(o);
      setProducts(p);
      setUsers(u);
    }).catch(() => {
      setError('Veriler yüklenirken hata oluştu.');
    }).finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return orders.filter(o => new Date(o.createdAt) >= cutoff);
  }, [orders, period]);

  /* ── Sales metrics ── */
  const salesMetrics = useMemo(() => {
    const delivered = filteredOrders.filter(o => o.status === 'delivered');
    const revenue = delivered.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
    const paid = filteredOrders.filter(o => o.paymentStatus === 'succeeded');
    return {
      totalOrders: filteredOrders.length,
      deliveredOrders: delivered.length,
      revenue,
      avgOrderValue: delivered.length > 0 ? revenue / delivered.length : 0,
      paidCount: paid.length,
      cancelledCount: filteredOrders.filter(o => o.status === 'cancelled').length,
    };
  }, [filteredOrders]);

  const revenueChartData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    filteredOrders.filter(o => o.status === 'delivered').forEach(o => {
      const m = o.createdAt?.slice(0, 7);
      if (m) byMonth[m] = (byMonth[m] || 0) + (o.totalAmount || o.total || 0);
    });
    return Object.entries(byMonth).sort().map(([month, total]) => ({ month, gelir: total }));
  }, [filteredOrders]);

  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value }));
  }, [filteredOrders]);

  /* ── Product metrics ── */
  const productMetrics = useMemo(() => {
    const catCount: Record<string, number> = {};
    products.forEach((p: any) => {
      const cat = p.categoryId || 'Diğer';
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const catDist = Object.entries(catCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topSellers = [...products]
      .filter((p: any) => p.bestSeller)
      .slice(0, 10)
      .map((p: any) => ({ title: p.title || p.name || '', price: p.price || 0, stock: p.stock || 0 }));

    return {
      total: products.length,
      approved: products.filter((p: any) => p.status === 'approved' || !p.status).length,
      pending: products.filter((p: any) => p.status === 'pending').length,
      outOfStock: products.filter((p: any) => (p.stock ?? 0) <= 0).length,
      catDist,
      topSellers,
    };
  }, [products]);

  /* ── User metrics ── */
  const userMetrics = useMemo(() => {
    const byRole: Record<string, number> = {};
    users.forEach((u: any) => {
      const role = u.role || 'buyer';
      byRole[role] = (byRole[role] || 0) + 1;
    });
    const roleDist = Object.entries(byRole).map(([name, value]) => ({ name, value }));

    const byMonth: Record<string, number> = {};
    users.forEach((u: any) => {
      const m = u.createdAt?.slice(0, 7) || u.createdAt?.toDate?.()?.toISOString()?.slice(0, 7);
      if (m) byMonth[m] = (byMonth[m] || 0) + 1;
    });
    const registrations = Object.entries(byMonth).sort().map(([month, count]) => ({ month, kayit: count }));

    return {
      total: users.length,
      buyers: byRole['buyer'] || 0,
      sellers: byRole['seller'] || 0,
      admins: byRole['admin'] || 0,
      roleDist,
      registrations,
    };
  }, [users]);

  /* ── Tax metrics ── */
  const taxMetrics = useMemo(() => {
    const delivered = filteredOrders.filter(o => o.status === 'delivered');
    const totalTax = delivered.reduce((s, o) => s + (o.tax || 0), 0);
    const totalRevenue = delivered.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
    const totalShipping = delivered.reduce((s, o) => s + (o.shipping || 0), 0);

    const byMonth: Record<string, { vergi: number; gelir: number }> = {};
    delivered.forEach(o => {
      const m = o.createdAt?.slice(0, 7);
      if (m) {
        if (!byMonth[m]) byMonth[m] = { vergi: 0, gelir: 0 };
        byMonth[m].vergi += o.tax || 0;
        byMonth[m].gelir += o.totalAmount || o.total || 0;
      }
    });
    const monthlyTax = Object.entries(byMonth).sort().map(([month, d]) => ({ month, vergi: d.vergi, gelir: d.gelir }));

    return { totalTax, totalRevenue, totalShipping, monthlyTax, orderCount: delivered.length };
  }, [filteredOrders]);

  const formatCurr = (v: number) => v.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-purple-700" />
            <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          </div>
          {tab === 'sales' || tab === 'tax' ? (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as any)}
                className="text-sm font-medium text-gray-700 bg-transparent outline-none"
              >
                <option value="30">Son 30 Gün</option>
                <option value="90">Son 90 Gün</option>
                <option value="all">Tüm Zamanlar</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.key ? 'border-purple-700 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Contents */}
        {tab === 'sales' && <SalesTab metrics={salesMetrics} chartData={revenueChartData} statusDist={statusDist} formatCurr={formatCurr} />}
        {tab === 'products' && <ProductsTab metrics={productMetrics} />}
        {tab === 'users' && <UsersTab metrics={userMetrics} />}
        {tab === 'tax' && <TaxTab metrics={taxMetrics} formatCurr={formatCurr} />}
      </div>
    </div>
  );
}

/* ───────────────────── Sales Tab ───────────────────── */
function SalesTab({ metrics, chartData, statusDist, formatCurr }: any) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Toplam Sipariş" value={metrics.totalOrders.toString()} color="text-purple-600" bg="bg-purple-100" />
        <StatCard icon={DollarSign} label="Toplam Gelir" value={formatCurr(metrics.revenue)} color="text-emerald-600" bg="bg-emerald-100" />
        <StatCard icon={TrendingUp} label="Ort. Sipariş Değeri" value={formatCurr(metrics.avgOrderValue)} color="text-blue-600" bg="bg-blue-100" />
        <StatCard icon={Receipt} label="İptal Edilen" value={metrics.cancelledCount.toString()} color="text-red-600" bg="bg-red-100" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Gelir Grafiği</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Henüz veri bulunmuyor.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v: any) => `₺${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(val: any) => [formatCurr(val), 'Gelir']} />
              <Area type="monotone" dataKey="gelir" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Sipariş Durum Dağılımı</h3>
        {statusDist.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Henüz veri bulunmuyor.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statusDist.map((s: any, i: number) => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <div>
                  <p className="text-xs text-gray-500">{s.name}</p>
                  <p className="text-sm font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Products Tab ───────────────────── */
function ProductsTab({ metrics }: any) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Toplam Ürün" value={metrics.total.toString()} color="text-purple-600" bg="bg-purple-100" />
        <StatCard icon={Package} label="Onaylı" value={metrics.approved.toString()} color="text-emerald-600" bg="bg-emerald-100" />
        <StatCard icon={Package} label="Onay Bekleyen" value={metrics.pending.toString()} color="text-yellow-600" bg="bg-yellow-100" />
        <StatCard icon={Package} label="Stok Dışı" value={metrics.outOfStock.toString()} color="text-red-600" bg="bg-red-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Kategori Dağılımı</h3>
          {metrics.catDist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Henüz veri bulunmuyor.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.catDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine
                >
                  {metrics.catDist.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Çok Satan Ürünler</h3>
          {metrics.topSellers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Henüz veri bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {metrics.topSellers.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{p.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{p.price.toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-gray-400">Stok: {p.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Users Tab ───────────────────── */
function UsersTab({ metrics }: any) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Toplam Kullanıcı" value={metrics.total.toString()} color="text-purple-600" bg="bg-purple-100" />
        <StatCard icon={Users} label="Alıcı" value={metrics.buyers.toString()} color="text-blue-600" bg="bg-blue-100" />
        <StatCard icon={Users} label="Satıcı" value={metrics.sellers.toString()} color="text-emerald-600" bg="bg-emerald-100" />
        <StatCard icon={Users} label="Admin" value={metrics.admins.toString()} color="text-amber-600" bg="bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Rol Dağılımı</h3>
          {metrics.roleDist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Henüz veri bulunmuyor.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.roleDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {metrics.roleDist.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Registration Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Kayıt Trendi</h3>
          {metrics.registrations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Henüz veri bulunmuyor.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.registrations}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip formatter={(val: any) => [val, 'Kayıt']} />
                <Area type="monotone" dataKey="kayit" stroke="#3b82f6" strokeWidth={2} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Tax Tab ───────────────────── */
function TaxTab({ metrics, formatCurr }: any) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Receipt} label="Toplam Vergi" value={formatCurr(metrics.totalTax)} color="text-purple-600" bg="bg-purple-100" />
        <StatCard icon={DollarSign} label="Net Gelir" value={formatCurr(metrics.totalRevenue - metrics.totalTax)} color="text-emerald-600" bg="bg-emerald-100" />
        <StatCard icon={DollarSign} label="Brüt Gelir" value={formatCurr(metrics.totalRevenue)} color="text-blue-600" bg="bg-blue-100" />
        <StatCard icon={ShoppingCart} label="Teslim Edilen" value={metrics.orderCount.toString()} color="text-amber-600" bg="bg-amber-100" />
      </div>

      {/* Monthly Tax Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Aylık Vergi / Gelir</h3>
        {metrics.monthlyTax.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Henüz veri bulunmuyor.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={metrics.monthlyTax}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v: any) => `₺${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(val: any) => [formatCurr(val), '']} />
              <Bar dataKey="vergi" name="Vergi" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Vergi Özeti</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-3 text-xs font-bold text-gray-500 uppercase">Dönem</th>
                <th className="text-right p-3 text-xs font-bold text-gray-500 uppercase">Gelir</th>
                <th className="text-right p-3 text-xs font-bold text-gray-500 uppercase">Vergi</th>
                <th className="text-right p-3 text-xs font-bold text-gray-500 uppercase">Vergi Oranı</th>
              </tr>
            </thead>
            <tbody>
              {metrics.monthlyTax.map((r: any) => (
                <tr key={r.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{r.month}</td>
                  <td className="p-3 text-right text-gray-900">{formatCurr(r.gelir)}</td>
                  <td className="p-3 text-right text-gray-900">{formatCurr(r.vergi)}</td>
                  <td className="p-3 text-right text-gray-600">
                    %{r.gelir > 0 ? ((r.vergi / r.gelir) * 100).toFixed(1) : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="p-3 text-gray-900">Toplam</td>
                <td className="p-3 text-right text-gray-900">{formatCurr(metrics.monthlyTax.reduce((s: number, r: any) => s + r.gelir, 0))}</td>
                <td className="p-3 text-right text-gray-900">{formatCurr(metrics.monthlyTax.reduce((s: number, r: any) => s + r.vergi, 0))}</td>
                <td className="p-3 text-right text-gray-600">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Shared Components ───────────────────── */
function StatCard({ icon: Icon, label, value, color, bg }: { icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
