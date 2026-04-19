import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, '..', 'mercora.db'))
db.pragma('journal_mode = WAL')

const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }
if (existing.cnt > 0) {
  console.log('Database already seeded. Run with --force to reseed.')
  if (!process.argv.includes('--force')) process.exit(0)
}

console.log('Seeding Mercora database...')

// ─── Sellers ───────────────────────────────────────────────────────────────

const sellers = [
  { id: randomUUID(), name: 'TechNova UK', email: 'technova@mercora.com', password: 'seller123', country: 'GB' },
  { id: randomUUID(), name: 'Artisan Home Co.', email: 'artisanhome@mercora.com', password: 'seller123', country: 'TR' },
  { id: randomUUID(), name: 'Glow Beauty Lab', email: 'glowbeauty@mercora.com', password: 'seller123', country: 'FR' },
  { id: randomUUID(), name: 'OutdoorPro', email: 'outdoorpro@mercora.com', password: 'seller123', country: 'DE' },
]

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, password_hash, role, country, currency)
  VALUES (?, ?, ?, ?, 'seller', ?, 'GBP')
`)

const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, password_hash, role, country, currency)
  VALUES (?, ?, ?, ?, 'admin', 'GB', 'GBP')
`)

// Admin account
const adminId = randomUUID()
insertAdmin.run(adminId, 'Mercora Admin', 'admin@mercora.com', bcrypt.hashSync('admin123', 10))
console.log('✓ Admin created: admin@mercora.com / admin123')

for (const s of sellers) {
  insertUser.run(s.id, s.name, s.email, bcrypt.hashSync(s.password, 10), s.country)
}
console.log(`✓ ${sellers.length} sellers created`)

// ─── Demo buyer ────────────────────────────────────────────────────────────

const buyerId = randomUUID()
db.prepare(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role, country, currency)
  VALUES (?, 'Demo Buyer', 'buyer@mercora.com', ?, 'buyer', 'GB', 'GBP')`)
  .run(buyerId, bcrypt.hashSync('buyer123', 10))
console.log('✓ Buyer created: buyer@mercora.com / buyer123')

// ─── Products ──────────────────────────────────────────────────────────────

const [tech, artisan, glow, outdoor] = sellers

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products
    (id, seller_id, title, slug, description, price, old_price, currency, stock, category_id, brand, origin_country, hs_code, images, rating, reviews_count)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, 'GBP', ?, ?, ?, ?, ?, ?, ?, ?)
`)

const products = [
  // Electronics
  {
    sellerId: tech.id, title: 'AuraAudio Pro X Headphones', slug: 'auraaudio-pro-x',
    desc: 'Studio-grade wireless headphones with 40-hour battery and active noise cancellation. Precision-crafted in the UK.',
    price: 249.99, oldPrice: 299.99, stock: 45, cat: 'electronics', brand: 'AuraAudio',
    origin: 'GB', hs: '8518300000', rating: 4.8, reviews: 127,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600']
  },
  {
    sellerId: tech.id, title: 'PixelPad Ultra Tablet', slug: 'pixelpad-ultra',
    desc: '12-inch AMOLED display tablet with stylus support. Perfect for creatives and professionals.',
    price: 599.99, oldPrice: 699.99, stock: 20, cat: 'electronics', brand: 'PixelPad',
    origin: 'GB', hs: '8471300000', rating: 4.6, reviews: 89,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600']
  },
  {
    sellerId: tech.id, title: 'NovaDrive SSD 2TB', slug: 'novadrive-ssd-2tb',
    desc: 'Ultra-fast NVMe SSD with 7000MB/s read speeds. 5-year warranty included.',
    price: 149.99, oldPrice: 179.99, stock: 100, cat: 'electronics', brand: 'NovaDrive',
    origin: 'DE', hs: '8471700000', rating: 4.9, reviews: 312,
    images: ['https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=600']
  },
  {
    sellerId: tech.id, title: 'LumiWatch Pro Smart Watch', slug: 'lumiwatch-pro',
    desc: 'Health monitoring smartwatch with ECG, SpO2, and 14-day battery life.',
    price: 299.99, oldPrice: null, stock: 35, cat: 'electronics', brand: 'LumiWatch',
    origin: 'GB', hs: '9102120000', rating: 4.5, reviews: 201,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600']
  },
  {
    sellerId: tech.id, title: 'CrystalCam 4K Action Camera', slug: 'crystalcam-4k',
    desc: 'Waterproof 4K action camera with image stabilization. Perfect for adventure sports.',
    price: 189.99, oldPrice: 229.99, stock: 60, cat: 'electronics', brand: 'CrystalCam',
    origin: 'JP', hs: '8525800000', rating: 4.7, reviews: 156,
    images: ['https://images.unsplash.com/photo-1502920917128-1aa500764bee?w=600']
  },

  // Home & Living
  {
    sellerId: artisan.id, title: 'Anatolian Ceramic Coffee Set', slug: 'anatolian-ceramic-set',
    desc: 'Hand-painted traditional ceramic coffee set, 6 cups. Authentic Ottoman craftsmanship from Istanbul.',
    price: 89.99, oldPrice: 110.00, stock: 25, cat: 'home', brand: 'Artisan Home Co.',
    origin: 'TR', hs: '6912002300', rating: 4.9, reviews: 78,
    images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600']
  },
  {
    sellerId: artisan.id, title: 'Bamboo Bedding Set King', slug: 'bamboo-bedding-king',
    desc: 'Organic bamboo 400TC bedding set. Temperature regulating, hypoallergenic, eco-friendly.',
    price: 129.99, oldPrice: 159.99, stock: 40, cat: 'home', brand: 'Artisan Home Co.',
    origin: 'TR', hs: '6302210000', rating: 4.7, reviews: 203,
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600']
  },
  {
    sellerId: artisan.id, title: 'Copper Ottoman Tray', slug: 'copper-ottoman-tray',
    desc: 'Hand-hammered copper serving tray with ebony handles. Timeless Turkish craftsmanship.',
    price: 64.99, oldPrice: null, stock: 15, cat: 'home', brand: 'Artisan Home Co.',
    origin: 'TR', hs: '7418200000', rating: 4.8, reviews: 45,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600']
  },
  {
    sellerId: artisan.id, title: 'Kilim Throw Cushion 4-Pack', slug: 'kilim-cushions',
    desc: 'Authentic woven kilim pattern cushion covers. Mix of geometric designs, 50x50cm.',
    price: 79.99, oldPrice: 95.00, stock: 50, cat: 'home', brand: 'Artisan Home Co.',
    origin: 'TR', hs: '9404900000', rating: 4.6, reviews: 112,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600']
  },
  {
    sellerId: artisan.id, title: 'Oak Kitchen Knife Block Set', slug: 'oak-knife-block',
    desc: 'Professional 7-piece kitchen knife set with solid oak block. Japanese steel blades.',
    price: 199.99, oldPrice: 249.99, stock: 18, cat: 'home', brand: 'Artisan Home Co.',
    origin: 'JP', hs: '8211920000', rating: 4.9, reviews: 88,
    images: ['https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600']
  },

  // Beauty & Lifestyle
  {
    sellerId: glow.id, title: 'Rosehip Radiance Serum 50ml', slug: 'rosehip-radiance-serum',
    desc: 'Organic rosehip oil serum with vitamin C. Fades scars and evens skin tone. Dermatologist tested.',
    price: 39.99, oldPrice: 49.99, stock: 200, cat: 'beauty', brand: 'Glow Beauty Lab',
    origin: 'FR', hs: '3304990000', rating: 4.8, reviews: 445,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600']
  },
  {
    sellerId: glow.id, title: 'Lavender Sleep Ritual Set', slug: 'lavender-sleep-set',
    desc: 'Complete sleep ritual kit: pillow spray, body lotion, eye mask. Sustainably packaged.',
    price: 59.99, oldPrice: 74.99, stock: 80, cat: 'beauty', brand: 'Glow Beauty Lab',
    origin: 'FR', hs: '3307900000', rating: 4.7, reviews: 189,
    images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600']
  },
  {
    sellerId: glow.id, title: 'Charcoal Detox Face Mask', slug: 'charcoal-detox-mask',
    desc: 'Deep pore cleansing charcoal mask with kaolin clay. 200ml, 30 applications.',
    price: 24.99, oldPrice: null, stock: 150, cat: 'beauty', brand: 'Glow Beauty Lab',
    origin: 'FR', hs: '3304990000', rating: 4.5, reviews: 267,
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600']
  },
  {
    sellerId: glow.id, title: 'Vitamin C Brightening Eye Cream', slug: 'vitamin-c-eye-cream',
    desc: 'Targets dark circles and puffiness. Triple vitamin C complex with retinol. 30ml.',
    price: 44.99, oldPrice: 54.99, stock: 120, cat: 'beauty', brand: 'Glow Beauty Lab',
    origin: 'FR', hs: '3304990000', rating: 4.6, reviews: 321,
    images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600']
  },

  // Sport & Outdoor
  {
    sellerId: outdoor.id, title: 'TrailMaster Hiking Backpack 65L', slug: 'trailmaster-backpack-65l',
    desc: 'Professional alpine backpack with hydration system and rain cover. 65L, 1.4kg.',
    price: 159.99, oldPrice: 199.99, stock: 30, cat: 'sport-outdoor', brand: 'OutdoorPro',
    origin: 'DE', hs: '4202120000', rating: 4.8, reviews: 134,
    images: ['https://images.unsplash.com/photo-1622260614927-4aeab6bd1803?w=600']
  },
  {
    sellerId: outdoor.id, title: 'Carbon Fibre Trekking Poles', slug: 'carbon-trekking-poles',
    desc: 'Ultralight carbon fibre poles, 190g/pair. Anti-shock system and cork grips.',
    price: 89.99, oldPrice: 109.99, stock: 55, cat: 'sport-outdoor', brand: 'OutdoorPro',
    origin: 'DE', hs: '9506910000', rating: 4.7, reviews: 97,
    images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600']
  },
  {
    sellerId: outdoor.id, title: 'Merino Wool Base Layer Set', slug: 'merino-base-layer',
    desc: '100% New Zealand merino wool. Temperature regulating, odour resistant. S-XXL.',
    price: 119.99, oldPrice: 149.99, stock: 75, cat: 'sport-outdoor', brand: 'OutdoorPro',
    origin: 'NZ', hs: '6109909000', rating: 4.9, reviews: 211,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600']
  },
  {
    sellerId: outdoor.id, title: 'UltraLight Sleeping Bag -10°C', slug: 'ultralight-sleeping-bag',
    desc: '800-fill down sleeping bag rated to -10°C. Packs to 18cm. 950g.',
    price: 229.99, oldPrice: 279.99, stock: 22, cat: 'sport-outdoor', brand: 'OutdoorPro',
    origin: 'DE', hs: '9404300000', rating: 4.8, reviews: 76,
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600']
  },
]

const seedProducts = db.transaction(() => {
  for (const p of products) {
    insertProduct.run(
      randomUUID(), p.sellerId, p.title, p.slug, p.desc,
      p.price, p.oldPrice ?? null, p.stock, p.cat,
      p.brand, p.origin, p.hs,
      JSON.stringify(p.images), p.rating, p.reviews
    )
  }
})

seedProducts()
console.log(`✓ ${products.length} products created`)

// ─── Demo coupon ───────────────────────────────────────────────────────────

db.prepare(`INSERT OR IGNORE INTO coupons (id, code, type, value, min_order, usage_limit, used_count)
  VALUES (?, 'WELCOME10', 'fixed', 10, 50, 1000, 0)`)
  .run(randomUUID())

db.prepare(`INSERT OR IGNORE INTO coupons (id, code, type, value, min_order, usage_limit, used_count)
  VALUES (?, 'SUMMER20', 'percentage', 20, 100, 500, 0)`)
  .run(randomUUID())

console.log('✓ Coupons created: WELCOME10 (£10 off £50+), SUMMER20 (20% off £100+)')

console.log('\n=== Seed complete ===')
console.log('Admin:  admin@mercora.com  / admin123')
console.log('Buyer:  buyer@mercora.com  / buyer123')
console.log('Seller: technova@mercora.com / seller123')
