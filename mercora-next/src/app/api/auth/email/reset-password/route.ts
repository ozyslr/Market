import { NextRequest, NextResponse } from 'next/server';
import { emailAuthService } from '@/services/emailAuthService';
import { rateLimitMiddleware } from '@/middleware/rateLimitMiddleware';

/**
 * Reset Password Endpoint
 * POST /api/auth/email/reset-password
 *
 * Request body:
 * {
 *   "token": "reset-token-from-email",
 *   "newPassword": "newPassword123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset successfully"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per minute per IP)
    const rateLimitCheck = await rateLimitMiddleware(
      request,
      'reset-password',
      5,
      60
    );
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, newPassword } = body;

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Reset password
    const result = await emailAuthService.resetPasswordWithToken(
      token,
      newPassword
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Password reset failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Reset Token Endpoint
 * GET /api/auth/email/reset-password?token=...
 *
 * Response:
 * {
 *   "valid": true
 * }
 */

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const result = await emailAuthService.verifyPasswordResetToken(token);

    return NextResponse.json(
      {
        valid: result.valid,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
