/**
 * Lightweight request body validation middleware.
 * Zero-dependency — uses predicate functions instead of a schema library.
 */

import type { Request, Response, NextFunction } from 'express';

// ─── Types ─────────────────────────────────────────────────────────────────

type ValidatorFn = (v: unknown) => boolean;

interface FieldDef {
  /** Human-readable field name for error messages */
  name: string;
  /** Validation predicate */
  check: ValidatorFn;
  /** Whether the field is required (default true) */
  required?: boolean;
  /** Custom error message */
  message?: string;
}

// ─── Built-in predicates ───────────────────────────────────────────────────

export const isString = (v: unknown): v is string => typeof v === 'string';
export const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
export const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
export const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
export const isEmail = (v: unknown): v is boolean => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v as string);
export const isStringOrNumber = (v: unknown): v is string | number =>
  typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v));

/** Value must be a non-empty string within the given max length. */
export const maxLength = (max: number): ValidatorFn =>
  (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= max;

/** Value must be a number within [min, max]. */
export const numberRange = (min: number, max: number): ValidatorFn =>
  (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

// ─── Middleware factory ─────────────────────────────────────────────────────

/**
 * Returns Express middleware that validates req.body against the given field definitions.
 * On failure, responds with 400 and a descriptive error. On success, calls next().
 */
export function validateBody(fields: FieldDef[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const errors: string[] = [];

    for (const field of fields) {
      const value = (body as Record<string, unknown>)[field.name];
      const isRequired = field.required !== false;

      if (value === undefined || value === null) {
        if (isRequired) {
          errors.push(field.message || `${field.name} is required`);
        }
        continue;
      }

      if (!field.check(value)) {
        errors.push(field.message || `${field.name} is invalid`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('; ') });
    }

    next();
  };
}
