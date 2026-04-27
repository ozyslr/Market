import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Settings, TrendingUp, TrendingDown,
  Upload, FileText, CheckCircle2, ChevronRight,
  Sparkles, PoundSterling, Hash, ShoppingBag, Star, Wallet,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';

interface Analytics {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  topProducts: { id: string; title: string; revenue: number; qty: number; image: string | null }[]
  revenueByDay: { date: string; revenue: number }[]
}

interface SellerOrder {
  id: string
  status: string
  total: number
  created_at: string
  items: string
}

type Tab = 'overview' | 'bulk'

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  shipped: '#7C3AED',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  shipped: 'Kargoda',
  delivered: 'Teslim',
  cancelled: 'İptal',
}

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore(s => s.user?.token)
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch('/api/orders/seller/analytics', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/orders/seller', { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([analyticsData, ordersData]) => {
      if (analyticsData) setAnalytics(analyticsData)
      if (Array.isArray(ordersData)) setOrders(ordersData)
    }).finally(() => setLoading(false))
  }, [token])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 }
    for (const o of orders) {
      const s = o.status.toLowerCase()
      if (s in counts) counts[s]++
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: STATUS_LABELS[k] ?? k, value: v, color: STATUS_COLORS[k] ?? '#999' }))
  }, [orders])

  const recentOrders = orders.slice(0, 5)

  const simulateUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)
    const iv = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(() => setIsUploading(false), 1000); return 100 }
        return p + 5
      })
    }, 100)
  }

  const kpis = [
    {
      icon: <PoundSterling size={20} />,
      label: 'Toplam Satış',
      value: analytics ? `£${analytics.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '—',
      trend: '+12%',
      up: true,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      icon: <ShoppingBag size={20} />,
      label: 'Bu Ay Sipariş',
      value: analytics ? analytics.totalOrders.toString() : '—',
      trend: '+8%',
      up: true,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      icon: <Star size={20} />,
      label: 'Mağaza Puanı',
      value: '4.8',
      trend: '+0.2',
      up: true,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      icon: <Wallet size={20} />,
      label: 'Cüzdan Bakiyesi',
      value: '£0.00',
      trend: '',
      up: true,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
  ]

  const navItems = [
    { id: 'overview' as Tab, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'bulk' as Tab, icon: <Upload size={18} />, label: 'Toplu Yükleme' },
  ]

  const linkItems = [
    { to: '/seller/inventory', icon: <Package size={18} />, label: 'Ürünlerim' },
    { to: '/seller/orders', icon: <ShoppingCart size={18} />, label: 'Siparişler' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 pt-20">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 hidden lg:flex flex-col py-6 px-3 sticky top-20 h-[calc(100vh-80px)]">
        <div className="flex items-center gap-3 mb-8 px-3">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs truncate text-gray-800">{user?.name ?? 'Satıcı'}</p>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Satıcı Paneli</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          {linkItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-50 transition-all">
            <Settings size={18} /> Ayarlar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Satıcı Paneli</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Hoş geldiniz, {user?.name}</p>
                  </div>
                  <button className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-sm">
                    Para Çek
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpis.map((kpi, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                          {kpi.icon}
                        </div>
                        {kpi.trend && (
                          <span className={`text-xs font-bold flex items-center gap-0.5 ${kpi.up ? 'text-green-500' : 'text-red-400'}`}>
                            {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {kpi.trend}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium mb-1">{kpi.label}</p>
                      <p className="text-xl font-bold text-gray-800">
                        {loading ? <span className="inline-block w-16 h-5 bg-gray-100 rounded animate-pulse" /> : kpi.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Middle row: donut + recent orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Order status donut */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-4">Sipariş Durumu</h2>
                    {statusCounts.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={statusCounts} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                              {statusCounts.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number, name: string) => [v, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-3">
                          {statusCounts.map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                                <span className="text-gray-500">{s.name}</span>
                              </div>
                              <span className="font-bold text-gray-700">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
                        {loading ? <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> : 'Sipariş yok'}
                      </div>
                    )}
                  </div>

                  {/* Recent orders */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-bold text-gray-700">Son Siparişler</h2>
                      <Link to="/seller/orders" className="text-xs text-purple-600 font-bold hover:underline">Tümünü Gör</Link>
                    </div>
                    {loading ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                      </div>
                    ) : recentOrders.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sipariş yok</div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-widest text-gray-400 bg-gray-50">
                            <th className="px-5 py-3 font-semibold">Sipariş No</th>
                            <th className="px-5 py-3 font-semibold">Tutar</th>
                            <th className="px-5 py-3 font-semibold">Durum</th>
                            <th className="px-5 py-3 font-semibold">Tarih</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                          {recentOrders.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 font-mono text-xs text-gray-500">{o.id.slice(0, 8).toUpperCase()}</td>
                              <td className="px-5 py-3 font-bold text-gray-800">£{o.total.toFixed(2)}</td>
                              <td className="px-5 py-3">
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                  style={{
                                    background: (STATUS_COLORS[o.status.toLowerCase()] ?? '#999') + '20',
                                    color: STATUS_COLORS[o.status.toLowerCase()] ?? '#999',
                                  }}
                                >
                                  {STATUS_LABELS[o.status.toLowerCase()] ?? o.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-400">{o.created_at?.slice(0, 10) ?? ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Bottom row: top products + revenue chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top products */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-bold text-gray-700">En Çok Satan Ürünler</h2>
                    </div>
                    {!analytics || analytics.topProducts.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
                        {loading ? <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> : 'Veri yok'}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {analytics.topProducts.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                            <span className="text-sm font-black text-gray-200 w-4 shrink-0">#{i + 1}</span>
                            <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                              {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700 truncate">{p.title}</p>
                              <p className="text-[10px] text-gray-400">{p.qty} adet</p>
                            </div>
                            <span className="text-sm font-bold text-purple-600">£{p.revenue.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revenue chart */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-4">Satış Grafiği</h2>
                    {analytics && analytics.revenueByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={analytics.revenueByDay}>
                          <defs>
                            <linearGradient id="sellerRevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `£${v}`} />
                          <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, 'Gelir']} />
                          <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#sellerRevGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
                        {loading ? <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> : 'Henüz satış verisi yok'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Toplu Ürün Yükleme</h1>
                    <p className="text-sm text-gray-400">CSV dosyası ile yüzlerce ürünü aynı anda ekleyin.</p>
                  </div>
                  <button className="px-5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all text-gray-600">
                    <FileText size={16} /> Şablonu İndir
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white rounded-2xl p-10 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center min-h-72">
                    {isUploading ? (
                      <div className="w-full max-w-sm space-y-4">
                        <div className="flex justify-between">
                          <p className="text-xs font-semibold text-gray-500">Spring_Collection.csv yükleniyor...</p>
                          <p className="text-sm font-bold text-purple-600">{uploadProgress}%</p>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-purple-600" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 animate-pulse">AI otomatik kategorilendirme ve vergi eşleştirme yapılıyor...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
                          <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">CSV Dosyası Sürükle & Bırak</h3>
                        <p className="text-sm text-gray-400 max-w-xs mb-6">Shopify, Trendyol, Hepsiburada veya WooCommerce'den CSV yükleyin. AI alanları otomatik eşleştirir.</p>
                        <button
                          onClick={simulateUpload}
                          className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-sm"
                        >
                          Dosya Seç
                        </button>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-purple-600 rounded-2xl p-6 text-white">
                      <h4 className="flex items-center gap-2 font-bold text-sm mb-3">
                        <Sparkles size={16} /> AI Eşleştirme Aktif
                      </h4>
                      <ul className="space-y-2">
                        {['Otomatik Çeviri', 'HS-Kodu Etiketleme', 'KDV Hesaplama', 'Döviz Dönüşümü'].map(item => (
                          <li key={item} className="flex items-center gap-2 text-[11px] font-medium text-purple-100">
                            <CheckCircle2 size={12} className="text-purple-200 shrink-0" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Marketplace Entegrasyonu</h4>
                      <div className="space-y-2">
                        {['Shopify', 'Trendyol', 'Amazon GTIN'].map(m => (
                          <div key={m} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group cursor-pointer hover:border-purple-200 transition-all">
                            <span className="text-xs font-semibold text-gray-500">{m} Bağlantısı</span>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-purple-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-700">Son Yüklemeler</h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { date: '18 Nis 2026', files: '142 Ürün', status: 'Tamamlandı', error: 0 },
                      { date: '15 Nis 2026', files: '89 Ürün', status: 'Tamamlandı', error: 2 },
                    ].map((batch, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">{batch.files}</p>
                            <p className="text-xs text-gray-400">{batch.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-green-500">{batch.status}</span>
                          {batch.error > 0 && <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">{batch.error} Hata</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
