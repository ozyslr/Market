/**
 * POST /api/auth/resend-otp
 * Resend OTP code to phone number
 *
 * Request body:
 * {
 *   otpId: string
 *   phoneNumber: string (E.164 format)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   error?: string
 *   cooldownSeconds?: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendOTP } from '@/services/phoneAuthService';

interface ResendOTPRequest {
  otpId: string;
  phoneNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResendOTPRequest = await request.json();

    if (!body.otpId || !body.phoneNumber) {
      return NextResponse.json(
        { error: 'Missing otpId or phoneNumber' },
        { status: 400 }
      );
    }

    const result = await resendOTP(body.otpId, body.phoneNumber);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    console.error('[resend-otp] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
      },
      { status: 500 }
    );
  }
}
