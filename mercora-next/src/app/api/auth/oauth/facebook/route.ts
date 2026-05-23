/**
 * GET /api/auth/oauth/facebook
 * Initiates Facebook OAuth flow
 *
 * Query params:
 * - redirectUri: Where to redirect after auth
 * - state: CSRF protection token
 *
 * Redirects to Facebook OAuth consent screen
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

    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      console.warn('[oauth/facebook] Facebook OAuth not configured');
      return NextResponse.json(
        { error: 'Facebook OAuth not configured' },
        { status: 503 }
      );
    }

    const scope = [
      'public_profile',
      'email',
    ].join(',');

    const facebookAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    facebookAuthUrl.searchParams.set('client_id', appId);
    facebookAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/facebook/callback`);
    facebookAuthUrl.searchParams.set('scope', scope);
    facebookAuthUrl.searchParams.set('state', state);
    facebookAuthUrl.searchParams.set('display', 'popup');

    // Store state in cookie for CSRF protection
    const response = NextResponse.redirect(facebookAuthUrl.toString());
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('[oauth/facebook] Error:', error);
    return NextResponse.json(
      { error: 'OAuth initiation failed' },
      { status: 500 }
    );
  }
}
