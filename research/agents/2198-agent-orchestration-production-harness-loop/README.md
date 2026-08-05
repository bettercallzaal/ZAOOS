---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-08-04
superseded-by:
related-docs: 928, 2127
original-query: "overnight research on Reddit - topic 4: autonomous agent orchestration frameworks - what teams actually run in production, harness vs loop, verification gates, what fails"
tier: STANDARD
---

# 2198 - Agent orchestration in production: harness vs loop, and why the gate is everything

> **Goal:** What teams ACTUALLY run for autonomous agents (not hype) - and a check that ZOE's own loop architecture matches what the field converged on. It does; this doc names the one gap.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **ZOE's harness discipline is already the field consensus - keep it, do not chase a framework.** The winning teams invested in verification, evaluation harnesses, and human gates, "regardless of what they built on." | Every source converges: framework choice matters far less than the gate. ZAO's `loop-evals.md` (default-FAIL, fresh-context evaluator), `agent-loops.md` (PR-only + human gate), `silent-failure-guard.md`, and the `zao-evaluator` (no write tools) ARE the pattern. Do not migrate to LangGraph/CrewAI/AutoGen for their own sake. |
| 2 | **Make ZOE's completion gate explicitly TWO-TIER, in this order: LLM verifier (intent) FIRST, deterministic check (typecheck/esbuild/tests) LAST as the hard halt the loop stops on.** | Sonar + Mirlohi: an LLM reviewer is an opinion, not a gate; "a failing build is a fact." ZAO already runs both (zao-evaluator + `npm run typecheck`/esbuild in loop-evals A-gate) - this decision is to make the ordering + "deterministic tier is the halt" explicit in the rule, not implicit. |
| 3 | **Verify ZOE's evaluator is OUT-OF-BAND (grounded in real world-state / file:line evidence), not reading the maker's own summary.** | The arxiv "progress mirage" result (below) is the empirical teeth for `silent-failure-guard.md`: an in-band judge still accepted 44% of real-world regressions. ZOE's evaluator reads cited evidence (file:line, test output) which is close - but audit that it reconstructs the RAW tool trace, not the maker's paraphrase. |

## Findings (grounded in real fetches)

### Harness vs Loop - two different layers, two different failures (Rahul Dhar, 2026-07-07, FULL)

- **Harness** = everything wrapped around one LLM call that makes ONE invocation trustworthy: tool schemas, tool execution, retry policy, iteration limits, grounding requirements, failure detection. "Prompts are instructions; harnesses are enforcement. A model can ignore a prompt. It cannot ignore your Python."
- **Loop** = the layer above that makes the SYSTEM reliable unattended: the trigger (harness waits, loop decides when it runs), an independent checker, persistent memory across runs, and connecting systems (MCP wires the tools in once).
- The classic harness failures: answering from memory instead of using the search tool; the infinite same-tool loop; declaring success without checking. None fixed by scheduling or more sub-agents - they are harness problems.
- The classic loop gap: a perfect harness still needs a human to wake it, read every output, approve every action, and remember last time. That missing layer is the loop.

### The gate is the load-bearing component (Sonar + Mirlohi + arxiv, FULL)

- **The premature-completion loop:** an agent signals done on half-done work. "Point an open-ended loop at a loose standard and it becomes a slop machine." Failure is silent - it declares success and keeps spending.
- **Two-tier stop condition:** LLM verifier sub-agent (intent, semantics, "did this solve the real problem") FIRST; a **deterministic gate** (test / typecheck / build / static analysis) LAST. "A check that can fail the work, not a verifier that has an opinion." The deterministic tier is what converts an open loop into a bounded, cost-controlled one.
- **Don't let the agent grade itself (Mirlohi):** "A model that just spent a session convincing itself the task is complete is the least reliable auditor of whether it is complete." External + deterministic: a command that exits zero only when the work is genuinely done. Fresh session per step (no carried narrative); the state file is the only memory; retries feed back the REAL failure log, not "try again"; fail-closed (an unconfigured gate blocks). Notably his own glue code had a silent `grep -c` bug - the exact reason you want an external gate, not human pattern-matching on green output.
- **The empirical proof (arxiv 2607.25152, 2026-07-27):** across 54 cycles a frontier agent claimed improvement EVERY time, yet **56% had a measured delta of zero or below**; the self-verdict gate degenerated to accept-all and **eroded the best state it had reached by 19%**. Even the strongest in-band judge (full artifact + diff + verdict history) **accepted 44% real-world regressions** and rejected 38% of real improvements. Conclusion: for open-ended objectives whose success signal lives outside the transcript, **out-of-band evaluation with real-world access is a structural requirement** - scaling the judge does not close the gap.

### Structure that ships (GreatCTO, 2026-05-09, FULL - a 34-agent SDLC)

- "The failures CTOs describe almost never trace to bad code generation. They trace to **missing gates**."
- **Two human gates is the sweet spot:** Gate 1 = plan (scope, before any code); Gate 2 = ship (the full review panel). Started at seven gates, cut to two - more than two per feature makes the human the bottleneck. Killed the `--auto-approve` flag ("the minute you have it, the cycle that produces broken prod starts").
- **Independence catches ~3x more defects** (decades of Google/MS/Apache code-review evidence) - one agent cannot review itself; the same biases that wrote the bug read the diff.
- Parallel implementers in **isolated git worktrees** + parallel specialist reviewers (different angles). **Agent count stops mattering after ~12** - coverage of distinct review angles matters, not headcount. A memory loop (`pattern_hash -> detection order`) drove a claimed ~94% MTTR reduction (observational, not an RCT). Cost: ~$1-4 LLM per small feature; ~80% of spend is the writing agents, reviewers are cheap (they output verdicts, not code).

### Framework verdict (dev.to field report + Reddit r/AI_Agents / r/LangChain, FULL/PARTIAL)

| Framework | Reach for it when | The wall |
|---|---|---|
| **LangGraph** | resumable / auditable / human-reviewed; loops + branches; long-running (checkpointing + `interrupt` primitive) | steep learning curve; boilerplate; LangChain dependency churn; rough mid-graph debugging |
| **CrewAI** | genuinely linear specialist pipelines (research -> summarize -> critique -> format); fast prototyping | branching/loops = meta-orchestration around it; error recovery is DIY; "the abstraction becomes a ceiling" |
| **AutoGen (v0.4+)** | open-ended agent collaboration / iterative code-gen with sandboxed execution | free-form loops drift + surprise token spend (cap max-turns); hard to guardrail; weak testability |

- A recurring real thread: **"my 6-agent pipeline is slower and less reliable than my old 2-agent one."** More agents can HURT. And the consensus line: **"framework choice is less important than most teams treat it - the teams that ship reliable agents invested in observability, evaluation harnesses, prompt versioning, and human-review, regardless of what they built on."**
- Anti-pattern worth noting for ZAO: **keep RAG/retrieval OUTSIDE the agent loop** - a deterministic retrieval step at entry beats giving the agent a `search_docs` tool it over- or under-calls.

## ZAO / ZOE grounding

- ZAO's rulebook already encodes this: `agent-loops.md` (rule 8 PR-only + human gate, rule 30 vacuous-verify, rule 33 verify subagent claims), `loop-evals.md` (default-FAIL contract + fresh-context evaluator + march-of-nines), `silent-failure-guard.md` (a 200/exit-0 is not proof), `anti-fabrication.md`, and the `zao-evaluator` agent (Read/Grep/Bash only, no write tools). This research VALIDATES that stack against the wider field and the arxiv result.
- The 1 actionable gap: make the two-tier ordering + "deterministic tier is the halt" explicit, and audit that the evaluator reconstructs the RAW tool trace (out-of-band), per Rahul Dhar + the progress-mirage paper. See docs 928 + 2127 (ZAO's own loop-harness rulebooks).

## Also See

- Doc 928 - agent loop best practices (ZAO's base rulebook) / Doc 2127 - loop-harness engineering (Opus-5 era)
- `.claude/rules/loop-evals.md`, `agent-loops.md`, `silent-failure-guard.md`, `anti-fabrication.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add an explicit "two-tier gate: LLM verifier first, deterministic check is the hard halt" note to loop-evals.md, citing the arxiv progress-mirage result - shipped when the rule file carries it | @Zaal | PR | 2026-08-12 |
| Audit the zao-evaluator: confirm it grades against the RAW tool trace / real file:line evidence (out-of-band), not the maker's summary - shipped when the audit note lands or the evaluator prompt is tightened | @Zaal | PR | 2026-08-15 |
| Add a one-line "framework choice < gate quality; don't migrate to LangGraph/CrewAI for its own sake" note to the agent rulebook so no future loop chases a framework - decided when the note is committed | @Zaal | Decision | 2026-08-11 |

## Sources

- [Harness Engineering vs. Loop Engineering - Rahul Dhar (2026-07-07)](https://www.rahuldhar.me/p/harness-engineering-vs-loop-engineering) - [FULL] via exa; the harness/loop split + enforcement-not-persuasion
- [Loop engineering without verification is just automation - Sonar (2026-06-11)](https://www.sonarsource.com/blog/loop-engineering-without-verification-is-just-automation/) - [FULL] via exa; two-tier gate, premature-completion loop
- [Don't Let the Agent Grade Itself - Amin Mirlohi (2026-06-09)](https://mirlohi.com/articles/dont-let-the-agent-grade-itself) - [FULL] via exa; external+deterministic gate, fresh session per step, fail-closed
- [When Do Agent Loops Mistake Stagnation for Progress? (arXiv 2607.25152, 2026-07-27)](https://arxiv.org/abs/2607.25152v1) - [FULL abstract] via exa; the progress-mirage measurement (54 cycles, 56% delta<=0, 44% accepted regressions)
- [Why your agent system fails: missing gates, not missing intelligence - GreatCTO (2026-05-09)](https://greatcto.systems/blog/why-your-agent-system-fails) - [FULL] via exa; 34-agent SDLC, 2 human gates, memory loop, cost receipts
- [CrewAI vs LangGraph vs AutoGen: Which Framework for Production - dev.to (2026-04-17)](https://dev.to/hemangjoshi37a/crewai-vs-langgraph-vs-autogen-which-framework-for-production-ai-agents-1ggl) - [FULL] via exa; the field-report comparison table
- [r/LangChain - Best Production Agent Framework: LangGraph vs Autogen](https://www.reddit.com/r/LangChain/comments/1db6evc/best_production_agent_framework_langraph_vs/) - [PARTIAL] via exa; control-vs-automatic framing
- [r/LocalLLaMA - LLM Agent platforms: what works, what doesn't](https://www.reddit.com/r/LocalLLaMA/comments/1bskjki/llm_agent_platforms/) - [PARTIAL] via exa; manager/worker/tester + pass-fail criteria ask

_Fetch method: exa web_search (reddit.com blocked to WebSearch UA; VPS reddit helper absent). The two direct Reddit links are PARTIAL (exa index highlights); the bulk of the practitioner signal came through the aicompass Reddit-mirror + engineering blogs + the arxiv abstract, all fetched this run._
