import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const MINUTE = 60_000;

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  if (pathname.startsWith('/api/chat/send') || pathname.startsWith('/api/chat/hide')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/admin')) {
    return { limit: 5, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/auth')) {
    return { limit: 10, windowMs: MINUTE };
  }
  return null;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  const config = getRateLimitConfig(pathname);
  if (config) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `${ip}:${pathname}`;
    const result = rateLimit(key, config.limit, config.windowMs);

    if (!result.success) {
      const errorResponse = NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
      errorResponse.headers.set('Retry-After', String(Math.ceil(config.windowMs / 1000)));
      return addSecurityHeaders(errorResponse);
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/api/:path*'],
};
