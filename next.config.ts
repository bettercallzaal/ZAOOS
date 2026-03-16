import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xmtp/wasm-bindings'],

  experimental: {
    // Tree-shake barrel exports from heavy libraries
    optimizePackageImports: [
      '@tanstack/react-query',
      '@rainbow-me/rainbowkit',
      '@farcaster/auth-kit',
      'wagmi',
      'viem',
      '@supabase/supabase-js',
    ],
  },

  images: {
    // Farcaster PFPs + music artwork come from many domains — allow any HTTPS source
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  // XMTP requires COEP/COOP for SharedArrayBuffer (WASM)
  // Scoped to /messages only — global headers would break Spotify/YouTube iframes
  async headers() {
    // Security headers applied to all routes
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://neynarxyz.github.io https://api.neynar.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https: http:",
          "media-src 'self' blob: https:",
          "connect-src 'self' https: wss:",
          "font-src 'self' https:",
          "frame-src 'self' https://open.spotify.com https://www.youtube.com https://w.soundcloud.com https://embed.sound.xyz https://audius.co https://relay.farcaster.xyz https://app.neynar.com",
          "worker-src 'self' blob:",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/messages/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
};

export default nextConfig;
