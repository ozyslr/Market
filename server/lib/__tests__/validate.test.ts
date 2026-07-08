import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate } from '../validate.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function mockReq(body: unknown) {
  return { body } as any;
}

function mockReqQuery(query: unknown) {
  return { query } as any;
}

function mockReqParams(params: unknown) {
  return { params } as any;
}

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

const next = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── validate middleware ───────────────────────────────────────────────────

describe('validate (body)', () => {
  it('rejects missing required field', () => {
    const schema = z.object({ email: z.string().min(1) });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({}), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects invalid field type', () => {
    const schema = z.object({ age: z.number() });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ age: 'not-a-number' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes valid fields', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().positive(),
      name: z.string().optional(),
    });
    const middleware = validate(schema);
    middleware(mockReq({ email: 'a@b.com', age: 25 }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects value below minimum', () => {
    const schema = z.object({ age: z.number().min(18) });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ age: 12 }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects string exceeding max length', () => {
    const schema = z.object({ name: z.string().max(10) });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ name: 'this is way too long' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes optional field when omitted', () => {
    const schema = z.object({
      name: z.string().min(1),
      bio: z.string().optional(),
    });
    const middleware = validate(schema);
    middleware(mockReq({ name: 'Alice' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('validates optional field when present', () => {
    const schema = z.object({
      name: z.string().min(1),
      bio: z.string().max(5).optional(),
    });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ name: 'Alice', bio: 'too long string' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('ignores extra fields', () => {
    const schema = z.object({ id: z.string().min(1) });
    const middleware = validate(schema);
    middleware(mockReq({ id: 'x', extra: 'ignored' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns field-level error details', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ email: 'not-email', password: '123' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation failed', details: expect.any(Array) }),
    );
  });

  it('rejects missing array items', () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.string().min(1) })).min(1),
    });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ items: [] }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('accepts valid array items', () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.string().min(1) })).min(1),
    });
    const middleware = validate(schema);
    middleware(mockReq({ items: [{ id: 'abc' }, { id: 'def' }] }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects negative number when positive required', () => {
    const schema = z.object({ amount: z.number().positive() });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ amount: -5 }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects non-integer when integer required', () => {
    const schema = z.object({ count: z.number().int() });
    const middleware = validate(schema);
    const res = mockRes();
    middleware(mockReq({ count: 3.5 }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validate (query)', () => {
  it('validates query parameters', () => {
    const schema = z.object({ token: z.string().min(1) });
    const middleware = validate(schema, 'query');
    const res = mockRes();
    middleware(mockReqQuery({}), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes valid query parameters', () => {
    const schema = z.object({ token: z.string().min(1) });
    const middleware = validate(schema, 'query');
    middleware(mockReqQuery({ token: 'abc123' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('coerces query number params', () => {
    const schema = z.object({ limit: z.coerce.number().int().positive().optional() });
    const middleware = validate(schema, 'query');
    middleware(mockReqQuery({ limit: '25' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
