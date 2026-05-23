import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/services/recommendationEngine';

/**
 * GET /api/recommendations/similar-products?productId=xxx&limit=8
 * Get similar products (content-based and collaborative)
 * Used for "Customers also viewed" widgets
 */
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '8');
    const excludeIdsParam = request.nextUrl.searchParams.get('excludeIds');

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId parameter' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid limit: must be between 1 and 50' },
        { status: 400 }
      );
    }

    const excludeIds = excludeIdsParam?.split(',') || [];

    // Get similar products
    const recommendations = await recommendationEngine.getSimilarProducts(
      productId,
      excludeIds,
      limit
    );

    return NextResponse.json({
      success: true,
      data: {
        baseProductId: productId,
        similarProducts: recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GET /api/recommendations/similar-products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar products' },
      { status: 500 }
    );
  }
}
