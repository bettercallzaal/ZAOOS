# 248 — Network Tab Debugging Guide for ZAO OS

> **Status:** Research complete
> **Date:** April 2, 2026
> **Goal:** Practical guide for using the browser Network tab to find and fix issues across ZAO OS's 247 API routes, 45 route directories, and 552+ logger calls

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary debugging workflow** | USE the Network tab's **Fetch/XHR filter + "Copy as fetch"** workflow — right-click any failed request, copy it, paste into Claude Code to debug. This is the fastest way to get Zaal's exact request context into the terminal |
| **Auth debugging** | USE the **Cookies tab** (inside Network > click request > Cookies) to verify `zaoos-session` iron-session cookie is present and not expired (7-day TTL). Missing cookie = 401 on every `/api/*` route |
| **Rate limit debugging** | USE the **Headers tab** to check for `X-RateLimit-Remaining` headers and 429 status codes. ZAO OS has 30+ rate limit rules in `src/middleware.ts` (e.g., `/api/chat/send` = 10/min, `/api/proposals/vote` = 3/min) |
| **Performance bottlenecks** | USE the **Waterfall column** — sort by duration to find slow API routes. Green bars = server wait time (TTFB), blue = download. If green dominates, the Supabase query or external API call is slow |
| **Reproduce and share bugs** | USE **"Export HAR"** to save a full session capture. HAR files can be shared with Claude Code for analysis or imported back into DevTools to replay |
| **Supabase query debugging** | USE the **Response tab** to check for Supabase error messages — `PGRST` codes indicate PostgREST/RLS issues, `JWT expired` means session needs refresh |

## Comparison of Debugging Approaches

| Approach | Speed | Context Quality | Auth Support | Best For |
|----------|-------|----------------|--------------|----------|
| **Network tab (Chrome/Arc)** | Instant | Full headers, cookies, timing | Yes — sees httpOnly cookies | Finding broken requests, auth issues, slow routes, 4xx/5xx errors |
| **`curl` from terminal** | Fast | Manual — need to add cookies | Needs `--cookie` flag | Replaying specific requests, testing API changes |
| **Vitest unit tests** | Slow setup | Mocked — no real auth | Mocked session | Regression prevention, input validation, edge cases |
| **Vercel function logs** | ~30s delay | Server-side only | Yes | Production errors, server-side exceptions |
| **Supabase Dashboard (Logs)** | ~10s delay | SQL queries only | N/A | Slow queries, RLS failures, connection issues |

## The 5-Minute Network Tab Workflow for ZAO OS

### Step 1: Open Network Tab with the Right Filters

1. Open DevTools: `Cmd+Option+I` (Mac) or `F12`
2. Click **Network** tab
3. Check **"Disable cache"** checkbox (top-left) — prevents stale responses
4. Click **Fetch/XHR** filter button — hides images, fonts, CSS, only shows API calls
5. Click **"Preserve log"** checkbox — keeps requests across page navigations

### Step 2: Reproduce the Bug

Navigate through the ZAO OS feature that's broken. Every API call will appear in the Network tab in real-time.

**Quick filters for ZAO OS routes:**
- Type `api/chat` in the filter box — see only chat-related requests
- Type `api/music` — see only music-related requests
- Type `status-code:4` — see only 4xx errors (client errors)
- Type `status-code:5` — see only 5xx errors (server errors)
- Type `larger-than:100k` — find bloated API responses
- Type `-api/auth/session` — hide the session polling requests that clutter the log

### Step 3: Inspect the Failed Request

Click the red (failed) or yellow (warning) request. You'll see tabs:

| Tab | What to Check | ZAO OS Context |
|-----|---------------|----------------|
| **Headers** | Status code, request method, content-type | Check if `zaoos-session` cookie was sent. If missing, auth is broken |
| **Payload** | Request body (JSON) | Verify the frontend is sending correct data (prompt, duration, FID, etc.) |
| **Preview** | Formatted JSON response | Read the Zod validation errors — `parsed.error.issues` shows exactly what failed |
| **Response** | Raw response text | Check for HTML error pages (Next.js error boundary) vs JSON errors |
| **Timing** | Waterfall breakdown | TTFB > 2s = slow Supabase query or external API (Neynar, HuggingFace, Stream) |
| **Cookies** | Sent and received cookies | Verify `zaoos-session` cookie is present, not expired, and `httpOnly` |

### Step 4: Copy and Reproduce

Right-click the failed request and choose:

- **"Copy as fetch"** — Paste into browser console to replay instantly
- **"Copy as fetch (Node.js)"** — Paste into Claude Code terminal for server-side debugging
- **"Copy as cURL"** — Classic curl command, works anywhere
- **"Replay XHR"** — Click to re-send the exact same request (or press `R`)

**The killer move:** Copy as fetch, paste into the Claude Code conversation with "this request is failing, here's the exact call" — Claude gets the full URL, headers, body, and cookies.

### Step 5: Check the Response Pattern

ZAO OS API routes follow a consistent pattern (see `src/app/api/` conventions):

| Status | Meaning | What to Do |
|--------|---------|------------|
| **200** | Success | Check response body for expected data |
| **400** | Zod validation failed | Check Payload tab — see which field is invalid. Every ZAO route uses `safeParse` |
| **401** | No session / expired | Check Cookies tab for `zaoos-session`. Try logging out and back in |
| **403** | Not admin / not allowed | Check if route requires admin FID (see `community.config.ts` adminFids) |
| **429** | Rate limited | Check `src/middleware.ts` for the route's limit. Wait 60s and retry |
| **500** | Server error | Check Vercel function logs. The response body has a sanitized error — the real error is server-side only |
| **502** | External API failed | Neynar, HuggingFace, Stream.io, or Supabase is down. Check Response tab for upstream error |

## ZAO OS-Specific Debugging Recipes

### Recipe 1: "Why am I getting 401 on everything?"

1. Network tab > filter `status-code:401`
2. Click any 401 request > **Cookies** tab
3. Look for `zaoos-session` cookie
   - **Missing entirely:** SIWF login didn't complete, or cookie was cleared
   - **Present but expired:** iron-session TTL is 7 days (`src/lib/auth/session.ts`). Re-login
   - **Present but malformed:** Clear cookies, re-login. Session encryption may have changed if `SESSION_SECRET` rotated

### Recipe 2: "The music player isn't loading tracks"

1. Network tab > filter `api/music`
2. Look for `/api/music/library`, `/api/music/feed`, `/api/music/search`
3. Check Response tab — are tracks returning empty arrays?
4. If 200 but empty: Supabase query might be filtering too aggressively (check RLS policies)
5. If slow (>2s TTFB): The `search_vector` full-text search in `src/lib/music/library.ts:112` might need a GIN index

### Recipe 3: "Chat messages aren't sending"

1. Network tab > filter `api/chat/send`
2. Check Payload tab — is the `text` field present and within limits?
3. Check status:
   - **400:** Zod validation failed — check `src/app/api/chat/send/route.ts` for schema
   - **429:** Rate limited at 10/min — middleware blocks fast senders
   - **502:** Neynar API is down — the cast didn't reach Farcaster

### Recipe 4: "Spaces/rooms aren't connecting"

1. Network tab > filter `api/stream`
2. Look for `/api/stream/token` — this generates the Stream.io JWT
3. Check if token response includes a valid `token` field
4. Also filter for `wss://` — WebSocket connections show up separately. Look for red (failed) WS connections
5. Token expiry: Stream tokens last 1 hour. If the room was open > 1 hour, the token expired

### Recipe 5: "Page loads slowly"

1. Network tab > sort by **Time** column (click header to sort descending)
2. Top entries are your slowest requests
3. Common ZAO OS bottlenecks:
   - `/api/members` with many Neynar lookups — each FID is a separate Neynar API call
   - `/api/social/community-graph` — builds graph from multiple data sources
   - `/api/music/trending-weighted` — aggregates play counts + respect weights
   - `/api/respect/leaderboard` — sorts all members by Respect score
4. Check Waterfall column — long green bar = slow server. Long blue bar = large response

### Recipe 6: "Governance proposals aren't publishing"

1. Network tab > filter `api/publish`
2. Check `/api/publish/farcaster`, `/api/publish/bluesky`, `/api/publish/x`
3. These are called after a proposal reaches 1000 Respect
4. Each platform publishes independently — one can fail while others succeed
5. Check Response tab for platform-specific errors (API key expired, rate limit, content too long)

## Advanced Network Tab Techniques

### Throttling — Test Slow Connections

DevTools > Network > **Throttle dropdown** (top bar, says "No throttling"):
- Set to "Slow 3G" to test how ZAO OS behaves on bad mobile connections
- Check if loading states appear correctly in music player, chat, governance pages
- Verify that `AbortSignal.timeout()` in API routes triggers properly

### Block Specific Requests

Right-click a request > **"Block request URL"** or **"Block request domain"**:
- Block `api.neynar.com` — test what happens when Neynar is down
- Block `*.supabase.co` — test Supabase offline handling
- Block `/api/auth/session` — test unauthenticated experience

### Console Integration

In the Console tab, you can run:
```javascript
// See all failed requests in the last session
performance.getEntriesByType('resource')
  .filter(r => r.responseStatus >= 400)
  .map(r => ({ url: r.name, status: r.responseStatus, duration: r.duration }))
```

### HAR Export for Bug Reports

1. Network tab > click the **download icon** (Export HAR)
2. Save the `.har` file
3. Share with Claude Code: "Here's the HAR file from when X broke"
4. HAR contains ALL requests, headers, timing, responses — complete reproduction

**Privacy note:** Use "Copy all as HAR (sanitized)" to strip `Cookie`, `Set-Cookie`, and `Authorization` headers before sharing.

## ZAO OS Rate Limits Quick Reference (from `src/middleware.ts`)

| Route Pattern | Limit/min | Notes |
|---------------|-----------|-------|
| `/api/chat/send` | 10 | Most restrictive chat route |
| `/api/chat/react` | 30 | Reactions are cheaper |
| `/api/proposals/vote` | 3 | Intentionally slow to prevent spam |
| `/api/proposals` | 5 | Creating proposals |
| `/api/music/submissions` | 2 | Song submissions |
| `/api/admin` | 5 | Admin operations |
| `/api/auth` | 10 | Login/verify |
| `/api/search` | 30 | Search queries |
| `/api/stream/webhook` | 100 | Stream.io webhooks need high throughput |

If you see **429 Too Many Requests**, check this table for the limit and wait 60 seconds.

## Sources

- [Chrome DevTools Network Reference](https://developer.chrome.com/docs/devtools/network/reference) — Official Google docs, all features
- [Inspect Network Activity](https://developer.chrome.com/docs/devtools/network) — Getting started guide
- [Next.js Debugging Guide](https://nextjs.org/docs/app/guides/debugging) — Official Next.js + DevTools setup
- [Chrome DevTools Debugging Complete Guide 2026](https://devplaybook.cc/blog/chrome-devtools-javascript-debugging-guide-2026/) — Advanced tips
- [Network Tab Problem in Next.js RSC](https://medium.com/the-research-nest/fixing-the-network-tab-problem-in-next-js-and-react-server-components-ccecde3663b0) — Server Component visibility issue
- [Advanced Chrome DevTools Tips](https://requestly.com/blog/best-20-advance-chrome-devtools-debugging-tips/) — 20 pro techniques
- [Replay Network Request in cURL](https://developer.chrome.com/blog/replay-a-network-request-in-curl) — Copy/replay workflow
- [DebugBear Network Tab Guide](https://www.debugbear.com/blog/devtools-network) — Waterfall analysis deep dive
