---
topic: wavewarz
type: standalone
status: done (wwtracker PR #136 open)
last-validated: 2026-07-17
related-docs: 1241, 974, 1077
original-query: "STATS API doc + hardening: wavewarz.info/api/public/stats contract, smoke test, Hurricane integration snippet"
tier: STANDALONE
---

# 1242 — WaveWarZ Public Stats API: Contract & Integration Guide (Jul 2026)

**Doc:** 1242
**Type:** STANDALONE
**Status:** done — wwtracker PR #136 open (`docs/stats-api-hurricane-handoff`)
**Written:** 2026-07-17 (ww build loop, queue item 1)

---

## What was built

Three deliverables committed to wwtracker (PR #136):

| Deliverable | Path | Purpose |
|---|---|---|
| API contract doc | `docs/WAVEWARZ_STATS_API_FOR_HURRICANE.md` | Full schema, integration snippets, Hurricane handoff |
| Smoke test | `scripts/smoke-stats-api.ts` | Live endpoint shape verification, 13 checks |
| npm script | `package.json` → `smoke:stats` | `npm run smoke:stats` runs the smoke test |

---

## Endpoint

```
GET https://wavewarz.info/api/public/stats
Auth: none   CORS: *   Cache: 60s server-side
```

### Full response shape (live, 2026-07-17)

```jsonc
{
  "updatedAt": "2026-07-17T09:47:12.301Z",
  "solPriceUsd": 74.64,
  "volume": {
    "totalSol": 524.372,
    "totalUsd": 39139.13,
    "last24hSol": 1.3687,
    "last7dSol": 12.9594
  },
  "liveBattle": null,      // null | { id, songA, songB, ... } when live
  "artistPayouts": {
    "totalSol": 9.0722,
    "totalUsd": 677.15,
    "note": "Instant, automatic onchain payouts to artists — 1% of trading volume + settlement bonus"
  },
  "traderClaims": {
    "totalSol": 127.3432,
    "totalUsd": 9504.90,
    "withdrawalCount": 939,
    "note": "Real trader withdrawals (claimShares), parsed from onchain vault transactions"
  },
  "platformRevenue": {
    "totalSol": 17.4386,
    "totalUsd": 1301.62
  },
  "battles": {
    "total": 1245,
    "mainEvents": 50,
    "mainBattles": 162,
    "quickBattles": 1047,
    "communityBattles": 36
  }
}
```

---

## Smoke test coverage (13 checks)

`npm run smoke:stats` validates:
- HTTP 200
- `updatedAt` is string
- `solPriceUsd > 0`
- `volume` object + `totalSol > 0` + `last24hSol/last7dSol >= 0`
- `liveBattle === null || object`
- `battles.total > 0` + `quickBattles >= 0`
- `artistPayouts.totalSol >= 0`
- `traderClaims.withdrawalCount >= 0`
- `platformRevenue.totalSol >= 0`

---

## Hurricane integration (wavewarz.com front-end)

The endpoint is CORS open — fetch client-side, no proxy needed. The doc includes three ready-to-paste snippets:

1. **Vanilla JS ticker** — `<div id="ww-ticker">` + inline `<script>`, zero deps
2. **React/Next.js ticker component** — typed `WaveWarZTicker`, `useEffect` + `useState`
3. **liveBattle pin** — `pollLiveBattle(onLive, onIdle)` pattern, polls every 30s, shows/hides banner

Key Hurricane notes in the doc:
- Cache is 60s — calling every 30s is fine
- `liveBattle` is always `null` between battles — guard before rendering
- `updatedAt` can be surfaced as "last updated X seconds ago"
- `artistPayouts.note` + `traderClaims.note` are tooltip-ready strings

---

## Superseded open PRs

PR #136 (`docs/stats-api-hurricane-handoff`) supersedes:
- PR #38 (`stats-api-doc-and-smoke-test`) — earlier version of the same doc
- PR #104 (`feat/stats-api-doc`) — parallel doc with `docs/WAVEWARZ_STATS_API.md` (different filename)

PRs #38 and #104 also carry unrelated component changes (`LiveTicker.tsx`, `RecentBattlesFeed.tsx`, `lib/__tests__/`) — those are NOT superseded by #136, only the doc/smoke-test deliverables.

---

## NORTH STAR alignment

- **ZAO = THE case study:** A public, documented, zero-auth stats API is the infrastructure of a transparent DAO. `artistPayouts.note` ("instant, automatic onchain payouts to artists") is citable proof that WaveWarZ distributes value onchain.
- **ZAO IP = a staple in onchain culture:** The `liveBattle` field makes WaveWarZ real-time — any partner site (Hurricane's wavewarz.com, streaming overlays, community dashboards) can show a live battle pin with one fetch.

---

## 3 citable facts (queue item 1 context, Jul 2026)

1. **wavewarz.info/api/public/stats is a public, auth-free, CORS-open endpoint** — any site can fetch live WaveWarZ stats client-side with no proxy
2. **The smoke test verifies 13 shape invariants** including `volume.totalSol > 0`, `battles.total > 0`, and `liveBattle === null || object`
3. **Artist payouts are queryable in real-time** via `artistPayouts.totalSol` — 9.07 ◎ ($677) cumulative to artists as of 2026-07-17
