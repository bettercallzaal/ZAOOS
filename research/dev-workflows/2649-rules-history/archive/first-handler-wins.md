# First-Handler-Wins - when two handlers read the same input, the first to claim it wins silently

Established 2026-08-08 after THREE separate bugs in one day turned out to be the
same bug. Each looked like a broken feature. Each was actually a working feature
that a different handler had eaten before it could run.

This is the input-side twin of `silent-failure-guard.md`. That rule is about a
system reporting success while doing nothing. This one is about a message being
consumed by code that had no business consuming it - and because the consuming
path returns success, nothing anywhere reports a problem.

## The three, all on 2026-08-08

1. **`build:` never reached the build classifier.** The batch-answer guard in
   `index.ts` accepted any lowercase word followed by a colon as a question key
   (`/^\d+:|^[a-z]+:/i`). `build:` matched. That branch sits ~1000 lines above
   `detectBuildIntent` and RETURNS, so the classifier never ran. It ate the
   ENTIRE build vocabulary - build, code, fix, ship, implement - because every
   one is lowercase letters plus a colon. Zaal graded the DM build 1/10; the
   feature was fine, it was unreachable through its own documented syntax.

2. **A ZOE reply to one comment marked every other comment answered.**
   `findUnansweredMentions` treated ANY later ZOE comment as an answer. But ZOE
   is not one writer - `task-teammate-ack` also posts as ZOE. Its ack of Iman's
   comment landed after Zaal's `@zoe` command and marked that command answered.
   The command would never have run. No error, no log: the queue simply stopped
   containing it.

3. **The same board command re-ran every hour.** Found by a sibling loop the
   same day (PR #3000) - the mirror image of (2). Where (2) was "claimed by the
   wrong handler", this was "never claimed at all", so it stayed eligible
   forever.

A fourth, non-code instance the same day: `bus-poll.py` re-sent a 2000-word
message every hour for six hours because it polls `status=new` and deliberately
never marks read - nothing owned the "I already told you this" state.

## Why it is invisible every time

The swallowing path **succeeds**. It returns 200, or replies "Logged 1 answer
from batch", or exits 0. Every monitor stays green. The only symptom is a
feature that quietly does nothing, which reads as "the feature is broken" and
sends debugging into the innocent module.

That is why (1) cost a day: the obvious place to look was the build classifier,
where nothing was wrong.

## The rule (behavior-changing)

**When more than one handler can match the same input, the routing must be
explicit, ordered, and observable.**

1. **Specific before generic, and say so in a comment.** A command prefix
   (`build:`, `note:`) is more specific than a generic pattern (`^[a-z]+:`).
   The generic one must EXCLUDE the specific vocabulary, not merely sit after
   it - because the first match returns.

2. **A handler that RETURNS owns the input. Guard it at the gate.** If a branch
   ends the request, a wrong match there is unrecoverable - nothing downstream
   runs. Put the exclusion on the branch itself, and again inside the function
   it calls. Defence at the gate and in the room; the duplication is deliberate.

3. **"Handled" must name WHAT it handled.** Never infer handled-ness from
   authorship, presence, or timing. A reply records the id of the thing it
   answers (`replyTo`), a poller records the id of what it surfaced. "Some
   later message from the same author" is not an answer to THIS message.

4. **Announce the claim.** The handler that consumes an input logs that it did,
   once (`featureRan`). Three of today's bugs were diagnosed in minutes only
   because zero `[zoe/ran]` lines proved the classifier had never executed -
   distinguishing "ran and declined" from "never reached". Without that, you
   debug the wrong module.

5. **A regression test uses the VERBATIM input that failed.** Not a
   paraphrase. The exact string Zaal typed, the exact comment thread. These
   bugs live in the gap between what you think the input looks like and what it
   is.

## The tell

Before adding any handler that reads free-form user input, ask: **what else
reads this same input, and which of us runs first?** If you cannot answer
without grepping, you are about to create one of these.

And when a feature "does nothing" with no error anywhere - do not start in the
feature. Start by proving it was ever REACHED.

## Guards

- This is not an argument for one giant handler. Separate handlers are right;
  unordered, unguarded, silent ones are not.
- Ordering alone is not a fix. (1) was "ordered" - the batch guard genuinely came
  first. It needed an EXCLUSION, not a reshuffle.

## Source

2026-08-08: PRs #2988 (build swallowed), #2999 (reply marked everything
answered), #3000 (command re-ran hourly), plus the `bus-poll.py` repeat.
Siblings: `silent-failure-guard.md` (green while broken), `noisy-signal-guard.md`
(red while fine), `state-claims.md` (name the source), `anti-fabrication.md`.
