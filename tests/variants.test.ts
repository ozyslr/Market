import { describe, it, expect } from 'vitest'
import { createTestDb } from './setup.js'
import { randomUUID } from 'crypto'

describe('variants table', () => {
  it('stores variants with size and color', () => {
    const db = createTestDb()
    const sellerId = randomUUID()
    const productId = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(sellerId, 'S', 's@t.com', 'x', 'seller')
    db.prepare('INSERT INTO products (id, seller_id, title, slug, price) VALUES (?, ?, ?, ?, ?)').run(productId, sellerId, 'T-Shirt', 't-shirt', 19.99)
    db.prepare('INSERT INTO variants (id, product_id, label, size, color, price, stock) VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), productId, 'S / Red', 'S', 'Red', 19.99, 10)
    db.prepare('INSERT INTO variants (id, product_id, label, size, color, price, stock) VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), productId, 'L / Blue', 'L', 'Blue', 21.99, 5)

    const variants = db.prepare('SELECT * FROM variants WHERE product_id = ? ORDER BY price').all(productId) as { label: string; price: number }[]
    expect(variants.length).toBe(2)
    expect(variants[0].label).toBe('S / Red')
    expect(variants[1].price).toBe(21.99)
  })

  it('allows variant stock to be zero', () => {
    const db = createTestDb()
    const productId = randomUUID()
    const sellerId = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(sellerId, 'S', 's2@t.com', 'x')
    db.prepare('INSERT INTO products (id, seller_id, title, slug, price) VALUES (?, ?, ?, ?, ?)').run(productId, sellerId, 'Shoe', 'shoe', 50)
    db.prepare('INSERT INTO variants (id, product_id, label, price, stock) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), productId, 'Size 42', 50, 0)
    const v = db.prepare('SELECT stock FROM variants WHERE product_id = ?').get(productId) as { stock: number }
    expect(v.stock).toBe(0)
  })
})
