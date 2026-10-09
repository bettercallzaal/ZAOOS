# Workflow Discipline

Durable operating lessons from the 2026-07-27 workflow re-audit. Behavior-changing.
Auto-loads every session like the other `.claude/rules/*.md`. Siblings:
`agent-loops.md`, `code-restraint.md`, `icm-grounding.md`, `claude-usage.md`.

## 1. One thread, finished, then the next

Do NOT juggle many threads at once. Pick ONE, take it all the way -
**build -> verify -> ship -> confirm with Zaal** - THEN start the next. A session
that runs 10+ simultaneous threads produces a lot but leaves half-done tails (a
CRM insert, a rebase, a board never finished) and is hard to track. Finish before
you start. When a new request arrives mid-thread, capture it (board/todo) and
return to the current thread unless it is genuinely urgent (prod down, a gated ask
Zaal is waiting on). Legibility beats raw output.

## 2. Loop governance - know what is running and what it costs

Every autonomous loop (a ScheduleWakeup dynamic loop, a cron, a builder loop) must
be discoverable and accountable:

- **Before starting a loop, check no sibling is already doing it.** The 102-open-PR
  pileup (2026-07-27) was runaway autonomous loops nobody was tracking - they
  generated PRs + Vercel build cost unseen.
- **Set a loop's purpose ONCE.** Re-issuing / re-aiming a loop's prompt every turn
  is wasted tokens and a sign the purpose is drifting. If it needs a new purpose,
  that is a new decision, not a churn.
- **Empty of work = idle at zero spend**, never spin. Cost-mode always: batch PRs,
  PR-only, nothing gated fires.
- A loop that opens PRs must self-report what it opened, so the count never
  surprises Zaal.

## 3. Robustness-first on infra / deploy / CI / cost changes

Any change to a deploy config, CI gate, or cost control ships with the FAIL-SAFE
path from v1 - not v2 after it breaks. The Vercel `ignoreCommand` broke production
for ~2 days because the first version was not robust to a missing
`VERCEL_GIT_PREVIOUS_SHA` (it threw `fatal: bad object` and errored every deploy).
For infra changes: assume every input can be absent or bad, default to the SAFE
behavior (build, do not error / skip, do not block), and verify the failure path
before shipping.

## 4. Ground on truth; commit as Zaal

- Before brand/project work, ground on the ICM box (see `icm-grounding.md`) - the
  box is the source of truth; downstream copy is generated from it.
- Every clone the work happens in commits as **Zaal Panthaki <zaalp99@gmail.com>**
  (`git config user.email zaalp99@gmail.com`), so GitHub + Vercel attribute the
  commit to a team member and deploys are accepted. A bot-identity author
  (`info@thezao.com` / zao-assistant) gets its Vercel deploys rejected.

## Source

2026-07-27 workflow re-audit (this session's retrospective). Concrete incidents:
the 2-day Vercel outage (ignoreCommand), the 102-PR runaway-loop pileup, session
sprawl across ~15 threads, and the deploy-identity rejection.
