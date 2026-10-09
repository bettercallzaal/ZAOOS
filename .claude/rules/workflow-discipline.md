# Workflow Discipline

From the 2026-07-27 workflow re-audit (incidents: `research/dev-workflows/2649-rules-history/archive/workflow-discipline.md`).

1. **One thread, finished, then the next.** Do not juggle many threads at once: build -> verify -> ship -> confirm with Zaal, then start the next. A mid-thread request is captured (board/todo) unless genuinely urgent (prod down, a gated ask Zaal is waiting on).
2. **Loop governance.** Every autonomous loop (ScheduleWakeup loop, cron, builder loop) must be discoverable and accountable. Before starting a loop, check no sibling does it. Set its purpose once. Empty of work = idle at zero spend. Batch PRs, PR-only, nothing gated fires. A loop that opens PRs self-reports what it opened.
3. **Robustness-first on infra / deploy / CI / cost changes.** Ship the fail-safe path in v1: assume every input can be absent or bad, default to the SAFE behavior (build, do not error; skip, do not block), and verify the failure path before shipping.
4. **Ground on truth; commit as Zaal.** Ground brand work on the ICM box. Every clone commits as **Zaal Panthaki <zaalp99@gmail.com>** (`git config user.email zaalp99@gmail.com`); a bot-identity author gets its Vercel deploys rejected.
