import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore(s => s.setUser)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız')
      setUser(data.user)
      if (data.user.role === 'seller') {
        navigate('/seller/onboard')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message)
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

        <h1 className="text-2xl font-black uppercase tracking-tight text-brand-primary mb-2">Kayıt Ol</h1>
        <p className="text-xs text-brand-primary/40 font-medium mb-8">Global marketplace'e katılın.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-2xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
            required
            minLength={2}
            className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
          />
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
            placeholder="Şifre (en az 6 karakter)"
            required
            minLength={6}
            className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                role === 'buyer'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'border-brand-primary/10 text-brand-primary/40 hover:border-brand-primary/30'
              }`}
            >
              Alıcı
            </button>
            <button
              type="button"
              onClick={() => setRole('seller')}
              className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                role === 'seller'
                  ? 'bg-accent text-white border-accent'
                  : 'border-brand-primary/10 text-brand-primary/40 hover:border-brand-primary/30'
              }`}
            >
              Satıcı
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-accent transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-primary/40 font-medium">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-accent font-black hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
