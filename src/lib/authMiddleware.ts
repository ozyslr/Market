// ─── Express auth middleware factory ─────────────────────────────────────────
// Provides role-based Express middleware backed by Firebase custom claims.
// Custom claims ({ role, sellerId? }) are set via Admin SDK and verified
// from decoded ID tokens — zero Firestore reads for role checks (Pitfall 1).
import type { Auth } from 'firebase-admin/auth';
import type { AdminRole } from '../types.js';

type Req = any;
type Res = any;
type Next = (err?: unknown) => void;

const bearerToken = (req: Req): string | null => {
  const header = (req.headers?.authorization as string) || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export interface AuthMiddlewares {
  /** Verifies a Firebase ID token; attaches decoded.uid / decoded.userEmail. */
  verifyFirebaseToken: (req: Req, res: Res, next: Next) => Promise<void>;
  /** Verifies the token AND that decoded.role === 'admin' (custom claims). */
  verifyAdmin: (req: Req, res: Res, next: Next) => Promise<void>;
  /** Verifies the token AND that decoded.role === 'seller'. */
  verifySeller: (req: Req, res: Res, next: Next) => Promise<void>;
  /** Verifies the token AND that decoded.role is 'buyer' (admin also allowed). */
  verifyBuyer: (req: Req, res: Res, next: Next) => Promise<void>;
  /** Constant-time-ish compare against process.env.CRON_SECRET. */
  verifyCronSecret: (req: Req, res: Res, next: Next) => void;
  /**
   * Returns middleware that verifies the token, requires `role === 'admin'`,
   * and enforces that `decoded.adminRole` is either `'super-admin'` or one of
   * the allowed sub-roles. Super-admin passes every gate.
   */
  requireAdminRole: (...allowed: AdminRole[]) => (req: Req, res: Res, next: Next) => Promise<void>;
}

export function createAuthMiddlewares(adminAuth: Auth | null): AuthMiddlewares {
  async function verifyFirebaseToken(req: Req, res: Res, next: Next) {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!adminAuth) return res.status(503).json({ error: 'Auth not configured' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      req.uid = decoded.uid;
      req.userEmail = decoded.email;
      req.decodedToken = decoded; // expose for downstream claim checks
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  async function verifyAdmin(req: Req, res: Res, next: Next) {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!adminAuth) return res.status(503).json({ error: 'Auth not configured' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden — admin access required' });
      }
      req.uid = decoded.uid;
      req.userEmail = decoded.email;
      req.decodedToken = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  async function verifySeller(req: Req, res: Res, next: Next) {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!adminAuth) return res.status(503).json({ error: 'Auth not configured' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.role !== 'seller') {
        return res.status(403).json({ error: 'Forbidden — seller access required' });
      }
      req.uid = decoded.uid;
      req.userEmail = decoded.email;
      req.decodedToken = decoded;
      req.sellerId = decoded.sellerId || null;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  async function verifyBuyer(req: Req, res: Res, next: Next) {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!adminAuth) return res.status(503).json({ error: 'Auth not configured' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      // Admin can do everything a buyer can
      if (decoded.role !== 'buyer' && decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden — buyer access required' });
      }
      req.uid = decoded.uid;
      req.userEmail = decoded.email;
      req.decodedToken = decoded;
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

  function requireAdminRole(...allowed: AdminRole[]) {
    return async (req: Req, res: Res, next: Next) => {
      const token = bearerToken(req);
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      if (!adminAuth) return res.status(503).json({ error: 'Auth not configured' });
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden — admin access required' });
        }
        const adminRole = decoded.adminRole as AdminRole | undefined;
        if (adminRole !== 'super-admin' && !allowed.includes(adminRole as AdminRole)) {
          return res.status(403).json({ error: 'Forbidden — insufficient admin role' });
        }
        req.uid = decoded.uid;
        req.userEmail = decoded.email;
        req.decodedToken = decoded;
        next();
      } catch {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  return {
    verifyFirebaseToken,
    verifyAdmin,
    verifySeller,
    verifyBuyer,
    verifyCronSecret,
    requireAdminRole,
  };
}
