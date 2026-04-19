import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const token = useAuthStore((s) => s.user?.token)
  const { addToast } = useUIStore()

  const handleFile = async (file: File) => {
    if (!token) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChange([...images, data.url])
      addToast('Görsel yüklendi', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Yükleme hatası', 'error')
    } finally {
      setUploading(false)
    }
  }

  const remove = (url: string) => onChange(images.filter((i) => i !== url))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div key={url} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-brand-primary/10 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-2xl border-2 border-dashed border-brand-primary/20 flex flex-col items-center justify-center gap-1 text-brand-primary/40 hover:border-accent hover:text-accent transition-all disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={18} />
              <span className="text-[10px] font-black uppercase">Ekle</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />
    </div>
  )
}
