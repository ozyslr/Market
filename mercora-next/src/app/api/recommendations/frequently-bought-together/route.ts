import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/services/recommendationEngine';

/**
 * GET /api/recommendations/frequently-bought-together?productIds=id1,id2&limit=5
 * Get products frequently purchased with given products
 * Used for cart upsell recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const productIdsParam = request.nextUrl.searchParams.get('productIds');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5');

    if (!productIdsParam) {
      return NextResponse.json(
        { error: 'Missing productIds parameter' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Invalid limit: must be between 1 and 20' },
        { status: 400 }
      );
    }

    const productIds = productIdsParam.split(',');

    // Get frequently bought together
    const recommendations = await recommendationEngine.getFrequentlyBoughtTogether(
      productIds,
      limit
    );

    return NextResponse.json({
      success: true,
      data: {
        productIds,
        frequentlyBoughtTogether: recommendations,
        count: recommendations.length,
        message: `Products frequently bought with ${productIds.join(', ')}`,
      },
    });
  } catch (error) {
    console.error('GET /api/recommendations/frequently-bought-together error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch frequently bought together products' },
      { status: 500 }
    );
  }
}
