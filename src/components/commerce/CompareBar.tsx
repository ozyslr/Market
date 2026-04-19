import { useNavigate } from 'react-router-dom'
import { X, GitCompare } from 'lucide-react'
import { useCompareStore } from '@/store/compareStore'
import { motion, AnimatePresence } from 'motion/react'

export function CompareBar() {
  const { products, remove, clear } = useCompareStore()
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {products.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-primary text-white rounded-3xl shadow-2xl px-6 py-4 flex items-center gap-4"
        >
          <div className="flex items-center gap-3">
            {products.map(p => (
              <div key={p.id} className="relative group">
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white/20"
                />
                <button
                  onClick={() => remove(p.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
            {Array.from({ length: 4 - products.length }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-xl border-2 border-dashed border-white/20" />
            ))}
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-white/60">{products.length}/4 ürün</span>
            <button
              onClick={() => navigate('/compare')}
              disabled={products.length < 2}
              className="flex items-center gap-2 px-4 py-2 bg-accent rounded-xl text-xs font-black disabled:opacity-40 hover:bg-white hover:text-brand-primary transition-all"
            >
              <GitCompare size={14} /> Karşılaştır
            </button>
            <button onClick={clear} className="text-white/40 hover:text-white text-xs font-bold transition-colors">
              Temizle
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
