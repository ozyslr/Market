import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

interface Props {
  productId: string
  className?: string
}

export function WishlistHeart({ productId, className }: Props) {
  const token = useAuthStore(s => s.user?.token)
  const { toggle, isWished } = useWishlistStore()
  const { addToast } = useUIStore()
  const wished = isWished(productId)

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId, token, addToast) }}
      className={cn(
        'p-2 rounded-full transition-all',
        wished ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-brand-primary/30 hover:text-red-500 hover:bg-red-50',
        className
      )}
      title={wished ? 'Favorilerden kaldır' : 'Favorilere ekle'}
    >
      <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
    </button>
  )
}
