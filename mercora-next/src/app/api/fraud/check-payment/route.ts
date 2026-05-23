import { NextRequest, NextResponse } from 'next/server';
import { fraudDetectionService } from '@/services/fraudDetectionService';

/**
 * POST /api/fraud/check-payment
 * Real-time payment fraud risk assessment
 * Returns risk score and recommendation (allow/review/decline/challenge_2fa)
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

    const {
      amount,
      cardToken,
      ipAddress,
      deviceFingerprint,
    } = await request.json();

    // Validate inputs
    if (!amount || !cardToken || !ipAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, cardToken, ipAddress' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Assess payment risk
    const riskAssessment = await fraudDetectionService.assessPaymentRisk(
      userId,
      amount,
      cardToken,
      ipAddress,
      deviceFingerprint || 'unknown'
    );

    return NextResponse.json({
      success: true,
      data: {
        userId,
        amount,
        riskAssessment,
        decision: riskAssessment.recommendation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/fraud/check-payment error:', error);
    return NextResponse.json(
      { error: 'Failed to assess payment risk' },
      { status: 500 }
    );
  }
}
