import { NextRequest, NextResponse } from 'next/server';
import { fraudDetectionService } from '@/services/fraudDetectionService';

/**
 * POST /api/fraud/flag-account
 * Flag a user account for suspicious activity (admin only)
 * Applies rate limiting, requires 2FA, or suspends account
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { userId, reason, severity } = await request.json();

    // Validate inputs
    if (!userId || !reason || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, reason, severity' },
        { status: 400 }
      );
    }

    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity: must be one of ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    // Flag account
    await fraudDetectionService.flagAccountForReview(userId, reason, severity);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        reason,
        severity,
        action: severity === 'high' ? 'account_suspended' : 'under_review',
        flaggedAt: new Date().toISOString(),
        flaggedBy: adminId,
      },
    });
  } catch (error) {
    console.error('POST /api/fraud/flag-account error:', error);
    return NextResponse.json(
      { error: 'Failed to flag account' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fraud/create-chargeback
 * Create a chargeback case (admin only)
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

    const { transactionId, customerId, amount, reason } = await request.json();

    if (!transactionId || !customerId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, customerId, amount, reason' },
        { status: 400 }
      );
    }

    const chargebackCase = await fraudDetectionService.createChargebackCase(
      transactionId,
      customerId,
      amount,
      reason
    );

    return NextResponse.json({
      success: true,
      data: chargebackCase,
    });
  } catch (error) {
    console.error('POST /api/fraud/create-chargeback error:', error);
    return NextResponse.json(
      { error: 'Failed to create chargeback case' },
      { status: 500 }
    );
  }
}
