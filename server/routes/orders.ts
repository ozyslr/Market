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

const GuestOrderSchema = OrderSchema.extend({
  guestName: z.string().min(1, 'İsim gerekli'),
  guestEmail: z.string().email('Geçerli e-posta gerekli'),
})

router.post('/guest', (req, res) => {
  const parsed = GuestOrderSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }
  const { items, total, address, paymentIntentId, guestEmail } = parsed.data
  const orderId = randomUUID()
  const COMMISSION_RATE = 0.10
  db.prepare('INSERT INTO orders (id, buyer_id, items, total, status, address, payment_intent_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(orderId, `guest:${guestEmail}`, JSON.stringify(items), total, 'pending', address ? JSON.stringify(address) : null, paymentIntentId || null)
  for (const item of items) {
    const product = db.prepare('SELECT seller_id FROM products WHERE id = ?').get(item.productId) as { seller_id: string } | undefined
    if (!product) continue
    db.prepare('INSERT INTO order_items (id, order_id, product_id, seller_id, qty, price, commission, title, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), orderId, item.productId, product.seller_id, item.quantity, item.price, parseFloat((item.price * item.quantity * COMMISSION_RATE).toFixed(2)), item.title, item.image ?? null)
  }
  res.status(201).json({ orderId })
})

router.post('/', authenticate, (req: AuthRequest, res) => {
  const parsed = OrderSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }

  const { items, total, address, paymentIntentId } = parsed.data
  const orderId = randomUUID()
  const COMMISSION_RATE = 0.10
  db.prepare(
    'INSERT INTO orders (id, buyer_id, items, total, status, address, payment_intent_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(orderId, req.user!.id, JSON.stringify(items), total, 'pending', address ? JSON.stringify(address) : null, paymentIntentId || null)

  for (const item of items) {
    const product = db.prepare('SELECT seller_id FROM products WHERE id = ?').get(item.productId) as { seller_id: string } | undefined
    if (!product) continue
    db.prepare('INSERT INTO order_items (id, order_id, product_id, seller_id, qty, price, commission, title, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), orderId, item.productId, product.seller_id, item.quantity, item.price, parseFloat((item.price * item.quantity * COMMISSION_RATE).toFixed(2)), item.title, item.image ?? null)
  }

  res.status(201).json({ orderId })
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

router.get('/seller/analytics', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'seller' && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Yetkiniz yok' }); return
  }
  const sellerId = req.user!.id

  const totals = db.prepare(`
    SELECT SUM(oi.price * oi.qty) as totalRevenue,
           COUNT(DISTINCT oi.order_id) as totalOrders,
           SUM(oi.qty) as totalItems
    FROM order_items oi WHERE oi.seller_id = ?
  `).get(sellerId) as { totalRevenue: number | null; totalOrders: number; totalItems: number | null }

  const topProducts = db.prepare(`
    SELECT oi.product_id as id, oi.title,
           SUM(oi.price * oi.qty) as revenue,
           SUM(oi.qty) as qty,
           (SELECT json_extract(images,'$[0]') FROM products WHERE id = oi.product_id) as image
    FROM order_items oi WHERE oi.seller_id = ?
    GROUP BY oi.product_id ORDER BY revenue DESC LIMIT 5
  `).all(sellerId) as { id: string; title: string; revenue: number; qty: number; image: string | null }[]

  const revenueByDay = db.prepare(`
    SELECT substr(o.created_at, 1, 10) as date, SUM(oi.price * oi.qty) as revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE oi.seller_id = ?
    GROUP BY date ORDER BY date ASC
  `).all(sellerId) as { date: string; revenue: number }[]

  res.json({
    totalRevenue: parseFloat((totals.totalRevenue ?? 0).toFixed(2)),
    totalOrders: totals.totalOrders,
    totalItems: totals.totalItems ?? 0,
    topProducts: topProducts.map(p => ({ ...p, revenue: parseFloat(p.revenue.toFixed(2)) })),
    revenueByDay: revenueByDay.map(r => ({ ...r, revenue: parseFloat(r.revenue.toFixed(2)) })),
  })
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
