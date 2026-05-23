import { NextRequest, NextResponse } from 'next/server';
import { advancedSearchService } from '@/services/advancedSearchService';

/**
 * GET /api/search/analytics?query=headphones
 * Get analytics for a search query
 * Returns: search count, click-through rate, conversion rate, avg results
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const query = request.nextUrl.searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Get search analytics
    const analytics = await advancedSearchService.getSearchAnalytics(query);

    return NextResponse.json({
      success: true,
      data: {
        query,
        analytics,
        insights: {
          engagement: analytics.clickThroughRate > 30 ? 'high' : analytics.clickThroughRate > 15 ? 'medium' : 'low',
          conversion: analytics.conversionRate > 10 ? 'high' : analytics.conversionRate > 5 ? 'medium' : 'low',
          popularity: analytics.searchCount > 1000 ? 'trending' : analytics.searchCount > 100 ? 'popular' : 'niche',
        },
      },
    });
  } catch (error) {
    console.error('GET /api/search/analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/rebuild-index
 * Rebuild search index (admin only, triggers async job)
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { productIds } = await request.json();

    // Trigger index rebuild
    const result = await advancedSearchService.rebuildSearchIndex(productIds);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Index rebuild triggered',
        indexed: result.indexed,
        failed: result.failed,
        triggeredAt: new Date().toISOString(),
        triggeredBy: adminId,
      },
    });
  } catch (error) {
    console.error('POST /api/search/rebuild-index error:', error);
    return NextResponse.json(
      { error: 'Failed to rebuild index' },
      { status: 500 }
    );
  }
}
