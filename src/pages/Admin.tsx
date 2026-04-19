import { useState, useEffect, useMemo } from 'react'
import { Users, Package, ShoppingBag, TrendingUp, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

type Tab = 'stats' | 'users' | 'products' | 'orders'

interface Stats {
  users: number; products: number; orders: number; revenue: number; pendingKyc: number; pendingProducts: number
}

interface AdminUser {
  id: string; name: string; email: string; role: string; kyc_status: string | null; country: string | null; created_at: string
}

interface AdminProduct {
  id: string; title: string; price: number; seller_id: string; moderation_status: string | null; created_at: string
}

interface AdminOrder {
  id: string; buyer_id: string; total: number; status: string; created_at: string
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const user = useAuthStore((s) => s.user)
  const { addToast } = useUIStore()

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' }),
    [user?.token]
  )

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers })
      if (res.ok) setStats(await res.json())
    } catch { addToast('Veri yüklenemedi', 'error') }
  }

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers })
      if (res.ok) setUsers(await res.json())
    } catch { addToast('Veri yüklenemedi', 'error') }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { headers })
      if (res.ok) setProducts(await res.json())
    } catch { addToast('Veri yüklenemedi', 'error') }
  }

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers })
      if (res.ok) setOrders(await res.json())
    } catch { addToast('Veri yüklenemedi', 'error') }
  }

  useEffect(() => {
    loadStats()
    if (tab === 'users') loadUsers()
    if (tab === 'products') loadProducts()
    if (tab === 'orders') loadOrders()
  }, [tab, headers])

  const updateUser = async (id: string, data: Record<string, string>) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers, body: JSON.stringify(data) })
      if (res.ok) { addToast('Güncellendi', 'success'); loadUsers() }
      else addToast('Hata', 'error')
    } catch { addToast('Hata', 'error') }
  }

  const updateProduct = async (id: string, moderation_status: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ moderation_status }) })
      if (res.ok) { addToast('Güncellendi', 'success'); loadProducts() }
      else addToast('Hata', 'error')
    } catch { addToast('Hata', 'error') }
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'stats', label: 'Dashboard', icon: <TrendingUp size={16} /> },
    { key: 'users', label: 'Kullanıcılar', icon: <Users size={16} /> },
    { key: 'products', label: 'Ürünler', icon: <Package size={16} /> },
    { key: 'orders', label: 'Siparişler', icon: <ShoppingBag size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-brand-secondary/20 pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary">Admin Panel</h1>
            <p className="text-xs text-brand-primary/40 font-bold uppercase tracking-widest">Mercora Platform Control</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-1.5 border border-brand-primary/5 shadow-sm w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                tab === t.key ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-primary/40 hover:text-brand-primary'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Kullanıcı', value: stats.users, icon: <Users size={20} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Ürün', value: stats.products, icon: <Package size={20} />, color: 'bg-purple-50 text-purple-600' },
              { label: 'Sipariş', value: stats.orders, icon: <ShoppingBag size={20} />, color: 'bg-green-50 text-green-600' },
              { label: 'Gelir (£)', value: `£${Number(stats.revenue).toFixed(0)}`, icon: <TrendingUp size={20} />, color: 'bg-accent/10 text-accent' },
              { label: 'KYC Bekl.', value: stats.pendingKyc, icon: <AlertCircle size={20} />, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Ürün Bekl.', value: stats.pendingProducts, icon: <AlertCircle size={20} />, color: 'bg-orange-50 text-orange-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-3xl p-6 border border-brand-primary/5 shadow-sm">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', s.color)}>
                  {s.icon}
                </div>
                <p className="text-2xl font-black text-brand-primary">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-3xl border border-brand-primary/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-primary/5">
                <tr>
                  {['Ad', 'E-posta', 'Rol', 'KYC', 'Tarih', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-bold">{u.name}</td>
                    <td className="px-6 py-4 text-brand-primary/60">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        className="text-xs font-black bg-brand-secondary/20 rounded-xl px-3 py-1.5 border-none outline-none cursor-pointer"
                      >
                        {['buyer', 'seller', 'admin'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        defaultValue={u.kyc_status ?? 'unverified'}
                        onChange={(e) => updateUser(u.id, { kyc_status: e.target.value })}
                        className="text-xs font-black bg-brand-secondary/20 rounded-xl px-3 py-1.5 border-none outline-none cursor-pointer"
                      >
                        {['unverified', 'pending', 'verified', 'rejected'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-brand-primary/40 text-xs">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'products' && (
          <div className="bg-white rounded-3xl border border-brand-primary/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-primary/5">
                <tr>
                  {['Ürün', 'Fiyat', 'Satıcı', 'Moderasyon', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-bold max-w-xs truncate">{p.title}</td>
                    <td className="px-6 py-4 font-black text-accent">£{p.price}</td>
                    <td className="px-6 py-4 text-brand-primary/60 text-xs">{p.seller_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <span className={cn('text-[10px] font-black uppercase px-3 py-1 rounded-full',
                        p.moderation_status === 'approved' ? 'bg-green-100 text-green-700' :
                        p.moderation_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {p.moderation_status ?? 'approved'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => updateProduct(p.id, 'approved')} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Onayla">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => updateProduct(p.id, 'rejected')} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reddet">
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders' && (
          <div className="bg-white rounded-3xl border border-brand-primary/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-primary/5">
                <tr>
                  {['Sipariş ID', 'Alıcı', 'Toplam', 'Durum', 'Tarih'].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-brand-primary/40">{o.id.slice(0, 12)}...</td>
                    <td className="px-6 py-4 text-xs text-brand-primary/60">{o.buyer_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-black text-accent">£{Number(o.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={cn('text-[10px] font-black uppercase px-3 py-1 rounded-full',
                        o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        o.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-primary/40">{new Date(o.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
