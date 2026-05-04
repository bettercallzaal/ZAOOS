---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 239, 296, 487, 547, 601
tier: STANDARD
---

# 605e - Workflow + agent-orchestration platforms for ZAO

> **Goal:** Decide if ANY agent-orchestration platform earns a slot in ZAO's stack alongside bot/src/zoe + bot/src/hermes.

## Executive Summary

ZAO's current agent stack (ZOE concierge, Hermes coder-critic loop, DevZ group dispatch, Bonfire KG) is built on custom TypeScript state machines running on a single VPS via systemd. This decision document evaluates 7 major orchestration platforms (n8n, Trigger.dev, Inngest, CrewAI, AutoGen, LangGraph, OpenAI Assistants v2) to determine if migration or adoption would add value beyond ZAO's existing architecture.

**Verdict: KEEP custom TS state machine. SKIP framework adoption.**

Rationale: ZAO's constraints (Max plan at $0 marginal cost, VPS 1 only, Claude-native workflows, <5 agents per system, durable execution already via database checkpoints) are optimally met by the current plain-TypeScript + Hermes runner pattern. All evaluated platforms add licensing cost, complexity, or Python-only constraints. None solve problems ZAO doesn't have.

## Key Decisions

| Decision | Action | Rationale |
|----------|--------|-----------|
| Multi-agent orchestration | KEEP custom TS state machine in bot/src/hermes/runner.ts | Max plan + simplicity + already shipped. Hermes' explicit state transitions sufficient for coder+critic. LangGraph's $cost overhead not justified. |
| Cron-style workflow (scheduled tasks) | KEEP node-cron + systemd timers | Existing pattern stable. Trigger.dev v4 adds observability at cloud cost. Not worth VPS spinup. |
| External event triggers (webhooks, scheduled jobs) | KEEP Telegram bot entry points + HTTP routes | Grammy + http webhook handlers match Zaal's no-framework preference. Inngest/Trigger.dev designed for SaaS platforms, not single VPS. |
| Human-in-the-loop approval gates | SKIP LangGraph native support | Hermes already wires approval via Claude-as-arbiter. Explicit gates not needed for current workflows. |
| Observability (logs, tracing, debugging) | KEEP console.error + Supabase event logging | Doc 591 (miniapp audit) established pattern. LangSmith integration (LangGraph) is cloud-only and costs. Manual tracing sufficient at ZAO scale. |

## Comparison Table

| Platform | Pricing Model | OSS? | TS-native? | Multi-agent | Observability | GitHub Stars (May 2026) | Fit for ZAO |
|----------|---------|------|------------|-------------|---------------|-------------------------|-------------|
| Custom TS (current) | $0 | yes | yes | manual state machine | console.error + DB | N/A | BASELINE / KEEP |
| n8n | cloud or OSS | yes | partial (visual) | via AI Agent node | built-in dashboard | 46K+ | SKIP - visual-first, not code-first |
| Trigger.dev v4 | cloud + OSS | yes | yes | via task composition | native tracing | 14.7K | SKIP - cloud-focused, v3 EOL 2026-07-01 |
| Inngest Agent Kit | cloud + OSS | yes | yes | via Networks + Router | integrated tracing | <5K (new) | SKIP - early, requires Inngest cloud |
| CrewAI | OSS | yes | Python only | yes (crews) | limited | 44.5K | SKIP - Python-only, ZAO is TS/Node |
| AutoGen 0.4 | OSS | yes | Python+TS | yes (async) | improving | 54.7K | SKIP - token burn risk without caps |
| LangGraph | OSS | yes | Python+TS | yes (graph nodes) | LangSmith only | 48K+ | SKIP - cloud observability cost |

## What Custom TS Misses (If Anything)

1. **Visual workflow editor for non-devs** - n8n excels here. ZAO doesn't need it. Zaal codes, team is small.
2. **Durable execution across crashes** - Trigger.dev's checkpoint-restore (CRIU) is novel. ZAO uses Supabase `run_logs` table + manual replay. Works.
3. **Multi-tenant concurrency queueing** - Inngest / Trigger.dev v4 handle automatic scaling. ZAO runs <3 concurrent tasks (Telegram bot constraint). Custom rate limiting sufficient.
4. **Native human-in-the-loop interrupts** - LangGraph has `interrupt()` to pause graph. ZAO uses Claude-as-arbiter in system prompt. Less ergonomic but works.
5. **Streaming partial outputs to UI** - Trigger.dev Realtime API is slick. Hermes doesn't stream intermediate outputs; it returns final code. UI doesn't need it.
6. **Token cost visibility per run** - All frameworks track this. ZAO logs to Supabase. Claude API dashboard provides monthly totals. Good enough.

## Recent Signals (Apr-May 2026)

- **Trigger.dev v3 EOL 2026-07-01**: Version deprecation forces migration overhead. v4 is production but cloud-first (defeats VPS-only goal).
- **AutoGen 0.4 token burn debate (Hacker News Apr 2026)**: Conversation loops without termination caps = 10x cost. Users report surprise bills. Requires strict discipline. ZAO doesn't want this risk surface.
- **CrewAI hitting 44.5K stars, Inventiple naming it "fastest to ship"**: True for prototypes. But Python-only locks ZAO out (all bots are TS/Node).
- **LangGraph remains LangChain's expensive option (LangSmith required for prod debugging)**: Enterprise play. ZAO is indie. No budget for managed platforms.
- **Inngest Agent Kit just launched (Mar-May 2026)**: Promising (TypeScript, MCP support, Networks pattern clean). Too early. Zero production ZAO deployments would exist to learn from.
- **n8n visual Agent nodes v1.82+ mature**: Approachable for non-engineers. ZAO has none. Zaal prefers code. Low adoption likelihood.

## What Migration Would Cost

| Framework | TS/Node Support | Hermes Rewrite | Cloud Cost / VPS Overhead | Breaking Changes | Risk |
|-----------|-----------------|----------------|-----------------------|------------------|------|
| Trigger.dev v4 | yes | high (from TS state machine to task SDK) | cloud (free tier 10K invocations/mo) OR self-host Docker (new infra burden) | queue definition, lifecycle hooks, batchTrigger API | medium-high |
| Inngest Agent Kit | yes | medium (Networks shape similar to state machine; Router pattern familiar) | cloud + SDK or self-host | new SDK, requires Inngest account for prod | medium |
| CrewAI | Python only | complete rewrite from TS to Python | zero platform cost (OSS) | language rewrite = 2-3 week sprint | high |
| LangGraph | Python+TS (TS partial) | medium (graph DAG mental model differs from Hermes' explicit state transitions) | cloud (LangSmith required for debugging) | TS support is "partial" (async context, streaming limits) | medium |
| AutoGen 0.4 | Python+TS | medium (conversation model vs state machine) | zero platform cost (OSS) | token caps must be manually set everywhere | medium |

## Codebase Touchpoint

**File: `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/hermes/runner.ts`**

Current pattern (simplified):

```typescript
// Hermes state machine: explicit, deterministic, no framework
type HermesState = { phase: "plan" | "code" | "review" | "refine" | "done"; codeBlocks: string[]; };

async function runHermes(task: string, state: HermesState): Promise<HermesState> {
  switch (state.phase) {
    case "plan":
      const plan = await claude.prompt("Plan this: " + task);
      return { ...state, phase: "code", codeBlocks: [] };
    case "code":
      const code = await claude.prompt("Write code for: " + plan);
      return { ...state, codeBlocks: [code], phase: "review" };
    case "review":
      const critique = await claude.prompt("Critique: " + code);
      return { ...state, phase: critique.includes("OK") ? "done" : "refine" };
    case "refine":
      // ...iterate...
    case "done":
      return state;
  }
}
```

**Why this beats LangGraph for ZAO:**
- No graph DAG compilation step.
- No external observability dependency (LangSmith).
- Claude API calls are counted natively (simple Anthropic dashboard).
- Explicit state mutations match Zaal's "no magic" preference.
- 80 lines of TS vs 500+ lines of boilerplate in LangGraph + Python virtual environment setup.

## Production Maturity Check

| Framework | v1.0+ Launch | Prod Users | Stability | Zaal's Fit |
|-----------|--------------|-----------|-----------|-----------|
| Trigger.dev v4 | Sept 2024 | Medium (Vercel, Algora) | stable but young | low (cloud-first) |
| Inngest Agent Kit | Mar 2026 | Unknown (<1 year) | beta-quality | medium (TS native but unproven) |
| CrewAI | 2023 | High (content teams, research pipelines) | production | low (Python-only) |
| AutoGen 0.4 | Jan 2026 | Medium (research, code gen) | stable core, edge cases hot | low (token risk) |
| LangGraph | 2023 | High (enterprise, regulated) | production | low (requires LangSmith) |

## Next Actions

| Action | Owner | Type | Priority |
|--------|-------|------|----------|
| Document Hermes state machine design as architecture decision (ADR) | @Zaal | research doc | P2 - post-ship |
| If ZAO agents exceed 5 concurrent or need sub-1s latency, revisit Inngest Agent Kit | @Zaal | defer | P3 - future |
| If Zaal demands visual workflow editor, prototype n8n POC (1 day) | @Zaal | optional | P4 - nice-to-have |
| Monitor Trigger.dev v4 stability over next 6 months; rerun for cron-heavy tasks if savings > $100/mo | @Zaal | monitor | P3 - future |

## Sources

1. [LangGraph vs CrewAI vs AutoGen: 2026 Decision Guide](https://pratikpathak.com/langgraph-vs-crewai-vs-autogen-2026/) - Pratik Pathak, Apr 28 2026. Detailed comparison of production use cases, cost benchmarks (1000 runs/day: LangGraph $63/mo vs CrewAI $76/mo vs AutoGen $120/mo unbounded).

2. [Trigger.dev v3 Deprecation](https://github.com/triggerdotdev/trigger.dev/blob/main/docs/migrating-from-v3.mdx) - Official docs. v3 EOL: 2026-04-01 new deploys, 2026-07-01 full shutdown. v4 requires queue pre-definition and lifecycle hook refactoring.

3. [Inngest Agent Kit Docs](https://agentkit.inngest.com/overview) - Inngest, 2026. TypeScript-native, state-based routing, MCP tool support. GitHub 14.7K stars (Trigger.dev). No version lock-in yet.

4. [n8n AI Agent Node Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/) - n8n team, v1.82.0+. Visual workflow builder, 422+ integrations, human-in-the-loop via approval nodes. Primary use case: non-technical users. Not Zaal's workflow.

5. [AutoGen: A Multi-Agent Framework (Hacker News discussion)](https://news.ycombinator.com/item?id=46733406) - Apr 2026. Thread on "LangChain, AutoGen, CrewAI, Temporal: What breaks when you need governance?" Consensus: all three lack audit trails for regulated industries; AutoGen conversation loops burn tokens unpredictably.

## Conclusion

ZAO's custom TypeScript state machine + Hermes runner is optimal for the current org size, VPS-only infrastructure, and Claude Max plan dynamics. The gap between "what we have" and "what frameworks offer" is bridged by existing patterns (Supabase for durability, console.error + structured logs for observability, telegram webhooks for events).

Adopting any framework trades simplicity + cost + language alignment for features ZAO doesn't use (visual editors, multi-tenant queueing, enterprise observability). The math favors staying put.

**Revisit in Q4 2026 if:**
- ZAO launches 5+ concurrent agents per workflow.
- Observability gaps block debugging (they haven't, yet).
- Inngest Agent Kit matures with 2+ years of production stories.

Until then: **KEEP Hermes. SKIP frameworks.**
