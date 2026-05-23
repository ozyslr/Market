/**
 * POST /api/monitoring/web-vitals
 * Receives Web Vitals measurements from clients
 *
 * Request body:
 * {
 *   name: string (LCP, FID, CLS, FCP, TTFB)
 *   value: number (milliseconds or unitless)
 *   rating: string (good, needs-improvement, poor)
 *   timestamp: number
 *   url: string
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

interface WebVitalRequest {
  name: string;
  value: number;
  rating: string;
  timestamp: number;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WebVitalRequest = await request.json();

    const vital = {
      name: body.name,
      value: body.value,
      rating: body.rating,
      url: body.url,
      timestamp: new Date(body.timestamp),
      recordedAt: Timestamp.now(),
      userAgent: request.headers.get('user-agent'),
    };

    // Alert on poor vitals
    if (body.rating === 'poor') {
      console.warn('[web-vitals] Poor vital detected:', vital);
    }

    const vitalsRef = collection(db, 'web_vitals');
    await addDoc(vitalsRef, vital);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[web-vitals] Error recording vital:', error);

    // Still return success
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
