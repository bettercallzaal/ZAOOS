---
topic: governance
type: audit
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 975, 718, 696, 705, 114, 102
original-query: "Fix fractals documentation - the fractal docs are stale/wrong in places; catalogue what is wrong vs the verified on-chain facts and produce a fix-list"
tier: STANDARD
---

# 977 - Fix the fractals documentation (correction catalogue)

> **Goal:** The ZAO fractal/governance docs carry numbers that the 2026-07-05 on-chain pull proved wrong. This doc is the exact fix-list: every stale claim, its file and line, and the correction - so the whitepaper foundations and lineage docs can be brought to ground truth in one pass. Doc 975 is the citable source for every correction here.

## Why now

Doc 975 pinned the live on-chain numbers for ZAO Respect. Several older governance docs were written from **modeled** estimates (doc 718b) and now contradict the measured reality. Contradictory docs are worse than no docs - the whitepaper is Zaal's "magnum opus" and its foundations must not cite figures that a reader can disprove on Blockscout in two minutes.

## The corrections (grounded, file:line)

Every "should be" below traces to [[reference_zao_respect_onchain_facts]] (on-chain pull 2026-07-05) via [Doc 975](../975-zao-respect-live-numbers/).

### 1. OREC vote/veto windows: 48h -> 72h

| File | Line(s) | Says | Should say |
|------|---------|------|-----------|
| `718c-ordao-onchain-architecture.md` | 22, 43, 51, 236, 409 | "48h voting + 48h veto", "48-hour veto window = 86,400s" | **72h each** (`voteLen`=`vetoLen`=259,200s on-chain). The 86,400s math is also wrong - 72h = 259,200s |
| `705-fractal-governance-external-deep-research/README.md` | 245-246 | "Voting 48 hours / Veto 48 hours" | **72 hours each** |

### 2. Proposal threshold: "10% of Respect" -> ~2.6% (1,000 Respect)

| File | Line | Says | Should say |
|------|------|------|-----------|
| `718c-ordao-onchain-architecture.md` | 64, 409 | "e.g. 10% of total Respect" | **`minWeight` = 1,000 Respect = ~2.6% of OG supply** (38,484) |
| `705-...deep-research/README.md` | 247 | "5-10% of total Respect... 10% as typical framing" | **~2.6%** measured; drop the "10% typical" framing |

### 3. Distribution Gini: 0.23 -> 0.73 (and the nuance)

| File | Line | Says | Should say |
|------|------|------|-----------|
| `696-respect-fractal-lineage-summary/README.md` | 129 | "a single Fibonacci round produces a Gini around 0.23" | The **cumulative OG Gini is ~0.73** (top 10 = 53%). A single 6-person Fibonacci round computes to **0.41**, not 0.23. The "dramatically more equal" claim is overstated - keep the comparison honest |

This is the most important correction: the docs currently claim the distribution is near-egalitarian (0.23). On-chain it is meaningfully concentrated (0.73). The whitepaper's credibility rests on stating this honestly (per the whitepaper memory, Chapter 9 Limitations must stay honest).

### 4. Streak: "90+ weeks" -> "100+ weeks" (~101)

| File | Line | Says | Should say |
|------|------|------|-----------|
| `696-...lineage-summary/README.md` | 33, 169 | "90+ weeks" (x2) | **~101 weeks** ("100+ weeks") |
| `114-zao-fractal-live-infrastructure/README.md` | 350 | "90+ weeks" | **~101 weeks** |
| `102-fractals-frapps-ordao-page/README.md` | 94 | "90+ weeks running" | **~101 weeks** |

Understated, not wrong - but "100+ weeks" is a stronger, true claim. Update it everywhere.

### 5. Member count: ~200 -> 156

Wherever any fractal doc says "~200 members / ~200 holders", correct to **156 unique Respect holders** (122 OG + 55 ZOR, 21 both). The ~200 figure conflated Discord/community size with on-chain holders. (Not all instances grepped here - the site copy fix in doc 975's action table covers the user-facing surfaces; this doc covers the research docs.)

## What is NOT a documented error (leave alone)

- The **mechanism descriptions** (three-phase optimistic OREC, Fibonacci consensus, weekly cadence, ZOR/OG two-token split) are correct - only the numeric parameters drifted. Do not rewrite the prose, just fix the numbers.
- The **combined OG+ZOR Gini** is deliberately not published (ZOR ERC-1155 encoding is ambiguous - see doc 975). Any doc that wants a combined figure must wait; publishing OG-only 0.73 labeled as such is the correct interim.

## Also See

- [Doc 975](../975-zao-respect-live-numbers/) - the citable source for every correction above; link it from each doc as the numbers get fixed.
- [[reference_zao_respect_onchain_facts]] - the raw 2026-07-05 on-chain pull.
- [Doc 718](../718-zao-fractal-whitepaper-foundations/) - the whitepaper foundations hub; 718b (modeled) is the origin of most stale figures and should be marked `superseded-by: 975` for its numbers.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Edit `718c` lines 22/43/51/64/236/409: 48h->72h, fix the 86,400s math to 259,200s, 10%->~2.6% (1,000 Respect) | @Zaal | PR | 2026-07-13 |
| Edit `705` lines 245-247: 48h->72h (both), threshold ->~2.6% | @Zaal | PR | 2026-07-13 |
| Edit `696` line 129: Gini 0.23 -> 0.73 cumulative (single round = 0.41), soften "dramatically more equal" | @Zaal | PR | 2026-07-13 |
| Edit `696`/`114`/`102`: "90+ weeks" -> "100+ weeks (~101)" everywhere | @Zaal | PR | 2026-07-13 |
| Add `superseded-by: 975` to doc 718b frontmatter (its numbers, not its structure) | @Zaal | Edit | 2026-07-13 |

## Sources

- [FULL] `718c-ordao-onchain-architecture.md`, `705-.../README.md`, `696-.../README.md`, `114-.../README.md`, `102-.../README.md` (ZAOOS working tree, grepped 2026-07-06) - the exact stale lines are cited above.
- [FULL] [Doc 975](../975-zao-respect-live-numbers/) + `reference_zao_respect_onchain_facts` - the measured corrections.
- [FULL] `project_zao_fractal_whitepaper` memory - confirms the whitepaper is the flagship doc and Chapter 9 Limitations must stay honest, which is why the Gini correction matters most.
