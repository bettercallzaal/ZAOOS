# Doc 288 — Agent Squad Monitoring & Visualization Dashboards

**Date:** 2026-04-06
**Status:** Research Complete
**Tags:** agents, monitoring, dashboard, visualization, observability, OpenClaw, VPS

---

## Purpose

Survey of open-source tools for visualizing and monitoring AI agent squads — focused on projects that let you SEE agents working, not just read metrics. Evaluated for potential use with the ZAO 8-agent squad (ZOE, ZOEY, WALLET, etc.) running on the VPS.

---

## Tier 1 — Production-Ready Platforms

### 1. Mission Control (builderz-labs)

- **GitHub:** https://github.com/builderz-labs/mission-control
- **Stars:** 3,830
- **Tech:** Next.js 16, TypeScript, SQLite, WebSocket + SSE
- **License:** MIT
- **Self-hostable:** Yes — single `pnpm start`, zero external deps
- **Demo:** https://mc.builderz.dev/

**What it looks like:** 32-panel SPA dashboard. Kanban task board, agent fleet view, cost tracking charts, live log streams, memory browser, cron manager, webhook configs, pipeline orchestration. Role-based access (viewer/operator/admin). Dark theme.

**Key features:**
- Multi-gateway support — connects to OpenClaw, CrewAI, LangGraph, AutoGen, Claude SDK simultaneously
- Claude Code bridge — surfaces Claude Code team tasks/sessions read-only
- Built-in Aegis quality gate system (blocks task completion without sign-off)
- Skills Hub — browse/install agent skills from ClawdHub and skills.sh
- Recurring tasks with natural language scheduling ("every morning at 9am")
- Agent eval framework + trust scoring + secret detection
- 577 tests (282 unit + 295 E2E)

**OpenClaw/Supabase integration:** Native OpenClaw gateway adapter. No native Supabase integration but SQLite could be swapped. Best candidate for direct adoption.

**Verdict:** The most complete open-source agent dashboard. Closest to what you'd want for managing the full squad.

---

### 2. Langfuse

- **GitHub:** https://github.com/langfuse/langfuse
- **Stars:** 24,418
- **Tech:** TypeScript, Next.js, PostgreSQL, Prisma, ClickHouse
- **License:** MIT (core)
- **Self-hostable:** Yes — Docker or Kubernetes
- **Demo:** https://cloud.langfuse.com

**What it looks like:** Clean trace-centric UI. Agent graph visualization shows execution trees — which agent delegated to sub-agents, which tools fired, where state changed. Timeline view of spans. Cost breakdown per trace/session. Prompt playground.

**Key features:**
- Agent Graphs — visual DAG of multi-step agent workflows
- Span-level metrics for evaluating quality of individual steps
- Native integrations: LangChain, OpenAI SDK, Anthropic SDK, Vercel AI SDK
- Prompt management and versioning
- Evaluation framework with custom scoring

**OpenClaw/Supabase integration:** Uses PostgreSQL natively — could share a Supabase Postgres instance. Custom instrumentation via Python/TypeScript SDK.

**Verdict:** Best for deep trace analysis and debugging agent reasoning chains. Less "mission control" and more "X-ray machine."

---

### 3. Opik (Comet)

- **GitHub:** https://github.com/comet-ml/opik
- **Stars:** 18,680
- **Tech:** Python, Java (backend), React (frontend)
- **License:** Apache 2.0
- **Self-hostable:** Yes — Docker Compose
- **Demo:** https://www.comet.com/opik

**What it looks like:** Polished enterprise dashboard. Experiment leaderboard widget, grouped metrics charts, span-level metrics visualization, activity heatmaps, drag-and-drop widget layouts. Thread view with image attachments.

**Key features:**
- Workspace color maps for consistent visual identity
- Bulk tag operations across traces/spans
- Comprehensive tracing with conversation logging
- Automated evaluations framework
- Production-ready dashboards with customizable widgets

**OpenClaw/Supabase integration:** REST API for custom integrations. Could ingest events from OpenClaw via webhook.

**Verdict:** Most polished UI of the enterprise-grade tools. Good for when you want beautiful production dashboards.

---

### 4. VoltAgent / VoltOps

- **GitHub:** https://github.com/VoltAgent/voltagent
- **Stars:** 7,365
- **Tech:** TypeScript, Node.js (framework); React (console)
- **License:** MIT (framework), proprietary (VoltOps cloud)
- **Self-hostable:** Framework yes, VoltOps console — cloud + self-hosted options
- **Demo:** https://console.voltagent.dev/

**What it looks like:** n8n-style visual interface. Execution flow traces with performance metrics. Agent memory inspector. Prompt playground. Deployment manager with one-click GitHub integration.

**Key features:**
- TypeScript-first agent framework with supervisor/sub-agent architecture
- Workflow engine for declarative multi-step automations
- Tool registry with Zod-typed tools and lifecycle hooks
- MCP (Model Context Protocol) native support
- Voice capabilities (TTS/STT)
- Resumable streaming (reconnect to in-flight streams)
- Guardrails for input/output validation

**OpenClaw/Supabase integration:** TypeScript SDK could integrate. Would need adapter for OpenClaw events.

**Verdict:** Best if you want to rebuild your agent framework AND get observability. Overkill if you just want monitoring.

---

### 5. AgentOps

- **GitHub:** https://github.com/AgentOps-AI/agentops
- **Stars:** 5,442
- **Tech:** Python SDK, React dashboard
- **License:** MIT (SDK)
- **Self-hostable:** Enterprise only (AWS/GCP/Azure/on-prem)
- **Demo:** https://app.agentops.ai

**What it looks like:** Session replay interface — like a DVR for agent runs. Time-travel debugging lets you scrub through agent execution step by step. Cost tracking across agents. Multi-agent interaction visualization.

**Key features:**
- Two-line SDK integration
- Session replays — record and replay agent runs
- Time-travel debugging
- Cost tracking across 400+ LLMs
- Framework support: CrewAI, LangChain, Agno, OpenAI Agents SDK
- Benchmarking tools

**OpenClaw/Supabase integration:** Python SDK could wrap OpenClaw agent calls. Cloud-hosted dashboard (self-host requires enterprise plan).

**Verdict:** Session replay is unique and powerful. Free tier is generous but self-hosting requires enterprise.

---

## Tier 2 — Claude Code-Specific Monitoring

### 6. disler/claude-code-hooks-multi-agent-observability

- **GitHub:** https://github.com/disler/claude-code-hooks-multi-agent-observability
- **Stars:** 1,342
- **Tech:** Python (hooks), Bun (server), SQLite, Vue (client), WebSocket
- **License:** MIT
- **Self-hostable:** Yes — fully local

**What it looks like:** Real-time swim-lane dashboard. Each agent gets its own lane showing tool calls, task handoffs, and lifecycle events. Live pulse charts showing activity density. Event filtering by agent/type.

**Key features:**
- Hook-based: captures PreToolUse, PostToolUse, UserPromptSubmit events
- Traces every tool call, task handoff, agent lifecycle event
- Blocks dangerous commands (rm -rf) via deny_tool() patterns
- Sensitive file access prevention
- Per-agent filtering and session tracking

**OpenClaw/Supabase integration:** Built specifically for Claude Code hooks. Would need adaptation for OpenClaw but the event model is similar.

**Verdict:** Most directly relevant to your Claude Code setup. Could integrate with your existing hooks infrastructure.

---

### 7. Pixel Agents (pablodelucca/pixel-agents)

- **GitHub:** https://github.com/pablodelucca/pixel-agents
- **Stars:** 6,190
- **Tech:** TypeScript, VS Code extension
- **License:** MIT
- **Self-hostable:** Yes — runs as VS Code extension

**What it looks like:** Each AI agent becomes a pixel-art character in a virtual office. Characters walk around, sit at desks, and visually reflect what they're doing — typing when writing code, reading when searching files, waiting when needing attention. Animated idle/working/error states.

**Key features:**
- Visual metaphor: agents as office workers
- Real-time activity reflection (typing, reading, waiting, error)
- VS Code integration via Claude Code hooks
- Character customization

**OpenClaw/Supabase integration:** VS Code-specific. Would need significant rework for web/VPS dashboard use.

**Verdict:** THE most visually compelling approach. Pure inspiration for "seeing agents work." Not practical for VPS monitoring but the concept is gold.

---

### 8. Claude Office (paulrobello/claude-office)

- **GitHub:** https://github.com/paulrobello/claude-office
- **Stars:** 282
- **Tech:** TypeScript
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** Pixel art office simulation with 11 visualization modes including multi-mode whiteboard display. Agents rendered as characters in an office environment performing real-time operations.

**OpenClaw/Supabase integration:** Limited — designed for local Claude Code monitoring.

**Verdict:** Good reference implementation for the pixel office concept.

---

### 9. agents-observe (simple10)

- **GitHub:** https://github.com/simple10/agents-observe
- **Stars:** 349
- **Tech:** TypeScript
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** Real-time observability dashboard for Claude Code sessions and multi-agents. Clean, focused interface for monitoring active sessions.

**Verdict:** Lightweight alternative to disler's system. Good for simpler setups.

---

### 10. Claude Code Karma (JayantDevkar)

- **GitHub:** https://github.com/JayantDevkar/claude-code-karma
- **Stars:** 152
- **Tech:** Python
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** Dashboard for monitoring Claude Code sessions with usage analytics and session history.

**Verdict:** Simple session monitoring. Less feature-rich but easy to set up.

---

## Tier 3 — OpenClaw-Specific Dashboards

### 11. OpenClaw Dashboard (tugcantopaloglu)

- **GitHub:** https://github.com/tugcantopaloglu/openclaw-dashboard
- **Stars:** 608
- **Tech:** Pure Node.js (zero npm deps), HTML/CSS/JS
- **License:** MIT
- **Self-hostable:** Yes — `node server.js`

**What it looks like:** Full-featured web dashboard with session management, rate limit monitoring (Claude + Gemini), cost analysis, live feed of agent messages, memory viewer (MEMORY.md, HEARTBEAT.md), system health (CPU/RAM/disk sparklines), service control, cron management, Tailscale integration, activity heatmaps, streak tracking, Docker management, security dashboard.

**Key features:**
- 30+ features including TOTP MFA auth
- macOS compatible
- Keyboard shortcuts (1-7, Space, /, Esc)
- Mobile responsive
- Provider switching (Claude/Gemini)
- Per-model usage selector
- Git activity tracking
- Config editor with JSON validation
- Zero dependencies — pure Node.js

**OpenClaw/Supabase integration:** Built FOR OpenClaw. Reads workspace directly. Could add Supabase as secondary data store.

**Verdict:** Most complete OpenClaw-specific dashboard. If you're running OpenClaw, this is the one.

---

### 12. OpenClaw Mission Control (manish-raana)

- **GitHub:** https://github.com/manish-raana/openclaw-mission-control
- **Stars:** 262
- **Tech:** TypeScript, React, Convex (real-time DB)
- **License:** MIT
- **Self-hostable:** Yes (needs Convex account)

**What it looks like:** Clean task-focused dashboard. Task state tracking, agent activity monitoring, live logs. Built with Convex for real-time reactivity.

**Verdict:** Simpler alternative to tugcantopaloglu's dashboard. Convex dependency is a trade-off.

---

### 13. Clawmetry (vivekchand)

- **GitHub:** https://github.com/vivekchand/clawmetry
- **Stars:** 240
- **Tech:** Python
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** "See your agent think" — real-time observability focused on making agent reasoning visible. Traces thought processes alongside actions.

**Verdict:** Interesting focus on reasoning visibility rather than just metrics.

---

### 14. ClawBridge (dreamwing)

- **GitHub:** https://github.com/dreamwing/clawbridge
- **Stars:** 212
- **Tech:** JavaScript
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** Mobile-first dashboard. Monitor agent thoughts, actions, token costs from your phone. "Pocket-sized Mission Control."

**Verdict:** Best mobile option. Good for checking agent status on the go.

---

## Tier 4 — Visual / Creative Approaches

### 15. Star Office UI (wangmiaozero)

- **GitHub:** https://github.com/wangmiaozero/Star-Office-UI-Node
- **Stars:** 12
- **Tech:** JavaScript, Node.js
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** Pixelated "office" dashboard showing multiple AI agents' work status on one screen — who's writing, who's searching, who's running tasks, who's online. Shows "yesterday's traces." Designed to make collaboration visible at a glance.

**Verdict:** Closest to the "see your squad working" vision. Small project but interesting concept.

---

### 16. CodeMap (JamsusMaximus)

- **GitHub:** https://github.com/JamsusMaximus/codemap
- **Stars:** 117
- **Tech:** TypeScript
- **License:** N/A
- **Self-hostable:** Yes

**What it looks like:** Pixel-art hotel/office where Claude Code and Cursor agents move around as characters — walking to desks, reading files, writing code. Real-time activity visualization.

**Verdict:** Fun visual metaphor. Good inspiration for gamified agent monitoring.

---

### 17. 3D AI Swarm Dashboard (joshua17574)

- **GitHub:** https://github.com/joshua17574/ai-swarm-dashboard
- **Stars:** 2
- **Tech:** TypeScript, React, Three.js, TailwindCSS
- **License:** N/A
- **Self-hostable:** Yes

**What it looks like:** Futuristic 3D visualization of agent networks using Three.js. Nodes represent agents, edges represent communication. Rotatable 3D space.

**Verdict:** Tiny project but the Three.js approach is exactly the "network graph" visual you might want.

---

## Tier 5 — Graph/Trace Visualization Libraries

### 18. Agent Prism (Evil Martians)

- **GitHub:** https://github.com/evilmartians/agent-prism
- **Stars:** 321
- **Tech:** TypeScript, React components
- **License:** MIT
- **Self-hostable:** N/A (component library)

**What it looks like:** React component library for rendering agent traces. Drop-in components for trace timelines, span trees, and execution flow visualization.

**Verdict:** Not a dashboard — building blocks for making your own. Could embed in your existing dashboard.

---

### 19. Reagraph (reaviz)

- **GitHub:** https://github.com/reaviz/reagraph
- **Stars:** 1,004
- **Tech:** TypeScript, React, WebGL
- **License:** Apache 2.0
- **Self-hostable:** N/A (component library)
- **Demo:** https://reagraph.dev

**What it looks like:** High-performance WebGL network graph visualization. 2D and 3D modes. Force-directed layouts, clustering, selection, animation. Handles large graphs smoothly.

**Verdict:** Best library for building a custom "agent network graph" visualization. Drop into React, feed it your agent topology.

---

### 20. LangGraphics (proactive-agent)

- **GitHub:** https://github.com/proactive-agent/langgraphics
- **Stars:** 83
- **Tech:** TypeScript
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** Live visualization of LangGraph execution. See how your agent "thinks" as it runs through graph nodes in real-time.

**Verdict:** Niche but useful if you adopt LangGraph.

---

## Tier 6 — Orchestration Platforms (with dashboards)

### 21. ClawTeam (HKUDS)

- **GitHub:** https://github.com/HKUDS/ClawTeam
- **Stars:** 4,478
- **Tech:** Python
- **License:** MIT
- **Self-hostable:** Yes

**What it looks like:** Agent swarm intelligence platform. Web UI for config management, multi-user workflows, team templates. P2P transport between agents.

**Verdict:** More orchestration than visualization, but the Web UI has monitoring capabilities.

---

### 22. Plano (Katanemo)

- **GitHub:** https://github.com/katanemo/plano
- **Stars:** 6,206
- **Tech:** Rust
- **License:** Apache 2.0
- **Self-hostable:** Yes

**What it looks like:** AI-native proxy and data plane. Dashboard shows routing decisions, safety checks, and LLM call distribution. More infrastructure than agent visualization.

**Verdict:** Useful if you need a smart proxy layer in front of your agents, not for direct squad monitoring.

---

### 23. AgentRails (rforgeon)

- **GitHub:** https://github.com/rforgeon/AgentRails
- **Stars:** 37
- **Tech:** TypeScript
- **License:** N/A
- **Self-hostable:** Yes

**What it looks like:** "Cursor for agents" — modern dashboard for managing and monitoring AI agents. Agent list view, task assignment, activity logs.

**Verdict:** Small but clean. Good design reference.

---

## Recommendation Matrix

| Need | Best Tool | Runner-up |
|------|-----------|-----------|
| Full squad management dashboard | **Mission Control** | OpenClaw Dashboard |
| Deep trace analysis & debugging | **Langfuse** | Opik |
| Claude Code hook monitoring | **disler/observability** | agents-observe |
| OpenClaw-specific monitoring | **tugcantopaloglu/dashboard** | Clawmetry |
| "See agents working" visual | **Pixel Agents** | Star Office UI |
| Mobile agent monitoring | **ClawBridge** | OpenClaw Dashboard |
| Build custom graph viz | **Reagraph** | Agent Prism |
| Enterprise production monitoring | **Opik** | AgentOps |
| TypeScript agent framework + monitoring | **VoltAgent/VoltOps** | Mission Control |

---

## Recommended Stack for ZAO Agent Squad

For your 8-agent VPS squad, the best combination would be:

1. **Mission Control** as the primary dashboard — self-hosted, SQLite, multi-gateway, covers task management + cost tracking + agent fleet monitoring. Has OpenClaw adapter built in.

2. **disler/observability** for Claude Code-specific hook monitoring — traces every tool call and task handoff. Already uses the same hooks infrastructure you have.

3. **Reagraph** for building a custom agent network graph component — drop into your existing Next.js dashboard to show agents as nodes with real-time connection lines.

4. **Pixel Agents concept** as inspiration for a fun "virtual office" view — could build a simplified version showing ZOE, ZOEY, WALLET etc. as characters with live status indicators.

5. **tugcantopaloglu/openclaw-dashboard** for OpenClaw-specific features if you're using OpenClaw as the gateway — rate limits, cost analysis, memory viewer, system health.

---

## Sources

- [Mission Control](https://github.com/builderz-labs/mission-control)
- [Langfuse](https://github.com/langfuse/langfuse)
- [Opik](https://github.com/comet-ml/opik)
- [VoltAgent](https://github.com/VoltAgent/voltagent)
- [VoltOps Console](https://console.voltagent.dev/)
- [AgentOps](https://github.com/AgentOps-AI/agentops)
- [disler Observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)
- [Pixel Agents](https://github.com/pablodelucca/pixel-agents)
- [OpenClaw Dashboard](https://github.com/tugcantopaloglu/openclaw-dashboard)
- [ClawBridge](https://github.com/dreamwing/clawbridge)
- [Clawmetry](https://github.com/vivekchand/clawmetry)
- [Reagraph](https://github.com/reaviz/reagraph)
- [Agent Prism](https://github.com/evilmartians/agent-prism)
- [AI Agent Observability Tools 2026](https://research.aimultiple.com/agentic-monitoring/)
- [Arize Best AI Observability Tools](https://arize.com/blog/best-ai-observability-tools-for-autonomous-agents-in-2026/)
- [AI Agent Dashboard Comparison Guide](https://thecrunch.io/ai-agent-dashboard/)
