import { describe, it, expect } from 'vitest'
import { createTestDb } from './setup.js'
import { randomUUID } from 'crypto'

describe('addresses table', () => {
  it('stores address and returns it', () => {
    const db = createTestDb()
    const userId = randomUUID()
    const addrId = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(userId, 'Test', 'test@t.com', 'x')
    db.prepare('INSERT INTO addresses (id, user_id, full_name, line1, city, postcode, country) VALUES (?, ?, ?, ?, ?, ?, ?)').run(addrId, userId, 'Test User', '10 High St', 'London', 'SW1A 1AA', 'GB')
    const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(addrId) as { city: string; is_default: number }
    expect(addr.city).toBe('London')
    expect(addr.is_default).toBe(0)
  })

  it('default address flag updates correctly', () => {
    const db = createTestDb()
    const userId = randomUUID()
    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(userId, 'U', 'u@t.com', 'x')
    const id1 = randomUUID()
    const id2 = randomUUID()
    db.prepare('INSERT INTO addresses (id, user_id, full_name, line1, city, postcode) VALUES (?, ?, ?, ?, ?, ?)').run(id1, userId, 'A', '1 St', 'Lon', 'W1')
    db.prepare('INSERT INTO addresses (id, user_id, full_name, line1, city, postcode) VALUES (?, ?, ?, ?, ?, ?)').run(id2, userId, 'B', '2 St', 'Man', 'M1')
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId)
    db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(id1)
    const defaults = db.prepare('SELECT id FROM addresses WHERE user_id = ? AND is_default = 1').all(userId) as { id: string }[]
    expect(defaults.length).toBe(1)
    expect(defaults[0].id).toBe(id1)
  })
})
