import { Helmet } from 'react-helmet-async'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export function ProductSeo({ product }: Props) {
  const baseUrl = 'https://market-ecommerce-app.web.app'
  const url = `${baseUrl}/products/${product.slug}`
  const image = product.images[0] ?? `${baseUrl}/og-default.png`
  const description = product.description?.slice(0, 160) ?? `${product.title} - Mercora`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    sku: product.id,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product.currency || 'GBP',
      price: product.price.toFixed(2),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(product.reviewsCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.toFixed(1),
        reviewCount: product.reviewsCount,
        bestRating: '5',
      },
    } : {}),
  }

  return (
    <Helmet>
      <title>{product.title} | Mercora</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="product" />
      <meta property="og:title" content={`${product.title} | Mercora`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={product.title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  )
}
