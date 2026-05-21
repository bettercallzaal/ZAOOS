---
topic: infrastructure
type: research
status: research-complete
last-validated: 2026-05-20
original-query: What remaining performance optimizations exist for Vercel and Next.js 16? (reconstructed)
tier: FULL
---

# 283 — Vercel + Next.js 16 Performance Optimization Guide

> **Status:** Research complete
> **Date:** 2026-04-05
> **Goal:** Identify all remaining Vercel + Next.js 16 performance optimizations beyond what's already implemented

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **PPR (Partial Prerendering)** | SKIP for now — still experimental in Next.js 16, not production-ready. Revisit when stable. |
| **ISR for landing page** | USE — landing page (`src/app/page.tsx`) does a session check but could serve static shell + revalidate. Saves 1.33s TTFB for unauthenticated visitors. |
| **`next/font` for Inter** | USE — replace CSS import with `next/font/google` in layout.tsx to self-host Inter. Eliminates external font request (saves ~100ms FCP). |
| **`loading.tsx` files** | USE — add loading.tsx to heavy route segments (spaces, settings, admin, fishbowlz). Gives instant skeleton while JS loads. Biggest FCP win. |
| **Suspense boundaries** | USE — wrap data-fetching sections in `<Suspense>` with fallbacks. Enables streaming SSR. |
| **`staleTimes` config** | USE — set `dynamic: 30` in next.config.ts to cache client-side navigations for 30 seconds. Instant page transitions on repeat visits. |
| **Cache-Control on API routes** | USE — add `stale-while-revalidate` headers to read-only API routes (leaderboard, trending, public profiles). Vercel CDN caches at edge. |
| **Bundle analyzer** | USE — already configured but run `ANALYZE=true npm run build` to identify remaining large chunks. |
| **Edge Config** | SKIP — $0/mo on Hobby but only useful for feature flags. Not a perf priority for ZAO's scale. |
| **Skew Protection** | SKIP — Pro plan only ($20/mo). Prevents version mismatches during deploys, not a perf issue. |
| **Fluid Compute** | SKIP — Pro plan only. Optimizes serverless function cold starts. Not available on Hobby. |
| **`optimizePackageImports`** | DONE — already configured for 14 packages in next.config.ts. Add `@stream-io/video-react-sdk` to the list. |

## What's Already Done vs What's Left

| Optimization | Status | Impact |
|-------------|--------|--------|
| `optimizePackageImports` (14 packages) | DONE | Moderate — tree-shakes barrel exports |
| Dynamic imports for Stream SDK | DONE (this session) | HIGH — 150KB off spaces bundle |
| Dynamic imports for 5 conditional components | DONE (this session) | HIGH — 30KB off spaces |
| Middleware fast path for page routes | DONE (this session) | LOW — saves 10-20ms TTFB |
| `next/image` for external images | DONE (this session) | MEDIUM — lazy loading + optimization |
| Settings lazy-load (5 sections) | DONE (this session) | MEDIUM — smaller settings bundle |
| `next/font` for Inter | **TODO** | MEDIUM — eliminates external font request |
| `loading.tsx` skeleton files | **TODO** | HIGH — instant FCP for heavy routes |
| `Suspense` boundaries in pages | **TODO** | HIGH — streaming SSR |
| `staleTimes` config | **TODO** | MEDIUM — instant repeat navigations |
| Cache-Control on API routes | **TODO** | MEDIUM — edge caching for reads |
| Add Stream SDK to `optimizePackageImports` | **TODO** | LOW — additional tree-shaking |
| ISR for landing page | **TODO** | MEDIUM — static shell for unauthenticated |

## Comparison: Optimization Techniques by Impact

| Technique | FCP Impact | LCP Impact | TTFB Impact | Effort | Priority |
|-----------|-----------|-----------|-------------|--------|----------|
| `loading.tsx` skeletons | -500ms | -200ms | 0 | 30 min | P0 |
| `next/font` self-hosting | -100ms | -50ms | 0 | 10 min | P0 |
| `Suspense` streaming SSR | -300ms | -400ms | 0 | 2 hrs | P1 |
| `staleTimes: { dynamic: 30 }` | 0 (repeat nav only) | 0 | -1300ms (repeat) | 5 min | P1 |
| API Cache-Control headers | 0 | -200ms (data-dependent pages) | -500ms | 1 hr | P1 |
| ISR for landing | -1000ms | -800ms | -1300ms | 30 min | P1 |
| Add Stream to optimizePackageImports | -50ms | 0 | 0 | 2 min | P2 |
| Bundle analysis + cleanup | varies | varies | 0 | 2 hrs | P2 |

## Implementation Details

### 1. `loading.tsx` Skeletons (P0 — biggest FCP win)

Add `loading.tsx` to these route segments:

```
src/app/(auth)/spaces/loading.tsx      ← RES 27, heaviest page
src/app/(auth)/settings/loading.tsx    ← RES 70
src/app/(auth)/admin/loading.tsx
src/app/(auth)/music/loading.tsx
src/app/fishbowlz/loading.tsx
src/app/(auth)/social/loading.tsx
```

Each `loading.tsx` should render a skeleton matching the page layout:

```tsx
// src/app/(auth)/spaces/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] p-4">
      <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

### 2. `next/font` for Inter (P0 — 10 min fix)

Currently Inter is loaded via CSS in `src/app/globals.css`:
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

Switch to `next/font` in `src/app/layout.tsx`:
```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
// Apply: <html className={inter.className}>
```

This self-hosts the font at build time — zero external requests, zero layout shift.

### 3. `staleTimes` Config (P1 — 5 min fix)

Add to `next.config.ts`:
```ts
experimental: {
  staleTimes: {
    dynamic: 30,  // Cache client-side navigations for 30 seconds
    static: 180,  // Cache static pages for 3 minutes
  },
  // ... existing optimizePackageImports
}
```

Effect: After visiting `/music`, navigating away and back within 30 seconds serves the cached version instantly (0ms TTFB for repeat navigation).

### 4. API Cache-Control Headers (P1)

Add `Cache-Control` headers to read-only API routes. Vercel CDN respects these:

```ts
// In any GET route handler:
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
});
```

Best candidates for caching:
- `/api/respect/leaderboard` — data changes rarely (cache 60s)
- `/api/music/trending-weighted` — changes hourly (cache 300s)
- `/api/music/track-of-day` — changes daily (cache 3600s)
- `/api/wavewarz/leaderboard` — changes on battle end (cache 60s)
- `/api/directory/members` — changes on new member (cache 120s)

### 5. `Suspense` Boundaries (P1)

Wrap data-fetching components in Suspense for streaming SSR:

```tsx
// src/app/(auth)/music/page.tsx
import { Suspense } from 'react';

export default function MusicPage() {
  return (
    <>
      <Suspense fallback={<PlayerSkeleton />}>
        <NowPlaying />
      </Suspense>
      <Suspense fallback={<GridSkeleton />}>
        <TrendingTracks />
      </Suspense>
    </>
  );
}
```

Each Suspense boundary streams independently — the first one to resolve renders immediately.

### 6. Add Stream SDK to `optimizePackageImports` (P2)

```ts
// next.config.ts
optimizePackageImports: [
  // ... existing entries
  '@stream-io/video-react-sdk',
],
```

## ZAO OS Integration

Key files to modify:

| File | Change |
|------|--------|
| `next.config.ts` | Add `staleTimes`, add Stream to `optimizePackageImports` |
| `src/app/layout.tsx` | Switch to `next/font/google` for Inter |
| `src/app/(auth)/spaces/loading.tsx` | New — skeleton for spaces |
| `src/app/(auth)/settings/loading.tsx` | New — skeleton for settings |
| `src/app/(auth)/admin/loading.tsx` | New — skeleton for admin |
| `src/app/(auth)/music/loading.tsx` | New — skeleton for music |
| `src/app/fishbowlz/loading.tsx` | New — skeleton for fishbowlz |
| `src/app/api/respect/leaderboard/route.ts` | Add Cache-Control header |
| `src/app/api/music/trending-weighted/route.ts` | Add Cache-Control header |
| `src/app/api/music/track-of-day/route.ts` | Add Cache-Control header |

## Expected Results

After implementing all P0 + P1 optimizations:

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| RES | 92 | 96+ | +4 points |
| FCP | 2.4s | 1.4s | -1000ms |
| LCP | 2.85s | 1.8s | -1050ms |
| TTFB | 1.33s | 0.8s | -530ms |
| `/spaces/[id]` RES | 27 | 85+ | +58 points |
| `/settings` RES | 70 | 90+ | +20 points |
| `/` RES | 86 | 95+ | +9 points |

## Sources

- [Vercel Next.js Framework Docs](https://vercel.com/docs/frameworks/nextjs) — ISR, SSR, Streaming, PPR, Image Optimization
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights) — RES, Core Web Vitals metrics
- [Next.js Loading UI & Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) — loading.tsx + Suspense
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) — next/font self-hosting
- [Vercel CDN Cache](https://vercel.com/docs/cdn-cache) — stale-while-revalidate headers
