import { describe, it, expect } from 'vitest';
import { isFiniteNumber, isNonEmptyString, itemsSignature } from '../serverValidators';

describe('isFiniteNumber', () => {
  it('accepts real finite numbers', () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(42)).toBe(true);
    expect(isFiniteNumber(-3.14)).toBe(true);
  });

  it('rejects NaN and Infinity', () => {
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });

  it('rejects non-number types', () => {
    expect(isFiniteNumber('5')).toBe(false);
    expect(isFiniteNumber(null)).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
    expect(isFiniteNumber({})).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('accepts non-empty strings within bound', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString('a')).toBe(true);
  });

  it('rejects empty strings', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('rejects strings longer than max', () => {
    expect(isNonEmptyString('abcdef', 5)).toBe(false);
    expect(isNonEmptyString('abcde', 5)).toBe(true);
  });

  it('rejects non-string types', () => {
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });
});

describe('itemsSignature', () => {
  it('is independent of item order', () => {
    const a = itemsSignature([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
    const b = itemsSignature([
      { productId: 'p2', quantity: 1 },
      { productId: 'p1', quantity: 2 },
    ]);
    expect(a).toBe(b);
  });

  it('distinguishes different quantities', () => {
    const a = itemsSignature([{ productId: 'p1', quantity: 2 }]);
    const b = itemsSignature([{ productId: 'p1', quantity: 3 }]);
    expect(a).not.toBe(b);
  });

  it('distinguishes variants', () => {
    const a = itemsSignature([{ productId: 'p1', variantId: 'red', quantity: 1 }]);
    const b = itemsSignature([{ productId: 'p1', variantId: 'blue', quantity: 1 }]);
    expect(a).not.toBe(b);
  });

  it('treats missing variantId as empty', () => {
    const a = itemsSignature([{ productId: 'p1', quantity: 1 }]);
    const b = itemsSignature([{ productId: 'p1', variantId: '', quantity: 1 }]);
    expect(a).toBe(b);
  });

  it('produces a stable signature for the same input', () => {
    const items = [
      { productId: 'p3', variantId: 'L', quantity: 5 },
      { productId: 'p1', quantity: 1 },
    ];
    expect(itemsSignature(items)).toBe(itemsSignature(items));
  });
});
