# Mercora — 5 Kritik Özellik Implementasyon Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mercora marketplace'e 5 kritik production özelliği eklemek: görsel yükleme, kupon sistemi, Stripe ödeme, ürün yorumları, ve admin paneli.

**Architecture:** Express.js backend'e yeni route'lar + SQLite'a yeni tablolar + React frontend'e yeni sayfalar/bileşenler. Her görev bağımsız deploy edilebilir.

**Tech Stack:** React 19, TypeScript, Express.js, better-sqlite3, Zustand 5, Tailwind CSS 4, multer, Stripe, Zod

---

## Dosya Değişim Haritası

| Dosya | İşlem | Görev |
|-------|-------|-------|
| `server/db.ts` | Güncelle — yeni tablolar | #1,2,4,5 |
| `server/index.ts` | Güncelle — yeni routes + static | #1,3 |
| `server/routes/upload.ts` | **Oluştur** | #1 |
| `server/routes/coupons.ts` | **Oluştur** | #2 |
| `server/routes/payments.ts` | **Oluştur** | #3 |
| `server/routes/reviews.ts` | **Oluştur** | #4 |
| `server/routes/admin.ts` | **Oluştur** | #5 |
| `src/components/seller/ImageUploader.tsx` | **Oluştur** | #1 |
| `src/pages/SellerInventory.tsx` | Güncelle — görsel uploader | #1 |
| `src/pages/Cart.tsx` | Güncelle — kupon input | #2 |
| `src/store/cartStore.ts` | Güncelle — coupon state | #2 |
| `src/pages/Checkout.tsx` | Güncelle — Stripe Elements | #3 |
| `src/components/commerce/ReviewForm.tsx` | **Oluştur** | #4 |
| `src/components/commerce/ReviewList.tsx` | **Oluştur** | #4 |
| `src/pages/ProductDetail.tsx` | Güncelle — reviews section | #4 |
| `src/pages/Admin.tsx` | **Oluştur** | #5 |
| `src/App.tsx` | Güncelle — /admin route | #5 |
| `.env` / `.env.example` | Güncelle — yeni keys | #1,3 |
| `package.json` | Güncelle — yeni deps | #1,3 |

---

## Görev 1: Ürün Görseli Yükleme (multer)

**Neden önce bu:** Her diğer özellik görsele ihtiyaç duyuyor. placehold.co gerçek kullanıcıya uygun değil.

**Files:**
- Create: `server/routes/upload.ts`
- Modify: `server/index.ts`
- Modify: `server/db.ts`
- Create: `src/components/seller/ImageUploader.tsx`
- Modify: `src/pages/SellerInventory.tsx`

- [ ] **Adım 1: multer kur**

```bash
npm install multer
npm install -D @types/multer
```

Beklenen çıktı: `added 2 packages`

- [ ] **Adım 2: Upload klasörü oluştur**

```bash
mkdir -p server/uploads
echo "" > server/uploads/.gitkeep
```

- [ ] **Adım 3: `server/routes/upload.ts` yaz**

```typescript
import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'server', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Sadece görsel dosyaları kabul edilir'))
  },
})

router.post('/image', authenticate, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Dosya bulunamadı' }); return }
  const url = `/uploads/${req.file.filename}`
  res.json({ url })
})

export default router
```

- [ ] **Adım 4: `server/index.ts`'e upload route ve static klasör ekle**

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import uploadRoutes from './routes/upload.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Mercora API → http://localhost:${PORT}`)
})
```

- [ ] **Adım 5: `vite.config.ts`'e /uploads proxy ekle**

`vite.config.ts` içindeki `proxy` objesine şunu ekle (mevcut `/api` girişinin yanına):
```typescript
'/uploads': {
  target: 'http://localhost:3001',
  changeOrigin: true,
},
```

- [ ] **Adım 6: `src/components/seller/ImageUploader.tsx` yaz**

```typescript
import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
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
    } catch (err: any) {
      addToast(err.message ?? 'Yükleme hatası', 'error')
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
```

- [ ] **Adım 7: Sunucuyu başlat ve test et**

```bash
npm run dev
```

Terminal 1'de sunucu başlamalı. Tarayıcıda `/seller/inventory` sayfasına git, yeni ürün ekleme formunda ImageUploader görünmeli.

Manuel test: Bir JPEG/PNG dosyası yükle → `server/uploads/` klasöründe dosya görünmeli, response'da `/uploads/<uuid>.jpg` URL gelmeli.

- [ ] **Adım 8: Commit**

```bash
git add server/routes/upload.ts server/index.ts server/uploads/.gitkeep src/components/seller/ImageUploader.tsx vite.config.ts
git commit -m "feat: multer image upload endpoint + ImageUploader component"
```

---

## Görev 2: Kupon / Discount Kodu Sistemi

**Files:**
- Modify: `server/db.ts`
- Create: `server/routes/coupons.ts`
- Modify: `server/index.ts`
- Modify: `src/store/cartStore.ts`
- Modify: `src/pages/Cart.tsx`

- [ ] **Adım 1: `server/db.ts`'e `coupons` tablosu ekle**

`db.exec(...)` içindeki son `CREATE TABLE` bloğunun hemen ardından şunu ekle:

```typescript
  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('percentage','fixed')),
    value REAL NOT NULL,
    min_order REAL DEFAULT 0,
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    expires_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
```

- [ ] **Adım 2: `server/routes/coupons.ts` yaz**

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router()

const CouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  min_order: z.number().min(0).default(0),
  usage_limit: z.number().int().positive().optional(),
  expires_at: z.string().datetime().optional(),
})

// Admin: kupon oluştur
router.post('/', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') { res.status(403).json({ error: 'Yetkisiz' }); return }

  const parsed = CouponSchema.safeParse({ ...req.body, code: req.body.code?.toUpperCase() })
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }

  const { code, type, value, min_order, usage_limit, expires_at } = parsed.data
  const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(code)
  if (existing) { res.status(409).json({ error: 'Bu kod zaten var' }); return }

  const id = randomUUID()
  db.prepare(
    'INSERT INTO coupons (id, code, type, value, min_order, usage_limit, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, code, type, value, min_order, usage_limit ?? null, expires_at ?? null)

  res.status(201).json({ id, code })
})

// Admin: tüm kuponları listele
router.get('/', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') { res.status(403).json({ error: 'Yetkisiz' }); return }
  res.json(db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all())
})

// Public: kodu doğrula
router.post('/validate', (req, res) => {
  const { code, cart_total } = req.body as { code: string; cart_total: number }
  if (!code || typeof cart_total !== 'number') {
    res.status(400).json({ error: 'code ve cart_total gerekli' }); return
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code.toUpperCase()) as any
  if (!coupon) { res.status(404).json({ error: 'Geçersiz kupon kodu' }); return }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    res.status(400).json({ error: 'Kupon süresi dolmuş' }); return
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    res.status(400).json({ error: 'Kupon kullanım limiti doldu' }); return
  }
  if (cart_total < coupon.min_order) {
    res.status(400).json({ error: `Bu kupon için minimum sipariş: £${coupon.min_order}` }); return
  }

  const discount = coupon.type === 'percentage'
    ? Math.min(cart_total * (coupon.value / 100), cart_total)
    : Math.min(coupon.value, cart_total)

  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: parseFloat(discount.toFixed(2)),
  })
})

// Sipariş tamamlandığında kullanım sayacını artır (internal)
export function incrementCouponUsage(code: string) {
  db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(code)
}

export default router
```

- [ ] **Adım 3: `server/index.ts`'e coupon route ekle**

`import orderRoutes` satırının altına ekle:
```typescript
import couponRoutes from './routes/coupons.js'
```

`app.use('/api/orders', orderRoutes)` satırının altına ekle:
```typescript
app.use('/api/coupons', couponRoutes)
```

- [ ] **Adım 4: `src/store/cartStore.ts`'e kupon state ekle**

Mevcut `CartStore` interface'ine şunu ekle:
```typescript
coupon: { code: string; discount: number; type: 'percentage' | 'fixed'; value: number } | null
applyCoupon: (coupon: CartStore['coupon']) => void
removeCoupon: () => void
grandTotal: () => number
```

`create<CartStore>()(persist((set, get) => ({` bloğuna şunu ekle:
```typescript
coupon: null,
applyCoupon: (coupon) => set({ coupon }),
removeCoupon: () => set({ coupon: null }),
grandTotal: () => {
  const base = get().totalPrice()
  return get().coupon ? Math.max(0, base - get().coupon!.discount) : base
},
```

- [ ] **Adım 5: `src/pages/Cart.tsx`'e kupon UI ekle**

`CartPage` bileşeninde sepet özeti bölümünün içine (`totalPrice` gösterilen yerin üstüne) şu kupon bölümünü ekle:

```tsx
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { useState } from 'react'
import { Tag, X } from 'lucide-react'

// Component içinde:
const [couponInput, setCouponInput] = useState('')
const [couponLoading, setCouponLoading] = useState(false)
const { coupon, applyCoupon, removeCoupon, totalPrice, grandTotal } = useCartStore()
const { addToast } = useUIStore()

const handleCoupon = async () => {
  if (!couponInput.trim()) return
  setCouponLoading(true)
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponInput.trim(), cart_total: totalPrice() }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    applyCoupon({ code: data.code, discount: data.discount, type: data.type, value: data.value })
    addToast(`"${data.code}" kodu uygulandı — £${data.discount.toFixed(2)} indirim!`, 'success')
    setCouponInput('')
  } catch (err: any) {
    addToast(err.message, 'error')
  } finally {
    setCouponLoading(false)
  }
}

// JSX — sepet özeti içine:
{/* Coupon Input */}
<div className="space-y-3 border-t border-brand-primary/5 pt-4">
  {coupon ? (
    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 text-green-700">
        <Tag size={14} />
        <span className="text-xs font-black uppercase">{coupon.code}</span>
        <span className="text-xs font-medium">— £{coupon.discount.toFixed(2)} indirim</span>
      </div>
      <button onClick={removeCoupon} className="text-green-500 hover:text-red-500 transition-colors">
        <X size={14} />
      </button>
    </div>
  ) : (
    <div className="flex gap-2">
      <input
        value={couponInput}
        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleCoupon()}
        placeholder="KUPON KODU"
        className="flex-1 px-4 py-2.5 rounded-xl border border-brand-primary/10 text-xs font-black uppercase tracking-widest outline-none focus:border-accent transition-colors"
      />
      <button
        onClick={handleCoupon}
        disabled={couponLoading || !couponInput.trim()}
        className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black disabled:opacity-40 hover:bg-accent transition-colors"
      >
        {couponLoading ? '...' : 'Uygula'}
      </button>
    </div>
  )}
  {coupon && (
    <div className="flex justify-between text-xs font-bold text-green-700">
      <span>İndirim</span>
      <span>-£{coupon.discount.toFixed(2)}</span>
    </div>
  )}
  <div className="flex justify-between text-sm font-black text-brand-primary border-t border-brand-primary/5 pt-3">
    <span>Genel Toplam</span>
    <span>£{grandTotal().toFixed(2)}</span>
  </div>
</div>
```

- [ ] **Adım 6: Test — admin ile kupon oluştur**

Önce admin kullanıcısı oluştur (DB'de role güncelle):
```bash
# Server çalışırken:
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@mercora.com","password":"admin123","role":"buyer"}'
# Sonra SQLite'da:
# UPDATE users SET role = 'admin' WHERE email = 'admin@mercora.com';
```

Kupon oluştur:
```bash
# Admin token ile:
curl -X POST http://localhost:3001/api/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"code":"MERCORA10","type":"percentage","value":10,"min_order":50}'
```

Beklenen: `{"id":"...","code":"MERCORA10"}`

Frontend test: Sepete ürün ekle → Cart sayfasında "MERCORA10" yaz → £ tutarın %10'u indirim olarak görünmeli.

- [ ] **Adım 7: Commit**

```bash
git add server/db.ts server/routes/coupons.ts server/index.ts src/store/cartStore.ts src/pages/Cart.tsx
git commit -m "feat: coupon/discount code system with percentage and fixed types"
```

---

## Görev 3: Stripe Ödeme Entegrasyonu

**Files:**
- Modify: `package.json`
- Modify: `.env` + `.env.example`
- Create: `server/routes/payments.ts`
- Modify: `server/index.ts`
- Modify: `src/pages/Checkout.tsx`

- [ ] **Adım 1: Stripe bağımlılıklarını kur**

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

Beklenen: `added 3 packages`

- [ ] **Adım 2: `.env`'e Stripe test anahtarlarını ekle**

Stripe dashboard → https://dashboard.stripe.com/test/apikeys adresinden al:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

`.env.example`'a da şunu ekle:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

- [ ] **Adım 3: `server/routes/payments.ts` yaz**

```typescript
import { Router } from 'express'
import Stripe from 'stripe'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'
import { incrementCouponUsage } from './coupons.js'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })

router.post('/create-intent', authenticate, async (req: AuthRequest, res) => {
  const { items, couponCode, address } = req.body as {
    items: { productId: string; quantity: number; price: number }[]
    couponCode?: string
    address: Record<string, string>
  }

  if (!items?.length) { res.status(400).json({ error: 'Sepet boş' }); return }

  let subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  let discount = 0

  if (couponCode) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(couponCode.toUpperCase()) as any
    if (coupon) {
      discount = coupon.type === 'percentage'
        ? subtotal * (coupon.value / 100)
        : Math.min(coupon.value, subtotal)
    }
  }

  const total = Math.max(0, subtotal - discount)
  const amountInPence = Math.round(total * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPence,
    currency: 'gbp',
    metadata: {
      buyerId: req.user!.id,
      couponCode: couponCode ?? '',
    },
  })

  // Draft order — Stripe webhook ile 'processing'e geçecek (basit versiyon için şimdi kaydediyoruz)
  const orderId = randomUUID()
  db.prepare(
    'INSERT INTO orders (id, buyer_id, items, total, status, address) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(orderId, req.user!.id, JSON.stringify(items), total, 'pending_payment', JSON.stringify(address))

  if (couponCode) incrementCouponUsage(couponCode)

  res.json({ clientSecret: paymentIntent.client_secret, orderId })
})

router.patch('/confirm/:orderId', authenticate, (req: AuthRequest, res) => {
  const { orderId } = req.params
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND buyer_id = ?').get(orderId, req.user!.id) as any
  if (!order) { res.status(404).json({ error: 'Sipariş bulunamadı' }); return }
  db.prepare("UPDATE orders SET status = 'processing' WHERE id = ?").run(orderId)
  res.json({ orderId, status: 'processing' })
})

export default router
```

- [ ] **Adım 4: `server/index.ts`'e payment route ekle**

```typescript
import paymentRoutes from './routes/payments.js'
// ...
app.use('/api/payments', paymentRoutes)
```

- [ ] **Adım 5: `src/pages/Checkout.tsx`'i Stripe Elements ile güncelle**

Mevcut Checkout.tsx'in en üstüne import'ları ekle:
```typescript
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')
```

`CheckoutPage` bileşenini `<Elements>` ile sar:
```tsx
export function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}
```

Mevcut ödeme mantığını `CheckoutForm` adlı yeni bir iç bileşene taşı. `handleSubmit` fonksiyonunu şu şekilde güncelle:

```typescript
const stripe = useStripe()
const elements = useElements()
const { items, coupon, clearCart, grandTotal } = useCartStore()
const { user } = useAuthStore()
const { addToast } = useUIStore()
const navigate = useNavigate()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!stripe || !elements) return
  setLoading(true)

  try {
    // 1. Payment Intent oluştur
    const intentRes = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`,
      },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        couponCode: coupon?.code,
        address,
      }),
    })
    const { clientSecret, orderId } = await intentRes.json()
    if (!intentRes.ok) throw new Error('Ödeme başlatılamadı')

    // 2. Stripe ile ödeme tamamla
    const cardElement = elements.getElement(CardElement)!
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement, billing_details: { name: user?.name } },
    })

    if (error) throw new Error(error.message)
    if (paymentIntent?.status === 'succeeded') {
      // 3. Backend'i onayla
      await fetch(`/api/payments/confirm/${orderId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      clearCart()
      addToast('Ödeme başarılı! Siparişiniz alındı.', 'success')
      navigate('/profile')
    }
  } catch (err: any) {
    addToast(err.message ?? 'Ödeme hatası', 'error')
  } finally {
    setLoading(false)
  }
}
```

`CardElement`'i formun içine (butondan önce) ekle:
```tsx
<div className="border border-brand-primary/10 rounded-2xl p-4 bg-white">
  <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-3">Kart Bilgileri</p>
  <CardElement options={{
    style: {
      base: { fontSize: '14px', fontFamily: 'inherit', color: '#1a1a2e', '::placeholder': { color: '#94a3b8' } },
      invalid: { color: '#ef4444' },
    },
  }} />
</div>
```

- [ ] **Adım 6: `vite.config.ts`'e VITE_STRIPE_PUBLISHABLE_KEY ekle veya `.env`'e yaz**

`.env`'e ekle:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> Not: `VITE_` prefix'li env değişkenler Vite tarafından client'a aktarılır.

- [ ] **Adım 7: Test — Stripe test kartı ile ödeme**

Sunucuyu başlat: `npm run dev`

Checkout sayfasına git → Stripe test kartı kullan:
- Kart: `4242 4242 4242 4242`
- Tarih: herhangi gelecek tarih (örn. `12/28`)
- CVV: herhangi 3 hane (örn. `123`)

Beklenen: Ödeme başarılı → `/profile`'a yönleniyor → Toast görünüyor.

- [ ] **Adım 8: Commit**

```bash
git add server/routes/payments.ts server/index.ts src/pages/Checkout.tsx .env.example package.json package-lock.json
git commit -m "feat: Stripe test payment integration with PaymentIntent flow"
```

---

## Görev 4: Ürün Yorum & Derecelendirme Sistemi

**Files:**
- Modify: `server/db.ts`
- Create: `server/routes/reviews.ts`
- Modify: `server/index.ts`
- Create: `src/components/commerce/ReviewForm.tsx`
- Create: `src/components/commerce/ReviewList.tsx`
- Modify: `src/pages/ProductDetail.tsx`

- [ ] **Adım 1: `server/db.ts`'e `reviews` tablosu ekle**

`db.exec(...)` bloğuna şunu ekle:

```sql
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(product_id, user_id)
  );
```

- [ ] **Adım 2: `server/routes/reviews.ts` yaz**

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router({ mergeParams: true })

// GET /api/reviews/:productId
router.get('/:productId', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.productId)
  res.json(reviews)
})

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

// POST /api/reviews/:productId
router.post('/:productId', authenticate, (req: AuthRequest, res) => {
  const parsed = ReviewSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }

  const existing = db.prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?')
    .get(req.params.productId, req.user!.id)
  if (existing) { res.status(409).json({ error: 'Bu ürünü zaten değerlendirdiniz' }); return }

  const id = randomUUID()
  db.prepare('INSERT INTO reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.productId, req.user!.id, parsed.data.rating, parsed.data.comment ?? null)

  // Ürünün ortalama puanını güncelle
  const stats = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE product_id = ?'
  ).get(req.params.productId) as { avg: number; cnt: number }

  db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?')
    .run(parseFloat(stats.avg.toFixed(1)), stats.cnt, req.params.productId)

  res.status(201).json({ id })
})

export default router
```

- [ ] **Adım 3: `server/index.ts`'e review route ekle**

```typescript
import reviewRoutes from './routes/reviews.js'
// ...
app.use('/api/reviews', reviewRoutes)
```

- [ ] **Adım 4: `src/components/commerce/ReviewForm.tsx` yaz**

```typescript
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
    } catch (err: any) {
      addToast(err.message, 'error')
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
```

- [ ] **Adım 5: `src/components/commerce/ReviewList.tsx` yaz**

```typescript
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
```

- [ ] **Adım 6: `src/pages/ProductDetail.tsx`'e reviews bölümü ekle**

ProductDetail bileşeninin en altındaki JSX'e (return bloğunun içine, kapanmadan önce) şu bölümü ekle:

```tsx
import { ReviewForm } from '@/components/commerce/ReviewForm'
import { ReviewList } from '@/components/commerce/ReviewList'
import { useEffect, useState } from 'react'

// Component içinde state:
const [reviews, setReviews] = useState<any[]>([])

const loadReviews = async () => {
  const res = await fetch(`/api/reviews/${product.id}`)
  if (res.ok) setReviews(await res.json())
}

useEffect(() => { loadReviews() }, [product.id])

// JSX — son section olarak:
<section className="max-w-[1600px] mx-auto px-6 pb-20">
  <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary mb-8">
    Müşteri Yorumları ({reviews.length})
  </h2>
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
    <div className="lg:col-span-3">
      <ReviewList reviews={reviews} />
    </div>
    <div className="lg:col-span-2">
      <ReviewForm productId={product.id} onSuccess={loadReviews} />
    </div>
  </div>
</section>
```

> **Not:** ProductDetail'da ürün `id` değerini al. Eğer sadece `slug` üzerinden çalışıyorsa, önce `/api/products/:slug` endpoint'inden ürünü çek ve `id` alanını kullan.

- [ ] **Adım 7: Test**

1. `npm run dev` → ürün detay sayfasına git
2. Login olmadan → "giriş yapın" bağlantısı görünmeli
3. Login sonrası → yıldız seç + yorum yaz + gönder
4. Yorum listede görünmeli, ürünün rating değeri güncellenmeli

- [ ] **Adım 8: Commit**

```bash
git add server/db.ts server/routes/reviews.ts server/index.ts src/components/commerce/ReviewForm.tsx src/components/commerce/ReviewList.tsx src/pages/ProductDetail.tsx
git commit -m "feat: product reviews and ratings system with live average update"
```

---

## Görev 5: Admin Paneli (KYC + Moderasyon + Kullanıcı Yönetimi)

**Files:**
- Modify: `server/db.ts`
- Create: `server/routes/admin.ts`
- Modify: `server/index.ts`
- Create: `src/pages/Admin.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Adım 1: `server/db.ts`'e yeni kolonlar ekle**

`db.exec(...)` bloğunda mevcut `CREATE TABLE` ifadelerinin ardından şu `ALTER TABLE` ifadelerini ekle (IF NOT EXISTS desteği yok, bu yüzden try/catch tarzında ayrı exec'ler kullan):

```typescript
// db.ts dosyasında db.exec(`) bloğunun kapanmasından SONRA:
const migrations = [
  `ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'unverified'`,
  `ALTER TABLE products ADD COLUMN moderation_status TEXT DEFAULT 'approved'`,
]

for (const sql of migrations) {
  try { db.exec(sql) } catch { /* kolon zaten var */ }
}
```

- [ ] **Adım 2: `server/routes/admin.ts` yaz**

```typescript
import { Router } from 'express'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router()

const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') { res.status(403).json({ error: 'Admin yetkisi gerekli' }); return }
  next()
}

// Platform istatistikleri
router.get('/stats', authenticate, requireAdmin, (_req, res) => {
  const users = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c
  const products = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c
  const orders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c
  const revenue = (db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE status != 'pending_payment'").get() as any).r
  const pendingKyc = (db.prepare("SELECT COUNT(*) as c FROM users WHERE kyc_status = 'pending'").get() as any).c
  const pendingProducts = (db.prepare("SELECT COUNT(*) as c FROM products WHERE moderation_status = 'pending'").get() as any).c
  res.json({ users, products, orders, revenue, pendingKyc, pendingProducts })
})

// Kullanıcı listesi
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const { page = '1', limit = '20', role } = req.query as Record<string, string>
  let sql = 'SELECT id, name, email, role, kyc_status, country, created_at FROM users WHERE 1=1'
  const params: any[] = []
  if (role) { sql += ' AND role = ?'; params.push(role) }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  const p = Math.max(1, parseInt(page)), l = Math.min(100, parseInt(limit))
  params.push(l, (p - 1) * l)
  res.json(db.prepare(sql).all(...params))
})

// Kullanıcı rol / KYC güncelle
router.patch('/users/:id', authenticate, requireAdmin, (req, res) => {
  const { role, kyc_status } = req.body as { role?: string; kyc_status?: string }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return }
  if (role) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id)
  if (kyc_status) db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').run(kyc_status, req.params.id)
  res.json({ message: 'Güncellendi' })
})

// Ürün moderasyonu listesi
router.get('/products', authenticate, requireAdmin, (req, res) => {
  const { status } = req.query as { status?: string }
  let sql = 'SELECT * FROM products WHERE 1=1'
  const params: any[] = []
  if (status) { sql += ' AND moderation_status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC LIMIT 50'
  res.json(db.prepare(sql).all(...params))
})

// Ürün moderation_status güncelle
router.patch('/products/:id', authenticate, requireAdmin, (req, res) => {
  const { moderation_status } = req.body as { moderation_status: string }
  if (!['approved', 'rejected', 'pending'].includes(moderation_status)) {
    res.status(400).json({ error: 'Geçersiz durum' }); return
  }
  db.prepare('UPDATE products SET moderation_status = ? WHERE id = ?').run(moderation_status, req.params.id)
  res.json({ message: 'Güncellendi' })
})

// Sipariş listesi (admin)
router.get('/orders', authenticate, requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all()
  res.json(orders)
})

// Kupon listesi (admin) — /api/coupons GET zaten var, buraya eklemek gerekmez

export default router
```

- [ ] **Adım 3: `server/index.ts`'e admin route ekle**

```typescript
import adminRoutes from './routes/admin.js'
// ...
app.use('/api/admin', adminRoutes)
```

- [ ] **Adım 4: `src/pages/Admin.tsx` yaz**

```typescript
import { useState, useEffect } from 'react'
import { Users, Package, ShoppingBag, TrendingUp, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

type Tab = 'stats' | 'users' | 'products' | 'orders'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const user = useAuthStore((s) => s.user)
  const { addToast } = useUIStore()

  const headers = { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' }

  const loadStats = async () => {
    const res = await fetch('/api/admin/stats', { headers })
    if (res.ok) setStats(await res.json())
  }

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users', { headers })
    if (res.ok) setUsers(await res.json())
  }

  const loadProducts = async () => {
    const res = await fetch('/api/admin/products', { headers })
    if (res.ok) setProducts(await res.json())
  }

  const loadOrders = async () => {
    const res = await fetch('/api/admin/orders', { headers })
    if (res.ok) setOrders(await res.json())
  }

  useEffect(() => {
    loadStats()
    if (tab === 'users') loadUsers()
    if (tab === 'products') loadProducts()
    if (tab === 'orders') loadOrders()
  }, [tab])

  const updateUser = async (id: string, data: Record<string, string>) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers, body: JSON.stringify(data) })
    if (res.ok) { addToast('Güncellendi', 'success'); loadUsers() }
    else addToast('Hata', 'error')
  }

  const updateProduct = async (id: string, moderation_status: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ moderation_status }) })
    if (res.ok) { addToast('Güncellendi', 'success'); loadProducts() }
    else addToast('Hata', 'error')
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'stats', label: 'Dashboard', icon: <TrendingUp size={16} /> },
    { key: 'users', label: 'Kullanıcılar', icon: <Users size={16} /> },
    { key: 'products', label: 'Ürünler', icon: <Package size={16} /> },
    { key: 'orders', label: 'Siparişler', icon: <ShoppingBag size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-brand-secondary/20 pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary">Admin Panel</h1>
            <p className="text-xs text-brand-primary/40 font-bold uppercase tracking-widest">Mercora Platform Control</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-1.5 border border-brand-primary/5 shadow-sm w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                tab === t.key ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-primary/40 hover:text-brand-primary'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Kullanıcı', value: stats.users, icon: <Users size={20} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Ürün', value: stats.products, icon: <Package size={20} />, color: 'bg-purple-50 text-purple-600' },
              { label: 'Sipariş', value: stats.orders, icon: <ShoppingBag size={20} />, color: 'bg-green-50 text-green-600' },
              { label: 'Gelir (£)', value: `£${Number(stats.revenue).toFixed(0)}`, icon: <TrendingUp size={20} />, color: 'bg-accent/10 text-accent' },
              { label: 'KYC Bekl.', value: stats.pendingKyc, icon: <AlertCircle size={20} />, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Ürün Bekl.', value: stats.pendingProducts, icon: <AlertCircle size={20} />, color: 'bg-orange-50 text-orange-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-3xl p-6 border border-brand-primary/5 shadow-sm">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', s.color)}>
                  {s.icon}
                </div>
                <p className="text-2xl font-black text-brand-primary">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-3xl border border-brand-primary/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-primary/5">
                <tr>
                  {['Ad', 'E-posta', 'Rol', 'KYC', 'Tarih', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-bold">{u.name}</td>
                    <td className="px-6 py-4 text-brand-primary/60">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        className="text-xs font-black bg-brand-secondary/20 rounded-xl px-3 py-1.5 border-none outline-none cursor-pointer"
                      >
                        {['buyer', 'seller', 'admin'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        defaultValue={u.kyc_status ?? 'unverified'}
                        onChange={(e) => updateUser(u.id, { kyc_status: e.target.value })}
                        className="text-xs font-black bg-brand-secondary/20 rounded-xl px-3 py-1.5 border-none outline-none cursor-pointer"
                      >
                        {['unverified', 'pending', 'verified', 'rejected'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-brand-primary/40 text-xs">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="bg-white rounded-3xl border border-brand-primary/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-primary/5">
                <tr>
                  {['Ürün', 'Fiyat', 'Satıcı', 'Moderasyon', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-bold max-w-xs truncate">{p.title}</td>
                    <td className="px-6 py-4 font-black text-accent">£{p.price}</td>
                    <td className="px-6 py-4 text-brand-primary/60 text-xs">{p.seller_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <span className={cn('text-[10px] font-black uppercase px-3 py-1 rounded-full',
                        p.moderation_status === 'approved' ? 'bg-green-100 text-green-700' :
                        p.moderation_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {p.moderation_status ?? 'approved'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => updateProduct(p.id, 'approved')} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Onayla">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => updateProduct(p.id, 'rejected')} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reddet">
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="bg-white rounded-3xl border border-brand-primary/5 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-primary/5">
                <tr>
                  {['Sipariş ID', 'Alıcı', 'Toplam', 'Durum', 'Tarih'].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-brand-primary/40">{o.id.slice(0, 12)}...</td>
                    <td className="px-6 py-4 text-xs text-brand-primary/60">{o.buyer_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-black text-accent">£{Number(o.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={cn('text-[10px] font-black uppercase px-3 py-1 rounded-full',
                        o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        o.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-primary/40">{new Date(o.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Adım 5: `src/App.tsx`'e admin route ekle**

```typescript
import { AdminPage } from '@/pages/Admin'

// Routes içine ekle:
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
} />
```

- [ ] **Adım 6: Navbar'a admin linki ekle**

`src/components/layout/Navbar.tsx` içinde `authUser` kullanıldığı yerde (account dropdown'da), seller hub linkinin altına ekle:

```tsx
{authUser?.role === 'admin' && (
  <Link to="/admin" className="block text-xs font-black text-red-500 uppercase italic transition-colors">
    Admin Panel
  </Link>
)}
```

- [ ] **Adım 7: Test**

1. Admin kullanıcısı ile giriş yap → Navbar'da "Admin Panel" linki görünmeli
2. `/admin` → Dashboard sekme: istatistikler görünmeli
3. Kullanıcılar sekmesi → rol değiştir → kayıt güncellenmeli
4. Ürünler sekmesi → Onayla/Reddet butonları çalışmalı
5. Admin olmayan kullanıcı `/admin`'e gitmeye çalışırsa → `/` redirect

- [ ] **Adım 8: Commit**

```bash
git add server/db.ts server/routes/admin.ts server/index.ts src/pages/Admin.tsx src/App.tsx src/components/layout/Navbar.tsx
git commit -m "feat: admin panel with KYC management, product moderation, order overview"
```

---

## Doğrulama Kontrol Listesi

Tüm görevler tamamlandıktan sonra:

```bash
# 1. Build hataları yok
npm run lint

# 2. Server sağlıklı
curl http://localhost:3001/api/health
# → {"status":"ok"}

# 3. Görsel yükleme
# → server/uploads/ klasöründe dosya var mı?

# 4. Kupon doğrulama
curl -X POST http://localhost:3001/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"MERCORA10","cart_total":100}'
# → {"valid":true,"discount":10}

# 5. Stripe
# → Checkout'ta test kart 4242... ile ödeme tamamlanıyor mu?

# 6. Review
# → Ürün detay sayfasında yorum formu ve liste görünüyor mu?

# 7. Admin
# → /admin → istatistikler + CRUD çalışıyor mu?
```

---

## Final Commit

```bash
git add -A
git commit -m "feat: complete 5-feature sprint — upload, coupons, stripe, reviews, admin"
git push origin main
```
