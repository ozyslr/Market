// ─── Commission Rules API Routes ────────────────────────────────────────────
// Admin CRUD for commission rules + calculate-commission endpoint.
// All writes go through the admin SDK (never client-side Firestore).

import type { Express } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { calculateCommission, getDefaultRates, resolveRate } from '../services/commissionEngine.js';
import type { CommissionRule } from '../services/commissionEngine.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface CommissionRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
  verifyAdmin: Middleware;
}

const RULES_COLLECTION = 'commissionRules';
const LEDGER_COLLECTION = 'ledger';

// ─── Validation Schemas ─────────────────────────────────────────────────────

const createRuleSchema = z.object({
  type: z.enum(['category', 'seller', 'global']),
  scope: z
    .object({
      categoryId: z.string().optional(),
      sellerId: z.string().optional(),
    })
    .optional()
    .default({}),
  rate: z.number().min(0).max(1),
  minCommission: z.number().int().nonnegative().default(500),
  maxCommission: z.number().int().nonnegative().default(50000),
});

const updateRuleSchema = z.object({
  type: z.enum(['category', 'seller', 'global']).optional(),
  scope: z
    .object({
      categoryId: z.string().optional(),
      sellerId: z.string().optional(),
    })
    .optional(),
  rate: z.number().min(0).max(1).optional(),
  minCommission: z.number().int().nonnegative().optional(),
  maxCommission: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

const calculateSchema = z.object({
  sellerId: z.string().min(1),
  categoryId: z.string().min(1),
  priceInKurus: z.number().int().nonnegative(),
});

// ─── Route Registration ─────────────────────────────────────────────────────

export function registerCommissionRoutes(app: Express, deps: CommissionRouteDeps) {
  const { adminDb, verifyFirebaseToken, verifyAdmin } = deps;

  if (!adminDb) {
    console.warn('[commission] adminDb not available — routes will return 503');
  }

  /**
   * POST /api/admin/commission-rules
   * Create a new commission rule. Admin only.
   */
  app.post(
    '/api/admin/commission-rules',
    verifyAdmin,
    validate(createRuleSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });

        const ruleData = req.body;
        const now = new Date().toISOString();
        const docRef = adminDb.collection(RULES_COLLECTION).doc();

        const rule: CommissionRule = {
          ruleId: docRef.id,
          type: ruleData.type,
          scope: ruleData.scope || {},
          rate: ruleData.rate,
          minCommission: ruleData.minCommission,
          maxCommission: ruleData.maxCommission,
          active: true,
          priority: ruleData.type === 'seller' ? 10 : ruleData.type === 'category' ? 50 : 100,
          createdAt: now,
          updatedAt: now,
        };

        await docRef.set(rule);
        return res.status(201).json(rule);
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to create commission rule' });
      }
    },
  );

  /**
   * GET /api/admin/commission-rules
   * List all commission rules. Admin only.
   */
  app.get('/api/admin/commission-rules', verifyAdmin, async (_req: any, res: any) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });

      const snap = await adminDb.collection(RULES_COLLECTION).orderBy('createdAt', 'desc').get();
      const rules: CommissionRule[] = snap.docs.map((d: any) => d.data() as CommissionRule);

      return res.status(200).json(rules);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch commission rules' });
    }
  });

  /**
   * PUT /api/admin/commission-rules/:ruleId
   * Update a commission rule. Admin only.
   */
  app.put(
    '/api/admin/commission-rules/:ruleId',
    verifyAdmin,
    validate(updateRuleSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });

        const { ruleId } = req.params;
        const updates = req.body;
        updates.updatedAt = new Date().toISOString();

        await adminDb.collection(RULES_COLLECTION).doc(ruleId).update(updates);
        return res.status(200).json({ ruleId, ...updates });
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to update commission rule' });
      }
    },
  );

  /**
   * DELETE /api/admin/commission-rules/:ruleId
   * Soft-delete a commission rule (sets active=false). Admin only.
   */
  app.delete('/api/admin/commission-rules/:ruleId', verifyAdmin, async (req: any, res: any) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });

      const { ruleId } = req.params;
      const now = new Date().toISOString();

      await adminDb.collection(RULES_COLLECTION).doc(ruleId).update({
        active: false,
        updatedAt: now,
      });

      return res.status(200).json({ ruleId, active: false, updatedAt: now });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete commission rule' });
    }
  });

  /**
   * GET /api/commission-rules/defaults
   * Return default rates (public, for authenticated users).
   */
  app.get('/api/commission-rules/defaults', verifyFirebaseToken, (_req: any, res: any) => {
    const defaults = getDefaultRates();
    return res.status(200).json(defaults);
  });

  /**
   * POST /api/orders/calculate-commission
   * Preview commission calculation for a given price/seller/category.
   * Authenticated users can preview.
   */
  app.post(
    '/api/orders/calculate-commission',
    verifyFirebaseToken,
    validate(calculateSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });

        const { sellerId, categoryId, priceInKurus } = req.body;

        // Load all active rules from Firestore
        const snap = await adminDb.collection(RULES_COLLECTION).where('active', '==', true).get();
        const rules: CommissionRule[] = snap.docs.map((d: any) => d.data() as CommissionRule);

        const result = calculateCommission({ priceInKurus, sellerId, categoryId, rules });

        return res.status(200).json(result);
      } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to calculate commission' });
      }
    },
  );

  // ─── Ledger Query Endpoints ─────────────────────────────────────────────

  /**
   * GET /api/ledger/order/:orderSetId
   * Return ledger entries for a specific order.
   * Authenticated users: only if they own the order. Admin: all.
   */
  app.get('/api/ledger/order/:orderSetId', verifyFirebaseToken, async (req: any, res: any) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });

      const { orderSetId } = req.params;

      // Verify ownership: check orderSet belongs to user
      const orderSetSnap = await adminDb.collection('orderSets').doc(orderSetId).get();
      if (!orderSetSnap.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const orderData = orderSetSnap.data()!;
      // Check ownership — admin bypasses
      if (orderData.userId !== req.uid) {
        // Check if admin
        const userSnap = await adminDb.collection('users').doc(req.uid).get();
        const role = userSnap.data()?.role;
        if (role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      // Fetch ledger entries for this order
      const ledgerSnap = await adminDb
        .collection(LEDGER_COLLECTION)
        .where('orderSetId', '==', orderSetId)
        .orderBy('createdAt', 'asc')
        .get();

      const entries = ledgerSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return res.status(200).json(entries);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch ledger entries' });
    }
  });

  /**
   * GET /api/admin/ledger/verify
   * Verify the integrity of the full ledger hash chain. Admin only.
   */
  app.get('/api/admin/ledger/verify', verifyAdmin, async (_req: any, res: any) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not configured' });

      // Import ledgerService dynamically or require it
      const { verifyChain } = await import('../services/ledgerService.js');
      const result = await verifyChain(adminDb);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to verify ledger chain' });
    }
  });
}
