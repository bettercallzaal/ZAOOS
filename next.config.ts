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
    return [
      {
        source: '/chat',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/messages/:path*',
        headers: [
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
