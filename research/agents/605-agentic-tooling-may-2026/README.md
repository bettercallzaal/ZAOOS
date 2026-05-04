---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-04
related-docs: 547, 568, 594, 599c, 600, 601, 603, 604
tier: DISPATCH
---

# 605 - Agentic tooling landscape (May 2026) - what to add to the ZAO stack

> **Goal:** Survey the AI-agent tooling shipping right now, decide what plugs into ZOE / Hermes / Bonfire, and what stays out. Same-day companion to doc 601 (agent stack cleanup) and doc 604 (concierge agents).

## TL;DR

Stack stays custom. Two cheap unlocks ship next. Two builds get queued for Phase 2. Everything else stays out.

| Slot | Verdict | Source |
|------|---------|--------|
| Agent runtime SDK | KEEP Claude CLI subprocess. SKIP Claude Agent SDK + OpenAI Agents SDK + Google ADK for now. | [605a](./605a-claude-agent-sdk/) |
| Browser + computer-use | UNLOCK Playwright MCP in ZOE today. Defer browser-use OSS bridge to Phase 2 if friction shows up. | [605b](./605b-browser-computer-use/) |
| Eval + observability | ADOPT Langfuse self-hosted on VPS 1 + Promptfoo for CI regression. | [605c](./605c-eval-observability/) |
| Voice | BUILD via LiveKit Agents + Cartesia Sonic-3 in Phase 2, post-ZAOstock spinout. | [605d](./605d-voice-agents/) |
| Workflow / multi-agent orchestration | KEEP custom TS state machine in `bot/src/hermes/runner.ts`. SKIP CrewAI / AutoGen / LangGraph / Trigger.dev / Inngest / n8n. | [605e](./605e-workflow-orchestration/) |

## The single decision

ZOE shipped 2026-05-04 (`bot/src/zoe/`). Hermes is live (`bot/src/hermes/`). Doc 601 collapsed 12+ surfaces to 5. The temptation now is to bolt on every agent framework that hit GitHub trending in April-May 2026. The data says: do the opposite.

USE the existing pattern (Claude CLI subprocess + grammy + systemd + Letta-style memory blocks at `~/.zao/zoe/`) BECAUSE marginal cost is $0 (Max plan covers it), state is inspectable JSON on disk, and migrations to any SDK trade $0/day for $5-15/day in API tokens with no concrete capability that ZOE actually needs today.

The two things ZOE genuinely lacks today are observability (we have zero LLM tracing, just an empty-reply guard) and browser tools (we hand-copy from Farcaster). Both are addressable without changing the runtime.

## What lands first (this week, Phase 1)

| Order | Action | File | Effort | New cost |
|-------|--------|------|--------|----------|
| 1 | Add `mcp__playwright__*` to ZOE allowedTools | `bot/src/zoe/concierge.ts` | 2-3 hours | $0 |
| 2 | Spin up Langfuse Docker on VPS 1, wrap Claude CLI calls in trace | `bot/src/zoe/concierge.ts`, `bot/src/hermes/claude-cli.ts`, new `docker-compose.langfuse.yml` | 4-6 hours | $0 (self-host) |
| 3 | Add Promptfoo config + 10 baseline test cases | `bot/promptfoo.yaml` (new) | 3-4 hours | $0 |
| 4 | CI gate on Promptfoo regression | `.github/workflows/ci.yml` | 1 hour | $0 |

Aggregate: 10-14 hours of work, $0 new monthly cost, two new feedback loops live.

## What lands later (Phase 2, post-ZAOstock spinout)

| Order | Action | Trigger |
|-------|--------|---------|
| 5 | Spike LiveKit Agents + Cartesia Sonic-3 voice mode | After ZAOstock graduates (~2026-W19 to W21) |
| 6 | Wire Telegram voice handler in `bot/src/zoe/index.ts` | After spike validates ~$2-5/mo Cartesia + sub-400ms latency |
| 7 | Evaluate browser-use OSS Python bridge | Only if Playwright MCP friction becomes real (e.g. CAPTCHAs blocking research, multi-tab orchestration painful) |

## What stays out (do not propose this week)

- **Claude Agent SDK / OpenAI Agents SDK / Google ADK.** All three are mature. None solve a problem ZOE has. Migration moves us from $0/day Max plan to $5-15/day pay-per-token with no capability gain. Revisit only if Claude CLI binary stability degrades or multi-turn state needs exceed file-based memory blocks.
- **OpenAI Operator.** $200/mo consumer-only, non-API. Not programmable. Hard SKIP.
- **CrewAI.** 44.5K stars, Python-only. ZAO is TypeScript end-to-end. Rewrite would be a 2-3 week sprint with no payoff.
- **AutoGen 0.4.** 54.7K stars, but the April 2026 HN thread documented runaway-token incidents. Strict cap discipline required everywhere. Risk surface ZAO does not need.
- **LangGraph.** 48K stars, but production debugging requires LangSmith ($paid cloud). Self-hosted observability is a downgrade. Hermes' explicit state transitions are clearer than graph-DAG mental model for our 2-3 phase loops.
- **Trigger.dev v3.** EOL 2026-07-01 forces v4 migration. v4 is cloud-first. ZAO is single-VPS. Not worth the churn.
- **Inngest Agent Kit.** Promising, TypeScript, MCP-aware, but launched March-May 2026. Zero ZAO production deployments to learn from. Revisit Q4 2026 once it has 6 months of post-launch hardening.
- **n8n agent nodes.** Visual-first workflow builder. ZAO has zero non-engineer operators. Zaal codes. Skip.
- **OpenAI Realtime API as ZOE backbone.** ~$0.003/min looks cheap until you cross to GPT-4o reasoning ($24/M output). And it requires migrating away from Claude. Skip unless ZOE migrates wholesale (not on roadmap).
- **Anthropic computer-use API.** $3/M input + $15/M output, requires Docker + Xvfb on VPS. Useful for desktop automation (spreadsheets, native apps). ZOE does not have desktop tasks. Revisit if ZAOstock back-office needs spreadsheet automation in 2027.
- **Manus / Genspark / Devin.** Opaque commercial licensing for open-source agent use. Skip until Zaal pursues partnership.
- **Helicone, LangSmith, Braintrust as the primary observability layer.** Either paid cloud or proxy-based. Langfuse OSS dominates on self-host + TypeScript SDK + Claude-direct support. Doc 605c walks the comparison.
- **Vapi, Retell, ElevenLabs Agents as primary voice runtime.** All SaaS, all $15-50+/mo at ZOE volume, all lock voice config out of `~/.zao/zoe/` memory blocks. LiveKit OSS keeps the voice pipeline inside our infra.

## Why "stay custom + add 2 features" beats "adopt a framework"

ZOE + Hermes are 600 lines each, not 6,000. The state machine is `type Phase = 'plan' | 'code' | 'review' | 'refine' | 'done'`. A coder + critic loop is a switch statement, not a graph DAG. The framework cost (CrewAI/AutoGen/LangGraph) is not the install - it is the conceptual overhead of mapping every future change through someone else's abstractions. Doc 547 already documented the multi-agent coordination pattern Bonfire+ZOE+Hermes uses. None of the surveyed frameworks improve on it.

The two unlock candidates (Playwright MCP, Langfuse) are not frameworks. They are feature-additive: they extend what ZOE can perceive (browser DOM) and what we can see (LLM call traces). They do not rewrite the runtime.

## Cross-cutting risks

- **Token-cost drift.** Today: $0 marginal via Max plan. If we ever migrate ZOE off Claude CLI subprocess, daily cost jumps to $5-15. Putting Langfuse traces in production NOW lets us see the curve before we hit it.
- **Silent-failure recurrence.** Doc 581 (state-truthfulness anti-pattern), the openclaw "·" pings, and the Bonfire deletion-fabrication all happened because ZAO had no observability layer. Langfuse closes that gap. Ship it.
- **Tool-allowance regression.** ZOE's allowedTools is the security boundary. Adding Playwright MCP widens it. Mitigation: keep `Edit / Write / git push / git commit / git reset / rm` permanently disallowed. Browser tools are read-mostly (snapshot, click, type into form) and do not write to repo.

## Codebase touchpoints (where the changes land)

- `bot/src/zoe/concierge.ts` (line 95-105 currently sets allowedTools) - extend with Playwright MCP, wrap with Langfuse trace
- `bot/src/hermes/claude-cli.ts` - wrap `spawn()` with Langfuse observation
- `bot/src/zoe/index.ts` - Phase 2 voice handler (`bot.on('message:voice')`)
- `bot/src/hermes/runner.ts` - stays as-is. No state-machine rewrite.
- `~/.zao/zoe/persona.md` - mention Playwright tools in prompt so ZOE knows it can browse
- New: `docker-compose.langfuse.yml` at VPS 1 root
- New: `bot/promptfoo.yaml` with 10 regression test cases
- New: `.github/workflows/ci.yml` Promptfoo gate

## Also see

- [Doc 547 - Multi-agent coordination Bonfire + ZOE + Hermes](../547-multi-agent-coordination-bonfire-zoe-hermes/)
- [Doc 568 - Aware brain local memory + KG stack](../568-aware-brain-local-memory-knowledge-graph/)
- [Doc 594 - Inngest agent prior art](../599c-hermes-agent-prior-art-reddit/)
- [Doc 600 - Agent stack v1 inventory](../600-agentic-stack-coordination-v1/)
- [Doc 601 - Agent stack cleanup decision (Hermes-as-ZOE-brain)](../601-agent-stack-cleanup-decision/)
- [Doc 603 - TradingAgents debate pattern](../603-tradingagents-pattern-for-social-pm/)
- [Doc 604 - Best concierge agents 2026](../604-best-personal-concierge-agents-2026/)

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | PR: extend `bot/src/zoe/concierge.ts` allowedTools with `mcp__playwright__*` | Claude | PR | This week |
| 2 | PR: add Langfuse Docker to VPS 1 + SDK wrap in concierge + claude-cli | Claude | PR | This week |
| 3 | PR: `bot/promptfoo.yaml` with 10 test cases (concierge replies, hermes coder loop) | Claude | PR | This week |
| 4 | PR: `.github/workflows/ci.yml` Promptfoo gate (block PR on regression) | Claude | PR | This week |
| 5 | ZOE task: monitor for Playwright friction, log cases | ZOE | Bot task | Continuous |
| 6 | Spike branch: LiveKit + Cartesia voice POC | @Zaal | Spike | After ZAOstock spinout (W19-W21) |
| 7 | Decision review: re-validate this doc 30 days from now (2026-06-03) | Claude | Doc update | 2026-06-03 |
| 8 | Update `bot/src/zoe/persona.md` with Playwright tool awareness when (1) ships | Claude | Doc | Same PR as #1 |

## Sources

Aggregated across sub-docs. Primary anchors:

- [Anthropic Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [OpenAI Agents SDK](https://platform.openai.com/docs/guides/agents)
- [browser-use OSS](https://github.com/browser-use/browser-use)
- [Anthropic computer-use API](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use)
- [Langfuse OSS](https://github.com/langfuse/langfuse)
- [Promptfoo](https://www.promptfoo.dev/)
- [LiveKit Agents](https://github.com/livekit/agents)
- [Cartesia Sonic-3 TTS](https://cartesia.ai/product/python-text-to-speech-api-tts)
- [Trigger.dev v4](https://trigger.dev/)
- [Inngest Agent Kit](https://inngest.com/blog/introducing-agent-kit)
- [LangGraph](https://github.com/langchain-ai/langgraph)
- [AutoGen 0.4 release notes](https://microsoft.github.io/autogen/)

Per-source URLs verified against the sub-docs (605a-605e).
