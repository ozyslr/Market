// ─── Server-proxied Gemini — API key stays server-side ────────────────────

async function generateText(model: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text ?? null;
  } catch (err) {
    console.error('[AI Content] generateText error:', err);
    return null;
  }
}

// ─── Input types ──────────────────────────────────────────────────────────

interface ProductAttrs {
  title: string;
  brand: string;
  categoryId: string;
  tags: string[];
  price: number;
  oldPrice?: number;
  stock: number;
  specifications: Record<string, string>;
  originCountry: string;
}

// ─── Description generation ───────────────────────────────────────────────

export async function generateProductDescription(attrs: ProductAttrs): Promise<{
  description: string;
  longDescription: string;
} | null> {
  const specText = Object.entries(attrs.specifications)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const prompt = `You are Benim Olan's AI copywriter. Generate product content in **Turkish**.

Product:
- Title: ${attrs.title}
- Brand: ${attrs.brand}
- Category: ${attrs.categoryId}
- Tags: ${attrs.tags.join(', ') || '-'}
- Price: ${attrs.price} TL
- Origin: ${attrs.originCountry}
- Specifications:
${specText || '  (none)'}

Return a JSON object with TWO fields:
1. "description" — A short, punchy product summary (max 150 characters). Optimised for search snippets.
2. "longDescription" — A detailed, persuasive product description (2-3 paragraphs). Include key features, benefits, use cases, and quality signals.

Rules:
- Write ONLY valid JSON, no markdown fences, no extra text.
- Use professional, compelling Turkish.
- Highlight unique selling points and emotional benefits.

Format: {"description":"...","longDescription":"..."}`;

  const text = await generateText('gemini-3-flash-preview', prompt);
  if (!text) return null;

  try {
    const json = JSON.parse(text);
    return {
      description: json.description || '',
      longDescription: json.longDescription || '',
    };
  } catch {
    return null;
  }
}

// ─── Meta description generation ─────────────────────────────────────────

export async function generateMetaDescription(attrs: ProductAttrs): Promise<string | null> {
  const prompt = `Generate a single SEO meta description (max 155 characters) in Turkish for:
Title: ${attrs.title}
Brand: ${attrs.brand}
Category: ${attrs.categoryId}
Price: ${attrs.price} TL

Return ONLY the meta description text, no JSON, no quotes, no extra formatting.`;

  return generateText('gemini-3-flash-preview', prompt);
}

// ─── Image generation via Imagen (server-proxied) ─────────────────────────

export async function generateProductImage(prompt: string): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.dataUrl ?? null;
  } catch {
    return null;
  }
}

// ─── AI-powered tag suggestion ─────────────────────────────────────────────

export async function suggestTags(attrs: {
  title: string;
  brand: string;
  categoryId: string;
  description: string;
}): Promise<string[]> {
  const prompt = `Suggest 5-8 product tags (keywords) in Turkish for:
Title: ${attrs.title}
Brand: ${attrs.brand}
Category: ${attrs.categoryId}
Description: ${attrs.description.slice(0, 200)}

Return ONLY a JSON array of strings, no markdown, no extra text. Example: ["tag1","tag2","tag3"]`;

  const text = await generateText('gemini-3-flash-preview', prompt);
  if (!text) return [];

  try {
    const tags = JSON.parse(text);
    return Array.isArray(tags) ? tags.slice(0, 8).map((t: string) => t.toLowerCase().trim()) : [];
  } catch {
    return [];
  }
}

export interface ProductInsights {
  summary: string;
  pros: string[];
  cons: string[];
}

export async function generateProductInsights(
  productTitle: string,
  description: string,
  specs?: Record<string, string>
): Promise<ProductInsights | null> {
  const specText = specs
    ? Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ')
    : '';
  const prompt = `Sen bir ürün analisti olarak çalışıyorsun. Aşağıdaki ürün için Türkçe içgörü üret.
Ürün: ${productTitle}
Açıklama: ${description}
${specText ? `Özellikler: ${specText}` : ''}
Yanıtı SADECE şu JSON formatında ver, başka hiçbir şey ekleme:
{"summary":"...tek paragraf özet...","pros":["...","...","..."],"cons":["...","...","..."]}`;
  const raw = await generateText('gemini-3-flash-preview', prompt);
  if (!raw) return null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as ProductInsights) : null;
  } catch {
    return null;
  }
}
