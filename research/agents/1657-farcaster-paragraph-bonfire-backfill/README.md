---
topic: agents, technology, infrastructure
type: implementation-spec
status: SPEC READY — one-time backfill run; then doc 1603 ongoing pipeline takes over. ~3h build.
last-validated: 2026-07-18
related-docs: 1603-farcaster-x-ingest-pipeline, 570-zaal-personal-kg-agentic-memory, 620-bonfire-push-everything, 665-bonfires-deep-dive-zao-integration, 1574-zao-newsletter-paragraph-zoe-integration
board-tasks: "Backfill remaining corpora: Farcaster casts (Neynar pull), publish-history of ZABAL Updates from Paragraph (task #17)"
action-owner: Developer; Zaal (run script once, monitor output)
---

# 1657 — Farcaster + Paragraph Historical Backfill: Bonfire Corpus Completion

> **What this is:** One-time script to pull all historical ZAO-relevant Farcaster casts (via Neynar paginated feed) and all ZABAL Updates newsletter issues (via Paragraph API/RSS) and post them as Bonfire episodes. Board task #17 from the coordination plan (doc 600).
>
> **Why now:** Bonfire's knowledge graph has ZAO context from meetings and ZAOOS docs but is missing two high-signal corpora: (a) ~18 months of Farcaster channel history and (b) all past ZABAL Updates newsletter issues. Once backfilled, ZOE's recall improves and the doc 1603 ongoing ingest pipeline starts with full historical context.
>
> **After this runs:** The doc 1603 ongoing ingest pipeline handles new casts going forward. This script is one-time only.

---

## Pre-conditions

| Requirement | Status |
|-------------|--------|
| `NEYNAR_API_KEY` in `~/.zao/private/neynar.env` | ✅ LIVE (used by ZOL) |
| Bonfire write API via `~/.zao/bonfire.env` | ✅ LIVE (BONFIRE_API_KEY present) |
| Neynar channel read access (`/v2/farcaster/feed/channels`) | ✅ Free tier — no additional cost |
| Paragraph.xyz ZABAL Updates publication URL | Confirm with Zaal — `https://paragraph.xyz/@bettercallzaal` |
| `bonfire-pushed.sqlite` dedup guard | ❌ NOT BUILT (doc 620 planned) — script creates it if missing |

No new secrets needed. Runs locally on Pi or dev machine.

---

## Part 1: Farcaster Historical Backfill

### Channels to backfill

| Channel | Neynar channel_id | Notes |
|---------|-------------------|-------|
| /wavewarz | `wavewarz` | All battle results, community discussion |
| /zabal | `zabal` | Curriculum, drops, member casts |
| /zao | `zao` | General ZAO community |

### FID mentions to backfill

Pull all historical mentions of ZAO FIDs from Neynar notifications endpoint:

| FID | Handle | Notes |
|-----|--------|-------|
| [ZAAL_FID] | @bettercallzaal | Main ZAO account |
| [ZOLBOT_FID] | @zolbot | FID 3338501 |
| [ZAODEVZ_FID] | @zaodevz | Dev account |

### Neynar Pagination Pattern

Neynar returns paginated results with a `cursor`. Each page is 100 casts. At ZAO's channel scale (~18 months, ~3 channels, ~10-30 casts/day), expect 5,000–15,000 total casts before filtering. After the quality filter (below), expect 500–1,500 episodes to push to Bonfire.

```typescript
// src/lib/backfill/farcaster-backfill.ts

interface NeynarFeedResponse {
  casts: NeynarCast[];
  next?: { cursor: string };
}

async function pullChannelHistory(channelId: string): Promise<NeynarCast[]> {
  const all: NeynarCast[] = [];
  let cursor: string | undefined;
  
  do {
    const url = new URL('https://api.neynar.com/v2/farcaster/feed/channels');
    url.searchParams.set('channel_ids', channelId);
    url.searchParams.set('limit', '100');
    url.searchParams.set('with_recasts', 'false');
    if (cursor) url.searchParams.set('cursor', cursor);
    
    const res = await fetch(url.toString(), {
      headers: { 'api_key': process.env.NEYNAR_API_KEY! },
    });
    
    if (!res.ok) {
      console.error(`Neynar error ${res.status} for channel ${channelId}`);
      break;
    }
    
    const data: NeynarFeedResponse = await res.json();
    all.push(...data.casts);
    cursor = data.next?.cursor;
    
    // Rate limit: Neynar free tier is 100 req/min. Add delay every 100 requests.
    if (all.length % 1000 === 0) {
      console.log(`  ${channelId}: ${all.length} casts fetched, continuing...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  } while (cursor);
  
  return all;
}
```

### Quality Filter (Same as doc 1603)

Only push a cast to Bonfire if it meets at least one criterion:
1. Engagement score ≥ 5 (`recasts × 3 + likes × 1 + replies × 2`)
2. Contains ZAO keyword: `wavewarz | zabal | zaostock | zor token | fractal democracy | africa battle week | zaos | dream loop | dreamloop | zolbot`
3. Cast author is a ZAO team FID (list in `src/lib/wavewarz/constants.ts`)
4. Is a direct reply to a ZAO team cast

**Expected pass rate:** ~15–25% of channel casts. At 15,000 total: ~2,000–3,000 Bonfire episodes.

```typescript
const ZAO_KEYWORDS = /wavewarz|zabal|zaostock|zor token|fractal democracy|africa battle week|zaos|dream ?loop|zolbot/i;
const ZAO_FIDS = new Set([/* ZAAL_FID, ZOLBOT_FID, ZAODEVZ_FID, Hurricane FID */]);

function shouldIngest(cast: NeynarCast): boolean {
  const score = (cast.reactions?.recasts_count ?? 0) * 3
    + (cast.reactions?.likes_count ?? 0)
    + (cast.replies?.count ?? 0) * 2;
  
  if (score >= 5) return true;
  if (ZAO_KEYWORDS.test(cast.text)) return true;
  if (ZAO_FIDS.has(cast.author.fid)) return true;
  return false;
}
```

### Dedup Guard (SQLite)

Before pushing to Bonfire, check a local SQLite store so a second run of this script never re-pushes the same cast.

```typescript
// ~/.zao/zoe/bonfire-pushed.sqlite — created if missing
// Table: CREATE TABLE IF NOT EXISTS pushed (name TEXT PRIMARY KEY, pushed_at TEXT)

async function alreadyPushed(db: Database, name: string): Promise<boolean> {
  const row = db.prepare('SELECT 1 FROM pushed WHERE name = ?').get(name);
  return !!row;
}

async function markPushed(db: Database, name: string): Promise<void> {
  db.prepare('INSERT OR IGNORE INTO pushed (name, pushed_at) VALUES (?, ?)').run(name, new Date().toISOString());
}
```

### Episode Format

```typescript
function castToEpisode(cast: NeynarCast, channelId: string): BonfireEpisode {
  const score = (cast.reactions?.recasts_count ?? 0) * 3
    + (cast.reactions?.likes_count ?? 0)
    + (cast.replies?.count ?? 0) * 2;
  
  return {
    name: `farcaster:cast:${cast.hash}`,
    episode_body: `On ${cast.timestamp.slice(0, 10)}, @${cast.author.username} cast in /${channelId}: "${cast.text}". Engagement score: ${score} (recasts: ${cast.reactions?.recasts_count ?? 0}, likes: ${cast.reactions?.likes_count ?? 0}, replies: ${cast.replies?.count ?? 0}). Cast hash: ${cast.hash}. Author FID: ${cast.author.fid}. Tags: ${channelId}, zao-farcaster-backfill.`,
    source_tag: 'farcaster-backfill',
  };
}
```

### Batch Push to Bonfire

Push in batches of 20 episodes to avoid hitting Bonfire's per-request limits. Each batch is one POST to `/knowledge_graph/episode/create`.

**Note:** The Bonfire `/knowledge_graph/episode/create` endpoint accepts a single episode body (not an array). The existing `/bonfire` skill wraps this — see `~/.claude/skills/bonfire/scripts/bonfire-post.sh`. For batch posting, iterate and call POST once per episode, or check if Bonfire has added bulk support.

```typescript
async function pushEpisodeBatch(episodes: BonfireEpisode[]): Promise<void> {
  for (const ep of episodes) {
    const res = await fetch('https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BONFIRE_API_KEY}`,
      },
      body: JSON.stringify({
        bonfire_id: process.env.BONFIRE_ID,
        name: ep.name,
        episode_body: ep.episode_body,
      }),
    });
    
    if (!res.ok) {
      console.error(`Bonfire FAIL: ${ep.name} — ${res.status}`);
    }
    
    // ~300ms pause to be polite to Bonfire API
    await new Promise(r => setTimeout(r, 300));
  }
}
```

---

## Part 2: Paragraph ZABAL Updates Backfill

### What to Pull

ZABAL Updates is published on Paragraph.xyz at `@bettercallzaal`. Each issue is a standalone article. We want every issue as a Bonfire episode so ZOE can recall "what was in ZABAL Update #3?" without re-fetching from Paragraph.

**Paragraph API options:**
1. **RSS feed:** `https://paragraph.xyz/@bettercallzaal/feed` — simplest, no auth needed, returns all published posts
2. **Paragraph API:** `GET /api/publications/{slug}/posts` — requires API key but returns richer metadata

Recommendation: Use the RSS feed. It's stable, no auth, and returns title + body + date for each issue.

### RSS Pull and Parse

```typescript
import { XMLParser } from 'fast-xml-parser';

async function pullParagraphHistory(rssUrl: string): Promise<ParagraphPost[]> {
  const res = await fetch(rssUrl);
  const xml = await res.text();
  
  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(xml);
  const items = feed.rss?.channel?.item ?? [];
  
  return (Array.isArray(items) ? items : [items]).map((item: any) => ({
    title: item.title,
    pubDate: item.pubDate,
    link: item.link,
    // RSS description may be HTML — strip tags for Bonfire prose
    body: item.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? '',
  }));
}
```

### Paragraph Episode Format

```typescript
function paragraphToEpisode(post: ParagraphPost): BonfireEpisode {
  const dateStr = new Date(post.pubDate).toISOString().slice(0, 10);
  const slug = post.link.split('/').pop() ?? post.title.toLowerCase().replace(/\s+/g, '-');
  
  return {
    name: `paragraph:zabal-update:${slug}`,
    episode_body: `ZABAL Updates — "${post.title}" (published ${dateStr} on Paragraph.xyz). ${post.body.slice(0, 1500)}${post.body.length > 1500 ? '...' : ''} Source: ${post.link}. Tags: zabal-updates, zao-newsletter, paragraph-backfill.`,
    source_tag: 'paragraph-backfill',
  };
}
```

**Body truncation:** Bonfire episode bodies should be under ~2,000 characters for clean graph extraction. The RSS description is typically the first 300–500 words of the article; if it exceeds 1,500 characters, truncate with `...` and include the source link so ZOE can retrieve the full post.

---

## Full Backfill Script (Entry Point)

```typescript
// scripts/bonfire-backfill.ts
// Run: npx ts-node scripts/bonfire-backfill.ts
// Env: NEYNAR_API_KEY, BONFIRE_API_KEY, BONFIRE_ID

import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.zao/zoe/bonfire-pushed.sqlite');
const PARAGRAPH_RSS = 'https://paragraph.xyz/@bettercallzaal/feed';
const CHANNELS = ['wavewarz', 'zabal', 'zao'];

async function main() {
  const db = new Database(DB_PATH);
  db.exec('CREATE TABLE IF NOT EXISTS pushed (name TEXT PRIMARY KEY, pushed_at TEXT)');
  
  let totalPushed = 0;
  let totalSkipped = 0;

  // Part 1: Farcaster channels
  for (const channel of CHANNELS) {
    console.log(`\n=== Farcaster channel: /${channel} ===`);
    const casts = await pullChannelHistory(channel);
    console.log(`  Fetched ${casts.length} casts`);
    
    const filtered = casts.filter(shouldIngest);
    console.log(`  After filter: ${filtered.length} casts`);
    
    for (const cast of filtered) {
      const ep = castToEpisode(cast, channel);
      if (await alreadyPushed(db, ep.name)) {
        totalSkipped++;
        continue;
      }
      await pushEpisodeBatch([ep]);
      markPushed(db, ep.name);
      totalPushed++;
    }
  }

  // Part 2: Paragraph ZABAL Updates
  console.log('\n=== Paragraph: ZABAL Updates ===');
  const posts = await pullParagraphHistory(PARAGRAPH_RSS);
  console.log(`  Fetched ${posts.length} newsletter issues`);
  
  for (const post of posts) {
    const ep = paragraphToEpisode(post);
    if (await alreadyPushed(db, ep.name)) {
      totalSkipped++;
      continue;
    }
    await pushEpisodeBatch([ep]);
    markPushed(db, ep.name);
    totalPushed++;
  }

  console.log(`\nBackfill complete: ${totalPushed} pushed, ${totalSkipped} skipped (already in Bonfire).`);
  db.close();
}

main().catch(console.error);
```

---

## Dependencies

```json
{
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "fast-xml-parser": "^4.3.5"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8"
  }
}
```

Both are already in many ZAO monorepo services — check before adding. `fast-xml-parser` is commonly used in Next.js apps for RSS.

---

## Estimated Episode Counts and Run Time

| Source | Raw | After filter | Bonfire posts | Est. time @ 300ms/post |
|--------|-----|-------------|---------------|------------------------|
| /wavewarz (18mo) | 4,000–6,000 | 800–1,200 | 800–1,200 | 4–6 min |
| /zabal (18mo) | 3,000–5,000 | 600–1,000 | 600–1,000 | 3–5 min |
| /zao (18mo) | 2,000–4,000 | 400–800 | 400–800 | 2–4 min |
| Paragraph issues | 10–30 | 10–30 (all) | 10–30 | <1 min |
| **Total** | **~15,000** | **~2,000** | **~2,000** | **~15–20 min** |

Neynar fetch (paginated, 100/page) adds ~5–10 min of API calls. Total run: **~25–30 minutes**.

---

## Post-Run Verification

After the script completes, check Bonfire via the admin dashboard at `zabal.bonfires.ai`:
1. Episode count should have increased by ~2,000
2. Sample 3-5 episodes and verify body prose is readable
3. Check `~/.zao/zoe/bonfire-pushed.sqlite` row count matches pushed count

**Run the script a second time immediately** to confirm zero new episodes are pushed (dedup guard test). If any are pushed again, the SQLite write is failing.

---

## Handoff: After Backfill Completes

Once this one-time backfill is done:
1. Switch on the **doc 1603 ongoing Farcaster ingest** — the new cron loop in ZOL that catches casts going forward
2. The Paragraph ongoing ingest is handled by **ZOE + doc 1574** newsletter workflow (ZOE adds each new issue as a Bonfire episode after publish)
3. Archive this script to `scripts/archive/bonfire-backfill-2026-07.ts` — never needs to run again

---

## Sources

- `research/agents/1603-farcaster-x-ingest-pipeline/` — ongoing Farcaster ingest spec (post-backfill pipeline)
- `research/agents/600-agentic-stack-coordination-v1/` — board task #17 origin
- `research/agents/620-bonfire-push-everything/` — `bonfire-pushed.sqlite` dedup guard design
- `research/agents/665-bonfires-deep-dive-zao-integration/` — Bonfire API reference
- `research/technology/1574-zao-newsletter-paragraph-zoe-integration/` — ZABAL Updates newsletter ops (Paragraph.xyz)
- `research/technology/1563-neynar-api-zol-music-scout-capabilities/` — Neynar endpoint reference + ZAO FIDs
- Neynar docs: `https://docs.neynar.com/reference/fetch-feed-for-channels`
