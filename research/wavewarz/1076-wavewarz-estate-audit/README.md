# 1076 — WaveWarZ Estate Audit (Public Repos Only)

**Date:** 2026-07-16  
**Scope:** Every PUBLIC repo that touches WaveWarZ — bettercallzaal, CandyToyBox, hurric4n3ike.  
**Rule:** Only public repos audited. Each confirmed via `gh api repos/<owner>/<name> --jq .private` = false before reading.  
**Verdict at bottom.**

---

## 1. Full repo inventory (public, WaveWarZ-adjacent)

### bettercallzaal

| Repo | Visibility | Last commit | Role |
|---|---|---|---|
| `wwtracker` | public | 2026-07-16 | Fan-facing analytics tracker (Dune data, Zaal's trades, Audius music, overlay) |
| `wavewarz-overlay` | public | 2026-07-04 | OBS/Restream lower-third overlay for live battles |
| `wavewarzapp` | public | 2026-06-16 | Mobile companion app (React Native/Expo) — demo phase, mock data, no real auth |
| `wwbase` | public | 2026-06-16 | Base L2 builder brief / co-founder pitch deck (doc only, not a live app) |
| `ZAOOS` | public | 2026-07-16 | ZAO OS — has `src/app/(auth)/wavewarz/` pages: 43-artist roster, nightly syncs, Farcaster share, DAO proposal drafts from battle milestones |
| `zaalcaster` | public | 2026-07-16 | Farcaster client — active dev (SPARKZ Stage 1 today), 4 open PRs; not WaveWarZ-specific but surface overlaps (Farcaster share) |
| `bcz-journal` | public | 2026-05-22 | Public build journal — mentions WaveWarZ in description, no WaveWarZ-specific code |

### CandyToyBox (candy / Samantha Kinney)

| Repo | Visibility | Last commit | Role |
|---|---|---|---|
| `wavewarz-intelligence` | **public** | **2026-07-16** | **THE canonical analytics platform** — serves wavewarz.info + `/api/public/stats`; live-battle detection added today |
| `analytics-wave-warz` | public | 2026-01-07 | Generation 3 stats app (last before intelligence); real-time TVL, settlement simulator, leaderboard. 4 open issues. Effectively superseded. |
| `V2-Stats-App-WaveWarz` | public | 2025-11-23 | Generation 2 stats app — artist/trader leaderboard. Stale. |
| `WaveWarz-Stats-App` | public | 2025-11-22 | Generation 1 stats app. Stale. |
| `homepage-redesign` | public | 2026-01-27 | Candy's wavewarz.com homepage redesign (1 open issue, appears abandoned) |
| `wavewarz-base` | public | 2026-05-15 | Base L2 companion brief (BRIEF.md) — similar scope to bettercallzaal/wwbase |
| `wavewarz-merch-shop` | public | 2026-02-20 | Agentic merch shop (initial commit only, Next.js shell, never shipped) |

### hurric4n3ike (Hurricane, founder)

| Repo | Visibility | Last commit | Role |
|---|---|---|---|
| `wavewarzhomepagev` | public | 2026-05-10 | Homepage v2 — Next.js + Privy wallet login; appears to be the live wavewarz.com front page |
| `wavewarzhomepage` | public | 2026-05-03 | Homepage v1 (Next.js, pre-Privy) — superseded by wavewarzhomepagev |
| `BlinkBattlesimages` | public | 2024-11-21 | Static image assets for Blink battles — very stale |
| `rpc-proxy` | public | 2025-07-30 | Solana RPC proxy — supporting infra, stale |

**Skipped — private (visibility confirmed before access):**  
- `hurric4n3ike/wavewagerz` — private (confirmed private, contains the on-chain program + IDL)

---

## 2. Per-repo assessment

### `CandyToyBox/wavewarz-intelligence` ★ CANONICAL
**What it is:** The live analytics platform behind `wavewarz.info`. TypeScript/Next.js. Added live-battle detection + volume windows to public stats API TODAY (2026-07-16). Helius as the RPC backend.  
**Best in it:** The `/api/public/stats` endpoint (open CORS, 60 s cache, no auth) is the correct integration target for any consumer (wwtracker, wavewarz.com, ZAOOS). Volume calculation methodology documented in README — the only correct approach (parse BUY/SELL instructions from vault PDA history; the old `backfill-volume.ts` approach was wrong and corrupted pre-2026-04-27 data).  
**Broken/stale:** Old candy stats apps (`analytics-wave-warz`, `V2-Stats-App-WaveWarz`, `WaveWarz-Stats-App`) still live as public repos — they duplicate the problem space but have stale data and are effectively dead. The `analytics-wave-warz` repo has 4 open issues, no recent commits (Jan 2026).

### `bettercallzaal/wwtracker` ★ ACTIVE
**What it is:** This repo. Fan-facing Next.js analytics dashboard. Dune-powered on-chain data (snapshot model), Zaal's personal trade tracker, Audius music tab, overlay page. Recent active dev (7 PRs in the last 2 days).  
**Best in it:** Dune snapshot data (122 unique traders, instruction decode, treasury analytics), Audius artist/track verification logic, the smoke test suite against the live stats API (new today, PR #38).  
**Overlap:** The wwtracker Dune snapshot data is staler than wavewarz.info's live Helius data. The two complement each other: wwtracker = depth/history via Dune; intelligence = live/realtime via Helius.

### `bettercallzaal/ZAOOS` — ACTIVE (wavewarz surface)
**What it is:** The ZAO's OS — a gated platform for the 188-member ZAO community. Has a WaveWarZ section (`src/app/(auth)/wavewarz/`): 43-artist roster, nightly syncs, Farcaster share button, DAO proposal auto-drafts from battle milestones.  
**Best in it:** The 43-artist roster and nightly sync is independently maintained data that could be cross-checked against wwtracker's leaderboard for coverage gaps. The DAO proposal auto-draft is unique — no other repo does this.  
**Overlap:** The ZAOOS wavewarz pages duplicate some analytics from wavewarz.info. Whether they pull from the `/api/public/stats` endpoint or their own scraper needs checking (likely their own scraper per the `src/lib/wavewarz/scraper` reference).

### `bettercallzaal/wavewarz-overlay` — ACTIVE (maintenance mode)
**What it is:** Browser-source overlay for OBS/Restream showing "Now battling" lower-third. Pulls from `ww-lifetime.json` (total SOL traded since launch stat). Updated 2026-07-04 with the lifetime-SOL-traded stat.  
**Best in it:** Zero-dependency static page, easily embeddable in any stream. The lifetime-SOL-traded number keeps it fresh.  
**Gap:** Hardcoded/JSON-based stats rather than pulling from the live `/api/public/stats` endpoint — would auto-update if wired to the API.

### `bettercallzaal/wavewarzapp` — DEMO PHASE
**What it is:** React Native/Expo mobile companion. Notification layer + spectator view + Town Square chat. "Demo phase — in-memory mock data, no real auth, no FCM, no Cloud Functions."  
**Best in it:** The architecture (Expo + Zustand + Tamagui) and the Phantom wallet deep-link/sig verification pattern are solid groundwork for when real infra is ready.  
**Broken/stale:** Nothing live. Firebase FCM, Cloud Functions, Firestore are all V1 placeholder. Last commit June 16 — no activity in a month.

### `bettercallzaal/wwbase` + `CandyToyBox/wavewarz-base` — PITCH DOCS
Both are public co-founder pitch briefs for the Base L2 version of WaveWarZ. They overlap in content (same mechanics, same "looking for a technical co-founder" pitch). wwbase is bettercallzaal's version; `wavewarz-base` is candy's with a `BRIEF.md`. Both are static doc repos, not live apps.

### `hurric4n3ike/wavewarzhomepagev` — LIKELY wavewarz.com
**What it is:** Next.js app with Privy wallet login, last commit "Fix social links and hide About footer section" (2026-05-10). This is almost certainly the live `wavewarz.com` homepage — Hurricane's territory.  
**Gap:** No `/api/public/stats` integration visible from the public commit history — the "stats ticker" and "live battle pin" don't appear to be wired yet. This is what the WAVEWARZ_STATS_API_FOR_HURRICANE.md handoff doc (PR #38 in wwtracker) addresses.

### Stale / superseded repos (actionable: archive candidates)
| Repo | Status | Recommended action |
|---|---|---|
| `CandyToyBox/analytics-wave-warz` | 4 open issues, 6 months stale | Candy: archive; consumers should use wavewarz.info |
| `CandyToyBox/V2-Stats-App-WaveWarz` | 8 months stale | Candy: archive |
| `CandyToyBox/WaveWarz-Stats-App` | 8 months stale | Candy: archive |
| `CandyToyBox/homepage-redesign` | 6 months stale, 1 open issue | Candy: close issue, archive |
| `CandyToyBox/wavewarz-merch-shop` | Initial commit only, never shipped | Candy: archive or delete |
| `hurric4n3ike/wavewarzhomepage` | Superseded by wavewarzhomepagev | Hurricane: archive |
| `hurric4n3ike/BlinkBattlesimages` | 2024-11-21, very stale | Hurricane: archive |
| `hurric4n3ike/rpc-proxy` | 2025-07-30, stale | Hurricane: assess if still in use |

---

## 3. The canonical map

```
WaveWarZ Estate — Canonical Role Map (2026-07-16)

GAME ENGINE (private, Hurricane)
  └── hurric4n3ike/wavewagerz [PRIVATE - not audited]
       On-chain program (Solana), IDL, settlement logic

LIVE ANALYTICS PLATFORM (Candy / candy@wavewarz.info)
  └── CandyToyBox/wavewarz-intelligence → wavewarz.info
       GET /api/public/stats ← integrate here for all stats

FAN TRACKER (Zaal / bettercallzaal)
  └── bettercallzaal/wwtracker → [fan site, TBD deploy]
       Dune depth analytics, personal trade tracker, Audius music

HOMEPAGE (Hurricane)
  └── hurric4n3ike/wavewarzhomepagev → wavewarz.com
       Needs: wire /api/public/stats (handoff: WAVEWARZ_STATS_API_FOR_HURRICANE.md)

LIVE STREAM OVERLAY (Zaal)
  └── bettercallzaal/wavewarz-overlay
       OBS browser source; wire to /api/public/stats instead of ww-lifetime.json

MOBILE COMPANION (Zaal)
  └── bettercallzaal/wavewarzapp
       Demo phase; Firebase/FCM needs wiring before it's live

ZAO COMMUNITY INTEGRATION (Zaal)
  └── bettercallzaal/ZAOOS → src/app/(auth)/wavewarz/
       43-artist roster, nightly syncs, Farcaster share, DAO proposals
       Assess: pull from /api/public/stats instead of own scraper?

BASE L2 (Zaal + Candy, seeking co-founder)
  └── bettercallzaal/wwbase + CandyToyBox/wavewarz-base
       Co-founder pitch docs; no live app yet

DEPRECATED / SUPERSEDED (archive these)
  └── CandyToyBox: analytics-wave-warz, V2-Stats-App-WaveWarz, WaveWarz-Stats-App,
      homepage-redesign, wavewarz-merch-shop
  └── hurric4n3ike: wavewarzhomepage (v1), BlinkBattlesimages, rpc-proxy
```

---

## 4. Key findings / consolidation opportunities

1. **Single stats source of truth:** `/api/public/stats` on `wavewarz.info` (via `wavewarz-intelligence`) is the correct endpoint. Currently: wwtracker uses Dune snapshots, ZAOOS uses its own scraper, wavewarz-overlay uses `ww-lifetime.json`, wavewarz.com (wavewarzhomepagev) has no integration yet. All four should wire to `/api/public/stats` for live numbers.

2. **Stale candy stats apps:** Three generations of candy's stats apps (`WaveWarz-Stats-App` → `V2-Stats-App-WaveWarz` → `analytics-wave-warz`) are all superseded by `wavewarz-intelligence`. They should be archived to reduce confusion for new contributors and search engines.

3. **Mobile app gap:** `wavewarzapp` is demo-only. Firebase/FCM push notifications are the missing piece for the "battle-goes-live notification" feature — the highest-value user touch for driving live trading. The `/api/public/stats`'s `liveBattle` field is the webhook trigger that would power this.

4. **Overlay quick win:** `wavewarz-overlay` could pull from `/api/public/stats` instead of the static `ww-lifetime.json` — a 1-day change that would make the overlay auto-update.

5. **Homepage integration gap:** `hurric4n3ike/wavewarzhomepagev` (wavewarz.com) has no `/api/public/stats` wiring visible. The handoff doc (`WAVEWARZ_STATS_API_FOR_HURRICANE.md`, wwtracker PR #38) gives Hurricane the exact TS snippet. This is the highest-priority cross-repo integration.

6. **Base L2 duplication:** Both `wwbase` (bettercallzaal) and `wavewarz-base` (CandyToyBox) are co-founder pitch docs with overlapping content. Should be merged into one canonical brief.

---

## 5. Verdict (one line for zao-status)

> Estate = 4 active repos (wavewarz-intelligence ★, wwtracker ★, ZAOOS wavewarz pages, wavewarz-overlay); 1 demo (wavewarzapp); 1 pitch (wwbase/wavewarz-base duplication); 1 gap (wavewarz.com homepage not wired to /api/public/stats — handoff in PR #38); 8 repos recommended for archiving.

---

## Sources / verification

All `private: false` confirmed via `gh api repos/<owner>/<repo> --jq .private` before reading.  
Data: `gh api` calls for commit history, PR counts, README fetches. 2026-07-16.
