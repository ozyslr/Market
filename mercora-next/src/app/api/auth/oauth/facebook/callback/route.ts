/**
 * GET /api/auth/oauth/facebook/callback
 * Facebook OAuth callback handler
 *
 * Query params:
 * - code: Authorization code from Facebook
 * - state: CSRF protection token
 * - error: Error if auth failed
 *
 * Exchanges code for token and creates/links user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookUserInfo {
  id: string;
  email: string;
  name: string;
  picture: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
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
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('Facebook OAuth credentials not configured');
    }

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // Build query params manually
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/facebook/callback`);

    const response = await fetch(tokenUrl.toString());

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = (await response.json()) as FacebookTokenResponse;

    // Get user info from Facebook
    const userUrl = new URL('https://graph.facebook.com/me');
    userUrl.searchParams.set('fields', 'id,email,name,picture');
    userUrl.searchParams.set('access_token', tokenData.access_token);

    const userResponse = await fetch(userUrl.toString());

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = (await userResponse.json()) as FacebookUserInfo;

    // Find or create user in Firestore
    const userRef = doc(db, 'users', `facebook_${userInfo.id}`);
    const userSnap = await getDoc(userRef);

    let userId = `facebook_${userInfo.id}`;

    if (!userSnap.exists()) {
      // Create new user
      await setDoc(userRef, {
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture?.data?.url || null,
        authProvider: 'facebook',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
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
    const redirectResponse = NextResponse.redirect(
      new URL('/auth/callback?success=true', request.url).href
    );

    // Set auth cookie
    redirectResponse.cookies.set('auth_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7, // 7 days
    });

    redirectResponse.cookies.delete('oauth_state');

    return redirectResponse;
  } catch (error) {
    console.error('[oauth/facebook/callback] Error:', error);
    return NextResponse.redirect(
      new URL(`/auth/callback?error=${encodeURIComponent('Authentication failed')}`, request.url).href
    );
  }
}
