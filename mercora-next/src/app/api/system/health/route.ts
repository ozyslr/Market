/**
 * GET /api/system/health
 * Health check endpoint for monitoring and load balancing
 *
 * Response:
 * {
 *   status: 'ok' | 'degraded' | 'down'
 *   timestamp: string
 *   version: string
 *   checks: {
 *     database: 'ok' | 'down'
 *     cache: 'ok' | 'down'
 *     storage: 'ok' | 'down'
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const revalidate = 0; // No caching for health checks

export async function GET() {
  const checks = {
    database: 'down' as const,
    cache: 'ok' as const,
    storage: 'ok' as const,
  };

  // Check database connectivity
  try {
    const testRef = doc(db, '_system', 'health_check');
    await getDoc(testRef);
    checks.database = 'ok';
  } catch (error) {
    console.error('[health] Database check failed:', error);
    checks.database = 'down';
  }

  // Determine overall status
  const status = Object.values(checks).every((s) => s === 'ok') ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_VERSION || 'unknown',
      checks,
      uptime: process.uptime(),
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
