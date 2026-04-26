import { Router } from 'express'
import { z } from 'zod'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

export const sellersRouter = Router()

const SellerSchema = z.object({
  store_name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug only lowercase letters, numbers, hyphens'),
  logo: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
})

sellersRouter.get('/me', authenticate, (req: AuthRequest, res) => {
  const seller = db.prepare('SELECT * FROM sellers WHERE id = ?').get(req.user!.id)
  if (!seller) return res.status(404).json({ error: 'Seller profile not found' })
  res.json(seller)
})

sellersRouter.get('/:idOrSlug', (req, res) => {
  const { idOrSlug } = req.params
  const seller = db.prepare(
    `SELECT s.*, u.name as owner_name, u.email as owner_email
     FROM sellers s JOIN users u ON u.id = s.id
     WHERE s.id = ? OR s.slug = ?`
  ).get(idOrSlug, idOrSlug)
  if (!seller) return res.status(404).json({ error: 'Seller not found' })
  res.json(seller)
})

sellersRouter.post('/onboard', authenticate, (req: AuthRequest, res) => {
  const user = req.user!
  if (user.role !== 'seller' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only sellers can onboard' })
  }
  const result = SellerSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })

  const existing = db.prepare('SELECT id FROM sellers WHERE id = ?').get(user.id)
  if (existing) return res.status(409).json({ error: 'Seller profile already exists' })

  const slugTaken = db.prepare('SELECT id FROM sellers WHERE slug = ? AND id != ?').get(result.data.slug, user.id)
  if (slugTaken) return res.status(409).json({ error: 'Slug already taken' })

  db.prepare(
    'INSERT INTO sellers (id, store_name, slug, logo, banner, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(user.id, result.data.store_name, result.data.slug, result.data.logo ?? null, result.data.banner ?? null, result.data.description ?? null)

  res.status(201).json(db.prepare('SELECT * FROM sellers WHERE id = ?').get(user.id))
})

sellersRouter.patch('/:id', authenticate, (req: AuthRequest, res) => {
  const user = req.user!
  if (user.id !== req.params.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const result = SellerSchema.partial().safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })

  const fields = Object.entries(result.data).filter(([, v]) => v !== undefined)
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' })

  if (result.data.slug) {
    const slugTaken = db.prepare('SELECT id FROM sellers WHERE slug = ? AND id != ?').get(result.data.slug, req.params.id)
    if (slugTaken) return res.status(409).json({ error: 'Slug already taken' })
  }

  const setClauses = fields.map(([k]) => `${k} = ?`).join(', ')
  const values = fields.map(([, v]) => v)
  db.prepare(`UPDATE sellers SET ${setClauses} WHERE id = ?`).run(...values, req.params.id)
  res.json(db.prepare('SELECT * FROM sellers WHERE id = ?').get(req.params.id))
})

export default sellersRouter
