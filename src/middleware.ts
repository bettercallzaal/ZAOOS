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
  if (pathname.startsWith('/api/fractals/webhook')) {
    return { limit: 30, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/fractals')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/discord')) {
    return { limit: 5, windowMs: MINUTE };
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
    return { limit: 3, windowMs: MINUTE };
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
    return { limit: 2, windowMs: MINUTE };
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
  if (pathname.startsWith('/api/wavewarz')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/directory')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/bluesky')) {
    return { limit: 5, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/publish')) {
    return { limit: 5, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/platforms')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library/submit')) {
    return { limit: 3, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library/vote')) {
    return { limit: 15, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library/comments')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library/delete')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library')) {
    return { limit: 30, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/neynar')) {
    return { limit: 15, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/stream')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/100ms')) {
    return { limit: 20, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/songjam')) {
    return { limit: 20, windowMs: MINUTE };
  }
  return null;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Convert to base64 without using Buffer (Edge Runtime compatible)
  return btoa(String.fromCharCode(...array));
}

function buildCspHeader(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://neynarxyz.github.io https://api.neynar.com https://open.spotify.com https://www.youtube.com https://w.soundcloud.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https: wss:",
    "font-src 'self' https:",
    "frame-src 'self' https://open.spotify.com https://www.youtube.com https://w.soundcloud.com https://embed.sound.xyz https://audius.co https://relay.farcaster.xyz https://app.neynar.com https://embed.tidal.com https://*.bandcamp.com https://embed.music.apple.com https://meet.jit.si https://nouns.build https://songjam.space https://www.songjam.space https://empirebuilder.world https://incented.co https://app.magnetiq.xyz https://clanker.world https://www.wavewarz.com https://wavewarz.com https://wavewarz-intelligence.vercel.app https://analytics-wave-warz.vercel.app",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return directives.join('; ');
}

function addSecurityHeaders(response: NextResponse, nonce?: string, pathname?: string): NextResponse {
  // Allow iframe embedding for the embeddable leaderboard endpoint
  if (pathname?.startsWith('/api/respect/leaderboard/embed')) {
    response.headers.set('X-Frame-Options', 'ALLOWALL');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(self "https://www.songjam.space"), microphone=(self "https://www.songjam.space"), geolocation=()');
  if (nonce) {
    response.headers.set('Content-Security-Policy', buildCspHeader(nonce));
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  const config = getRateLimitConfig(pathname);
  if (config) {
    // Vercel strips user-supplied X-Forwarded-For and sets trusted values.
    // On non-Vercel deployments, ensure a trusted reverse proxy sets these headers.
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
      return addSecurityHeaders(errorResponse, undefined, pathname);
    }
  }

  // Generate nonce for page routes (not API routes)
  const isPageRoute = !pathname.startsWith('/api/');
  const nonce = isPageRoute ? generateNonce() : undefined;
  const isMessagesRoute = pathname.startsWith('/messages');

  const requestHeaders = new Headers(request.headers);
  if (nonce) {
    requestHeaders.set('x-nonce', nonce);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // XMTP WASM requires COEP/COOP for SharedArrayBuffer
  if (isMessagesRoute) {
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }

  return addSecurityHeaders(response, nonce, pathname);
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
