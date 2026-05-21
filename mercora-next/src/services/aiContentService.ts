'use client';

import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

const GEMINI_API_KEY = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GEMINI_API_KEY : '';

export async function generateDescription(
  productName: string,
  category: string,
  keywords: string[],
  targetMarket: 'UK' | 'DE' | 'FR' | 'TR' | 'US' = 'UK',
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return generateFallbackDescription(productName, category, keywords);
  }

  const marketPrompts: Record<string, string> = {
    UK: 'Write in British English. Use clear, professional e-commerce language.',
    DE: 'Write in German. Use formal e-commerce language (Sie form).',
    FR: 'Write in French. Use polished retail language.',
    TR: 'Write in Turkish. Use warm, conversational e-commerce language.',
    US: 'Write in American English. Use persuasive, benefit-driven copy.',
  };

  try {
    const prompt = `Generate a product description for "${productName}" in category "${category}".
Keywords to include: ${keywords.join(', ')}.
${marketPrompts[targetMarket] ?? marketPrompts.UK}
Keep it 2-3 paragraphs. Include features, benefits, and usage suggestions.
Return only the description text, no markdown.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      },
    );

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      generateFallbackDescription(productName, category, keywords);
  } catch {
    return generateFallbackDescription(productName, category, keywords);
  }
}

function generateFallbackDescription(
  productName: string,
  category: string,
  keywords: string[],
): string {
  return `Discover the exceptional quality of ${productName}, designed for those who appreciate the finest in ${category}. Crafted with attention to every detail, this product delivers outstanding performance and lasting durability.

Featuring ${keywords.slice(0, 3).join(', ')}, ${productName} offers everything you need for a seamless experience. Whether you're a professional or a hobbyist, this product adapts to your requirements with ease.

Experience the perfect blend of style, functionality, and value with ${productName}. Order now and elevate your ${category} collection.`;
}

export async function translateDescription(
  text: string,
  targetLang: 'en' | 'de' | 'fr' | 'tr',
): Promise<string> {
  if (!GEMINI_API_KEY) return text;

  const langNames: Record<string, string> = {
    en: 'English',
    de: 'German',
    fr: 'French',
    tr: 'Turkish',
  };

  try {
    const prompt = `Translate the following product description to ${langNames[targetLang] ?? 'English'}. Preserve all HTML tags and formatting. Return only the translation:

${text}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
        }),
      },
    );

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? text;
  } catch {
    return text;
  }
}

export async function extractKeywords(productName: string, category: string): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    return [productName, category, 'premium', 'quality', 'durable'];
  }

  try {
    const prompt = `Generate 8-10 SEO keywords for "${productName}" in category "${category}".
Return as a comma-separated list, lowercase, no numbers.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.5 },
        }),
      },
    );

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return raw.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [productName, category, 'premium', 'quality', 'durable'];
  }
}
