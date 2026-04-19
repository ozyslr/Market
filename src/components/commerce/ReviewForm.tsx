import { useState } from 'react'
import { Star } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

interface Props {
  productId: string
  onSuccess: () => void
}

export function ReviewForm({ productId, onSuccess }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const { addToast } = useUIStore()

  if (!user) return (
    <p className="text-sm text-brand-primary/40 text-center py-4">
      Yorum yapmak için <a href="/login" className="text-accent font-bold">giriş yapın</a>.
    </p>
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) { addToast('Lütfen puan verin', 'error'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addToast('Yorumunuz eklendi', 'success')
      setRating(0); setComment('')
      onSuccess()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Hata oluştu', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 bg-brand-secondary/20 rounded-3xl p-6">
      <h4 className="text-sm font-black uppercase tracking-widest text-brand-primary">Değerlendirin</h4>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              size={28}
              className="transition-colors"
              fill={(hovered || rating) >= s ? '#f59e0b' : 'none'}
              color={(hovered || rating) >= s ? '#f59e0b' : '#cbd5e1'}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Deneyiminizi paylaşın (isteğe bağlı)"
        rows={3}
        className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm resize-none outline-none focus:border-accent transition-colors"
      />
      <button
        type="submit"
        disabled={loading || !rating}
        className="px-6 py-2.5 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:bg-accent transition-colors"
      >
        {loading ? 'Gönderiliyor...' : 'Yorum Gönder'}
      </button>
    </form>
  )
}
