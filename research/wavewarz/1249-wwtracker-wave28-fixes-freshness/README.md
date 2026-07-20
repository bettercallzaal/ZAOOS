---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #172)
last-validated: 2026-07-17
related-docs: 1247, 1248
original-query: "wave 28: handle resolution, freshness dates, ecosystem context, config fixes"
tier: STANDALONE
---

# 1249 — wwtracker Analytics Wave 28: Fixes + Freshness + Ecosystem Context (Jul 2026)

**Doc:** 1249
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #172)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

Wave 28 carries wave27's changes and adds the fix/freshness/context layer — no new sections, only accuracy improvements.

| Change | File | What it fixes |
|---|---|---|
| X→Audius handle resolution | `app/artist/[handle]/page.tsx` + `lib/artists.ts` | Artist pages work when navigated via X handle (e.g. `/artist/therealgodcloud` → GodclouD page) |
| Freshness date: Leaderboard | `components/Leaderboard.tsx` | `"2026-06-15"` → `{DATA_AS_OF}` |
| Freshness dates: Songs + Traders | `components/Songs.tsx` + `Traders.tsx` | Hardcoded snapshot dates → `{DATA_AS_OF}` |
| ZAO DAO context | `components/Ecosystem.tsx` | WaveWarZ + wavewarz.info cards; ZAO Fractals details; accurate DAO description |
| PlatformAnalytics accuracy | `components/PlatformAnalytics.tsx` | `"3.5"` → `FLOOR_SOL`; `"958"` → `BATTLE_STATS.totalShown` |
| TraderScorecard config | `components/TraderScorecard.tsx` | Hardcoded PROGRAM_ID/wallet → config imports |
| battles.ts refresh | `lib/battles.ts` | 2026-07-17 stats: 1,241 battles, 521.75 SOL, COMMUNITY type added |
| SOL price update | `lib/price.ts` | Updated Jul 16 2026 |

---

## Handle resolution (artist page fix)

**Problem:** Navigating to `/artist/therealgodcloud` (X/Twitter handle) returned empty data because the artist page only looked up by Audius handle (`GodclouD`).

**Fix:** `X_TO_AUDIUS_HANDLE` and `AUDIUS_TO_X_HANDLE` maps in `lib/artists.ts`. The artist page now:
1. Checks direct Audius handle match
2. Falls back to `X_TO_AUDIUS_HANDLE` for X handle → Audius handle resolution
3. Resolves leaderboard via `AUDIUS_TO_X_HANDLE` reverse map

**Affected artists (X→Audius mapping):**

| X handle | Audius handle |
|---|---|
| therealgodcloud | GodclouD |
| GeEkMyTh_ETH | geekmyth |
| cannonjones973 | CannonJones973 |
| Stormiunleashed | Stormbourne |
| XTincT_io | XTincT_official |
| kata7yst | Kata7yst |
| bennyj504 | BennyJ504 |
| RoCkY2GriMeY__ | RoCkY2GriMeY |

---

## Pre-emption chain (wave 28)

| Pre-empted PR | What it contained | Wave 28 supersedes |
|---|---|---|
| PR #170 (wave27) | artist page + FAQ + leaderboard | ✅ fully carried |
| PR #49 | X→Audius handle resolution | ✅ fully absorbed |
| PR #50 | Ecosystem.tsx ZAO context | ✅ fully absorbed |
| PR #60 | PlatformAnalytics + battles.ts refresh | ✅ fully absorbed |
| PR #61 | freshness dates in 3 components | ✅ fully absorbed |
| PR #78 | battles.ts COMMUNITY type | ✅ absorbed (via battles.ts refresh) |
| PR #81 | TraderScorecard config | ✅ fully absorbed |
| PR #82 | lib/price.ts SOL price | ✅ fully absorbed |

---

## NORTH STAR alignment

- **ZAO = THE case study:** Ecosystem.tsx now accurately describes The ZAO — ZTalent Artist Organization, 100+ Fractal weeks, Respect-based governance, ZIPs. The page is correct for external researchers, journalists, or grant applications.
- **ZAO IP = a staple in onchain culture:** Handle resolution fixes mean that artist pages work when linked from X — the primary social discovery channel. `therealgodcloud` → GodclouD's stats page loads correctly now.

---

## 3 citable facts

1. **Handle resolution fixed** — 8 X/Twitter handles now correctly route to artist pages: `therealgodcloud` → GodclouD, `Stormiunleashed` → Stormbourne, etc.
2. **BATTLE_STATS refreshed to 2026-07-17** — 1,241 total battles, 521.75 SOL volume, COMMUNITY type added to battle schema
3. **Ecosystem.tsx now includes wavewarz.info card** — "Live analytics platform — the canonical stats source. Powered by Helius RPC. Public API at GET /api/public/stats (no auth, CORS open, 60 s cache). WaveWarZ Intelligence by CandyToyBox."
