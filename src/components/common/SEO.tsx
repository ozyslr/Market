import React from 'react';
import { Helmet } from 'react-helmet-async';
import { JsonLd } from '../seo/JsonLd';
import { organizationSchema, websiteSchema } from '../seo/schemas';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  name?: string;
  jsonLd?: Record<string, unknown>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  type = 'website',
  image,
  name = 'Mercora',
  jsonLd,
}) => {
  const fullTitle = title ? `${title} | ${name}` : name;
  const siteDescription = description || 'Global Artisan Marketplace';
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : 'https://mercora.com');

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
      </Helmet>

      {/* Default Organization + Website schemas */}
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema('https://mercora.com/search?q={search_term_string}')} />

      {/* Page-specific schema */}
      {jsonLd && <JsonLd data={jsonLd} />}
    </>
  );
};
