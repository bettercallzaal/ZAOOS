# 1203 - ZAO OS build velocity: the agent-fleet inflection (verified)

**Tier:** STANDARD
**Date:** 2026-07-17
**Status:** Verified from `gh` merge history
**Owner:** builder loop

## Why this doc exists

[Doc 1201](../1201-zao-canonical-facts-ledger/) flagged **"34 PRs/week"** (doc 449 one-pager)
as *needs canonical source*. This resolves it from the real merge history — and the honest
answer is a **story, not a single number**: ZAO OS went from a ~30-PR/week human repo to a
60–175+/week agent-fleet repo, and raw PR count now needs a caveat (most of it is
docs/tests automation). North Star #1 (documented DAO) + the [doc 1074](../../agents/1074-agent-leverage-reduce-founder-subsidy/)
agent-leverage thesis (the fleet *is* the founder-subsidy reduction).

## Verified: merged PRs/week + composition (2026-03-19 → 2026-07-17)

1,459 merged PRs across 18 ISO weeks. `product` = feat+fix (real code change); `automation`
= docs+tests (the research/test fleet). Both are real work; separating them keeps the
headline number honest.

| Week | Total | product (feat/fix) | automation (docs/tests) | auto % |
|------|------:|------:|------:|---:|
| 2026-W12 | 7 | 7 | 0 | 0% |
| 2026-W13 | 14 | 12 | 1 | 7% |
| 2026-W14 | 49 | 40 | 1 | 2% |
| 2026-W15 | 39 | 26 | 3 | 7% |
| 2026-W16 | 58 | 34 | 15 | 25% |
| 2026-W17 | 112 | 55 | 43 | 38% |
| 2026-W18 | 109 | 41 | 63 | 57% |
| 2026-W19 | 32 | 3 | 28 | 87% |
| 2026-W20 | 43 | 14 | 27 | 62% |
| 2026-W21 | 132 | 33 | 88 | 66% |
| 2026-W22 | 90 | 31 | 53 | 58% |
| 2026-W23 | 37 | 2 | 21 | 56% |
| 2026-W24 | 47 | 3 | 35 | 74% |
| 2026-W25 | 50 | 14 | 26 | 52% |
| 2026-W26 | 84 | 34 | 43 | 51% |
| 2026-W27 | 66 | 11 | 46 | 69% |
| 2026-W28 | 175 | 56 | 105 | 60% |
| 2026-W29* | 315 | 59 | 230 | 73% |

*W29 is the current, partial week.

## The finding: two eras

- **Human era (W12–W15, mid-Mar → mid-Apr):** ~7–49 PRs/week, **0–7% automation** — almost
  all feat/fix. This is the "~34/week" the one-pager captured (W12–W15 mean ≈ 27; W14 hit 49).
  Accurate *for its time*.
- **Agent-fleet era (W16 → now):** **43–315 PRs/week, 50–87% automation.** The tmux loop
  fleet + ZOE came online and the repo's *documented output* roughly **5×'d** — but the
  growth is overwhelmingly **research docs + tests**, not product code.

**Cite discipline (updates the doc 1201 ledger):**
- "**~30 PRs/week** of product code (feat/fix)" is the stable, defensible build-in-public
  number across both eras — product velocity has stayed ~7–56/week, it did **not** 5×.
- "**60–175+ PRs/week total**" is real but **50–73% is agent automation** (docs/tests) — quote
  it only *with* that caveat, or it reads as inflation.
- The honest headline: *"An agent fleet took ZAO OS from ~30 to 150+ merged PRs/week,
  mostly by automating the research + test corpus — the founder-subsidy-reduction thesis
  (doc 1074) showing up in the commit graph."*

## Caveat (stated, not hidden)

Raw PR count is a **weak** proxy for progress — a fleet optimizes it trivially. Product
velocity (feat/fix) and *merged-and-not-reverted* are better. This doc reports raw counts
because they are what "34 PRs/week" claimed; the composition split is the honest correction.
The merge gate (human review) is the real throughput limit — see the auto-merge workflow
and the `fleet-improvement` board items.

## Verifier

- **`measure-pr-velocity.py`** — re-runnable (`gh pr list --state merged`, read-only, needs
  `gh` auth). Prints the weekly table + JSON.

```bash
python3 measure-pr-velocity.py
```

## Also see

- [Doc 1201 - ZAO canonical facts ledger](../1201-zao-canonical-facts-ledger/) (this feeds the "34 PRs/week" row)
- [Doc 1074 - Agent leverage: reduce founder subsidy](../../agents/1074-agent-leverage-reduce-founder-subsidy/)
- [Doc 1200](../1200-respect-onchain-facts-verified/) / [1202](../1202-fractal-onchain-settlement-history/) — sibling verified-facts docs
