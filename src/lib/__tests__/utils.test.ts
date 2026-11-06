import { describe, it, expect } from 'vitest';
import { cn, discountPercent } from '../utils';

describe('discountPercent', () => {
  it('computes from oldPrice, rounded', () => {
    expect(discountPercent({ price: 70, oldPrice: 100 })).toBe(30);
    expect(discountPercent({ price: 199, oldPrice: 269 })).toBe(26);
  });
  it('prefers prices over a stale stored percentage, falls back to it otherwise', () => {
    expect(discountPercent({ price: 50, oldPrice: 100, discountPercentage: 10 })).toBe(50);
    expect(discountPercent({ price: 50, discountPercentage: 15 })).toBe(15);
  });
  it('is 0 without a discount', () => {
    expect(discountPercent({ price: 50 })).toBe(0);
    expect(discountPercent({ price: 50, oldPrice: 40 })).toBe(0);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false, 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });

  it('handles clsx array syntax', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
