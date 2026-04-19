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
  res.json({ users, products, orders, revenue, pendingKyc, pendingProducts })
})

router.get('/users', authenticate, requireAdmin, (req, res) => {
  const { page = '1', limit = '20', role } = req.query as Record<string, string>
  let sql = 'SELECT id, name, email, role, kyc_status, country, created_at FROM users WHERE 1=1'
  const params: (string | number)[] = []
  if (role) { sql += ' AND role = ?'; params.push(role) }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  const p = Math.max(1, parseInt(page)), l = Math.min(100, parseInt(limit))
  params.push(l, (p - 1) * l)
  res.json(db.prepare(sql).all(...params))
})

router.patch('/users/:id', authenticate, requireAdmin, (req, res) => {
  const { role, kyc_status } = req.body as { role?: string; kyc_status?: string }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return }
  if (role && ['buyer', 'seller', 'admin'].includes(role))
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id)
  if (kyc_status && ['unverified', 'pending', 'verified', 'rejected'].includes(kyc_status))
    db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').run(kyc_status, req.params.id)
  res.json({ message: 'Güncellendi' })
})

router.get('/products', authenticate, requireAdmin, (req, res) => {
  const { status } = req.query as { status?: string }
  let sql = 'SELECT * FROM products WHERE 1=1'
  const params: string[] = []
  if (status) { sql += ' AND moderation_status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC LIMIT 50'
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

router.get('/orders', authenticate, requireAdmin, (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all()
  res.json(orders)
})

export default router
