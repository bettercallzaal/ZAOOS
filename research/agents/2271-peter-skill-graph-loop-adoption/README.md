---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-12
superseded-by:
related-docs: 1527, 928, 2127, 2258, 2262
original-query: "/zao-research the Peter repo (github.com/robertkeus/peter) properly. Focus on what we can actually ADOPT rather than a summary: the node-internal loop shape (implement -> gates -> audit -> repair), how runs terminate as completed/blocked/handed-back, the JSONL work graph, and the auditor-cannot-edit rule. We already have the last one as loop-evals.md's default-FAIL fresh-context evaluator and the zao-evaluator agent, so the question is what Peter does that we do NOT. Read the actual source, not just the README - and read docs/token-efficiency.md. Compare against bot/src/zoe/work-loop.ts, which is still imperative, and doc 1527 which specs a DreamLoop port stuck at Phase 1."
tier: STANDARD
---

# 2271 - Peter: what it does that we do not

> **Goal:** Extract the adoptable mechanisms from robertkeus/peter and name precisely where ZOE's work-loop and doc 1527's DreamLoop port fall short of them.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ADOPT the append-only task graph with fold-per-id, and the `blocked` state.** | `work-loop.ts` **deletes failed work**. Lines 250 and 278 filter the item out of the queue on success AND on error, with the comment "Remove from queue even on error to avoid infinite retry loop". The failure is reported to Telegram and the item is gone. This is live data loss with a one-shot notification as its only record. |
| 2 | **ADOPT bars-before-work: `criteria[]` written at filing.** | ZOE grades with `verifyReplanResearch` AFTER the output exists. Peter's §B7 adjudicates against criteria "written before the code, so this is not post-hoc rationalization". Ours is exactly the post-hoc case. |
| 3 | **ADOPT the four termination states, especially `needs-input:`.** | ZOE has two outcomes: PR, or error-and-dequeue. It has **no handed-back-to-human state at all**. Peter's `blocked` + `note: needs-input: <question>` is durable, survives restart, and is re-asked verbatim on resume. |
| 4 | **ADOPT the recorded gate baseline.** | This refines our own `noisy-signal-guard.md`. We ban measuring a delta; Peter measures the delta but **records the baseline in `spec.md` before any code**. The sin is the unrecorded baseline, not the delta. |
| 5 | **ADOPT four auditor rules we do not have** (stale-pass, route-the-clause, fixer-never-sole-tester, reseed-after-probe). | We have auditor-cannot-edit. We do not have any of these four. Detail below. |
| 6 | **ADOPT cost pre-declaration.** | `agent-spend.md` prices runs after the fact with `zao-spend`. Peter states estimated dispatch count and cost **before** entering epic mode. Cheaper than a meter. |
| 7 | **SKIP ESON.** | Its own benchmark says the primer never breaks even without prompt caching, and it is 8% **larger** on scalar envelopes. Adding a message format to save tokens we have not measured is speculative. |
| 8 | **SKIP the 4-role org graph as-is.** | Our roles differ (`zao-build-orchestrator` / `zao-builder` / `zao-evaluator` / `zao-formatter`). The shape is already ours; the rules inside it are what we are missing. |

## What Peter actually is

**Peter contains no executable code.** 50 commits, last 2026-08-12. The entire repo is markdown plus an installer:

```
skills/peter/SKILL.md              553 lines - the protocol
skills/peter/references/*.md       652 lines across 7 files
agents/*.md                        374 lines across 4 role definitions
docs/token-efficiency.md            93 lines
install.sh                         315 lines
```

The "JSONL work graph" is not a database or a runner. It is a **file format an LLM is instructed to append to**, and a set of fold rules it is instructed to apply. There is no code that validates a record, computes readiness, or enforces a bound.

That cuts both ways, and it is the single most important framing for us:

- **Against adoption:** every guarantee is a prompt the model may drift from. Nothing enforces "one commit per task" or "max 2 loopbacks" except instruction-following. Our `work-loop.ts` bounds (`DAILY_CAP`, the atomic `tick-lock`) are real code and cannot be talked out of.
- **For adoption:** the *design* is portable at zero risk. We can take the state machine into TypeScript, where it becomes enforced rather than requested. That is the port doc 1527 already wanted, with a better spec than 1527 has.

## The four things, one at a time

### 1. The node-internal loop: implement -> gates -> audit -> repair

Peter's §G runs machine gates in cost order, stopping at the first failure: unit tests, typecheck, lint, build, E2E. Two rules inside it we do not have written down:

- **"A node never reports its own tests as passing. The parent runs the commands and reads the output."** We have this in spirit via `zao-evaluator`, but not as a hard statement that the builder's green is inadmissible.
- **"A test that passes only on retry is a failing gate."** No retries, no `sleep`, no loosened assertions. This is stronger than anything in `loop-evals.md`, and it is the rule that keeps a flake from being laundered into a pass.

And the baseline rule, which is the genuinely new idea:

> Gates are judged against the A1 baseline, not against zero. A repo that starts with a red test does not get to fail every task for it - only failures **new** relative to the baseline belong to the task in flight.

`noisy-signal-guard.md` currently says measuring a delta means you have already adapted to a broken instrument, and `state-claims.md` rule 4 says the same. Peter shows the reconciliation: **record the baseline explicitly, as a committed artifact, before any work begins**, then the delta is legitimate. A pre-existing failure becomes a filed task competing on priority - it never burns the current task's loopbacks and never blocks its close. That is better than our current position, which effectively says "fix everything first".

### 2. How runs terminate

| State | Peter | ZOE `work-loop.ts` |
|---|---|---|
| running | `in_progress` appended to graph | implicit (lock held) |
| success | `closed` + real `sha` from `git log` | PR reported, item deleted |
| failed twice | `blocked`, `note: gates: <failing clauses>` | **item deleted**, error to Telegram |
| needs a human | `blocked`, `note: needs-input: <question>` | **does not exist** |
| operator denied a dispatch | `blocked`, never auto-retried | does not exist |

Peter's re-entry rule is the part worth copying verbatim: a `blocked` task is never ready, and "only an `open` record the operator asked for re-enters it - the drain and the resume check never do on their own". The operator's answer to a `needs-input:` question **is** the reopen: append the answer as a note, append `open`, continue in the same turn.

Two details that read like scar tissue:

- `sha` must be a real sha, and the `closed` record **cannot ride in the commit whose sha it carries** - amending to fold it in changes the sha it just recorded. So it rides in the next commit.
- Loopback counts reset each session, which is exactly why `blocked` must not auto-re-enter: "re-dispatching would retry the same wall unbounded".

### 3. The JSONL work graph

Here I have to correct the premise slightly. **ZOE already has append-only JSONL**: `bot/src/zoe/runs.ts` writes one record per worker run to `~/.zao/zoe/runs/YYYY-MM-DD.jsonl`, carrying `status: 'completed' | 'failed' | 'needs-revision'`, a critic score, `inputTokens`, `outputTokens`, `costUsd` and `durationMs`. It is read by `learn.ts` to cluster failure patterns weekly.

So the gap is not "append-only JSONL". It is that **`runs.ts` is a log and Peter's `graph.jsonl` is a state machine**:

| | `runs.ts` | Peter `graph.jsonl` |
|---|---|---|
| Keyed by | unique run id, never revisited | task id, records **fold** per id |
| Carries | outcome, cost, critic score | `deps`, `criteria[]`, `status`, `prio`, `zone`, `evidence` |
| Written | after the fact, best-effort, "never throws into the dispatch path" | before and during, and it **drives** dispatch |
| Read by | `learn.ts`, weekly | the drain, every iteration, to compute readiness |
| On failure | record dropped, run continues | the record is the only durable trace |

The fold rule is the free lesson, and Peter states it as a correction of its own earlier design:

> The fold merges per id, field by field: records for an id apply in file order - a later field overwrites, an absent field inherits, an explicit `null` clears. (Latest-record-wins is retired: every live run shed fields under it.)

Anyone building this naively picks latest-record-wins, and then a status-only append silently drops the `criteria[]` the adjudication depends on. They hit it, we do not have to.

Also worth taking: `criteria` are bars, not findings. A pasted observation ("X is broken because Y; fix: Z") is unadjudicable - the observation goes in `evidence`, the fix idea in `note`. And discovered work is **"filed, never worked in the iteration that found it"**, which Peter names as the rule that stops an autonomous run sprawling. That is `thread-discipline.md`'s park-on-pivot, which we wrote for humans and never gave to ZOE.

### 4. Auditor-cannot-edit: what we do NOT have

We have the rule itself. `loop-evals.md`'s default-FAIL fresh-context evaluator and the `zao-evaluator` agent (no write tools, every criterion starts false) are the same design, arrived at independently. Peter adds five things `loop-evals.md` does not say:

1. **"A fix is not done until its audit re-runs - a stale pass is not a pass."** Re-run over full scope after every round, because a fix is written by the node just graded, under pressure, in exactly the flagged code. A one-shot audit "does not merely miss those - it launders a regression as a fix."
2. **"A `fix:` is a hypothesis; `clause:` is the bar. Route the clause, not the sentence."** With a concrete failure: a contrast fix specified as "ring vs card" gets implemented faithfully and verified against that adjacency, when the pair that mattered was ring vs button. The re-audit must **re-derive the measurement from the clause** rather than re-check the one its predecessor named. This is the sharpest idea in the repo.
3. **"The node that fixes a finding is never the only one testing it."** Its tests carry the blind spot that produced the defect.
4. **Resume the same auditor** where possible, so it can compare against its own prior evidence and catch regressions in its own findings. "Give it the diff and tell it to be sceptical of the changelog."
5. **Reseed before an audit that follows a destructive probe.** Auditors hold no write tools but they drive a running app, which mutates the database the next gate reads. A read-only tool list does not make an agent side-effect-free - that distinction is not in any rule we have.

Plus the escalation we half-have: "Auditors are the one role the parent may never fill itself." Machine gates and even implementation may be inlined when delegation is unavailable; a verdict from the author of the code is a weaker bar and must be **reported as not run**, and an applicable audit that could not run keeps the build out of Done. "A missing verdict is not a passing one" is `silent-failure-guard.md` rule 3 applied to judgement rather than tooling.

## The token evidence, which is the honest part

`docs/token-efficiency.md` is more rigorous than most vendor material: paired per-task medians over 23 tasks and three runs, two-sided Wilcoxon signed-rank for continuous endpoints, an exact sign test for judge scores, and a Limits section that disclaims its own corpus.

| Model | Output delta | LOC delta | Total-cost delta | Judge |
|---|---:|---:|---:|---:|
| Claude Opus 4.8 | -29%, `p=.020` | -43%, `p<.001` | **-21%, `p=.104` (not significant)** | 8/11/2, tie |
| GPT-5.5 | -20%, `p=.004` | -18%, `p<.001` | +14%, `p=.820` (not significant) | 6/8/7, tie |

The author's own conclusion: "The significant result is less output and less code on both model families. Quality was a judge tie, not a gain."

**Why the cost result matters to us specifically.** The two models moved in opposite directions and the stated cause is caching: "Claude reused the skill prompt through caching, while the GPT run reported no cache reads and paid 573% more fresh/cache-creation input (`p<.001`)."

That is the same mechanism `agent-spend.md` measured from the other end. Our 24h sample was 998.5M cache-read tokens, about 81% of consumption, against 2.0M output tokens at about 8%. **Output reduction is optimising the 8%.** A 29% cut to output tokens moves roughly 2% of the bill, which is why a -21% total-cost claim came back non-significant, and it is consistent with our own finding that cost tracks turns (about $1.01 each) rather than volume.

So: adopt Peter's protocol for **correctness**, not for savings. The ESON decision follows directly - its primer costs 125 tokens versus 50 for columnar JSON and "without prompt caching, the benchmark says it never breaks even". Peter itself reserves ESON for repeated agent handoffs and deliberately keeps `graph.jsonl` as JSONL. We should keep JSONL and skip ESON entirely.

## Doc 1527 is at Phase 0, not Phase 1

Doc 1527 declares Phase 1 complete: "Manifest written above - ZAOOS PR ready", with the deliverable specified as `bot/src/zoe/loops/zoe-work-loop-v1.manifest.json`.

Checked 2026-08-12:

```
bot/src/zoe/loops/          No such file or directory
bot/src/zoe/handlers/       No such file or directory
bot/src/zoe/zoe-loop-runner.ts   No such file or directory
```

The manifest exists only as a fenced code block inside the research doc. Nothing was written to the repo, so the port has not started. This is `state-claims.md` rule 5 exactly - merged is not running, and here merged is not even built.

Reading 1527 against Peter also shows what 1527's manifest is missing. It models **the tick** (queue.read, acquire-lock, dispatch, pop, release, receipt) but not **the work**. There are no task records, no `deps`, no `criteria`, no `blocked` state. Its `failure_modes` still say "dispatch failed -> remove item + report", preserving the exact data loss in decision 1. A DreamLoop port built to that manifest would keep the bug.

## Findings

1. **`work-loop.ts` loses failed work.** Verified at `bot/src/zoe/work-loop.ts:250` and `:278`. The only record of a failed item is a Telegram message. This is the highest-value fix in this doc and it does not require adopting anything else.
2. **ZOE has no handed-back-to-human state.** Two outcomes exist; a third is needed and Peter's `needs-input:` prefix is a good shape because it survives restart.
3. **ZOE grades after the fact.** `verifyReplanResearch` is a real evaluator, but its bar is derived from the goal string post-hoc rather than written at filing.
4. **We already have append-only JSONL with per-run cost** (`runs.ts`). The missing piece is a folding, dependency-bearing graph that drives dispatch, not more logging.
5. **The baseline rule is a genuine refinement to our own noisy-signal-guard**, and it resolves a tension we currently handle by saying "fix the instrument first".
6. **Peter is prompts, not code.** Its bounds are requests. Ported into TypeScript in `bot/src/zoe/`, the same design becomes enforced.
7. **Cost savings are not the reason to adopt it**, by the author's own statistics and by our own spend measurements.

## Also See

- [Doc 1527](../../technology/1527-zoe-work-loop-dreamloop-port/) - the DreamLoop port this supersedes on state design
- [Doc 928](../928-agent-loop-best-practices/) - rules 1, 4, 20, 25, 35
- [Doc 2127](../2127-loop-harness-engineering-anthropic/) - the long-running-harness restatement
- [Doc 2258](../2258-agent-spend-turn-economics/) - why output reduction optimises the 8%
- [Doc 2262](../2262-agent-link-multi-agent-coordination/) - the previous r/claudeskills extraction

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Stop deleting failed work: `work-loop.ts` appends a `blocked` record with the failure text instead of filtering the item out. Shipped when a test asserts a failed item is still readable after the tick. | @Zaal | PR | 2026-08-15 |
| Add the third termination state - `needs-input: <question>`, durable, re-surfaced on the next tick rather than re-dispatched | @Zaal | PR | 2026-08-19 |
| Rewrite doc 1527's manifest to model tasks, not just the tick: `deps`, `criteria[]`, `blocked`, and fold-per-id semantics | @Zaal | PR | 2026-08-19 |
| Add the four missing auditor rules to `loop-evals.md`: stale-pass, route-the-clause, fixer-never-sole-tester, reseed-after-probe | @Zaal | PR | 2026-08-15 |
| Add the recorded-baseline refinement to `noisy-signal-guard.md` | @Zaal | PR | 2026-08-15 |
| Add pre-run cost declaration to `agent-spend.md`: state estimated dispatch count before a fan-out, not only after | @Zaal | PR | 2026-08-22 |

## Sources

- [github.com/robertkeus/peter](https://github.com/robertkeus/peter) (MIT) - **[FULL]** cloned 2026-08-12, 50 commits, HEAD dated 2026-08-12 21:39 +0200. Read from disk: `skills/peter/SKILL.md` (553 lines, in full), `skills/peter/references/work-graph.md` (121 lines, in full), `docs/token-efficiency.md` (93 lines, in full). File tree and line counts enumerated.
- `skills/peter/references/` - **[PARTIAL - 5 of 7 reference files not read]** `state.md`, `e2e-gate.md`, `security-gate.md`, `ui-gate.md`, `eson.md`, `graph-engineering.md` were sized but not read; the four topics asked about are covered by SKILL.md and work-graph.md. The ESON decision rests on `docs/token-efficiency.md`, which was read in full, not on `references/eson.md`.
- [Reddit r/claudeskills post](https://www.reddit.com/r/claudeskills/comments/1vmpqas/) - **[FULL]** raw JSON, post plus its one retrievable comment. Score 3, ratio 0.67, posted 2026-08-12T20:31Z. `num_comments` is 2; the second comment did not return and was not reconstructed.
- `bot/src/zoe/work-loop.ts` - **[FULL]** read from disk, 283 lines. Data-loss claim verified at lines 250 and 278.
- `bot/src/zoe/runs.ts` - **[FULL]** header and `RunRecord` read from disk.
- [Doc 1527](../../technology/1527-zoe-work-loop-dreamloop-port/) - **[FULL]** read in full. Phase 1 artifact absence verified by `ls` on the three paths it names.
- Upstream benchmarks `Green-PT/honey-for-devs@b39339e` and `Green-PT/honey-eson@d6809a1` - **[FAILED - not independently reproduced]** the statistics quoted are Peter's own recomputation from committed records. Reproduction commands exist and were not run. Treat the p-values as the author's, not ours.
- Credit: Peter is **robertkeus**'s, MIT. Honey and ESON are **Green-PT**'s. The Reddit post is by **BaXRS1988**; the one comment is **Initial_Try_2142**'s.
