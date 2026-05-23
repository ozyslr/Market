import { NextRequest, NextResponse } from 'next/server';
import { fraudDetectionService } from '@/services/fraudDetectionService';

/**
 * POST /api/fraud/dispute-review
 * Check if a review is likely fake
 * Used by mods to validate review authenticity
 */
export async function POST(request: NextRequest) {
  try {
    const {
      reviewText,
      rating,
      userId,
      productId,
      ipAddress,
    } = await request.json();

    // Validate inputs
    if (!reviewText || !rating || !userId || !productId || !ipAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: reviewText, rating, userId, productId, ipAddress' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (reviewText.length < 10 || reviewText.length > 5000) {
      return NextResponse.json(
        { error: 'Review text must be between 10 and 5000 characters' },
        { status: 400 }
      );
    }

    // Detect fake review
    const result = await fraudDetectionService.detectFakeReview(
      reviewText,
      rating,
      userId,
      productId,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      data: {
        productId,
        userId,
        isFake: result.isFake,
        confidence: result.confidence,
        reasons: result.reasons,
        recommendation: result.isFake ? 'flag_for_review' : 'approve',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/fraud/dispute-review error:', error);
    return NextResponse.json(
      { error: 'Failed to check review authenticity' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fraud/dispute-review?reviewId=xxx
 * Get dispute status for a review
 */
export async function GET(request: NextRequest) {
  try {
    const reviewId = request.nextUrl.searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Missing reviewId parameter' },
        { status: 400 }
      );
    }

    // In production: Query review dispute status from database
    // For now, return mock data
    const mockDispute = {
      reviewId,
      status: 'pending_review',
      flaggedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      flagCount: 3,
      reasons: ['Text matches other review', 'Same IP as other flagged reviews'],
      moderatorNote: null,
      decision: null,
    };

    return NextResponse.json({
      success: true,
      data: mockDispute,
    });
  } catch (error) {
    console.error('GET /api/fraud/dispute-review error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispute status' },
      { status: 500 }
    );
  }
}
