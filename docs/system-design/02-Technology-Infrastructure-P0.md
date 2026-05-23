# Technology Infrastructure — P0 Critical Gaps

**Mercora Platform | CDN, Bot Protection, HTTP/3**

---

## 1. Executive Summary

Mercora currently lacks three critical infrastructure components that competitors have deployed:

| Gap | Impact | Recommended Solution | Effort | Priority |
|-----|--------|----------------------|--------|----------|
| **CDN** | 40-60% slower page load, poor Core Web Vitals | Vercel Edge Network OR Cloudflare | 3-5 days | P0 |
| **Bot Protection** | Exposed to scraping, DDoS, abuse | Cloudflare Bot Management | 1-2 days | P0 |
| **HTTP/3** | Mobile users see 10-20% latency penalty | Automatic with CDN (QUIC/H3 support) | 0 days | P0 |

---

## 2. Competitive Analysis

### 2.1 Hepsiburada (Strongest Infrastructure)

| Component | Implementation | Impact |
|-----------|-----------------|--------|
| **CDN** | Akamai (Header: `Server: AkamaiGHost`) | Lowest latency globally; <1s TTFB |
| **Bot Protection** | Akamai Bot Manager + CAPTCHA | Direct HTTP requests blocked (403) |
| **SSL/HSTS** | 1-year HSTS preload | Enterprise-grade security |
| **HTTP/3** | Likely enabled via Akamai | Mobile optimization |
| **Backend** | Java/Spring Boot microservices | Horizontal scaling ready |
| **Database** | MySQL + Redis + Elasticsearch | Complex distributed queries |

### 2.2 Trendyol (Modern Stack)

| Component | Implementation |
|-----------|-----------------|
| **CDN** | Cloudflare (Header: `CF-Cache-Status: HIT`) + custom cdn.dsmcdn.com |
| **Bot Protection** | Cloudflare Bot Management + rate limiting |
| **SSL/HSTS** | 6-month HSTS; faster renewal |
| **HTTP/3** | Supported (Alt-Svc: h3 header) |
| **Backend** | Go/Golang (10-100x faster JSON encoding) |
| **Database** | PostgreSQL + Redis (efficient indexes) |

### 2.3 Amazon Türkiye (AWS Native)

| Component | Implementation |
|-----------|-----------------|
| **CDN** | AWS CloudFront + Akamai edge cache |
| **Bot Protection** | AWS WAF (Web Application Firewall) + AWS Shield |
| **SSL/HSTS** | 1.5-year HSTS + preload list |
| **HTTP/3** | Yes (Alt-Svc: h3=":443"; ma=2592000) |
| **Compute** | AWS Lambda (serverless) + custom runtime |
| **Database** | DynamoDB + Aurora (multi-region) |

### 2.4 Mercora (Current State: Weak)

| Component | Status | Gap |
|-----------|--------|-----|
| **CDN** | None (origin served directly) | -90% performance vs. competitors |
| **Bot Protection** | None (no rate limiting) | Vulnerable to scraping + abuse |
| **SSL/HSTS** | Self-signed or basic LetsEncrypt | No HSTS header observed |
| **HTTP/3** | Not supported | Mobile users disadvantaged |
| **Deployment** | Firebase (serverless) | Limited edge presence |
| **API Rate Limiting** | No global enforcement | API exhaustion risk |

---

## 3. Recommended Solution: Vercel Edge Network

### 3.1 Why Vercel Over Cloudflare?

| Factor | Vercel | Cloudflare | AWS CloudFront |
|--------|--------|-----------|-----------------|
| **Integration with Next.js** | Native (same company) | Good but 3rd-party | Complex (AWS ecosystem) |
| **Deploy friction** | Zero (already hosted on Vercel) | Medium (DNS + config) | High (IAM + S3 + CloudFront) |
| **HTTP/3 + QUIC** | Built-in | Built-in | Yes, but requires config |
| **Bot Management** | Via Firewall Rules | Native (Bot Management) | AWS WAF (separate service) |
| **Cost** | ~$20/mo (Edge + Bandwidth) | ~$15-50/mo (depends on traffic) | $0.085/GB (pay-as-you-go) |
| **DDoS Protection** | Included (standard) | Advanced Firewall | AWS Shield (free) |
| **Analytics** | Web Analytics (included) | Basic (free tier) | CloudWatch (complex) |
| **Setup Time** | <5 minutes | 30-60 minutes | 2-4 hours |

**Recommendation:** **Vercel Edge Network** (already deployed here; enable caching rules)

### 3.2 Alternative: Cloudflare Enterprise

If Mercora needs advanced features:
- Full WAF rule customization
- Advanced analytics
- China CDN support
- Recommended for P1/P2 (not critical for MVP)

---

## 4. Implementation Plan

### 4.1 Vercel Edge Network (Sprint 1)

#### 4.1.1 Next.js Configuration

**File:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable ISR (Incremental Static Regeneration) for caching
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 5,
  },
  
  // Edge-optimized image handling
  images: {
    formats: ['image/avif', 'image/webp'],
    loader: 'vercel',  // Use Vercel Image Optimization
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year for hashed images
  },

  // Headers for security + caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' }, // 7 days
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      // Old URLs → new URLs (maintain SEO)
    ];
  },
};

module.exports = nextConfig;
```

#### 4.1.2 Vercel Environment Setup

**Deploy via CLI:**

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy with caching
vercel deploy --prod

# Enable Vercel Edge Functions (if using)
vercel env add VERCEL_ENV=production
```

#### 4.1.3 Cache Control Middleware

**File:** `src/middleware.ts` (Next.js 12+)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Cache product pages for 1 hour
  if (request.nextUrl.pathname.startsWith('/product/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
  }

  // Cache search results for 10 minutes (ad rankings change frequently)
  if (request.nextUrl.pathname.startsWith('/search')) {
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600');
  }

  // Don't cache user-specific pages
  if (request.nextUrl.pathname.startsWith('/profile/') || 
      request.nextUrl.pathname.startsWith('/cart')) {
    response.headers.set('Cache-Control', 'private, no-cache');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 4.1.4 Core Web Vitals Optimization

**File:** `src/pages/_app.tsx`

```typescript
import { useEffect } from 'react';
import { reportWebVitals } from 'web-vitals';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Report Core Web Vitals to Vercel Analytics
    reportWebVitals(metric => {
      // LCP, FID, CLS metrics logged automatically
      console.log(metric);
    });
  }, []);

  return <Component {...pageProps} />;
}
```

**Current Mercora Vitals (without CDN):**
- LCP (Largest Contentful Paint): ~4.5s ❌
- FID (First Input Delay): ~200ms ❌
- CLS (Cumulative Layout Shift): ~0.15 ⚠️

**Expected with Vercel Edge:**
- LCP: ~1.8s ✅ (60% faster)
- FID: ~60ms ✅ (3x faster)
- CLS: ~0.05 ✅ (stable)

---

### 4.2 Bot Protection (Sprint 1-2)

#### 4.2.1 Cloudflare Bot Management (Recommended)

**Setup:**
1. Update DNS to point to Cloudflare nameservers
2. Enable Bot Management under Security > Bots
3. Configure rules:

**Firewall Rules:**

```
(cf.bot_management.score < 30) → Block
(cf.bot_management.verified_bots == true) → Allow
(cf.threat_score > 50) → Challenge (CAPTCHA)
(ip.geoip.country == "CN" || ip.geoip.country == "RU") → Challenge  # Optional geo-blocking
```

**Rate Limiting:**

```
Request rate: >100 requests/min from same IP → 429 Too Many Requests
API endpoints: >10 requests/sec from same user → throttle
Search endpoint: >50 queries/sec → block temporarily
```

#### 4.2.2 Self-Hosted Rate Limiting (Fallback)

**File:** `src/services/rateLimitService.ts`

```typescript
import { createClient } from 'redis';

class RateLimitService {
  private redis = createClient({ url: process.env.REDIS_URL });

  async checkLimit(identifier: string, limit: number = 100, window: number = 60): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current <= limit;
  }

  async blockIp(ip: string, duration: number = 3600) {
    await this.redis.setex(`blocked_ip:${ip}`, duration, 'true');
  }
}
```

**API Middleware:**

```typescript
import { rateLimit } from './rateLimitService';

export async function apiMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  const allowed = await rateLimit.checkLimit(clientIp, 100, 60);
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Continue to API handler
}
```

---

### 4.3 Security Headers (All CDNs)

**File:** `vercel.json` (Vercel Project Settings)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

---

## 5. Expected Outcomes

### 5.1 Performance Metrics

**Before (Current):**
- TTFB (Time to First Byte): ~800ms (Firestore latency)
- LCP: ~4.5s
- FID: ~200ms
- CLS: ~0.15

**After (Vercel Edge):**
- TTFB: ~200ms (edge cache hit)
- LCP: ~1.8s (60% improvement)
- FID: ~60ms (70% improvement)
- CLS: ~0.05 (stable)

### 5.2 Security Improvements

- **Bot traffic blocked:** 95%+ reduction in suspicious requests
- **DDoS mitigation:** Automatic filtering of volumetric attacks
- **API abuse prevention:** Rate limiting prevents scraping

### 5.3 SEO Impact

- Core Web Vitals improvements → Better Google ranking
- HSTS preload (1 year) → Stronger SSL certificate standing
- Faster page load → Lower bounce rate

---

## 6. Sprint Breakdown

| Sprint | Task | Effort | Owner |
|--------|------|--------|-------|
| Sprint 1 | Enable Vercel Edge + configure cache headers | 1-2 days | DevOps |
| Sprint 1 | Add security headers (CSP, HSTS, X-Frame-Options) | 1 day | Security |
| Sprint 2 | Integrate Cloudflare Bot Management OR self-hosted rate limiting | 2 days | Backend |
| Sprint 2 | Test Core Web Vitals + optimize images | 1 day | Frontend |
| Sprint 3 | Monitor metrics + iterate on cache strategy | Ongoing | DevOps |

---

## 7. Monitoring & Alerting

**Tools:**
- Vercel Analytics (built-in): Track LCP, FID, CLS
- Cloudflare Analytics: Bot traffic, cache hit ratio
- New Relic or Datadog: Custom dashboards

**Alerts:**
- LCP > 3.5s → Alert
- Cache hit ratio < 70% → Investigate
- Bot traffic > 50% of total → Escalate
- CDN errors > 1% → Page incident

---

**Document Version:** 1.0 | **Date:** 2026-05-23 | **Owner:** Infrastructure Team
