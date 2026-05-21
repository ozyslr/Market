'use client';

const GEMINI_API_KEY = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GEMINI_API_KEY : '';

export interface VisualSearchResult {
  label: string;
  confidence: number;
  suggestedKeywords: string[];
}

export async function analyzeImage(imageFile: File): Promise<VisualSearchResult[]> {
  if (!GEMINI_API_KEY) {
    return [];
  }

  try {
    const base64 = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';
    const imageData = base64.includes('base64,') ? base64.split('base64,')[1] : base64;

    const prompt = `Analyze this product image. Identify:
1. What type of product is this? (e.g., "electronics", "clothing", "furniture")
2. Key visual features (colors, shape, material, brand cues)
3. Suggested search keywords for similar products

Return as JSON: { "label": "product category", "confidence": 0.95, "suggestedKeywords": ["kw1", "kw2"] }`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
        }),
      },
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return [];

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return [{
        label: parsed.label || 'unknown',
        confidence: parsed.confidence || 0,
        suggestedKeywords: parsed.suggestedKeywords || [],
      }];
    }

    return [];
  } catch {
    return [];
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}
