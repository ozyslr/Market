import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router()

const OrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    title: z.string(),
    price: z.number(),
    quantity: z.number().int().positive(),
    image: z.string().optional(),
  })),
  total: z.number().positive(),
  address: z.object({
    line1: z.string(),
    city: z.string(),
    country: z.string(),
    postcode: z.string(),
  }).optional(),
  paymentIntentId: z.string().optional(),
})

router.post('/', authenticate, (req: AuthRequest, res) => {
  const parsed = OrderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }

  const { items, total, address, paymentIntentId } = parsed.data
  const id = randomUUID()
  db.prepare(
    'INSERT INTO orders (id, buyer_id, items, total, status, address, payment_intent_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user!.id, JSON.stringify(items), total, 'pending', address ? JSON.stringify(address) : null, paymentIntentId || null)

  res.status(201).json({ orderId: id })
})

router.get('/my', authenticate, (req: AuthRequest, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC')
    .all(req.user!.id) as { items: string; address: string | null }[]

  res.json(orders.map((o) => ({
    ...o,
    items: JSON.parse(o.items),
    address: o.address ? JSON.parse(o.address) : null,
  })))
})

router.get('/seller', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'seller' && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Yetkiniz yok' })
    return
  }
  const sellerProducts = db
    .prepare('SELECT id FROM products WHERE seller_id = ?')
    .all(req.user!.id) as { id: string }[]

  const productIds = sellerProducts.map((p) => p.id)
  if (productIds.length === 0) { res.json([]); return }

  const allOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as {
    items: string; address: string | null
  }[]

  const sellerOrders = allOrders
    .map((o) => ({ ...o, items: JSON.parse(o.items) as { productId: string }[], address: o.address ? JSON.parse(o.address) : null }))
    .filter((o) => o.items.some((i) => productIds.includes(i.productId)))

  res.json(sellerOrders)
})

router.patch('/:id/status', authenticate, (req: AuthRequest, res) => {
  const { status } = req.body
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Geçersiz durum' })
    return
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ message: 'Güncellendi' })
})

export default router
