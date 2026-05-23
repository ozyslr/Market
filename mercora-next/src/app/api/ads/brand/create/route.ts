/**
 * Create Brand Ad API Endpoint (STREAM K - Phase 3)
 * POST /api/ads/brand/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { brandAdService } from '@/services/brandAdService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandId,
      title,
      description,
      imageUrl,
      landingUrl,
      cpmBid,
      dailyBudget,
      monthlyBudget,
      placements,
      targetSegments,
      startDate,
      endDate,
    } = body;

    // Validate required fields
    if (!brandId || !title || !imageUrl || !landingUrl || !cpmBid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate landing URL
    const urlValidation = await brandAdService.validateLandingUrl(landingUrl);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      );
    }

    // Create ad
    const ad = await brandAdService.createAd({
      brandId,
      title,
      description,
      imageUrl,
      landingUrl,
      cpmBid,
      dailyBudget,
      monthlyBudget,
      placements: placements || ['homepage'],
      targetSegments,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        adId: ad.id,
        ad,
        message: 'Ad created and submitted for approval',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create brand ad error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create brand ad' },
      { status: 500 }
    );
  }
}
