import { NextRequest, NextResponse } from 'next/server';
import { advancedSearchService } from '@/services/advancedSearchService';

/**
 * GET /api/search/products?q=headphones&category=electronics&priceMax=300&sort=rating&page=1
 * Advanced product search with filters and facets
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const sort = (request.nextUrl.searchParams.get('sort') || 'relevance') as any;

    // Validate inputs
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be >= 1' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const validSorts = ['relevance', 'price_asc', 'price_desc', 'rating', 'newest', 'trending'];
    if (!validSorts.includes(sort)) {
      return NextResponse.json(
        { error: `Invalid sort: must be one of ${validSorts.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse filters
    const filters: any = {};
    const priceMin = request.nextUrl.searchParams.get('priceMin');
    const priceMax = request.nextUrl.searchParams.get('priceMax');
    const categoryParam = request.nextUrl.searchParams.get('category');
    const ratingParam = request.nextUrl.searchParams.get('rating');
    const brandParam = request.nextUrl.searchParams.get('brand');

    if (priceMin) filters.priceMin = parseFloat(priceMin);
    if (priceMax) filters.priceMax = parseFloat(priceMax);
    if (categoryParam) filters.category = categoryParam.split(',');
    if (ratingParam) filters.rating = parseInt(ratingParam);
    if (brandParam) filters.brand = brandParam.split(',');

    // Execute search
    const searchQuery = {
      q,
      filters,
      sort,
      page,
      limit,
    };

    const results = await advancedSearchService.search(searchQuery);

    // Track search
    await advancedSearchService.trackSearch(q, results.total);

    return NextResponse.json({
      success: true,
      data: {
        query: q,
        filters,
        sort,
        page,
        limit,
        ...results,
      },
    });
  } catch (error) {
    console.error('GET /api/search/products error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/products/click
 * Log a search result click
 */
export async function POST(request: NextRequest) {
  try {
    const { query, productId, rank } = await request.json();
    const userId = request.headers.get('x-user-id');

    if (!query || !productId || rank === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: query, productId, rank' },
        { status: 400 }
      );
    }

    // Track click
    await advancedSearchService.trackSearchClick(query, productId, rank, userId || undefined);

    return NextResponse.json({
      success: true,
      message: 'Click tracked',
    });
  } catch (error) {
    console.error('POST /api/search/products/click error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
