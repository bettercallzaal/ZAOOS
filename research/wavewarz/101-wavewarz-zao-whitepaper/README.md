# 101 — WaveWarZ × ZAO OS: Integration Whitepaper

> **Status:** Research complete
> **Date:** March 21, 2026
> **Goal:** Synthesize docs 95–100 into a comprehensive strategic integration document — what WaveWarZ is, how it fits ZAO OS, what we build, and in what order

> **Builds on:** Doc 95 (Solana wallet), Doc 96 (WaveWarZ deep dive), Doc 97 (Artist Discovery Pipeline), Doc 99 (Prediction markets), Doc 100 (Solana PDA reading)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary integration** | Artist Discovery Pipeline — sync battle results into `wavewarz_artists` Supabase table, surface in ZAO feed, enrich profiles |
| **Data source** | WaveWarZ Intelligence (`wavewarz-intelligence.vercel.app`) artist pages — all 43 wallets are now mapped to names, stats, and battle history |
| **Seed data** | 43 artists fully documented with wallets, W/L records, volumes — can pre-seed `wavewarz_artists` table immediately without waiting for API/program ID |
| **Recruit first** | Priority targets: LUI (49W, 29.59 SOL volume), APORKALYPSE (73% win rate), PROF!T (71%, 13.86 SOL), Kata7yst (most active this week) |
| **Multi-wallet handling** | Hurric4n3Ike has 3 wallets, Rome has 2 — `wavewarz_artists` must support one-to-many wallet-to-artist mapping |
| **Filter self-battles** | CannonJones973 vs CannonJones973 (4.14 SOL) = self-battle — exclude from feed highlights |
| **Wallet link** | ZAO members who connect Solana wallet (`users.solana_wallet`) automatically matched to WaveWarZ artist records |
| **Governance synergy** | ZAO governance module can adjudicate community-run battles (ZAO-hosted WaveWarZ-style events) |
| **Solana RPC** | Helius free tier (1M credits/mo, 10 RPS, $0) via `@solana/web3.js` (already installed) |
| **Do NOT build** | A competing battle platform — WaveWarZ is a partner, not a competitor |
| **Contact** | Reach Ikechi Nwachukwu (Hurric4n3Ike) via X @WaveWarZ — no Farcaster presence, no Discord/Telegram found |

---

## Part 1: What WaveWarZ Is

### 1.1 Platform Overview

WaveWarZ is a **Solana prediction market for music battles** — closer in mechanics to Polymarket than to pump.fun. Founded by **Ikechi Nwachukwu** (stage name: Hurric4n3Ike), it enables fans to stake real SOL on which artist/song they believe will win a head-to-head battle.

> **Tagline:** "Epic music battles where YOU decide the winner! Back Music, Not Memes."

**What makes it notable for ZAO:**
- 43+ independent hip-hop/R&B artists — exactly ZAO's target demographic
- Real SOL at stake (skin in the game, crypto-native fanbase)
- 647 total battles, $38K+ in trading volume since launch
- Built on Solana — complements ZAO's EVM-first stack with multi-chain credibility
- Already integrated at ZAO OS `/wavewarz` — community is aware of it

### 1.2 Platform Statistics (March 21, 2026)

| Metric | Value |
|--------|-------|
| Total Trading Volume | 423.37 SOL ($38,005.94) |
| Total Battles | 647 |
| Main Events | 120 |
| Quick Battles | 497 |
| Tracked Artists | 43+ |
| Artist Payouts (total) | 7.17 SOL ($643.85) |
| Platform Revenue | 3.38 SOL ($303.08) |
| Charity Raised | ~$1,500 USD |
| Live Schedule | Mon–Fri, 8:30 PM EST (X Spaces) |
| Community AMAs | Mon–Fri, 11:00 AM EST |
| SOL Rate (at time of writing) | $89.77 |

### 1.3 Battle Mechanics

**Two-Pool System:**
1. Two songs/artists are matched
2. Each side has a **Battle Vault PDA** (Solana Program Derived Address acting as escrow)
3. Fans deposit SOL into the pool they predict will win
4. Trading is live during X Spaces sessions
5. After judging, the battle settles automatically onchain

**Settlement Economics:**

| Participant | Outcome |
|-------------|---------|
| Winning traders | Proportional share of winner pool + 40% of losing pool |
| Losing traders | 50% refunded (partial recovery, no total loss) |
| Artist (win or lose) | 1% of all trade volume + 5–7% settlement bonus (instant onchain) |
| Platform | 0.5% per trade + 3% of losing pool |
| **In ecosystem** | **98.5% of every trade stays in ecosystem** |

**Battle Types:**

| Type | Count | Description |
|------|-------|-------------|
| Quick Battles | 497 | Song vs song, single round |
| Main Events | 120 | Artist vs artist, multi-round, judges + X poll + SOL weight |
| Benefit Battles | 2 | Charity events (IndieZ vs ClassicZ format) |

### 1.4 The Three Tools

| Tool | URL | Purpose |
|------|-----|---------|
| **Main App** | wavewarz.com | Battle creation, SOL staking, live voting, track listening |
| **Intelligence** | wavewarz-intelligence.vercel.app | Analytics engine — all battle history, 5 leaderboard types, claim tool |
| **Analytics** | analytics-wave-warz.vercel.app | Charts, volume trends, platform growth over time (Recharts + Supabase) |

**All three are embedded in ZAO OS at `/wavewarz`** with a 3-tab switcher (Battles / Intelligence / Analytics).

### 1.5 Complete Artist Roster (All 43 — Wallet → Name → Stats)

Every artist verified onchain via WaveWarZ Intelligence dashboard. Artist profile URL: `https://wavewarz-intelligence.vercel.app/artist/[WALLET]`

| Wallet Address | Artist Name | W | L | Total Battles | SOL Volume | SOL Earned |
|----------------|-------------|---|---|---------------|------------|------------|
| B97zbRCUf2jhPj6Cs2QXc9EGyWdNDvQ6ExUeB7sxrTSA | **LUI** | 49 | 22 | 71 | 29.5888 | 0.528 |
| 62g5hYiSTqj185F26c3pT6EPx4Gs1P6gL72kGNzvkbjM | **Hurric4n3Ike** *(wallet A)* | 60 | 18 | 78 | 3.6081 | 0.0836 |
| 2J32aabxSnAPC4YpTC6jFX6EMPRkHeovPuMNtfLs8bXp | **Stormi** | 31 | 44 | 75 | 11.8671 | 0.2195 |
| CUh7ZWej4qG4daKHA44vV7zNNeonyctt45qHZykz9WGN | **APORKALYPSE** | 22 | 8 | 30 | 10.9753 | 0.2223 |
| F4HRLiYo8uk9uuF9PV23czSHRy38sgj9uPBJdx4dmZnP | **Lil Rocky** | 10 | 23 | 33 | 11.9572 | 0.1771 |
| 9HMK1zVyNJhnqtgog9knwrjHtqeX6N2fjcvojfw7y2WZ | **ONE** | 9 | 5 | 14 | 12.0425 | 0.2057 |
| 4g2wDCUN1WcsMRd2czDSVhxgk5eCLH4CpVLk3thfv5rG | **Hurric4n3Ike** *(wallet B)* | 8 | 3 | 11 | 1.4198 | 0.0239 |
| F9U1Q12LtVRadwMud97Mm6K4YCBSrEgS7ZBd9vMTB1t8 | **Yoshiro Mare** | 6 | 4 | 10 | 5.723 | 0.1056 |
| 9xTn9ni1UPACiB1KQy6U8gd33nzM86BP3REje9gyBZmx | **GODCLOUD** | 6 | 13 | 19 | 6.6788 | 0.0846 |
| BFM9h9WMxGCYxqexLB5w93iSd5uye9xCyxkjchZirG4X | **PROF!T** | 5 | 2 | 7 | 13.8564 | 0.2025 |
| 23oqJnEJhJ3qLTq5MjKYPgLDYjfpRmvWWzMA3Zq6NGmg | **Geek Myth** | 5 | 5 | 10 | 5.7748 | 0.0838 |
| j2wHMZUPNrAuj1yoGtuE47pUcQQ4EvASnkWrS1kD6hs | **Money Miller** | 5 | 6 | 11 | 6.1981 | 0.0856 |
| 9LLTjsWhYJBxFgca43MQtrLLsPcxWMR86NoxAHGsBUCk | **STILO English** | 4 | 5 | 9 | 14.4637 | 0.2394 |
| Dtoezry5LGFEx63AaGJyWBgn5GbobTmKZ4SrX9v6BmF4 | **Crypto Beat Radio** | 4 | 4 | 8 | 4.7521 | 0.061 |
| Bf75J5XaGQkqC7ndhNWrkhWfqJnJrLrHKa3dhr2Nh3Pe | **CHECK** | 4 | 4 | 8 | 1.3833 | 0.021 |
| AmDkgFg1dbLeGppfou612eeoygbRjuXZ1Kv5hfynSurs | **JED XO** | 3 | 0 | 3 | 1.6496 | 0.0488 |
| CWvdGzpNbUDRJaUVGVwFnyMCwnLikfYqA45KGgWpC5NM | **Krem** | 3 | 2 | 5 | 8.8442 | 0.1259 |
| 7v6RxAhGZd6MzvCZ9gxsw5t4iHaGUmG7mn4cSzSLSChu | **K1DDV3NOM** | 3 | 3 | 6 | 5.3697 | 0.0717 |
| 9rgpHm4iSXjdN9Psarw5Lz8ftqVcV5CnE1xjrYFhz1gW | **Dr. Bruce Banner** | 1 | 2 | 3 | 1.8685 | 0.0271 |
| F11aszq1b1p3QvuYzmJXMwFMFYw7bxTbeQ42PfQyCzNE | **Goose Pärk** | 3 | 2 | 5 | 3.1029 | 0.041 |
| 2tbquBjgrCUbsxTbCHYJM1BSc3MZD3W1HXGmD5y4R8tU | **MOZAY CALLOWAY** | 3 | 5 | 8 | 2.1329 | 0.0269 |
| 3vEb4ECM4tqfG1CLrdXqgA56KA4UcuWx9mw7puiWWQKG | **Ramone** | 2 | 2 | 4 | 2.4231 | 0.0432 |
| EB6NHP31B8hM1f4zwzKVNUD66t3CYLfse6HhD9fim1wg | **BallOutCut** | 2 | 1 | 3 | 2.0328 | 0.0362 |
| EsZTCLNnTzvma5rJArHvQsuoUtxoRiZTuTgng3nNxW6s | **CANNON** | 2 | 3 | 5 | 1.3466 | 0.0149 |
| CnzrNEu9JFS95fsbMGvkbNLzEKbDazQ6RiTXkrwbbBZw | **CANNON JONES** | 2 | 2 | 4 | 5.012 | 0.1057 |
| CcXSb6iaUFZwsrMFw2htXYdVDqxPTtn4EkoyJ78XLtys | **Chief** | 2 | 1 | 3 | 4.7359 | 0.0918 |
| 9xMBJbs3xZ1CwpR75U7b4vpTD3ou3HbVzuHiLRE21Jgo | **$BONGA: VibeLord** | 2 | 1 | 3 | 3.6638 | 0.0504 |
| BFjm3Cocn1gdqRe9kA9k1Wf5P5ffPtohLttpqdyAhFBb | **Armand** | 2 | 2 | 4 | 4.199 | 0.0892 |
| Bx1o7mkirgPigHwAxVQaypoRHtL6JNdLHmcrzpfyk12f | **Chill Sample Hub** | 2 | 1 | 3 | 0.5675 | 0.0096 |
| 7a6BrTcHq21CNgY6okuYyCJczTctJnqv1zUSRAjNqNAJ | **Rome** *(wallet A)* | 2 | 1 | 3 | 5.1686 | 0.0902 |
| 7gR78C7mq5Bg1iFBht7kxx8F88Gpx8oy3P3y7BQeeGYz | **Preshzino Songz** | 2 | 1 | 3 | 9.5625 | 0.1534 |
| 59x5Y37hR6LbFSLWKitY47H4LvnakVet6hVobm6c7anx | **JayStreetz** | 2 | 1 | 3 | 1.0982 | 0.0146 |
| 9RbUvEftkY9Q7teDaCYjGs1w5n7318GUaJ1KdLDCQM1B | **Hurric4n3Ike** *(wallet C)* | 3 | 6 | 9 | 1.5096 | 0.0192 |
| 8qXrvREdA1whuqmLiuW7h9ZhiRCrkWpZqKUs97ss68M1 | **The Tech** | 2 | 4 | 6 | 5.6735 | 0.0794 |
| 4LyAbTzpEPo21tN9rNazkU5VmkNdPBJ7HttiAT2CuB8S | **LexiBanti** | 1 | 2 | 3 | 7.5495 | 0.1161 |
| EMXDPJp9jTaDnSdzvwzpA5zdfgbf74mwjNQc5ZAmCSNA | **Visionz** | 1 | 2 | 3 | 4.6294 | 0.0677 |
| G7oRakt851BoY5HVQM7ryP8fma3LkSVHiavyQFbuQY66 | **Wiz** | 1 | 2 | 3 | 4.3085 | 0.078 |
| EyGR6ptNoBjbLCT53uu6eN1UAYzTDaQtpBFWmMxQ4TMU | **Rome** *(wallet B)* | 1 | 2 | 3 | 1.7668 | 0.0395 |
| 3upVJtamyVx9h8zseHhGDHbtqZ7n15wUh6SzNJR2GFN4 | **PKMN CTO** | 1 | 2 | 3 | 0.9424 | 0.0151 |
| Ciu7T1FhAthTBMC7dN7KQKyRGAr2BpPg5Snq6YxBsxSm | **$STUPID: Atchblockbaby** | 1 | 2 | 3 | 3.5521 | 0.0435 |
| 3FXptfW8c1w9CQk6FRAK97vVHBPisABdHvVr2DJAurwR | **Davyd** | 0 | 3 | 3 | 2.3648 | 0.0329 |
| 13gQxwput7SSr7BQSxPiRvW45Q81KtKZikzWw4A75fkc | **AYOTEMI** | 0 | 3 | 3 | 1.3377 | 0.0263 |
| Cx5HiWEw8m87HMPV7zcis65y6KEtFV47h8sBnhsefaYD | **GESD1** | 1 | 2 | 3 | 0.2245 | 0.0058 |

**Total volume across all artists:** ~237 SOL (note: individual artist volumes sum higher than platform total because both sides of a battle share the same SOL pool)

### 1.6 Key Insights From The Roster

**Dominant players (recruitment priority for ZAO):**
- **LUI** — 49W-22L (69%), 29.59 SOL volume — most active, most successful, most volume
- **Hurric4n3Ike** — founder, operates 3 wallet addresses (71W-27L combined), 6.54 SOL — highly involved
- **APORKALYPSE** — 22W-8L (73%), 10.97 SOL, strong cross-format (89% quick battle rate)
- **PROF!T** — 5W-2L (71%), 13.86 SOL — high volume for few battles
- **JED XO** — 3W-0L (100%) — undefeated, new entrant worth watching

**Volume leaders (high fan engagement):**
- LUI: 29.59 SOL — 7× more than the next volume leader (ONE at 12.04)
- STILO English: 14.46 SOL (vs 9 battles only — high stakes)
- ONE: 12.04 SOL (vs 14 battles — consistent trader interest)
- Lil Rocky: 11.96 SOL (vs 33 battles — fans betting despite poor record)

**Most battles (dedicated battleers):**
- Hurric4n3Ike wallet A: 78 battles — most active single wallet
- Stormi: 75 battles, 31W-44L — loses more than wins but keeps showing up
- LUI: 71 battles at 69% — the dominant competitor

**Red flags / notes for DB design:**
- **Multiple wallets**: Hurric4n3Ike has 3 wallets (4g2wDCUN1W, 62g5hYiST, 9RbUvEftk). Rome has 2. CANNON and CANNON JONES are different artists. When matching to ZAO users, check all linked wallets.
- **Self-battles**: Some "battles" show an artist vs themselves (e.g., CannonJones973 vs CannonJones973 with 4.14 SOL volume) — filter these from feed highlights
- **Token-named artists**: `$STUPID: Atchblockbaby` and `$BONGA: VibeLord` suggest token tie-ins

### 1.7 Kata7yst — Most Active This Week

Kata7yst battled 8 times in a single 24-hour window (Mar 20–21), making them the most active current artist:

| Song | Opponent | Result | Volume |
|------|----------|--------|--------|
| Need Me | DaColdestDaAI | WIN (+100%) | 0 SOL |
| 100 On The Dash | BennyJ504 | WIN (+82%) | 0.048 SOL |
| Dracs & Button | CannonJones973 | WIN (+11%) | 0.049 SOL |
| Dark Ft Kata7yst | DCoopOfficial | WIN (+96%) | 1.039 SOL |
| 3 for 5 | BennyJ504 | LOSS | 0.172 SOL |
| 100 On The Dash | BennyJ504 | WIN (+21%) | 0.069 SOL |
| Ion feel that | BennyJ504 | LOSS | 0.264 SOL |
| WayTooEarly | DaColdestDaAI | WIN | 0 SOL |

6W-2L in one day, 1.64 SOL volume. Their biggest win: **Dark Ft Kata7yst vs DCoopOfficial** at 1.04 SOL — the highest-volume recent battle. Perfect ZAO spotlight candidate.

### 1.8 LUI Deep Profile

The most successful artist on the platform:

| Metric | Value |
|--------|-------|
| Record | 49W–22L (69%) |
| Main Events | 9W–1L (90%!) |
| Quick Battles | 40W–21L (66%) |
| Total Volume | 29.59 SOL ($2,655) |
| Career Earnings | 0.528 SOL ($47.39) |

**Best songs (perfect records):**
- "AI LUI - WEB3 BLESSED" — 6W-0L, 1.43 SOL
- "Dale Vuelta 360" — 9W-0L, 1.84 SOL
- "Love Languages" — 1W-0L, 2.22 SOL (highest single-song volume)

**Worst songs:** "Animal Freestyle" (0W-3L), "AI LUI - LOV3" (0W-3L), "AI LUI - RL4L" (0W-2L) — the AI-branded tracks with "AI" in title tend to lose

The "AI LUI" naming pattern is interesting: LUI has AI-tagged tracks as part of their brand, but fan response is mixed. Their organic tracks perform better.

**Growth context:** Battles date from September 2025 to March 2026 — a 6-month-old platform already at $38K+ volume with 43 independent artists. For comparison, ZAO has ~100 members.

### 1.6 Claim Tool Mechanics

The Intelligence dashboard's `/claim` page scans any Solana wallet against Battle Vault PDAs to surface unclaimed winnings:
1. User pastes wallet address
2. System scans all Battle Vault PDAs onchain
3. Returns total claimable amount
4. User submits claim transaction directly

**Funds never expire** — winnings remain in the Battle Vault PDA indefinitely until claimed.

---

## Part 2: Why WaveWarZ × ZAO Is the Right Pairing

### 2.1 Shared Audience

| Trait | WaveWarZ | ZAO |
|-------|----------|-----|
| Artists | 43+ indie hip-hop/R&B | 100+ music community members |
| Fans | Crypto-native, SOL holders | Web3 music community |
| Mission | Back music, not memes | Decentralized artist org |
| Chain | Solana (SOL) | Optimism (Respect), multi-chain |
| Format | Competitive battles | Collaborative community |

ZAO is the **community layer** that WaveWarZ artists need. WaveWarZ is the **competitive discovery layer** that ZAO can feed talent from.

### 2.2 Complementary, Not Competing

ZAO is NOT building a battle platform. The goal is mutual amplification:

- **WaveWarZ artists discover ZAO** through spotlight posts in `/wavewarz` Farcaster channel
- **ZAO members discover WaveWarZ artists** through the feed and profile enrichment
- **WaveWarZ gets community signal** — ZAO's 100 engaged members as high-quality validators
- **ZAO gets discovery pipeline** — 43 crypto-native artists pre-qualified by battle performance

### 2.3 The Solana Wallet Bridge

ZAO OS already stores `users.solana_wallet` (implemented in Sprint, doc 95). This is the bridge:

```
WaveWarZ artist's Solana pubkey ←→ ZAO member's solana_wallet field
```

When a ZAO member links their Solana wallet and that wallet appears in `wavewarz_artists`, their ZAO profile automatically shows their WaveWarZ battle stats.

---

## Part 3: Integration Architecture

### 3.1 The Artist Discovery Pipeline (Primary Integration)

This is the **one integration to build**. Everything else flows from it.

**Data Flow:**
```
WaveWarZ Intelligence (API or scrape) → Nightly Cron
  ↓
Supabase: wavewarz_artists + wavewarz_battle_log tables
  ↓
Spotlight trigger: artist hits threshold (e.g., 3 wins) → auto-cast to /wavewarz channel
  ↓
Profile enrichment: ZAO members with linked Solana wallet see their battle stats
  ↓
Recruitment: top artists get Farcaster DM or XMTP invite to join ZAO
```

### 3.2 Database Schema

```sql
-- Artist stats (synced daily from WaveWarZ Intelligence)
CREATE TABLE wavewarz_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  solana_wallet TEXT UNIQUE,            -- artist's Solana address from WW Intelligence
  battles_count INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN battles_count = 0 THEN 0
    ELSE ROUND(wins::numeric / battles_count * 100, 1) END
  ) STORED,
  total_volume_sol NUMERIC NOT NULL DEFAULT 0,
  career_earnings_sol NUMERIC NOT NULL DEFAULT 0,
  biggest_win_sol NUMERIC NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_battle TIMESTAMPTZ,
  last_battle_id TEXT,
  zao_fid INTEGER,                      -- linked ZAO member (matched via solana_wallet)
  farcaster_username TEXT,
  spotlight_tier TEXT,                  -- null, 'rising_star', 'veteran', 'legend'
  spotlight_cast_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw battle log (preserve history, detect new battles)
CREATE TABLE wavewarz_battle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id TEXT NOT NULL UNIQUE,
  artist_a TEXT NOT NULL,
  artist_b TEXT NOT NULL,
  song_a TEXT,
  song_b TEXT,
  winner TEXT,                          -- 'a' or 'b'
  volume_sol NUMERIC NOT NULL DEFAULT 0,
  battle_type TEXT,                     -- 'quick', 'main_event', 'benefit'
  settled_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX ON wavewarz_artists(wins DESC);
CREATE INDEX ON wavewarz_artists(total_volume_sol DESC);
CREATE INDEX ON wavewarz_artists(zao_fid) WHERE zao_fid IS NOT NULL;
CREATE INDEX ON wavewarz_artists(solana_wallet) WHERE solana_wallet IS NOT NULL;
```

### 3.3 Data Source Strategy

**Tier 1 — Ask WaveWarZ Team First (ideal)**

Ikechi Nwachukwu (founder, Hurric4n3Ike) is approachable via X @WaveWarZ or Farcaster. Since ZAO already embeds WaveWarZ and has the `/wavewarz` Farcaster channel, there's an existing relationship. Ask for:
- REST API or webhook for battle results
- WaveWarZ Solana program ID + account layout (or Anchor IDL)
- Permission to use Intelligence data for ZAO's discovery pipeline

**Tier 2 — Intelligence Dashboard API (fallback)**

The Intelligence dashboard (`wavewarz-intelligence.vercel.app`) is built on Next.js + Supabase. Its client-side data fetching likely calls `/api/*` routes. A nightly cron can call these same endpoints if they're public.

**Tier 3 — Direct Solana RPC (ground truth)**

Read Battle Vault PDAs directly via Helius free tier:
```typescript
// src/lib/solana/wavewarz.ts
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
  'confirmed'
);

// Once program ID is known:
// const accounts = await connection.getProgramAccounts(WAVEWARZ_PROGRAM_ID);
```

This requires the program ID (find via Solscan tx inspection — see doc 100 for full methodology).

### 3.4 Sync Cron (Vercel Cron)

```typescript
// src/app/api/wavewarz/sync/route.ts
// Called nightly via vercel.json cron
export async function POST(req: Request) {
  // Verify internal cron call
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Fetch recent battles from Intelligence API
  // 2. Upsert into wavewarz_battle_log (skip already-synced battle_ids)
  // 3. Update wavewarz_artists stats (wins, losses, volume, streaks)
  // 4. Match artists to ZAO members via solana_wallet
  // 5. Check spotlight thresholds → auto-cast if threshold crossed
  // 6. Return sync summary

  return NextResponse.json({ ok: true, battles_synced: N });
}
```

**`vercel.json` cron:**
```json
{
  "crons": [
    {
      "path": "/api/wavewarz/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 3.5 Spotlight Auto-Casting

When an artist crosses a milestone, auto-cast to `/wavewarz` Farcaster channel via Neynar (already built — uses same governance publishing infrastructure):

| Tier | Trigger | Label | Cast Template |
|------|---------|-------|---------------|
| Rising Star | 3+ wins | 🌟 | "[Artist] just earned their 3rd WaveWarZ win with X SOL total volume. Who's listening?" |
| Battle Veteran | 5+ wins | 🔥 | "[Artist] is a WaveWarZ veteran — 5 wins, X SOL earned onchain." |
| Battle Legend | 10+ wins | 👑 | "[Artist] has won 10 WaveWarZ battles. X SOL earned, Y SOL total volume." |

**One spotlight per tier per artist** (tracked via `spotlight_tier` field — won't re-cast if already sent).

### 3.6 Profile Enrichment

For ZAO members who have linked their Solana wallet, query `wavewarz_artists` by `solana_wallet`:

```typescript
// In ProfileDrawer or /api/users/[fid]/wavewarz
const { data: warzStats } = await supabaseAdmin
  .from('wavewarz_artists')
  .select('name, wins, losses, win_rate, total_volume_sol, career_earnings_sol')
  .eq('solana_wallet', user.solana_wallet)
  .maybeSingle();

// Display in profile:
// ⚔️ WaveWarZ: 8W-3L (73%) | 2.4 SOL volume | 0.18 SOL earned
```

### 3.7 Recruitment Flow

When an artist hits Rising Star (3+ wins) and has no `zao_fid` linked:

1. Check if they have a Farcaster username (searchable via Neynar by wallet address)
2. If found: send Farcaster DM via `@thezao` account — "Hey [Artist], your WaveWarZ battle performance is impressive. ZAO is a decentralized music community for independent artists. Join us at zaoos.com"
3. If not on Farcaster: skip (XMTP requires prior opt-in — can't cold DM)
4. When artist joins ZAO and links their Solana wallet → auto-match to `wavewarz_artists` record

---

## Part 4: API Routes

### `GET /api/wavewarz/artists`
Returns artist leaderboard (sort by wins, volume, win_rate, earnings).

```typescript
// Params: ?sort=wins&limit=20&linked_only=false
// linked_only=true returns only artists who have ZAO accounts
```

### `GET /api/wavewarz/artists/[wallet]`
Returns full stats for a single artist by Solana wallet address.

### `GET /api/wavewarz/battles`
Returns recent battle log (paginated).

### `POST /api/wavewarz/sync`
Internal cron endpoint — syncs latest battle data.

### `GET /api/users/[fid]/wavewarz`
Returns WaveWarZ stats for a specific ZAO member (if their Solana wallet is linked).

---

## Part 5: ZAO-Run Battles (Governance Synergy)

### 5.1 Concept

ZAO can run **its own community battles** using WaveWarZ mechanics + ZAO governance:

1. **Song submission** — ZAO members submit tracks via the existing SongSubmit component
2. **Community vote** — Battle proposed in governance (existing ORDAO module), ZAO members vote with their Respect score
3. **Winner selection** — Determined by Respect-weighted vote (not SOL — ZAO isn't a casino)
4. **Result published** — Auto-cast to `/zao` and `/wavewarz` Farcaster channels
5. **Artist spotlight** — Winner gets cross-posted to @thezao Bluesky + Farcaster

**This is distinct from WaveWarZ** — no SOL staking, no parimutuel pools. It's a community curation event using ZAO's governance infrastructure.

### 5.2 Governance Battle Flow

```
Proposal: "Community Battle: [Song A] vs [Song B]"
  ↓ ORDAO vote (Respect-weighted, 7-day window)
  ↓ Quorum reached → result determined
  ↓ Winner auto-cast via @thezao (existing governance publishing)
  ↓ Cross-posted: Farcaster + Bluesky + optional WaveWarZ main event nomination
```

**Future hook:** When ZAO runs a community battle and the winner is clearly exceptional, nominate them for a WaveWarZ Main Event (via direct outreach to Ikechi). Creates a talent pipeline: ZAO Community Battle → WaveWarZ Main Event → broader exposure.

---

## Part 6: Dependencies & Environment Variables

### Required Packages

| Package | Status | Purpose |
|---------|--------|---------|
| `@solana/web3.js@1` | Already installed | RPC connection, PDA reads |
| `@solana/buffer-layout` | Needs install | Battle Vault deserialization |
| `@solana/buffer-layout-utils` | Needs install | Buffer helpers |

### Environment Variables to Add

```bash
HELIUS_API_KEY=           # Helius free tier — 1M credits/mo, sign up at helius.dev
CRON_SECRET=              # Secret for verifying internal cron calls
```

### Helius Free Tier

| Limit | Value |
|-------|-------|
| Credits | 1M/month |
| Rate limit | 10 RPS |
| getProgramAccounts | 5/sec |
| Cost | $0 |
| Sign up | helius.dev |

---

## Part 7: Implementation Roadmap

### Phase 1 — Data Foundation (Days 1–3)

| Day | Task |
|-----|------|
| 1 | Create `wavewarz_artists` + `wavewarz_battle_log` Supabase tables with RLS |
| 2 | Contact Ikechi (X @WaveWarZ) — share the integration plan, request program ID + API access |
| 3 | Build `/api/wavewarz/sync` with Vercel cron. Initially: seed all 43 known artists from Intelligence dashboard manually |

### Phase 2 — Live Data Sync (Days 4–5)

| Day | Task |
|-----|------|
| 4 | Wire up Helius RPC (or Intelligence API) for nightly battle sync |
| 5 | Test sync: verify artist stats update correctly, duplicate detection via `battle_id` |

### Phase 3 — User-Facing Features (Days 6–8)

| Day | Task |
|-----|------|
| 6 | Build `GET /api/wavewarz/artists` + WaveWarZ leaderboard component in ZAO feed |
| 7 | Profile enrichment: show WaveWarZ stats in ProfileDrawer for linked Solana wallets |
| 8 | Spotlight auto-casts: wire threshold checks into sync cron |

### Phase 4 — Recruitment (Days 9–10)

| Day | Task |
|-----|------|
| 9 | Build recruitment logic: check Farcaster username via Neynar for top unlinked artists |
| 10 | Draft DM template, test with 2–3 Rising Star artists |

### Phase 5 — Community Battles (Future)

| Task | Dependency |
|------|-----------|
| ZAO Community Battle governance flow | Requires Phase 1–4 complete + WaveWarZ team relationship |
| Submit ZAO battle winners to WaveWarZ Main Event | Requires Phase 1–4 + direct WaveWarZ API access |

---

## Part 8: Known Gaps & Open Questions

| Question | Status | Notes |
|----------|--------|-------|
| **Complete artist name→wallet mapping** | ✅ RESOLVED | All 43 wallets mapped in section 1.5 above |
| **WaveWarZ on Farcaster** | ✅ RESOLVED | No presence — X/Twitter only (@WaveWarZ) |
| **Community chat (Discord/Telegram)** | ✅ RESOLVED | None found — community runs on X Spaces (Mon-Fri 8:30 PM EST) |
| **Trader leaderboard data** | ✅ RESOLVED | Shows "No Trade Data Yet" — feature not yet live |
| **Kata7yst wallet address** | ⚠️ Unknown | Active artist not in original 43-wallet list — may be newer entrant; not on Intelligence yet |
| **BennyJ504 wallet address** | ⚠️ Unknown | Active artist (featured in 4 Kata7yst battles) — not in original 43-wallet list |
| **DCoopOfficial wallet address** | ⚠️ Unknown | Active artist — not in original 43-wallet list |
| **WaveWarZ Solana program ID** | ❌ Unknown | Solscan tx inspection (doc 100) or ask Ikechi (@WaveWarZ on X) |
| **Intelligence dashboard API structure** | ❌ Unknown | Browser DevTools Network tab needed |
| **WaveWarZ webhook/API for real-time** | ❌ Unknown | Ask Ikechi — no public API documented |
| **Anchor IDL / account layout** | ❌ Unknown | Ask Ikechi for IDL file |
| **Analytics site data source** | ❌ Unknown | Built on Recharts + Supabase, client-side only |
| **Hurric4n3Ike "wallet A" identity** | ⚠️ Note | 62g5hYiST wallet (60W-18L) — this is likely Ikechi's main competitive wallet, not just his profile wallet. He may be both founder AND most-active battler by battles-per-wallet |

---

## Part 9: Competitive Context

**Why this works now:**

- WaveWarZ is 6 months old, growing (647 battles, $38K volume)
- No major platform has integrated WaveWarZ yet — ZAO can be first-mover
- WaveWarZ needs community depth; ZAO needs artist discovery pipeline
- Ikechi is a solo founder — partnership value is disproportionately high vs effort
- ZAO's `/wavewarz` embed already signals commitment; the ask is a natural next step

**Risk:** WaveWarZ is a small platform. If it stalls, the pipeline stalls. Mitigation: the `wavewarz_artists` table design is generic enough to extend to other battle platforms later.

---

## Part 10: GitHub & Source Code Intelligence (NEW — March 21, 2026)

### 10.1 Development Organization: CandyToyBox

All WaveWarZ repos are owned by **CandyToyBox** on GitHub (16 repos, TypeScript-dominant). Hurric4n3Ike (Ikechi) has a separate GitHub with 4 repos.

**CandyToyBox Repos (sorted by relevance):**

| Repo | Description | Updated |
|------|-------------|---------|
| `wavewarz-intelligence` | Analytics dashboard (deployed at wavewarz-intelligence.vercel.app) | Mar 17, 2026 |
| `wavewarz-base` | **Base L2 smart contracts** (Solidity/Foundry, 8/8 tests passing) | Feb 27, 2026 |
| `analytics-wave-warz` | Charts dashboard (Recharts + Supabase) | Feb 28, 2026 |
| `homepage-redesign` | wavewarz.com frontend | Feb 22, 2026 |
| `wavewarz-merch-shop` | "Agentic Merch Shop" (AI agent-powered merch) | Feb 20, 2026 |
| `Dashboard_wallet_checker` | The Claim Tool (wallet scanner) | Feb 1, 2026 |
| `streamvoter` | Voting app (earlier experiment) | Oct 2, 2025 |
| `MusicToken` | Token contract (earlier experiment) | May 26, 2025 |
| `onchain-commerce-zao` | Fork of Coinbase commerce template (name coincidence, no ZAO connection) | Feb 14, 2025 |

**Hurric4n3Ike's Repos:**

| Repo | Description |
|------|-------------|
| `BlinkBattlesimages` | Image assets for WaveWarZ BlinkBattles |
| `zoundz` | **ZoundZ** — 1/1 NFT marketplace mini-app (Solidity) |
| `rpc-proxy` | RPC proxy (TypeScript) |
| `Myfans` | Fan site ("super dope website in a box") |

### 10.2 CRITICAL FINDING: WaveWarZ Is Going Multi-Chain (Base L2)

**`wavewarz-base`** is a NEW version of WaveWarZ deployed on **Ethereum Base L2** (testnet: Base Sepolia).

**Base L2 Contract:** `0xe28709DF5c77eD096f386510240A4118848c1098` (Base Sepolia testnet)

**Smart Contract Architecture (5 Solidity files):**

| File | Purpose |
|------|---------|
| `WaveWarzBase.sol` | Core battle mechanics (initialization, settlement, claiming) |
| `EphemeralBattleToken.sol` | Temporary tokens minted per-battle — destroyed after settlement |
| `WaveWarzMarketplace.sol` | Marketplace for buying/selling battle positions |
| `WaveWarzMusicNFT.sol` | Music NFT contract (new — not in Solana version) |
| `IWaveWarzBase.sol` | Interface definition |

**Bonding Curve Math (from WaveWarzBase.sol):**
- **Buy price:** √x integral → `(2/3)(b^(3/2) - a^(3/2))` — price increases as more tokens are bought
- **Sell return:** Same integral formula in reverse
- Uses Babylonian method for √ and Newton's method for ∛
- Payment: WETH (`0x4200000000000000000000000000000000000006`) or ETH

**What this means for ZAO:**
- WaveWarZ is building EVM compatibility — ZAO already lives on EVM chains (Optimism for Respect tokens)
- When wavewarz-base goes to Base mainnet, ZAO could interact with battle contracts directly from the same wallet users already connect
- The EphemeralBattleToken pattern is interesting — tokens that exist only during a battle, creating scarcity and FOMO
- Music NFT contract suggests WaveWarZ will eventually mint battle-related NFTs — ZAO could display these in member profiles

### 10.3 Intelligence Dashboard Supabase Schema

The `supabase-migrations.sql` from wavewarz-intelligence reveals a **minimal schema**:

| Table | Purpose |
|-------|---------|
| `platform_events` | Recurring broadcast schedule (X Spaces, AMAs) |
| `calendar_events` | One-off events (battles, community events) |
| `platform_stats` | Spotify metrics (singleton row) |

**Critical finding: The actual battle/artist data is NOT in this Supabase project.** The Intelligence dashboard likely reads battle data from:
1. A separate Supabase project (the main WaveWarZ backend)
2. Direct Solana RPC reads (Battle Vault PDAs)
3. An internal API not exposed in the open-source Intelligence repo

**Impact on ZAO integration:** We cannot simply "query their Supabase." Our options remain:
1. **Ask Ikechi for API access** (priority — approach via X @WaveWarZ)
2. **Scrape Intelligence dashboard pages** (fallback — artist URLs are predictable: `/artist/[WALLET]`)
3. **Read Solana PDAs directly** (requires program ID — still unknown)
4. **Wait for Base L2 mainnet** (then read EVM contracts directly with Wagmi/Viem — already in our stack)

### 10.4 Artist Social Profiles (Recruitment Intelligence)

Research found social profiles for key artists — these are outreach channels:

| Artist | Platforms Found |
|--------|----------------|
| **APORKALYPSE** | SoundCloud, Instagram (@aporkalypsenownola), Apple Music, Facebook, X (@Aporkalypse504) |
| **Hurric4n3Ike** | BeatStars (hurric4n3ike.beatstars.com), Spotify (FireWavez), X (@hurric4n3ike), GitHub |
| **LUI** | SoundCloud (luijoseph), Instagram (@LuiJoseph__), email: LUIJOSEPHIII@gmail.com |
| **STILO English** | SoundCloud (stilosd — Suspekt Stilo), official site (stilosd.com), iTunes |
| **BennyJ504** | X (@bennyj504) |
| **DCoopOfficial** | Linked to Coop Records on Farcaster (onchain record label — github.com/Coop-Records/sonata) |
| **Kata7yst** | No profiles found — very new or pseudonymous |
| **PROF!T** | Possibly Prof (profgampo.com) — established Minneapolis rapper, not confirmed |

**DCoopOfficial → Coop Records** is a notable connection — Coop Records runs **Sonata**, an open-source Farcaster music client (MIT license). This could be a Farcaster-native recruitment path.

### 10.5 ZoundZ — Hurric4n3Ike's NFT Marketplace

Ikechi's `zoundz` repo is a **1/1 NFT marketplace mini-app** written in Solidity. This suggests WaveWarZ may eventually integrate NFT minting for battle winners — and ZAO could display these "battle winner NFTs" in member profiles alongside Respect tokens.

### 10.6 Revised Integration Strategy

Given the GitHub findings, the integration strategy shifts:

| Before (assumption) | After (reality) |
|---------------------|-----------------|
| Read battle data from Solana PDAs | Solana program ID unknown; Intelligence dashboard reads from separate backend |
| Intelligence has full Supabase schema | Intelligence Supabase only has events/calendar — battle data is elsewhere |
| WaveWarZ is Solana-only | WaveWarZ is going multi-chain (Base L2 in development) |
| No open-source code available | 16 repos on CandyToyBox, contract code readable |
| Contact only via X | GitHub PRs/issues also possible on CandyToyBox repos |

**Revised priority:**
1. **Contact Ikechi** via X @WaveWarZ AND GitHub @hurric4n3ike — share our integration plan, request API access
2. **Pre-seed artist data** from the 43 wallet mappings we already have (section 1.5)
3. **Build scraper** for Intelligence artist pages as interim data source
4. **Monitor wavewarz-base** — when it hits Base mainnet, we can read battle data natively via Wagmi/Viem (already in ZAO's stack)
5. **Explore DCoopOfficial → Coop Records** as a Farcaster-native recruitment channel

---

## Sources

### WaveWarZ Platform
- [WaveWarZ Main App](https://www.wavewarz.com/) — PWA, founder: Ikechi Nwachukwu (Hurric4n3Ike)
- [WaveWarZ Intelligence](https://wavewarz-intelligence.vercel.app/) — Battle history (647), artist profiles (43), 5 leaderboard types, claim tool
- [WaveWarZ Analytics](https://analytics-wave-warz.vercel.app/) — Recharts + Supabase charts dashboard
- [WaveWarZ on X/Twitter](https://x.com/WaveWarZ) — Primary community channel
- [Ikechi Nwachukwu LinkedIn](https://www.linkedin.com/in/ikechi-nwachukwu/)
- [WaveWarZ Charity Battle Recap](https://x.com/WaveWarZ/status/1999858390567117201) — $270 raised for PolyRaiders

### GitHub Repositories (CandyToyBox — 16 repos)
- [CandyToyBox GitHub](https://github.com/CandyToyBox) — Development org for all WaveWarZ tools
- [wavewarz-intelligence](https://github.com/CandyToyBox/wavewarz-intelligence) — Open-source analytics dashboard (Next.js + Supabase)
- [wavewarz-base](https://github.com/CandyToyBox/wavewarz-base) — **Base L2 smart contracts** (Solidity/Foundry, 5 contracts, 8/8 tests passing)
- [analytics-wave-warz](https://github.com/CandyToyBox/analytics-wave-warz) — Charts dashboard source
- [wavewarz-merch-shop](https://github.com/CandyToyBox/wavewarz-merch-shop) — Agentic merch shop
- [hurric4n3ike GitHub](https://github.com/hurric4n3ike) — Ikechi's personal repos (BlinkBattlesimages, zoundz NFT marketplace)

### Base L2 Contract
- Contract address: `0xe28709DF5c77eD096f386510240A4118848c1098` (Base Sepolia testnet)
- [WaveWarzBase.sol source](https://github.com/CandyToyBox/wavewarz-base/tree/main/contracts/src)
- Bonding curve: √x integral, EphemeralBattleToken pattern, WETH payments

### Artist Social Profiles
- [APORKALYPSE on SoundCloud](https://soundcloud.com/aporkalypse-now), [Apple Music](https://music.apple.com/us/artist/aporkalypse-now/1633048308), [Instagram](https://www.instagram.com/aporkalypsenownola/)
- [Hurric4n3Ike on BeatStars](https://hurric4n3ike.beatstars.com/), [Spotify](https://open.spotify.com/album/6bD7Rt5eoh3BK0YDyKMVYr)
- [LUI on SoundCloud](https://soundcloud.com/luijoseph), [Instagram](https://www.instagram.com/_luithe1st/)
- [Suspekt Stilo (STILO English)](https://www.stilosd.com/music), [SoundCloud](https://soundcloud.com/stilosd)
- [Coop Records/Sonata](https://github.com/Coop-Records/sonata) — DCoopOfficial connection, Farcaster music client

### ZAO OS
- Research: Doc 95 (Solana wallet), Doc 96 (WaveWarZ deep dive), Doc 97 (Artist Discovery Pipeline), Doc 99 (Prediction markets), Doc 100 (Solana PDA reading)
- Codebase: `src/app/(auth)/wavewarz/`, `src/lib/solana/config.ts`, `src/app/api/users/solana-wallet/`, `community.config.ts`
