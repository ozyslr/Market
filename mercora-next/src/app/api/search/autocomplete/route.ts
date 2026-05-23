import { NextRequest, NextResponse } from 'next/server';
import { advancedSearchService } from '@/services/advancedSearchService';

/**
 * GET /api/search/autocomplete?q=wire&limit=10
 * Get search autocomplete suggestions
 * Returns popular searches, product names, and spelling corrections
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    // Validate inputs
    if (q.length < 1) {
      return NextResponse.json(
        { error: 'Query must be at least 1 character' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Get suggestions
    const suggestions = await advancedSearchService.autocomplete(q, limit);

    return NextResponse.json({
      success: true,
      data: {
        query: q,
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error) {
    console.error('GET /api/search/autocomplete error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
