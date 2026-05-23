/**
 * 2FA Verify API Endpoint (STREAM M - Phase 3)
 * POST /api/auth/2fa/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorService } from '@/services/twoFactorService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, code, method, secret, rememberDevice } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Missing userId or code' },
        { status: 400 }
      );
    }

    let verified = false;

    // Verify TOTP code
    if (method === 'totp' && secret) {
      verified = twoFactorService.verifyTOTPCode(secret, code);
    }

    // Verify backup code
    if (!verified && code.length === 8) {
      verified = await twoFactorService.verifyBackupCode(userId, code);
    }

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      );
    }

    // Create trusted device if requested
    if (rememberDevice) {
      const deviceFingerprint = `${req.headers.get('user-agent')}_hash`;
      const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

      await twoFactorService.createTrustedDevice(
        userId,
        deviceFingerprint,
        ipAddress,
        'Trusted Device'
      );
    }

    return NextResponse.json(
      {
        success: true,
        verified: true,
        message: '2FA verification successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA code' },
      { status: 500 }
    );
  }
}
