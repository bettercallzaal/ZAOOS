---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-04-28
related-docs: 161, 253, 307, 364, 415, 428
tier: STANDARD
---

# 546 - Hefty.bot: Local-First Personal AI Harness (Slava / Based Rooms tip)

> **Goal:** Evaluate hefty.bot - a closed-source local-first personal AI harness Slava flagged in a Based Rooms convo as "another harness a community member is building" - against ZAO's existing OpenClaw + Hermes + Claude Code stack. Decide: WATCH, ADOPT, STEAL, or SKIP.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Adopt as ZAO infra?** | SKIP. Hefty is a closed-source desktop app (Beta, Elite AI LLC, no public GitHub). VPS-side agent fleet stays on OpenClaw + Hermes per Doc 364. |
| **Recommend to ZAO members for personal use?** | YES, conditional. Privacy-conscious artists/operators who want a local Ollama/LM Studio frontend with MCP + plugin support get value. Free if they run local models. Watch Beta stability. |
| **Steal pattern: 3-tier memory** | YES. Hefty's `skills / antipatterns / entities` schema is cleaner than OpenClaw `MEMORY.md` blob and overlaps with ECC continuous-learning instincts. Refactor ZOE memory to mirror this trichotomy. |
| **Steal pattern: cognition pipeline** | PARTIAL. `Input -> Enrichment -> Reasoning -> Learning` matches OpenClaw + Claude Code plan-act loop already. No new pattern, but explicit `Learning` step as first-class is worth making visible in ZOE logs. |
| **Track Slava's community contributor** | YES. Need name. Ask Slava for handle/X/Farcaster on next Based Rooms touch. If contributor is ZAO-adjacent or willing to expose Hefty as MCP server, low-effort partnership unlock. |
| **MCP integration angle** | INVESTIGATE. Hefty consumes external MCP servers. ZAO OS could expose its own MCP (Farcaster post, ZABAL price, member lookup) so any Hefty user with ZAO membership gets ZAO tools in their local agent for free. |
| **Direct competitor to ZOE?** | NO. Different surface. ZOE = server-side Telegram-native ops engine. Hefty = single-user desktop assistant. Complementary, not overlapping. |

---

## What Is Hefty

Local-first AI desktop product. Tagline: "An AI That Answers to You" / "Privacy by design. Intelligence by nature."

| Field | Value |
|---|---|
| **Vendor** | Elite AI LLC |
| **Stage** | Beta, no public pricing |
| **Source** | Closed (no GitHub repo found) |
| **Data dir** | `~/.hefty` (local, conversations + knowledge + settings + generated files) |
| **Web surface** | hefty.bot - chat UI in browser, agent runs against local machine |
| **Slava context** | User reported Slava said in Based Rooms convo this is "another harness a community member is working on for agents." Contributor identity unknown - ask Slava. |

### Cognition pipeline (per /docs)

```
User message
    -> Recall relevant knowledge (skills/antipatterns/entities)
    -> Assemble conversation context
    -> Reason about request
    -> Decide: respond directly OR take action via instruments
    -> Learning step writes back to knowledge
```

### Three memory types

- **Skills** - reusable techniques that worked
- **Antipatterns** - mistakes to avoid
- **Entities** - facts about people, tools, projects

Auto-recalled when relevant. Stored locally only.

### Instruments (tools)

- File read/write
- Web browse
- App launch / control
- Screenshot
- Shell command exec
- MCP tool servers (external, plugged in)
- Custom HTTP API tools (point Hefty at any HTTP API)
- Custom prompt definitions (reusable AI tasks)
- Third-party plugins

### LLM providers

| Provider | Cost | Privacy |
|---|---|---|
| Ollama | Free, local | All local |
| LM Studio | Free, local | All local |
| OpenAI | Paid, cloud | Data leaves machine on cloud calls |
| Anthropic | Paid, cloud | Data leaves machine on cloud calls |

User can switch per-task.

### Roadmap (per /features)

- "Asks Before Acting" - permission-gated risky actions (in progress)
- Image + file sharing
- Security & permissions controls
- Communicators (email, messaging integrations)
- Identity / personality customization
- Gamification

---

## Comparison: Hefty vs ZAO Stack

| Dimension | Hefty.bot | OpenClaw (ZOE/ZOEY/WALLET) | Hermes Agent | Claude Code (Quad) |
|---|---|---|---|---|
| **Source** | Closed (no GitHub) | OSS (345K stars) | OSS (22K stars) | Closed (Anthropic CLI) |
| **Where it runs** | User desktop | VPS Docker | VPS Docker | User laptop |
| **Surface** | Browser web UI | Telegram + cron | Telegram/Discord/Slack/WhatsApp/Signal/CLI | Terminal |
| **Memory** | Skills + Antipatterns + Entities (3-tier, local) | SOUL.md + MEMORY.md (flat blobs, manual) | Persistent + FTS5 + user modeling (auto) | Project memory + global memory + instincts |
| **Agent loop** | Recall->Assemble->Reason->Act->Learn | Plan->Tool->Result | Plan->Tool->Result + skill update | Plan mode + sub-agents + hooks |
| **MCP** | YES (consumes external servers) | YES (some) | YES | YES (deep) |
| **LLM providers** | Ollama, LM Studio, OpenAI, Anthropic (4) | All major + local | All major + OpenRouter 200+ | Claude only (Sonnet 4.6, Opus 4.7) |
| **Self-improving** | Yes (writes to skills/antipatterns) | NO (stateless per task) | YES (auto skills + memory) | Yes (instincts) |
| **Multi-channel** | NO (single user, single browser) | YES (50+ platforms) | YES (6 platforms) | NO (terminal only) |
| **Privacy posture** | All local by default | VPS-side, secrets via env | VPS-side, secrets via env | Local + Anthropic API roundtrip |
| **Cost** | Free (local) or pay for cloud LLM | OpenClaw OSS + LLM cost | Hermes OSS + LLM cost | Claude Max sub or API |
| **ZAO use case** | Member personal assistant | Server-side ops (Telegram dispatch, agent fleet) | Server-side focused execution | Dev workflow |

---

## What's Actually Novel

Most of Hefty's pieces exist elsewhere. The novel + worth-stealing parts:

1. **3-tier memory schema as user-facing primitive.** Most agent stacks have one memory blob. Splitting Skills (positive patterns), Antipatterns (avoid-list), Entities (fact graph) maps cleanly to how a junior gets onboarded. Cleaner than ECC instincts (which are flat) or OpenClaw `MEMORY.md` (single doc).
2. **Local-first as product positioning, not just feature.** Privacy-first messaging targeted at "professionals handling sensitive decisions." That demo audience overlaps with artists who don't want major-label-readable AI logs. Worth flagging to ZAO members.
3. **Custom HTTP API tool definition by user.** Most harnesses make you write code or an MCP server. Hefty lets a user "point at any HTTP API" presumably via OpenAPI/spec import. If true, that's a UX win over OpenClaw / Hermes which need plugin or MCP scaffolding.

What is NOT novel:

- Cognition pipeline (every harness has one)
- Ollama + LM Studio support (every local-AI tool has this)
- MCP consumer (Claude Code, Cursor, Cline, all consume MCP)
- Permission gating "Asks Before Acting" (Claude Code already does this)

---

## Risk / Watchout List

| Risk | Severity | Note |
|---|---|---|
| Closed source - no audit possible | HIGH for ZAO infra | Can't run on VPS, can't validate "all local" claim without packet capture. SKIP for backend. |
| Beta product, single-vendor (Elite AI LLC) | MED | Vendor risk. If they fold, users lose tool. Counter: data dir is `~/.hefty`, plain files, exportable. |
| "Local-first" claim with cloud LLM option | MED | If user picks OpenAI/Anthropic provider, data leaves machine. Privacy story only intact with Ollama/LM Studio. Document this if recommending. |
| No pricing posted | LOW | Beta now, paid later possible. Local LLM use should stay free regardless. |
| Slava's contributor identity unknown | LOW | Don't write outreach until Zaal has a name. |

---

## Action Bridge / Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ask Slava (next Based Rooms) for the contributor's handle | Zaal | DM/Convo | Next Based Rooms session |
| If contributor is ZAO-adjacent, evaluate as collaborator on ZOE memory refactor | Zaal | Decision | After name confirmed |
| Refactor ZOE memory layer to 3-tier (skills/antipatterns/entities) | Claude/Quad | Issue/PR in ZAO OS | After Zaostock spinout (per project_zaostock_spinout) |
| Expose ZAO OS public APIs as an MCP server so Hefty users with membership get ZAO tools | Claude/Quad | Spike issue | Backlog, after MVP |
| Add Hefty to ZAO member tool recommendations (privacy-conscious artists) | Zaal | Member comms | After Beta -> stable |
| Re-validate doc | Claude | Update last-validated | 2026-05-28 (30 days) |

---

## Also See

- [Doc 161 - Agent Harness Engineering / LangChain](../161-agent-harness-engineering-langchain/)
- [Doc 253 - AutoAgent self-optimizing](../253-autoagent-self-optimizing-agents/)
- [Doc 307 - Great Convergence: Agent Harness Architecture](../307-great-convergence-agent-harness-architecture/)
- [Doc 364 - Multi-Harness Orchestration (OpenClaw + Hermes + Tournament)](../364-multi-harness-agent-orchestration/) - the canonical ZAO harness map; Hefty slots in as "local-desktop, not VPS"
- [Doc 415 - Composio AO pilot](../415-composio-ao-pilot/) (if present)
- [Doc 428 - AO VPS portal decision](../428-ao-vps-portal-decision/)

---

## Sources

- [hefty.bot homepage](https://hefty.bot/) - product positioning, vendor (Elite AI LLC), tagline. Verified live 2026-04-28.
- [hefty.bot/features](https://hefty.bot/features) - feature list, 4 LLM providers, MCP + plugin extensibility, roadmap. Verified live 2026-04-28.
- [hefty.bot/docs](https://hefty.bot/docs) - cognition pipeline, instruments, `~/.hefty` data dir. Verified live 2026-04-28.
- [hefty.bot/docs/architecture](https://hefty.bot/docs/architecture) - 3-tier memory (skills/antipatterns/entities), MCP connection. Verified live 2026-04-28.
- [Phil Schmid - The importance of Agent Harness in 2026](https://www.philschmid.de/agent-harness-2026) - definition of agent harness used in this doc's framing.
- [Atlan - Top AI Agent Harness Tools 2026](https://atlan.com/know/best-ai-agent-harness-tools-2026/) - landscape context.
- [HKUDS/OpenHarness GitHub](https://github.com/HKUDS/OpenHarness) - comparable open-source harness, referenced for "what closed-source Hefty competes with on the OSS side."
- ZAO Doc 364 (internal) - Multi-Harness Orchestration; existing decision to run OpenClaw + Hermes side by side.

### Not found / open

- No GitHub repo for hefty.bot
- No X/Farcaster handle for Elite AI LLC or the Slava-referenced contributor
- No public pricing
- Slava's contributor identity (per user's note: "another harness a community member is working on for agents")
