/**
 * Gemini AI Proxy â€” all Gemini API calls route through the server.
 * The API key stays server-side and is NEVER exposed to the client bundle.
 */
import { GoogleGenAI } from '@google/genai';
import { validate } from '../lib/validate.js';
import { geminiTextSchema, geminiVisionSchema, geminiImageSchema } from '../lib/schemas.js';
import type { Request, Response, Router } from 'express';
import { logger } from '../logger.js';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (_ai) return _ai;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function extractText(response: any): string {
  return response?.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// â”€â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function registerGeminiRoutes(app: Router | any) {

  /**
   * POST /api/gemini/text
   * Generic text generation. Body: { model, prompt }
   * Returns: { text: string }
   */
  app.post('/api/gemini/text', async (req: Request, res: Response) => {
    try {
      const ai = getAI();
      if (!ai) return res.status(503).json({ error: 'AI servisi yapÄ±landÄ±rÄ±lmamÄ±ÅŸ' });

      const { model, prompt } = req.body;
      if (!model || !prompt) return res.status(400).json({ error: 'model ve prompt gerekli' });

      const response = await ai.models.generateContent({ model, contents: prompt });
      res.json({ text: extractText(response) });
    } catch (err: any) {
      logger.error('gemini', 'text generation failed', { error: err.message });
      res.status(500).json({ error: 'AI isteÄŸi baÅŸarÄ±sÄ±z' });
    }
  });

  /**
   * POST /api/gemini/vision
   * Multimodal image analysis. Body: { model, prompt, imageBase64, mimeType }
   * Returns: { text: string }
   */
  app.post('/api/gemini/vision', async (req: Request, res: Response) => {
    try {
      const ai = getAI();
      if (!ai) return res.status(503).json({ error: 'AI servisi yapÄ±landÄ±rÄ±lmamÄ±ÅŸ' });

      const { model, prompt, imageBase64, mimeType } = req.body;
      if (!model || !prompt || !imageBase64) {
        return res.status(400).json({ error: 'model, prompt ve imageBase64 gerekli' });
      }

      const response = await ai.models.generateContent({
        model,
        contents: [
          { text: prompt },
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
        ],
      });
      res.json({ text: extractText(response) });
    } catch (err: any) {
      logger.error('gemini', 'vision analysis failed', { error: err.message });
      res.status(500).json({ error: 'GÃ¶rsel analiz baÅŸarÄ±sÄ±z' });
    }
  });

  /**
   * POST /api/gemini/image
   * Image generation via Imagen. Body: { prompt }
   * Returns: { dataUrl: string } or null
   */
  app.post('/api/gemini/image', async (req: Request, res: Response) => {
    try {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return res.status(503).json({ error: 'AI servisi yapÄ±landÄ±rÄ±lmamÄ±ÅŸ' });

      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'prompt gerekli' });

      const fetchRes = await fetch(
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

      if (!fetchRes.ok) {
        return res.status(502).json({ error: 'Imagen API hatasÄ±' });
      }

      const data = await fetchRes.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (!parts) return res.json({ dataUrl: null });

      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return res.json({
            dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          });
        }
      }

      res.json({ dataUrl: null });
    } catch (err: any) {
      logger.error('gemini', 'image generation failed', { error: err.message });
      res.status(500).json({ error: 'GÃ¶rsel oluÅŸturma baÅŸarÄ±sÄ±z' });
    }
  });
}
