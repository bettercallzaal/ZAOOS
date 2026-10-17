# Agent Spend - the unit is the TURN, and the model sets its price

Re-measured 2026-10-17 over 7 days (23,613 deduplicated turns, current list rates): about $0.15 a turn on average, $0.09 to $0.23 by day; by model, Fable 5.1 $0.27, Opus 5.5 $0.15, Sonnet 5.5 $0.03, Haiku 5.5 $0.01. The 2026-08-10 figure of ~$1.01 was the old meter (every streamed line summed, Opus 4.1 rates for every Opus); the same method on the same 7 days still gives $0.97. Token counts are still mostly cache reads. Measurement and history: `research/dev-workflows/2649-rules-history/archive/agent-spend.md`.

**Every turn costs money, and the same turn costs about 25x less on Haiku than on Fable. Spend turns on work, not on looking.**

- **Batch tool calls.** Independent reads (status check, file read, `gh` query) go in ONE turn.
- **Do not poll for human actions.** If the thing being waited on is a merge, a decision or a keypress, stop the loop and let the human restart it. A loop is for work that arrives on its own.
- **Back off hard on quiet.** Two consecutive no-change ticks means stop, not lengthen.
- **Prefer one wide look over several narrow ones.** The expensive mistake is the re-check, not the big read.
- **This is not a licence to skip verification.** Reading files, running tests and verifying claims are the work. Spend turns on finding things out, not on asking whether anything happened yet.
- **Keep spend visible:** `zao-spend` (last 24h by session, with PRs), `zao-spend --days 7`, `zao-spend --by-lane`. On Max these are list-price meter figures, not invoice amounts.
