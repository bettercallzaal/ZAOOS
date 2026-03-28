import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xmtp/wasm-bindings'],

  experimental: {
    // Tree-shake barrel exports from heavy libraries
    optimizePackageImports: [
      '@tanstack/react-query',
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
    ],
  },

  images: {
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
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
};

export default withBundleAnalyzer(nextConfig);
