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
  if (pathname.startsWith('/api/chat/react')) {
    return { limit: 30, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/chat/messages') || pathname.startsWith('/api/chat/thread')) {
    return { limit: 30, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/admin')) {
    return { limit: 5, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/auth')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/search') || pathname.startsWith('/api/chat/search')) {
    return { limit: 30, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/upload')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/chat/schedule')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/messages')) {
    return { limit: 30, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/users/follow')) {
    return { limit: 15, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/users')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/proposals/vote')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/proposals/comment')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/proposals')) {
    return { limit: 5, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/notifications')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/music/submissions')) {
    return { limit: 5, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/music/metadata')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/music/radio')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/respect')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/social')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/members')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/following')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/miniapp')) {
    return { limit: 10, windowMs: MINUTE };
  }
  return null;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  const config = getRateLimitConfig(pathname);
  if (config) {
    const ip = request.headers.get('x-real-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown';
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

  // XMTP WASM requires COEP/COOP for SharedArrayBuffer
  if (pathname.startsWith('/messages')) {
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/api/:path*', '/messages/:path*'],
};
