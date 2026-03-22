# WaveWarZ Social Publisher for ZAO OS

**Date:** March 21, 2026
**Status:** Approved (v2 — governance-gated)
**Goal:** Make ZAO OS the Farcaster publishing hub for WaveWarZ — sync battle data, generate proposals for battle results/spotlights/leaderboards/reminders, let ZAO members vote on them, and publish approved proposals via WaveWarZ's signer UUID to the /wavewarz Farcaster channel.

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Publishing model | Governance-gated proposals (NOT auto-post) — content is proposed, voted on, then published when threshold is reached |
| Publisher account | WaveWarZ's Farcaster signer UUID |
| Channel | `/wavewarz` Farcaster channel |
| Proposal categories | Add `wavewarz` and `social` to existing proposal categories |
| Respect threshold | 1000 (same as existing governance publishing) |
| Cron schedule | Daily 6:00 PM EST — sync data + generate draft proposals |
| Manual proposals | Any ZAO member can create wavewarz or social proposals |
| Data source | Scrape WaveWarZ Intelligence artist pages nightly |
| Tone | No emojis in generated proposal text |

---

## Architecture

### How It Works

The existing proposal system already supports governance-gated Farcaster publishing (proposals with `publish_text` get cast when approved + threshold met). We extend this:

1. **Cron syncs battle data** at 6 PM EST daily
2. **Cron generates proposals** for new battles, spotlights, leaderboard, session reminders — these land in the governance tab as `wavewarz` category proposals
3. **ZAO members vote** on which ones to publish (Respect-weighted, 1000 threshold)
4. **Approved proposals publish** via WaveWarZ signer UUID to `/wavewarz` Farcaster channel
5. **Members can also create** manual `wavewarz` or `social` proposals from the governance UI

### Data Flow

```
Daily 6 PM EST Cron
  |
  +--> Scrape Intelligence artist pages (43 wallets)
  |      |
  |      +--> Upsert wavewarz_artists (stats)
  |      +--> Insert new rows in wavewarz_battle_log
  |
  +--> For each new battle: create proposal (category: wavewarz)
  |      with pre-filled publish_text, respect_threshold: 1000
  |
  +--> Check spotlight thresholds: create proposal if threshold crossed
  |
  +--> If Sunday: create weekly leaderboard proposal
  |
  +--> If Mon-Fri: create session reminder proposal
  |
  +--> ZAO members vote on proposals in governance tab
  |
  +--> When threshold met: publish via WaveWarZ signer to /wavewarz channel

Manual flow:
  ZAO member -> Create proposal (category: wavewarz or social)
    -> Community votes -> Threshold met -> Publish via appropriate signer
```

### Signer Routing

When a proposal is approved and publishes:
- Category `wavewarz` -> publish via `WAVEWARZ_SIGNER_UUID` to `/wavewarz` channel
- Category `social` -> publish via @thezao signer to `/zao` channel
- All other categories -> existing behavior (publish via @thezao signer)

### New Environment Variable

```
WAVEWARZ_SIGNER_UUID=   # WaveWarZ's Farcaster managed signer UUID (from Neynar)
```

---

## Schema Changes

### Proposal Categories (modify existing)

Current: `general`, `treasury`, `governance`, `technical`, `community`

New: `general`, `treasury`, `governance`, `technical`, `community`, **`wavewarz`**, **`social`**

Change in `src/lib/validation/schemas.ts`:
```typescript
export const proposalCategorySchema = z.enum([
  'general',
  'treasury',
  'governance',
  'technical',
  'community',
  'wavewarz',
  'social',
]);
```

### Governance Page Category Colors

Add to `CATEGORY_COLORS` in governance page:
```typescript
wavewarz: 'bg-green-500/10 text-green-400',
social: 'bg-pink-500/10 text-pink-400',
```

### Publish Route — Signer Routing

Modify the existing publish route (or the governance publishing logic) to check proposal category:
- If `category === 'wavewarz'`: use `WAVEWARZ_SIGNER_UUID` and channel `wavewarz`
- Otherwise: use existing @thezao signer

---

## New Database Tables

### `wavewarz_artists` — Artist stats synced nightly

```sql
CREATE TABLE wavewarz_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  solana_wallet TEXT NOT NULL UNIQUE,
  battles_count INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_volume_sol NUMERIC NOT NULL DEFAULT 0,
  career_earnings_sol NUMERIC NOT NULL DEFAULT 0,
  biggest_win_sol NUMERIC NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_battle TIMESTAMPTZ,
  last_battle_id TEXT,
  zao_fid INTEGER,
  farcaster_username TEXT,
  spotlight_tier TEXT,        -- null, 'rising_star', 'veteran', 'legend'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON wavewarz_artists(wins DESC);
CREATE INDEX ON wavewarz_artists(total_volume_sol DESC);
CREATE INDEX ON wavewarz_artists(solana_wallet);
CREATE INDEX ON wavewarz_artists(zao_fid) WHERE zao_fid IS NOT NULL;
```

### `wavewarz_battle_log` — Raw battle results

```sql
CREATE TABLE wavewarz_battle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id TEXT NOT NULL UNIQUE,
  artist_a TEXT NOT NULL,
  artist_b TEXT NOT NULL,
  song_a TEXT,
  song_b TEXT,
  winner TEXT,                -- 'a' or 'b'
  winner_margin TEXT,         -- e.g., '+82%'
  volume_sol NUMERIC NOT NULL DEFAULT 0,
  battle_type TEXT,           -- 'quick', 'main_event', 'benefit'
  settled_at TIMESTAMPTZ,
  proposal_id UUID,           -- links to the proposals table (if a proposal was created for this battle)
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON wavewarz_battle_log(settled_at DESC);
CREATE INDEX ON wavewarz_battle_log(battle_id);
```

---

## Proposal Templates (No Emojis)

### Battle Result Proposal

**Title:** `{winner_name} beat {loser_name} -- Battle #{battle_id}`
**Category:** `wavewarz`
**Description:** `{winner_name} defeated {loser_name} ({margin}) with {volume} SOL trading volume in WaveWarZ Battle #{battle_id}. Vote to publish this result to the /wavewarz Farcaster channel.`
**Publish text:**
```
{winner_name} beat {loser_name} ({margin}) | {volume} SOL volume | Battle #{battle_id}

Watch battles live: wavewarz.com
```
**Respect threshold:** 1000

### Artist Spotlight Proposal

| Tier | Trigger | Label |
|------|---------|-------|
| Rising Star | 3+ wins | "Rising Star" |
| Battle Veteran | 10+ wins | "Battle Veteran" |
| Battle Legend | 25+ wins | "Battle Legend" |

**Title:** `{label}: {artist_name}`
**Category:** `wavewarz`
**Description:** `{artist_name} has reached {wins} WaveWarZ wins with {volume} SOL total volume. Vote to spotlight them on the /wavewarz Farcaster channel.`
**Publish text:**
```
{label}: {artist_name} has {wins} WaveWarZ wins with {volume} SOL total volume.

Artist profile: wavewarz-intelligence.vercel.app/artist/{wallet}
```
**Respect threshold:** 1000

### Weekly Leaderboard Proposal (Sunday)

**Title:** `WaveWarZ Weekly Top 5 -- Week of {date}`
**Category:** `wavewarz`
**Description:** `This week's top WaveWarZ battlers. Vote to publish to the /wavewarz Farcaster channel.`
**Publish text:**
```
WaveWarZ Weekly Top 5:

1. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
2. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
3. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
4. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
5. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL

Full leaderboard: wavewarz-intelligence.vercel.app/leaderboards
```
**Respect threshold:** 1000

### Session Reminder Proposal (Mon-Fri)

**Title:** `WaveWarZ Session Reminder -- {date}`
**Category:** `wavewarz`
**Description:** `Reminder for tonight's WaveWarZ battles on X Spaces. Vote to publish to the /wavewarz Farcaster channel.`
**Publish text:**
```
WaveWarZ battles go LIVE tonight at 8:30 PM EST on X Spaces.

Join the session: wavewarz.com
```
**Respect threshold:** 1000

---

## API Routes

### `POST /api/wavewarz/sync` — Daily cron (6 PM EST)

Called by Vercel cron. Steps:
1. Verify `CRON_SECRET` auth header
2. For each of 43 known wallets: fetch Intelligence artist page, parse stats
3. Upsert `wavewarz_artists` rows
4. Detect new battles (compare `last_battle_id` vs previous sync)
5. Insert new rows in `wavewarz_battle_log`
6. For each new battle (filtered: no self-battles, no zero-volume): create a `wavewarz` category proposal with pre-filled `publish_text`
7. Check spotlight thresholds: if artist crossed a tier, create spotlight proposal
8. If Sunday: create weekly leaderboard proposal
9. If Mon-Fri: create session reminder proposal
10. Proposals are created with `author_id` set to a system/bot user (or the app's user ID)
11. All proposals use `respect_threshold: 1000`

### `GET /api/wavewarz/artists` — Leaderboard

Returns artist data from `wavewarz_artists` table. Params:
- `sort`: wins | volume | win_rate (default: wins)
- `limit`: 1-50 (default: 20)
- `linked_only`: true/false (only artists with zao_fid)

Requires session auth.

### Existing `POST /api/proposals` — No changes needed

ZAO members can already create proposals. They just select `wavewarz` or `social` as the category and fill in `publish_text`. The existing flow handles voting and publishing.

### Existing publish flow — Modify signer routing

The governance publishing logic (wherever proposals get published to Farcaster after threshold is met) needs one change:

```typescript
if (proposal.category === 'wavewarz') {
  // Use WaveWarZ signer UUID + /wavewarz channel
  signerUuid = process.env.WAVEWARZ_SIGNER_UUID;
  channel = 'wavewarz';
} else {
  // Use @thezao signer (existing behavior)
  signerUuid = process.env.APP_SIGNER_UUID;
  channel = 'zao';
}
```

---

## Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/wavewarz/sync",
      "schedule": "0 23 * * *"
    }
  ]
}
```

Note: `0 23 * * *` = 11 PM UTC = 6 PM EST (UTC-5).

---

## community.config.ts Changes

```typescript
wavewarz: {
  mainApp: 'https://www.wavewarz.com',
  intelligence: 'https://wavewarz-intelligence.vercel.app',
  analytics: 'https://analytics-wave-warz.vercel.app',
  channel: 'wavewarz',
},
```

---

## Data Scraping Strategy

Since the WaveWarZ Intelligence dashboard has no public API and its Supabase only stores events (not battle data), we scrape artist pages:

1. For each wallet in the known 43-wallet roster: `GET /artist/{wallet}`
2. Parse the HTML response for: artist name, wins, losses, total volume, career earnings, last battle details
3. The Intelligence dashboard renders client-side (Next.js) — the initial HTML contains hydration payloads with the data embedded
4. If scraping fails, fall back to the last known data and log the failure
5. New wallets can be added to the roster manually

---

## Filter Rules

- **Self-battles** (artist_a == artist_b): sync to DB but do NOT create proposal
- **Zero-volume battles**: sync to DB but do NOT create proposal
- **Duplicate proposals**: check `wavewarz_battle_log.proposal_id` — if a proposal already exists for this battle, skip
- **Spotlight once per tier**: check `wavewarz_artists.spotlight_tier` before creating proposal; only upgrade tiers
- **Session reminder dedup**: only create if no open reminder proposal exists for today

---

## Files to Create/Modify

### New Files
- `src/app/api/wavewarz/sync/route.ts` — Cron sync endpoint (scrape + create proposals)
- `src/app/api/wavewarz/artists/route.ts` — Leaderboard API
- `src/lib/wavewarz/scraper.ts` — Intelligence page scraper
- `src/lib/wavewarz/proposals.ts` — Proposal generation (templates + creation)
- `src/lib/wavewarz/constants.ts` — Wallet roster, spotlight thresholds, templates

### Modified Files
- `src/lib/validation/schemas.ts` — Add `wavewarz` and `social` to `proposalCategorySchema`
- `src/app/(auth)/governance/page.tsx` — Add category colors for `wavewarz` and `social`
- `community.config.ts` — Add `channel` field to wavewarz config
- Governance publishing logic — Route `wavewarz` proposals to WaveWarZ signer
- `vercel.json` — Add cron schedule

### Database
- 2 new Supabase tables: `wavewarz_artists`, `wavewarz_battle_log`
- No `wavewarz_casts` table needed (proposals table handles dedup)
- Seed `wavewarz_artists` with 43 known wallets from doc 101

---

## Success Criteria

1. Cron syncs battle data and creates wavewarz proposals daily at 6 PM EST
2. Battle result proposals appear in governance tab under wavewarz category
3. Spotlight proposals fire exactly once per tier per artist
4. Weekly leaderboard proposal created every Sunday
5. Session reminder proposals created Mon-Fri
6. Self-battles and zero-volume battles filtered from proposals
7. When a wavewarz proposal reaches 1000 Respect threshold, it publishes via WaveWarZ signer to /wavewarz channel
8. ZAO members can manually create wavewarz and social proposals
9. No duplicate proposals for the same battle
