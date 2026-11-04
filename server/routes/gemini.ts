/**
 * Gemini AI Proxy — all Gemini API calls route through the server.
 * The API key stays server-side and is NEVER exposed to the client bundle.
 *
 * Every route needs a Firebase ID token (anonymous guest sessions count) and is
 * rate-limited per user. The model is fixed server-side so callers cannot pick an
 * expensive one. AI image generation was removed on purpose: product photos on a
 * marketplace must show the real item.
 */
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import { validate } from '../lib/validate.js';
import { geminiTextSchema, geminiVisionSchema } from '../lib/schemas.js';
import type { Request, Response, Router } from 'express';
import { logger } from '../logger.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (_ai) return _ai;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
}

function extractText(response: any): string {
  return response?.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

interface GeminiDeps {
  verifyFirebaseToken: (req: any, res: any, next: any) => unknown;
}

export function registerGeminiRoutes(app: Router | any, { verifyFirebaseToken }: GeminiDeps) {
  // Runs after verifyFirebaseToken, so req.uid is always set here.
  const perUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    keyGenerator: (req: any) => req.uid,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla AI isteği, lütfen biraz sonra tekrar deneyin.' },
  });
  const guard = [verifyFirebaseToken, perUserLimiter];

  /** POST /api/gemini/text — Body: { prompt } → { text } */
  app.post(
    '/api/gemini/text',
    ...guard,
    validate(geminiTextSchema),
    async (req: Request, res: Response) => {
      try {
        const ai = getAI();
        if (!ai) return res.status(503).json({ error: 'AI servisi yapılandırılmamış' });
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: req.body.prompt,
        });
        res.json({ text: extractText(response) });
      } catch (err: any) {
        logger.error('gemini', 'text generation failed', { error: err.message });
        res.status(500).json({ error: 'AI isteği başarısız' });
      }
    },
  );

  /** POST /api/gemini/vision — Body: { prompt, imageBase64, mimeType? } → { text } */
  app.post(
    '/api/gemini/vision',
    ...guard,
    validate(geminiVisionSchema),
    async (req: Request, res: Response) => {
      try {
        const ai = getAI();
        if (!ai) return res.status(503).json({ error: 'AI servisi yapılandırılmamış' });
        const { prompt, imageBase64, mimeType } = req.body;
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
          ],
        });
        res.json({ text: extractText(response) });
      } catch (err: any) {
        logger.error('gemini', 'vision analysis failed', { error: err.message });
        res.status(500).json({ error: 'Görsel analiz başarısız' });
      }
    },
  );
}
