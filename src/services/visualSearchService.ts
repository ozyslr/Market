import { Product } from '@/types';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Gemini Vision: describe image ────────────────────────────────────────

async function describeImage(imageBase64: string, mimeType: string): Promise<string | null> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are Benim Olan's visual search engine. Analyze this product image and return a JSON object with:
1. "title" — a concise product title in Turkish (max 60 chars)
2. "category" — the best matching category from: electronics, fashion, home, sports, beauty, automotive, baby, food, office, pet, books, other
3. "keywords" — an array of 5-10 search keywords in Turkish for finding similar products
4. "color" — dominant color(s) of the product
5. "style" — style descriptors (e.g. modern, classic, sporty, minimalist)

Return ONLY valid JSON, no markdown fences. Example: {"title":"Spor Ayakkabı","category":"fashion","keywords":["spor ayakkabı","koşu","beyaz"],"color":"beyaz","style":"sporty"}`,
                },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ─── Image → file reader → base64 ─────────────────────────────────────────

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Search products by keywords ───────────────────────────────────────────

async function searchProductsByKeywords(keywords: string[]): Promise<Product[]> {
  if (keywords.length === 0) return [];

  const snap = await getDocs(query(collection(db, 'products'), limit(50)));
  const allProducts = snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Product)
    .filter(p => p.isActive !== false);

  // Score by keyword match in title, description, tags, category
  const lowerKw = keywords.map(k => k.toLowerCase().replace(/[şğüöıç]/g, c => ({ ş: 's', ğ: 'g', ü: 'u', ö: 'o', ı: 'i', ç: 'c' } as Record<string, string>)[c] || c));

  const scored = allProducts
    .map(p => {
      const searchText = [
        p.title,
        p.description,
        ...(p.tags || []),
        p.categoryId,
        p.brand,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .replace(/[şğüöıç]/g, c => ({ ş: 's', ğ: 'g', ü: 'u', ö: 'o', ı: 'i', ç: 'c' } as Record<string, string>)[c] || c);

      let score = 0;
      for (const kw of lowerKw) {
        if (searchText.includes(kw)) score += 1;
        // Bonus for title match
        if (p.title?.toLowerCase().includes(kw)) score += 2;
        // Bonus for tag match
        if (p.tags?.some(t => t.toLowerCase().includes(kw))) score += 1.5;
      }

      return { product: p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 20).map(s => s.product);
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface VisualSearchResult {
  analysis: {
    title: string;
    category: string;
    keywords: string[];
    color: string;
    style: string;
  } | null;
  products: Product[];
}

/**
 * Search products by uploading an image.
 * Gemini Vision analyzes the image, extracts keywords, then finds matching products.
 */
export async function searchByImage(file: File): Promise<VisualSearchResult> {
  // Step 1: Convert file to base64
  const { base64, mimeType } = await fileToBase64(file);

  // Step 2: Gemini Vision analysis
  const description = await describeImage(base64, mimeType);
  let analysis: VisualSearchResult['analysis'] = null;
  let keywords: string[] = [];

  if (description) {
    try {
      analysis = JSON.parse(description);
      keywords = analysis?.keywords ?? [];
    } catch {
      // Fallback: use raw description as keywords
      keywords = description.split(/[\s,]+/).filter(w => w.length > 2);
    }
  }

  // Step 3: Search products
  const products = keywords.length > 0 ? await searchProductsByKeywords(keywords) : [];

  return { analysis, products };
}
