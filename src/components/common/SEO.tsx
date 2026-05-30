import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  name?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  canonical, 
  type = 'website', 
  image, 
  name = 'Mercora' 
}) => {
  const fullTitle = title ? `${title} | ${name}` : name;
  const siteDescription = description || 'Global Artisan Marketplace';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={siteDescription} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={siteDescription} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:creator" content="@mercora" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={siteDescription} />
    </Helmet>
  );
};
