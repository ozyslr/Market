import { NextRequest, NextResponse } from 'next/server';
import { emailAuthService } from '@/services/emailAuthService';
import { rateLimitMiddleware } from '@/middleware/rateLimitMiddleware';

/**
 * Email Login Endpoint
 * POST /api/auth/email/login
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": { "uid": "...", "email": "..." },
 *   "token": "..."
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per minute per IP)
    const rateLimitCheck = await rateLimitMiddleware(request, 'email-login', 5, 60);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Attempt login
    const result = await emailAuthService.loginWithEmail(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Login failed' },
        { status: 401 }
      );
    }

    // Return success with user data
    return NextResponse.json(
      {
        success: true,
        user: result.user,
        token: result.token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
