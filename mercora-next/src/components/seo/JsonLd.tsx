interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Base JSON-LD component — renders structured data as <script type="application/ld+json">
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
