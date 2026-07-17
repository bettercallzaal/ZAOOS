---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #162)
last-validated: 2026-07-17
related-docs: 1241, 1077, 1079
original-query: "wave 24: §00 citable snapshot — PlatformSummary below OnChainProof"
tier: STANDALONE
---

# 1243 — wwtracker Analytics Wave 24: §00 Citable Snapshot (Jul 2026)

**Doc:** 1243
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #162)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**§00 (The whole run, at a glance)** expanded to include `PlatformSummary` — a 6-tile citable snapshot card below the `OnChainProof` time-series chart.

| Metric | Source | Value (Jul 2026) |
|---|---|---|
| Total battles | `ww-battles.json` (build-time) | 1,089+ |
| Unique songs | Set from all battle song names | 921+ |
| Artist roster | `lib/artists.ts` ROSTER length | 34 |
| Rivalries | pairs with ≥2 meetings | 17+ |
| Months active | first → last battle date | 14+ months |

All computed at **build time** from `ww-battles.json` + `lib/artists.ts` — no API fetch needed, no loading state.

---

## §00 final stack (wave 24)

```
OnChainProof    ← all-time time-series multi-line chart (existing)
PlatformSummary ← 6-tile citable snapshot: battles, songs, artists, rivalries, months
```

§00 now serves two audiences:
1. **The analyst**: `OnChainProof` — full time-series, multi-metric, hover-for-values
2. **The journalist/researcher**: `PlatformSummary` — machine-readable facts, above the fold

---

## Pre-emption

| Pre-empted branch | PR | Reason |
|---|---|---|
| `feat/platform-summary` | #141 | Same `PlatformSummary.tsx` + AppShell §00 change |

Wave 24 and PR #141 can merge in any order — zero conflict after pre-emption.

---

## NORTH STAR alignment

- **ZAO = THE case study:** §00 is the landing section — anyone who opens wwtracker sees the case study numbers immediately. PlatformSummary makes total battles, unique songs, rivalries, and months active the first facts a visitor reads. The data is on-chain sourced and build-time computed — fully citable.
- **ZAO IP = a staple in onchain culture:** "921 unique songs, 17 rivalries, 14 months" is a compressed proof that WaveWarZ is an established, ongoing music IP ecosystem, not a product launch.

---

## 3 citable facts (wave 24 context, Jul 2026)

1. **§00 now opens with a 6-tile citable snapshot** — battles, songs, artist roster, rivalries, months active, program ID — all build-time computed from on-chain data
2. **PlatformSummary requires zero API calls** — all metrics derived from ww-battles.json at build time, no loading state
3. **Wave 24 completes §§00-09** — all 10 AppShell sections now have wave PRs with multi-component stacks
