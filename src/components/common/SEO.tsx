import React from 'react';
import { Helmet as HelmetOrig } from 'react-helmet-async';
import { JsonLd } from '../seo/JsonLd';
import { organizationSchema, websiteSchema } from '../seo/schemas';

// React 19 class component type compat
const Helmet = HelmetOrig as any;

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  name?: string;
  jsonLd?: Record<string, unknown>;
  /** Active language code (en, tr, de, ar) — enables hreflang alternates */
  lang?: string;
}

const LANGUAGES = ['tr', 'en', 'de', 'ar'];

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  type = 'website',
  image,
  name = 'Benim Olan',
  jsonLd,
  lang = 'tr',
}) => {
  const fullTitle = title ? `${title} | ${name}` : name;
  const siteDescription = description || 'Global Artisan Marketplace';
  const canonicalUrl = canonical
    ? `https://benimolan.com${canonical.startsWith('/') ? canonical : `/${canonical}`}`
    : typeof window !== 'undefined'
      ? window.location.href
      : 'https://benimolan.com';

  // Build hreflang alternate links
  const hreflangLinks = canonical
    ? LANGUAGES.map((l) => ({
        lang: l,
        href: canonicalUrl.replace('benimolan.com', `benimolan.com/${l === 'tr' ? '' : l}`),
      }))
    : [];

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={siteDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={name} />
        {image && <meta property="og:image" content={image} />}

        {/* Twitter */}
        <meta name="twitter:creator" content="@mercora" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={siteDescription} />

        {/* Hreflang alternates */}
        {hreflangLinks.map(({ lang: l, href }) => (
          <link key={l} rel="alternate" hrefLang={l} href={href} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={hreflangLinks.find(l => l.lang === 'en')?.href || canonicalUrl} />
      </Helmet>

      {/* Default Organization + Website schemas */}
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema('https://mercora.com/search?q={search_term_string}')} />

      {/* Page-specific schema */}
      {jsonLd && <JsonLd data={jsonLd} />}
    </>
  );
};
