import { describe, it, expect } from 'vitest'
import { createTestDb } from './setup.js'
import { randomUUID } from 'crypto'

describe('order_items table', () => {
  it('inserts order items with correct fields', () => {
    const db = createTestDb()
    const sellerId = randomUUID()
    const productId = randomUUID()
    const orderId = randomUUID()
    const itemId = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(sellerId, 'Seller', 's@t.com', 'x', 'seller')
    db.prepare('INSERT INTO products (id, seller_id, title, slug, price) VALUES (?, ?, ?, ?, ?)').run(productId, sellerId, 'Test Product', 'test-product', 29.99)
    db.prepare('INSERT INTO orders (id, buyer_id, items, total) VALUES (?, ?, ?, ?)').run(orderId, randomUUID(), '[]', 59.98)
    db.prepare('INSERT INTO order_items (id, order_id, product_id, seller_id, qty, price, commission, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(itemId, orderId, productId, sellerId, 2, 29.99, 3.0, 'Test Product')

    const items = db.prepare('SELECT * FROM order_items WHERE seller_id = ?').all(sellerId) as { qty: number; commission: number }[]
    expect(items.length).toBe(1)
    expect(items[0].qty).toBe(2)
    expect(items[0].commission).toBe(3.0)
  })

  it('seller analytics sums revenue from order_items', () => {
    const db = createTestDb()
    const sellerId = randomUUID()
    const productId = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(sellerId, 'S', 's2@t.com', 'x', 'seller')
    db.prepare('INSERT INTO products (id, seller_id, title, slug, price) VALUES (?, ?, ?, ?, ?)').run(productId, sellerId, 'P', 'p', 10.00)
    for (let i = 0; i < 3; i++) {
      const orderId = randomUUID()
      db.prepare('INSERT INTO orders (id, buyer_id, items, total) VALUES (?, ?, ?, ?)').run(orderId, randomUUID(), '[]', 10.00)
      db.prepare('INSERT INTO order_items (id, order_id, product_id, seller_id, qty, price, commission, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), orderId, productId, sellerId, 1, 10.00, 1.00, 'P')
    }
    const result = db.prepare('SELECT SUM(price * qty) as revenue FROM order_items WHERE seller_id = ?').get(sellerId) as { revenue: number }
    expect(result.revenue).toBe(30.00)
  })
})
