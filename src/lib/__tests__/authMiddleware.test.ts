import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthMiddlewares } from '../authMiddleware';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('verifyFirebaseToken', () => {
  it('401s when no bearer token is present', async () => {
    const { verifyFirebaseToken } = createAuthMiddlewares(null, null);
    const res = mockRes();
    const next = vi.fn();
    await verifyFirebaseToken({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('503s when auth is not configured', async () => {
    const { verifyFirebaseToken } = createAuthMiddlewares(null, null);
    const res = mockRes();
    const next = vi.fn();
    await verifyFirebaseToken({ headers: { authorization: 'Bearer x' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('attaches uid/email and calls next on a valid token', async () => {
    const adminAuth: any = { verifyIdToken: vi.fn().mockResolvedValue({ uid: 'u1', email: 'a@b.c' }) };
    const { verifyFirebaseToken } = createAuthMiddlewares(adminAuth, null);
    const req: any = { headers: { authorization: 'Bearer good' } };
    const res = mockRes();
    const next = vi.fn();
    await verifyFirebaseToken(req, res, next);
    expect(req.uid).toBe('u1');
    expect(req.userEmail).toBe('a@b.c');
    expect(next).toHaveBeenCalled();
  });

  it('401s when token verification throws', async () => {
    const adminAuth: any = { verifyIdToken: vi.fn().mockRejectedValue(new Error('bad')) };
    const { verifyFirebaseToken } = createAuthMiddlewares(adminAuth, null);
    const res = mockRes();
    const next = vi.fn();
    await verifyFirebaseToken({ headers: { authorization: 'Bearer bad' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('verifyAdmin', () => {
  const makeDb = (role?: string) => ({
    collection: () => ({ doc: () => ({ get: vi.fn().mockResolvedValue({ data: () => ({ role }) }) }) }),
  });

  it('allows users with role admin', async () => {
    const adminAuth: any = { verifyIdToken: vi.fn().mockResolvedValue({ uid: 'u1', email: 'x@y.z' }) };
    const { verifyAdmin } = createAuthMiddlewares(adminAuth, makeDb('admin') as any);
    const req: any = { headers: { authorization: 'Bearer ok' } };
    const res = mockRes();
    const next = vi.fn();
    await verifyAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.uid).toBe('u1');
  });

  it('403s non-admin users', async () => {
    const adminAuth: any = { verifyIdToken: vi.fn().mockResolvedValue({ uid: 'u2', email: 'x@y.z' }) };
    const { verifyAdmin } = createAuthMiddlewares(adminAuth, makeDb('buyer') as any);
    const res = mockRes();
    const next = vi.fn();
    await verifyAdmin({ headers: { authorization: 'Bearer ok' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows the override email even without admin role', async () => {
    const adminAuth: any = { verifyIdToken: vi.fn().mockResolvedValue({ uid: 'u3', email: 'ozyslr@gmail.com' }) };
    const { verifyAdmin } = createAuthMiddlewares(adminAuth, makeDb('buyer') as any);
    const next = vi.fn();
    await verifyAdmin({ headers: { authorization: 'Bearer ok' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('verifyCronSecret', () => {
  const OLD = process.env.CRON_SECRET;
  beforeEach(() => { process.env.CRON_SECRET = 'topsecret'; });
  afterEach(() => { process.env.CRON_SECRET = OLD; });

  it('503s when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    const { verifyCronSecret } = createAuthMiddlewares(null, null);
    const res = mockRes();
    verifyCronSecret({ headers: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('401s on a wrong secret', () => {
    const { verifyCronSecret } = createAuthMiddlewares(null, null);
    const res = mockRes();
    const next = vi.fn();
    verifyCronSecret({ headers: { 'x-cron-secret': 'wrong' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next on the correct secret', () => {
    const { verifyCronSecret } = createAuthMiddlewares(null, null);
    const next = vi.fn();
    verifyCronSecret({ headers: { 'x-cron-secret': 'topsecret' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
