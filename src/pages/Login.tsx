import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Giriş başarısız')
      login(data.user)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-secondary/30 px-4">
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 w-full max-w-md border border-brand-primary/5">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white rotate-3 shadow-lg shadow-accent/20">
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="font-display font-bold text-3xl tracking-tighter uppercase italic text-brand-primary">Mercora</span>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-brand-primary mb-2">Giriş Yap</h1>
        <p className="text-xs text-brand-primary/40 font-medium mb-8">Global marketplace'e hoş geldiniz.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-2xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta adresi"
            required
            className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            required
            className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-accent transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-primary/40 font-medium">
          Hesabın yok mu?{' '}
          <Link to="/register" className="text-accent font-black hover:underline">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  )
}
