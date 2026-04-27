import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import {
  Users, Package, ShoppingBag, AlertTriangle,
  Search, Trash2, Ban, CheckCircle, XCircle,
  RefreshCw, BarChart2, LogOut, Filter,
  UserCheck, ShieldAlert, DollarSign, Store,
  TrendingUp, TrendingDown, Zap
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type Tab = 'overview' | 'users' | 'products' | 'orders' | 'sellers' | 'disputes'

interface Stats {
  users: number; products: number; orders: number; revenue: number
  pendingKyc: number; pendingProducts: number; sellers: number; buyers: number
  revenueChart: { date: string; rev: number }[]
}
interface AdminUser { id: string; name: string; email: string; role: string; kyc_status: string; banned: number; created_at: string }
interface Product { id: string; title: string; price: number; seller_name: string; moderation_status: string; created_at: string; images: string }
interface Order { id: string; buyer_id: string; total: number; status: string; created_at: string; items: { title: string; quantity: number }[] }
interface AdminSeller { id: string; store_name: string; slug: string; owner_name: string; owner_email: string; status: string; commission_rate: number; rating: number; product_count: number; order_count: number; total_revenue: number; created_at: string }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  verified: 'bg-green-100 text-green-700',
  unverified: 'bg-gray-100 text-gray-600',
}

const SIDEBAR_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart2 },
  { id: 'orders', label: 'Siparişler', icon: ShoppingBag },
  { id: 'products', label: 'Ürünler', icon: Package },
  { id: 'sellers', label: 'Satıcılar', icon: Store },
  { id: 'users', label: 'Kullanıcılar', icon: Users },
  { id: 'disputes', label: 'Anlaşmazlıklar', icon: AlertTriangle },
]

const COUNTRY_DATA = [
  { name: 'Türkiye', value: 176, color: '#7C3AED' },
  { name: 'Almanya', value: 92, color: '#A855F7' },
  { name: 'Fransa', value: 54, color: '#C084FC' },
  { name: 'Diğer', value: 38, color: '#E9D5FF' },
]

export function AdminPanel() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { addToast } = useUIStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { if (!user || user.role !== 'admin') navigate('/login') }, [user, navigate])

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` }

  const fetchStats = useCallback(async () => {
    const r = await fetch('/api/admin/stats', { headers: authHeaders })
    if (r.ok) setStats(await r.json())
  }, [user?.token])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (roleFilter) params.set('role', roleFilter)
    const r = await fetch(`/api/admin/users?${params}`, { headers: authHeaders })
    if (r.ok) { const d = await r.json(); setUsers(d.users ?? d) }
    setLoading(false)
  }, [search, roleFilter, user?.token])

  const fetchSellers = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/sellers', { headers: authHeaders })
    if (r.ok) setSellers(await r.json())
    setLoading(false)
  }, [user?.token])

  const patchSeller = async (id: string, body: object) => {
    await fetch(`/api/admin/sellers/${id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify(body) })
    addToast('Satıcı güncellendi', 'success')
    fetchSellers()
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter) params.set('status', statusFilter)
    const r = await fetch(`/api/admin/products?${params}`, { headers: authHeaders })
    if (r.ok) setProducts(await r.json())
    setLoading(false)
  }, [search, statusFilter, user?.token])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter) params.set('status', statusFilter)
    const r = await fetch(`/api/admin/orders?${params}`, { headers: authHeaders })
    if (r.ok) setOrders(await r.json())
    setLoading(false)
  }, [search, statusFilter, user?.token])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => {
    setSearch(''); setStatusFilter(''); setRoleFilter('')
    if (tab === 'overview') { fetchOrders(); fetchProducts() }
    if (tab === 'users') fetchUsers()
    if (tab === 'sellers') fetchSellers()
    if (tab === 'products') fetchProducts()
    if (tab === 'orders') fetchOrders()
  }, [tab])

  const patchUser = async (id: string, body: object) => {
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify(body) })
    addToast('Güncellendi', 'success')
    tab === 'sellers' ? fetchSellers() : fetchUsers()
  }

  const deleteUser = async (id: string) => {
    const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: authHeaders })
    if (r.ok) { addToast('Kullanıcı silindi', 'success'); tab === 'sellers' ? fetchSellers() : fetchUsers() }
    else { const d = await r.json(); addToast(d.error, 'error') }
    setConfirmDelete(null)
  }

  const patchProduct = async (id: string, moderation_status: string) => {
    await fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ moderation_status }) })
    addToast('Ürün güncellendi', 'success'); fetchProducts()
  }

  const deleteProduct = async (id: string) => {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: authHeaders })
    addToast('Ürün silindi', 'success'); fetchProducts(); setConfirmDelete(null)
  }

  const patchOrderStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}/status`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }) })
    addToast('Sipariş güncellendi', 'success'); fetchOrders()
  }

  const totalCountry = COUNTRY_DATA.reduce((s, d) => s + d.value, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-[#1E1B4B] text-white flex flex-col shrink-0 fixed left-0 top-0 h-full z-40">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 bg-purple-500 rounded-lg flex items-center justify-center">
              <Zap size={13} fill="currentColor" />
            </div>
            <span className="font-black text-sm uppercase tracking-tight">Mercora</span>
          </div>
          <span className="text-[9px] text-purple-300/60 font-black uppercase tracking-widest">Admin Panel</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}>
              <item.icon size={16} />
              {item.label}
              {item.id === 'users' && !!stats?.pendingKyc && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{stats.pendingKyc}</span>
              )}
              {item.id === 'products' && !!stats?.pendingProducts && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{stats.pendingProducts}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-black text-white/70 truncate">{user?.name}</p>
            <p className="text-[9px] text-white/30 truncate">{user?.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 text-sm font-bold transition-all">
            <LogOut size={16} /> Çıkış
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-52 flex-1 p-6 min-h-screen">

        {/* ─── OVERVIEW ─── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-gray-900">Yönetici Paneli</h1>
                <p className="text-xs text-gray-400">Platform genel durumu</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xs font-black">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{user?.name}</span>
              </div>
            </div>

            {/* KPI Row */}
            {stats && (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Toplam Satış', value: `£${stats.revenue.toLocaleString()}`, change: '+10.5%', up: true, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Sipariş Sayısı', value: stats.orders.toLocaleString(), change: '+16.3%', up: true, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Toplam Satıcı', value: stats.sellers.toLocaleString(), change: '+6.5%', up: true, icon: Store, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Toplam Kullanıcı', value: stats.users.toLocaleString(), change: '+13.2%', up: true, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                        <card.icon size={16} />
                      </div>
                      <span className={`text-[10px] font-black flex items-center gap-0.5 ${card.up ? 'text-green-500' : 'text-red-500'}`}>
                        {card.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {card.change}
                      </span>
                    </div>
                    <div className="text-xl font-black text-gray-900">{card.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Chart + Recent Orders */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-900 text-sm">Satış Grafiği</h3>
                  <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                    {['Günlük', 'Haftalık', 'Aylık'].map((t, i) => (
                      <span key={t} className={`px-2.5 py-1 text-[10px] font-black rounded-md cursor-default ${i === 0 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>{t}</span>
                    ))}
                  </div>
                </div>
                {stats && stats.revenueChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={190}>
                    <AreaChart data={stats.revenueChart}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => [`£${v}`, 'Gelir']} />
                      <Area type="monotone" dataKey="rev" stroke="#7C3AED" fill="url(#revGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[190px] flex items-center justify-center text-gray-200 text-sm">Henüz sipariş yok</div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-gray-900 text-sm">Son Siparişler</h3>
                  <button onClick={() => setTab('orders')} className="text-[10px] text-purple-600 font-black hover:underline">Tümü →</button>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {orders.slice(0, 7).map(o => (
                    <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-[10px] font-bold text-gray-700">#{o.id.slice(0, 8)}</p>
                        <p className="text-[9px] text-gray-300">{o.created_at.slice(0, 10)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-gray-900">£{o.total.toFixed(0)}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-xs text-gray-200 text-center pt-8">Sipariş yok</p>}
                </div>
              </div>
            </div>

            {/* Top Products + Country Pie */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-sm mb-4">En Fazla Satan Ürünler</h3>
                <div className="space-y-3">
                  {products.slice(0, 5).map((p, i) => {
                    let img = ''
                    try { img = JSON.parse(p.images)?.[0] ?? '' } catch {}
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-200 w-4">{i + 1}.</span>
                        {img ? <img src={img} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" /> : <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{p.title}</p>
                          <p className="text-[9px] text-gray-400">{p.seller_name || '—'}</p>
                        </div>
                        <span className="text-xs font-black text-gray-700 shrink-0">£{p.price}</span>
                      </div>
                    )
                  })}
                  {products.length === 0 && <p className="text-xs text-gray-200 text-center py-4">Ürün yok</p>}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-sm mb-3">Ülkelere Göre Satış</h3>
                <div className="flex justify-center mb-2">
                  <PieChart width={130} height={130}>
                    <Pie data={COUNTRY_DATA} cx={60} cy={60} innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={3}>
                      {COUNTRY_DATA.map((_, idx) => <Cell key={idx} fill={COUNTRY_DATA[idx].color} />)}
                    </Pie>
                  </PieChart>
                </div>
                <div className="space-y-1.5">
                  {COUNTRY_DATA.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[10px] font-bold text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-700">{Math.round(d.value / totalCountry * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Alerts */}
            {stats && (stats.pendingKyc > 0 || stats.pendingProducts > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {(stats.pendingKyc > 0) && (
                  <button onClick={() => setTab('users')}
                    className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-500"><UserCheck size={18} /></div>
                      <span className="text-sm font-bold text-gray-700">KYC Onay Bekleyen</span>
                    </div>
                    <span className="text-2xl font-black text-gray-900">{stats.pendingKyc}</span>
                  </button>
                )}
                {(stats.pendingProducts > 0) && (
                  <button onClick={() => setTab('products')}
                    className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50 text-purple-500"><ShieldAlert size={18} /></div>
                      <span className="text-sm font-bold text-gray-700">Ürün Onay Bekleyen</span>
                    </div>
                    <span className="text-2xl font-black text-gray-900">{stats.pendingProducts}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── SELLERS ─── */}
        {tab === 'sellers' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-gray-900">Satıcı Yönetimi</h1>
                <p className="text-xs text-gray-400">{sellers.length} mağaza kayıtlı</p>
              </div>
              <button onClick={fetchSellers} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">
                <RefreshCw size={14} /> Yenile
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Mağaza', 'Sahip', 'Ürün / Sipariş', 'GMV', 'Kom.', 'Durum', 'İşlemler'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading
                    ? <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Yükleniyor...</td></tr>
                    : sellers.length === 0
                      ? <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Henüz mağaza yok</td></tr>
                      : sellers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-sm text-gray-900">{s.store_name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">/{s.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-gray-700">{s.owner_name}</p>
                        <p className="text-[10px] text-gray-400">{s.owner_email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-bold">{s.product_count} / {s.order_count}</td>
                      <td className="px-4 py-3 text-xs font-black text-gray-900">£{Number(s.total_revenue).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">%{Math.round(s.commission_rate * 100)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                          s.status === 'active' ? 'bg-green-100 text-green-700' :
                          s.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {s.status !== 'active' && (
                            <button onClick={() => patchSeller(s.id, { status: 'active' })}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-lg transition-colors">
                              Onayla
                            </button>
                          )}
                          {s.status !== 'suspended' && (
                            <button onClick={() => patchSeller(s.id, { status: 'suspended' })}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black uppercase rounded-lg transition-colors">
                              Askıya Al
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── USERS ─── */}
        {tab === 'users' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-gray-900">Kullanıcı Yönetimi</h1>
                <p className="text-xs text-gray-400">{users.length} kullanıcı</p>
              </div>
              <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">
                <RefreshCw size={14} /> Yenile
              </button>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                  placeholder="İsim veya e-posta ara..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setTimeout(fetchUsers, 50) }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-white focus:outline-none">
                <option value="">Tüm Roller</option>
                <option value="buyer">Alıcı</option>
                <option value="seller">Satıcı</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={fetchUsers} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2">
                <Filter size={14} /> Filtrele
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Kullanıcı', 'Rol', 'KYC', 'Durum', 'Kayıt', 'İşlemler'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Yükleniyor...</td></tr>
                  : users.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Kullanıcı bulunamadı</td></tr>
                  : users.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.banned ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-bold text-sm text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select value={u.role} onChange={e => patchUser(u.id, { role: e.target.value })}
                          className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                          <option value="buyer">Alıcı</option>
                          <option value="seller">Satıcı</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select value={u.kyc_status} onChange={e => patchUser(u.id, { kyc_status: e.target.value })}
                          className={`text-xs font-bold border rounded-lg px-2 py-1 focus:outline-none ${STATUS_COLORS[u.kyc_status] || 'bg-gray-100'}`}>
                          <option value="unverified">Doğrulanmamış</option>
                          <option value="pending">Bekliyor</option>
                          <option value="verified">Doğrulandı</option>
                          <option value="rejected">Reddedildi</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${u.banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {u.banned ? 'Banlı' : 'Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{u.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => patchUser(u.id, { banned: !u.banned })} title={u.banned ? 'Banı Kaldır' : 'Banla'} className="p-1.5 rounded-lg hover:bg-gray-100">
                            <Ban size={14} className={u.banned ? 'text-green-500' : 'text-orange-500'} />
                          </button>
                          <button onClick={() => setConfirmDelete(`user:${u.id}`)} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── PRODUCTS ─── */}
        {tab === 'products' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-gray-900">Ürün Moderasyonu</h1>
                <p className="text-xs text-gray-400">{products.length} ürün</p>
              </div>
              <button onClick={fetchProducts} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">
                <RefreshCw size={14} /> Yenile
              </button>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts()}
                  placeholder="Ürün adı ara..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTimeout(fetchProducts, 50) }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-white focus:outline-none">
                <option value="">Tüm Durumlar</option>
                <option value="pending">Bekliyor</option>
                <option value="approved">Onaylandı</option>
                <option value="rejected">Reddedildi</option>
              </select>
              <button onClick={fetchProducts} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2">
                <Filter size={14} /> Filtrele
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Ürün', 'Satıcı', 'Fiyat', 'Durum', 'Tarih', 'İşlemler'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Yükleniyor...</td></tr>
                  : products.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Ürün bulunamadı</td></tr>
                  : products.map(p => {
                    let img = ''
                    try { img = JSON.parse(p.images)?.[0] ?? '' } catch {}
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {img ? <img src={img} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" /> : <div className="w-9 h-9 bg-gray-100 rounded-lg shrink-0" />}
                            <div className="font-bold text-sm text-gray-900 max-w-[180px] truncate">{p.title}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.seller_name || '—'}</td>
                        <td className="px-4 py-3 text-sm font-black text-gray-900">£{p.price}</td>
                        <td className="px-4 py-3">
                          <select value={p.moderation_status} onChange={e => patchProduct(p.id, e.target.value)}
                            className={`text-xs font-bold border rounded-lg px-2 py-1 focus:outline-none ${STATUS_COLORS[p.moderation_status] || 'bg-gray-100'}`}>
                            <option value="pending">Bekliyor</option>
                            <option value="approved">Onaylandı</option>
                            <option value="rejected">Reddedildi</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{p.created_at.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => patchProduct(p.id, 'approved')} title="Onayla" className="p-1.5 rounded-lg hover:bg-green-50"><CheckCircle size={14} className="text-green-500" /></button>
                            <button onClick={() => patchProduct(p.id, 'rejected')} title="Reddet" className="p-1.5 rounded-lg hover:bg-red-50"><XCircle size={14} className="text-red-500" /></button>
                            <button onClick={() => setConfirmDelete(`product:${p.id}`)} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── ORDERS ─── */}
        {tab === 'orders' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-gray-900">Sipariş Yönetimi</h1>
                <p className="text-xs text-gray-400">{orders.length} sipariş</p>
              </div>
              <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">
                <RefreshCw size={14} /> Yenile
              </button>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchOrders()}
                  placeholder="Sipariş ID veya alıcı ara..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTimeout(fetchOrders, 50) }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-white focus:outline-none">
                <option value="">Tüm Durumlar</option>
                <option value="pending">Bekliyor</option>
                <option value="processing">İşleniyor</option>
                <option value="shipped">Kargoda</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="cancelled">İptal</option>
              </select>
              <button onClick={fetchOrders} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2">
                <Filter size={14} /> Filtrele
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Sipariş ID', 'Alıcı', 'Ürünler', 'Tutar', 'Durum', 'Tarih', 'Güncelle'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Yükleniyor...</td></tr>
                  : orders.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Sipariş bulunamadı</td></tr>
                  : orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{o.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[120px] truncate">{o.buyer_id.replace('guest:', '👤 ')}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">
                        {Array.isArray(o.items) ? o.items.slice(0, 2).map(i => `${i.title} x${i.quantity}`).join(', ') : '—'}
                        {Array.isArray(o.items) && o.items.length > 2 && ` +${o.items.length - 2}`}
                      </td>
                      <td className="px-4 py-3 text-sm font-black text-gray-900">£{o.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{o.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={e => patchOrderStatus(o.id, e.target.value)}
                          className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                          <option value="pending">Bekliyor</option>
                          <option value="processing">İşleniyor</option>
                          <option value="shipped">Kargoda</option>
                          <option value="delivered">Teslim</option>
                          <option value="cancelled">İptal</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── DISPUTES ─── */}
        {tab === 'disputes' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-lg font-black text-gray-900">Anlaşmazlık Merkezi</h1>
              <p className="text-xs text-gray-400">Alıcı-satıcı anlaşmazlıklarını yönetin</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-orange-400" />
              </div>
              <h3 className="text-base font-black text-gray-700 mb-2">Aktif Anlaşmazlık Yok</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">Alıcı veya satıcıdan gelen anlaşmazlık talepleri burada yönetilebilecek.</p>
            </div>
          </div>
        )}

      </main>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2">Silmek istediğinizden emin misiniz?</h3>
            <p className="text-sm text-gray-500 mb-6">Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">İptal</button>
              <button
                onClick={() => {
                  if (confirmDelete.startsWith('user:')) deleteUser(confirmDelete.replace('user:', ''))
                  else if (confirmDelete.startsWith('product:')) deleteProduct(confirmDelete.replace('product:', ''))
                }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600">
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
