# Recap Follow-Through - a recap is written at the moment of promising

Established 2026-08-20 by the transcript re-verify sweep, after the same failure
turned up in four unrelated meeting docs. Not one of them is wrong about what was
said. Every one of them is silent about whether any of it happened.

## The failure, stated once

A meeting recap gets written on or within days of the call. That is the moment
when everyone has just agreed to things and nothing has been done yet. The doc
freezes there. Weeks pass, and it still reads as an active thread, because a
promise and a kept promise look identical in a document that was never updated.

**A recap is therefore the WORST available record of whether a commitment was
honoured, and it is the record everyone reaches for.**

## The evidence (measured 2026-08-20)

| Doc | Call | last-validated | Silent for | What was owed |
|---|---|---|---|---|
| 947 Marie | 2026-06-22 | 2026-07-03 | 59 days | fund-vote add, an introduction, a URL |
| 866 Thy Revolution | 2026-06-17 | none | 64 days | $100 into a Giveth, two calls to schedule |
| 940 Sistla | 2026-06-25 | 2026-06-25 | 56 days | the product link, compute credits |
| William / Artizen | 2026-07-22 | - | ~28 days at check | read docs, sign up, submit |

Doc 947 is the sharpest case: it was validated **eleven days after the call and
before the Wednesday deadline it tracks could resolve**. The validation stamp
certifies that the recap matches the call. It certifies nothing about the world.

Three of those four are commitments to people OUTSIDE ZAO, made to someone
mid-crowdfund, someone waiting on a laptop, and a partner waiting to be tested.

## The rule (behavior-changing)

1. **Every recap carries a follow-through block: who owes what, to whom, by
   when.** Not an action list in the abstract. A named person on each side of
   each item. "Zaal sends X to Marie by Wednesday" survives contact with time;
   "send link" does not.

2. **A commitment to someone outside ZAO goes on the BOARD, not only in a doc.**
   Internal todos can live in prose because we re-read our own docs. A
   relationship debt cannot: nobody re-opens a June recap to check whether an
   introduction happened, and the person waiting has no way to raise it. Board
   card, route=human, real due date.

3. **A doc whose last-validated date predates its own deadlines is NOT current
   state.** Re-validate before citing it. If a recap says a thing was due
   Wednesday and the stamp says Monday, the stamp is evidence about the writing,
   not about the doing (`state-claims.md`: name the source of the claim).

4. **Distinguish BLOCKED from DROPPED, in the doc.** Doc 947 recorded "send the
   Maine URL" with no note that Zaal had said on the same call "I don't have any
   projects up. I will be." An item that could not yet be done reads as neglect
   when the precondition is missing. Write the precondition next to the promise.

5. **Do not resolve an ambiguous promise by guessing.** On the same call it is
   unclear whether Marie already knew the person she was being introduced to -
   the speaker labels are inferred. Recorded as UNRESOLVED, because guessing
   either way changes what is owed. Honest uncertainty beats a confident wrong
   entry (`anti-fabrication.md` rule 4).

## Guards

- This does not ask for a status field on every line of every doc. It asks for
  one block, and for the outside-ZAO items to exist somewhere that gets read.
- A recap that is genuinely complete on the day - no open commitments - says so,
  and needs nothing further. Doc 913 is that case and it passed the sweep clean.
- Re-validating is cheap and is not a rewrite: append a dated follow-through note
  saying what happened. Never edit the original record of what was said.

## Source

The 2026-08-20 transcript re-verify sweep (ZAOOS PRs #3177, #3178, #3179, #3180),
which re-read eleven meeting transcripts in full against their docs. The four
instances above surfaced independently of each other, which is what made it a
pattern rather than an oversight. Siblings: `state-claims.md` (merged is not
running; name the source), `handoff-discipline.md` (the artifact carries the
state, not the conversation), `anti-fabrication.md` (done vs planned),
`silent-failure-guard.md` (a thing that looks fine while doing nothing).
