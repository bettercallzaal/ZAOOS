---
topic: farcaster, technology, ZOL
type: research-guide
status: ACTIONABLE — API endpoints verified; implement after ZOL PRs #26-#39 merge
last-validated: 2026-07-18
related-docs: 993-zol-farcaster-agent-upgrade-plan, 1515-zol-neynar-learning-expansion, 1512-zol-dreamloops-activation-record
board-tasks: None (research supporting ZOL music-scout + weekly-curator DreamLoops)
action-owner: ZOL maintainer (implement handlers after v2 PRs land)
---

# 1563 — Neynar API Capabilities for ZOL Music-Scout and Curator DreamLoops

> **What this is:** A concrete API reference for the Neynar endpoints ZOL's three music loops need. Doc 993 covers the broad Neynar upgrade strategy; doc 1515 covers the learning scripts. This doc maps specific endpoints to specific ZOL DreamLoops — with exact request shapes, response fields, and integration notes. Ready to copy into handler code after ZOL v2 PRs land.

---

## The Three Music Loops That Need Neynar

| DreamLoop | File | What it does | Key Neynar need |
|-----------|------|-------------|-----------------|
| `weekly-curator-v1` | `loops/weekly-curator-v1.json` | Surfaces the top 5 casts from /wavewarz each week by engagement | Channel feed + engagement scoring |
| `artist-spotlight-v1` | `loops/artist-spotlight-v1.json` | Profiles one ZAO artist weekly — cast history, follower count, cast reach | FID enrichment + cast history |
| `music-scout` | `loops/music-scout.json` (planned) | Finds new music-adjacent builders on Farcaster posting in /wavewarz, /zabal, /music | Channel search + bulk FID hydration |

All three are gated on ZOL PRs #26–#39 (v2 agent-gateway). They share handler infrastructure with the Keystone 3 intent bridge (doc 1545).

---

## Capability 1 — Channel Casts with Engagement Scores

**Used by:** `weekly-curator-v1`, `music-scout`

**Problem:** ZOL needs the top casts from /wavewarz by engagement (likes + recasts + replies) for the weekly curation post. The free Haatz mirror and self-hosted Hypersnap return casts but not pre-computed engagement scores.

### Endpoint

```
GET https://api.neynar.com/v2/farcaster/feed/channels
```

### Request

```javascript
const resp = await fetch(
  'https://api.neynar.com/v2/farcaster/feed/channels?' + new URLSearchParams({
    channel_ids: 'wavewarz,zabal,music',
    with_recasts: 'false',
    limit: '50',
    cursor: '',
  }),
  { headers: { api_key: process.env.NEYNAR_API_KEY } }
);
const { casts, next } = await resp.json();
```

### Key Response Fields

```json
{
  "casts": [
    {
      "hash": "0xabc...",
      "text": "...",
      "author": {
        "fid": 12345,
        "username": "artist.eth",
        "display_name": "DJ Artist",
        "follower_count": 800,
        "following_count": 120,
        "power_badge": true
      },
      "reactions": {
        "likes_count": 42,
        "recasts_count": 15
      },
      "replies": {
        "count": 7
      },
      "timestamp": "2026-07-18T14:32:00.000Z",
      "channel": { "id": "wavewarz", "name": "wavewarz" }
    }
  ],
  "next": { "cursor": "..." }
}
```

### ZOL Integration: weekly-curator-v1

```javascript
// In the weekly-curator-v1 DreamLoop handler:
async function scoreAndRankCasts(casts) {
  return casts
    .map(c => ({
      hash: c.hash,
      text: c.text,
      author: c.author.username,
      fid: c.author.fid,
      // Weighted engagement: recast=3 (per OpenRank), like=1, reply=2
      score: c.reactions.recasts_count * 3 + c.reactions.likes_count + c.replies.count * 2,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

**Free-tier note:** Each call counts as 1 request against the 100/day limit. Weekly curator runs 1×/week so this is negligible. Use cursor pagination only if >50 casts/week in /wavewarz (currently well below).

---

## Capability 2 — Cast Search for Artist Context

**Used by:** `artist-spotlight-v1`, `music-scout`

**Problem:** When ZOL profiles a ZAO artist, it needs their recent cast history — not just the /wavewarz channel, but all Farcaster activity. The learning scripts do keyword search; artist-spotlight needs FID-specific cast lookup.

### Endpoint

```
GET https://api.neynar.com/v2/farcaster/casts
```

### Request (casts by FID)

```javascript
const resp = await fetch(
  'https://api.neynar.com/v2/farcaster/casts?' + new URLSearchParams({
    fid: String(targetFid),
    limit: '25',
  }),
  { headers: { api_key: process.env.NEYNAR_API_KEY } }
);
const { casts } = await resp.json();
```

### ZOL Integration: artist-spotlight-v1

```javascript
async function buildArtistProfile(fid) {
  const casts = await fetchCastsByFid(fid, limit=25);
  // Count music-relevant casts (text contains wavewarz/zabal/music/beat/track)
  const musicCasts = casts.filter(c =>
    /wavewarz|zabal|music|beat|track|produced|mixtape/i.test(c.text)
  );
  return {
    fid,
    recentMusicCasts: musicCasts.length,
    topCastText: casts[0]?.text ?? '',
    castReach: casts.reduce((sum, c) => sum + c.reactions.recasts_count * 3 + c.reactions.likes_count, 0),
  };
}
```

**Linked from doc 1515:** `zol-learn-zaal.js` already does a simplified version of this for Zaal's FID (19640). Artist-spotlight uses the same pattern for any FID.

---

## Capability 3 — Bulk FID Hydration

**Used by:** `music-scout`

**Problem:** The music-scout loop finds FIDs who posted in /wavewarz or /zabal this week. It needs to enrich 10–30 FIDs at once to filter for "real music builders" (follower count, bio keywords, power badge). Looping individual FID lookups burns 10–30 API calls/run.

### Endpoint (bulk users)

```
GET https://api.neynar.com/v2/farcaster/user/bulk
```

### Request

```javascript
const fids = [12345, 67890, 11111]; // collect from channel cast scan
const resp = await fetch(
  'https://api.neynar.com/v2/farcaster/user/bulk?' + new URLSearchParams({
    fids: fids.join(','),
  }),
  { headers: { api_key: process.env.NEYNAR_API_KEY } }
);
const { users } = await resp.json();
```

### Response (per user)

```json
{
  "users": [
    {
      "fid": 12345,
      "username": "artist.eth",
      "display_name": "DJ Artist",
      "profile": { "bio": { "text": "Producer | Rapper | /wavewarz" } },
      "follower_count": 800,
      "power_badge": true,
      "verified_addresses": { "eth_addresses": ["0x..."] }
    }
  ]
}
```

### ZOL Integration: music-scout

```javascript
async function filterMusicBuilders(fids) {
  const { users } = await bulkHydrateFids(fids);
  return users.filter(u => {
    const bio = u.profile?.bio?.text?.toLowerCase() ?? '';
    const hasMusicBio = /music|producer|rapper|singer|dj|beat|artist/i.test(bio);
    const hasMinFollowers = u.follower_count >= 50; // filter bots
    return hasMusicBio || hasMinFollowers;
  });
}
```

**Cost:** 1 API call for up to 100 FIDs. At 100/day free tier: scan 10,000 FIDs/day in batches of 100.

---

## Capability 4 — Neynar Managed Signers

**Used by:** All ZOL posting (future upgrade path)

**What it is:** Instead of ZOL holding a self-custodied Ed25519 private key on the Pi, Neynar stores the key and exposes a signer UUID. ZOL calls `POST /v2/farcaster/cast` with `signer_uuid` — Neynar signs and relays. The private key never touches Pi storage.

**Current ZOL approach (doc 910):** Self-custodied signer — Ed25519 key generated on Pi, key stored in `/home/zaal/.zao/private/zol.env`. Writes go direct-to-Farcaster-hub via x402 (~$0.01/cast).

**Trade-off comparison:**

| | Self-custodied (current) | Neynar Managed Signer |
|---|---|---|
| Key storage | Pi env file | Neynar's custody |
| Cost per cast | ~$0.01 USDC (x402) | Neynar API plan |
| Pi requirement | Requires env file on Pi | Only UUID on Pi |
| Key rotation | Manual | Dashboard button |
| Rate limit | Hub limit | Neynar plan tier |
| Free-tier | Yes (x402) | No (Neynar Pro) |

**Recommendation for v2:** Keep self-custodied for all posting. The x402 cost model is better for ZOL's volume (2-5 casts/day). Managed signers become relevant if ZOL ever scales to 50+ casts/day or key rotation becomes operationally painful.

**If switching in future:** Register signer via Neynar dashboard → get `signer_uuid` → store as env var → swap `publishCast()` call from direct-hub to:

```javascript
await fetch('https://api.neynar.com/v2/farcaster/cast', {
  method: 'POST',
  headers: { api_key: NEYNAR_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ signer_uuid: NEYNAR_SIGNER_UUID, text, channel_id }),
});
```

---

## Capability 5 — Channel Webhooks (When Pi Moves to VPS)

**Used by:** Real-time /wavewarz monitoring

**Current approach:** ZOL polls /wavewarz mentions every 60s (established in doc 891). Pi is behind NAT — webhooks require a public endpoint.

**When webhooks become viable:** Once ZOL consolidates to the fleet VPS (CloudFlare Tunnel or reverse proxy established). Neynar webhook setup:

```bash
# Register via Neynar dashboard or API:
POST https://api.neynar.com/v2/farcaster/webhook
{
  "name": "zolbot-wavewarz-monitor",
  "url": "https://zolbot.zao.xyz/webhook/farcaster",
  "subscription": {
    "cast.created": {
      "channel_id": "wavewarz"
    }
  }
}
```

**Events ZOL would receive:**
- `cast.created` — new cast in /wavewarz → immediate music-scout trigger
- `cast.created` with `mentioned_fids` containing 3338501 — @zolbot mention → immediate reply trigger (cuts 60s latency to <1s)

**Idempotency guard (already needed):** Neynar can fire duplicate events within 100ms. ZOL must deduplicate by `cast.hash` using a 5-min in-memory seen-set or Redis.

**Fallback:** Keep polling as backup. If webhook fails, 60s polling catches it.

---

## Implementation Priority for DreamLoop Maintainer

After ZOL v2 PRs (#26-#39) merge:

| Order | Work item | Estimated time | Impact |
|-------|-----------|---------------|--------|
| 1 | Add `NEYNAR_API_KEY` to Pi env (`/home/zaal/.zao/private/zol.env`) | 5 min | Unlocks all 3 loops |
| 2 | `weekly-curator-v1`: add channel feed call + engagement scorer | 1 hour | Weekly curation post |
| 3 | `artist-spotlight-v1`: add FID cast history + profile builder | 1.5 hours | Weekly artist profile |
| 4 | `music-scout`: add channel scan + bulk FID hydration + filter | 2 hours | New member discovery |
| 5 | Webhook registration (after VPS move) | 30 min | Latency improvement |

**Free-tier math:** 100 calls/day. Weekly curator (1/week) + artist spotlight (1/week) + music scout (daily, ~3 calls/run) = ~25 calls/day. Well within free tier. No Neynar upgrade needed.

---

## Neynar API Key Setup (for Zaal)

ZOL already has a Neynar account (used for self-custodied signer registration per doc 910). The same account's API key works for all endpoints above.

1. Log in at neynar.com
2. Settings → API Keys → copy the key
3. On Pi: `echo 'export NEYNAR_API_KEY=<key>' >> ~/.zao/private/zol.env`
4. Restart ZOL process to pick up the env var

The free tier (100 req/day) covers all three loops at current ZOL activity levels.

---

## Sources

- Neynar API reference: docs.neynar.com (verified Jul 2026)
- ZAOOS doc 993 (ZOL Farcaster upgrade strategy — broad context)
- ZAOOS doc 1515 (ZOL learning scripts + Neynar search term expansion)
- ZAOOS doc 891 (polling vs webhook decision rationale — Pi NAT constraint)
- ZAOOS doc 910 (self-custodied signer setup)
- ZAOOS doc 1512 (ZOL DreamLoops activation record + Pi checklist)
- ZOL loops directory: `loops/weekly-curator-v1.json`, `loops/artist-spotlight-v1.json`
