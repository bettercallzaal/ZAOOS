# 97 — WaveWarZ Artist Discovery Pipeline for ZAO OS

> **Status:** Research complete
> **Date:** March 21, 2026
> **Goal:** Build an artist discovery pipeline that pulls WaveWarZ battle data into ZAO OS — surface top artists, track performance, recruit talent

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Data source** | WaveWarZ Intelligence dashboard (wavewarz-intelligence.vercel.app) — already has all battle data, artist stats, leaderboards |
| **Onchain reads** | Solana RPC via Helius free tier (1M credits/mo) to read Battle Vault PDAs directly |
| **WaveWarZ program ID** | Not public — find via Solscan tx inspection or ask WaveWarZ team directly |
| **DB table** | `wavewarz_artists` — track artist names, battles, wins, volumes, linked ZAO FID |
| **Cron frequency** | Daily sync via Vercel cron — read settled battles, update artist stats |
| **Feed integration** | Auto-surface winning artists in ZAO social feed + /wavewarz Farcaster channel |
| **Profile enrichment** | Show WaveWarZ stats on ZAO member profiles via linked Solana wallet |
| **Solana deps** | `@solana/web3.js@1` (already installed), add `@solana/buffer-layout` for deserialization |
| **RPC provider** | Helius free tier — 10 RPS, 5 getProgramAccounts/sec, $0 |

---

## Why Artist Discovery

WaveWarZ has **43+ indie artists** (mostly hip-hop/R&B) competing in 647+ battles with real SOL at stake. These are exactly ZAO's target audience — independent musicians with crypto-native fans. Instead of manually finding artists, ZAO can:

1. **Auto-track** every WaveWarZ artist's performance (wins, volume, fan engagement)
2. **Surface winners** in the ZAO feed — "STILO just won Battle #312 with 4.2 SOL volume"
3. **Recruit talent** — invite top performers to join ZAO via Farcaster DM or XMTP
4. **Enrich profiles** — ZAO members who battle on WaveWarZ get their stats shown in their ZAO profile
5. **Cross-pollinate** — WaveWarZ artists discover ZAO through the spotlight, ZAO members discover WaveWarZ artists through the feed

---

## Data Flow

```
WaveWarZ Battles (Solana onchain / Intelligence API)
  ↓
Daily Cron: Read settled battles, extract artist names + results
  ↓
Supabase: wavewarz_artists table — track stats over time
  ↓
Feed: Auto-generate "Artist Spotlight" posts when thresholds hit
  ↓
Profile: Show WaveWarZ stats on ZAO member profiles (linked Solana wallet)
  ↓
Recruit: Top artists get auto-invited to ZAO community
```

---

## Technical Implementation

### 1. Database Schema

```sql
CREATE TABLE wavewarz_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  battles_count INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_volume_sol NUMERIC NOT NULL DEFAULT 0,
  biggest_win_sol NUMERIC NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_battle TIMESTAMPTZ,
  last_battle_id TEXT,  -- WaveWarZ battle ID for reference
  zao_fid INTEGER,  -- linked ZAO member (if matched via wallet)
  solana_wallet TEXT,  -- artist's Solana address if known
  farcaster_username TEXT,  -- if found on Farcaster
  spotlight_cast_hash TEXT,  -- hash of auto-generated spotlight cast
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_wavewarz_artists_wins ON wavewarz_artists(wins DESC);
CREATE INDEX idx_wavewarz_artists_volume ON wavewarz_artists(total_volume_sol DESC);
CREATE INDEX idx_wavewarz_artists_zao_fid ON wavewarz_artists(zao_fid) WHERE zao_fid IS NOT NULL;

-- Battle results log (raw data from each sync)
CREATE TABLE wavewarz_battle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id TEXT NOT NULL UNIQUE,  -- WaveWarZ battle identifier
  artist_a TEXT NOT NULL,
  artist_b TEXT NOT NULL,
  song_a TEXT,
  song_b TEXT,
  winner TEXT,  -- 'a' or 'b'
  volume_sol NUMERIC NOT NULL DEFAULT 0,
  settled_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. Solana RPC Setup (Reading Battle Vaults)

```typescript
// src/lib/solana/wavewarz.ts
import { Connection, PublicKey } from '@solana/web3.js';

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

export function getWaveWarzConnection() {
  return new Connection(HELIUS_RPC, 'confirmed');
}

// Once we have the program ID (find via Solscan tx inspection):
// export const WAVEWARZ_PROGRAM = new PublicKey('...');

// Read all battle vault accounts
export async function fetchBattleVaults(programId: PublicKey) {
  const connection = getWaveWarzConnection();
  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      // Filter by account data size to only get battle vaults
      // { dataSize: BATTLE_VAULT_SIZE },
    ],
  });
  return accounts;
}
```

### 3. Finding the WaveWarZ Program ID

**Option A: Solscan inspection**
1. Make a trade on wavewarz.com
2. Copy the transaction hash
3. Open on Solscan: `solscan.io/tx/{hash}`
4. The "Program" in the instruction details = WaveWarZ program ID

**Option B: Ask the WaveWarZ team**
Since ZAO has `/wavewarz` as a Farcaster channel and embeds their app, there's an existing relationship. Ask for:
- Program ID
- Account data layouts (or Anchor IDL)
- Webhook/API access for battle results

### 4. API Route: Sync WaveWarZ Data

```typescript
// src/app/api/wavewarz/sync/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

// Called by Vercel cron daily
export async function POST() {
  // Option 1: Read from WaveWarZ Intelligence (if they expose data)
  // Option 2: Read from Solana onchain (Battle Vault PDAs)
  // Option 3: Scrape Intelligence dashboard (last resort)

  // For each settled battle:
  // 1. Upsert into wavewarz_battle_log
  // 2. Update wavewarz_artists stats (wins, losses, volume)
  // 3. Check spotlight thresholds

  return NextResponse.json({ synced: true });
}
```

### 5. API Route: Get Artist Leaderboard

```typescript
// src/app/api/wavewarz/artists/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: Request) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const sort = url.searchParams.get('sort') || 'wins'; // wins, volume, win_rate
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  const { data, error } = await supabaseAdmin
    .from('wavewarz_artists')
    .select('*')
    .order(sort, { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

  return NextResponse.json({ artists: data });
}
```

### 6. Feed Integration: Artist Spotlight

When an artist hits a threshold (e.g., 3+ wins, or wins with 2+ SOL volume), auto-cast to the /wavewarz Farcaster channel:

```typescript
// Spotlight trigger logic (in sync cron)
async function checkSpotlightThresholds(artist: WaveWarzArtist) {
  const thresholds = [
    { wins: 3, label: 'Rising Star' },
    { wins: 5, label: 'Battle Veteran' },
    { wins: 10, label: 'Battle Legend' },
  ];

  for (const threshold of thresholds) {
    if (artist.wins >= threshold.wins && !artist.spotlight_cast_hash) {
      // Auto-cast to /wavewarz channel via Neynar
      const castText = `${threshold.label}: ${artist.name} has won ${artist.wins} WaveWarZ battles with ${artist.total_volume_sol.toFixed(2)} SOL total volume! Check their battles on WaveWarZ.`;

      // Use existing Neynar publishing (already built for governance)
      // POST /api/publish/farcaster with channel: 'wavewarz'
    }
  }
}
```

### 7. Profile Enrichment

For ZAO members who have linked their Solana wallet (already built in settings), show WaveWarZ stats in their profile:

```typescript
// In ProfileDrawer or settings, check if user's solana_wallet matches any wavewarz_artist
const { data: warzStats } = await supabaseAdmin
  .from('wavewarz_artists')
  .select('*')
  .eq('solana_wallet', user.solana_wallet)
  .maybeSingle();

// Display: Battles: 12 | Wins: 8 | Win Rate: 67% | Volume: 2.4 SOL
```

---

## Helius Free Tier (Solana RPC)

| Feature | Value |
|---------|-------|
| Credits | 1M/month |
| Rate limit | 10 RPS |
| getProgramAccounts | 5/sec |
| Cost | $0 |
| Sign up | helius.dev |

Add `HELIUS_API_KEY` to `.env.local` and Vercel env vars.

---

## Dependencies Needed

| Package | Status | Purpose |
|---------|--------|---------|
| `@solana/web3.js@1` | Already installed | RPC connection, account reads |
| `@solana/buffer-layout` | Needs install | Deserialize battle vault account data |
| `@solana/buffer-layout-utils` | Needs install | Helper types |

---

## Implementation Plan

| Day | Work |
|-----|------|
| 1 | Create `wavewarz_artists` + `wavewarz_battle_log` tables in Supabase |
| 2 | Find WaveWarZ program ID (Solscan inspection or ask team) + set up Helius RPC |
| 3 | Build sync cron: read battle data → update artist stats |
| 4 | Build `/api/wavewarz/artists` API + artist leaderboard component |
| 5 | Feed integration: spotlight auto-casts + profile enrichment |

**Total: ~5 days.**

---

## Sources

- [WaveWarZ](https://www.wavewarz.com/) — 647 battles, 423 SOL total volume, 43+ artists
- [WaveWarZ Intelligence](https://wavewarz-intelligence.vercel.app/) — battle history, artist leaderboards, claim tool
- [WaveWarZ Analytics](https://analytics-wave-warz.vercel.app/) — charts, volume trends
- [Helius RPC](https://helius.dev) — free Solana RPC provider
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) — `@solana/web3.js` docs
- Existing codebase: `src/app/api/respect/`, `src/app/api/publish/farcaster/`, `src/lib/solana/config.ts`
- Previous research: Doc 95 (Solana wallet setup), Doc 96 (WaveWarZ deep dive), Doc 100 (Solana PDA reading)
