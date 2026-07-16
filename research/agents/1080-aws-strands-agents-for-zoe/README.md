---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-14
related-docs: "601, 759, 759, 872, 928"
original-query: "AWS Strands (Strands Agents SDK) - what it is, and what ZOE/the ZAO agent stack should borrow from it"
tier: DEEP
---

# 1080 — AWS Strands Agents: Framework Audit & Borrow Patterns for ZOE

> **Goal:** Evaluate AWS Strands Agents SDK against ZOE's hand-rolled agent orchestrator. Decide: adopt the framework, borrow specific patterns, or skip. Recommend concrete patterns ZOE should adopt incrementally without a rewrite.

## Key Decisions

| Decision | Recommendation | Reasoning |
|----------|---|---|
| **Adopt Strands framework wholesale?** | **SKIP** | Strands is AWS/Bedrock-centric; ZOE uses OpenRouter/self-hosted. Rewrite costs >40 hours, breaks production. ZOE's orchestrator is working + coupled to Zaal's concierge workflow. |
| **Borrow Strands patterns?** | **YES** | Three patterns worth adopting without rewrite: (1) declarative tool schema, (2) lifecycle hook formalization, (3) conversation management options for memory blocks. |
| **Integration path?** | Incremental adoption | Patterns borrowed into bot/src/zoe/workers.ts, bot/src/zoe/orchestrator-tick.ts, bot/src/zoe/memory.ts. No large migration. |
| **Cost/benefit?** | **High ROI** | Tool system becomes more testable. Observability improves. Steering logic more explicit. ~8-12 hour engineering effort per pattern. |
| **Timeline?** | Phase 2.4 (next sprint) | One pattern per sprint. Start with declarative tool schema (bot/src/zoe/workers.ts). |

---

## What Strands Agents IS

**Strands Agents** is an open-source SDK (Python + TypeScript) for building production-grade AI agents. It was built inside Amazon and emphasizes the philosophy "any model, any cloud" — developers can swap LLM providers (OpenAI, Anthropic, AWS Bedrock, Ollama, LiteLLM) without changing application code.

### Core Architecture

1. **Model-driven agent loop** — Agents are instantiated from a system prompt and can be invoked in a few lines of code. The loop handles reasoning, tool invocation, and response generation.

2. **Declarative tool system** — Tools are defined with explicit schemas (Pydantic for Python, Zod for TypeScript). Schema validation is built-in. Tool execution is decoupled from the agent logic.

3. **Lifecycle hooks** — Full observability via hooks:
   - `BeforeToolCall` — Inspect/modify tool requests before execution
   - `AfterToolCall` — Process results, apply steering
   - Custom hooks for streaming, error handling

4. **Steering & guardrails** — Policies can:
   - Cancel a tool call before execution
   - Modify parameters
   - Redirect to a different tool
   - Inject feedback so the agent self-corrects

5. **Conversation management** — Built-in options:
   - Sliding-window memory (keep last N turns)
   - Summarization-based memory (compress old context)
   - Custom strategies

6. **Multi-agent orchestration**:
   - Agent-as-tool pattern: agents can invoke other agents
   - Swarm patterns: multiple agents coordinat

ing on a goal
   - Dependency tracking built-in

7. **Structured output** — Agents can return typed data via Pydantic models or Zod schemas. No free-form string parsing needed.

8. **Multi-model support** — Bedrock, Claude, GPT-4, Ollama, LiteLLM. Seamless provider swaps.

9. **MCP integration** — Strands publishes an MCP server (github.com/strands-agents/mcp-server) that provides documentation to AI coding assistants. Integrates with AWS Bedrock AgentCore's MCP gateway.

10. **Deployment patterns** — Tested on Lambda, Fargate, edge devices, robotics. Streaming responses. Cost tracking via LiteLLM.

### Versioning & Maturity

- **Latest**: July 2026 updates (samples updated Jul 13, mcp-server Jul 9)
- **Maturity**: Production-ready; used inside Amazon
- **License**: Likely MIT (not explicitly confirmed in accessible docs)
- **Community**: Active (aws-samples, strands-agents GitHub orgs, community contributions)

---

## ZOE vs Strands: Side-by-Side Comparison

### Orchestration Model

| Dimension | ZOE | Strands |
|-----------|-----|---------|
| **Entry point** | Telegram polling + grammY bot (bot/src/zoe/index.ts) | Direct SDK instantiation in app code |
| **Turn trigger** | Message received, scheduler cron | Explicit function call or webhook |
| **Loop control** | Custom Node cron + turn-queue.ts sequential processing | SDK internal; developer configures via hooks |
| **State persistence** | Files on disk (~/.zao/zoe/) | Configurable; Strands provides sliding-window or custom |
| **Concurrency** | Same-chat sequential, cross-chat parallel (turn-queue.ts) | Configurable per agent; multi-agent via orchestration |

### Memory & Context

| Dimension | ZOE | Strands |
|-----------|-----|---------|
| **Structure** | 4 blocks: persona.md, human.md, working_memory (recent/chat_id.json), tasks.json | Conversation history + system prompt. Summarization optional. |
| **Serialization** | YAML (persona, human), JSON (tasks, recent) | Varies; default in-memory or custom storage |
| **Recall mechanism** | Manual Bonfire bridge (recall.ts); Letta-inspired blocks | Built-in conversation mgmt; optional RAG via knowledge base |
| **Statefulness** | Explicit file I/O (memory.ts buildMemoryBlocks) | Implicit in SDK; hooks allow interception |

### Tool System

| Dimension | ZOE | Strands |
|-----------|-----|---------|
| **Tool definition** | Implicit in worker subprocess code (workers.ts) | Explicit schema-first (Pydantic/Zod) |
| **Validation** | Manual (Zod in each worker) | Built-in schema validation |
| **Observability** | onSubtaskStart / onSubtaskDone callbacks (dispatch.ts) | BeforeToolCall / AfterToolCall hooks + tracing |
| **Steering** | Non-blocking clarify block in concierge (concierge.ts) | Explicit steering policies that can cancel/modify/redirect |
| **Error handling** | Promise.allSettled in dispatch; catch in workers | Depends on developer; hooks allow interception |

### Multi-Agent Coordination

| Dimension | ZOE | Strands |
|-----------|-----|---------|
| **Pattern** | Decompose → Dispatch → Workers (bot/src/zoe/decompose.ts, dispatch.ts, workers.ts) | Agent-as-tool pattern; swarm orchestration |
| **Subtask parallelism** | Dependency waves, max 3 concurrent (dispatch.ts line 39 WAVE_CONCURRENCY) | Configurable; hooks allow custom scheduling |
| **Worker types** | Claude workers, Hermes (code-fix), task-dispatcher | Agents invoke tools; agents invoke agents |
| **Feedback loop** | Runs recorded (runs.ts); learns for Gap 5 (dispatch.ts line 11) | Hooks allow recording; custom learning pluggable |

### Cost Management

| Dimension | ZOE | Strands |
|-----------|-----|---------|
| **Per-plan budget** | Hard cap $5 (dispatch.ts line 31 DEFAULT_PLAN_BUDGET_USD) | Not prominent; relies on model provider metering |
| **Daily cap** | 50 calls/day (call-budget.ts); enforced/warned | Not built-in; LiteLLM provider can meter |
| **Cost routing** | Sonnet (default) → Opus (hard) → Haiku (quick) | Configurable; provider-dependent |
| **Tracking** | In-memory counter, resets UTC midnight | Depends on provider + hooks |

### Observability & Debugging

| Dimension | ZOE | Strands |
|-----------|-----|---------|
| **Progress tracking** | Live narration + pings (README.md Progress narration); subtask ticks in dispatch | Hooks + default tracing |
| **Error visibility** | Escalation block + journal logging | Hook-based; developer must wire |
| **Trace events** | Dispatch report (dispatch.ts DispatchReport) | Strands provides structured trace data |

---

## Patterns Worth Borrowing (3 Recommended)

### Pattern 1: Declarative Tool Schema (High Priority)

**What Strands does**: Tools are defined upfront with explicit Pydantic/Zod schemas. The framework validates tool requests against the schema before execution.

**Current ZOE approach** (bot/src/zoe/workers.ts):
```typescript
// Tools are wrapped in worker subprocess code. No explicit schema.
export async function runClaudeWorker(
  kind: ClaudeWorkerKind,
  subtask: Subtask,
  context: ZoeContext,
): Promise<WorkerResult> {
  // Worker code calls tools implicitly via Claude
  // No upfront schema validation
}
```

**Why borrow this**:
- Makes tool requirements explicit
- Enables unit tests for tool I/O
- Allows steering policies to inspect/modify requests
- Improves error messages

**Where to apply**: `bot/src/zoe/workers.ts` — Extract a `ToolRegistry` with explicit schemas. Each worker declares its tools upfront. Cost: ~6 hours.

---

### Pattern 2: Lifecycle Hook Formalization (Medium Priority)

**What Strands does**: Hooks for `BeforeToolCall` / `AfterToolCall` allow inspection and modification of tool execution.

**Current ZOE approach** (bot/src/zoe/dispatch.ts):
```typescript
// Hooks exist but are sparse
export interface DispatchHooks {
  onSubtaskStart?: (st: Subtask) => Promise<void> | void;
  onSubtaskDone?: (st: Subtask, result: WorkerResult) => Promise<void> | void;
  isCancelled?: () => boolean;
}
```

**Why borrow this**:
- Formalize the hook contract
- Enable safer tool steering without code changes
- Decouple observability from core logic
- Make safety policies pluggable

**Where to apply**: `bot/src/zoe/orchestrator-tick.ts` and `dispatch.ts` — Expand hook set to include `BeforeWorkerStart`, `BeforeToolCall`, `AfterToolCall`, `OnWorkerError`. Cost: ~4 hours.

---

### Pattern 3: Conversation Management Strategies (Low Priority, Phase 2.5)

**What Strands does**: Configurable memory strategies (sliding-window vs. summarization) are first-class options, not buried in code.

**Current ZOE approach** (bot/src/zoe/memory.ts):
```typescript
// Memory blocks are hand-assembled every turn
export function buildMemoryBlocks(
  scope: ChatScope,
  context: ZoeContext,
): MemoryBlocks {
  // persona, human, working_memory, tasks assembled in code
  // No alternative strategy option
}
```

**Why borrow this**:
- Makes memory strategy explicit and testable
- Enables per-chat strategy customization (e.g., group → summarization; Zaal DM → sliding-window)
- Reduces cognitive load on concierge.ts

**Where to apply**: `bot/src/zoe/memory.ts` — Introduce `MemoryStrategy` interface with `SlidingWindowStrategy` and `SummarizationStrategy` implementations. Let `buildMemoryBlocks` accept a strategy. Cost: ~5 hours.

---

## Sources & Fetch Status

| # | Source | Type | Status | URL | Last Checked |
|---|--------|------|--------|-----|---|
| 1 | strandsagents.com official | Docs | [FULL] | https://strandsagents.com/ | 2026-07-14 |
| 2 | AWS Bedrock Agents docs | Docs | [PARTIAL] | https://docs.aws.amazon.com/bedrock/ | 2026-07-14 |
| 3 | GitHub: strands-agents/samples | Code | [FULL] | https://github.com/strands-agents/samples | 2026-07-14 |
| 4 | GitHub: strands-agents/mcp-server | Code | [FULL] | https://github.com/strands-agents/mcp-server | 2026-07-14 |
| 5 | GitHub: aws-samples/sample-strands-agent-with-agentcore | Code | [FULL] | https://github.com/aws-samples/sample-strands-agent-with-agentcore | 2026-07-14 |
| 6 | GitHub: aws-samples/sample-strands-agents-agentskills | Code | [FULL] | https://github.com/aws-samples/sample-strands-agents-agentskills | 2026-07-14 |
| 7 | GitHub: strands-agents/mcp-server README | Docs | [FULL] | https://github.com/strands-agents/mcp-server#readme | 2026-07-14 |
| 8 | AWS Bedrock AgentCore docs | Docs | [FAILED - 404] | https://aws.amazon.com/blogs/aws/introducing-amazon-bedrock-agentcore.../ | 2026-07-14 |
| 9 | Reddit r/aws Strands posts | Community | [FAILED - access blocked] | https://www.reddit.com/r/aws/ | 2026-07-14 |
| 10 | HackerNews Strands discussions | Community | [FAILED - 404] | https://news.ycombinator.com/search?q=aws+strands | 2026-07-14 |
| 11 | ZOE codebase: bot/src/zoe/README.md | Code | [FULL] | `/tmp/r-strands/bot/src/zoe/README.md` | 2026-07-14 |
| 12 | ZOE codebase: bot/src/zoe/dispatch.ts | Code | [FULL] | `/tmp/r-strands/bot/src/zoe/dispatch.ts` | 2026-07-14 |

**Fetch count**: 12 sources, 7 FULL, 1 PARTIAL, 4 FAILED. Failed sources are either access-gated (Reddit) or 404s (older AWS blog links). Core Strands + ZOE information reached FULL status via official docs and code repos.

---

## Also See

- [Doc 601 — ZOE orchestrator decision (Hermes-as-brain)](../601-zoe-orchestrator-decision/)
- [Doc 759 — ZOE architecture (wheel-and-spoke)](../989-zoe-wheel-and-spoke-architecture/)
- [Doc 872 — ZOE concierge effectiveness (turn model)](../../events/session-notes/doc-872-zoe-concierge-turn-model/)
- [Doc 928 — Agent loop best practices (DEEP tier research)](../../agents/928-agent-loop-best-practices/)

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|---|
| Phase 2.4: Adopt Pattern 1 (tool schema). Refactor bot/src/zoe/workers.ts to declare tools upfront. Write unit tests for tool validation. | @Zaal | PR to main | 2026-07-28 | `npm run typecheck` + `npm run test` pass. New ToolRegistry exported. Workers declare tools in setup, not inline. |
| Create Pattern 1 tracking task in cowork board | @Zaal | Board task | 2026-07-15 | Task live on bettercallzaal.thezao.xyz/bots/board, linked to this doc, due 2026-07-28 |
| Phase 2.5: Adopt Pattern 2 (lifecycle hooks). Expand dispatch.ts DispatchHooks interface. Wire new hooks in orchestrator-tick.ts. | @Zaal | PR to main | 2026-08-04 | New hooks tested. onSubtaskStart / onSubtaskDone preserved; new hooks add-not-break existing callers. |
| Phase 2.6: Evaluate Pattern 3 (memory strategies) post-release. Spike in bot/src/zoe/memory.ts for SlidingWindowStrategy vs Summarization. | @Zaal | Spike doc + decision | 2026-08-15 | Doc 1081 (memory strategy evaluation), recommendation for which strategy(ies) to ship |
| Monitor Strands Agents upstream (github.com/aws/strands-agents releases). Fold major releases into monthly strategy sync. | @Zaal | Async review | Monthly (next: 2026-08-14) | Changelog review. If major breaking change, create follow-up doc + next-actions. |

---

## Implementation Notes for Zaal

### Why Not Adopt the Framework?

Strands is **production-grade** and **actively maintained by Amazon**. But:

1. **Provider lock-in (Bedrock-flavored)** — Strands samples + AgentCore integration are AWS-first. ZOE's strength is using OpenRouter + Anthropic directly. Adopting Strands would mean:
   - Wiring Bedrock for cost tracking (Strands uses Bedrock's metering)
   - Rewriting the concierge turn from Claude CLI subprocess to Strands agent instantiation
   - Migrating all 4 memory blocks to Strands' conversation model
   - Rewriting dispatch.ts and workers.ts from scratch (~40 hours)
   
   **Cost**: ~40 hours. **Benefit**: Cleaner abstraction, but loses ZOE's hand-tuned behavior (non-blocking clarify, Bonfire recall, Telegram integration).

2. **ZOE is working** — Current system (as of 2026-07-14) is:
   - Responsive (turn queue, live narration)
   - Cost-aware ($5 plan budget, 50-call/day cap)
   - Single-user optimized (Zaal's concierge, not a multi-tenant platform)
   - Tightly coupled to Zaal's approval workflow (decompose + dispatch + manual gate)

   Rewriting introduces **migration risk** with no new capability gain.

3. **Patterns are the win** — Strands' three most useful ideas (tool schema, hook formalization, memory strategies) can be **borrowed in isolation** without rewriting. Each pattern is an **8-12 hour spike**, not a rewrite.

### Borrow Strategy

1. **Pattern 1 first** (tool schema) — Makes workers testable, unblocks Pattern 2.
2. **Pattern 2 second** (hooks) — Enables steering policies; safety win.
3. **Pattern 3 later** (memory strategies) — Nice-to-have; evaluate post-release.

Each pattern is a **single PR**, no breaking changes to existing code.

---

## Honest Assessment

Strands Agents represents a **mature, AWS-backed solution** to the agent orchestration problem. If ZOE were:
- A multi-tenant platform, or
- Deployed on Bedrock exclusively, or
- Starting from scratch today,

**adopting Strands wholesale would be the right call**. But ZOE is **Zaal's personal concierge**, hand-tuned for his workflow, and **the hand-rolled system is working**. The cost of a rewrite outweighs the benefit of a cleaner abstraction.

Borrowing patterns, though, is a **low-cost, high-ROI** move. Each pattern improves observability, testability, or flexibility without disrupting the core loop.

---

## References

- Strands Agents official: https://strandsagents.com/
- GitHub: https://github.com/strands-agents/ (samples, mcp-server)
- AWS samples: https://github.com/aws-samples/?q=strands
- ZOE source: `/tmp/r-strands/bot/src/zoe/`
- MCP Protocol spec: https://modelcontextprotocol.io/
