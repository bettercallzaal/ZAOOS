---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-07-09
related-docs: 928, 994, 997, 998
original-query: "What are our biggest AGENTIC CODING weaknesses that are EASY to fix?"
tier: STANDARD
---

# 1006 - ZAO agentic-coding weaknesses ranked by effort vs impact (easy fixes)

> **Goal:** Audit ZAO's autonomous-coding stack (agent loops, ZOE workers, research pipeline, Hermes fix-PR pipeline) against 2026 best practices. Identify the biggest gaps that are ALSO cheap to fix. Ground every weakness in actual code state, not generic advice. Separate easy wins from architectural work.

## Key Decisions

This table shows ZAO's TOP agentic-coding weaknesses that are EASY to fix (effort 1-2 / 10). Each row is grounded in actual code inspection (marked with source file/line or doc number). Ranked by impact first, then by effort.

| # | Weakness | Evidence (ZAO actual state) | Fix | Effort (1-3) | Impact |
|---|----------|---------------------------|-----|---------|---------|
| 1 | **Doc-number collisions block PRs on merge** | `research/estate/README.md` row 2: "202 doc numbers collide (doc 441 used 13x, 600 8x)." `.claude/rules/agent-loops.md` rule 19 added 2026-07-09: rebase workaround for collision guard. `scripts/check-research-doc-collisions.sh` enforced in `.husky/pre-commit`. | Implement ranges-per-agent numbering: ZOE gets 2000-2999, terminals 3000+. Update `nextDocNum()` in `bot/src/zoe/research-doc.ts` to respect floor per allocator (one-line constant). This unblocks #1150 PRs on main that hit the collision guard. | 1 | HIGH |
| 2 | **Failed/needs-revision agent tasks produce no escalation; Zaal doesn't know they failed** | `bot/src/zoe/dispatch.ts` line 226: prints flag `✗` for failed/`⚠` for needs-revision in summary. No Telegram escalation, no retry offer, no gate. `bot/src/zoe/workers.ts` returns `status: 'failed' \| 'needs-revision'` but nothing consumes it except logging. `research/estate/` row 4 documents: "failed tasks (techfrenAJ) + needs-revision (mission-control) produce nothing." | Modify `dispatchPlan()` to escalate to Zaal via Telegram DM when >0 tasks fail: "N task(s) failed; review details at [link to run logs]. Retry? y/n". Add escalation to `runs.ts` or dispatch callback. | 2 | HIGH |
| 3 | **ZOE research PRs pile up unmerged; proactive research never committed** | `research/estate/` row 4: "explicit research lands as UNMERGED PRs...proactive Telegram research (SEO/YT blurbs) never committed." `bot/src/zoe/research-doc.ts` creates PR but no auto-merge. Example: doc 990 raidguild PR #1143 open 3 days, collision stalling merge. | (a) Auto-merge research PRs if docs-only + tests pass: append merge logic to `research-doc.ts` POST-PR flow (check PR with `gh api repos/../pulls/.../files`, if all .md/.yaml, auto `gh api -X PUT ../merge`). (b) Daily ephemeral branch for proactive findings: `bot/src/zoe/proactive.ts` writes to `ws/zoe-proactive-YYYYMMDD`, commits, opens PR, nightly auto-merges if green. | 2 | HIGH |
| 4 | **No finish_reason check; token exhaustion silently returns empty output** | `bot/src/hermes/claude-cli.ts` calls Claude and returns `.text`, no check of `finish_reason`. 2026 best practices (Arize observability guide, Anthropic harness guide) flag this: when `finish_reason='length'`, model was cut off mid-stream; claiming "done" is silent failure. | Add post-call check in `callClaudeCli()`: if `finish_reason !== 'end_turn'`, log a warning and treat as error (fail the worker, offer revision within remaining budget). One 2-line check. | 1 | MEDIUM |
| 5 | **Typecheck passes but esbuild crashes; no bot-boot verification in loop** | `bot/src/hermes/preflight.ts` (doc line 22): runs tsc + tests, skips `npm run build`. User feedback rule `feedback_validate_bot_changes_with_boot.md` exists but not enforced. Observed 2026-06-30: agent claimed "done" with tsc=0 but bot crashed on startup due to esbuild error. | Add `npm run build` (esbuild) to preflight gate: expand `runPreFlightGate()` to run `npm run build` before returning ok=true for bot-touched files. Tests on `bot/` already run (line 30), so fail fast if esbuild breaks. | 1 | MEDIUM |
| 6 | **No cost/budget telemetry; spend is invisible until bill arrives** | `bot/src/zoe/cost-ledger.ts` records `recordCall()` per worker (line 353), but no dashboard/alerts. `bot/src/zoe/workers.ts` sums `costUsd` per worker result, totals in `dispatch.ts` line 230. Gap: no daily export, no Telegram alert if >$50/day. | Export cost-ledger to JSON nightly: add `exportLedger()` method to cost-ledger.ts. ZOE scheduler writes daily json to `~/.zao/private/cost-ledger-YYYYMMDD.json`. Telegram ping Zaal if cumulative spend >$50. | 2 | MEDIUM |
| 7 | **No owner/category tags on research docs; orphaned docs accrue with no context** | `bot/src/zoe/research-doc.ts` line 54 creates frontmatter with hardcoded `topic`, `tier`, `status`, but no `owner` or `category` field. Docs cannot be filtered by author/intent. Gap: 800+ research docs, many orphaned by defunct agents. | Auto-tag frontmatter in `research-doc.ts`: parse ZOE's dispatch goal for owner intent (e.g. "research market X" -> owner: zoe, category: market-research). Add simple regex/keyword matching to `topic` selection logic to assign owner/category/keywords. | 1 | LOW-MEDIUM |
| 8 | **Subagents/workers can branch off dirty working trees; no pre-flight git state check** | `bot/src/zoe/workers.ts` calls `callClaudeCli()` with no git status check. `.claude/rules/agent-loops.md` rule 11 (2026-07-08): "NEVER leave uncommitted changes across sequential commands." Observed twice this session: dirty tree -> git checkout main -> silent revert. | Add git-state preflight to `runClaudeWorker()` entry: check `git status --porcelain` in workspace_dir. If dirty, fail with error "working tree is dirty; commit or stash before dispatching." Same check in dispatch.ts before `runOne()`. | 1 | MEDIUM |

## Background

### What the audit covers

ZAO's agentic-coding stack includes:
- **ZOE workers** (research-worker, code-reviewer, data-runner, comms-drafter, etc.) in `bot/src/zoe/workers.ts` — dispatch via `dispatch.ts`
- **Hermes fix-PR pipeline** (coder + critic + auto-PR) in `bot/src/hermes/` — embedded in ZOE as a worker
- **Research doc pipeline** (auto-commit findings to numbered docs) in `bot/src/zoe/research-doc.ts`
- **Operating rules** (11 behavior-changing rules + 7 loop-ops lessons) in `.claude/rules/agent-loops.md`
- **Pre-flight gates** (typecheck, tests, forbidden paths) in `bot/src/hermes/preflight.ts`

### Sources of ground truth

1. **Code inspection** (primary) - read actual implementation files
2. **Documented incidents** - `.claude/rules/` and memory files capture observed failures
3. **2026 best practices** (secondary) - Anthropic harness engineering, Arize observability, cost-management guides, loop-engineering essays from mid-2026
4. **Research doc 928** (agent loop best practices learned 2026-06-30)
5. **Research doc 994** (loop taxonomy + Karpathy method)
6. **Research doc 998** (GitHub repo + doc-numbering estate audit)
7. **Research doc/estate/** (ZOE pipeline leak diagnosis, 2026-07-09)

### What did NOT make the "easy fixes" list

**Architectural/expensive fixes (effort 3, deferred):**
- Cross-step validation in tool chains (requires schema re-architecture across workers)
- Golden-path-vs-exception audits on loops (needs custom observability tooling)
- Fact-checking research claims before commit (requires a separate critic pass)
- Working-tree hygiene enforcement at scale (needs git pre-commit hooks + enforcement)

These are real gaps, but landing them requires design review + multi-PR work. Easy fixes are surgical patches to existing code.

## Why these fixes matter

2026 best practices converge on three patterns ZAO partially has but doesn't fully enforce:

1. **Verification over confidence** (doc 928 rule 1, agent-loops.md) - tsc-passing != done. Finish, compile, boot.
2. **Explicit error propagation** (best-practices essays) - never swallow failures; escalate to humans.
3. **Cost awareness** (Karpathy method, doc 994) - hard caps prevent runaway spend; telemetry makes spend visible.

The weaknesses above are WHERE ZAO has these rules written but not yet wired into the loop orchestrator.

## Sources

- **FULL** - `research/agents/928-agent-loop-best-practices/README.md` (2026-06-30, Anthropic primary sources)
- **FULL** - `research/agents/994-loop-engineering-taxonomy/README.md` (2026-07-08, mid-2026 essays + Karpathy)
- **FULL** - `research/infrastructure/998-github-repo-estate-audit/README.md` (2026-07-09, comprehensive repo/doc audit)
- **FULL** - `research/estate/README.md` (2026-07-09, ZOE pipeline leak diagnosis)
- **FULL** - `.claude/rules/agent-loops.md` (committed 2026-06-30, live operating rules with rule 18-19 added 2026-07-08)
- **PARTIAL** - Arize observability guide (medium article, scope limited to metrics)
- **PARTIAL** - Anthropic harness engineering (internal guide, full principles but not all implementation examples)

## Also See

- [Doc 928](../../../agents/928-agent-loop-best-practices/) - Agent loop best practices (learned online 2026-06-30)
- [Doc 994](../../../agents/994-loop-engineering-taxonomy/) - Loop engineering: 4-loop taxonomy + Karpathy method
- [Doc 998](../../../infrastructure/998-github-repo-estate-audit/) - Full GitHub repo + doc-numbering estate audit
- [Doc/estate](../../../estate/README.md) - ZOE research pipeline leak diagnosis
- [.claude/rules/agent-loops.md](../../.claude/rules/agent-loops.md) - Operating rules (source of truth for loop discipline)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Implement ranges-per-agent doc numbering (fix #1) | @Zaal + Claude | PR | 2026-07-15 |
| Add Telegram escalation for failed tasks (fix #2) | Claude | PR | 2026-07-15 |
| Auto-merge research docs if docs-only (fix #3a) | Claude | PR | 2026-07-16 |
| Add finish_reason check to callClaudeCli (fix #4) | Claude | PR | 2026-07-14 |
| Add esbuild to preflight gate (fix #5) | Claude | PR | 2026-07-14 |
| Land fixes #1-5 in a batch PR to main | @Zaal | Review + merge | 2026-07-16 |
| Fold this doc's methods into `.claude/rules/agent-loops.md` rule 10 (learn online periodically) | Claude | PR | 2026-07-20 |

## Metrics (tracking improvement)

After landing fixes, measure:

- **Doc-number collisions** - should drop to 0 (collision guard blocks forward)
- **Research PR merge rate** - should move from "indefinite" to "within 1h" (auto-merge)
- **Failed task escalation** - should move from "none" to "100% of failures pinged to Zaal"
- **Bot startup failures** - should move from "post-facto bug reports" to "caught in preflight"
- **Cost visibility** - should move from "invisible until billing" to "daily alerts"
