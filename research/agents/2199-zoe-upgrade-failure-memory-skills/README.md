---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-05
superseded-by:
related-docs: 2198, 2191
original-query: "keep researching what does this mean for our agent what can we add always think of that for how we can upgrade"
tier: STANDARD
---

# 2199 - What to ADD to ZOE: failure-memory, skill self-evolution, and the Reflexion write-back

> **Goal:** Turn the overnight agent research into a concrete ZOE upgrade list. Grounded in ZOE's REAL modules (`bot/src/zoe/`) so every "add" is a delta, never a duplicate of what ZOE already has.

## What ZOE already has (so we don't re-add it)

Read live 2026-08-05: `workers.ts` (Node-orchestrated worker runner - per-worker cost caps, read-only lockdown, critic integration, one-revision retry, run records), `learn.ts` (WEEKLY telemetry-clustered prompt-sharpening, human-gated, runtime-file only), `memory.ts` (4 Letta blocks: persona/human/working/tasks + a per-chat recent ring buffer + archive), `reflect.ts` (evening 3-question reflection to Zaal), `work-loop.ts` (PR-only autonomous research track, one-item, daily cap), `recall.ts`/`thread-memory.ts` (Bonfire recall + thread memory), plus the `zao-evaluator` (fresh-context, no write tools) and critic (threshold 70). This is a mature harness+loop. The gaps below are the DELTA vs the field patterns (doc 2198 + this pass).

## Key Decisions (the add-list, highest leverage first)

| # | ADD to ZOE | Grounded in | Maps to ZOE |
|---|-----------|-------------|-------------|
| 1 | **A per-incident FAILURE MEMORY with a required `lesson` field + recall-on-recurrence.** When a worker/critic/build fails, capture `{failure_signature, what_went_wrong, lesson, fix_that_worked}`; on a new run, retrieve matching prior failures by signature/semantic-search and inject them BEFORE the worker starts. | GreatCTO's `(pattern_hash, detection_order_that_worked)` = ~94% MTTR (doc 2198); nous-memory's `failure` type + Stash's "failure records immutable, `lesson` field REQUIRED = the anti-repeat mechanism" + REPEAT-FAILURE detection; ArcticMem +28pp / 18% fewer tool calls from retrieving past debugging insights. | Extends `runs.ts` (already records runs) into a queryable failure store; injected in `workers.ts` at prompt-build like `learn.ts` learnings, but PER-INCIDENT + immediate, not weekly. This is the single biggest capability ZOE lacks. |
| 2 | **Skill self-evolution: auto-extract a candidate `SKILL.md` from a SUCCESSFUL run**, human-gated before it joins the live skill set. | Voyager (skill library indexed by NL-description embedding = 3.3x items, 15.3x faster milestones); AutoSkill (extract standardized `SKILL.md` artifacts from interaction traces, versioned, injected at inference); SkillX (3-tier plan/functional/atomic, +~10% on weaker base agents); SoK: skills = the agent's procedural memory. | ZAO already speaks `SKILL.md` (the skill system). So "distill a reusable skill from a run that worked" is idiomatic - the extraction is new, the format + human-gate already exist. Reversible, PR-only, never a silent skill write. |
| 3 | **Reflexion write-back: make the critic->revision loop persist a VERBAL LESSON into the failure memory (#1), and confirm the DETERMINISTIC gate (typecheck/esbuild/tests) - not the critic score - is the hard halt.** | Reflexion (Actor -> Evaluator with external signal -> Self-Reflection writes a lesson to episodic memory; 91% HumanEval); Sonar/Mirlohi two-tier gate + arxiv progress-mirage (doc 2198): the LLM critic is an opinion, the deterministic check is the fact. | ZOE's `critic` + one-revision retry is already generate->critique->revise; today the lesson evaporates after the run. Route it into #1's store. And audit that the critic's 70 threshold is NOT the final blocker - the deterministic loop-evals gate must be. |

## Why this is the right next upgrade (not more agents)

Doc 2198's clearest finding: **adding agents can HURT** ("my 6-agent pipeline is slower and less reliable than my 2-agent one"), and framework choice matters far less than the gate + memory. So the leverage is NOT a bigger fleet - it is making ZOE *improve over time* (failure memory + skills) and *stop reliably* (deterministic gate). ArcticMem's result is the proof: a few dozen stored facts, retrieved 3-4x/session, gave +28pp with 18% FEWER tool calls. Memory is cheaper AND better than more agents.

## Design notes (grounded, so a build stays in the safety envelope)

- **Same safety envelope as `learn.ts`/Gap 4-5:** the failure memory is a runtime layer (`~/.zao/zoe/...`), reversible, injected into prompts - never a silent git-tracked edit. Skill extraction (#2) proposes a `SKILL.md` for Zaal to approve, never auto-installs (anti-fabrication rule 1, agent-loops rule 8).
- **Retrieval tradeoff (ArcticMem):** LLM-based selection (no embedding infra, nuanced, but a model call + hard index cap) vs vector search (fast, scales). For ZOE's likely dozens-not-millions of failure records, start with SQLite FTS5 + a small embedding (the `nous-memory`/`docs-mcp` pattern from doc 2196) - cheap and local.
- **Lifecycle to avoid rot:** every memory system studied has decay + dedup + contradiction handling (Stash confidence decay, nous-memory `dream` staleness report). ZOE's failure store needs a TTL/decay + a "this lesson stopped applying" path, or it poisons future runs (skill-drift / poisoned-distillation is the named risk in SoK).
- **Keep RAG out of the loop (doc 2198 anti-pattern):** inject the retrieved failures/skills at run ENTRY deterministically, don't hand the worker a `search_memory` tool it over/under-calls.

## Also See

- Doc 2198 - agent orchestration (the gate + memory findings this builds on)
- Doc 2191 - ZOE agent-spawning + validation (the worker/critic architecture)
- `.claude/rules/loop-evals.md`, `agent-loops.md`, `anti-fabrication.md` (the safety envelope any build honors)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Spec + prototype ZOE failure-memory: extend `runs.ts` to store `{signature, lesson, fix}` on failure + inject matches at `workers.ts` entry (SQLite FTS5, runtime-only, decay) - shipped as a PR with a test proving a repeated failure signature recalls its prior lesson | @Zaal | PR | 2026-08-26 |
| Spec ZOE skill-extraction: a post-run step that proposes a candidate `SKILL.md` from a successful run for Zaal to approve (never auto-install) - shipped when one real run produces a reviewable SKILL.md proposal | @Zaal | Spec | 2026-09-05 |
| Wire the critic->revision lesson into the failure memory + audit that the deterministic loop-evals gate (not the critic 70) is the PR/merge hard-halt - shipped when the audit note + wiring PR lands | @Zaal | PR | 2026-08-14 |

## Sources

- [ArcticMem: persistent memory for AI agents - Snowflake (2026-07-29)](https://www.snowflake.com/en/blog/engineering/arcticmem-persistent-memory-ai-agents/) - [FULL] via exa; +28pp, 18% fewer tool calls, Tier1/Tier2 extraction
- [Self-Improving AI Agents: The Reflection Loop - Taskade (2026-06-29)](https://www.taskade.com/blog/self-improving-ai-agents-reflection) - [FULL] via exa; Reflexion (Actor/Evaluator/Self-Reflection -> episodic lesson), the technique table
- [nous-labs/nous-memory (GitHub)](https://github.com/nous-labs/nous-memory) - [FULL] via exa; 6 memory types incl `failure`+`pattern`, dream staleness, token-budgeted bootstrap
- [alash3al/stash (GitHub)](https://github.com/alash3al/stash/tree/v0.1.1) - [FULL] via exa; failure records with required `lesson`, REPEAT-FAILURE detection, confidence decay
- [Voyager: Open-Ended Embodied Agent with LLMs (paper)](https://voyager.minedojo.org/assets/documents/voyager.pdf) - [FULL abstract] via exa; skill library indexed by description embedding, 3.3x/15.3x
- [SkillX: Constructing Skill Knowledge Bases (arXiv 2604.04804)](https://arxiv.org/html/2604.04804) - [PARTIAL] via exa; 3-tier skill hierarchy, +~10% on weaker agents
- [SoK: Agentic Skills - Beyond Tool Use (arXiv 2602.20867)](https://arxiv.org/html/2602.20867v1) - [PARTIAL] via exa; skills as procedural memory; skill-drift/poisoning risk
- [AutoSkill: Experience-Driven Lifelong Learning (arXiv 2603.01145)](https://arxiv.org/html/2603.01145) - [PARTIAL] via exa; extract/version/inject SKILL.md artifacts from traces

_Status: this is a DESIGN/spec doc, not built (overnight = docs-only, agent-loops rule 35). Fetch method: exa web_search (reddit.com blocked to WebSearch UA). ZOE module facts are from reading the live `bot/src/zoe/` source this run, not the web._
