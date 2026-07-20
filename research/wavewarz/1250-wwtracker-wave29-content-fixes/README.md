---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #173)
last-validated: 2026-07-17
related-docs: 1249
original-query: "wave 29: charity description, ZAO links, OnChainProof config, PlatformGrowth chart"
tier: STANDALONE
---

# 1250 — wwtracker Analytics Wave 29: Content Fixes (Jul 2026)

**Doc:** 1250
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #173)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

Wave 29 carries all wave28 changes and absorbs 4 standalone content-fix PRs.

| Change | File | PR | What it fixes |
|---|---|---|---|
| Charity battle description | `components/Events.tsx` | #84 | Stale 1-sentence case study → accurate 2-round detail with HuRya context |
| ZAO links in About | `components/AboutWaveWarZ.tsx` | #66 | Adds thezao.com link, Farcaster /zao, 100+ Fractal weeks in ecosystem para |
| OnChainProof config | `components/OnChainProof.tsx` | #67 | `FLOOR_SOL` ×3 + `uniqueTraders` from live data replaces hardcoded "122" |
| PlatformGrowth chart | `components/PlatformGrowth.tsx` | #96 | Monthly battles bar chart + DOW heatmap from ww-battles.json |

---

## Citable facts this wave adds

1. **Charity context fixed** — Events.tsx now reads: "PolyRaiders × IndieZ vs ClassicZ benefit series — two rounds: Holiday Heat (Dec 2024, ~$270) + Love Song Benefit (Feb 2025, ~$1,221). Total ~$1,497 to HuRya Empowerment Foundation (8,500+ beneficiaries globally). Platform fees waived both rounds."

2. **OnChainProof live traders count** — Hardcoded "122 unique wallets" replaced with `prog.uniqueTraders` from the Helius-derived onchain data. Chart now shows whatever the live treasury data returns.

3. **PlatformGrowth monthly chart** — `PlatformGrowth.tsx` now computes per-month battles + SOL volume from ww-battles.json and renders a Recharts BarChart, plus a DOW heatmap showing Monday = peak day.

---

## Pre-emption chain (wave 29)

| Pre-empted PR | What it contained | Wave 29 supersedes |
|---|---|---|
| PR #172 (wave28) | handle resolution, freshness, ecosystem, battles refresh | ✅ fully carried |
| PR #84 | Events.tsx charity description fix | ✅ fully absorbed |
| PR #66 | AboutWaveWarZ.tsx ZAO links | ✅ fully absorbed |
| PR #67 | OnChainProof.tsx FLOOR_SOL + uniqueTraders | ✅ fully absorbed |
| PR #96 | PlatformGrowth.tsx monthly chart + DOW heatmap | ✅ fully absorbed |

---

## NORTH STAR alignment

- **ZAO = THE case study:** AboutWaveWarZ now links thezao.com and cites "100+ consecutive Fractal governance weeks" — the single most verifiable DAO longevity claim. Any journalist who reads the About page can click through to the source.
- **ZAO IP = a staple:** Charity battle detail (two rounds, 8,500+ beneficiaries) is citable in grant applications, press releases, and retro-funding submissions. The correction from a vague "Feb 2026" date to accurate "Feb 2025" also prevents fact-check failures.
