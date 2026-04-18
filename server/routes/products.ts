import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { authenticate, type AuthRequest } from '../middleware/authenticate.js'

const router = Router()

router.get('/', (req, res) => {
  const { q, category, minPrice, maxPrice, page = '1', limit = '20' } = req.query as Record<string, string>
  let sql = 'SELECT * FROM products WHERE 1=1'
  const params: (string | number)[] = []

  if (q) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR brand LIKE ?)'
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (category) { sql += ' AND category_id = ?'; params.push(category) }
  if (minPrice) { sql += ' AND price >= ?'; params.push(Number(minPrice)) }
  if (maxPrice) { sql += ' AND price <= ?'; params.push(Number(maxPrice)) }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, parseInt(limit))
  params.push(limitNum, (pageNum - 1) * limitNum)

  const products = db.prepare(sql).all(...params)
  res.json({ products, page: pageNum })
})

router.get('/seller/mine', authenticate, (req: AuthRequest, res) => {
  const products = db
    .prepare('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC')
    .all(req.user!.id)
  res.json(products)
})

router.get('/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug)
  if (!product) { res.status(404).json({ error: 'Ürün bulunamadı' }); return }
  res.json(product)
})

const ProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  old_price: z.number().positive().optional(),
  currency: z.string().default('USD'),
  stock: z.number().int().min(0).default(0),
  category_id: z.string().optional(),
  brand: z.string().optional(),
  origin_country: z.string().optional(),
  hs_code: z.string().optional(),
  images: z.array(z.string()).default([]),
})

router.post('/', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'seller' && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Sadece satıcılar ürün ekleyebilir' })
    return
  }

  const parsed = ProductSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }

  const { title, images, ...rest } = parsed.data
  const id = randomUUID()
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 8)

  db.prepare(`
    INSERT INTO products (id, seller_id, title, slug, description, price, old_price, currency, stock, category_id, brand, origin_country, hs_code, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, title, slug, rest.description ?? null, rest.price, rest.old_price ?? null,
    rest.currency, rest.stock, rest.category_id ?? null, rest.brand ?? null,
    rest.origin_country ?? null, rest.hs_code ?? null, JSON.stringify(images))

  res.status(201).json({ id, slug })
})

router.put('/:id', authenticate, (req: AuthRequest, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as { seller_id: string } | undefined
  if (!product) { res.status(404).json({ error: 'Ürün bulunamadı' }); return }
  if (product.seller_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Bu ürünü düzenleme yetkiniz yok' }); return
  }

  const parsed = ProductSchema.partial().safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return }

  const { images, ...rest } = parsed.data
  const updates = Object.entries({ ...rest, images: images ? JSON.stringify(images) : undefined })
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`)
    .join(', ')

  if (!updates) { res.json({ message: 'Değişiklik yok' }); return }

  const values = Object.entries({ ...rest, images: images ? JSON.stringify(images) : undefined })
    .filter(([, v]) => v !== undefined)
    .map(([, v]) => v)

  db.prepare(`UPDATE products SET ${updates} WHERE id = ?`).run(...values, req.params.id)
  res.json({ message: 'Güncellendi' })
})

router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as { seller_id: string } | undefined
  if (!product) { res.status(404).json({ error: 'Ürün bulunamadı' }); return }
  if (product.seller_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Bu ürünü silme yetkiniz yok' }); return
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ message: 'Silindi' })
})

export default router
