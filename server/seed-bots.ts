/**
 * Bot Seller Seeder — creates 4 AI seller accounts with product catalogs.
 * Run: npx tsx server/seed-bots.ts
 */
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import db from './db.js'

const BOT_SELLERS = [
  {
    name: 'TechHub UK',
    email: 'techhub@mercora.bot',
    password: 'bot-techHub-2026',
    bio: 'Premium electronics and accessories from London warehouse.',
  },
  {
    name: 'HomeStyle London',
    email: 'homestyle@mercora.bot',
    password: 'bot-homeStyle-2026',
    bio: 'Curated living room and home decor pieces shipped from UK.',
  },
  {
    name: 'SportGear Pro',
    email: 'sportgear@mercora.bot',
    password: 'bot-sportGear-2026',
    bio: 'Professional sportswear and outdoor equipment.',
  },
  {
    name: 'Glam Beauty Studio',
    email: 'glambeauty@mercora.bot',
    password: 'bot-glamBeauty-2026',
    bio: 'Luxury beauty and wellness products, EU-certified.',
  },
]

const BOT_PRODUCTS: Record<string, Array<{
  title: string; slug: string; description: string; price: number; oldPrice?: number
  category: string; images: string[]; stock: number; rating: number; reviewsCount: number
  originCountry: string; hsCode: string
}>> = {
  'techhub@mercora.bot': [
    {
      title: 'Sony WH-1000XM5 Wireless Headphones',
      slug: 'sony-wh1000xm5-headphones-techub',
      description: 'Industry-leading noise cancellation with 30-hour battery. Premium audio for professionals.',
      price: 299.99, oldPrice: 379.99,
      category: 'electronics',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
      stock: 45, rating: 4.9, reviewsCount: 2341,
      originCountry: 'JP', hsCode: '8518300090',
    },
    {
      title: 'Apple AirPods Pro (2nd Gen)',
      slug: 'apple-airpods-pro-2nd-techub',
      description: 'Active noise cancellation, transparency mode, H2 chip. Adaptive audio.',
      price: 229.99, oldPrice: 279.00,
      category: 'electronics',
      images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'],
      stock: 78, rating: 4.8, reviewsCount: 5621,
      originCountry: 'CN', hsCode: '8518300090',
    },
    {
      title: 'Samsung 65" QLED 4K Smart TV',
      slug: 'samsung-65-qled-4k-techub',
      description: 'Quantum HDR 12x, Neural Quantum Processor 4K, Alexa built-in.',
      price: 999.00, oldPrice: 1299.00,
      category: 'electronics',
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
      stock: 12, rating: 4.7, reviewsCount: 892,
      originCountry: 'KR', hsCode: '8528720000',
    },
    {
      title: 'Logitech MX Master 3S Mouse',
      slug: 'logitech-mx-master-3s-techub',
      description: '8000 DPI, MagSpeed electromagnetic scroll, USB-C charging.',
      price: 89.99, oldPrice: 109.99,
      category: 'accessories',
      images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
      stock: 120, rating: 4.8, reviewsCount: 3412,
      originCountry: 'CH', hsCode: '8471600000',
    },
    {
      title: 'iPad Pro 12.9" M2 Wi-Fi 256GB',
      slug: 'ipad-pro-129-m2-256gb-techub',
      description: 'Liquid Retina XDR display, ProRes video, Wi-Fi 6E, Apple Pencil 2 support.',
      price: 1099.00,
      category: 'electronics',
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
      stock: 25, rating: 4.9, reviewsCount: 1876,
      originCountry: 'CN', hsCode: '8471300000',
    },
    {
      title: 'Anker 20000mAh Power Bank',
      slug: 'anker-20000mah-powerbank-techub',
      description: 'Ultra-high capacity 20W fast charging, dual USB-C & USB-A ports.',
      price: 49.99, oldPrice: 69.99,
      category: 'accessories',
      images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600'],
      stock: 200, rating: 4.7, reviewsCount: 7832,
      originCountry: 'CN', hsCode: '8507600000',
    },
    {
      title: 'Mechanical Keyboard TKL RGB',
      slug: 'mechanical-keyboard-tkl-rgb-techub',
      description: 'Hot-swappable Cherry MX switches, aluminium frame, PBT keycaps.',
      price: 149.99, oldPrice: 179.99,
      category: 'accessories',
      images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600'],
      stock: 60, rating: 4.6, reviewsCount: 1203,
      originCountry: 'CN', hsCode: '8471600000',
    },
    {
      title: 'GoPro HERO12 Black',
      slug: 'gopro-hero12-black-techub',
      description: '5.3K60 video, HyperSmooth 6.0 stabilization, 27MP photos. Waterproof.',
      price: 349.99, oldPrice: 399.99,
      category: 'electronics',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600'],
      stock: 38, rating: 4.8, reviewsCount: 2109,
      originCountry: 'US', hsCode: '8525800000',
    },
  ],
  'homestyle@mercora.bot': [
    {
      title: 'Luxury Velvet Sofa 3-Seater',
      slug: 'luxury-velvet-sofa-3seater-homestyle',
      description: 'Premium velvet upholstery, solid oak legs, deep seat cushions. Available in 6 colours.',
      price: 899.00, oldPrice: 1200.00,
      category: 'living-room',
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
      stock: 8, rating: 4.8, reviewsCount: 431,
      originCountry: 'GB', hsCode: '9401610000',
    },
    {
      title: 'Marble Coffee Table Round',
      slug: 'marble-coffee-table-round-homestyle',
      description: 'Natural white Carrara marble top, brushed gold base. 90cm diameter.',
      price: 449.00, oldPrice: 599.00,
      category: 'living-room',
      images: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600'],
      stock: 15, rating: 4.7, reviewsCount: 287,
      originCountry: 'IT', hsCode: '9403200000',
    },
    {
      title: 'Linen Duvet Set King 400TC',
      slug: 'linen-duvet-set-king-400tc-homestyle',
      description: 'Pure Egyptian cotton, 400 thread count. Includes duvet cover + 2 pillowcases.',
      price: 89.99, oldPrice: 129.99,
      category: 'home',
      images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'],
      stock: 95, rating: 4.6, reviewsCount: 1891,
      originCountry: 'EG', hsCode: '6302210000',
    },
    {
      title: 'Scented Soy Candle Set (6pk)',
      slug: 'scented-soy-candle-set-6pk-homestyle',
      description: 'Hand-poured soy wax, 40hr burn time each. Lavender, Cedarwood, Vanilla.',
      price: 39.99,
      category: 'home',
      images: ['https://images.unsplash.com/photo-1602607093672-b005f7c75c5e?w=600'],
      stock: 180, rating: 4.8, reviewsCount: 3245,
      originCountry: 'GB', hsCode: '3406000090',
    },
    {
      title: 'Boho Macramé Wall Hanging',
      slug: 'boho-macrame-wall-hanging-homestyle',
      description: 'Hand-knotted natural cotton, 80x120cm. Bohemian interior statement piece.',
      price: 59.99, oldPrice: 79.99,
      category: 'home',
      images: ['https://images.unsplash.com/photo-1615873968403-89e068629265?w=600'],
      stock: 55, rating: 4.5, reviewsCount: 762,
      originCountry: 'TR', hsCode: '5609000000',
    },
    {
      title: 'Ceramic Vase Set (3 pieces)',
      slug: 'ceramic-vase-set-3pieces-homestyle',
      description: 'Hand-thrown stoneware, matte glaze finish. Heights: 15, 22, 30cm.',
      price: 74.99, oldPrice: 95.00,
      category: 'home',
      images: ['https://images.unsplash.com/photo-1612460627213-6b71e97ede85?w=600'],
      stock: 42, rating: 4.7, reviewsCount: 529,
      originCountry: 'PT', hsCode: '6913100000',
    },
    {
      title: 'Smart LED Floor Lamp',
      slug: 'smart-led-floor-lamp-homestyle',
      description: 'RGB+W colour, 16 million colours, app control, dimmable 2700-6500K.',
      price: 129.99, oldPrice: 159.99,
      category: 'living-room',
      images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'],
      stock: 67, rating: 4.6, reviewsCount: 943,
      originCountry: 'CN', hsCode: '9405400000',
    },
  ],
  'sportgear@mercora.bot': [
    {
      title: 'Nike Air Zoom Pegasus 40',
      slug: 'nike-air-zoom-pegasus-40-sportgear',
      description: 'Responsive cushioning for everyday running. React foam + Air Zoom unit.',
      price: 119.99, oldPrice: 139.99,
      category: 'sportswear',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
      stock: 88, rating: 4.8, reviewsCount: 4521,
      originCountry: 'VN', hsCode: '6404110000',
    },
    {
      title: 'Osprey Atmos AG 65 Backpack',
      slug: 'osprey-atmos-ag65-backpack-sportgear',
      description: '65L capacity, Anti-Gravity suspension, integrated rain cover. Trekking icon.',
      price: 289.99, oldPrice: 339.99,
      category: 'sport-outdoor',
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],
      stock: 22, rating: 4.9, reviewsCount: 1234,
      originCountry: 'VN', hsCode: '4202920000',
    },
    {
      title: 'Lululemon Align Leggings 28"',
      slug: 'lululemon-align-leggings-28-sportgear',
      description: 'Buttery-soft Nulu fabric, 4-way stretch, sweat-wicking. Yoga & studio.',
      price: 98.00,
      category: 'sportswear',
      images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600'],
      stock: 145, rating: 4.7, reviewsCount: 6781,
      originCountry: 'CA', hsCode: '6104620090',
    },
    {
      title: 'Black Diamond Spot 400 Headlamp',
      slug: 'black-diamond-spot400-headlamp-sportgear',
      description: '400 lumens, waterproof IPX8, strobe mode, red night vision. Essential for trails.',
      price: 44.99, oldPrice: 59.99,
      category: 'camping',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600'],
      stock: 175, rating: 4.8, reviewsCount: 3102,
      originCountry: 'US', hsCode: '8513100000',
    },
    {
      title: 'Garmin Forerunner 955 Solar',
      slug: 'garmin-forerunner-955-solar-sportgear',
      description: 'Solar charging GPS running watch, HRV stress tracking, triathlon mode.',
      price: 499.99, oldPrice: 599.99,
      category: 'electronics',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
      stock: 31, rating: 4.9, reviewsCount: 876,
      originCountry: 'TW', hsCode: '9102110000',
    },
    {
      title: 'Hydro Flask 32oz Wide Mouth',
      slug: 'hydro-flask-32oz-wide-mouth-sportgear',
      description: 'TempShield double-wall insulation. Keeps drinks cold 24hrs, hot 12hrs.',
      price: 44.95, oldPrice: 54.95,
      category: 'camping',
      images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'],
      stock: 220, rating: 4.8, reviewsCount: 8932,
      originCountry: 'US', hsCode: '7323990000',
    },
    {
      title: 'Patagonia Nano Puff Jacket',
      slug: 'patagonia-nano-puff-jacket-sportgear',
      description: '60g PrimaLoft insulation, windproof, stuffs into chest pocket. Lightweight layering.',
      price: 239.00, oldPrice: 279.00,
      category: 'sportswear',
      images: ['https://images.unsplash.com/photo-1544966503-7cc5d52b6fd5?w=600'],
      stock: 48, rating: 4.8, reviewsCount: 2341,
      originCountry: 'VN', hsCode: '6201930090',
    },
    {
      title: 'Yoga Mat Pro Non-Slip 6mm',
      slug: 'yoga-mat-pro-nonslip-6mm-sportgear',
      description: 'Natural tree rubber, alignment lines, carrying strap included. 183x61cm.',
      price: 79.99, oldPrice: 99.99,
      category: 'fitness',
      images: ['https://images.unsplash.com/photo-1601925228049-09f53843e81d?w=600'],
      stock: 310, rating: 4.7, reviewsCount: 5421,
      originCountry: 'IN', hsCode: '4016990000',
    },
  ],
  'glambeauty@mercora.bot': [
    {
      title: 'Charlotte Tilbury Pillow Talk Lipstick',
      slug: 'charlotte-tilbury-pillow-talk-lipstick-glam',
      description: 'Iconic muted-pink rose shade. Vitamin E, hyaluronic acid. 24hr wear.',
      price: 27.00, oldPrice: 34.00,
      category: 'beauty',
      images: ['https://images.unsplash.com/photo-1586495777744-4e6232bf4793?w=600'],
      stock: 230, rating: 4.9, reviewsCount: 12450,
      originCountry: 'GB', hsCode: '3304100000',
    },
    {
      title: 'La Mer Moisturizing Cream 30ml',
      slug: 'la-mer-moisturizing-cream-30ml-glam',
      description: 'Legendary Miracle Broth™. Heals, hydrates, renews. Dermatologist tested.',
      price: 159.00,
      category: 'beauty',
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'],
      stock: 55, rating: 4.8, reviewsCount: 3241,
      originCountry: 'US', hsCode: '3304990000',
    },
    {
      title: 'Dyson Airwrap Complete Styler',
      slug: 'dyson-airwrap-complete-styler-glam',
      description: 'Curl, wave, smooth and dry simultaneously. Frizz-free, heat-damage-free.',
      price: 479.99, oldPrice: 529.99,
      category: 'beauty',
      images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600'],
      stock: 18, rating: 4.8, reviewsCount: 8901,
      originCountry: 'GB', hsCode: '8516320000',
    },
    {
      title: 'NARS Sheer Glow Foundation',
      slug: 'nars-sheer-glow-foundation-glam',
      description: 'Buildable coverage, natural radiant finish. 40 shades. SPF value.',
      price: 42.00, oldPrice: 52.00,
      category: 'beauty',
      images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600'],
      stock: 195, rating: 4.7, reviewsCount: 6723,
      originCountry: 'US', hsCode: '3304990000',
    },
    {
      title: 'The Ordinary Hyaluronic Acid 2% + B5',
      slug: 'the-ordinary-hyaluronic-acid-2-b5-glam',
      description: '5 forms of HA to support multiple layers of skin. Plumping and hydrating.',
      price: 9.90, oldPrice: 12.90,
      category: 'beauty',
      images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600'],
      stock: 500, rating: 4.7, reviewsCount: 23412,
      originCountry: 'CA', hsCode: '3304990000',
    },
    {
      title: 'Tatcha The Water Cream 50ml',
      slug: 'tatcha-water-cream-50ml-glam',
      description: 'Oil-free anti-aging moisturizer. Japanese wild rose, leopard lily, hadasei-3.',
      price: 68.00,
      category: 'beauty',
      images: ['https://images.unsplash.com/photo-1617897903246-719242758050?w=600'],
      stock: 72, rating: 4.8, reviewsCount: 2891,
      originCountry: 'US', hsCode: '3304990000',
    },
    {
      title: 'MAC Pro Longwear Concealer',
      slug: 'mac-pro-longwear-concealer-glam',
      description: '15-hour wear, full coverage, crease-resistant. 34 shades.',
      price: 23.50, oldPrice: 28.00,
      category: 'makeup',
      images: ['https://images.unsplash.com/photo-1631214524020-3c69f37e7a06?w=600'],
      stock: 310, rating: 4.6, reviewsCount: 7823,
      originCountry: 'US', hsCode: '3304910000',
    },
    {
      title: 'Elemis Pro-Collagen Marine Cream',
      slug: 'elemis-pro-collagen-marine-cream-glam',
      description: 'Anti-ageing moisturiser with Padina Pavonica & Ginkgo Biloba. 28-day results.',
      price: 119.00, oldPrice: 149.00,
      category: 'beauty',
      images: ['https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600'],
      stock: 84, rating: 4.9, reviewsCount: 4521,
      originCountry: 'GB', hsCode: '3304990000',
    },
  ],
}

async function seed() {
  console.log('🤖 Seeding bot sellers...\n')

  for (const seller of BOT_SELLERS) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(seller.email)
    if (existing) {
      console.log(`⏩ Seller already exists: ${seller.name}`)
      continue
    }

    const hash = await bcrypt.hash(seller.password, 10)
    const sellerId = randomUUID()

    db.prepare(
      'INSERT INTO users (id, name, email, password_hash, role, country, currency) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(sellerId, seller.name, seller.email, hash, 'seller', 'GB', 'GBP')

    const products = BOT_PRODUCTS[seller.email] ?? []
    let inserted = 0

    for (const p of products) {
      const exists = db.prepare('SELECT id FROM products WHERE slug = ?').get(p.slug)
      if (exists) continue

      db.prepare(`
        INSERT INTO products (id, seller_id, title, slug, description, price, old_price, currency,
          stock, category_id, origin_country, hs_code, rating, reviews_count, images)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'GBP', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(), sellerId, p.title, p.slug, p.description,
        p.price, p.oldPrice ?? null, p.stock, p.category,
        p.originCountry, p.hsCode, p.rating, p.reviewsCount,
        JSON.stringify(p.images)
      )
      inserted++
    }

    console.log(`✅ Created seller: ${seller.name} (${seller.email}) — ${inserted} products`)
  }

  console.log('\n✨ Bot seeding complete!')
}

seed().catch(console.error)
