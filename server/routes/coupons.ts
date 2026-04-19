import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number
  usage_limit: number | null
  used_count: number
  expires_at: string | null
  created_at: string
}

const router = Router()

const CouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  min_order: z.number().min(0).default(0),
  usage_limit: z.number().int().positive().optional(),
  expires_at: z.string().datetime().optional(),
})

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

router.get('/', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') { res.status(403).json({ error: 'Yetkisiz' }); return }
  res.json(db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all())
})

router.post('/validate', (req, res) => {
  const { code, cart_total } = req.body as { code: string; cart_total: number }
  if (typeof code !== 'string' || typeof cart_total !== 'number') {
    res.status(400).json({ error: 'code ve cart_total gerekli' }); return
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code.toUpperCase()) as Coupon | undefined
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

export function incrementCouponUsage(code: string) {
  db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(code)
}

export default router
