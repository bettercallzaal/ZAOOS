# Agent Spend - the unit is the TURN, and it costs about a dollar

Zaal, 2026-08-10: "I just reupped twice this week, this is unsustainable. I don't
even know what results I'm getting out of these loops. It said used over $10 and I
want to know on what, in less than 24 hours."

Nothing recorded it. Claude Code writes token counts into its session transcripts
but **no dollar figure**, and no ledger existed anywhere on the machine. Spend was
invisible by construction: the only signal was the bill. `scripts/agents/zao-spend`
(also `~/bin/zao-spend`) now prices the transcripts and puts the cost next to the
PRs opened in the same window.

## What the measurement actually showed

Measured over 24h on 2026-08-10, 15 sessions, $1,838 of list-price consumption:

| Component | Share |
|---|---|
| cache reads (998.5M tokens) | ~81% |
| cache writes (22.3M tokens) | ~12% |
| output generated (2.0M tokens) | ~8% |

**Two hypotheses died on contact with the data, and both are worth knowing:**

1. *"Long sessions get progressively more expensive."* **False.** Per-turn cost
   across one 14,021-turn session was flat - $1.07, $1.19, $1.03, $1.04 per turn
   across its four quarters. Compaction bounds the context, so turn 14,000 costs
   what turn 10 costs. Session LENGTH is a context-conflict problem
   (`session-boundaries.md`), not a cost problem.
2. *"The token count is the thing to watch."* **Misleading.** 998M of the ~1.03B
   tokens were cache READS, billed at a tenth of input. A huge token number is
   mostly evidence of a warm cache, not of waste.

**The finding that survived: cost = turns × ~$1.01.** Flat, predictable, and
almost entirely independent of how much you accomplish in each one.

## What this changes (behavior-changing)

**A turn is a dollar. Spend it on work, not on looking.**

- **Batch tool calls.** Three independent `Bash` calls in one turn cost what one
  costs. Issuing them across three turns costs triple for identical output. Any
  independent reads - a status check, a file read, a `gh` query - go in ONE turn.
- **Polling loops are the most expensive way to wait.** A `/loop` tick that checks
  state and finds nothing changed still costs $6-10, because it is 6-10 turns.
  Five ticks that report "nothing changed" is $40 for a sentence. If the thing
  being waited on is a HUMAN action (a merge, a decision, a keypress), do not poll
  at all - stop the loop and let the human re-start it. A loop is for work that
  arrives on its own, never for work that arrives when Zaal gets to it.
- **Back off hard on quiet.** `agent-loops.md` rule 5 says empty queue = zero
  spend. Now it has a number: two consecutive no-change ticks means stop, not
  lengthen. Lengthening a pointless loop still pays for it, just later.
- **The expensive mistake is the re-check, not the big read.** Reading a 400-line
  file once is one turn. Reading four 100-line files across four turns is four.
  Prefer one wide look over several narrow ones, which inverts the usual instinct
  to "just check one more thing".

## What did NOT change

- Reading files, running tests, and verifying claims are the WORK. This is not a
  licence to skip verification to save turns - a wrong claim shipped to production
  costs more than any number of checks (`confirm-before-claiming-absence.md`,
  which explicitly says burn the cap to be certain about ground truth).
- The lesson is to spend turns on *finding things out*, not on *asking whether
  anything happened yet*.

## Keeping it visible

`zao-spend` runs offline in a second and answers the question that had no answer:

```
zao-spend              # last 24h, by session, with the PRs it bought
zao-spend --days 7     # the week
zao-spend --by-lane    # grouped by working directory
```

It prints cost per PR and cost per 1k output tokens, so a window with real spend
and no output is visible rather than inferred. On Max these are list-price
consumption figures, not invoice amounts - a meter, not a bill.

## Source

Zaal 2026-08-10, after reupping twice in one week with no visibility into what the
loops produced. Measured with `zao-spend` against 15 sessions of live transcripts.
Siblings: `claude-usage.md` (which surface for which task - this adds the unit
cost), `agent-loops.md` (rule 5 cost ceilings, rule 17 the loop is the product),
`session-boundaries.md` (session length is a correctness problem, and now
demonstrably NOT a cost one), `noisy-signal-guard.md` (a check that always reports
nothing is a check nobody should be paying for).
