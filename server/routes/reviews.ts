import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router()

interface ReviewRow {
  id: string
  user_name: string
  rating: number
  comment: string | null
  created_at: string
}

interface StatsRow {
  avg: number | null
  cnt: number
}

router.get('/:productId', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.productId) as ReviewRow[]
  res.json(reviews)
})

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

router.post('/:productId', authenticate, (req: AuthRequest, res) => {
  const parsed = ReviewSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }

  const existing = db.prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?')
    .get(req.params.productId, req.user!.id)
  if (existing) { res.status(409).json({ error: 'Bu ürünü zaten değerlendirdiniz' }); return }

  const id = randomUUID()
  db.prepare('INSERT INTO reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.productId, req.user!.id, parsed.data.rating, parsed.data.comment ?? null)

  const updateRating = db.transaction((productId: string) => {
    const stats = db.prepare(
      'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE product_id = ?'
    ).get(productId) as StatsRow
    db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?')
      .run(parseFloat((stats.avg ?? 0).toFixed(1)), stats.cnt, productId)
  })
  updateRating(req.params.productId)

  res.status(201).json({ id })
})

export default router
