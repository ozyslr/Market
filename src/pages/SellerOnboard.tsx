import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export function SellerOnboardPage() {
  const user = useAuthStore(s => s.user)
  const { addToast } = useUIStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ store_name: '', slug: '', description: '', logo: '' })

  useEffect(() => {
    if (!user || user.role !== 'seller') { navigate('/'); return }
    fetch('/api/sellers/me', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => { if (r.ok) navigate('/seller/dashboard') })
      .finally(() => setChecking(false))
  }, [user, navigate])

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setForm(f => ({ ...f, store_name: name, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const r = await fetch('/api/sellers/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          store_name: form.store_name,
          slug: form.slug,
          description: form.description || undefined,
          logo: form.logo || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) { addToast(data.error || 'Hata oluştu', 'error'); return }
      addToast('Mağazanız oluşturuldu!', 'success')
      navigate('/seller/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex w-16 h-16 bg-accent rounded-2xl items-center justify-center mb-4 rotate-3">
          <Zap size={32} className="text-white" fill="currentColor" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-brand-primary mb-2">Mağazanı Kur</h1>
        <p className="text-brand-primary/50 text-sm">Mercora'da satışa başlamak için mağaza profilinizi oluşturun.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-brand-primary/10 rounded-3xl p-8 space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-2">
            Mağaza Adı <span className="text-red-400">*</span>
          </label>
          <input
            value={form.store_name}
            onChange={e => handleNameChange(e.target.value)}
            required
            placeholder="Örn: Ali's Electronics"
            className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-2">
            Mağaza URL (Slug) <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center border border-brand-primary/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
            <span className="px-3 py-3 bg-brand-secondary/50 text-brand-primary/40 text-xs font-black border-r border-brand-primary/10">mercora.co.uk/</span>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              required
              pattern="[a-z0-9-]+"
              className="flex-1 px-3 py-3 text-sm font-mono outline-none bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-2">Mağaza Açıklaması</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Mağazanızı kısaca tanıtın..."
            className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-2">Logo URL (opsiyonel)</label>
          <input
            value={form.logo}
            onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
            type="url"
            placeholder="https://..."
            className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.store_name || !form.slug}
          className="w-full py-4 bg-accent text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Store size={18} />}
          {loading ? 'Oluşturuluyor...' : 'Mağazamı Oluştur'}
        </button>
      </form>
    </div>
  )
}
