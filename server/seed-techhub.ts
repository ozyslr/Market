import db from './db.js'
import { randomUUID } from 'crypto'

const seller = db.prepare("SELECT id FROM users WHERE email = 'techhub@mercora.bot'").get() as { id: string } | undefined
if (!seller) { console.error('TechHub seller not found'); process.exit(1) }

const products = [
  { title: 'Sony WH-1000XM5 Wireless Headphones', slug: 'sony-wh1000xm5-techub', description: 'Industry-leading noise cancellation, 30-hour battery.', price: 299.99, oldPrice: 379.99, cat: 'electronics', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', stock: 45, rating: 4.9, rev: 2341, origin: 'JP', hs: '8518300090' },
  { title: 'Apple AirPods Pro 2nd Gen', slug: 'apple-airpods-pro-2-techub', description: 'Active noise cancellation, H2 chip, adaptive audio.', price: 229.99, oldPrice: 279.00, cat: 'electronics', img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600', stock: 78, rating: 4.8, rev: 5621, origin: 'CN', hs: '8518300090' },
  { title: 'Samsung 65 QLED 4K Smart TV', slug: 'samsung-65-qled-techub', description: 'Quantum HDR 12x, Neural Quantum Processor 4K, Alexa built-in.', price: 999.00, oldPrice: 1299.00, cat: 'electronics', img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600', stock: 12, rating: 4.7, rev: 892, origin: 'KR', hs: '8528720000' },
  { title: 'Logitech MX Master 3S Mouse', slug: 'logitech-mx-master-3s-techub', description: '8000 DPI MagSpeed electromagnetic scroll, USB-C charging.', price: 89.99, oldPrice: 109.99, cat: 'accessories', img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', stock: 120, rating: 4.8, rev: 3412, origin: 'CH', hs: '8471600000' },
  { title: 'iPad Pro 12.9 M2 256GB', slug: 'ipad-pro-m2-256gb-techub', description: 'Liquid Retina XDR display, ProRes video, Wi-Fi 6E.', price: 1099.00, oldPrice: null, cat: 'electronics', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600', stock: 25, rating: 4.9, rev: 1876, origin: 'CN', hs: '8471300000' },
  { title: 'Anker 20000mAh Power Bank', slug: 'anker-20000mah-techub', description: 'Ultra-high capacity 20W fast charging, USB-C and USB-A ports.', price: 49.99, oldPrice: 69.99, cat: 'accessories', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600', stock: 200, rating: 4.7, rev: 7832, origin: 'CN', hs: '8507600000' },
  { title: 'Mechanical Keyboard TKL RGB', slug: 'mechanical-keyboard-rgb-techub', description: 'Hot-swappable Cherry MX switches, aluminium frame, PBT keycaps.', price: 149.99, oldPrice: 179.99, cat: 'accessories', img: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600', stock: 60, rating: 4.6, rev: 1203, origin: 'CN', hs: '8471600000' },
  { title: 'GoPro HERO12 Black', slug: 'gopro-hero12-techub', description: '5.3K60 video, HyperSmooth 6.0, waterproof.', price: 349.99, oldPrice: 399.99, cat: 'electronics', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600', stock: 38, rating: 4.8, rev: 2109, origin: 'US', hs: '8525800000' },
]

const stmt = db.prepare(`INSERT OR IGNORE INTO products
  (id, seller_id, title, slug, description, price, old_price, currency, stock, category_id, origin_country, hs_code, rating, reviews_count, images)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'GBP', ?, ?, ?, ?, ?, ?, ?)`)

let n = 0
for (const p of products) {
  const r = stmt.run(randomUUID(), seller.id, p.title, p.slug, p.description, p.price, p.oldPrice, p.stock, p.cat, p.origin, p.hs, p.rating, p.rev, JSON.stringify([p.img]))
  if (r.changes > 0) n++
}
console.log(`Inserted ${n} TechHub products for seller ${seller.id}`)
