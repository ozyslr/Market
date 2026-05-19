import { GoogleGenAI } from '@google/genai';

// ─── Helpers ─────────────────────────────────────────────────────────────

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (client) return client;
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  client = new GoogleGenAI({ apiKey: key });
  return client;
}

async function generateText(model: string, prompt: string): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;
  try {
    const res = await ai.models.generateContent({ model, contents: prompt });
    return res.text ?? null;
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

  const prompt = `You are Mercora's AI copywriter. Generate product content in **Turkish**.

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

// ─── Image generation via Imagen ──────────────────────────────────────────

/**
 * Generate a product image using Google Imagen via the Gemini API.
 * Returns a base64 data-URL string, or null if unavailable/failed.
 */
export async function generateProductImage(prompt: string): Promise<string | null> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;

  // Use the Imagen REST API directly via fetch
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/-/locations/us-central1/publishers/google/models/imagen-3.0-fast-generate-001:predict`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.candidates?.[0]?.content?.parts) return null;

    // Extract the first image from response parts
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
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
