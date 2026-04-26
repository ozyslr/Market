interface Variant {
  id: string
  label: string
  size?: string | null
  color?: string | null
  price: number
  stock: number
}

interface VariantPickerProps {
  variants: Variant[]
  selectedId: string | null
  onSelect: (variant: Variant) => void
}

export function VariantPicker({ variants, selectedId, onSelect }: VariantPickerProps) {
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[]
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))] as string[]
  const hasSizes = sizes.length > 0
  const hasColors = colors.length > 0

  if (!hasSizes && !hasColors) {
    return (
      <div className="flex flex-wrap gap-2">
        {variants.map(v => (
          <button key={v.id} onClick={() => onSelect(v)} disabled={v.stock === 0}
            className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${selectedId === v.id ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-primary/20 hover:border-brand-primary'} ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {v.label}{v.stock === 0 ? ' (Tükendi)' : ''}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hasSizes && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-2">Beden</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => {
              const variant = variants.find(v => v.size === size)
              const isSelected = variant ? selectedId === variant.id : false
              return (
                <button key={size} onClick={() => variant && onSelect(variant)}
                  disabled={!variant || variant.stock === 0}
                  className={`w-12 h-12 rounded-xl border text-xs font-black transition-all ${isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-primary/20 hover:border-brand-primary'} ${!variant || variant.stock === 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}>
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {hasColors && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-2">Renk</p>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => {
              const variant = variants.find(v => v.color === color)
              const isSelected = variant ? selectedId === variant.id : false
              return (
                <button key={color} onClick={() => variant && onSelect(variant)}
                  disabled={!variant || variant.stock === 0}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-primary/20 hover:border-brand-primary'} ${!variant || variant.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  {color}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
