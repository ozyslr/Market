import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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

dotenv.config()

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

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Mercora API → http://localhost:${PORT}`)
})
