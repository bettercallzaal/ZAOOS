import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/bcz-yapz',
        destination: 'https://bczyapz.com',
        permanent: true,
      },
      {
        source: '/bcz-yapz/:path*',
        destination: 'https://bczyapz.com/:path*',
        permanent: true,
      },
    ]
  },

  serverExternalPackages: [
    '@xmtp/wasm-bindings',
    'twitter-api-v2',
    'jsonwebtoken',
    '@gradio/client',
    'livepeer',
    '@ardrive/turbo-sdk',
    '@hiveio/dhive',
    '@discordjs/rest',
    'web-push',
    '@vectorize-io/hindsight-client',
  ],

  experimental: {
    // Cache client-side navigations — instant page transitions on repeat visits
    staleTimes: {
      dynamic: 30,   // Cache dynamic pages for 30 seconds
      static: 180,   // Cache static pages for 3 minutes
    },
    // Tree-shake barrel exports from heavy libraries
    optimizePackageImports: [
      '@tanstack/react-query',
      '@tanstack/react-virtual',
      '@rainbow-me/rainbowkit',
      '@farcaster/auth-kit',
      '@farcaster/auth-client',
      '@neynar/react',
      '@hatsprotocol/sdk-v1-core',
      '@atproto/api',
      'wagmi',
      'viem',
      'viem/chains',
      'viem/accounts',
      '@supabase/supabase-js',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-wallets',
      '@solana/web3.js',
      '@xmtp/browser-sdk',
      '@stream-io/video-react-sdk',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'cmdk',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
  },

  images: {
    // Serve AVIF first, WebP second; falls back to original for unsupported clients.
    formats: ['image/avif', 'image/webp'],
    // Farcaster PFPs + music artwork — allow known CDN hostnames only (SSRF mitigation).
    // User-controlled PFP images use the `unoptimized` prop on <Image> to bypass the proxy.
    remotePatterns: [
      // Warpcast / Farcaster CDNs
      { protocol: 'https', hostname: 'imagedelivery.net' },
      { protocol: 'https', hostname: 'wrpcd.net' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Google / social profile pictures
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Decentralized storage
      { protocol: 'https', hostname: '*.ipfs.dweb.link' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'ipfs.decentralized-content.com' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: 'nfts.imgix.net' },
      // ENS / NFT avatars
      { protocol: 'https', hostname: 'cdn.stamp.fyi' },
      { protocol: 'https', hostname: 'openseauserdata.com' },
      // Music service artwork
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'i1.sndcdn.com' },
      { protocol: 'https', hostname: 'is1-ssl.mzstatic.com' },
      // Audius CDN nodes (artwork served from various content nodes)
      { protocol: 'https', hostname: '**.audius.co' },
      { protocol: 'https', hostname: '**.theblueprint.xyz' },
      { protocol: 'https', hostname: '**.figment.io' },
      // YouTube thumbnails
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },

  // Security headers (non-CSP) — CSP is set dynamically in middleware with per-request nonces
  // XMTP COEP/COOP is also set in middleware for /messages routes
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // X-Frame-Options intentionally omitted. The Farcaster miniapp is
      // embedded in client iframes (Warpcast, Base App, third-party readers).
      // Frame embedding policy is controlled via CSP `frame-ancestors *`
      // set in src/middleware.ts.
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Long-lived static assets in /public — Lighthouse "efficient cache lifetimes".
      // 30d fresh + 7d SWR. Bust by renaming the file (no fingerprinting on /public).
      {
        source: '/:path*\\.(png|jpg|jpeg|webp|avif|gif|svg|ico|woff2|woff|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // Upload source maps for readable stack traces in Sentry
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  // Suppress Sentry CLI logs during build
  silent: !process.env.CI,
  // Disable Sentry telemetry
  telemetry: false,
});
