import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

export const addressesRouter = Router()

const AddressSchema = z.object({
  full_name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  postcode: z.string().min(1),
  country: z.string().length(2).default('GB'),
  phone: z.string().optional().nullable(),
  is_default: z.boolean().optional(),
})

addressesRouter.get('/', authenticate, (req: AuthRequest, res) => {
  const addresses = db.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
  ).all(req.user!.id)
  res.json(addresses)
})

addressesRouter.post('/', authenticate, (req: AuthRequest, res) => {
  const result = AddressSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })

  const id = randomUUID()
  const { full_name, line1, line2, city, postcode, country, phone, is_default } = result.data

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user!.id)
  }

  db.prepare(
    'INSERT INTO addresses (id, user_id, full_name, line1, line2, city, postcode, country, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user!.id, full_name, line1, line2 ?? null, city, postcode, country, phone ?? null, is_default ? 1 : 0)

  res.status(201).json(db.prepare('SELECT * FROM addresses WHERE id = ?').get(id))
})

addressesRouter.patch('/:id', authenticate, (req: AuthRequest, res) => {
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id)
  if (!addr) return res.status(404).json({ error: 'Address not found' })

  const result = AddressSchema.partial().safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })

  const fields = Object.entries(result.data).filter(([k, v]) => k !== 'is_default' && v !== undefined)
  if (fields.length > 0) {
    const setClauses = fields.map(([k]) => `${k} = ?`).join(', ')
    db.prepare(`UPDATE addresses SET ${setClauses} WHERE id = ?`).run(...fields.map(([, v]) => v), req.params.id)
  }

  res.json(db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id))
})

addressesRouter.patch('/:id/default', authenticate, (req: AuthRequest, res) => {
  const addr = db.prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id)
  if (!addr) return res.status(404).json({ error: 'Address not found' })

  db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user!.id)
  db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

addressesRouter.delete('/:id', authenticate, (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Address not found' })
  res.json({ success: true })
})

export default addressesRouter
