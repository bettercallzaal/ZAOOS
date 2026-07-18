---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #166)
last-validated: 2026-07-17
related-docs: 1242, 1243, 1244
original-query: "wave 25: live platform features — LiveBattleBanner + LiveTicker + RecentBattlesFeed + PlatformSummary carry"
tier: STANDALONE
---

# 1246 — wwtracker Analytics Wave 25: Live Platform Features (Jul 2026)

**Doc:** 1246
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #166)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

Wave 25 makes wwtracker real-time aware. Four live-data features added:

| Feature | Location | What it shows |
|---|---|---|
| `LiveTicker` | `app/page.tsx` (above all) | 24h/7d/total volume, battles count, live indicator. Polls every 60s. |
| `RecentBattlesFeed` | `app/page.tsx` (above AppShell) | Last 10 battles from ww-battles.json: type, artists, winner, SOL volume |
| `LiveBattleBanner` | `AppShell.tsx` (after nav) | Amber alert when `liveBattle !== null`: "⚡ LIVE: Song A vs Song B" |
| `PlatformSummary` | `AppShell.tsx` §00 (carried from wave24) | 6-tile citable snapshot: battles, songs, artists, rivalries, months |

---

## Architecture

### Data sources

| Component | Source | Update cadence |
|---|---|---|
| LiveTicker | `GET /api/public/stats` | 60s poll |
| LiveBattleBanner | `GET /api/public/stats` | 30s poll |
| RecentBattlesFeed | `public/ww-battles.json` | Build-time (last 10 battles) |
| PlatformSummary | `public/ww-battles.json` + `lib/artists.ts` | Build-time |

### Page layout (after wave25)

```
page.tsx:
  FreshnessBanner    ← Dune data freshness indicator
  LiveTicker         ← real-time stats strip (NEW)
  RecentBattlesFeed  ← last 10 battles card (NEW)
  AppShell:
    nav              ← section jump nav
    LiveBattleBanner ← live battle alert (NEW)
    §00 OnChainProof + PlatformSummary  ← §00 snapshot (wave24 carry)
    §01–§09          ← all sections
```

---

## Key behaviors

**LiveBattleBanner:**
- Hidden when `liveBattle === null` (renders `null`)
- Amber background with pulse when live battle detected
- Links to `#battles` section for immediate navigation to battle history
- No flash on load (renders null until first poll completes)

**LiveTicker:**
- Shows "Loading..." until first fetch completes
- Shows "last updated X mins ago" from `updatedAt` timestamp
- Live battle indicator appears when `liveBattle !== null`

---

## Pre-emption chain (wave 25)

| Pre-empted PR | What it contained | Wave 25 supersedes |
|---|---|---|
| PR #52 (`feat/live-battle-banner`) | LiveBattleBanner + AppShell | ✅ fully absorbed |
| PR #72 (`fix/howit-appshell-floor-sol`) | FLOOR_SOL/PROGRAM_ID in AppShell | ✅ fully absorbed |
| PR #103 (`feat/recent-battles-feed`) | LiveTicker + RecentBattlesFeed + page.tsx | ✅ fully absorbed |
| PR #162 (`feat/wave24-*`) | PlatformSummary + §00 AppShell | ✅ carried forward |

---

## NORTH STAR alignment

- **ZAO = THE case study:** `LiveBattleBanner` makes WaveWarZ provably live — any visitor to wwtracker during an active battle sees the amber alert. This is real-time proof of a running platform, not a static dashboard.
- **ZAO IP = a staple in onchain culture:** `RecentBattlesFeed` surfaces the last 10 battles immediately on load. Artists' songs are visible to any visitor within seconds, even without scrolling to §08.

---

## 3 citable facts

1. **wwtracker now shows live battle status** — LiveBattleBanner polls every 30s; when `liveBattle !== null` from the stats API, an amber alert appears between the nav and sections
2. **LiveTicker + RecentBattlesFeed make the last 10 battles visible above the fold** — no scrolling needed to see WaveWarZ activity
3. **Wave 25 completes the live UX layer** — combining real-time stats (LiveTicker), recent activity (RecentBattlesFeed), live alerts (LiveBattleBanner), and the citable snapshot (PlatformSummary)
