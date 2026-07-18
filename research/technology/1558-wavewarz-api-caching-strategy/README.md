# 1558 — WaveWarZ Public API Caching Strategy (Pre-ZAOstock, Aug 2026)

**Type:** TECH-SPEC  
**Topic:** Technology  
**Status:** HURRICANE HANDOFF — implement before Aug 15 (Mini App launch, doc 1518). The public API at `wavewarz.info/api/public/stats` is referenced in 50+ ZAOOS docs, ZOE automations, the Farcaster Mini App, wwtracker, llms.txt, and the ZAOstock live display. It must not go down on Oct 3.

---

## Why Caching Is Critical Now

**Current state:** ZOE, wwtracker, the Farcaster Mini App (Aug 15), and ZAOstock day-of all make live requests to `wavewarz.info/api/public/stats`. No documented caching exists.

**Risk if uncached:**
- Oct 3 ZAOstock: 200 attendees + 50+ remote viewers → spike in concurrent stats requests → API timeout → live vote count screen fails
- ZOE scheduler fails to post battle results (API call returns 5xx) → silent automation failure
- GEO crawlers (LLM training bots) hit the API repeatedly → unexpected rate limiting

**Acceptable stale window for each consumer:**

| Consumer | Data freshness required | Acceptable stale window |
|---|---|---|
| ZAOstock live vote screen | Real-time during battle (15 min) | 0 seconds (live) |
| Farcaster Mini App dashboard | Near real-time | 30 seconds |
| ZOE battle announcements | Fresh at time of post | 60 seconds |
| wwtracker stats tile | Dashboard update | 5 minutes |
| GEO bots (llms.txt context) | Weekly update | 24 hours |
| ZAOOS README, press kit | Monthly update | 7 days |

---

## Recommended Caching Architecture (Edge Cache + Redis)

### Layer 1: Edge Cache (Cloudflare CDN or Vercel Edge)
For the stats endpoint: set `Cache-Control: public, max-age=30, stale-while-revalidate=60`

This means:
- Response served from edge for 30 seconds (no origin hit)
- After 30s, edge serves stale while fetching fresh in background (user sees no delay)
- After 90s from last fill: edge fetches from origin

**Implementation (Next.js on Vercel):**
```typescript
// app/api/public/stats/route.ts
export async function GET() {
  const data = await fetchStatsFromDatabase()
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      'CDN-Cache-Control': 'max-age=30',
    }
  })
}
```

**No infrastructure changes needed if on Vercel** — Vercel Edge Network handles CDN automatically when `Cache-Control` headers are set.

### Layer 2: Redis Cache (Optional, for database-heavy stats)
If the stats endpoint makes expensive DB queries (many battles → aggregated counts), add Redis:

```typescript
const STATS_CACHE_KEY = 'wavewarz:public:stats'
const CACHE_TTL = 30 // 30 seconds

export async function GET() {
  // Try Redis first
  const cached = await redis.get(STATS_CACHE_KEY)
  if (cached) return NextResponse.json(JSON.parse(cached))
  
  // Miss: compute from database
  const data = await computeStats()
  await redis.setex(STATS_CACHE_KEY, CACHE_TTL, JSON.stringify(data))
  return NextResponse.json(data)
}
```

**Redis provider options (free tier):**
- Upstash Redis: free tier, 10K requests/day, edge-native (best for Vercel)
- Railway: free tier, included in existing stack if Hurricane uses Railway

### Layer 3: Static Snapshot (ZAOstock Fallback)
Before Oct 3: export a static JSON snapshot of stats as a GitHub-hosted file:

```
https://raw.githubusercontent.com/bettercallzaal/wwtracker/main/public/ww-stats-snapshot.json
```

ZOE updates this file daily via a GitHub Action. If wavewarz.info API is unreachable on Oct 3, the live screen falls back to the snapshot (may be up to 24h stale — acceptable for display).

---

## ZAOstock Live Vote Screen: Real-Time Exception

The ZAOstock on-stage vote count screen (2:40PM–3:05PM Oct 3) requires real-time data — NOT cached. The 15-minute voting window is the critical path.

**Spec for live screen:**
- Poll `/api/battle/[current-battle-id]/votes` every 5 seconds during the active window
- Hurricane: this endpoint must NOT be cached — skip `Cache-Control` header or set `no-store`
- Fallback: if API is unreachable, show last known vote count + "Refreshing..." message
- Test: run a MAIN battle with the live screen before Oct 3 (recommended: COC #8 or ZAOville pool party)

```typescript
// Live vote endpoint — no cache
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const votes = await getBattleVotes(params.id)
  return NextResponse.json(votes, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
```

---

## wwtracker: Separate Caching Consideration

wwtracker (github.com/bettercallzaal/wwtracker) fetches battle data from the WaveWarZ API. Current state:

- `public/ww-battles.json` is a static export (1,252 battles as of Jul 2026)
- This file is served statically by Vercel — no caching issue
- ZOE or Hurricane updates this file when new battles are added

**Recommendation:** Keep wwtracker's battles.json as a static export. Update via GitHub Action triggered by WaveWarZ webhook (on battle close). This isolates wwtracker from API availability entirely.

---

## Implementation Checklist

**Phase 1 (Before Aug 15 — Mini App launch):**
- [ ] Add `Cache-Control: public, max-age=30, stale-while-revalidate=60` to `/api/public/stats`
- [ ] Add `Cache-Control: no-store` to live vote count endpoint
- [ ] Test Mini App with staged cache miss (restart Vercel function, confirm 30s TTL)
- [ ] Create static snapshot file `public/ww-stats-snapshot.json` with daily GitHub Action update

**Phase 2 (Before Sep 1 — ZABAL S2 launch):**
- [ ] Evaluate Redis need: if stats endpoint >50ms response time, add Upstash Redis
- [ ] Update ZOE scheduler to catch API errors and fall back to cached snapshot
- [ ] Add error handling to Telegram handler: if API 5xx → use last known stats + "(cached)"

**Phase 3 (Before Oct 1 — ZAOstock)**
- [ ] Load test: simulate 50 concurrent requests to `/api/public/stats` — confirm <200ms response
- [ ] Dry-run ZAOstock live screen with cache in place: confirm real-time vote feed works
- [ ] Create Hurricane runbook: "if API goes down Oct 3" → steps to restore within 10 min

---

## Monitoring (ZOE Task)

ZOE should check API health in the 7PM EOD report (doc 1499):

```typescript
// Add to ZOE health check (daily)
const stats = await fetch('https://wavewarz.info/api/public/stats', { 
  signal: AbortSignal.timeout(3000)  // 3s timeout
}).catch(() => null)

if (!stats || !stats.ok) {
  zoe.escalate('WaveWarZ API health check failed — response: ' + (stats?.status ?? 'timeout'))
}
```

ZOE escalates to Zaal if API is down for >15 minutes during business hours (9AM–10PM EST).

---

## Related Docs

- 1518 — WaveWarZ Mini App Phase 1 (consumers the stats API — must have cache before launch)
- 1427 — WaveWarZ Public API Documentation (API endpoint reference)
- 1524 — ZAOstock Day-of Protocol (live vote screen = critical path for Oct 3)
- 1499 — ZOE Daily Ops Report (API health check task)
- 1527 — ZOE Work-Loop DreamLoop Port (ZOE error handling architecture)
- 1544 — ZOE Telegram Bot Debug (fallback messaging when API is down)
