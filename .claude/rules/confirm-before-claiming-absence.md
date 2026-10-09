# Confirm Before Claiming Absence

**"X is missing" / "the gap is X" / "we should add X" is a claim about absence, and absence is proven only by an EXHAUSTIVE search, never a partial read.** Zaal chose slower and costlier over any production mistake. Incidents, and why mechanising this failed: `research/dev-workflows/2649-rules-history/archive/confirm-before-claiming-absence.md`.

Spend the most verification on the cheapest, most certain thing to check: our own code.

**The gate, before any absence claim or build recommendation:**
1. **Inventory first.** List the whole relevant tree and read each candidate module's purpose before forming a view. For ZOE, dump the one-line header of every module in `bot/src/zoe/`.
2. **Exhaustive grep for the concept, not just the name** - search the synonyms and read every file that hits.
3. **State what you searched.** "grep of [scope] for [terms] on [date] found [files]; X is not among them" - or downgrade to "I did not find X in [scope]".
4. **When recommending a build, first prove it is not already built.** If a related module exists, the recommendation is "extend `<file>`".

When a wrong "it's missing" would cost a duplicate build, a bad recommendation, or drift against a live system, spend whatever it takes to verify. This overrides `claude-usage.md` cap-thrift for ground-truth checks. Keep a living capability map so the check is cheap next time.

- **Do not rebuild a hook or regex that detects absence claims** - it was tried 2026-08-10 and cannot work (hooks never see prose; regex fired only on false positives and missed the real case). Fix the conditions instead: short single-thread sessions (`session-boundaries.md`).
- Not a licence to skip building - it is a licence to build the right thing (extend vs duplicate); once existence is confirmed, ship (PR-only, verified). Applies hardest to autonomous work. A subagent's "ZOE lacks X" is a claim the orchestrator greps before trusting.
