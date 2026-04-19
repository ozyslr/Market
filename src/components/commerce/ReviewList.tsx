import { Star, User } from 'lucide-react'

interface Review {
  id: string
  user_name: string
  rating: number
  comment: string | null
  created_at: string
}

interface Props { reviews: Review[] }

export function ReviewList({ reviews }: Props) {
  if (!reviews.length) return (
    <p className="text-sm text-brand-primary/30 text-center py-8 italic">
      Henüz yorum yok — ilk yorumu siz yapın.
    </p>
  )

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="bg-white rounded-3xl p-6 border border-brand-primary/5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-secondary flex items-center justify-center">
                <User size={16} className="text-brand-primary/40" />
              </div>
              <div>
                <p className="text-sm font-black text-brand-primary">{r.user_name}</p>
                <p className="text-[10px] text-brand-primary/30">
                  {new Date(r.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={r.rating >= s ? '#f59e0b' : 'none'}
                  color={r.rating >= s ? '#f59e0b' : '#cbd5e1'}
                />
              ))}
            </div>
          </div>
          {r.comment && <p className="text-sm text-brand-primary/70 leading-relaxed">{r.comment}</p>}
        </div>
      ))}
    </div>
  )
}
