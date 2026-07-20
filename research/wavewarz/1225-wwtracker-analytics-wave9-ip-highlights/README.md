# wwtracker Analytics Wave 9: IP Highlights (Jul 2026)

**Doc:** 1225
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #147)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`IPHighlights.tsx`** — a new component in the §09 ecosystem section of wwtracker. Placed after ZaoIPSummary, it shows the "most extreme" individual data points from 1,000+ battles — making specific ZAO IP tracks and artists legible as cultural anchors, not just aggregate counts.

---

## Component design

Four dynamic tiles, all computed live from `ww-battles.json` at render time via React `useMemo`:

| Tile | Algorithm | Value (Jul 2026 data) |
|------|-----------|----------------------|
| MOST BATTLED TRACK | Max appearances across all battles | "WaveWarZ, the electric vibez" — 38 battles |
| MOST DOMINANT TRACK | Best win rate, min 10 battles | "Dale Vuelta 360" — 86% (13W 2L) |
| VOLUME CHAMPION | Handle with highest cumulative battle volume | @GodclouD — 7.64 SOL across 20 battles |
| PEAK MONTH | Highest single-month battle count | Mar 2026 — 188 battles |

### Key design decisions
- **Min 10 battles for win rate**: Prevents small-sample flukes (e.g., a 1-battle 100% record) from dominating
- **Volume champion = both sides**: Counts all SOL in any battle the handle appeared in — shows which artist's MATCHES draw the most community interest, complementing ArtistEarnings (which tracks actual on-chain artist payouts)
- **Dynamic computation**: All 4 metrics update automatically when ww-battles.json is refreshed — no manual figure updates needed

---

## Placement in §09

ZaoVitals → FractalGovernance → ZaoIPSummary → **IPHighlights** → WwMedia → CommunityBattles → Ecosystem → Events → Faq

---

## Pre-emption

Pre-empted against:
- PRs #110 + #140 (feat/ecosystem-section-consolidated / feat/zao-ip-summary — same §09 adds)
- PR #144 (feat/fractal-governance-wave8 — FractalGovernance in §09)

6 component files copied from source branches: WwMedia, ZaoVitals, CommunityBattles, ZaoIPSummary (from PR #140), FractalGovernance (from PR #144). tsc clean.

---

## NORTH STAR alignment

- **ZAO IP = a staple in onchain art, music and culture**: "Most Battled Track" (38 battles) and "Most Dominant Track" (86% win rate) make specific songs legible as cultural anchors — ZAO IP with a verifiable competitive record, not just existence
- **ZAO = THE case study of a successful DAO**: "Volume Champion" (@GodclouD, 7.64 SOL) shows which artists drive community engagement; "Peak Month" (188 battles in Mar 2026) shows the platform's peak momentum

---

## Data verified (Jul 2026, ww-battles.json / 1,089 battles)

- Most battled song: "WaveWarZ, the electric vibez" — 38 appearances, 21W 17L (55%)
- Most dominant song (min 10): "Dale Vuelta 360" — 86% win rate (13W 2L, 15 battles)
- Volume champion: @GodclouD — 7.64 SOL across 20 battles, 15W 5L (75% win rate)
- Peak month: Mar 2026 — 188 battles (highest single-month count)

Source: ww-battles.json (1,089 battles, May 2025 – Jul 2026)
