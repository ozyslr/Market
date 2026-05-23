/**
 * API Middleware Utilities (STREAM C)
 * Apply rate limiting, monitoring, and error handling to API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS, getClientIp } from './rateLimitMiddleware';
import { logError } from '@/services/errorHandlingService';
import { monitoring } from '@/services/monitoringService';

export type ApiHandler = (req: NextRequest) => Promise<Response>;

/**
 * Wrap API handler with middleware stack
 */
export function withMiddleware(
  handler: ApiHandler,
  options?: {
    rateLimit?: 'auth' | 'checkout' | 'api' | 'search' | 'payment';
    monitoring?: boolean;
    errorHandling?: boolean;
  }
) {
  const opts = {
    rateLimit: 'api',
    monitoring: true,
    errorHandling: true,
    ...options,
  };

  return async (req: NextRequest): Promise<Response> => {
    const startTime = Date.now();

    try {
      // Rate limiting
      if (opts.rateLimit) {
        const config = RATE_LIMITS[opts.rateLimit as keyof typeof RATE_LIMITS];
        const rateLimitResult = await rateLimit(config)(req);
        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // Call handler
      const response = await handler(req);

      // Recording metrics
      if (opts.monitoring) {
        const duration = Date.now() - startTime;
        const endpoint = new URL(req.url).pathname;

        monitoring.recordApiLatency(endpoint, duration);
        monitoring.recordMetric('api.response_status', response.status, { endpoint });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      if (opts.errorHandling) {
        const endpoint = new URL(req.url).pathname;
        logError({
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          context: `API:${endpoint}`,
          severity: 'error',
          metadata: { duration, method: req.method },
        });

        // Record error metric
        if (opts.monitoring) {
          monitoring.recordMetric('api.error', 1, { endpoint });
        }
      }

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          id: `err_${Date.now()}`,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a protected API route (requires auth)
 */
export function createProtectedRoute(
  handler: (req: NextRequest, userId: string) => Promise<Response>,
  options?: Parameters<typeof withMiddleware>[1]
) {
  return withMiddleware(async (req: NextRequest) => {
    // Extract user from auth header or cookie
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, verify JWT token
    // For now, use token as user ID
    const userId = token;

    return handler(req, userId);
  }, options);
}

/**
 * Validation middleware
 */
export function validate(schema: Record<string, any>) {
  return async (req: NextRequest) => {
    const body = await req.json();

    const errors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      if (rules.required && !value) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (rules.type && typeof value !== rules.type) {
        errors[field] = `${field} must be ${rules.type}`;
      }

      if (rules.minLength && value?.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
      }

      if (rules.maxLength && value?.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = `${field} has invalid format`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    return null; // Validation passed
  };
}
