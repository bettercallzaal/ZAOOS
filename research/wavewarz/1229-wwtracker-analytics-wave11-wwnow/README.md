---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #149)
last-validated: 2026-07-17
related-docs: 1227, 1225, 1223
original-query: "wave 11: WwNow live stats card in §01 — live proof immediately after the WaveWarZ explainer"
tier: STANDALONE
---

# 1229 — wwtracker Analytics Wave 11: WwNow (Jul 2026)

**Doc:** 1229
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #149)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`WwNow.tsx`** — a live 4-tile stats card placed in §01 (What WaveWarZ is) after `HowItWorks`. Fetches `wavewarz.info/api/public/stats` to show the platform's live state immediately after the explainer, giving new visitors concrete evidence before they scroll deeper.

---

## Component design

| Tile | Content | Source |
|---|---|---|
| BATTLES | `battles.total` + quick/main breakdown | live API |
| VOLUME | `volume.totalSol` ◎ + `$totalUsd` | live API |
| ARTIST PAYOUTS | `artistPayouts.totalSol` ◎ · "1% of every trade, instant onchain" | live API |
| LIVE NOW (active) | `liveBattle.count` battles · `vol` ◎ at stake · gold border | live API |
| BATTLE SCHEDULE (quiet) | "Mon–Fri · 8:30 PM EST · wavewarz.info" | doc 1223 |

**Loading behavior:** renders `null` — no layout shift, no skeleton flash. §01 reads cleanly while the tile loads.

**Error behavior:** catch is a no-op. Component stays hidden rather than showing a degraded state below the explainer copy.

---

## Placement in §01

```
AboutWaveWarZ  ← what it is (prose explainer)
HowItWorks     ← how a battle works (step-by-step)
WwNow          ← live proof: this is happening right now
```

§01 becomes a complete arc: what → how → proof.

---

## Why §01 and not §05

**§05** already has the mega-analytics PR (#122) queued. Adding to §05 requires pre-empting against a large set of components (PlatformPulse, BattleTempo, LivePlatformStats, NailBiters, MonthlyVolume...) that would need to be copied. High cost.

**§01** has zero conflict surface — no open branch touches `id: "what"`. WwNow's scope is also distinct: §05 is "deep analytics for power users," §01 is "first impression for new visitors." WwNow is a first-impression card, not a deep analytics tool.

---

## Pre-emption

No open PR branches modify §01. `feat/scroll-narrative` (which introduced the SECTIONS layout including `id: "what"`) is already merged into main. Zero pre-emption required.

---

## Live battle indicator

When `liveBattle` is not null:
```tsx
<Tile label="LIVE NOW" value={`${count} battle${count !== 1 ? "s" : ""}`} sub={`${vol} ◎ at stake`} highlight />
```
The `highlight` prop gives the tile a gold border (`C.accent`). This is the most visceral real-time signal on the entire tracker — a new visitor might land during an active battle and see it immediately.

---

## NORTH STAR alignment

- **ZAO = THE case study:** "1,245+ battles · 524+ SOL · $668 to artists" visible immediately after the explainer makes the ZAO's flagship app look as serious as it is. Not a toy, not a demo — a live platform with real money.
- **ZAO IP = a staple in onchain art, music:** "ARTIST PAYOUTS: 9.07 ◎ · 1% of every trade, instant onchain" is the clearest single statement of what makes WaveWarZ different. First-impression placement in §01 maximizes reach.

---

## 4 citable facts (live, Jul 2026)

1. **1,245+ battles** — live from stats API, auto-updates
2. **524+ SOL total volume** — live
3. **9.07 SOL paid to artists** — 1% of every trade, instant onchain
4. **Mon–Fri 8:30 PM EST** — daily quick-battle schedule (doc 1223, wavewarz.info)
