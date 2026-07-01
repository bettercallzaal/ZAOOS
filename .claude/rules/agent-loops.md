# Agent Loop Operating Rules

Durable operating rules for any autonomous /loop or agent building/deploying in this repo (Claude Code sessions + ZOE's own loops). Learned online 2026-06-30 (Anthropic "building effective agents" + "effective harnesses for long-running agents", plus 2026 loop-engineering writeups). Full sources in the research doc referenced at the bottom.

## The rules (behavior-changing)

1. **Ground truth over confidence.** Never declare a task done on a feeling. A change is done only when `npm run typecheck` (0 errors), `npm run build`/esbuild, and the relevant tests are green, and the bot boots clean. tsc-passing alone is not enough (esbuild can still crash the bot - see feedback_validate_bot_changes_with_boot).

2. **Read state before acting.** Start each loop pass with `git log -5` + a typecheck, and read the session-state/progress note. Do NOT re-read the whole codebase every cycle - open only the files the current task touches. Context is finite; re-reading everything burns tokens and wall-clock.

3. **Read live code before building.** Docs/gap-analyses overstate what is missing. Three times in one session (ZOL signer, ZOE orchestrator gaps, the loop architecture) the "build X" turned out to be "X already exists, wire the last 10%." Inspect the actual code/state first. Code is ground truth; docs are aspirational.

4. **One feature at a time; never leave a broken state.** Plan -> code -> verify -> commit a single feature before starting the next. If interrupted, the repo/branch must be consistent. Do not context-switch across half-done features.

5. **Cost + iteration ceilings.** Every autonomous work path needs a hard cap (daily item cap, budget cap, one-instance lock). Empty-queue / no-work = zero spend by default. Assume it stops when broke, not when done - so cap it.

6. **Persist lessons to the repo, not just memory.** When a repeated bug or lesson appears, land it in `.claude/rules/` or a skill and commit it, so future loops (and ZOE) read it. Session memory is for user/project facts; operating lessons belong in the repo.

7. **Subagents for bounded research/isolation; inline for the hot path.** Spawn a subagent for "research/audit/verify X" (context isolation, cheaper tokens). Keep code -> verify -> commit inline (faster). Do not grow one giant prompt.

8. **PR-only + human gate is the circuit breaker.** Never push to main or force-push. Autonomous work opens PRs; a human merges. Outbound (posts, DMs), on-chain, and spend stay human-gated. Research docs + internal pings can be autonomous.

9. **One instance per resource.** Only one process may poll a given bot token / hold a given lock (see project_zoe_one_instance_409). A second instance = split-brain. Check liveness by PROCESS, not by tmux-session-name (dead-script-in-live-session hid 3 researchers).

10. **Learn online periodically.** Every several loop cycles, pull fresh best-practices from the web (Anthropic docs + community) and fold behavior-changing ones back into these rules. The loop should improve itself, not just the product.

## Source

Research doc: `research/agents/928-agent-loop-best-practices/` (2026-06-30). Primary: Anthropic Building Effective Agents + Effective Harnesses for Long-Running Agents.
