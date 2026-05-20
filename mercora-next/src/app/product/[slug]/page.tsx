'use cache';

import { cacheLife } from 'next/cache';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { getProductBySlug } from '@/lib/products';
import { ProductDetailContent } from '@/components/ProductDetailContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { productSchema } from '@/components/seo/schemas';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.title,
    description: product.description?.slice(0, 160),
    alternates: {
      canonical: `/product/${slug}`,
    },
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0], width: 1200, height: 1200 }] : [],
      type: 'website',
      siteName: 'Mercora',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [product.images[0]] : [],
    },
    other: {
      'product:price:amount': product.price?.toString() || '',
      'product:price:currency': product.currency || 'GBP',
      'product:availability': product.stock > 0 ? 'in_stock' : 'out_of_stock',
    },
  };
}

export default async function ProductPage({ params }: Props) {
  cacheLife('hours');
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <MainLayout>
      <ProductDetailContent product={product} />
      <JsonLd data={productSchema({
        name: product.title,
        description: product.description,
        image: product.images,
        sku: product.sku || product.id,
        brand: product.brand,
        price: product.price,
        currency: product.currency || 'GBP',
        availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
        ratingValue: product.rating,
        reviewCount: product.reviewsCount,
        category: product.categoryId,
        url: `/product/${slug}`,
      })} />
    </MainLayout>
  );
}
