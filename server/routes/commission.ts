// ─── Commission API Routes ────────────────────────────────────────────────────
// Admin CRUD for commission rules + public calculation preview.
// All writes go through admin SDK with verifyAdmin middleware.

import type { Express } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { calculateCommission, resolveRate } from '../services/commissionEngine.js';
import type { CommissionRule, CommissionResult } from '../services/commissionEngine.js';
import { adminDb } from '../../src/lib/firebase-admin.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface CommissionRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
  verifyAdmin: Middleware;
}

const RULES_COL = 'commissionRules';

// ─── Validation ───────────────────────────────────────────────────────────────

const commissionRuleSchema = z.object({
  type: z.enum(['category', 'seller', 'global']),
  scope: z
    .object({
      categoryId: z.string().min(1).optional(),
      sellerId: z.string().min(1).optional(),
    })
    .optional(),
  rate: z.number().min(0).max(1),
  minCommission: z.number().int().min(0).default(500),
  maxCommission: z.number().int().min(0).default(50000),
  priority: z.number().int().min(0).default(200),
});

const calculateCommissionSchema = z.object({
  sellerId: z.string().min(1),
  categoryId: z.string().min(1),
  priceInKurus: z.number().int().min(0),
});

// ─── Route Registration ─────────────────────────────────────────────────────

export function registerCommissionRoutes(app: Express, deps: CommissionRouteDeps) {
  const { verifyFirebaseToken, verifyAdmin } = deps;

  /**
   * POST /api/admin/commission-rules
   * Create a new commission rule (admin only).
   */
  app.post(
    '/api/admin/commission-rules',
    verifyAdmin,
    validate(commissionRuleSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

        const now = new Date().toISOString();
        const docRef = adminDb.collection(RULES_COL).doc();
        const rule: CommissionRule = {
          ruleId: docRef.id,
          ...req.body,
          active: true,
          createdAt: now,
          updatedAt: now,
        };

        await docRef.set(rule);
        return res.status(201).json(rule);
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to create rule' });
      }
    },
  );

  /**
   * GET /api/admin/commission-rules
   * List all commission rules (admin only).
   */
  app.get('/api/admin/commission-rules', verifyAdmin, async (_req: any, res: any) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

      const snap = await adminDb.collection(RULES_COL).get();
      const rules = snap.docs.map((d) => d.data() as CommissionRule);
      return res.status(200).json(rules);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch rules' });
    }
  });

  /**
   * PUT /api/admin/commission-rules/:ruleId
   * Update a commission rule (admin only).
   */
  app.put(
    '/api/admin/commission-rules/:ruleId',
    verifyAdmin,
    validate(commissionRuleSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

        const { ruleId } = req.params;
        const ref = adminDb.collection(RULES_COL).doc(ruleId);
        const snap = await ref.get();

        if (!snap.exists) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        const updated = {
          ...req.body,
          updatedAt: new Date().toISOString(),
        };
        await ref.update(updated);
        return res.status(200).json({ ...snap.data(), ...updated });
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to update rule' });
      }
    },
  );

  /**
   * DELETE /api/admin/commission-rules/:ruleId
   * Soft delete by setting active: false (admin only).
   */
  app.delete('/api/admin/commission-rules/:ruleId', verifyAdmin, async (req: any, res: any) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

      const { ruleId } = req.params;
      const ref = adminDb.collection(RULES_COL).doc(ruleId);
      const snap = await ref.get();

      if (!snap.exists) {
        return res.status(404).json({ error: 'Rule not found' });
      }

      await ref.update({ active: false, updatedAt: new Date().toISOString() });
      return res.status(200).json({ deleted: true, ruleId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete rule' });
    }
  });

  /**
   * GET /api/commission-rules/defaults
   * Returns DEFAULT_RATES map (authenticated, read-only).
   */
  app.get('/api/commission-rules/defaults', verifyFirebaseToken, async (_req: any, res: any) => {
    try {
      const { getDefaultRates } = await import('../services/commissionEngine.js');
      return res.status(200).json(getDefaultRates());
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/orders/calculate-commission
   * Preview commission for a given seller/category/price (authenticated).
   */
  app.post(
    '/api/orders/calculate-commission',
    verifyFirebaseToken,
    validate(calculateCommissionSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

        const { sellerId, categoryId, priceInKurus } = req.body;

        // Load active rules from Firestore
        const snap = await adminDb.collection(RULES_COL).where('active', '==', true).get();
        const rules: CommissionRule[] = snap.docs.map((d) => d.data() as CommissionRule);

        const result = calculateCommission({ priceInKurus, sellerId, categoryId, rules });
        return res.status(200).json(result);
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to calculate commission' });
      }
    },
  );
}
