import React from 'react';

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Base JSON-LD component — renders structured data as <script type="application/ld+json">
 */
export const JsonLd: React.FC<JsonLdProps> = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data),
    }}
  />
);
