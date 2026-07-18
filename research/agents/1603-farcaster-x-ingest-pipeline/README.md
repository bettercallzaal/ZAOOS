---
topic: agents, technology, infrastructure
type: implementation-spec
status: SPEC READY — implement Farcaster first (zero cost); X tier decision needed (check developer.x.com)
last-validated: 2026-07-20
related-docs: 570-zaal-personal-kg-agentic-memory, 620-bonfire-push-everything, 665-bonfires-deep-dive-zao-integration, 680-meeting-skill-bonfire-bridge, 1563-neynar-api-zol-music-scout-capabilities, 761-hypersnap-farcaster-node
board-tasks: "Farcaster + X ingest pipeline (doc 570 multi-corpus plan)"
action-owner: Developer (ZOL extension); Zaal (X API tier decision)
---

# 1603 — Farcaster + X Ingest Pipeline: Spec

> **What this is:** Implementation spec for ingesting Farcaster channel casts and X (Twitter) posts into the ZAO Bonfire knowledge graph. Board task: "Farcaster + X ingest pipeline (doc 570 multi-corpus plan)." Doc 570 Stage 3 deadline: 2026-07-30. This spec is the missing bridge between ZOL's existing channel monitoring and Bonfire's write API.

---

## What Already Exists

ZAO already has most of the pieces:

| Component | Status | Where |
|-----------|--------|-------|
| Farcaster read (readV2) | ✅ LIVE | `bot/src/zoe/farcaster/read-node.ts` — self-hosted Hypersnap node + Neynar fallback |
| Farcaster write | ✅ LIVE | `bot/src/zoe/farcaster/write.ts` |
| ZOL channel monitoring | ✅ LIVE (Pi) | Monitors /wavewarz, /zabal, /zao; DreamLoops-based |
| Bonfire write (episode/create) | ✅ LIVE | Via `/knowledge_graph/episode/create`; ZOE posts after every meeting/research doc |
| Bonfire dedup hash log | ✅ PLANNED | `~/.zao/zoe/bonfire-pushed.sqlite` (doc 620, not yet built) |
| Email ingest | ✅ LIVE | `bot/src/zoe/inbox-ingest.ts` — AgentMail → ZOE context |
| X ingest | ❌ NOT BUILT | No X API integration in ZOE/ZOL today |

The Farcaster pipeline just needs a **new cron loop** in ZOL (or ZOE) that pulls notable casts from the monitored channels and converts them to Bonfire episodes. The X pipeline needs a new API key and route.

---

## Part 1: Farcaster Ingest

### What to Ingest

Not all casts — only the ones worth knowing about later. Three categories:

**Category A: Channel highlights** (daily, 5 casts/channel)
- `GET /v2/farcaster/feed/channels?channel_ids=wavewarz,zabal,zao&limit=25`
- Score each cast: recasts×3 + likes×1 + replies×2
- Keep top 5 per channel per day (same scoring as doc 1563 weekly-curator)

**Category B: ZAO FID mentions** (real-time or hourly)
- `GET /v2/farcaster/notifications?fid=<ZAAL_FID>&type=mentions,recasts`
- Any mention of @bettercallzaal, @zolbot, @zaodevz → push to Bonfire
- Rate: ~10-30/day at current ZAO activity level

**Category C: WaveWarZ battle results** (after each battle, manual trigger)
- ZOL already captures battle result casts — extend to also push to Bonfire
- Battle result episode format: `wavewarz:2026-07-20:battle-result`

### Filtering Rules (Before Pushing to Bonfire)

Only push a cast to Bonfire if it meets at least one:
1. Has 5+ engagement (recasts×3 + likes×1 + replies×2)
2. Contains ZAO keyword: `wavewarz | zabal | zaostock | zor token | fractal democracy | africa battle`
3. Is from a ZAO-related FID (list in `src/lib/wavewarz/constants.ts` extended with ZAO team FIDs)
4. Is a reply to a ZAO team cast

Filtering prevents ingest spam. ZAO channels are small; at current scale ~15-25 casts/day across all three channels meet these criteria.

### Episode Format (Bonfire)

```json
{
  "name": "farcaster:cast:<cast_hash>",
  "episode_body": "On 2026-07-20, @<handle> cast in /<channel>: \"<cast_text>\". Engagement: <score> (recasts: X, likes: Y, replies: Z). Link: https://warpcast.com/<handle>/<cast_hash>. Tags: <channel>, zao-farcaster-ingest.",
  "source_tag": "farcaster-channel"
}
```

The `name` uses `cast:<cast_hash>` as the stable ID — same cast never pushes twice (idempotent update behavior in Bonfire).

### Implementation Plan (Farcaster)

**Step 1: Add `src/lib/zol/bonfire-push.ts`** (new file, 80 lines)

```typescript
// Scores a cast and decides if it should be pushed to Bonfire.
export function shouldPush(cast: NeynarCast, channelId: string): boolean { ... }

// Converts a Neynar cast object to a Bonfire episode.
export function castToEpisode(cast: NeynarCast, channelId: string): BonfireEpisode { ... }

// Posts a single episode to Bonfire. Idempotent (same name = update).
export async function pushCastToBonfire(cast: NeynarCast, channelId: string): Promise<void> { ... }
```

**Step 2: Add `farcaster-ingest` DreamLoop** in ZOL

```typescript
// loops/farcaster-ingest.ts
// Runs daily at 11pm ET. Pulls top casts from each channel, scores, pushes to Bonfire.
```

Schedule: daily at 11pm ET (after peak Farcaster activity window ends for the day).
Rate: ≤25 Bonfire episode pushes/day (well within free Bonfire tier).
Cost: $0 — reads via Hypersnap node (free), writes via Bonfire episode API (free at this volume).

**Step 3: Add mention-ingest hook** (real-time)

In ZOL's existing Neynar webhook handler (or hourly poll), add a branch:
```
on mention of ZAAL_FID → pushCastToBonfire(cast, 'mention')
```

This captures real-time Farcaster conversations about ZAO that would otherwise be lost.

**Dependencies:**
- `BONFIRE_API_KEY` in ZOL env (same key ZOE uses on VPS) — ✅ already set on VPS
- `BONFIRE_ID` = `69ef871f0d22ed7e6f2b243a` — ✅ already in bonfire.env
- Neynar free tier (100 req/day) — ~5 req/day for this pipeline ✅

**Estimate:** 3-4 hours (new DreamLoop + bonfire-push.ts)

---

## Part 2: X Ingest

### What to Ingest from X

ZAO's X presence is lighter than Farcaster. Target 3 streams:

1. **@bettercallzaal mentions** — anyone tagging ZAO/Zaal on X
2. **`#ZABALGames #WaveWarZ #ZAOstock` hashtag posts** — promotional reach tracking
3. **ZAO partner casts** — Iman's @imanfarook + PizzaDAO Zambia X posts about ZAO

Volume estimate at current ZAO scale: 20-50 posts/week across these three streams.

### X API Tier Options (July 2026)

Check current pricing at `developer.x.com/en/docs/twitter-api/getting-started/about-twitter-api` before deciding:

| Tier | Monthly Cost | Read Calls | Posts/month | Best For |
|------|-------------|------------|-------------|---------|
| **Free** | $0 | 500K tweets/mo (read-only) | 1,500 write | Adequate for ZAO scale |
| **Basic** | $100/mo | 10M tweets/mo | 3,000 write | Overkill |
| **Pro** | $5,000/mo | 1M tweets/mo (higher rate) | — | Enterprise |

**Recommendation: Free tier.** At 20-50 posts/week × 52 weeks = 1,000-2,600 posts/year, ZAO is well under the 500K/month read limit. The X API free tier's 1,500 write posts/month also covers ZOL's recast + announcement cadence.

**Gate:** Zaal needs to create an X developer account at `developer.x.com` and get a bearer token. Estimated time: 15 minutes. No credit card required for free tier.

### X Ingest Implementation

**New module: `bot/src/zoe/x-ingest.ts`** (similar to `inbox-ingest.ts`):

```typescript
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const X_SEARCH_QUERIES = [
  'to:bettercallzaal',        // mentions of Zaal
  '#WaveWarZ',                // WaveWarZ hashtag
  '#ZABALGames',              // ZABAL Games hashtag
  '#ZAOstock',                // ZAOstock hashtag
  'from:imanfarook ZAO',      // Iman's ZAO posts
];
const MAX_RESULTS = 10;       // per query per run

// POST /2/tweets/search/recent — 7-day lookback, 10 results per query
// Run: daily at midnight ET
```

**Episode format:**
```json
{
  "name": "x:tweet:<tweet_id>",
  "episode_body": "On 2026-07-20, @<handle> tweeted: \"<text>\". Engagement: <likes> likes, <retweets> retweets. Query: <search_query>. Link: https://x.com/<handle>/status/<tweet_id>.",
  "source_tag": "x-ingest"
}
```

**Privacy rule:** Only ingest PUBLIC tweets. Never ingest DMs. Apply `redactPii()` (same as inbox-ingest.ts) before Bonfire push.

**Dependencies:**
- `X_BEARER_TOKEN` — Zaal gets at developer.x.com (15 min, free)
- `BONFIRE_API_KEY` — already in env

**Estimate:** 2-3 hours once bearer token is available.

---

## Combined Architecture

```
                    FARCASTER                           X
                       |                               |
          ZOL DreamLoop (daily 11pm ET)         ZOE cron (midnight ET)
          readV2: /v2/farcaster/feed/channels    X Search API v2 recent
               + /v2/farcaster/notifications     to:bettercallzaal, #tags
                       |                               |
                  score + filter                  collect + redactPii
                  top 5/channel/day               top 10/query/day
                       |                               |
                cast_hash dedup                  tweet_id dedup
                (bonfire-pushed.sqlite)          (bonfire-pushed.sqlite)
                       |                               |
                       +------------- Bonfire ----------+
                                      |
                          POST /knowledge_graph/episode/create
                          name: farcaster:cast:<hash> | x:tweet:<id>
                          episode_body: <self-contained prose>
                          source_tag: farcaster-channel | x-ingest
```

---

## Dedup Log: bonfire-pushed.sqlite

Both pipelines share a single dedup log to prevent re-pushing:

```sql
CREATE TABLE pushed (
  id TEXT PRIMARY KEY,   -- e.g. farcaster:cast:0x123... OR x:tweet:12345
  pushed_at TEXT NOT NULL
);
```

SQLite file at `~/.zao/zoe/bonfire-pushed.sqlite` (per doc 620 design). Check before every push; insert after success.

**Max size:** 1 year × (25 Farcaster + 70 X) × 365 = ~35,000 rows → SQLite handles easily.

---

## Implementation Order (Doc 570 Stage 3, Deadline Jul 30)

| Priority | Step | Owner | Time | Cost |
|----------|------|-------|------|------|
| P0 | Create `bonfire-pushed.sqlite` dedup log | Developer | 30 min | $0 |
| P0 | Add `bonfire-push.ts` to ZOL | Developer | 1.5 hr | $0 |
| P0 | Add `farcaster-ingest` DreamLoop to ZOL | Developer | 1.5 hr | $0 |
| P1 | Get X Bearer Token at developer.x.com | Zaal | 15 min | $0 |
| P1 | Add `x-ingest.ts` to ZOE cron | Developer | 2-3 hr | $0 |
| P2 | Wire mention-ingest hook (real-time) | Developer | 1 hr | $0 |

**Total: ~7 hours of development + 15 min Zaal action (X API key).**

P0 items (Farcaster) can ship without Zaal involvement. P1 is gated on Zaal getting the X bearer token (no cost, just account setup).

---

## What This Unlocks

| Before | After |
|--------|-------|
| Farcaster casts about ZAO exist only in Neynar's database | Notable ZAO casts live in Bonfire → ZAO AI assistant (doc 1600) can cite them |
| X mentions of WaveWarZ are invisible to ZAO's agents | ZOE knows about X buzz and can reference it in weekly notes |
| Doc 570 Stage 3 is blocked (no pipeline design exists) | Stage 3 implementation is fully specified, executable in 7 hours |
| ZAO AI assistant answers from static facts only | Post-pipeline: "Who's been talking about WaveWarZ on Farcaster?" becomes answerable |

---

## Sources

- Board task: "Farcaster + X ingest pipeline (doc 570 multi-corpus plan)"
- Doc 570 Stage 3: "Add secondary corpora (Farcaster casts 200 recent, Telegram exports, ChatGPT history Q4-Mar)" — deadline 2026-07-30
- Doc 620: Bonfire push-everything auto-ingest pipeline design (dedup log, privacy layer, source ordering)
- Doc 665: Bonfire deep-dive — write API schema, episode format, `source_tag` field
- Doc 1563: Neynar API capabilities for ZOL (endpoint list, free tier math, 100 req/day budget)
- Doc 761: Hypersnap Farcaster node (self-hosted, free reads at :3381)
- `bot/src/zoe/farcaster/read-node.ts`: `readV2()` — existing Farcaster read client
- `bot/src/zoe/inbox-ingest.ts`: pattern for per-tick ingest with dedup and PII scrubbing
- `developer.x.com`: X API v2 tiers and pricing (verify current free tier limits before implementing)
