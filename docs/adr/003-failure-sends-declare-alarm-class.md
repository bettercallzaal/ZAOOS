# ADR-003: Failure sends declare their class at the sink, not by lint

**Status:** Proposed
**Date:** 2026-09-17
**Deciders:** Zaal (pending); proposed by the antigravity-automation lane at the seat's request
**Tags:** observability, send-budget, zoe, error-handling

## Context

ZOE's send budget (`bot/src/zoe/send-budget.ts`, doc 2432) gives every Telegram send a class. A send outside any `runWithSendClass` context defaults to `status`, and `status` is **dropped** once the day's cap is spent (the cap is 3 on the live box, per Zaal's "2-4 a day"). `alarm` always passes.

That default is correct for routine traffic, but it is also how a real failure went unheard. From 2026-09-10 to 09-16, the repo-improver's `fix pipeline errored: createRun failed: Could not find the table 'public.hermes_runs'` was sent 6 times, on 4 days. All 6 went out as `status` past a spent cap (15/3 to 24/3), and all 6 were dropped. #3538 fixed that one path by routing it through an `alarm` sink.

The seat asked for a guard against the next instance: **a lint asserting that a send from a `catch` block carries the alarm class.** This ADR measures that idea before recommending anything.

## What a catch-block lint would find (measured on main, 2026-09-17)

A scan of `bot/src` (tests excluded) found every `catch { ... }` whose body calls `sendMessage`, `sendChunked*`, `postToTopic`, `notify*`, or a bare or injected `log(`. It found **6**, and none carries the alarm class:

| site | what it is | at risk from the budget? |
|---|---|---|
| `zoe/concierge.ts:177` | `console.log` (regex false positive) | no |
| `zoe/models/cli-cap-aware.ts:32` | `console.log` (regex false positive) | no |
| `zoe/posts/buttons.ts:195` | "regen failed" to Zaal, inside a button callback | no: runs in the `reply` context, which always passes |
| `hermes/commands.ts:110` | "Coder loop crashed", inside a command handler | no: `reply` context |
| `devz/index.ts:386` | "Hermes crashed outside the loop" | no: the devz bot has no send budget. `installSendBudget` has one caller, `zoe/index.ts:379` |

So the lint would flag nothing that is actually at risk today. **And it could not have caught the one real instance.** The repo-improver did not send from its catch block. It called an injected `deps.log(...)`, whose class was decided far away in `scheduler.ts`. A syntactic rule sees a function call, not the send class that call ends up with.

## Decision (proposed)

Do **not** add a catch-block lint. Make the class part of the sink's type instead, at the dependency-injection boundary where the real failure happened:

1. **A failure sink is a distinct type.** Where a module takes injected senders, one for routine output and one for breakage, the breakage one is typed `AlarmSink` (a branded function type). The only way to build one is `asAlarmSend(send)`, which #3538 added to `repo-improver.ts`. Passing a plain `log` where an `AlarmSink` is expected is then a **type error**, caught by `tsc` in CI, and it survives refactors that a regex would not.
2. **Each module that takes an alarm sink has a test that its errors reach it** (the pattern in `repo-improver.test.ts` since #3538, with a mutation that swaps the alarm for `log`).
3. **Keep the runtime picture honest rather than trying to predict it.** #3547 makes the send log record delivered sends as well as blocked ones. With both sides in one file, a periodic read of "status-class sends that were dropped and whose preview reads like a failure" becomes a report anyone can run. It is a report, not a gate: over 09-10 to 09-16, 29 of 2,068 drops contained failure words, and only 6 were real failures.

## Consequences

- Positive: the check lives where the bug lived (the injection boundary), fails at compile time, and costs no false positives.
- Negative: it only covers modules that adopt `AlarmSink`. A brand-new direct `bot.api.sendMessage` from a cron's catch block, outside any context, would still default to `status`. Item 3 is the backstop for that, and it is after the fact.
- Neutral: the `status` default stays. Changing the default for untagged sends would undo the budget's purpose.

## Alternatives Considered

- **Catch-block lint.** Rejected: 0 real hits today, blind to injected senders, and it would have missed the actual instance.
- **Classify by message text at the gate** (e.g. treat `errored|failed` as alarm). Rejected: that is judgement inside the gate, and it would promote findings like "error handling: ..." and research questions that merely contain the word. Measured: 23 of the 29 failure-word drops were not failures.
- **Default untagged sends to `alarm`.** Rejected: that re-opens the flood the budget exists to stop.

## References

- doc 2432 and its 2026-09-17 follow-through (#3546)
- #3538: repo-improver alarm sink and `asAlarmSend`
- #3547: the send log records delivered sends
- ADR-002: silent-failure audit-trail drop pattern
