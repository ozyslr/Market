import { Router } from 'express'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router()

router.get('/', authenticate, (req: AuthRequest, res) => {
  const rows = db.prepare(`
    SELECT p.* FROM wishlists w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).all(req.user!.id)
  res.json({ products: rows })
})

router.get('/ids', authenticate, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT product_id FROM wishlists WHERE user_id = ?').all(req.user!.id) as { product_id: string }[]
  res.json({ ids: rows.map(r => r.product_id) })
})

router.post('/:productId', authenticate, (req: AuthRequest, res) => {
  const { productId } = req.params
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
  if (!product) { res.status(404).json({ error: 'Ürün bulunamadı' }); return }
  try {
    db.prepare('INSERT INTO wishlists (id, user_id, product_id) VALUES (?, ?, ?)')
      .run(randomUUID(), req.user!.id, productId)
    res.status(201).json({ added: true })
  } catch {
    res.status(409).json({ error: 'Zaten favorilerde' })
  }
})

router.delete('/:productId', authenticate, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?')
    .run(req.user!.id, req.params.productId)
  res.json({ removed: true })
})

export default router
