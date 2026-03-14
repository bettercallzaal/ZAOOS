# 41 — Next.js 16 + React 19 Deep Dive

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Advanced patterns, new features, and optimization for ZAO OS's core framework
> **Current stack:** Next.js 16.1.6, React 19.2.3, Tailwind CSS v4, TypeScript 5

---

## Immediate Action Items for ZAO OS

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | **Migrate `middleware.ts` → `proxy.ts`** | Required (Next.js 16 rename) | Small (`npx @next/codemod middleware-to-proxy`) |
| 2 | **Enable React Compiler** | High (auto-memoization, removes useMemo/useCallback) | Tiny (`reactCompiler: true` in next.config.ts) |
| 3 | **Add `"use cache"` directive** | High (proper caching for channel lists, profiles) | Medium |
| 4 | **Use `useOptimistic`** for chat send | High (instant UI feedback) | Small |
| 5 | **Add `next/font`** for Inter | Medium (zero CLS, no external font requests) | Small |
| 6 | **Add `preconnect()`** for Neynar + Supabase | Medium (reduced connection latency) | Tiny |
| 7 | **Wrap data sources in separate `<Suspense>`** | Medium (parallel streaming) | Medium |
| 8 | **Audit `'use client'` directives** | Medium (reduce client JS) | Medium |
| 9 | **Replace any `forwardRef`** with direct `ref` prop | Low (React 19 deprecation) | Small |

---

## 1. Next.js 16 Key Changes

### Turbopack (Now Default)
- Default for both `dev` and `build` — ZAO already has `turbopack: {}` in next.config.ts
- Production builds 2-5x faster, Fast Refresh up to 10x faster
- File System Caching stable in 16.1 (cold 3.7s → cached 380ms)
- **Verdict: keep using it, it's stable and production-ready**

### `"use cache"` Directive (Replaces unstable_cache)

```typescript
"use cache"  // default: in-memory LRU on server

async function getChannelList() {
  "use cache"
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 })
  return await fetchChannels();
}
```

Three variants:
- `"use cache"` — in-memory LRU on server
- `"use cache: remote"` — durable shared cache across instances
- `"use cache: private"` — browser cache, can access cookies/headers

**Key change:** `fetch()` is NOT cached by default in Next.js 16. You opt in explicitly.

### Partial Prerendering (PPR) — Now Stable & Default
- Static shell served instantly, dynamic content streams via Suspense
- No more `experimental_ppr` flag — just works
- ZAO's feed: navigation/chrome is static, feed content streams
- Each `<Suspense>` boundary = a dynamic "hole" in the static shell

### `proxy.ts` Replaces `middleware.ts`
- Rename: `middleware` → `proxy`, function `middleware` → `proxy`
- Now runs on Node.js runtime (not Edge)
- Codemod: `npx @next/codemod middleware-to-proxy`
- **ZAO still has `src/middleware.ts` — needs migration**

### React Compiler (Stable)
```typescript
// next.config.ts
export default { reactCompiler: true }
```
- Auto-memoizes components and hooks at compile time
- Eliminates need for `useMemo`, `useCallback`, `React.memo`
- SWC-accelerated (minimal build performance impact)
- Enforces Rules of Hooks at build time (catches bugs)

---

## 2. React 19 Features to Adopt

### useOptimistic (For Chat Send)
```typescript
const [optimisticMessages, addOptimistic] = useOptimistic(
  messages,
  (state, newMsg) => [...state, newMsg]
);

// In send handler:
addOptimistic({ text, author, status: 'sending' });
await sendMessage(text); // Server Action
// React auto-reverts on error
```

### useActionState (For Forms)
```typescript
const [state, formAction, isPending] = useActionState(submitAction, initialState);
// isPending is built in — no separate useFormStatus needed
```

### use() Hook
```typescript
// Read a promise passed from Server Component
const data = use(dataPromise); // suspends until resolved

// Read context inside conditionals (unlike useContext)
if (condition) {
  const theme = use(ThemeContext);
}
```

### ref as Prop (forwardRef Deprecated)
```typescript
// OLD
const Input = forwardRef<HTMLInputElement, Props>((props, ref) => ...);

// NEW (React 19)
function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) { ... }
```

### Resource Preloading
```typescript
// In root layout — reduces connection latency
import { preconnect } from 'react-dom';
preconnect('https://api.neynar.com');
preconnect('https://your-project.supabase.co');
```

### Document Metadata in Components
```typescript
// Any component can render <title>, <meta>, <link>
// React 19 auto-hoists to <head>
function TrackPage({ track }) {
  return <>
    <title>{track.title} — ZAO OS</title>
    <meta property="og:title" content={track.title} />
    <div>...</div>
  </>;
}
```

---

## 3. Data Fetching Patterns

### Server Components (Primary)
```typescript
// app/feed/page.tsx — no 'use client', runs on server
async function FeedPage() {
  const posts = await fetchPosts(); // runs on server, zero client JS
  return <FeedList posts={posts} />;
}
```

### TanStack Query + App Router
1. Server Component: `prefetchQuery` + `dehydrate`
2. Client Component wrapper: `<HydrationBoundary state={dehydratedState}>`
3. Client Components: `useQuery` — data already hydrated, no loading flash
4. React Query handles refetch, cache invalidation, optimistic updates

### Parallel Data Fetching
```typescript
// Avoid sequential waterfalls
const [feed, user, channels] = await Promise.all([
  fetchFeed(), fetchUser(), fetchChannels()
]);

// OR: separate Suspense boundaries (each streams independently)
<Suspense fallback={<FeedSkeleton />}><Feed /></Suspense>
<Suspense fallback={<SidebarSkeleton />}><Sidebar /></Suspense>
```

### Caching Strategy

| Data | Strategy | TTL |
|------|----------|-----|
| Channel list | `"use cache"` + `cacheLife({ stale: 300 })` | 5 min |
| User profile | `"use cache"` + `cacheTag('user-{fid}')` | Until invalidated |
| Feed posts | No cache (real-time via Supabase Realtime) | None |
| Music metadata | `"use cache"` + `cacheLife({ stale: 3600 })` | 1 hour |
| Static content | ISR with `revalidate = 3600` | 1 hour |

---

## 4. Performance Patterns

### Server Components as Default
- Every component without `'use client'` ships zero JavaScript
- Audit: `grep -rl "'use client'" src/` — remove where not needed
- Common candidates: components that only render data without event handlers

### Dynamic Imports
```typescript
const MusicPlayer = dynamic(() => import('./MusicPlayer'), {
  ssr: false,
  loading: () => <PlayerSkeleton />
});
```
Good candidates: XMTP messaging, music player, admin panels, waveform visualizer

### Core Web Vitals
- **LCP:** `priority` on above-the-fold images, `preconnect()`, PPR streaming
- **INP:** Server Components reduce main thread JS, `React.startTransition` for non-urgent updates
- **CLS:** `next/image` with dimensions, `next/font` for zero-CLS fonts, size-matched skeletons

### Streaming SSR
PPR (default in Next.js 16) serves static shell instantly. Each `<Suspense>` = independent stream. Fast data shows immediately while slow queries still load.

---

## 5. Auth Patterns (iron-session + App Router)

### Three Layers of Protection
1. **Proxy-level:** Redirect unauthenticated requests before hitting route
2. **Server Component-level:** Read session, render differently or redirect
3. **Data Access Layer:** Every data function verifies session independently

### CSRF
- Server Actions: built-in CSRF protection (origin checking)
- Route Handlers: NOT protected — add CSRF tokens or use `sameSite: 'strict'` cookies

---

## 6. Real-Time on Vercel

### Supabase Realtime
Works fine on Vercel — WebSocket is between browser and Supabase directly (not through Vercel Functions).

```typescript
supabase.channel('chat')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handler)
  .subscribe()
```

### Alternatives for Server Push
- **SSE:** Supported via streaming Route Handlers
- **Polling:** TanStack Query `refetchInterval`
- **Rivet:** WebSocket servers for Vercel Functions (new, evaluate maturity)

---

## 7. Error Handling

| File | Purpose |
|------|---------|
| `error.tsx` | Per-route error boundary (catches render errors in that segment) |
| `global-error.tsx` | Catches root layout errors (must render own `<html>`) |
| `not-found.tsx` | Per-route 404 handling |
| `loading.tsx` | Per-route Suspense fallback |

- Place `error.tsx` at each major route group (`/feed`, `/messages`, `/admin`)
- Error boundaries do NOT catch event handler or async errors — use try/catch + toasts
- Server Actions: return `{ success: false, error: '...' }` instead of throwing

---

## 8. Testing

### Vitest (Unit/Component)
- Officially supported in Next.js 16 via `next/vitest` plugin
- Works for: Client Components, sync Server Components, hooks, Zod schemas, utilities
- **Cannot test async Server Components** — use Playwright

### Playwright (E2E)
- Full user flows: login → browse feed → send message
- Async Server Components, Server Actions
- Mobile viewport testing (critical for ZAO's mobile-first)

### Mocking
- Supabase: `vi.mock('@supabase/supabase-js')`
- Neynar: MSW (Mock Service Worker) to intercept HTTP
- iron-session: mock `getIronSession` to return test data

---

## 9. Tailwind CSS v4

### What Changed
- Ground-up rewrite with Oxide engine (Rust-based)
- Full builds 5x faster, incremental 100x+ faster
- CSS-first config (no `tailwind.config.js`) — ZAO already uses `@theme inline`

### Key v4 Features
- **Container queries:** `@sm`, `@md`, `@lg` variants (no plugin)
- **3D transforms:** `rotate-x-*`, `rotate-y-*`, `perspective-*`
- **`@variant` for custom variants**
- **Class renames:** `bg-gradient-to-*` → `bg-linear-to-*`, `flex-shrink-0` → `shrink-0`
- **`color-mix()`** for opacity variants of brand colors

### Music-Specific Design Tokens
Extend `@theme` with:
- Waveform colors, player progress gradients
- Album art border radius and shadow tokens
- Visualizer accent colors (dynamically themed per album/genre)

---

## 10. Deployment

### Vercel Best Practices
- **Serverless (not Edge)** for 90% of routes — Supabase DB is in one region, Edge adds latency
- Preview deployments for every PR
- `Cache-Control` headers on public API routes (`s-maxage`, `stale-while-revalidate`)
- Sentry (`@sentry/nextjs`) auto-instruments Server Components, Actions, and API routes

---

## Sources

- [Next.js 16 Release](https://nextjs.org/blog/next-16)
- [Next.js 16.1 Release](https://nextjs.org/blog/next-16-1)
- [Next.js "use cache"](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React v19](https://react.dev/blog/2024/12/05/react-19)
- [Next.js Server Actions Security](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [Next.js Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [TanStack Query Advanced SSR](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr)
- [Supabase Realtime + Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Core Web Vitals 2026](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)
- [Next.js PPR Guide](https://www.ashishgogula.in/blogs/a-practical-guide-to-partial-prerendering-in-next-js-16)
