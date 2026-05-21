import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'ar'];
const DEFAULT_LOCALE = 'tr';

const PUBLIC_PATHS = [
  '/', '/cart', '/checkout', '/search', '/product/', '/category/',
  '/login', '/register', '/sell', '/support', '/track/', '/verify',
  '/visual-search', '/wishlist', '/orders', '/profile',
  '/api/', '/_next/', '/favicon', '/robots.txt', '/sitemap.xml',
  '/images/', '/fonts/',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p) || pathname === p);
}

function getLocaleFromRequest(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLang = request.headers.get('Accept-Language');
  if (acceptLang) {
    const primary = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase();
    if (primary && SUPPORTED_LOCALES.includes(primary)) {
      return primary;
    }
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Language redirect (root path only)
  if (pathname === '/') {
    const locale = getLocaleFromRequest(request);
    if (locale !== DEFAULT_LOCALE) {
      request.nextUrl.pathname = `/${locale}`;
      return NextResponse.redirect(request.nextUrl);
    }
  }

  // Set locale cookie if not present
  if (!request.cookies.has('NEXT_LOCALE')) {
    const locale = getLocaleFromRequest(request);
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  // Admin/seller paths: redirect to login if no auth (client-side will handle actual auth)
  // This is a lightweight check — real auth happens in AuthContext
  if (pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
    // These are client-side protected routes; middleware just ensures headers
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|robots.txt|sitemap.xml).*)',
  ],
};
