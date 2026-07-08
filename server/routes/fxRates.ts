// FX rate endpoint — serves cached ECB rates
import express, { type Express } from 'express';
import { logger } from '../logger.js';

export function registerFxRateRoutes(
  app: Express,
  deps: { verifyCronSecret: express.RequestHandler },
): void {
  app.get('/api/fx-rates', async (_req, res) => {
    try {
      const { adminDb } = await import('../../src/lib/firebase-admin.js');
      const doc = await adminDb!.collection('fxRates').doc('TRY').get();
      if (!doc.exists) {
        return res.json({ rates: { EUR: 0.028 }, updatedAt: null, source: 'fallback' });
      }
      const data = doc.data()!;
      res.set('Cache-Control', 'public, max-age=3600');
      res.json({ rates: data.rates, updatedAt: data.updatedAt, source: 'cached' });
    } catch (err: any) {
      logger.error('fx-rates', 'Failed to get rates', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/fx-rates/refresh', deps.verifyCronSecret, async (_req, res) => {
    try {
      const { adminDb } = await import('../../src/lib/firebase-admin.js');
      const API_URL = 'https://api.exchangerate.host/latest?base=TRY&symbols=EUR';
      const apiRes = await fetch(API_URL);
      if (!apiRes.ok) throw new Error(`FX API error: ${apiRes.status}`);
      const data = await apiRes.json();
      const eurRate = data.rates?.EUR || 0.028;

      await adminDb!
        .collection('fxRates')
        .doc('TRY')
        .set({
          rates: { EUR: eurRate },
          updatedAt: new Date().toISOString(),
        });

      logger.info('fx-rates', `Rates refreshed: EUR=${eurRate}`);
      res.json({ rates: { EUR: eurRate }, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      logger.error('fx-rates', 'Refresh failed', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });
}
