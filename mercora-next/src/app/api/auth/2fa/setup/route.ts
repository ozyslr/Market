/**
 * 2FA Setup API Endpoint (STREAM M - Phase 3)
 * POST /api/auth/2fa/setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorService } from '@/services/twoFactorService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, method } = body;

    if (!userId || !email || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['totp', 'sms', 'email'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid 2FA method' },
        { status: 400 }
      );
    }

    let totpSecret: string | undefined;

    // Generate TOTP secret if TOTP method
    if (method === 'totp') {
      const { secret, qrCode } = await twoFactorService.generateTOTPSecret(
        userId,
        email
      );
      totpSecret = secret;

      return NextResponse.json(
        {
          success: true,
          method,
          secret: totpSecret,
          qrCode,
          manualEntry: totpSecret,
        },
        { status: 200 }
      );
    }

    // For SMS or email, return setup instructions
    return NextResponse.json(
      {
        success: true,
        method,
        message: `Proceed to verify ${method === 'sms' ? 'SMS number' : 'email'}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
