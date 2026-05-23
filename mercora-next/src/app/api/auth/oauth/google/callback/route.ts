/**
 * GET /api/auth/oauth/google/callback
 * Google OAuth callback handler
 *
 * Query params:
 * - code: Authorization code from Google
 * - state: CSRF protection token
 * - error: Error if auth failed
 *
 * Exchanges code for token and creates/links user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  locale: string;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');
    const storedState = request.cookies.get('oauth_state')?.value;

    // Check for errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/callback?error=${encodeURIComponent(error)}`, request.url).href
      );
    }

    // Validate state
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        new URL('/auth/callback?error=invalid_state', request.url).href
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/callback?error=no_code', request.url).href
      );
    }

    // Exchange code for token
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

    // Get user info from Google
    const userResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = (await userResponse.json()) as GoogleUserInfo;

    // Find or create user in Firestore
    const userRef = doc(db, 'users', `google_${userInfo.sub}`);
    const userSnap = await getDoc(userRef);

    let userId = `google_${userInfo.sub}`;

    if (!userSnap.exists()) {
      // Create new user
      await setDoc(userRef, {
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        authProvider: 'google',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        emailVerified: userInfo.email_verified,
      });
    } else {
      // Update existing user
      await setDoc(
        userRef,
        {
          updatedAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
        },
        { merge: true }
      );
    }

    // Create session and redirect
    const response = NextResponse.redirect(
      new URL('/auth/callback?success=true', request.url).href
    );

    // Set auth cookie
    response.cookies.set('auth_token', tokenData.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7, // 7 days
    });

    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('[oauth/google/callback] Error:', error);
    return NextResponse.redirect(
      new URL(`/auth/callback?error=${encodeURIComponent('Authentication failed')}`, request.url).href
    );
  }
}
