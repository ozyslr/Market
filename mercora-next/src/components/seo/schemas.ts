const BASE_URL = 'https://mercora.app';

/**
 * Schema.org Organization şeması
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mercora',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Global Artisan Marketplace — El işçiliği ve özel tasarım ürünler',
    sameAs: [
      'https://facebook.com/mercora',
      'https://instagram.com/mercora',
      'https://twitter.com/mercora',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@mercora.com',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
    },
  };
}

/**
 * Schema.org WebSite şeması
 */
export function websiteSchema(searchActionUrl?: string) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Mercora',
    url: BASE_URL,
    description: 'Global Artisan Marketplace — El işçiliği ve özel tasarım ürünler',
    inLanguage: ['tr', 'en', 'de', 'ar'],
  };

  if (searchActionUrl) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

/**
 * Schema.org BreadcrumbList şeması
 */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Schema.org Product şeması
 */
export function productSchema(product: {
  name: string;
  description?: string;
  image?: string[];
  sku?: string;
  brand?: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  ratingValue?: number;
  reviewCount?: number;
  category?: string;
  url?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    ...(product.url ? { url: `${BASE_URL}${product.url}` } : {}),
  };

  if (product.brand) {
    schema.brand = { '@type': 'Brand', name: product.brand };
  }

  if (product.category) {
    schema.category = product.category;
  }

  schema.offers = {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency || 'TRY',
    availability: `https://schema.org/${product.availability || 'InStock'}`,
  };

  if (product.ratingValue && product.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
    };
  }

  return JSON.parse(JSON.stringify(schema));
}

/**
 * Schema.org Review şeması
 */
export function reviewSchema(review: {
  itemName: string;
  itemUrl: string;
  authorName: string;
  reviewBody: string;
  ratingValue: number;
  datePublished: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: review.itemName,
      url: `${BASE_URL}${review.itemUrl}`,
    },
    author: { '@type': 'Person', name: review.authorName },
    reviewBody: review.reviewBody,
    reviewRating: { '@type': 'Rating', ratingValue: review.ratingValue },
    datePublished: review.datePublished,
  };
}

/**
 * Schema.org FAQPage şeması
 */
export function faqSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}
