/**
 * POST /api/monitoring/metrics
 * Receives performance metrics from client
 *
 * Request body:
 * {
 *   name: string (metric name)
 *   value: number
 *   timestamp: number
 *   labels?: object (tags for grouping)
 * }
 *
 * Response:
 * {
 *   success: boolean
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MetricRequest {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: MetricRequest = await request.json();

    const metric = {
      name: body.name,
      value: body.value,
      timestamp: new Date(body.timestamp),
      labels: body.labels || {},
      recordedAt: Timestamp.now(),
      url: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    };

    const metricsRef = collection(db, 'metrics');
    await addDoc(metricsRef, metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[metrics] Error recording metric:', error);

    // Still return success
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
