---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-10
related-docs: "2255, 2127, 928"
original-query: "Do analysis on this and how others do this and research more indepth on ways to help us out in guardrails and more parameters to actually let the agents move autonomously"
tier: STANDARD
---

# 2258 - Agent spend: what a turn costs, what Anthropic already ships, and the parameters that let a loop run unattended

> **Goal:** Zaal reupped twice in one week with no idea what the loops produced. Measure the real cost shape, compare it to how this is done elsewhere, and turn the result into parameters an autonomous agent can be held to.

## The question

Zaal, 2026-08-10: *"I just reupped twice this week, this is unsustainable. I don't even know what results I'm getting out of these loops. It said used over $10 and I want to know on what, in less than 24 hours."*

Nothing on the machine could answer it. Claude Code writes token counts into its session transcripts but no dollar figure, and no ledger existed. Spend was invisible by construction: the only signal was the bill.

## What we measured (ours, first-hand)

`scripts/agents/zao-spend` (built for this, PR #3032) prices the transcripts and puts the cost beside the PRs opened in the same window. Over 24h on 2026-08-10, 15 sessions:

| Component | Tokens | Share of cost |
|---|---|---|
| cache reads | 998.5M | ~81% |
| cache writes | 22.3M | ~12% |
| output generated | 2.0M | ~8% |

**Two plausible hypotheses died on contact with the data. Both are worth recording, because both are the kind of thing a team optimises for months without checking.**

1. **"Long sessions get progressively more expensive."** False. Per-turn cost across one 14,021-turn session was flat: $1.07, $1.19, $1.03, $1.04 across its four quarters. Auto-compaction bounds the context, so turn 14,000 costs what turn 10 costs. Session length is a *context-conflict* problem (`session-boundaries.md`) and demonstrably **not** a cost one.
2. **"The token count is the number to watch."** Misleading. 998M of ~1.03B tokens were cache *reads*, billed at roughly a tenth of input. A huge token count is evidence of a warm cache, not of waste.

**What survived: cost = turns x ~$1.01.** Flat, predictable, and nearly independent of what each turn accomplishes. The unit of spend is the assistant turn, not the token and not the hour.

The immediate consequence, and it indicted our own tooling: a `/loop` tick costs $6-10 because it is 6-10 turns, whether or not anything changed. On 2026-08-10 the 07:00 and 08:00 hours cost **$94** and produced one PR verification, with three of five ticks reporting "nothing changed". The loop was polling for *Zaal to merge a PR* - a human action, on a human's schedule.

## What Anthropic already ships, which we were not using

This is the part worth internalising: **the platform already emits exactly what we were missing, and `zao-spend` was built without checking.** Same failure as building a `/rename` command the same morning that Claude Code already had one - a build started before an existence check. `confirm-before-claiming-absence.md` exists for this and did not fire, because the question never got asked out loud.

Verified by raw fetch of `docs.claude.com/en/docs/claude-code/monitoring-usage` on 2026-08-10, Claude Code emits OpenTelemetry metrics behind `CLAUDE_CODE_ENABLE_TELEMETRY=1` plus an `OTEL_METRICS_EXPORTER`. The metric set includes:

```
claude_code.cost.usage          claude_code.token.usage
claude_code.session.count       claude_code.commit.count
claude_code.pull_request.count  claude_code.lines_of_code.count
claude_code.active_time.total   claude_code.tool.execution
claude_code.tool.blocked_on_user  claude_code.tool_decision
claude_code.api_error           claude_code.api_retries_exhausted
claude_code.compaction          claude_code.permission_mode_changed
```

Two of those are the KPI this whole exercise was reaching for: **`cost.usage` next to `pull_request.count` and `commit.count`** is cost-per-output, live, without parsing anything. And `tool.blocked_on_user` is precisely the "a lane is frozen waiting on a keypress" signal that took a bespoke `zj` rewrite to surface this morning.

`/usage` shows the plan breakdown in-session; `/usage-credits` adds credits.

**`zao-spend` still earns its place** for two things OTEL cannot do: it works **retroactively** over transcripts already on disk (OTEL only records from the moment it is switched on), and it correlates spend to PRs with no collector to run. The right shape is both: OTEL for live, `zao-spend` for forensics.

## How this is costed elsewhere - the benchmark that matters

From the same source, verbatim:

> "the average cost is around $13 per developer per active day and $150-250 per developer per month, with costs remaining below $30 per active day for 90% of users"

Our 24h figure was **$1,838 of list-price consumption across 15 sessions** - roughly 140x a typical developer-day. Two honest qualifiers before anyone panics: on Max this is a *consumption meter, not an invoice*, and 15 concurrent sessions is not one developer. But it does mean our usage sits far outside the distribution these tools are designed around, which is exactly why the cap keeps being hit.

And directly relevant to running six lanes at once, verbatim:

> "Agent teams use approximately 7x more tokens than standard sessions when teammates run in plan mode, because each teammate maintains its own context window and runs as a separate Claude instance. Keep team tasks small and self-contained"

Six lanes each holding their own context is the multiplier. Not a reason to stop - a reason to keep each lane's task narrow and let it finish.

## Levers, as documented

- **Extended thinking budget.** Thinking tokens bill as output. The budget is reducible - but the docs are explicit that **adaptive-reasoning models ignore nonzero budgets, so use effort levels instead**, and that **thinking cannot be disabled on Fable 5**, which always uses extended thinking. Two of our lanes run Fable 5, so this lever does not exist there.
- **Skills as pre-loaded context.** A `codebase-overview` skill gives domain knowledge up front "instead of spending tokens reading multiple files to understand the structure". Cheaper than exploration, and we already have the skill infrastructure.
- **`/clear` and compaction**, including custom compaction instructions (`/compact Focus on code samples and API usage`).
- **A spend-tracking proxy per key** - the docs note several large enterprises route Claude Code traffic through one. Relevant if the fleet ever moves off the subscription.
- **Org/group/member spend limits** on Console-billed orgs. Not applicable to a Max subscription, which is why our only real control is behavioural.

## The parameters an autonomous loop should carry

The gap this exposes is that our loops had *iteration* limits and no *economic* ones. `agent-loops.md` rule 5 says "every autonomous path needs a hard cap" and meant item counts. Cost is the cap that actually binds.

| Parameter | Value | Why |
|---|---|---|
| Budget, in dollars | declared per loop, not per iteration | A tick is ~$1/turn; iteration counts hide that |
| Stop on no-change | 2 consecutive quiet ticks | Lengthening a pointless loop still pays for it |
| Never poll a human action | hard rule | A merge, a decision, a keypress arrives on Zaal's schedule; stop and let him restart |
| Cost per PR | reported every run | The loop's own KPI, from `cost.usage` / `pull_request.count` |
| Batch independent calls | one turn | Three reads in one turn cost a third of three turns |

**What explicitly does NOT change:** verification is the work. `confirm-before-claiming-absence.md` says burn the cap to be certain about ground truth, and that still stands. The saving comes from not *re-checking whether anything happened yet*, never from skipping a check that establishes a fact.

## Guardrails for unattended autonomy - status

The economic parameters above are new. The safety guardrails largely exist already and held up today: PR-only with a human merge gate (`agent-loops.md` rule 8), the default-FAIL fresh-context evaluator (`loop-evals.md`), secret and PII scans as standalone steps, and "nothing outbound, on-chain, or paid without Zaal". Today's run exercised them: three lanes built, nothing was merged, nothing was posted, and the one genuinely irreversible-adjacent item - a performer name already public on the ZAOstock site - was held for Zaal rather than decided.

**Not yet verified, and deliberately not asserted:** the specific permission-mode keys (`defaultMode`, `acceptEdits`, `bypassPermissions`) and sandbox behaviour. The fetch of the IAM page returned mostly navigation, and this session's web-search budget was exhausted (200/200), so those claims are UNVERIFIED and want a follow-up read before anyone wires them.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Wire `CLAUDE_CODE_ENABLE_TELEMETRY=1` + a local OTEL collector, dashboard `cost.usage` against `pull_request.count` | @Zaal | PR | 2026-08-17 |
| Add cost-per-PR to each loop's self-report, from the OTEL metrics | @Zaal | PR | 2026-08-17 |
| Re-read the IAM/permissions doc and record the real permission-mode keys | @Zaal | Doc | 2026-08-14 |
| Build a `codebase-overview` skill so lanes stop paying to rediscover the repo | @Zaal | PR | 2026-08-21 |

## Sources

- `https://docs.claude.com/en/docs/claude-code/monitoring-usage` - FULL, raw fetch (curl + HTML strip, not a summarised read), 2026-08-10. Source of the metric names and the telemetry env vars.
- `https://docs.claude.com/en/docs/claude-code/costs` - FULL, raw fetch, 2026-08-10. Source of the $13/day benchmark, the 7x agent-teams figure, and the thinking-budget caveats, all quoted verbatim rather than paraphrased.
- `https://docs.claude.com/en/docs/claude-code/iam` - PARTIAL. Returned navigation; permission-mode specifics not obtained. Claims that would have rested on it are marked UNVERIFIED above.
- First-party measurement: `scripts/agents/zao-spend` over 15 live session transcripts, 24h window, 2026-08-10.
