import { describe, it, expect } from 'vitest';
import { registerGeminiRoutes } from './gemini';
import { geminiTextSchema, geminiVisionSchema } from '../lib/schemas';

function captureRoutes() {
  const routes: Record<string, any[]> = {};
  const app: any = { post: (path: string, ...handlers: any[]) => (routes[path] = handlers) };
  const verifyFirebaseToken = async () => {};
  registerGeminiRoutes(app, { verifyFirebaseToken });
  return { routes, verifyFirebaseToken };
}

describe('gemini proxy routes', () => {
  it('requires a Firebase token before anything else on every route', () => {
    const { routes, verifyFirebaseToken } = captureRoutes();
    expect(Object.keys(routes).sort()).toEqual(['/api/gemini/text', '/api/gemini/vision']);
    for (const chain of Object.values(routes)) expect(chain[0]).toBe(verifyFirebaseToken);
  });

  it('no longer exposes AI image generation', () => {
    expect(captureRoutes().routes['/api/gemini/image']).toBeUndefined();
  });

  it('caps prompt and image size and strips a client-chosen model', () => {
    expect(geminiTextSchema.safeParse({ prompt: 'x'.repeat(12_001) }).success).toBe(false);
    const parsed = geminiTextSchema.parse({ prompt: 'hi', model: 'gemini-ultra' });
    expect(parsed).toEqual({ prompt: 'hi' });
    expect(
      geminiVisionSchema.safeParse({ prompt: 'p', imageBase64: 'a', mimeType: 'image/gif' })
        .success,
    ).toBe(false);
  });
});
