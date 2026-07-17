---
topic: wavewarz
type: product-research
status: research-complete
last-validated: 2026-07-17
related-docs: 974, 1075, 1076, 1077, 101
original-query: "Document wwtracker as ZAO's public analytics infrastructure for WaveWarZ — capabilities, data it surfaces, and how it makes ZAO IP measurable and citable"
tier: STANDARD
---

# 1078 — wwtracker: ZAO's Public Analytics Layer for WaveWarZ

> **Purpose:** Document the wwtracker tool as proof-of-ZAO-capability — a publicly accessible analytics dashboard that makes WaveWarZ battle economics, artist performance, and platform growth measurable, citable, and explorable by anyone. This is an artefact of ZAO IP in practice.

## One-Paragraph Summary

wwtracker (`wavewarz.info/tracker` — internal repo: `wwtracker`) is a Next.js / Vercel analytics dashboard built on top of the WaveWarZ Solana battle program (`9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo`). It ingests a battle snapshot (`ww-battles.json`, currently 1,107 battles) and the live stats API to surface artist rankings, song-level leaderboards, H2H rivalries, battle-type breakdowns, platform growth charts, and per-artist profile pages with Audius integration. The tool was built entirely within ZAO's cowork sprints and demonstrates the ZAO's capacity to ship production analytics tooling on Solana — a citable, living proof point for grant applications, DAO case studies, and press.

---

## 1. Data sources

| Source | Access | What it provides |
|---|---|---|
| `GET https://wavewarz.info/api/public/stats` | Public, no auth, 60s cache | Live aggregate stats (battles, volume, payouts, SOL price, 24h/7d vol) |
| `GET https://wavewarz-intelligence.vercel.app/battles` | Public, no auth | Full per-battle JSON feed (1,107 battles as of 2026-07-17) |
| Audius API (`api.audius.co`) | Public, no auth | Artist profiles, follower counts, top tracks with embed players |
| `lib/leaderboard.ts` | Static, in-repo | 12 artist leaderboard entries with main-event records + earnings |
| `lib/songs.ts` | Static, in-repo | Song-level charting data keyed by artist handle |
| `lib/artists.ts` | Static, in-repo | 37-artist ROSTER with Audius IDs, handles, and role notes |

**Battle data snapshot (2026-07-17):**

| Metric | Value |
|---|---|
| Total battles in JSON | **1,107** |
| Battles with handle data | **~140** (June 2026 onward) |
| Unique song titles | **921+** |
| Unique handles (tracked) | **27** |
| Handle-populated pairs (H2H) | **82 battles** across **15 rivalry pairs (≥2 meetings)** |

---

## 2. Live stats snapshot (2026-07-17)

From `GET https://wavewarz.info/api/public/stats`:

| Metric | Value |
|---|---|
| Total battles | **1,245** (1,047 quick + 162 main-event + 36 community) |
| Main events held | **50** |
| Lifetime volume | **522.23 SOL** (~$38,935 at $74.56/SOL) |
| Artist payouts (automatic, onchain) | **9.05 SOL** |
| Platform revenue | **17.43 SOL** |
| Trader claims paid | **127.34 SOL** (939 withdrawals) |
| 24h volume | **0.50 SOL** |
| 7d volume | **12.09 SOL** |
| SOL price at snapshot | **$74.56** |

---

## 3. Analytics modules

### 3.1 BattleArena (handle rankings + streak)
Aggregates all battles with `aHandle`/`bHandle` populated into per-handle stats: total battles, wins, losses, win %, cumulative volume, and current streak. Streak algorithm walks battles newest-first and counts the current consecutive W or L run. 27 handles tracked; GodclouD leads with 8-0 vs RoCkY2GriMeY (top H2H domination).

**Leaderboard columns:** `# | HANDLE | BATTLES | W | L | WIN % | VOLUME ◎ | STREAK`

### 3.2 SongArena
Song-level analytics: songs ranked by battle performance, heat scores, and genre tags. Drawn from `lib/songs.ts` and cross-referenced with handle data. Artists with charting songs see them surfaced on their profile pages.

### 3.3 Artist profile pages (`/artist/[handle]`)
Per-handle pages combining:
- Audius profile avatar, follower count, track count (live from Audius API)
- Top 4 tracks with embedded Audius players
- Leaderboard stats: main-event record, win %, volume, earnings
- All-battles record and current streak (from ww-battles.json)
- Battle history table (default 20 rows, expandable) with date, opponent, song, vol, W/L
- Charting songs from SongArena
- Artist role note (e.g. "BetterCallZaal - ZAO head of ecosystem")

37 artists in ROSTER; 27 with battle data; Audius-linked artists get live embeds.

### 3.4 RivalryBoard
Computes H2H records for all pairs with ≥2 cross-handle meetings. Filters same-handle battles. 15 active rivalries as of 2026-07-17. Each card shows: HANDLE A vs HANDLE B, total meetings, per-side W/L, total volume, last battle date, SWEEP badge when one side holds a perfect record.

Top rivalry: **GodclouD 8-0 RoCkY2GriMeY** (8 battles, purple SWEEP badge).

### 3.5 BiggestBattles (top 25 by volume)
Sorted descending by `vol`. Shows battle type, date, song A vs song B (winner in green bold), and volume. Summary cards break down volume and battle count by type:

| Type | Battles (in top-25) | Volume |
|---|---|---|
| MAIN | 39 (platform total: 162) | 264 SOL (70% of tracked vol) |
| QUICK | 1,026 | 95.66 SOL |
| COMMUNITY | 24 | 15.33 SOL |

Biggest single battle: ItzWonderfull vs STILOWORLD, **48.73 SOL** (STILOWORLD won).

### 3.6 PlatformGrowth (monthly/daily volume charts)
Cumulative area chart + daily bar chart of WaveWarZ volume, decoded on-chain from Dune (program `9TUf`). Toggle: BUY-SIDE (exact) or BOTH-SIDES (estimated via ~0.49 sell:buy ratio while paid Dune tier is pending). Also includes day-of-week breakdown: **Monday = main events day** (213 SOL from 46 battles, avg 4.6 SOL/battle vs weekday avg 0.09-0.13).

### 3.7 LiveTicker
Polls `wavewarz.info/api/public/stats` every 60 seconds. Renders: SOL price ($USD), 24h volume (◎), 7d volume (◎), total battles, last-updated-ago. Green **● LIVE** badge when a live battle is in progress. Renders nothing until first load.

### 3.8 RecentBattlesFeed
Fetches `ww-battles.json` on mount, renders the 10 most-recent battles (newest-first). Each row: TYPE badge (color-coded) | date | SONG A | vs | SONG B | vol. Winner shown in bold green. If handle data is present, song titles link to `/artist/<handle>`. "see all →" links to the full battles section.

### 3.9 Leaderboard (main-event leaderboard)
12 artists with curated main-event records, win %, volume, and SOL earnings. Sortable, searchable. The static source of truth for top performers.

### 3.10 FAQ + Platform overview pages
Consolidated FAQ covering: what WaveWarZ is, how battles work, floor price (3.5 SOL for main events), how earnings flow (artist gets fee regardless of outcome; trader claims come from the correct-side pool), battle types (QUICK 0.01+ SOL entry, MAIN 3.5+ SOL, COMMUNITY 0.05+ SOL).

---

## 4. Architecture

```
wwtracker/
├── app/
│   ├── page.tsx              # Home: FreshnessBanner + LiveTicker + RecentBattlesFeed + AppShell
│   └── artist/[handle]/      # Per-artist page
├── components/
│   ├── AppShell.tsx          # Tab router (battles/songs/artists/growth/about)
│   ├── BattleArena.tsx       # Handle rankings + streak
│   ├── SongArena.tsx         # Song leaderboard
│   ├── Leaderboard.tsx       # Main-event leaderboard
│   ├── RivalryBoard.tsx      # H2H rivalry cards
│   ├── BiggestBattles.tsx    # Top 25 battles + type stats
│   ├── PlatformGrowth.tsx    # Cumulative/daily charts + DoW breakdown
│   ├── LiveTicker.tsx        # 60s-polling stats bar
│   └── RecentBattlesFeed.tsx # 10 most-recent battles
├── lib/
│   ├── artists.ts            # 37-artist ROSTER + AUDIUS_ID_BY_HANDLE
│   ├── battles.ts            # Aggregate stats snapshot (updated 2026-07-17)
│   ├── leaderboard.ts        # 12-artist static leaderboard
│   ├── songs.ts              # Song-level charting data
│   └── config.ts             # FLOOR_SOL = 3.5
└── public/
    └── ww-battles.json       # 1,107 battles (refreshed via npm run fetch:battles)
```

**Stack:** Next.js 14 (App Router) · TypeScript · Vercel deployment · Recharts for charts · Audius public API · no backend required (data is public).

**Battle refresh:** `npm run fetch:battles` hits `https://wavewarz-intelligence.vercel.app/battles` (public, no API key). +18 battles added in the 2026-07-17 refresh.

---

## 5. Key analytical insights surfaced

**Battle economics by type:**

| Type | Count | Volume | Avg/battle | % of volume |
|---|---|---|---|---|
| MAIN | 39 (handle-tracked) | 264 SOL | 6.78 SOL | ~70% |
| QUICK | 1,026 | 95.66 SOL | 0.09 SOL | ~25% |
| COMMUNITY | 24 | 15.33 SOL | 0.64 SOL | ~4% |

**Day-of-week patterns:**

| Day | Battles | Volume | Avg SOL/battle |
|---|---|---|---|
| **Monday** | **46** | **213 SOL** | **4.63** |
| Tuesday | — | — | ~0.13 |
| Wednesday | — | — | ~0.11 |
| Thursday | — | — | ~0.09 |
| Friday | — | — | ~0.10 |
| Saturday | — | — | ~0.12 |
| Sunday | — | — | ~0.09 |

Monday is main-events day — ~50× the avg daily volume of other days.

**Current streaks (2026-07-17):**

| Handle | Streak |
|---|---|
| godcloud | W3 |
| stormbourne | W2 |
| luiwrites | W2 |
| rocky2grimey | L4 |
| cannonjones973 | L2 |

---

## 6. NORTH STAR alignment

**ZAO = THE case study of a successful DAO**

wwtracker is the measurement instrument that converts WaveWarZ activity into citable, verifiable numbers. Every stat in [Doc 1077](../1077-zao-dao-case-study-jul2026/) under "Product traction" is pullable from the live API that wwtracker displays. The tool makes the DAO's product activity:

- **Verifiable** — data comes from a public on-chain program; anyone can cross-check
- **Explorable** — journalists, researchers, or grant reviewers can explore artist-level detail, not just headline numbers
- **Current** — LiveTicker + the battles JSON refresh script keep it within hours of on-chain state
- **Persistent** — hosted on Vercel; does not require Zaal or any ZAO member to be present to answer questions about the platform

**ZAO IP = a staple in onchain art, music, and culture**

Artist profile pages link the Audius music identity (follower counts, playable track embeds) directly to on-chain battle performance. For any ZAO artist who battles on WaveWarZ, wwtracker becomes a portfolio page: a proof of the intersection of their music career and onchain activity. This is ZAO IP made visible and linkable.

**Grant / press citation pattern:**
> "WaveWarZ has run 1,245 battles and generated 522 SOL in lifetime volume since August 2025. You can explore artist-level performance, H2H rivalries, and cumulative growth at [wwtracker URL]. Data updates in real time from the Solana program."

---

## 7. Open questions / next work

- **PRs #38-#103** await merge into main — all the analytics modules above are in open PRs, not yet live at the public URL
- **FLOOR_SOL update**: current code exports 3.5; confirm if this has changed recently
- **Dune paid tier**: would unlock exact sell-side per-day volume (the free tier hits the 2-min execution cap on the `sellShares` join); toggle currently shows estimated both-sides
- **Supabase / Helius API keys**: blocked; would enable per-transaction history and richer battle data
- **Handle coverage**: only ~140 of 1,107 battles have handle data (June 2026 onward); earlier battles have song titles only
- **Mobile layout**: wwtracker is desktop-optimized; a responsive pass would widen the audience

---

## 8. References

| Doc | Topic |
|---|---|
| [974](../974-wavewarz-financials-snapshot-2026-07/) | WaveWarZ financials snapshot, July 2026 |
| [1075](../1075-wavewarz-growth/) | WaveWarZ growth metrics |
| [1076](../1076-wavewarz-estate-audit/) | WaveWarZ estate audit |
| [1077](../1077-zao-dao-case-study-jul2026/) | ZAO DAO case study, July 2026 |
| [101](../101-wavewarz-zao-whitepaper/) | WaveWarZ + ZAO whitepaper |
| [099](../099-prediction-market-music-battles/) | Prediction market music battles background |
