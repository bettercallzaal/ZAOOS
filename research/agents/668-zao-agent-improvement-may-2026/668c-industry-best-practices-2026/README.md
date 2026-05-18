---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-18
related-docs: 541, 523, 527, 547
tier: STANDARD
parent: 668
---

# 668c - ZAO Agent Infrastructure: Industry Best Practices 2026

**Goal:** Survey 2026 agent infrastructure standards across 7 dimensions, map ZAO's position, identify gaps and next-step actions.

---

## 1. MCP (Model Context Protocol) Servers

### Current State of the Art

MCP adoption exploded from 1,200 servers (Q1 2025) to 9,400+ (Apr 2026), with +18% MoM growth. 78% of enterprise AI teams report at least one MCP-backed agent in production.

**Top canonical deployments:**
- **Claude Desktop** (reference client) - local/stdio transport, zero setup
- **Anthropic official MCP servers** - GitHub, Slack, Linear, Gmail, Google Drive, Filesystem (May 2026 GA)
- **Community leaders** - Fetch, Browser, Raycast, etc. (github.com/modelcontextprotocol/servers)

**Transport modes:**
- Standard I/O (stdio): local development, fast, zero network config
- Streamable HTTP (HTTPS): production, multi-client, OAuth 2.1, horizontal scaling

### ZAO's Current Position

ZAO's bot stack (ZOE, Hermes, Devz, ZAOstock bot) is **MCP-unaware**. Tools are hardcoded or embedded via Anthropic SDK calls, not advertised as MCP servers. No server registry, no Client-initiated discovery.

### Gap Analysis

**Gap 1: No Tool-as-Service registry.** Hermes tools (git, codebase read, test run) live in `bot/src/hermes/coder.ts` as embedded functions. No standard way for other agents (Bonfire, future ZOE children, external partners) to discover and call them.

**Gap 2: Insufficient for decentralized agent coordination.** ZAO → Hermes dispatch is hardcoded in Telegram handlers. If someone else wants to wire Hermes into a Farcaster client or Discord bot, they must fork + reconfig. MCP would enable plug-and-play.

### Next Steps for ZAO

1. **Month 1 (May):** Document ZOE/Hermes/Devz tool inventory. Which are genuinely reusable? (github read, git ops, test run, design review)
2. **Month 2 (Jun):** Publish 1-2 MCP server wrappers (e.g., `mcp-zao-hermes` for code-fix dispatch) to registry
3. **Defer:** Full MCP porting (requires Anthropic SDK refactor). Start with "MCP gateway" that wraps existing CLI calls

**Effort:** Low priority. MCP is infrastructure elegance, not a blocker. Revisit Q3 2026 if ZAO partners request external integrations.

---

## 2. Agent Evaluation Frameworks 2026

### Current State of the Art

**Top contenders:**
- **Inspect AI** (UK AISI + Meridian Labs) - OSS Python, adopted by Anthropic/DeepMind/Grok, focus on agentic reasoning + multi-turn
- **Anthropic Evals guidance** (2026) - production monitoring + post-launch distribution-drift detection, not just static tests
- **LangSmith** (LangChain) - strongest if stack is LangChain/LangGraph, combines observability + eval
- **Patronus AI** - specialized hallucination detection, rubric-based scoring, execution-trace analysis

**Key insight:** Multi-turn agent evaluation is fundamentally different from LLM output eval. Failures are compositional (one bad decision cascades).

### ZAO's Current Position

ZAO evals are **manual and per-agent:**
- Hermes: doc 531 audit (9 production runs, 1 success, escalation rate ~89%) — no structured eval harness
- ZOE: feedback loops via Telegram DMs, no event log
- Devz: zero evals, pure dogfooding

No Inspect, no Anthropic Evals SDK, no post-launch monitoring infra.

### Gap Analysis

**Gap 1: No structured multi-turn eval harness.** Hermes success is binary (PR merged or PR failed). No metrics on intermediate decisions (file read accuracy, diff quality pre-review, critic consistency).

**Gap 2: No production monitoring.** ZAO agents run live daily (ZOE posts, Hermes /fix, ZAOstock bot) with zero observability. Distribution drift (user behavior change, API failure, token limit hit) is invisible until manual review.

**Gap 3: No regression testing.** Adding a new tool to Hermes has zero eval coverage. Could break existing workflows silently.

### Next Steps for ZAO

1. **Immediate (May):** Wire Inspect AI for Hermes eval on 5-10 real /fix issues. Measure: Did Coder pick right files? Did Critic agree with outcome?
2. **Month 2 (Jun):** Add structured event logging to Hermes runner (attempt #, model, token count, decision reason). Build simple Telegram dashboard showing success rate + cost/run
3. **Month 3 (Jul):** Adopt Anthropic Evals SDK for ZOE (post behavior detection, memory coherence, recall accuracy)

**Effort:** Inspect = 3-4 days setup. Event logging = 2-3 days. Anthropic Evals SDK integration = 5-7 days for ZOE.

**ROI:** Confidence in /fix quality, cost per run visibility, early warning on agent degradation.

---

## 3. Tool-Use Patterns (Routing & Orchestration)

### Current State of the Art

2026 best practices:
- **ReAct (Reasoning + Acting):** Model generates Thought → Action (tool call) → Observation loop until done
- **Parallel function calling:** Multiple tools triggered simultaneously (vs sequential)
- **Tiered routing (cost optimization):** Public data (Haiku), sensitive data (Opus), error recovery (Sonnet)
- **Structured output verification:** JSON Schema / Constrained Decoding prevents free-text hallucination in structured contexts
- **Error feedback loop:** Tool errors fed back as Observation, model attempts fix

**Canonical example:** Aider (75+ provider support, weak-model for repo map + primary model for edits = 70-85% cost savings)

### ZAO's Current Position

ZAO's tool-use is **model-agnostic but monolithic:**

- **Hermes:** Coder (Opus only) reads files via embedded `read(path)` and edits via `write(path)`. Structured error handling (git merge conflict → Critic → Coder retry). No tiered routing; no Haiku for reads.
- **ZOE:** No explicit tool-calling logic. Uses Claude Opus directly for all decisions (posts, recalls, dispatches).
- **Devz:** Simple shell execution + stdout capture.

Doc 541 identified this exact gap: **Gap #1 (Haiku for reads) saves 30-40% cost without quality loss.**

### Gap Analysis

**Gap 1: No weak-model routing.** Hermes reads 300K tokens of codebase at Opus cost. Haiku costs 12x less, works fine for syntax/imports.

**Gap 2: No parallel tool dispatch.** Hermes runs tools sequentially. Could spawn `git log`, `tsc check`, `import analyzer` in parallel, collect results.

**Gap 3: Tool output validation is implicit.** If `tsc` returns bad JSON, Coder just retries. No structured schema ensures valid output format upfront.

### Next Steps for ZAO

1. **Sprint 1 (immediate):** Implement Haiku routing for Hermes reads (Gap #1 from doc 541). 3-4 days. Expected: 30-40% cost reduction.
2. **Sprint 2 (Jun):** Parallel tool dispatch for pre-flight (typecheck + lint + test run simultaneously). 2-3 days.
3. **Sprint 3 (Jul):** Constrained output schema for Critic review (force JSON with `confidence: number`, `category: enum`). 2 days.

**Effort:** 7-9 days total. **ROI:** $2,890/year savings (1 /fix/day baseline); scales to $14,450/year at 5 /fix/day.

---

## 4. Persistent Memory Layers

### Current State of the Art (2026 Benchmarks)

**Top five systems:**

| System | Type | Strengths | Weakness | Cost |
|--------|------|-----------|----------|------|
| **Mem0** | Vector+Graph+KV | Fact extraction, 47K★, usable free tier | Not production-scale | Free or $99/mo |
| **Zep** | Memory server | Temporal knowledge graph, LongMemEval 63.8%, async summarization | Requires deployment | $99/mo SaaS or OSS |
| **Letta** (formerly MemGPT) | OS-inspired | Agent autonomy over memory (RAM/disk metaphor), weeks of context | Complex ops, small community | Free OSS, $50/mo managed |
| **Cognee** | Graph+RAG | Auto-indexing, semantic relationships | Early stage | Proprietary |
| **Markdown + semantic search** | Manual | Zero vendor lock, full control, transparent | Requires custom indexing | Free (self-hosted) |

**ZAO's current setup (2026-05-15):**
- **ZOE:** 4-block Letta memory at `~/.zao/zoe/` (brief, soul, heartbeat, agents). Persistent across sessions. Manual block edits.
- **Hermes:** Zero persistent memory. Each /fix run is stateless; only Critic feedback loops back as prose.
- **ZAOstock bot:** Zero persistent memory. Fresh `stock_activity_log` entries per interaction.

### Gap Analysis

**Gap 1: Hermes loses decision context.** Attempt 1 fails → Critic explains why → Attempt 2 starts fresh (no structured history). By attempt 3, Zaal escalates blind.

**Gap 2: ZOE memory is static.** Four blocks hand-edited in CLAUDE.md. No auto-extraction of new facts (e.g., "learned X person prefers Y communication style"). Growth is manual.

**Gap 3: No cross-agent memory sharing.** ZOE ↔ Hermes ↔ Devz ↔ ZAOstock bot have zero shared context. Each discovers user preferences independently.

### Next Steps for ZAO

1. **Month 1 (May):** Add Hermes event log table + auto-summary of attempt history. Wire Critic to read previous attempt summaries. 2-3 days. **Impact:** Visible decision tree, fewer escalations.
2. **Month 2 (Jun):** Upgrade ZOE to auto-extract facts from interactions (Mem0 or Zep integration). Start with user preferences + project context. 3-5 days.
3. **Month 3 (Jul):** Shared memory index for user/project facts accessible by all agents. 2-3 days.

**Effort:** 7-11 days. **ROI:** Higher first-time success rate on Hermes, faster ZOE recall, better cross-bot context.

**Recommendation:** Use **Mem0** (free tier, 47K community) as stepping stone. If ZAO scales to 5+ agents, migrate to **Zep** for production rigor.

---

## 5. Observability & Tracing

### Current State of the Art (2026)

**Market leaders:**
- **Langfuse** (ClickHouse acquisition Jan 2026, $15B valuation) - open-source, detailed trace tree, prompt mgmt, evals, human annotation. 50K events/mo free.
- **LangSmith** - best for LangChain/LangGraph stacks
- **Logfire** (Pydantic) - 10M spans/mo free, fast setup
- **Helicone** - proxy-based, simplest integration (change base URL), 10K requests/mo free, in maintenance mode
- **Arize** - enterprise, multi-model routing focus

**Canonical stack:** Event → structured log → trace visualization → cost attribution + quality scoring

### ZAO's Current Position

ZAO observability is **siloed by agent:**
- **Hermes:** Logs to `hermes_runs` table (1 row per /fix). No trace tree, no intermediate steps. Cost is implicit.
- **ZOE:** Telegram DMs + manual review. Zero structured logs.
- **ZAOstock bot:** Activity log + dashboard. No LLM tracing.

No unified tracing stack. Cost per agent unknowable. Quality degradation invisible.

### Gap Analysis

**Gap 1: No inter-agent tracing.** If ZOE calls Hermes, no end-to-end trace.

**Gap 2: No cost attribution.** "How much did Hermes PR #322 cost?" requires manual token math.

**Gap 3: No alert on anomalies.** If token budget spikes, or success rate drops, nobody notices for days.

### Next Steps for ZAO

1. **Month 1 (May):** Wire Langfuse SDK into Hermes (runner.ts) + ZOE (dispatch). Capture attempt #, tool calls, token counts. 2-3 days. **Cost:** Free tier sufficient.
2. **Month 2 (Jun):** Build Telegram dashboard: daily cost, success rate, top-10 failed issues. 2 days.
3. **Month 3 (Jul):** Set up Langfuse alerts (cost spike > $50/day, success rate < 60%, p99 latency > 5min). 1 day.

**Effort:** 5-6 days. **ROI:** Cost visibility, early warning on quality/budget drift, Zaal can optimize in real-time.

---

## 6. Anti-Hallucination Strategies

### Current State of the Art (2026)

**Multi-layer defense:**
1. **Retrieval-Augmented Generation (RAG)** - pull verified sources before generating. Reduces hallucinations 42-68%.
2. **Structured output (JSON Schema + Constrained Decoding)** - force valid formats, prevent freeform hallucination
3. **Post-generation verification** - NLI classifier (entailment check), citation verification, self-consistency (run 3-5x, flag divergence)
4. **Agentic systems** - integrate retrieval + structured reasoning + external grounding
5. **Domain training / fine-tuning** - (expensive, skip for ZAO)
6. **Continuous measurement** - track hallucination rate per environment

### ZAO's Current Position

ZAO's approach is **manual + implicit:**
- **Hermes:** "grep research/ first" rule (doc in bot/src/hermes/coder.ts). Coder is told to check ZAO research docs before coding. No structured grounding, no verification.
- **ZOE:** Opus model + user context. No explicit RAG or verification.
- **Devz:** Shell execution (ground truth). No hallucination possible, but not adaptable to non-execution tasks.

### Gap Analysis

**Gap 1: No systematic grounding.** Hermes reads research docs ad-hoc, not via semantic search index. Could miss relevant context.

**Gap 2: No post-generation verification.** Hermes diff → Critic → human review. If Critic misses a subtle bug, it ships. No NLI or structured schema enforcement.

**Gap 3: No hallucination metrics.** "How often does Hermes produce code that looks good but crashes?" Unknown.

### Next Steps for ZAO

1. **Month 1 (May):** Build semantic index over `research/`, wire into Hermes Coder prompt via RAG (Supabase pgvector or Pinecone). Hermes queries for relevant docs by issue keyword. 3-4 days.
2. **Month 2 (Jun):** Add Critic structured output (JSON with `confidence`, `issues_found[]`, `references[]` for each assertion). 2 days.
3. **Month 3 (Jul):** Measure hallucination rate via self-consistency (Critic re-reviews 20% of diffs, flag divergence). 2 days.

**Effort:** 7-8 days. **ROI:** Fewer silent bugs, faster review cycles, quantified quality metric.

---

## 7. Agent-to-Agent Protocols

### Current State of the Art (2026)

**Emerging standards:**
- **A2A Protocol (Agent2Agent)** - Linux Foundation, Google-donated, 1-year old, 150+ orgs, production in supply chain/finance/IT ops. Uses HTTP + JSON-RPC + SSE. Defines Agent Cards (capability advertising) + task lifecycle states.
- **AGNTCY** (Cisco contribution to LF) - framework for agent collaboration via A2A
- **MCP** (Model Context Protocol) - more tool-focused, less about agent orchestration
- **Proprietary:** Each major AI lab has internal routing (Anthropic Managed Agents, OpenAI's agent framework, etc.)

**Canonical pattern:** Agents publish capabilities → Broker routes tasks → Agent executes + reports → Loop.

### ZAO's Current Position

ZAO's A2A coordination is **ad-hoc hardcoding:**
- **ZOE ↔ Hermes:** Telegram handler routes `/fix` → Hermes CLI spawn. No standard protocol; Hermes doesn't advertise capabilities.
- **ZOE ↔ Devz:** Hardcoded dispatch in ZOE memory blocks
- **ZOE ↔ Bonfire:** Planned integration (doc 547), routing not yet spec'd
- **ZAOstock bot ↔ ZOE:** Independent bots, zero coordination

No A2A, no AGNTCY, no capability registry. Works for 3-5 agents, breaks at 10+.

### Gap Analysis

**Gap 1: No capability advertising.** New teammate doesn't know ZOE capabilities without reading code.

**Gap 2: Fragile routing.** If Hermes breaks, ZOE has no fallback. No task re-routing, no retry policy.

**Gap 3: Limited scalability.** Adding a 6th agent requires hardcoding 6 new dispatch points.

### Next Steps for ZAO

1. **Month 2 (Jun):** Document ZOE/Hermes/Devz/ZAOstock bot capabilities as a simple JSON registry (agent name, tools, availability, cost). Wire into /zg (ZOE group) to show Zaal what each agent does. 1-2 days. **No external protocol needed yet; internal registry solves 80%.**
2. **Month 3 (Jul):** Implement A2A-inspired capability check before dispatch (Hermes unavailable → ZOE retries later, instead of failing immediately). 2 days.
3. **Q3 2026 (Sep):** If ZAO partners (Bonfire, external agents) want to integrate, adopt A2A for interop. 4-5 days.

**Effort:** 7-9 days over Q2-Q3. **ROI:** Easier to add agents, graceful fallback, visible capability catalog.

---

## Summary Matrix: ZAO Gaps vs Industry

| Dimension | Industry SOTA | ZAO Today | Gap Level | Next Action | Timeline |
|-----------|---------------|-----------|-----------|-------------|----------|
| **MCP** | 9,400+ servers, canonical deployment pattern | Hardcoded tools, no registry | Low | Defer (Q3 revisit if partners ask) | 2-3 months |
| **Evals** | Inspect AI, Anthropic Evals SDK, production monitoring | Manual per-agent, 89% escalation rate | HIGH | Wire Inspect + event log for Hermes | May-Jun |
| **Tool routing** | Tiered (Haiku/Sonnet/Opus), parallel dispatch, structured output | Monolithic (Opus only), sequential, implicit | HIGH | Haiku routing + parallel tools (doc 541 Gap #1, #4) | May-Jun |
| **Memory** | Mem0, Zep, Letta integration, cross-agent sharing | ZOE: 4-block Letta, static. Hermes: zero. Devz: zero | MEDIUM | Event log for Hermes, Mem0 for ZOE | Jun-Jul |
| **Observability** | Langfuse/Logfire, cost attribution, anomaly alerts | Siloed logs per agent, no unified tracing | MEDIUM | Langfuse integration + Telegram dashboard | May-Jul |
| **Anti-hallucination** | RAG + structured output + verification | Manual grep + Critic review | MEDIUM | Semantic index + JSON schema for Critic | May-Jul |
| **A2A protocols** | A2A standard, 150+ orgs, production use | Hardcoded routing, 3-5 agents max | LOW | Build internal registry, A2A if scaling > 10 agents | Jul-Sep |

---

## Sources

1. [MCP Adoption Statistics 2026](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol)
2. [Model Context Protocol Complete Guide 2026](https://sureprompts.com/blog/model-context-protocol-mcp-complete-guide-2026)
3. [Anthropic Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
4. [Inspect AI Framework](https://inspect.aisi.org.uk/)
5. [Best AI Agent Evaluation Platforms 2026](https://galileo.ai/blog/best-ai-agent-evaluation-platforms)
6. [State of AI Agent Memory 2026](https://mem0.ai/blog/state-of-ai-agent-memory-2026)
7. [Agent Memory & Knowledge Systems Compared 2026](https://fountaincity.tech/resources/blog/agent-memory-knowledge-systems-compared/)
8. [5 AI Agent Memory Systems Compared: Mem0, Zep, Letta, etc.](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3)
9. [Best LLM Observability Tools 2026](https://www.firecrawl.dev/blog/best-llm-observability-tools)
10. [Langfuse vs LangSmith vs Helicone 2026](https://guptadeepak.com/tools/top-5-llm-observability-platforms-2026/)
11. [LLM Hallucination Detection and Mitigation 2026](https://www.getmaxim.ai/articles/llm-hallucination-detection-and-mitigation-best-techniques/)
12. [Eliminating LLM Hallucinations Multi-Layer Defense Strategy](https://medium.com/@murali.nandigama/eliminating-llm-hallucinations-a-multi-layer-defense-strategy-that-actually-works-1702febb9e4d)
13. [Linux Foundation Agent2Agent Protocol](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year/)
14. [A2A Protocol V1 2026](https://a2a-protocol.org/latest/)
15. [Agent Interoperability Protocols 2026 Convergence](https://zylos.ai/research/2026-03-26-agent-interoperability-protocols-mcp-a2a-acp-convergence)
16. [Multi-LLM Tool Routing 2026](https://logic.inc/resources/best-tools-multi-llm-applications)
17. [LLM Routing Right Model for Requests](https://blog.logrocket.com/llm-routing-right-model-for-requests/)
18. [Doc 541 - Hermes Gaps vs Industry Best Practices](research/agents/541-hermes-gaps-vs-industry-best-practices/) (ZAO internal)
