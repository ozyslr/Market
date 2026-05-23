/**
 * Advanced Seller Analytics API Endpoint (STREAM L - Phase 3)
 * GET /api/seller/analytics/advanced?sellerId=...&metric=products|forecast|segments|inventory
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getProductMetrics,
  forecastSales,
  autoSegmentCustomers,
  getInventoryHealth,
  getCompetitorBenchmarks,
  calculateLTV,
} from '@/services/sellerAnalyticsService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sellerId = searchParams.get('sellerId');
    const metric = searchParams.get('metric');
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');
    const days = parseInt(searchParams.get('days') || '30');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Missing sellerId' },
        { status: 400 }
      );
    }

    let data: any = {};

    switch (metric) {
      case 'products':
        // Get product metrics
        if (!productId) {
          return NextResponse.json(
            { error: 'Missing productId for products metric' },
            { status: 400 }
          );
        }
        data.productMetrics = await getProductMetrics(sellerId, productId, days);
        break;

      case 'forecast':
        // Get sales forecast
        if (!productId) {
          return NextResponse.json(
            { error: 'Missing productId for forecast metric' },
            { status: 400 }
          );
        }
        data.forecast = await forecastSales(productId, days);
        break;

      case 'segments':
        // Get customer segments
        data.segments = await autoSegmentCustomers(sellerId);
        break;

      case 'inventory':
        // Get inventory health
        data.inventory = await getInventoryHealth(sellerId);
        break;

      case 'benchmarks':
        // Get competitor benchmarks
        if (!category) {
          return NextResponse.json(
            { error: 'Missing category for benchmarks metric' },
            { status: 400 }
          );
        }
        data.benchmarks = await getCompetitorBenchmarks(sellerId, category);
        break;

      case 'all':
        // Get all advanced metrics
        data.productMetrics = productId
          ? await getProductMetrics(sellerId, productId, days)
          : null;
        data.segments = await autoSegmentCustomers(sellerId);
        data.inventory = await getInventoryHealth(sellerId);
        if (category) {
          data.benchmarks = await getCompetitorBenchmarks(sellerId, category);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        sellerId,
        metric,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Advanced analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced analytics' },
      { status: 500 }
    );
  }
}
