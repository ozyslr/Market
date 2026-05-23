/**
 * Ad Tracking API Endpoint (STREAM K - Phase 3)
 * POST /api/ads/track
 * Tracks impressions, clicks, conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import { adPerformanceService } from '@/services/adPerformanceService';
import { adInventoryService } from '@/services/adInventoryService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, adId, userId, placement, orderId, revenue } = body;

    if (!eventType || !adId) {
      return NextResponse.json(
        { error: 'Missing eventType or adId' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    switch (eventType) {
      case 'impression':
        // Record impression for both ad and inventory
        await adPerformanceService.recordImpression(adId, userId || 'anonymous', placement);
        await adInventoryService.recordImpression(placement, adId);
        break;

      case 'click':
        // Record click
        await adPerformanceService.recordClick(adId, userId || 'anonymous', placement);
        break;

      case 'conversion':
        // Record conversion
        if (!orderId || !revenue) {
          return NextResponse.json(
            { error: 'Missing orderId or revenue for conversion' },
            { status: 400 }
          );
        }
        await adPerformanceService.recordConversion(adId, userId || 'anonymous', orderId, revenue);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid eventType' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        eventType,
        adId,
        message: `${eventType} tracked successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ad tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track ad event' },
      { status: 500 }
    );
  }
}
