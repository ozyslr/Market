import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateBody, isString, isNumber, isBoolean, isNonEmptyString, isEmail, isArray, maxLength, numberRange } from '../validate.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function mockReq(body: unknown) {
  return { body } as any;
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

// ─── Validator predicates ──────────────────────────────────────────────────

describe('validator predicates', () => {
  describe('isString', () => {
    it('returns true for strings', () => { expect(isString('hello')).toBe(true); });
    it('returns false for numbers', () => { expect(isString(42)).toBe(false); });
    it('returns false for null', () => { expect(isString(null)).toBe(false); });
    it('returns false for undefined', () => { expect(isString(undefined)).toBe(false); });
  });

  describe('isNumber', () => {
    it('returns true for numbers', () => { expect(isNumber(42)).toBe(true); });
    it('returns true for zero', () => { expect(isNumber(0)).toBe(true); });
    it('returns false for NaN', () => { expect(isNumber(NaN)).toBe(false); });
    it('returns false for Infinity', () => { expect(isNumber(Infinity)).toBe(false); });
    it('returns false for strings', () => { expect(isNumber('42')).toBe(false); });
  });

  describe('isBoolean', () => {
    it('returns true for true', () => { expect(isBoolean(true)).toBe(true); });
    it('returns true for false', () => { expect(isBoolean(false)).toBe(true); });
    it('returns false for 0', () => { expect(isBoolean(0)).toBe(false); });
  });

  describe('isNonEmptyString', () => {
    it('returns true for non-empty', () => { expect(isNonEmptyString('hi')).toBe(true); });
    it('returns false for empty', () => { expect(isNonEmptyString('')).toBe(false); });
    it('returns false for number', () => { expect(isNonEmptyString(1)).toBe(false); });
  });

  describe('isEmail', () => {
    it('returns true for valid email', () => { expect(isEmail('a@b.com')).toBe(true); });
    it('returns false for missing @', () => { expect(isEmail('ab.com')).toBe(false); });
    it('returns false for number', () => { expect(isEmail(42)).toBe(false); });
  });

  describe('isArray', () => {
    it('returns true for arrays', () => { expect(isArray([1, 2])).toBe(true); });
    it('returns false for objects', () => { expect(isArray({})).toBe(false); });
  });

  describe('maxLength', () => {
    const check = maxLength(5);
    it('passes for string within limit', () => { expect(check('hello')).toBe(true); });
    it('fails for string over limit', () => { expect(check('too long')).toBe(false); });
    it('fails for empty string', () => { expect(check('')).toBe(false); });
    it('fails for non-string', () => { expect(check(123)).toBe(false); });
  });

  describe('numberRange', () => {
    const check = numberRange(0, 100);
    it('passes for value in range', () => { expect(check(50)).toBe(true); });
    it('passes for min boundary', () => { expect(check(0)).toBe(true); });
    it('passes for max boundary', () => { expect(check(100)).toBe(true); });
    it('fails below min', () => { expect(check(-1)).toBe(false); });
    it('fails above max', () => { expect(check(101)).toBe(false); });
    it('fails for NaN', () => { expect(check(NaN)).toBe(false); });
  });
});

// ─── validateBody middleware ────────────────────────────────────────────────

describe('validateBody', () => {
  it('rejects null body', () => {
    const middleware = validateBody([{ name: 'email', check: isString }]);
    middleware(mockReq(null), mockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects missing required field', () => {
    const middleware = validateBody([{ name: 'email', check: isString }]);
    const res = mockRes();
    middleware(mockReq({}), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects invalid field value', () => {
    const middleware = validateBody([{ name: 'age', check: isNumber }]);
    const res = mockRes();
    middleware(mockReq({ age: 'not-a-number' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes valid required fields', () => {
    const middleware = validateBody([
      { name: 'email', check: isNonEmptyString },
      { name: 'age', check: isNumber },
    ]);
    middleware(mockReq({ email: 'a@b.com', age: 25 }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('skips validation for missing optional field', () => {
    const middleware = validateBody([
      { name: 'name', check: isNonEmptyString },
      { name: 'bio', check: isNonEmptyString, required: false },
    ]);
    middleware(mockReq({ name: 'Alice' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('validates optional field when present', () => {
    const middleware = validateBody([
      { name: 'name', check: isNonEmptyString },
      { name: 'bio', check: maxLength(10), required: false },
    ]);
    const res = mockRes();
    middleware(mockReq({ name: 'Alice', bio: 'this is way too long' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes non-body keys silently', () => {
    const middleware = validateBody([{ name: 'id', check: isNonEmptyString }]);
    middleware(mockReq({ id: 'x', extra: 'ignored' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('uses custom error message', () => {
    const middleware = validateBody([{ name: 'token', check: isNonEmptyString, message: 'Token gerekli' }]);
    const res = mockRes();
    middleware(mockReq({}), res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Token gerekli') }));
  });

  it('collects multiple errors', () => {
    const middleware = validateBody([
      { name: 'email', check: isNonEmptyString },
      { name: 'age', check: isNumber },
    ]);
    const res = mockRes();
    middleware(mockReq({}), res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining(';') }));
  });
});
