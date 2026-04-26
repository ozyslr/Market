import Database from 'better-sqlite3'

export function createTestDb() {
  const db = new Database(':memory:')
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'buyer',
      country TEXT DEFAULT 'GB',
      currency TEXT DEFAULT 'GBP',
      kyc_status TEXT DEFAULT 'unverified',
      banned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sellers (
      id TEXT PRIMARY KEY,
      store_name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo TEXT,
      banner TEXT,
      description TEXT,
      rating REAL DEFAULT 0,
      commission_rate REAL DEFAULT 0.10,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      postcode TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'GB',
      phone TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      old_price REAL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      stock INTEGER NOT NULL DEFAULT 0,
      category_id TEXT,
      brand TEXT,
      images TEXT DEFAULT '[]',
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      moderation_status TEXT DEFAULT 'approved',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sku TEXT,
      label TEXT NOT NULL,
      size TEXT,
      color TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      address TEXT,
      payment_intent_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      variant_id TEXT,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      commission REAL NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      image TEXT
    );
  `)
  return db
}
