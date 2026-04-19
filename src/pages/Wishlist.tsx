import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useUIStore } from '@/store/uiStore'
import { useCartStore } from '@/store/cartStore'
import { normalizeProduct } from '@/lib/apiProduct'
import type { Product } from '@/types'

export default function WishlistPage() {
  const user = useAuthStore(s => s.user)
  const { toggle, fetchIds } = useWishlistStore()
  const { addToast } = useUIStore()
  const addItem = useCartStore(s => s.addItem)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch('/api/wishlist', { headers: { Authorization: `Bearer ${user.token}` } })
      if (res.ok) {
        const { products: rows } = await res.json()
        setProducts(rows.map(normalizeProduct))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Heart size={48} className="text-brand-primary/20" />
      <h2 className="text-2xl font-black">Favorilerinizi görmek için giriş yapın</h2>
      <Link to="/login" className="px-8 py-3 bg-accent text-white rounded-2xl font-black text-sm">Giriş Yap</Link>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={28} className="text-accent fill-accent" />
        <h1 className="text-3xl font-black">Favorilerim</h1>
        <span className="ml-2 text-brand-primary/40 text-lg font-bold">({products.length})</span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={64} className="mx-auto text-brand-primary/10 mb-6" />
          <h3 className="text-xl font-black text-brand-primary/30">Henüz favori ürün yok</h3>
          <Link to="/" className="mt-6 inline-block px-8 py-3 bg-accent text-white rounded-2xl font-black text-sm">Alışverişe Başla</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-3xl border border-brand-primary/5 overflow-hidden group hover:shadow-xl transition-all">
              <Link to={`/product/${p.slug}`} className="block relative aspect-square overflow-hidden bg-brand-secondary/20">
                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="p-4 space-y-3">
                <Link to={`/product/${p.slug}`}>
                  <h3 className="text-sm font-bold line-clamp-2 hover:text-accent transition-colors">{p.title}</h3>
                </Link>
                <p className="text-lg font-black text-accent">£{p.price.toFixed(2)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addItem({ productId: p.id, title: p.title, price: p.price, quantity: 1, image: p.images[0] ?? '', sellerId: p.sellerId })
                      addToast('Sepete eklendi', 'success')
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent text-white rounded-xl text-xs font-black hover:bg-brand-primary transition-colors"
                  >
                    <ShoppingBag size={14} /> Sepete Ekle
                  </button>
                  <button
                    onClick={async () => {
                      await toggle(p.id, user.token, addToast)
                      await fetchIds(user.token)
                      load()
                    }}
                    className="p-2.5 rounded-xl border border-brand-primary/10 text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
