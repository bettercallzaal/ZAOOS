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

## 1. `zaostock-budget` - ANSWERED 2026-09-08, and the answer was neither option

**Zaal, direct: "$5K PUBLIC, $25K INTERNAL ONLY."**

~$5K is the only ZAOstock number that goes outward - any public copy, post, deck
or page. $25K stays in planning docs and never appears in public copy.

**Both options I put in front of him were wrong.** I asked "is $25K a live goal,
or is ~$5K the only number allowed anywhere?" Selecting either would have
recorded something he did not say, which is why the menu came back *escaped*
rather than answered. The real rule is a **surface** rule, not a truth rule: the
figure is correct and still barred from a page. **A number can be true and out
of bounds.**

That also explains the 154, which never needed explaining as a contradiction.
Those citations are in planning docs and skills - internal, where $25K belongs.
Nothing was wrong with them, and mass-editing them would have destroyed a
correct internal figure to satisfy a rule that was never about internal docs.
Not editing them turned out to be right for a better reason than the one I gave.

**The ledger could not express this.** `scope=all` means false everywhere,
`scope=new` means true history that must not be written fresh. This is neither,
so `scope=public` now exists: it fires only on paths a repo names in its own
`.claims-public`, and a repo that declares none is **reported as unchecked**,
never quietly passed.

Declared so far: `zao-nyc` (`card/*`, `hop/*` - both published as Artifacts).
**Still undeclared: ZAOOS, zao-vault, zaoonparagraph-nyc.** Until each names its
public copy, the rule does not bind there and the check says so on every run.

Verified by outcome: planting `$25,000` into `card/zaonyc.html` fails the check
and names the line; internal docs discussing the figure are untouched. Public
surfaces in `zao-nyc` are clean today - the card says $5,000 and nothing else,
and there is no barred figure in any newsletter or socials draft.

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
