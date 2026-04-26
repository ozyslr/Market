import { describe, it, expect } from 'vitest'
import { createTestDb } from './setup.js'
import { randomUUID } from 'crypto'

describe('sellers table', () => {
  it('inserts and retrieves a seller', () => {
    const db = createTestDb()
    const id = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, 'Ali Veli', 'ali@test.com', 'x', 'seller')
    db.prepare('INSERT INTO sellers (id, store_name, slug) VALUES (?, ?, ?)').run(id, 'Ali Store', 'ali-store')
    const seller = db.prepare('SELECT * FROM sellers WHERE id = ?').get(id) as { store_name: string; commission_rate: number }
    expect(seller.store_name).toBe('Ali Store')
    expect(seller.commission_rate).toBe(0.10)
  })

  it('rejects duplicate slug', () => {
    const db = createTestDb()
    const id1 = randomUUID()
    const id2 = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id1, 'A', 'a@t.com', 'x', 'seller')
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id2, 'B', 'b@t.com', 'x', 'seller')
    db.prepare('INSERT INTO sellers (id, store_name, slug) VALUES (?, ?, ?)').run(id1, 'Store A', 'same-slug')
    expect(() => db.prepare('INSERT INTO sellers (id, store_name, slug) VALUES (?, ?, ?)').run(id2, 'Store B', 'same-slug')).toThrow()
  })
})
