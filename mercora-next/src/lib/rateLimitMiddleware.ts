/**
 * Rate Limiting Middleware (STREAM C)
 * Prevents abuse with sliding window counter
 *
 * Features:
 * - Per IP rate limiting
 * - Per user rate limiting
 * - Configurable limits and windows
 * - Redis or in-memory storage
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory store (for MVP, use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired entries
 */
function cleanup() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (data.resetTime < now) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Get client IP from request
 */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-client-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientIp(req);
    const now = Date.now();

    // Cleanup old entries occasionally
    if (Math.random() < 0.01) {
      cleanup();
    }

    // Get or create counter
    let entry = requestCounts.get(key);
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + config.windowMs };
      requestCounts.set(key, entry);
    }

    // Increment counter
    entry.count++;

    if (entry.count > config.maxRequests) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(entry.resetTime),
          },
        }
      );
    }

    // Continue to next handler
    return null;
  };
}

/**
 * Rate limit configs for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints: 5 requests per minute
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },

  // Checkout: 10 requests per minute
  checkout: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },

  // API general: 60 requests per minute
  api: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },

  // Search: 30 requests per minute
  search: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },

  // Payment: 5 requests per minute
  payment: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
};

/**
 * Extract user ID from request for user-based rate limiting
 */
export function getUserKey(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    // In production, decode JWT here
    // For now, use a simple header
    const token = authHeader.replace('Bearer ', '');
    return `user_${token}`;
  } catch {
    return null;
  }
}

/**
 * Export getClientIp for use in other modules
 */
export { getClientIp };
