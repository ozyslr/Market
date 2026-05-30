/**
 * Schema.org Organization şeması
 * https://schema.org/Organization
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Benim Olan',
    url: 'https://benimolan.com',
    logo: 'https://benimolan.com/logo.png',
    description: "Benim Olan'da binlerce ürünü keşfedin. Moda, elektronik, ev & yaşam ve daha fazlası. Güvenli alışveriş, hızlı teslimat.",
    sameAs: [
      'https://facebook.com/benimolan',
      'https://instagram.com/benimolan',
      'https://twitter.com/benimolan',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@benimolan.com',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
    },
  };
}

/**
 * Schema.org WebSite şeması
 * https://schema.org/WebSite
 */
export function websiteSchema(searchActionUrl?: string) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Benim Olan',
    url: 'https://benimolan.com',
    description: "Benim Olan'da binlerce ürünü keşfedin. Moda, elektronik, ev & yaşam ve daha fazlası. Güvenli alışveriş, hızlı teslimat.",
    inLanguage: ['tr', 'en', 'de', 'ar'],
  };

  if (searchActionUrl) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://benimolan.com/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

/**
 * Schema.org BreadcrumbList şeması
 * https://schema.org/BreadcrumbList
 */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://benimolan.com${item.url}`,
    })),
  };
}

/**
 * Schema.org Product şeması
 * https://schema.org/Product
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
    url: product.url ? `https://benimolan.com${product.url}` : undefined,
  };

  if (product.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand,
    };
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

  // Clean undefined values
  return JSON.parse(JSON.stringify(schema));
}

/**
 * Schema.org Review şeması
 * https://schema.org/Review
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
      url: `https://benimolan.com${review.itemUrl}`,
    },
    author: {
      '@type': 'Person',
      name: review.authorName,
    },
    reviewBody: review.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.ratingValue,
    },
    datePublished: review.datePublished,
  };
}

/**
 * Schema.org FAQPage şeması
 * https://schema.org/FAQPage
 */
export function faqSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}
