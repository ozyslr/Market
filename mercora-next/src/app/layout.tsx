import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from '@/components/Providers';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationSchema, websiteSchema } from '@/components/seo/schemas';
import { SkipToContent } from '@/components/ui/SkipToContent';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mercora.app';

export const metadata: Metadata = {
  title: {
    default: 'Mercora — Alışverişin Yeni Adresi',
    template: '%s | Mercora',
  },
  description: 'Global Artisan Marketplace — El işçiliği ve özel tasarım ürünler',
  keywords: ['ecommerce', 'marketplace', 'artisan', 'shopping', 'mercora', 'el işçiliği', 'handmade', 'global marketplace'],
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: '/',
    languages: {
      'tr': '/',
      'en': '/en',
      'de': '/de',
      'ar': '/ar',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Mercora',
    title: 'Mercora — Alışverişin Yeni Adresi',
    description: 'Global Artisan Marketplace — El işçiliği ve özel tasarım ürünler',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mercora — Alışverişin Yeni Adresi',
    description: 'Global Artisan Marketplace — El işçiliği ve özel tasarım ürünler',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
  other: {
    'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <SkipToContent />
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema(`${BASE_URL}/search`)} />
      </body>
    </html>
  );
}
