---
topic: farcaster, agents, technology
type: implementation-spec
status: SPEC READY — implement after ZOL PR #61 merges (activates DreamLoops); 2 PR build scope
last-validated: 2026-07-20
related-docs: 1563-neynar-api-zol-music-scout-capabilities, 1572-wavewarz-zabal-farcaster-channel-growth-playbook, 1512-zol-dreamloops-weekly-curator-artist-spotlight, 761-hypersnap-farcaster-node, 1563
board-tasks: "[build] ZOL → post casts into /zabal Farcaster channel"
action-owner: Developer (ZOL PR, bot/src); Zaal (merge PR #61 first)
---

# 1607 — ZOL /zabal Channel Auto-Post: DreamLoop Implementation Spec

> **What this is:** Full implementation spec for "[build] ZOL → post casts into /zabal Farcaster channel." ZOL currently monitors /zabal (reads) but never posts INTO /zabal (writes). This spec adds a new `zabal-channel-post-v1` DreamLoop that makes ZOL an active participant in the /zabal channel — posting battle highlights, weekly recaps, and artist spotlights directly into the channel feed.

---

## Why ZOL Needs to Post in /zabal

From doc 1572 (channel growth playbook), /zabal has 32 followers today with a target of 150 by Sep 26. The playbook's "Group A (ZOL automated)" actions are:
- Battle result announcements in /zabal
- Weekly Monday thread
- ZABAL winner spotlights

None of these happen automatically yet. ZOL monitoring the channel ≠ ZOL posting in the channel. This spec closes that gap.

**Current state:** ZOL reads from /zabal via `readV2` (Hypersnap node). No writes to /zabal.
**Target state:** ZOL posts 3 types of content into /zabal automatically, human-gated (draft → Zaal approves → ZOL posts).

---

## Three Content Types for /zabal

### Type 1: Battle Result Announcement

**Trigger:** After each WaveWarZ battle result is recorded (scraped from wavewarz-intelligence.vercel.app OR Helius webhook)
**Frequency:** 1-2x/week (after each battle)
**Draft goes to:** `~/zol/drafts/zabal-battle-result-<date>.txt`

**Template:**
```
WaveWarZ result from [date]:

[Artist A] vs [Artist B]
→ [Winner] wins. Both artists earned.

[Winner] earned [X] SOL. [Loser] earned [Y] SOL.

More about WaveWarZ: wavewarz.info
```

**Channel:** `/zabal` (channel_id: "zabal")
**Hashtags:** None — /zabal channel voice is direct, not hashtag-heavy.

**ZOL handler:** `src/handlers/zabal-battle-result.js` (new)

---

### Type 2: Weekly /zabal Monday Thread

**Trigger:** Monday 9am ET, weekly
**Frequency:** 1x/week
**Draft goes to:** `~/zol/drafts/zabal-monday-<week>.txt`

**Template:**
```
Week [N] in /zabal.

This week on WaveWarZ: [battle recap, 1 sentence]
Top /zabal cast this week: @[handle] — "[cast preview]"
ZABAL earned by [top earner]: [X] ZABAL

What's coming: [next battle or event, 1 sentence]

→ wavewarz.info
```

**ZOL handler:** `src/handlers/zabal-weekly-thread.js` (new)
**Data sources:**
- Battle results: `wwtracker` scraper (doc 1520) or Helius API
- Top /zabal cast: ZOL's channel monitoring state (recent-casts.json — top by engagement score)
- ZABAL earned: ZABAL distribution logs (or manual input from Zaal)

---

### Type 3: Artist Spotlight Cross-Post

**Trigger:** When artist-spotlight-v1 loop produces a draft (doc 1512), ALSO post into /zabal
**Frequency:** 1x/week (same as artist-spotlight-v1)
**Draft goes to:** existing `~/zol/drafts/artist-spotlight-<artist>.txt` (same draft, tagged for dual-channel)

**Template:** (same as artist-spotlight-v1, with /zabal-specific tag)
```
artist spotlight: [Artist Name]

[Artist handle] has battled on WaveWarZ [N] times. [One sentence bio or highlight].

Their best cast this week: "[cast preview]"

→ Follow [Artist handle] on Farcaster for more
```

**Cross-post logic:** artist-spotlight-v1 already posts to the artist's native channel + Zaal's feed. This adds `/zabal` as a second channel for the same cast. One approval → two channel posts.

---

## Technical Implementation

### Part 1: Channel Write Support in write.ts

Current `publishCast` in `bot/src/zoe/farcaster/write.ts` doesn't support channel posts. Need to add `parentUrl` parameter for Farcaster channel targeting.

**Option A: Hub-nodejs approach (existing signing path)**

The Farcaster protocol sets the channel via `parentUrl` in the CastAdd message:

```typescript
// Extended CastInput interface
export interface CastInput {
  text: string;
  parent?: { fid: number; hash: `0x${string}` };
  channelId?: string;  // NEW: e.g. "zabal", "wavewarz"
}

// In publishCast():
const parentUrl = input.channelId
  ? `https://warpcast.com/~/channel/${input.channelId}`
  : undefined;
```

The `makeCastAdd` from `@farcaster/hub-nodejs` accepts `parentUrl` as a field in the CastAddBody. Pass it in the message construction.

**Option B: Neynar API approach (simpler)**

If ZOL has a Neynar signer UUID (`NEYNAR_SIGNER_UUID`), use:

```http
POST https://api.neynar.com/v2/farcaster/cast
x-api-key: <NEYNAR_API_KEY>
Content-Type: application/json

{
  "signer_uuid": "<NEYNAR_SIGNER_UUID>",
  "text": "<cast text>",
  "channel_id": "zabal"
}
```

**Recommendation: Option B (Neynar API).** Simpler than modifying hub-nodejs CastAdd construction. ZOL already has `NEYNAR_API_KEY` for reading (doc 1563). Need to also set `NEYNAR_SIGNER_UUID` from the ZOL Farcaster account.

**New file: `bot/src/zol/channel-cast.ts`** (or extend `bot/src/zoe/farcaster/write.ts`)

```typescript
export async function castToChannel(
  text: string,
  channelId: string
): Promise<{ hash: string; url: string }> {
  const signerUuid = process.env.NEYNAR_SIGNER_UUID;
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!signerUuid || !apiKey) throw new Error('NEYNAR_SIGNER_UUID or NEYNAR_API_KEY not set');

  const res = await fetch('https://api.neynar.com/v2/farcaster/cast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ signer_uuid: signerUuid, text, channel_id: channelId }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Neynar cast failed: ${res.status} ${err}`);
  }
  const data = await res.json() as { cast: { hash: string } };
  return {
    hash: data.cast.hash,
    url: `https://warpcast.com/~/channel/${channelId}`
  };
}
```

### Part 2: New DreamLoops

**New manifest: `loops/zabal-battle-result-v1.manifest.json`**

```json
{
  "name": "zabal-battle-result-v1",
  "version": "1.0.0",
  "description": "Post WaveWarZ battle results into the /zabal Farcaster channel",
  "status": "active_local",
  "trigger": "on_battle_result",
  "output": "draft",
  "channel": "zabal",
  "steps": [
    { "id": "fetch-battle-result", "type": "data-fetch", "source": "wwtracker" },
    { "id": "check-already-posted", "type": "dedup", "key": "battle:<battle_id>" },
    { "id": "draft-battle-cast", "type": "template", "template": "zabal-battle-result" },
    { "id": "stage-for-approval", "type": "draft-output", "dir": "~/zol/drafts/" }
  ]
}
```

**New manifest: `loops/zabal-weekly-thread-v1.manifest.json`**

```json
{
  "name": "zabal-weekly-thread-v1",
  "version": "1.0.0",
  "description": "Weekly Monday thread in /zabal with battle recap + top cast",
  "status": "active_local",
  "trigger": "weekly:monday:09:00:ET",
  "output": "draft",
  "channel": "zabal",
  "cooldown": "7d",
  "steps": [
    { "id": "check-week-already-done", "type": "cooldown-check", "key": "zabal-weekly" },
    { "id": "fetch-week-battles", "type": "data-fetch", "source": "wwtracker", "range": "7d" },
    { "id": "fetch-top-zabal-cast", "type": "data-fetch", "source": "neynar-channel", "channel_id": "zabal", "limit": 25 },
    { "id": "draft-weekly-thread", "type": "template", "template": "zabal-weekly-thread" },
    { "id": "stage-for-approval", "type": "draft-output", "dir": "~/zol/drafts/" }
  ]
}
```

### Part 3: Approval → Auto-Post

Zaal approves a draft via ZOE Telegram (`/approve zabal-battle-result-2026-07-22`). ZOE calls `castToChannel(draftText, "zabal")`. The cast appears in /zabal channel.

**This is the same approval model as artist-spotlight-v1 and weekly-curator-v1 (doc 1512).** No new UI needed — ZOE already has the draft-review Telegram flow.

---

## Required Environment Variables

| Variable | Where Set | What |
|----------|-----------|------|
| `NEYNAR_API_KEY` | Pi `.zao/private/zol.env` | Already set (doc 1563) |
| `NEYNAR_SIGNER_UUID` | Pi `.zao/private/zol.env` | NEW — ZOL's Neynar managed signer UUID |
| `DREAMLOOPS_ENABLED` | Pi `.zao/private/zol.env` | Set to `1` after PR #61 merges |

**Getting `NEYNAR_SIGNER_UUID`:** 
1. Go to `dev.neynar.com` → Signers
2. Find ZOL's signer (`@zolbot`, FID 3338501) or create a new managed signer
3. Copy the UUID → add to zol.env

If ZOL already uses its own Farcaster signer (Ed25519 key in signer.ts), the existing key works for Option A (hub-nodejs). The Neynar managed signer UUID is only needed for Option B.

---

## Gate: ZOL PR #61

These loops **depend on `DREAMLOOPS_ENABLED=1`**, which is gated on:
1. ZOL PR #61 merging (feat/activate-weekly-curator-artist-spotlight)
2. Zaal running dry-runs on Pi + setting the env flag

Per doc 1512, PR #61 is the master DreamLoops unlock. These new loops add to the same system once PR #61 is merged.

**Build order:**
1. Merge ZOL PR #61 (Zaal)
2. PR A: Add `castToChannel()` to bot/src (50 lines, 1-2h)
3. PR B: Add `zabal-battle-result-v1` + `zabal-weekly-thread-v1` manifests + handlers (2-3h)

---

## Growth Impact

From doc 1572 channel growth targets:
- /zabal: 32 → 150 followers by Sep 26
- ZOL automation is "Group A" (highest leverage, zero manual effort after setup)

**What these 3 loop types drive:**
- Battle result casts: 1-2x/week → /zabal appears in followers' feeds (direct follower growth)
- Weekly thread: Every Monday ZOL is active in /zabal → signals channel is live → Warpcast recommends it
- Artist spotlights in /zabal: Tagged artists follow back (doc 1572 cross-mention mechanic)

**Conservative estimate:** 3-5 new /zabal followers per week from ZOL automated posts alone.
At 16 weeks (Jul 20 → Nov 8): +48-80 followers from automation.
Target 150 by Sep 26 (9 weeks): needs +118 followers → automation contributes ~27-45 of that.
Remainder comes from Zaal's manual Group B + event Group C (ZAOville, Africa Battle Week, ZAOstock).

---

## PR Scope (2 PRs)

**PR A: `zol/feat/channel-cast-client` (1-2h)**
- `bot/src/zol/channel-cast.ts` — `castToChannel()` using Neynar API
- Unit tests: mock Neynar response, test text length guard, test channel_id pass-through
- Update `.env.example`: add `NEYNAR_SIGNER_UUID=`

**PR B: `zol/feat/zabal-channel-loops` (2-3h)**
- `loops/zabal-battle-result-v1.manifest.json`
- `loops/zabal-weekly-thread-v1.manifest.json`
- `src/handlers/zabal-battle-result.js`
- `src/handlers/zabal-weekly-thread.js`
- `scripts/dl-dry-run-zabal-battle-result.js`
- `scripts/dl-dry-run-zabal-weekly-thread.js`
- Register both in `scripts/dl-run.js` scheduledLoops array
- Update ZOE Telegram approval flow to handle `zabal-*` draft prefixes

**Total:** 3-5 hours development. No infra changes. Runs on existing Pi systemd.

---

## Sources

- Board task: "[build] ZOL → post casts into /zabal Farcaster channel"
- Doc 1572: /wavewarz + /zabal channel growth playbook (Group A ZOL automations, follower targets)
- Doc 1563: Neynar API for ZOL (API key already set, free tier, channel feed endpoints)
- Doc 1512: ZOL DreamLoops activation (PR #61, DreamLoop architecture, draft approval flow)
- Doc 761: Hypersnap Farcaster node (read path; write goes through Neynar or direct hub)
- `bot/src/zoe/farcaster/write.ts`: existing `publishCast()` — extend or mirror for channel cast
- Neynar v2 API: `POST /v2/farcaster/cast` with `channel_id` field
- `@zolbot` FID: 3338501
