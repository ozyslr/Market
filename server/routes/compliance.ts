// ─── Compliance API Routes ────────────────────────────────────────────────────
// Data deletion request flow per D-08: submit -> admin review -> approve/reject
import type { Express } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import {
  submitDeletionRequest,
  getDeletionRequests,
  approveDeletion,
  rejectDeletion,
} from '../services/complianceService.js';
import { adminDb } from '../../src/lib/firebase-admin.js';
import { audit } from '../lib/auditLog.js';

type Middleware = (req: any, res: any, next: any) => any;

const deleteReqSchema = z.object({ reason: z.string().min(5).max(500) });
const rejectSchema = z.object({ reason: z.string().min(3).max(500) });

export function registerComplianceRoutes(
  app: Express,
  deps: { adminDb: any; verifyFirebaseToken: Middleware; verifyAdmin: Middleware },
) {
  const { verifyFirebaseToken, verifyAdmin } = deps;

  // POST /api/compliance/deletion-request — submit by authenticated user
  app.post(
    '/api/compliance/deletion-request',
    verifyFirebaseToken,
    validate(deleteReqSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });
        const { reason } = req.body;
        const result = await submitDeletionRequest(adminDb, req.uid, reason);
        return res.status(201).json(result);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // GET /api/admin/compliance/deletion-requests — list (admin)
  app.get('/api/admin/compliance/deletion-requests', verifyAdmin, async (req: any, res: any) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });
      const status = req.query.status as string | undefined;
      const requests = await getDeletionRequests(adminDb, status);
      return res.status(200).json(requests);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/compliance/deletion-requests/:requestId/approve
  app.post(
    '/api/admin/compliance/deletion-requests/:requestId/approve',
    verifyAdmin,
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });
        const { requestId } = req.params;
        await approveDeletion(adminDb, requestId, req.uid);
        audit(
          req.uid,
          req.userEmail ?? '',
          req.decodedToken?.role || 'admin',
          'user.data_deletion',
          'user',
          requestId,
          undefined,
          'GDPR data deletion approved',
        );
        return res.status(200).json({ approved: true, requestId });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // POST /api/admin/compliance/deletion-requests/:requestId/reject
  app.post(
    '/api/admin/compliance/deletion-requests/:requestId/reject',
    verifyAdmin,
    validate(rejectSchema),
    async (req: any, res: any) => {
      try {
        if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });
        const { requestId } = req.params;
        const { reason } = req.body;
        await rejectDeletion(adminDb, requestId, reason, req.uid);
        audit(
          req.uid,
          req.userEmail ?? '',
          req.decodedToken?.role || 'admin',
          'user.data_deletion',
          'user',
          requestId,
          undefined,
          `GDPR data deletion rejected: ${reason}`,
        );
        return res.status(200).json({ rejected: true, requestId });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );
}
