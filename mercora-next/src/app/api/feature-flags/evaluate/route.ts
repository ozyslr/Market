/**
 * POST /api/feature-flags/evaluate
 * Evaluate feature flags for user
 *
 * Request body:
 * {
 *   flags: string[] (flag names to check)
 *   userId?: string
 *   region?: string
 *   tier?: string
 * }
 *
 * Response:
 * {
 *   flags: Record<string, boolean>
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlagService';

interface EvaluateRequest {
  flags: string[];
  userId?: string;
  region?: string;
  tier?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluateRequest = await request.json();

    if (!body.flags || !Array.isArray(body.flags)) {
      return NextResponse.json(
        { error: 'flags array is required' },
        { status: 400 }
      );
    }

    const result: Record<string, boolean> = {};

    // Evaluate each flag
    for (const flagName of body.flags) {
      const enabled = await featureFlags.isFlagEnabled(
        flagName,
        body.userId,
        body.region,
        body.tier
      );
      result[flagName] = enabled;
    }

    return NextResponse.json({ flags: result });
  } catch (error) {
    console.error('[feature-flags] Error evaluating flags:', error);

    return NextResponse.json(
      { error: 'Failed to evaluate flags' },
      { status: 500 }
    );
  }
}
