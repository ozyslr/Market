import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ShieldCheck, Globe } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { calculateTotal, MARKETS } from '@/lib/taxEngine'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Replace with your actual publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder')

interface Address {
  line1: string
  city: string
  country: string
  postcode: string
}

function CheckoutForm({ clientSecret, address, setAddress, totals }: { 
  clientSecret: string, 
  address: Address, 
  setAddress: React.Dispatch<React.SetStateAction<Address>>,
  totals: any 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!user) { navigate('/login'); return }
    if (items.length === 0) return

    setLoading(true)
    setMessage(null)

    try {
      const paymentIntentId = clientSecret.split('_secret')[0]
      // Create the order in our backend first (pending payment)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ items, total: totals.total, address, status: 'pending', paymentIntentId }),
      })
      
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Sipariş oluşturulamadı')

      // Confirm the payment with Stripe
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile`,
          payment_method_data: {
            billing_details: {
              address: {
                city: address.city,
                country: address.country,
                line1: address.line1,
                postal_code: address.postcode
              }
            }
          }
        },
        redirect: 'if_required', // Handle redirect manually for single page apps if possible, but redirect is fine.
      })

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || 'Ödeme hatası.')
        } else {
          setMessage("Beklenmeyen bir hata oluştu.")
        }
      } else {
        // Successful payment, we can optionally update order status here or rely on webhooks
        clearCart()
        addToast(`Ödeme başarılı! Siparişiniz alındı. #${orderData.orderId?.slice(0, 8)}`, 'success')
        navigate('/profile')
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Bir hata oluştu', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
          Adres Satırı
        </label>
        <input
          type="text"
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
          placeholder="Örn: 123 Market Street"
          required
          className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
            Şehir
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            placeholder="Örn: London"
            required
            className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
            Posta Kodu
          </label>
          <input
            type="text"
            value={address.postcode}
            onChange={(e) => setAddress({ ...address, postcode: e.target.value })}
            placeholder="Örn: SW1A 1AA"
            required
            className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
          Ülke
        </label>
        <select
          value={address.country}
          onChange={(e) => setAddress({ ...address, country: e.target.value })}
          className="w-full border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-brand-secondary/20"
        >
          <option value="GB">United Kingdom</option>
          <option value="TR">Türkiye</option>
          <option value="DE">Germany</option>
          <option value="US">United States</option>
        </select>
      </div>

      <div className="mt-8 border-t border-brand-primary/10 pt-8">
        <h2 className="text-xl font-black uppercase tracking-tight text-brand-primary mb-6">
          Ödeme Bilgileri
        </h2>
        <PaymentElement />
      </div>

      {message && <div className="text-red-500 text-sm mt-4">{message}</div>}

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full bg-brand-primary text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-accent transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
      >
        {loading ? 'İşleniyor...' : `Siparişi Onayla (£${totals.total.toFixed(2)})`}
      </button>
    </form>
  )
}

export function CheckoutPage() {
  const { items, totalPrice } = useCartStore()
  const user = useAuthStore((s) => s.user)

  const [address, setAddress] = useState<Address>({ line1: '', city: '', country: 'GB', postcode: '' })
  const [clientSecret, setClientSecret] = useState<string>('')

  const subtotal = totalPrice()
  const market = MARKETS['UK']
  const totals = calculateTotal(subtotal, 12, market, true)

  useEffect(() => {
    // Fetch the client secret when the checkout page loads
    if (items.length > 0 && user) {
      fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ amount: totals.total, currency: 'gbp' }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret))
        .catch((err) => console.error('Error fetching client secret:', err))
    }
  }, [items, user, totals.total])

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-secondary/30 px-4 pt-8">
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase tracking-tight text-brand-primary mb-4">Sepetiniz boş</h2>
          <Link to="/" className="bg-brand-primary text-white font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl hover:bg-accent transition-all">
            Alışverişe Başla
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-secondary/30 pt-8 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary/50 hover:text-brand-primary mb-8 transition-colors">
          <ChevronLeft size={16} /> Sepete Dön
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Adres ve Ödeme Formu */}
          <div className="flex-1">
            <div className="bg-white rounded-[3rem] p-10 border border-brand-primary/5 shadow-sm">
              <h1 className="text-2xl font-black uppercase tracking-tight text-brand-primary mb-8">
                Teslimat Adresi
              </h1>
              
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                  <CheckoutForm clientSecret={clientSecret} address={address} setAddress={setAddress} totals={totals} />
                </Elements>
              ) : (
                <div className="text-center py-8 text-brand-primary/60 font-medium animate-pulse">
                  Ödeme sistemi yükleniyor...
                </div>
              )}
            </div>
          </div>

          {/* Özet */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-[3rem] p-8 border border-brand-primary/5 shadow-sm sticky top-32">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary mb-6 pb-4 border-b border-brand-primary/5">
                Sipariş Özeti
              </h3>

              <div className="space-y-3 mb-6 text-sm">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="text-brand-primary/60 font-medium truncate flex-1 mr-2">{item.title} ×{item.quantity}</span>
                    <span className="font-black text-brand-primary shrink-0">£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-primary/5 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-brand-primary/40 font-bold uppercase tracking-widest">
                  <span>Ara Toplam</span><span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-primary/40 font-bold uppercase tracking-widest">
                  <span>Kargo</span><span>£{totals.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-primary/40 font-bold uppercase tracking-widest">
                  <span>KDV</span><span>£{totals.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-primary font-black text-sm pt-3 border-t border-brand-primary/5">
                  <span>Toplam</span><span>£{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 text-xs text-brand-primary/40 font-bold">
                <ShieldCheck size={14} className="text-green-500 shrink-0" />
                <span>Güvenli ödeme</span>
                <Globe size={14} className="text-brand-primary/20 shrink-0 ml-auto" />
                <span>Global teslimat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
