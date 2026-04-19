import { Link } from 'react-router-dom'
import { X, Star, ShoppingBag, GitCompare } from 'lucide-react'
import { useCompareStore } from '@/store/compareStore'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'

const ROWS = [
  { label: 'Fiyat', key: 'price', render: (v: any) => `£${Number(v).toFixed(2)}` },
  { label: 'Marka', key: 'brand', render: (v: any) => v || '—' },
  { label: 'Kategori', key: 'categoryId', render: (v: any) => v || '—' },
  { label: 'Menşei', key: 'originCountry', render: (v: any) => v || '—' },
  { label: 'Stok', key: 'stock', render: (v: any) => `${v} adet` },
  { label: 'Puan', key: 'rating', render: (v: any) => `${Number(v).toFixed(1)} / 5` },
  { label: 'Değerlendirme', key: 'reviewsCount', render: (v: any) => `${v} yorum` },
]

export default function ComparePage() {
  const { products, remove, clear } = useCompareStore()
  const addItem = useCartStore(s => s.addItem)
  const { addToast } = useUIStore()

  if (products.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <GitCompare size={48} className="text-brand-primary/20" />
      <h2 className="text-2xl font-black text-brand-primary/40">Karşılaştırılacak ürün yok</h2>
      <Link to="/" className="px-8 py-3 bg-accent text-white rounded-2xl font-black text-sm">Ürünlere Göz At</Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <GitCompare size={28} className="text-accent" />
          <h1 className="text-3xl font-black">Ürün Karşılaştırma</h1>
        </div>
        <button onClick={clear} className="text-sm font-bold text-brand-primary/40 hover:text-red-500 transition-colors">
          Listeyi Temizle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <td className="w-40 pr-6" />
              {products.map(p => (
                <th key={p.id} className="text-left pb-6 pr-6 align-top">
                  <div className="bg-white rounded-3xl border border-brand-primary/5 p-4 space-y-3 relative">
                    <button
                      onClick={() => remove(p.id)}
                      className="absolute top-3 right-3 p-1 rounded-full hover:bg-red-50 text-brand-primary/30 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <Link to={`/product/${p.slug}`}>
                      <img src={p.images[0]} alt={p.title} className="w-full aspect-square object-cover rounded-2xl" />
                    </Link>
                    <Link to={`/product/${p.slug}`} className="block text-sm font-bold hover:text-accent transition-colors line-clamp-2">{p.title}</Link>
                    <div className="flex items-center gap-1 text-xs text-brand-primary/40">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span>{p.rating.toFixed(1)}</span>
                    </div>
                    <button
                      onClick={() => {
                        addItem({ productId: p.id, title: p.title, price: p.price, quantity: 1, image: p.images[0] ?? '', sellerId: p.sellerId })
                        addToast('Sepete eklendi', 'success')
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-accent text-white rounded-xl text-xs font-black hover:bg-brand-primary transition-colors"
                    >
                      <ShoppingBag size={12} /> Sepete Ekle
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.key} className="border-t border-brand-primary/5">
                <td className="py-4 pr-6 text-xs font-black uppercase tracking-widest text-brand-primary/40">{row.label}</td>
                {products.map(p => {
                  const val = row.render((p as any)[row.key])
                  const vals = products.map(x => row.render((x as any)[row.key]))
                  const isBest = row.key === 'price'
                    ? val === vals.reduce((a, b) => a < b ? a : b)
                    : row.key === 'rating' || row.key === 'reviewsCount'
                    ? val === vals.reduce((a, b) => a > b ? a : b)
                    : false
                  return (
                    <td key={p.id} className="py-4 pr-6 text-sm font-bold">
                      <span className={isBest ? 'text-green-600 font-black' : ''}>{val}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
