import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface OrderItem { productId: string; title: string; price: number; quantity: number; image?: string }
interface Order { id: string; total: number; status: string; created_at: string; items: string; address?: string }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function OrdersPage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch('/api/orders/my', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="text-accent" size={28} />
        <h1 className="text-3xl font-black uppercase tracking-tight text-brand-primary">Siparişlerim</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto mb-4 text-brand-primary/20" />
          <p className="text-brand-primary/40 font-black uppercase tracking-widest text-sm">Henüz sipariş yok</p>
          <Link to="/" className="mt-6 inline-block px-8 py-3 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const items: OrderItem[] = (() => { try { return JSON.parse(order.items) } catch { return [] } })()
            return (
              <div key={order.id} className="bg-white border border-brand-primary/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Sipariş No</p>
                    <p className="font-mono text-xs text-brand-primary/60">{order.id.slice(0, 12)}…</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Tarih</p>
                    <p className="text-xs text-brand-primary/60">{new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <p className="text-lg font-black text-brand-primary">£{order.total.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-xl border border-brand-primary/10" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.productId}`} className="text-sm font-bold text-brand-primary hover:text-accent truncate block">
                          {item.title}
                        </Link>
                        <p className="text-xs text-brand-primary/40">{item.quantity} adet × £{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
