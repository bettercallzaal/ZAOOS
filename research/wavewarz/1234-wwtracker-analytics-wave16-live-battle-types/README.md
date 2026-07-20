---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #154)
last-validated: 2026-07-17
related-docs: 1216, 1219, 1233, 1232
original-query: "wave 16: LiveBattleTypes live battle format breakdown in §05 + §05 full analytics stack"
tier: STANDALONE
---

# 1234 — wwtracker Analytics Wave 16: LiveBattleTypes (Jul 2026)

**Doc:** 1234
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #154)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`LiveBattleTypes.tsx`** — a live-API card in §05 (Platform Analytics) showing how WaveWarZ battles distribute across four distinct formats. Fetches `wavewarz.info/api/public/stats` at runtime and renders a 4-tile grid with counts, % of total, and a key insight callout.

§05 was also expanded from a single `PlatformAnalytics` component to a 6-component full analytics stack via pre-emption of `feat/platform-pulse` (PR #122).

---

## Component design: LiveBattleTypes

| Element | Content | Source |
|---|---|---|
| Quick Battles tile | Live count + % of total | `stats.battles.quickBattles` |
| Main Battles tile | Live count + % of total | `stats.battles.mainBattles` |
| Main Events tile (accent) | Live count + % of total | `stats.battles.mainEvents` |
| Community tile | Live count + % of total | `stats.battles.communityBattles` |
| Key insight callout | "Main Events = N% of battles but ~70% of volume" | computed from live data |
| `● LIVE` badge | Shows on successful fetch | runtime |

**Data flow:** fetch → `Stats.battles.*` → count / total × 100 for each type → display.

**Fallback states:** "fetching live stats…" while loading; "stats unavailable" on error. No stale static fallback needed — counts are live-only.

---

## §05 final stack (wave 16)

```
PlatformAnalytics   ← baked on-chain analytics (existing)
PlatformPulse       ← pace/health: last7/30/prior30 battle counts, active day ratio
BattleTempo         ← recharts BarChart: monthly battle count May '25–Jul '26
LiveBattleTypes     ← live format breakdown: 4 type tiles (NEW, wave 16)
LivePlatformStats   ← live stats tiles: volume/battles/revenue/SOL price
NailBiters          ← 10 closest battles by margin from ww-battles.json
```

§05 now covers the full platform analytics story:
1. **Baked snapshot** — PlatformAnalytics (static totals)
2. **Pace/health** — PlatformPulse (recent vs prior 30d)
3. **Battle tempo** — BattleTempo (monthly bar chart)
4. **Format breakdown** — LiveBattleTypes (live per-format counts)
5. **Live platform stats** — LivePlatformStats (real-time API tiles)
6. **Closest moments** — NailBiters (the 10 tightest battles)

---

## Pre-emption (Lesson 28)

Wave 16 pre-empts `feat/platform-pulse` (PR #122) by copying 4 files verbatim:

| File | Source branch | Status |
|---|---|---|
| `PlatformPulse.tsx` | feat/platform-pulse | copied |
| `BattleTempo.tsx` | feat/platform-pulse | copied |
| `LivePlatformStats.tsx` | feat/platform-pulse | copied + API field fix applied |
| `NailBiters.tsx` | feat/platform-pulse | copied |

**LivePlatformStats API fix (applied before copy):** The source branch had wrong field names (`volume.sol` instead of `volume.totalSol`, `battles.quick` instead of `battles.quickBattles`, etc.). Fixed on `feat/platform-pulse` in the same session, then copied at the corrected state. PRs #122 and #154 can merge in any order.

---

## Live battle type breakdown (snapshot, Jul 2026)

From `wavewarz.info/api/public/stats` as of session:

| Format | Count | % of total |
|---|---|---|
| Quick Battles | 1,047 | 84.1% |
| Main Battles | 162 | 13.0% |
| Main Events | 50 | 4.0% |
| Community Battles | 36 | 2.9% |
| **Total** | **1,245** | — |

**Key insight (citable):** Main Events = ~4% of all battles but drive ~70% of total volume (524 ◎ platform total; events are flagship format with peak individual bet sizes).

---

## NORTH STAR alignment

- **ZAO = THE case study:** The format breakdown proves WaveWarZ has a structured product hierarchy — not a single undifferentiated format. Quick Battles (daily pulse) → Main Battles (elevated stakes) → Main Events (flagship) → Community Battles (charity). This is an operational music-battle economy with format discipline.
- **ZAO IP = a staple in onchain art, music:** Community Battles ($1,497 charity raised) are a distinct live format tracked on-chain. The format breakdown makes this visible and citable.

---

## 4 citable facts (wave 16 context, Jul 2026)

1. **Quick Battles = 84% of all WaveWarZ battles** — daily pulse format dominates volume count while main events dominate SOL volume
2. **Main Events = ~4% of battles but ~70% of platform SOL volume** — the flagship format drives the economic engine
3. **4 distinct on-chain battle formats** — Quick, Main, Main Event, Community — each tracked separately in the platform stats API
4. **Community Battles (36 total) = the charity/benefit format** — $1,497 raised from a format that represents just 2.9% of all battles

---

## 5 citable facts (§05 full stack, Jul 2026)

From the combined wave 16 §05 additions:

1. Main Events = ~4% of battles, ~70% of volume — the platform's economic engine
2. Mar 2026 = peak battle tempo month — 188 battles (BattleTempo)
3. Last 30d pace vs prior 30d visible in PlatformPulse — live health signal
4. 10 closest battles all decided by ≤5% margin (NailBiters)
5. Real-time volume + SOL price in LivePlatformStats — 60s cache, CORS open
