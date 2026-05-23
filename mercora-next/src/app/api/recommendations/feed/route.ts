import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/services/recommendationEngine';

/**
 * GET /api/recommendations/feed
 * Get personalized feed for authenticated user
 * Returns array of recommended products with reasons
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID required' },
        { status: 401 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid limit: must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Get personalized recommendations
    const recommendations = await recommendationEngine.getPersonalizedRecommendations(
      userId,
      limit
    );

    return NextResponse.json({
      success: true,
      data: {
        userId,
        recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GET /api/recommendations/feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations/feed/interaction
 * Record user interaction (view, click, purchase, like) for personalization
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID required' },
        { status: 401 }
      );
    }

    const { productId, interactionType } = await request.json();

    if (!productId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing productId or interactionType' },
        { status: 400 }
      );
    }

    const validTypes = ['view', 'click', 'purchase', 'like', 'dislike', 'cart_add'];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        { error: `Invalid interactionType: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Record interaction
    await recommendationEngine.recordInteraction(userId, productId, interactionType);

    return NextResponse.json({
      success: true,
      message: `Recorded ${interactionType} interaction`,
    });
  } catch (error) {
    console.error('POST /api/recommendations/feed/interaction error:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}
