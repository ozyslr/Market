/**
 * GET /api/auth/oauth/google
 * Initiates Google OAuth flow
 *
 * Query params:
 * - redirectUri: Where to redirect after auth
 * - state: CSRF protection token
 *
 * Redirects to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const redirectUri = request.nextUrl.searchParams.get('redirectUri');
    const state = request.nextUrl.searchParams.get('state') || crypto.randomUUID();

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'redirectUri is required' },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      console.warn('[oauth/google] Google OAuth not configured');
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 503 }
      );
    }

    const scope = [
      'openid',
      'profile',
      'email',
    ].join(' ');

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', scope);
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('access_type', 'online');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    // Store state in cookie for CSRF protection
    const response = NextResponse.redirect(googleAuthUrl.toString());
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('[oauth/google] Error:', error);
    return NextResponse.json(
      { error: 'OAuth initiation failed' },
      { status: 500 }
    );
  }
}
