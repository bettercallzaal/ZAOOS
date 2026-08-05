# Confirm Before Claiming Absence - never assert "X is missing" from a partial read

Established 2026-08-05 after two same-session misses: recommending a "failure
memory" as ZOE's biggest gap while `recall.ts`/Bonfire + `reflexion.ts` +
`error-remediation.ts` already existed; and starting a "ZOE can't read the board"
build while `team-tracker.ts` already read + wrote + reconciled + classified it.
Zaal: "you should never ever ever be wrong on these things - id rather it be slower
and cost more money confirming than ever making any mistakes - we cannot ever afford
to have these mistakes in production." This rule makes that binding.

## The one principle

**"X is missing" / "the gap is X" / "we should add X" is a FACTUAL CLAIM ABOUT
ABSENCE, and absence can only be proven by an EXHAUSTIVE search - never by a partial
read.** A partial read proves that X wasn't in the files you happened to open; it
proves nothing about whether X exists. This is `anti-fabrication.md` rule 5 (never
state as fact what you didn't measure) applied to the codebase, and the enforcement
teeth for `agent-loops.md` rule 3 ("read live code first; usually 'build X' is really
'X exists, wire the last 10%'").

## The asymmetry that caused it (name it so you don't repeat it)

The repo is the MOST checkable thing in reach - a `grep` returns ground truth in
seconds. The web is the LEAST checkable. The failure was doing it backwards:
verifying web/field claims rigorously (real fetches) while ASSUMING the local-code
state. Spend the most verification effort on the thing that is cheapest and most
certain to check: our own code.

## The gate (behavior-changing) - before any absence claim or build recommendation

1. **Inventory first.** For any "what does ZOE/the app have / what should we add"
   question, list the whole relevant tree and read each candidate module's purpose
   BEFORE forming a view. For ZOE that is the ~98 modules in `bot/src/zoe/` - dump
   the one-line docstring of each (`awk` the header) and scan it. Do not reason about
   "what ZOE has" from the 3 files you opened for the immediate task.
2. **Exhaustive existence grep for the concept, not just the name.** Search the
   synonyms: a "failure memory" search greps `memory|recall|bonfire|reflexion|error|
   remediation|lesson|episode`, not just "failure memory". Read every file that hits.
3. **State what you searched.** Any absence/gap claim must carry its proof: "grep of
   `bot/src/zoe/**` + `src/**` for [terms] on [date] found [these files]; X is not
   among them" - or downgrade the claim to "I did not find X in [scope searched]",
   which is honest, versus "X doesn't exist", which is a fabrication if the search
   wasn't exhaustive.
4. **When recommending a build, first prove it's not already built** (rungs 1-2 of
   `code-restraint.md`: does it need to exist / is it already here). If a related
   module exists, the recommendation is "extend `<file>`", not "add X".

## Slower + costlier is the correct trade (Zaal, explicit)

Confirming existence exhaustively costs tokens and time. Zaal has explicitly chosen
that cost over any chance of a production mistake. So: **when the cost of a wrong
"it's missing" is a duplicate build, a bad recommendation, or drift against a live
system, spend whatever it takes to verify - re-read, re-grep, ask.** Never trade
correctness on our own systems for speed. This is the one place `claude-usage.md`
cap-thrift is explicitly overridden: burn the cap to be certain about ground truth.

## Keep a living map so it's cheap next time

The inventory should not be re-derived from scratch each session. Maintain a ZOE
capability map (the module list + one-line purpose + "what it already does") as a
doc/rule that any session reads first. A stale or absent map is what made this
expensive; a current one makes "is this already built?" a 10-second lookup.

## Guards

- This is NOT a licence to skip building - it is a licence to build the RIGHT thing
  (extend vs duplicate). Once existence is confirmed, ship (PR-only, verified).
- Applies hardest to autonomous/loop work + anything headed for production, where no
  human is watching the "is this already built?" call.
- A subagent's "ZOE lacks X" is a CLAIM to verify, not a fact (`agent-loops.md` rule
  33) - the orchestrator greps before trusting it.

## Source

Zaal 2026-08-05, from two same-session absence-claim misses (failure-memory /
Bonfire; board-read / team-tracker). Siblings: `anti-fabrication.md` (rule 5,
measure don't guess), `agent-loops.md` (rule 3 read-live-code-first, rule 33 verify
subagent claims), `code-restraint.md` (rungs 1-2, don't rebuild what exists),
`claude-usage.md` (the cap-thrift this explicitly overrides for ground-truth checks).
