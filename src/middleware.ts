import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const MINUTE = 60_000;

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// Rate limit configs ordered from most-specific to least-specific prefix.
// The first matching prefix wins, so sub-routes must appear before their parent.
const RATE_LIMITS: [string, RateLimitConfig][] = [
  // Chat sub-routes (before /api/chat catch-all paths)
  ['/api/chat/send',      { limit: 10, windowMs: MINUTE }],
  ['/api/chat/hide',      { limit: 10, windowMs: MINUTE }],
  ['/api/chat/react',     { limit: 30, windowMs: MINUTE }],
  ['/api/chat/messages',  { limit: 30, windowMs: MINUTE }],
  ['/api/chat/thread',    { limit: 30, windowMs: MINUTE }],
  ['/api/chat/search',    { limit: 30, windowMs: MINUTE }],
  ['/api/chat/schedule',  { limit: 20, windowMs: MINUTE }],
  ['/api/chat/assistant', { limit: 20, windowMs: MINUTE }],

  // Fractals sub-routes
  ['/api/fractals/webhook', { limit: 30, windowMs: MINUTE }],
  ['/api/fractals',         { limit: 20, windowMs: MINUTE }],

  // Users sub-routes
  ['/api/users/follow', { limit: 15, windowMs: MINUTE }],
  ['/api/users',        { limit: 20, windowMs: MINUTE }],

  // Proposals sub-routes
  ['/api/proposals/vote',    { limit: 3,  windowMs: MINUTE }],
  ['/api/proposals/comment', { limit: 10, windowMs: MINUTE }],
  ['/api/proposals',         { limit: 5,  windowMs: MINUTE }],

  // Music sub-routes
  ['/api/music/submissions', { limit: 2,  windowMs: MINUTE }],
  ['/api/music/metadata',    { limit: 20, windowMs: MINUTE }],
  ['/api/music/radio',       { limit: 10, windowMs: MINUTE }],

  // Library sub-routes
  ['/api/library/submit',   { limit: 3,  windowMs: MINUTE }],
  ['/api/library/vote',     { limit: 15, windowMs: MINUTE }],
  ['/api/library/comments', { limit: 10, windowMs: MINUTE }],
  ['/api/library/delete',   { limit: 10, windowMs: MINUTE }],
  ['/api/library',          { limit: 30, windowMs: MINUTE }],

  // Top-level routes (no sub-route ordering concerns)
  ['/api/admin',         { limit: 5,  windowMs: MINUTE }],
  ['/api/auth',          { limit: 10, windowMs: MINUTE }],
  ['/api/search',        { limit: 30, windowMs: MINUTE }],
  ['/api/upload',        { limit: 10, windowMs: MINUTE }],
  ['/api/discord',       { limit: 5,  windowMs: MINUTE }],
  ['/api/messages',      { limit: 30, windowMs: MINUTE }],
  ['/api/notifications', { limit: 20, windowMs: MINUTE }],
  ['/api/respect',       { limit: 20, windowMs: MINUTE }],
  ['/api/social',        { limit: 20, windowMs: MINUTE }],
  ['/api/members',       { limit: 10, windowMs: MINUTE }],
  ['/api/following',     { limit: 20, windowMs: MINUTE }],
  ['/api/miniapp',       { limit: 10, windowMs: MINUTE }],
  ['/api/wavewarz',      { limit: 20, windowMs: MINUTE }],
  ['/api/directory',     { limit: 20, windowMs: MINUTE }],
  ['/api/bluesky',       { limit: 5,  windowMs: MINUTE }],
  ['/api/publish',       { limit: 5,  windowMs: MINUTE }],
  ['/api/platforms',     { limit: 10, windowMs: MINUTE }],
  ['/api/neynar',        { limit: 15, windowMs: MINUTE }],
  ['/api/stream',        { limit: 20, windowMs: MINUTE }],
  ['/api/100ms',         { limit: 20, windowMs: MINUTE }],
  ['/api/songjam',       { limit: 20, windowMs: MINUTE }],
  ['/api/livepeer',      { limit: 10, windowMs: MINUTE }],
  ['/api/broadcast',     { limit: 15, windowMs: MINUTE }],
];

function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  for (const [prefix, config] of RATE_LIMITS) {
    if (pathname.startsWith(prefix)) return config;
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

export async function middleware(request: NextRequest) {
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
    const result = await rateLimit(key, config.limit, config.windowMs);

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
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
