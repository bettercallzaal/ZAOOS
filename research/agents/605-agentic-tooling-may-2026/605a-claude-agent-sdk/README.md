---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 547, 601, 604
tier: STANDARD
---

# 605a - Claude Agent SDK + OpenAI SDKs vs current ZOE Claude CLI subprocess

> **Goal:** Pick the agent runtime SDK for `bot/src/zoe` + `bot/src/hermes`. Today: Claude CLI subprocess. Question: migrate to official SDK or stay?

## Summary

ZOE and Hermes currently spawn the Claude CLI binary as a subprocess (file: `bot/src/hermes/claude-cli.ts`, pattern mirrored in `bot/src/zoe/concierge.ts`). This cheap approach works because Max plan OAuth covers the cost. Three production SDKs are now mature enough to consider: Claude Agent SDK, OpenAI Agents SDK, and Google ADK. The decision is whether to migrate, and if so, to which.

Recommendation: KEEP Claude CLI subprocess for now. Trigger migration only if Claude CLI stability degrades or if we need deep multi-turn state management that disk-based memory blocks can't provide.

## Key Decisions

| Decision | Action | Rationale |
|----------|--------|-----------|
| ZOE concierge runtime | KEEP Claude CLI subprocess | Marginal cost = zero (Max plan), deploy = simple shell spawn, state = already managed (memory blocks at ~/.zao/zoe/). No vendor lock. |
| Hermes coder/critic runtime | KEEP Claude CLI subprocess | Same cost/deploy profile. Both bots are intra-VPS only; orchestration is simple Telegram dispatch. |
| Claude Agent SDK | REVISIT WHEN: stability issues arise, or multi-turn state needs exceed file-based blocks, or Zaal priorities deep OS automation. | Mature (v0.2.111+), built on Claude Code internals, in-process MCP, best DevEx for developer-focused agents. NOT urgently needed today. |
| OpenAI Agents SDK | SKIP for ZOE/Hermes | No voice workload, no multi-LLM swap needed, no handoff-heavy multi-agent swarm. Adds API key + per-token billing. |
| Google ADK | SKIP | Enterprise-grade, Google Cloud centric, overkill for single-bot concierge. Strictfolder structure + higher onboarding cost. |

## Comparison Table

| Dimension | Claude CLI subprocess | Claude Agent SDK | OpenAI Agents SDK | Google ADK |
|-----------|----------------------|-----------------|------------------|-----------|
| Auth model | Max plan OAuth (Zaal's account) | API key (pay-per-token) | API key (pay-per-token) | Google Cloud credentials |
| Cost model | 0 marginal (included in Max) | 0.003 USD/1K input tokens (Claude 3.5 Sonnet) | 0.0025 USD/1K input tokens (GPT-4o mini) | 0.0075 USD/1K tokens (Gemini 2.0 Flash) |
| Multi-turn state | Disk-based memory blocks (~/.zao/zoe/) | Built-in session resumption, context compaction | Session auto-history, resumable state | Advanced: restore after failure, rewind context |
| MCP support | Yes (via Claude CLI) | Native + extensible | Via Composio (850+ tools) | Via Composio GoogleProvider |
| Tool calling | Yes (via CLI built-ins) | 8 built-in + custom Python functions | Function-based + MCP + hosted tools | Graph-based + MCP |
| Permissions | Implicit (what CLI can do) | Fine-grained (`allowed_tools`, `permission_mode`) | Guardrails (input/output validation) | Cloud API Registry curation |
| Voice support | No | No | Yes (TTS, Realtime API, interruption detection) | Possible (external) |
| Deployment | Shell spawn + systemd | SDK import + async loop | SDK import + async loop | SDK import + specific folder structure |
| Our fit TODAY | STRONG (zero cost, simple ops) | Medium (nice-to-have, not blockers) | Weak (voice N/A, LLM swap N/A) | Weak (enterprise overkill) |
| Our fit FUTURE | Good if CLI degrades | Good if dev-assistant workload grows | Skip unless voice agents arrive | Skip unless Google-first mandate |

## What the Official SDKs Add Over Claude CLI Subprocess

**Claude Agent SDK (Anthropic, released Apr 2026):**
- Native session persistence: resume multi-turn conversations with full context compaction (up to 12x token reduction on cache hits vs re-parsing).
- Hooks at lifecycle points (PreToolUse, PostToolUse, Stop, SessionStart): audit/log/block tool calls without wrapping CLI.
- Subagents: spawn parallel or nested agents for subtasks (e.g., one agent codes, another reviews) without spawning separate CLI instances.
- Structured output: agents emit typed messages (ResultMessage, SystemMessage) instead of parsing stdout.
- Cost controls: `max_budget_usd` parameter caps spend per session (prevents runaway token usage).
- Multi-cloud: Bedrock, Vertex AI, Azure AI Foundry auth patterns baked in (we only need API key today).

**OpenAI Agents SDK (OpenAI, released Apr 2026):**
- Handoffs: declarative delegation between agents (Agent A says "hand this to Agent B" and Agent B resumes with context).
- Voice-first: Realtime API + TTS integration, interruption detection, SIP protocol for phone calls.
- Model agnostic: Supports 100+ LLMs, not just OpenAI (GPT, Claude via Bedrock, Llama, etc).
- Observability: Tracing exports to Logfire / AgentOps / OpenTelemetry out of the box.
- Guardrails: input/output validation policies baked into the SDK (e.g., "block outputs > 10KB").

**Google ADK (Google, released 2025, v2.0 Alpha in 2026):**
- Graph-based workflows: conditional logic, branching, retry pipelines declaratively (vs imperative state machines).
- State checkpoint/restore: pause agents on failure, rewind context, resume cleanly.
- A2A (Agent2Agent): secure protocol for agent delegation without exposing internal memory (enterprise-grade).
- Multi-language: Java, Go, Python, TypeScript all first-class (we only use TS/Python).

## What We Lose by Migrating Away From Claude CLI Subprocess

- **Zero marginal cost:** Max plan is an all-you-can-eat subscription. Claude API pay-per-token applies if we migrate to SDKs. At current Sonnet rates (0.003 USD/1K input tokens), a 50K-token concierge turn costs 0.15 USD. Low in isolation, but multiplies across 50+ ZOE turns/day.
- **Simplicity of deploy:** Today, `bot/src/zoe/concierge.ts` spawns `/usr/local/bin/claude` via `child_process.spawn()`. Systemd unit file on VPS is 10 lines. Migration to SDK requires Node.js async loops, session management, proper error recovery.
- **No vendor lock:** Claude CLI is installed locally; if we swap models later, we reconfigure locally. SDK locks us into Anthropic's JavaScript SDK (though multi-cloud auth paths exist).
- **Instant stability:** Claude CLI has been battle-tested for 2+ years. SDK v0.2.111+ is mature but represents a different codebase (not the CLI binary you've been running).

## Real-World Adoption Signals (May 2026)

**GitHub trending:** Claude Agent SDK hit 2000+ stars in 4 weeks (anthropics/claude-agent-sdk-demos repo). OpenAI Agents SDK also 2000+, but older. Google ADK lower adoption (enterprise-only).

**Production users:**
- Anthropic internal research uses Claude Agent SDK for paper authoring + code generation.
- Klarna, Uber, LinkedIn run LangGraph (third-party, not official SDK) agents at scale. LangGraph added Claude Agent SDK support May 2026.
- OpenAI Agents SDK used by early GPT-5.x builders; handoff patterns praised in Dev forums.

**Forums/Reddit:** No posts on r/ClaudeAI yet (SDK too new). Hacker News posts mention "Claude Agent SDK better for developer assistants, OpenAI better for voice" as consensus.

**Real-world blocker:** Composio integration required. Neither Claude Agent nor OpenAI Agents SDKs ship GitHub integration out of the box. Teams add 850+ tools via Composio MCP.

## Migration Cost (If We Decide to Switch Later)

**Files affected:**
- `bot/src/hermes/claude-cli.ts` - spawns CLI, parses stdout
- `bot/src/zoe/concierge.ts` - spawns CLI, manages memory blocks
- `bot/src/zoe/` (4-5 handler files for Telegram integration)

**Effort difficulty:** 6/10. 
- Rewrite: ~4 hours (convert spawn to async SDK loop, wire hooks).
- Testing: ~6 hours (mock agent responses, session resume tests, cost cap tests).
- Deployment: ~2 hours (systemd unit file uses SDK, not CLI binary).

**Risk:**
- Session state: memory blocks live on disk; SDK persists state in-memory or to session ID. Migration requires persistent session store (Postgres or S3).
- Token cost surprise: SDK billed per-token. A 50K-token concierge loop = 0.15 USD. Daily cost could be 5-10 USD vs 0 today.
- Backwards compatibility: existing memory blocks (~/.zao/zoe/*.json) are not SDK-aware. Transition period requires dual-path reads.

## Current Architecture (ZOE)

**File:** `bot/src/zoe/concierge.ts`

ZOE is a Letta-style agent with:
- Persona block: `~/.zao/zoe/persona.md` (Hermes-brain pattern, system prompt)
- Human context: `~/.zao/zoe/human.md` (Zaal's preferences, decision rules)
- Recent state: `~/.zao/zoe/recent.json` (last 10 tasks, captures, brief/reflect results)
- Task log: `~/.zao/zoe/tasks.json` (full task history, appended)

On each Telegram message, concierge spawns Claude CLI with:
```
claude --input <prompt> --context-file ~/.zao/zoe/persona.md
```

CLI inherits Zaal's Max plan auth (macOS login). Returns stdout. Parsed + stored.

**Why this works:** Max plan marginal cost = 0. CLI auth is transparent (already logged in). State is explicit and inspectable (JSON files on disk).

## Hermes (Coder + Critic)

**File:** `bot/src/hermes/claude-cli.ts`

Two-agent loop:
1. **Coder** spawns Claude with `allowed_tools: ["Read", "Write", "Edit", "Bash"]`
2. **Critic** spawns Claude with `allowed_tools: ["Read", "Glob", "Grep"]`
3. Each turn persists fixes to Git; critic approves or requests changes.

Also uses CLI subprocess. No multi-turn session; each turn is a fresh spawn. Cost: 0 (Max plan).

## Next Actions

| Action | Owner | Type | Trigger |
|--------|-------|------|---------|
| Monitor Claude CLI stability on VPS. Flag if binary crashes > 1/week. | DevOps | Ops | Weekly check |
| Document current ZOE memory-block schema for future SDK migration. | Claude | Doc | Before any SDK work |
| IF stability degrades: evaluate Claude Agent SDK hooks + session resume. | @Zaal | PR | CLI failures spike |
| IF multi-agent swarm needed: prototype OpenAI Agents SDK handoffs. | @Zaal | PR | New feature brief (voice, relay bots, etc) |

## Sources

- [Agent SDK overview - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Agent SDK | Promptfoo](https://www.promptfoo.dev/docs/providers/claude-agent-sdk/)
- [Agents SDK | OpenAI API](https://platform.openai.com/docs/guides/agents)
- [Claude Agents SDK vs. OpenAI Agents SDK vs. Google ADK: The better framework for building AI agents in 2026 | Composio](https://composio.dev/content/claude-agents-sdk-vs-openai-agents-sdk-vs-google-adk)
- [GitHub - anthropics/claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos)
- [GitHub - anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python)
- [2026 AI Agent Framework Showdown: Claude Agent SDK vs Strands vs LangGraph vs OpenAI Agents SDK | QubitTool](https://qubittool.com/blog/ai-agent-framework-comparison-2026)
