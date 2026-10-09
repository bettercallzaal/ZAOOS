# Agent Spend - the unit is the TURN, about a dollar

Measured 2026-08-10: cost = turns x ~$1.01, flat across a session; token counts are mostly cache reads. Measurement and history: `research/dev-workflows/2649-rules-history/archive/agent-spend.md`.

**A turn is a dollar. Spend it on work, not on looking.**

- **Batch tool calls.** Independent reads (status check, file read, `gh` query) go in ONE turn.
- **Do not poll for human actions.** If the thing being waited on is a merge, a decision or a keypress, stop the loop and let the human restart it. A loop is for work that arrives on its own.
- **Back off hard on quiet.** Two consecutive no-change ticks means stop, not lengthen.
- **Prefer one wide look over several narrow ones.** The expensive mistake is the re-check, not the big read.
- **This is not a licence to skip verification.** Reading files, running tests and verifying claims are the work. Spend turns on finding things out, not on asking whether anything happened yet.
- **Keep spend visible:** `zao-spend` (last 24h by session, with PRs), `zao-spend --days 7`, `zao-spend --by-lane`. On Max these are list-price meter figures, not invoice amounts.
