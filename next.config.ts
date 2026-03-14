import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xmtp/wasm-bindings'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: '*.warpcast.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Music artwork CDNs
      { protocol: 'https', hostname: 'i.scdn.co' },              // Spotify artwork
      { protocol: 'https', hostname: 'i1.sndcdn.com' },          // SoundCloud artwork
      { protocol: 'https', hostname: 'i2.sndcdn.com' },
      { protocol: 'https', hostname: 'i3.sndcdn.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },        // YouTube thumbnails
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: '*.ipfs.nftstorage.link' }, // IPFS artwork
      { protocol: 'https', hostname: '*.audius.co' },            // Audius artwork
    ],
  },

  // XMTP requires COEP/COOP for SharedArrayBuffer (WASM)
  // Scoped to /messages only — global headers would break Spotify/YouTube iframes
  async headers() {
    // Security headers applied to all routes
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
          "frame-src 'self' https://open.spotify.com https://www.youtube.com https://w.soundcloud.com https://relay.farcaster.xyz",
          "worker-src 'self' blob:",
        ].join('; '),
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/chat',
        headers: [
          ...securityHeaders,
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
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
