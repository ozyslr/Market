import { describe, it, expect, vi } from 'vitest';
import { createAuthMiddlewares } from './authMiddleware';
import type { AuthMiddlewares } from './authMiddleware';

// ─── Minimal Express middleware harness ─────────────────────────────────────

function makeAdminAuth(overrides?: { verifyIdToken?: any }) {
  return {
    verifyIdToken: overrides?.verifyIdToken ?? vi.fn(),
  };
}

function makeReq(token?: string) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    uid: undefined,
    userEmail: undefined,
    decodedToken: undefined,
  };
}

function makeRes() {
  const res: any = { _ended: false, statusCode: 200, body: undefined };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: any) => {
    res.body = body;
    res._ended = true;
    return res;
  };
  return res;
}

function makeAuth(): AuthMiddlewares {
  const adminAuth = makeAdminAuth();
  return createAuthMiddlewares(adminAuth as any);
}

// ─── Helper: resolve a decoded token from verifyIdToken ─────────────────────

function resolveToken(middlewares: AuthMiddlewares, decoded: Record<string, unknown>) {
  // Reach into the closure and replace verifyIdToken behaviour.
  // createAuthMiddlewares captures adminAuth by reference, so we can mutate it.
  const adminAuth = (middlewares as any).__adminAuth;
  // We can't easily reach the closure — instead we use the fact that the
  // same adminAuth object is referenced. We'll pass it through a backdoor.
}

// The cleaner approach: we construct a fresh set of middlewares per test
// with a pre-configured mock, then drive requireAdminRole directly.

function driveMiddleware(middleware: (req: any, res: any, next: any) => Promise<void>, req: any) {
  return new Promise<{ res: any; nextCalled: boolean }>((resolve) => {
    const res = makeRes();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
      // resolve after microtask so async middleware can still call res.json
      setImmediate(() => resolve({ res, nextCalled }));
    };
    middleware(req, res, next).then(() => {
      if (!nextCalled) resolve({ res, nextCalled });
    });
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('requireAdminRole', () => {
  it('Test 1: requireAdminRole(finance) with role=admin, adminRole=finance passes', async () => {
    const adminAuth = makeAdminAuth({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        adminRole: 'finance',
      }),
    });
    const { requireAdminRole } = createAuthMiddlewares(adminAuth as any);
    const req = makeReq('valid-token');

    const { res, nextCalled } = await driveMiddleware(requireAdminRole('finance'), req);

    expect(nextCalled).toBe(true);
    expect(res._ended).toBe(false);
    expect(req.uid).toBe('admin-1');
    expect(req.userEmail).toBe('admin@test.com');
    expect(req.decodedToken).toBeDefined();
  });

  it('Test 2: requireAdminRole(finance) with role=admin, adminRole=support returns 403', async () => {
    const adminAuth = makeAdminAuth({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'admin-2',
        email: 'support@test.com',
        role: 'admin',
        adminRole: 'support',
      }),
    });
    const { requireAdminRole } = createAuthMiddlewares(adminAuth as any);
    const req = makeReq('valid-token');

    const { res, nextCalled } = await driveMiddleware(requireAdminRole('finance'), req);

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/insufficient admin role/i);
  });

  it('Test 3: requireAdminRole(finance) with role=admin, adminRole=super-admin passes (superset)', async () => {
    const adminAuth = makeAdminAuth({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'admin-3',
        email: 'super@test.com',
        role: 'admin',
        adminRole: 'super-admin',
      }),
    });
    const { requireAdminRole } = createAuthMiddlewares(adminAuth as any);
    const req = makeReq('valid-token');

    const { res, nextCalled } = await driveMiddleware(requireAdminRole('finance'), req);

    expect(nextCalled).toBe(true);
    expect(res._ended).toBe(false);
  });

  it('Test 4: requireAdminRole(finance) with role=buyer returns 403', async () => {
    const adminAuth = makeAdminAuth({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'buyer-1',
        email: 'buyer@test.com',
        role: 'buyer',
      }),
    });
    const { requireAdminRole } = createAuthMiddlewares(adminAuth as any);
    const req = makeReq('valid-token');

    const { res, nextCalled } = await driveMiddleware(requireAdminRole('finance'), req);

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/admin access required/i);
  });

  it('Test 5: missing/invalid token returns 401', async () => {
    const adminAuth = makeAdminAuth({
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
    });
    const { requireAdminRole } = createAuthMiddlewares(adminAuth as any);
    const req = makeReq('bad-token');

    const { res, nextCalled } = await driveMiddleware(requireAdminRole('finance'), req);

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});
