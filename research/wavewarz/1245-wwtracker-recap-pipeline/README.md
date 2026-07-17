---
topic: wavewarz
type: standalone
status: done (wwtracker PR #165 open; weekly recap PR #164 open)
last-validated: 2026-07-17
related-docs: 1077, 1242, 974
original-query: "wwtracker recap pipeline: weekly draft generation for Farcaster/X, data provenance, ZAO documentation loop"
tier: STANDALONE
---

# 1245 — wwtracker Recap Pipeline (Jul 2026)

**Doc:** 1245
**Type:** STANDALONE
**Status:** done — wwtracker PR #165 (improvements), PR #164 (Jul 17 weekly draft)
**Written:** 2026-07-17 (ww build loop)

---

## What it is

The wwtracker recap pipeline is a TypeScript CLI (`npm run recap`) that auto-generates weekly Farcaster and X draft posts from the on-chain battle data. It makes ZAO's WaveWarZ activity documentable, repeatable, and citable without manual curation each week.

**Source:** `scripts/ww-recap.ts` + `scripts/recap/` module

---

## Commands

```bash
npm run recap -- --weekly           # Generate weekly draft, advance cursor
npm run recap -- --weekly --dry-run # Preview draft WITHOUT advancing cursor
npm run recap -- --show <url>       # Generate show-specific recap (by battle URL)
```

---

## Weekly draft structure (after PR #165)

### Farcaster draft
```
WaveWarZ weekly recap, YYYY-MM-DD to YYYY-MM-DD. N battles (X MAIN, Y QUICK/COMMUNITY). 
Biggest: Song A vs Song B — Artist wins. 
Closest: Song A vs Song B, decided by X%. 
@WaveWarZ - wavewarz.com
```

### X draft
```
WaveWarZ week of YYYY-MM-DD: N battles, V SOL. 
Top: Song A vs Song B — Artist wins.
@WaveWarZ - wavewarz.com
```

### dataUsed section
```
- Battles this week: 18 (2 MAIN, 16 QUICK/COMMUNITY)
- Total volume: 4.38 SOL
- Top-volume battle: Modern Love vs Saturday in La — BennyJ504WaveWarz wins
- Closest battle: Someone Will vs Run It Up, margin 11%
- Most active artist: BennyJ504WaveWarz, 5W-2L (7 battles)
```

---

## PR #165 improvements (consolidated from #125-129)

| Feature | What it adds |
|---|---|
| Winner in top-volume battle | `— Artist wins.` in Farcaster + X |
| Closest-margin battle | `Closest: Song A vs Song B, decided by X%` |
| MAIN event count | `18 battles (2 MAIN, 16 QUICK/COMMUNITY)` |
| W-L record for most active artist | `5W-2L (7 battles)` in dataUsed |
| `--dry-run` flag | Preview without writing file or advancing cursor |

24/24 tests pass.

---

## Weekly recap: Jul 10–17, 2026 (PR #164)

Generated 2026-07-17 via `npm run recap -- --weekly`:

| Metric | Value |
|---|---|
| Battles | 18 (all QUICK format) |
| Total volume | 4.38 SOL |
| Top battle | Modern Love vs Saturday in La (BennyJ504WaveWarz) — 1.13 SOL |
| Closest | Someone Will vs Run It Up (PKMNCTO) — 11% margin |
| Most active | BennyJ504WaveWarz (7 battles) |

---

## Architecture

```
public/ww-battles.json         ← source data (1,107 battles as of Jul 17)
recaps/STATE.json              ← cursor state (lastWeeklyRecapEnd, recappedBattleIds)
scripts/recap/
  format.ts                   ← buildWeeklyRecap(): window + draft generation
  merge-battles.ts            ← battle dedup/sort
  battle-parser.ts            ← parses wavewarz-intelligence HTML
  types.ts                    ← StoredBattle, WeeklyDraft types
scripts/ww-recap.ts            ← CLI entry point
recaps/weekly/                 ← generated weekly recap markdown files
```

---

## NORTH STAR alignment

- **ZAO = THE case study:** The recap pipeline creates a timestamped, citable activity log of WaveWarZ battles. Each weekly draft is a documented proof of recurring platform activity. `lastWeeklyRecapEnd` cursor tracks continuity since launch.
- **Documented DAO:** A DAO that posts weekly on-chain activity recaps is a DAO that proves it's running. The `dataUsed` section explicitly cites source files and battle IDs — this is citation-grade documentation.

---

## 3 citable facts

1. **Automated weekly recap since launch** — `recaps/weekly/` folder holds timestamped Farcaster/X drafts for every ZAO-reported week since WaveWarZ tracking began
2. **Week of Jul 10–17, 2026: 18 battles, 4.38 SOL** — fully sourced to `ww-battles.json` with battle IDs
3. **PR #165 adds W-L records, MAIN event breakdown, and winner names** to weekly drafts — making the output citation-grade for external reporting
