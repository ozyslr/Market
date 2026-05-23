/**
 * POST /api/auth/email/verify
 * Verify email with token
 *
 * Request body:
 * {
 *   userId: string
 *   token: string
 * }
 *
 * Response:
 * {
 *   verified: boolean
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/services/emailAuthService';

interface VerifyRequest {
  userId: string;
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();

    if (!body.userId || !body.token) {
      return NextResponse.json(
        { error: 'userId and token are required' },
        { status: 400 }
      );
    }

    const result = await verifyEmailToken(body.userId, body.token);

    if (!result.verified) {
      return NextResponse.json(
        { verified: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
