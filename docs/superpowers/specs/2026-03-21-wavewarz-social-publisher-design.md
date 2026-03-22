# WaveWarZ Social Publisher for ZAO OS

**Date:** March 21, 2026
**Status:** Approved
**Goal:** Make ZAO OS the Farcaster publishing hub for WaveWarZ — auto-post battle results, artist spotlights, weekly leaderboards, and session reminders via WaveWarZ's signer UUID, and let ZAO members compose manual posts to the /wavewarz channel.

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Publisher account | WaveWarZ's Farcaster signer UUID (not @thezao) |
| Channel | `/wavewarz` Farcaster channel |
| Auto-post types | Battle results, artist spotlights, weekly leaderboard, session reminders |
| Cron schedule | All at 6:00 PM EST daily |
| Manual posting | ZAO members can compose posts to /wavewarz channel from compose bar |
| Data source | Scrape WaveWarZ Intelligence artist pages nightly |
| Tone | No emojis in any auto-posts |

---

## Architecture

### Data Flow

```
Daily 6 PM EST Cron
  |
  +--> Scrape Intelligence artist pages (43 wallets)
  |      |
  |      +--> Upsert wavewarz_artists (stats)
  |      +--> Insert new rows in wavewarz_battle_log
  |
  +--> Detect new battles since last sync
  |      |
  |      +--> Auto-cast each battle result via WaveWarZ signer
  |
  +--> Check artist spotlight thresholds
  |      |
  |      +--> Auto-cast spotlight if threshold crossed (once per tier per artist)
  |
  +--> If Sunday: generate weekly leaderboard cast
  |
  +--> If Mon-Fri: generate session reminder cast
  |
  +--> ZAO members compose manual posts via compose bar -> /wavewarz channel
```

### New Environment Variable

```
WAVEWARZ_SIGNER_UUID=   # WaveWarZ's Farcaster managed signer UUID (from Neynar)
```

---

## Database Schema

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
  spotlight_cast_hash TEXT,
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
  cast_hash TEXT,             -- hash of the auto-posted cast (null if not yet posted)
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON wavewarz_battle_log(settled_at DESC);
```

### `wavewarz_casts` — Dedup tracker for auto-posts

```sql
CREATE TABLE wavewarz_casts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_type TEXT NOT NULL,     -- 'battle_result', 'spotlight', 'leaderboard', 'reminder'
  reference_id TEXT NOT NULL,  -- battle_id, artist name, 'week-2026-12', 'reminder-2026-03-21'
  cast_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cast_type, reference_id)
);
```

---

## Auto-Post Templates (No Emojis)

### Battle Result (per new battle)

```
{winner_name} beat {loser_name} ({margin}) | {volume} SOL volume | Battle #{battle_id}

Watch battles live: wavewarz.com
```

Example:
> Kata7yst beat BennyJ504 (+82%) | 0.048 SOL volume | Battle #1774067319
>
> Watch battles live: wavewarz.com

### Artist Spotlight (threshold-based, once per tier)

| Tier | Trigger | Label |
|------|---------|-------|
| Rising Star | 3+ wins | "Rising Star" |
| Battle Veteran | 10+ wins | "Battle Veteran" |
| Battle Legend | 25+ wins | "Battle Legend" |

```
{label}: {artist_name} has {wins} WaveWarZ wins with {volume} SOL total volume.

Artist profile: wavewarz-intelligence.vercel.app/artist/{wallet}
```

Example:
> Rising Star: APORKALYPSE has 22 WaveWarZ wins with 10.97 SOL total volume.
>
> Artist profile: wavewarz-intelligence.vercel.app/artist/CUh7ZWej4qG4daKHA44vV7zNNeonyctt45qHZykz9WGN

### Weekly Leaderboard (Sunday 6 PM)

```
WaveWarZ Weekly Top 5:

1. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
2. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
3. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
4. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL
5. {name} -- {wins}W-{losses}L ({win_rate}%) | {volume} SOL

Full leaderboard: wavewarz-intelligence.vercel.app/leaderboards
```

### Session Reminder (Mon-Fri 6 PM)

```
WaveWarZ battles go LIVE tonight at 8:30 PM EST on X Spaces.

Join the session: wavewarz.com
```

---

## API Routes

### `POST /api/wavewarz/sync` — Nightly cron

Called by Vercel cron at 6 PM EST daily. Steps:
1. Verify `CRON_SECRET` auth header
2. For each of 43 known wallets: fetch `wavewarz-intelligence.vercel.app/artist/{wallet}`, parse HTML for stats
3. Upsert `wavewarz_artists` rows
4. Detect new battles (compare `last_battle_id` vs previous sync)
5. Insert new rows in `wavewarz_battle_log`
6. For each new battle where `cast_hash` is null: publish battle result cast via Neynar using `WAVEWARZ_SIGNER_UUID`, save cast hash
7. Check spotlight thresholds: if artist crossed a tier and `spotlight_tier` < new tier, publish spotlight cast, update `spotlight_tier`
8. If Sunday: publish weekly leaderboard (top 5 by wins)
9. If Mon-Fri: publish session reminder
10. All casts go to `/wavewarz` Farcaster channel
11. All casts tracked in `wavewarz_casts` for dedup

### `GET /api/wavewarz/artists` — Leaderboard

Returns artist data from `wavewarz_artists` table. Params:
- `sort`: wins | volume | win_rate (default: wins)
- `limit`: 1-50 (default: 20)
- `linked_only`: true/false (only artists with zao_fid)

Requires session auth.

### `POST /api/wavewarz/publish` — Manual cast

Allows ZAO members to compose and publish a cast to the `/wavewarz` channel via WaveWarZ's signer. Request body:
- `text`: string (max 1024 chars)
- `embeds`: optional array of URLs

Requires session auth. Validates input with Zod. Publishes via Neynar `POST /v2/farcaster/cast` with `WAVEWARZ_SIGNER_UUID`.

---

## Compose Bar Integration

Add `/wavewarz` as a channel option in the existing compose bar component. When selected:
- Posts are published via `POST /api/wavewarz/publish` (WaveWarZ signer)
- UI shows "Posting as WaveWarZ" indicator
- Same compose UX as existing channel posting

---

## community.config.ts Changes

```typescript
wavewarz: {
  mainApp: 'https://www.wavewarz.com',
  intelligence: 'https://wavewarz-intelligence.vercel.app',
  analytics: 'https://analytics-wave-warz.vercel.app',
  channel: 'wavewarz',        // Farcaster channel
  // signerUuid stored in env var WAVEWARZ_SIGNER_UUID, not in config
},
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

Note: `0 23 * * *` = 11 PM UTC = 6 PM EST (UTC-5). Adjust for daylight savings if needed.

---

## Data Scraping Strategy

Since the WaveWarZ Intelligence dashboard has no public API and its Supabase only stores events (not battle data), we scrape artist pages:

1. For each wallet in the known 43-wallet roster: `GET /artist/{wallet}`
2. Parse the HTML response for: artist name, wins, losses, total volume, career earnings, last battle details
3. The Intelligence dashboard renders client-side (Next.js) — the initial HTML contains hydration payloads with the data embedded
4. If scraping fails (e.g., they change the page structure), fall back to the last known data and log the failure
5. New wallets can be added to the roster manually or detected from battle log opponent names

---

## Filter Rules

- **Self-battles** (artist_a == artist_b): sync to DB but do NOT auto-post
- **Zero-volume battles**: sync to DB but do NOT auto-post
- **Duplicate detection**: `wavewarz_casts.reference_id` UNIQUE constraint prevents double-posting
- **Spotlight once per tier**: check `wavewarz_artists.spotlight_tier` before posting; only upgrade, never re-post same tier

---

## Files to Create/Modify

### New Files
- `src/app/api/wavewarz/sync/route.ts` — Cron sync endpoint
- `src/app/api/wavewarz/artists/route.ts` — Leaderboard API
- `src/app/api/wavewarz/publish/route.ts` — Manual cast endpoint
- `src/lib/wavewarz/scraper.ts` — Intelligence page scraper
- `src/lib/wavewarz/publisher.ts` — Cast formatting + Neynar publish via WaveWarZ signer
- `src/lib/wavewarz/constants.ts` — Wallet roster, spotlight thresholds, cast templates

### Modified Files
- `community.config.ts` — Add `channel` field to wavewarz config
- Compose bar component — Add `/wavewarz` channel option
- `vercel.json` — Add cron schedule

### Database
- 3 new Supabase tables: `wavewarz_artists`, `wavewarz_battle_log`, `wavewarz_casts`
- Seed `wavewarz_artists` with 43 known wallets from doc 101

---

## Success Criteria

1. Every new WaveWarZ battle gets auto-posted to /wavewarz Farcaster channel within 24 hours
2. Artist spotlights fire exactly once per tier per artist
3. Weekly leaderboard posts every Sunday at 6 PM EST
4. Session reminders post Mon-Fri at 6 PM EST
5. ZAO members can compose manual posts to /wavewarz channel
6. No duplicate posts (wavewarz_casts dedup works)
7. Self-battles and zero-volume battles are filtered from auto-posts
