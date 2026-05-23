import { NextRequest, NextResponse } from 'next/server';
import { advancedSearchService } from '@/services/advancedSearchService';

/**
 * GET /api/search/trending?limit=10
 * Get trending searches in real-time
 * Updated every 5 minutes based on search volume
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    // Validate input
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Get trending searches
    const trending = await advancedSearchService.getTrendingSearches(limit);

    return NextResponse.json({
      success: true,
      data: {
        trending,
        count: trending.length,
        refreshedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GET /api/search/trending error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending searches' },
      { status: 500 }
    );
  }
}
