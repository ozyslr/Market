import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import uploadRoutes from './routes/upload.js'
import couponRoutes from './routes/coupons.js'
import reviewRoutes from './routes/reviews.js'
import adminRoutes from './routes/admin.js'
import wishlistRoutes from './routes/wishlist.js'
import paymentRoutes from './routes/payments.js'
import webhookRoutes from './routes/webhooks.js'
import sellersRoutes from './routes/sellers.js'
import addressesRoutes from './routes/addresses.js'
import db from './db.js'



const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }))

// Stripe webhook must use raw body before express.json() is applied
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRoutes)

app.use(express.json())

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/payments', paymentRoutes)

app.use('/api/sellers', sellersRoutes)
app.use('/api/addresses', addressesRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain')
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /admin',
    'Sitemap: https://mercora.co.uk/sitemap.xml',
  ].join('\n'))
})

app.get('/sitemap.xml', (_req, res) => {
  const products = db.prepare(
    "SELECT slug, created_at FROM products WHERE moderation_status = 'approved' LIMIT 5000"
  ).all() as { slug: string; created_at: string }[]
  const staticUrls = [
    { loc: 'https://mercora.co.uk/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://mercora.co.uk/search', priority: '0.8', changefreq: 'daily' },
  ]
  const toUrl = ({ loc, priority, changefreq }: { loc: string; priority: string; changefreq: string }) =>
    `<url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
  const productUrls = products.map(p =>
    `<url><loc>https://mercora.co.uk/product/${p.slug}</loc><lastmod>${p.created_at.slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`
  )
  res.type('application/xml')
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls.map(toUrl).join('')}${productUrls.join('')}</urlset>`
  )
})

app.listen(PORT, () => {
  console.log(`Mercora API → http://localhost:${PORT}`)
})
