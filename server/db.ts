import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, '..', 'mercora.db'))

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
    currency TEXT NOT NULL DEFAULT 'USD',
    stock INTEGER NOT NULL DEFAULT 0,
    category_id TEXT,
    brand TEXT,
    origin_country TEXT,
    hs_code TEXT,
    images TEXT DEFAULT '[]',
    rating REAL DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('percentage','fixed')),
    value REAL NOT NULL,
    min_order REAL DEFAULT 0,
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    expires_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(product_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id)
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
`)

const migrations = [
  `ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'unverified'`,
  `ALTER TABLE products ADD COLUMN moderation_status TEXT DEFAULT 'approved'`,
  `ALTER TABLE orders ADD COLUMN payment_intent_id TEXT`,
  `ALTER TABLE users ADD COLUMN firebase_uid TEXT`,
  `ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0`,
  `INSERT OR IGNORE INTO sellers (id, store_name, slug)
   SELECT id, name, lower(replace(replace(name,' ','-'),'''','')) || '-' || substr(id,1,6)
   FROM users WHERE role = 'seller'`,
  `INSERT OR IGNORE INTO order_items (id, order_id, product_id, seller_id, qty, price, commission, title, image)
   SELECT
     hex(randomblob(16)),
     o.id,
     json_extract(item.value, '$.productId'),
     COALESCE((SELECT seller_id FROM products WHERE id = json_extract(item.value, '$.productId')), 'unknown'),
     json_extract(item.value, '$.quantity'),
     json_extract(item.value, '$.price'),
     ROUND(json_extract(item.value, '$.price') * json_extract(item.value, '$.quantity') * 0.10, 2),
     json_extract(item.value, '$.title'),
     json_extract(item.value, '$.image')
   FROM orders o, json_each(o.items) AS item
   WHERE json_valid(o.items)`,
]

for (const sql of migrations) {
  try { db.exec(sql) } catch { /* column already exists */ }
}

export default db
