/**
 * Zod-based request validation middleware.
 * Replaces the old predicate-based system with full type-safety.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Returns Express middleware that validates the given request property
 * against a Zod schema. On failure, responds with 400 and field-level errors.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
        return `${path}: ${issue.message}`;
      });
      return res.status(400).json({ error: 'Validation failed', details });
    }

    // Replace the parsed value with the safe, typed output
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
