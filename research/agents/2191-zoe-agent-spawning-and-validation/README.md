---
topic: agents
type: guide
status: research-complete
last-validated: 2026-08-04
superseded-by:
related-docs: 928, 601, 759, 770, 2127, 2152, 2156
original-query: "research online and make a checklist for our agent - i want our agent to be able to spawn other agents (temp + permanent), tool-agents it reaches out to instead of using the tool itself; plus testing/auditing tools and validation that what the agents produce is actually right"
tier: DEEP
---

# 2191 - ZOE Agent-Spawning + Validation

> **Goal:** Turn ZOE from an agent that calls tools into an orchestrator that spawns purpose-built agents (temporary, permanent, and tool-agents), with a "prove the output is right" gate on every one. Grounded in ZOE's real code + 2026 framework/eval research. Companion to two living artifacts (linked below) and the first implementation (PR #2823).

## Key decisions

1. **This is not greenfield - ZOE already spawns agents.** `bot/src/zoe/decompose.ts` splits a goal into subtasks; `workers.ts` spawns each as a real Claude Code CLI subprocess via `bot/src/hermes/claude-cli.ts` (`spawn('claude', ['-p', prompt, '--append-system-prompt', <spec>, '--allowedTools', '--disallowedTools', '--max-budget-usd', ...])`). The upgrade **generalizes** this; it does not replace it.
2. **MCP is the tool-agent mechanism** ("a harness just for one tool"). Expose a tool as an MCP server; ZOE calls it as a client instead of running the tool inline. Standard, discoverable, ecosystem-wide.
3. **Use the stable MCP SDK line (`@modelcontextprotocol/sdk` v1.x)**, verified via context7 - the `@modelcontextprotocol/server` + `/client` split is the 2.0-alpha (unstable) and was rejected.
4. **Validation is a first-class gate, built on the critics ZOE already has** - not a new bolt-on. ZOE's critics are LLM-as-judge, which is biased; the gate hardens them (no self-grading, ensemble for high-stakes, groundedness for research).
5. **Gate 0 on every agent: "should this even be an agent?"** Anthropic warns multi-agent buys latency + cost + debugging pain; spawn only for open-ended / specialist / parallel / stateful work.

## How ZOE spawns agents today (ground truth, from the code)

`decompose.ts` -> subtask with a `WorkerKind` (`research-worker`, `code-reviewer`, `comms-drafter`, `data-runner`, `brief-writer`, `recap-agent`, `watcher-agent`, or `hermes` for code). `workers.ts` then:

- loads the worker's `.claude/agents/<name>.md` spec as its system prompt (with accrued learnings folded in),
- spawns it via `callClaudeCli` with a **minimal scoped tool set** + a **hard USD budget** ($0.30-$1.00),
- **read-only lockdown**: the whole `Bash` tool is denied (VPS-verified doc 770 H4 - the CLI only reliably enforces the *denylist*, not the allowlist), so no worker can write/commit/push/exfiltrate. Mutations are gated at the ZOE layer.
- runs a **critic** (research / comms / task-result, pass threshold 70/100); on failure, **one revision pass** within the remaining budget,
- records the run to the cost ledger + a learning loop.

`hermes` is the exception: `bot/src/hermes/runner.ts` runs the coder -> critic -> PR loop; it opens PRs, merge stays human-gated.

So ZOE already has: spec-driven spawned agents, per-agent scoped tools, cost caps, read-only safety, a critic/revision validation layer, and robust auth/rate-limit/truncation error handling (`classifyClaudeError`).

## The upgrade (the checklist)

- **Part A - tool-agents via MCP** (the "harness just for one tool"): wrap a tool as an MCP server; ZOE calls it as a client. Implemented first - see PR #2823.
- **Part B - permanent agents**: long-lived MCP-server daemons ZOE reaches out to (vs. temp workers spawned per-task). One-instance lock per resource (agent-loops rule 9), graceful shutdown + state persist, health/auto-recovery.
- **Part C - generalize the spawner**: one `spawnAgent(kind, input)` over temp (subprocess, today's path), permanent (MCP daemon), tool (MCP call); per-agent tool scoping, spawn budget, depth limit, timeout.
- **Part D - the validation gate** (see below).
- **Part E - safety**: approval gates on side-effects (post/DM/spend/on-chain/merge), audit log, verify subagent claims before acting.

Full checklist artifact: see Also See.

## First implementation - PR #2823

`bot/src/zoe/mcp/farcaster-server.ts` wraps `farcaster/read-node.ts` (read-only) as an MCP server (tools `casts_by_fid`, `node_info`); `farcaster-client.ts` is ZOE's side (`withFarcasterAgent` spawns it over stdio - the temp-agent lifecycle - and calls its tools). Verified: deterministic test 2/2 green (mocked read-node); runtime `listTools` -> `["casts_by_fid","node_info"]` (spawn + MCP handshake + discovery) and a full `casts_by_fid` round-trip. Adds `@modelcontextprotocol/sdk` v1.x. The read returns 400 vs the public fallback locally (no Hypersnap node env on the Mac) and resolves on the VPS - the error propagating back through MCP is itself proof of the round-trip.

## The validation stack (prove the output is right)

Ranked by what each catches:

1. **Structured output** (required) - Anthropic Structured Outputs / strict tool-use + `Zod safeParse`. Catches malformed JSON + wrong types. Does NOT catch hallucination - shape is not truth.
2. **Harden the critics** - LLM-as-judge is biased: documented position (~40% inconsistency on GPT-4), verbosity (~15%), and self-enhancement (5-7% when a model grades its own work). Fixes: never let the SAME model grade its own output; 2-3 model majority vote for high-stakes; domain-specific rubrics, not one rubric for all. `[source has bias figures; treat as documented-not-hard-facts]`
3. **Groundedness for research agents** - check each claim against its cited source (RAG faithfulness). This is the anti-fabrication gate: a claim with no quotable source is UNVERIFIED, never shipped. (Ragas/DeepEval are Python - wrap in a subprocess or a lightweight custom check.)
4. **Golden-set regression** - a small versioned eval set; a CI gate blocks a prompt/model change that regresses quality.
5. **Tracing + cost audit** - OpenTelemetry GenAI or Langfuse (both TS-native): every spawn, tool call, token logged. This is `loops-report` for the spawn layer.
6. **Rubric grader** - Anthropic's Outcomes grader scores output against a markdown rubric in a *separate context* (avoids self-grading bias) and iterates until it passes. `[UNVERIFIED - confirm current availability before committing]`
7. **Runtime guardrails** - input rail (prompt-injection / off-topic), output Zod + a PII/secret scan (ties to `secret-hygiene.md`).

**Honest limit:** no tool catches every hallucination; LLM-as-judge can rubber-stamp; self-consistency can hide a shared wrong answer. Human review stays non-negotiable for high-stakes output + the long tail (~5-10% of traffic). Anthropic's rule throughout: measure the improvement before adding the complexity.

## Orchestration patterns (Anthropic)

Prompt chaining, routing, parallelization, **orchestrator-worker** (ZOE's fit), evaluator-optimizer. Frameworks surveyed: MCP (tool-agents - primary), OpenAI Agents SDK (handoffs, TS, production), Claude Agent SDK (best Anthropic-stack fit; TS specifics `UNVERIFIED` - docs 404'd), LangGraph (Python-first), CrewAI / AG2 (Python-only), Swarm (deprecated -> Agents SDK).

## Claude Code craft (from X research, 2026-08-04)

- **hanakoxbt** ("your two agents aren't collaborating; the second is redoing the first's work"): the load-bearing agent-handoff rule - **pass artifacts, not prose**. Share the actual files/schemas/failed request bodies, not a lossy human summary; **document what FAILED**, not just what worked, so the next agent doesn't re-walk ruled-out paths. A summary for the next agent is a *spec*, not a *report*. Directly reinforces our anti-fabrication rule 1 + agent-loops rule 3, and shapes how spawned agents should hand off.
- **eng_khairallah1** (Claude Code course): CLAUDE.md hierarchy (user / project / directory), plan-mode when a task touches >2 files or needs architecture, skills vs CLAUDE.md separation (don't bloat CLAUDE.md), CI/CD `-p` + `--output-format json`, and using an **independent review instance** (not the code-generation session) for CI review. Most of this ZAO already does; the "independent judge for the auto-merge gate" and "artifacts not prose" are the sharpest takeaways.

## Also See

- Agent-spawning + validation checklist (living artifact): https://claude.ai/code/artifact/a443a42f-a2a0-4673-b587-8f9377560b50
- ZAO OS operating manual (living artifact): https://claude.ai/code/artifact/2409e82c-fd09-4caf-bfde-deb2f6713890
- PR #2823 - first MCP tool-agent (Farcaster read).
- Doc 928 (agent-loop best practices), Doc 601 (agent-stack cleanup), Doc 759/770 (ZOE workers + tool-lockdown), Doc 2127 (loop-harness engineering), Doc 2152 (execution-layer architecture).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review + merge PR #2823 (first tool-agent) | @Zaal | PR | 2026-08-06 |
| Build the validation gate: no self-grading in critics + a groundedness check for research-worker | @Zaal | PR | 2026-08-11 |
| Wrap a 2nd tool as an MCP tool-agent (Supabase or Descript) to confirm the pattern generalizes | @Zaal | PR | 2026-08-13 |
| Verify Anthropic Outcomes grader availability before designing around it | @Zaal | Research | 2026-08-08 |

## Sources

- [Anthropic - Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) - FULL (orchestration patterns, the "start simple / measure before complexity" caution)
- [Model Context Protocol](https://modelcontextprotocol.io) - FULL (tool-agent mechanism; STDIO/HTTP transports)
- [MCP TypeScript SDK v1.29.0 docs](https://github.com/modelcontextprotocol/typescript-sdk) - FULL via context7 (server/client stdio API, `registerTool`)
- [Langfuse docs](https://langfuse.com/docs) - FULL (TS-native tracing + evals + datasets)
- [DeepEval](https://deepeval.com/) / [Ragas](https://docs.ragas.io/) - FULL (groundedness/faithfulness metrics; Python-first)
- [OpenTelemetry for LLMs](https://openobserve.ai/blog/opentelemetry-for-llms/) - FULL (GenAI semantic conventions)
- [LLM-as-a-Judge limitations](https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method) - FULL (bias figures - documented, treat as indicative)
- [hanakoxbt on agent handoffs](https://x.com/hanakoxbt/status/2084418314873250194) - FULL via fxtwitter (pass artifacts not prose)
- [eng_khairallah1 Claude Code course](https://x.com/eng_khairallah1) - PARTIAL (specific tweets fetched; full timeline not scrapeable)
- Anthropic Outcomes grader (rubric-based verification) - UNVERIFIED (cited to a cookbook URL; confirm current availability)
- Claude Agent SDK TypeScript specifics - UNVERIFIED (platform docs 404'd during research)
