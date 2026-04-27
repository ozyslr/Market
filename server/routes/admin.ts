import { Router } from 'express'
import type { Response, NextFunction } from 'express'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router()

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') { res.status(403).json({ error: 'Admin yetkisi gerekli' }); return }
  next()
}

router.get('/stats', authenticate, requireAdmin, (_req, res) => {
  const users = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  const products = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c
  const orders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c
  const revenue = (db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE status != 'pending_payment'").get() as { r: number }).r
  const pendingKyc = (db.prepare("SELECT COUNT(*) as c FROM users WHERE kyc_status = 'pending'").get() as { c: number }).c
  const pendingProducts = (db.prepare("SELECT COUNT(*) as c FROM products WHERE moderation_status = 'pending'").get() as { c: number }).c
  const sellers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'seller'").get() as { c: number }).c
  const buyers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'buyer'").get() as { c: number }).c
  const recentOrders = db.prepare("SELECT created_at, total FROM orders ORDER BY created_at DESC LIMIT 30").all() as { created_at: string; total: number }[]
  const revenueByDay = recentOrders.reduce<Record<string, number>>((acc, o) => {
    const day = o.created_at.slice(0, 10)
    acc[day] = (acc[day] ?? 0) + o.total
    return acc
  }, {})
  const revenueChart = Object.entries(revenueByDay).map(([date, rev]) => ({ date, rev: parseFloat(rev.toFixed(2)) })).sort((a, b) => a.date.localeCompare(b.date))
  res.json({ users, products, orders, revenue: parseFloat(revenue.toFixed(2)), pendingKyc, pendingProducts, sellers, buyers, revenueChart })
})

router.get('/users', authenticate, requireAdmin, (req, res) => {
  const { page = '1', limit = '50', role, q, kyc_status } = req.query as Record<string, string>
  let sql = 'SELECT id, name, email, role, kyc_status, country, banned, created_at FROM users WHERE 1=1'
  const params: (string | number)[] = []
  if (role) { sql += ' AND role = ?'; params.push(role) }
  if (kyc_status) { sql += ' AND kyc_status = ?'; params.push(kyc_status) }
  if (q) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  const p = Math.max(1, parseInt(page)), l = Math.min(100, parseInt(limit))
  params.push(l, (p - 1) * l)
  const total = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  res.json({ users: db.prepare(sql).all(...params), total })
})

router.patch('/users/:id', authenticate, requireAdmin, (req, res) => {
  const { role, kyc_status, banned } = req.body as { role?: string; kyc_status?: string; banned?: boolean }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return }
  if (role && ['buyer', 'seller', 'admin'].includes(role))
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id)
  if (kyc_status && ['unverified', 'pending', 'verified', 'rejected'].includes(kyc_status))
    db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').run(kyc_status, req.params.id)
  if (banned !== undefined)
    db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(banned ? 1 : 0, req.params.id)
  res.json({ message: 'Güncellendi' })
})

router.delete('/users/:id', authenticate, requireAdmin, (req: AuthRequest, res) => {
  if (req.params.id === req.user!.id) { res.status(400).json({ error: 'Kendinizi silemezsiniz' }); return }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ message: 'Silindi' })
})

router.get('/products', authenticate, requireAdmin, (req, res) => {
  const { status, q } = req.query as { status?: string; q?: string }
  let sql = 'SELECT p.*, u.name as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE 1=1'
  const params: string[] = []
  if (status) { sql += ' AND p.moderation_status = ?'; params.push(status) }
  if (q) { sql += ' AND (p.title LIKE ? OR p.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  sql += ' ORDER BY p.created_at DESC LIMIT 100'
  res.json(db.prepare(sql).all(...params))
})

router.patch('/products/:id', authenticate, requireAdmin, (req, res) => {
  const { moderation_status } = req.body as { moderation_status: string }
  if (!['approved', 'rejected', 'pending'].includes(moderation_status)) {
    res.status(400).json({ error: 'Geçersiz durum' }); return
  }
  db.prepare('UPDATE products SET moderation_status = ? WHERE id = ?').run(moderation_status, req.params.id)
  res.json({ message: 'Güncellendi' })
})

router.delete('/products/:id', authenticate, requireAdmin, (_req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(_req.params.id)
  res.json({ message: 'Silindi' })
})

router.get('/orders', authenticate, requireAdmin, (req, res) => {
  const { q, status } = req.query as { q?: string; status?: string }
  let sql = 'SELECT * FROM orders WHERE 1=1'
  const params: string[] = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (q) { sql += ' AND (id LIKE ? OR buyer_id LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  sql += ' ORDER BY created_at DESC LIMIT 200'
  const orders = db.prepare(sql).all(...params) as { items: string; address: string | null }[]
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items), address: o.address ? JSON.parse(o.address) : null })))
})

router.patch('/orders/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body as { status: string }
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  if (!valid.includes(status)) { res.status(400).json({ error: 'Geçersiz durum' }); return }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ message: 'Güncellendi' })
})

router.get('/sellers', authenticate, requireAdmin, (_req, res) => {
  const sellers = db.prepare(`
    SELECT s.*, u.name as owner_name, u.email as owner_email,
      (SELECT COUNT(*) FROM products WHERE seller_id = s.id) as product_count,
      (SELECT COUNT(DISTINCT order_id) FROM order_items WHERE seller_id = s.id) as order_count,
      (SELECT COALESCE(SUM(price * qty), 0) FROM order_items WHERE seller_id = s.id) as total_revenue
    FROM sellers s
    JOIN users u ON u.id = s.id
    ORDER BY s.created_at DESC
  `).all()
  res.json(sellers)
})

router.patch('/sellers/:id', authenticate, requireAdmin, (req, res) => {
  const { status, commission_rate } = req.body as { status?: string; commission_rate?: number }
  const updates: string[] = []
  const values: unknown[] = []
  if (status && ['pending', 'active', 'suspended'].includes(status)) {
    updates.push('status = ?'); values.push(status)
  }
  if (typeof commission_rate === 'number' && commission_rate >= 0 && commission_rate <= 1) {
    updates.push('commission_rate = ?'); values.push(commission_rate)
  }
  if (updates.length === 0) { res.status(400).json({ error: 'No valid fields' }); return }
  db.prepare(`UPDATE sellers SET ${updates.join(', ')} WHERE id = ?`).run(...values, req.params.id)
  res.json(db.prepare('SELECT * FROM sellers WHERE id = ?').get(req.params.id))
})

export default router
