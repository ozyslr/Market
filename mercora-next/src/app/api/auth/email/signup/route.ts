/**
 * POST /api/auth/email/signup
 * Email registration endpoint
 *
 * Request body:
 * {
 *   email: string
 *   password: string
 *   name?: string
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   userId?: string
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerWithEmail } from '@/services/emailAuthService';

interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await registerWithEmail(body.email, body.password, body.name);

    return NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes('already') ? 400 : 500 }
    );
  }
}
