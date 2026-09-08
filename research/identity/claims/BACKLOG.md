# Retracted-claims backlog - live hits that predate the check

> Every count in this file carries a `zao-measure` citation. Re-run it rather
> than trusting the prose - `zao-measure --verify "<label>"` says HOLDS, DRIFTED
> (with both values) or UNVERIFIABLE. A figure with no source is a claim.

Written 2026-09-08 when `zao-claims-check` first ran across the estate. These are
occurrences the check FOUND and that are NOT yet fixed. They are recorded here
rather than deleted from the ledger or silently mass-edited, because two of them
turn on a question only Zaal can answer.

Both rows below are `scope=new` in the ledger. That means the check stops NEW
citations from today, and does not fail on the existing ones. **`scope=new` here
is a staging decision, not a verdict that the claim is acceptable.** Each row says
what would promote it back to `scope=all`.

---

## 1. `zaostock-budget` - 154 live hits - UNRESOLVED, NEEDS ZAAL

<!-- measured 2026-09-08T19:20Z - zao-measure --verify "ZAOOS: live citations of the retracted $25K/$20K ZAOstock figure on origin-main" -->

**The count is 154, and it was written as 157 first.** 157 was the claims-check
raw hit count, which uses different exclusions; 154 is the reproducible figure on
`origin/main` with `_archive` and already-retracted lines excluded. Re-run it
with the citation above rather than trusting this sentence - that is the whole
point of the number carrying one.

**The contradiction.** `zaonyc/CLAUDE.md` says, verbatim:

> **ZAOstock budget: ~$5K target.** The $20K/$25K/$7K figures in doc 1013 are
> explicitly retracted and must not be cited anywhere, public or internal.

But 154 live places cite $25K as the goal, including surfaces that are clearly
current, not archival:

- `.claude/skills/zao-stock/zao-stock.md:22` - `| **Budget** | $5K minimum / $25K goal |`
- `BRAIN/projects/zao-stock-2026-10-03.md:74` - `| Goal | $25K | project_zao_stock_confirmed.md |`

**Why I did not just fix it.** 154 sites cannot all be wrong by accident, and the
skill file states $5K and $25K together as floor and goal - which is coherent, and
is not what "explicitly retracted" describes. Either the retraction is narrower
than the rule states (it kills doc 1013's specific budget claim, not a $25K goal),
or the estate never got the memo. Mass-editing 157 files on my reading of an
ambiguous rule is the same class of error as the thing this whole check exists to
prevent.

**The question for Zaal, one line:** is $25K still a live ZAOstock goal, or is
~$5K the only number that may appear anywhere?

**Promote to `scope=all`** once he answers and the 154 are reconciled.

---

## 2. `candy-impact3` - CLEARED 2026-09-08, same day it was raised

**This entry overstated the problem and is corrected here rather than quietly
edited.** It claimed 7 unambiguous live hits. On reading each one, most already
said "**Former** Impact3/Milk Road" and were correct. The pattern was too broad:
it matched any co-occurrence of "Candy" and "Impact3", when what Zaal actually
corrected is that she **no longer works there**. Connections outlast a job.

Two genuinely asserted a current sponsorship route and are now fixed:
- `ZAO-STOCK/research/224-zao-stock-multi-year-vision/README.md:807`
- `ZAO-STOCK/research/231-community-profiles-tyler-candy-swarthy-dcoop/README.md:455`

Both carried the identical table row that doc 229 had **already corrected on
2026-09-07** - fixed in one place, left in two others. That is the third
instance today of a correction applied to one site and reported as done.

The `docs/superpowers/plans/2026-04-14-...` hit is dated meeting minutes and is
left as the record of what was planned in April.

The ledger row is narrowed to present-tense employment and promoted to
**`scope=all`**.

---

## What was fixed rather than backlogged, 2026-09-08

- `takeover-2025` - 8 sites across 2 repos (ZAOOS#3460, zao-nyc#2)
- `third-consecutive-irl`, `third-year-conference` - the counts resting on it
- `jango-alumni` - doc 722f's "Incubator alumni | JANGOUU" row, which is where
  the classification CLAUDE.md calls superseded actually lived. The correction was
  recorded on 2026-09-03 and never applied to the source doc until 09-08.
