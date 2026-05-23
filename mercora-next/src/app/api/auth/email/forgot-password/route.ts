import { NextRequest, NextResponse } from 'next/server';
import { emailAuthService } from '@/services/emailAuthService';
import { rateLimitMiddleware } from '@/middleware/rateLimitMiddleware';

/**
 * Forgot Password Endpoint
 * POST /api/auth/email/forgot-password
 *
 * Request body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Reset email sent"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (3 attempts per 10 minutes per IP)
    const rateLimitCheck = await rateLimitMiddleware(
      request,
      'forgot-password',
      3,
      600
    );
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error:
            'Too many reset requests. Please try again later or contact support.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Request password reset
    const result = await emailAuthService.requestPasswordReset(email);

    if (!result.success) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        {
          success: true,
          message:
            'If an account exists with this email, you will receive a password reset link.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'If an account exists with this email, you will receive a password reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
