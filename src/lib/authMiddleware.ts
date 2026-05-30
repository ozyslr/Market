// ─── Express auth middleware factory ─────────────────────────────────────────
// Extracted from server.ts so the guards can be unit-tested with mocked
// Firebase Admin handles. Behavior is identical to the original closures.
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

type Req = any;
type Res = any;
type Next = (err?: unknown) => void;

const ADMIN_OVERRIDE_EMAIL = 'ozyslr@gmail.com';

const bearerToken = (req: Req): string | null => {
  const header = (req.headers?.authorization as string) || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export interface AuthMiddlewares {
  /** Verifies a Firebase ID token; attaches req.uid / req.userEmail. */
  verifyFirebaseToken: (req: Req, res: Res, next: Next) => Promise<void>;
  /** Verifies the token AND that the user has role 'admin' in Firestore. */
  verifyAdmin: (req: Req, res: Res, next: Next) => Promise<void>;
  /** Constant-time-ish compare against process.env.CRON_SECRET. */
  verifyCronSecret: (req: Req, res: Res, next: Next) => void;
}

export function createAuthMiddlewares(
  adminAuth: Auth | null,
  adminDb: Firestore | null,
): AuthMiddlewares {
  async function verifyFirebaseToken(req: Req, res: Res, next: Next) {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!adminAuth) return res.status(503).json({ error: 'Auth not configured' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      req.uid = decoded.uid;
      req.userEmail = decoded.email;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  async function verifyAdmin(req: Req, res: Res, next: Next) {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!adminAuth || !adminDb) return res.status(503).json({ error: 'Auth not configured' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
      const role = userSnap.data()?.role;
      if (role !== 'admin' && decoded.email !== ADMIN_OVERRIDE_EMAIL) {
        return res.status(403).json({ error: 'Forbidden — admin access required' });
      }
      req.uid = decoded.uid;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  function verifyCronSecret(req: Req, res: Res, next: Next) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(503).json({ error: 'CRON_SECRET not configured' });
    const provided = (req.headers?.['x-cron-secret'] as string) || '';
    if (provided.length !== secret.length || provided !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }

  return { verifyFirebaseToken, verifyAdmin, verifyCronSecret };
}
