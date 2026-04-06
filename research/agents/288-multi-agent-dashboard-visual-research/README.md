# 288 — Multi-Agent Dashboard Visual Research: UI Patterns for Agent Squad Monitoring

> **Status:** Research complete
> **Date:** 2026-04-06
> **Goal:** Find real visual examples of multi-agent dashboards, extract UI patterns, and recommend an approach for ZAO's 7-agent admin dashboard
> **Tags:** `#agents` `#dashboard` `#design` `#admin` `#infrastructure`

---

## tl;dr

Surveyed 10+ multi-agent dashboard products and open-source projects. The space is converging on **5 core UI patterns**: status cards with heartbeat indicators, waterfall/timeline event streams, node graphs for agent relationships, kanban task boards, and cost/token charts. The best dashboards (Mission Control, AgentOps, VoltAgent) combine 3-4 of these into a single SPA. ZAO's advantage: we know our 7 agents by name and role, so we can build a purpose-built squad dashboard instead of a generic framework monitor.

---

## Best 7 Examples — What They Do Well

### 1. Mission Control v2 (Builderz Labs) — The Gold Standard

**What it is:** Self-hosted agent orchestration dashboard, 32 panels, MIT licensed.
**Tech:** Next.js 16, React 19, Tailwind CSS, SQLite, Zustand, Recharts.
**URL:** https://github.com/builderz-labs/mission-control

**Visual layout:**
- Left navigation rail with grouped panel categories
- Six-column Kanban board (inbox > assigned > in progress > review > quality review > done)
- Agent cards showing heartbeat status, model, active sessions, trust score, token usage, last activity
- Memory knowledge graph — interactive node visualization linking sessions, memory chunks, knowledge files
- Cost tracking dashboard with per-model breakdowns and trend charts (Recharts)
- Real-time activity feed filterable by agent, event type, or time range
- Skills Hub with security scanner results per skill

**What it does well:**
- **Comprehensive agent identity cards** — each agent shows heartbeat, model, trust score, token spend, and last activity in one glance
- **Kanban for task lifecycle** — the six-column workflow maps naturally to agent task dispatch and review
- **Memory graph visualization** — the only dashboard that makes agent memory browsable as a relationship graph
- **Native OpenClaw support** — already compatible with ZAO's agent stack
- **Production-ready** — 282 unit tests + 295 E2E tests, RBAC, HMAC webhooks

**What it lacks:** No visual communication flow between agents. No "squad view" showing agent-to-agent message routing.

---

### 2. AgentOps — Session Waterfall

**What it is:** SaaS observability platform for AI agents. Integrates with CrewAI, AutoGen, OpenAI Agents SDK, LangChain.
**URL:** https://docs.agentops.ai/v1/usage/dashboard-info

**Visual layout:**
- Session list with execution time, SDK version, framework indicators
- **Session Waterfall** (signature feature): split-screen with chronological timeline on the left (LLM calls, tool invocations, errors) and detail pane on the right showing the selected event's full prompt/completion
- LLM calls rendered as chat bubbles (familiar chat history pattern)
- Event type breakdown charts showing call types and durations
- Session drawer sidebar for quick navigation between runs

**What it does well:**
- **The waterfall is exceptional** — seeing all LLM calls, tool uses, and errors on a timeline with drill-down is the clearest way to debug agent behavior
- **Chat-style rendering of LLM calls** — makes agent reasoning readable, not just data
- **Zero-config auto-recording** — agents don't need to explicitly log events

**What it lacks:** No multi-agent topology view. Treats agents as individual sessions, not as a squad with relationships.

---

### 3. Claude Code Hooks Multi-Agent Observability (disler)

**What it is:** Open-source real-time monitoring for concurrent Claude Code agents.
**Tech:** Vue 3, TypeScript, Vite, Bun backend, WebSocket, Canvas API.
**URL:** https://github.com/disler/claude-code-hooks-multi-agent-observability

**Visual layout:**
- Vertical event timeline with dual-color-coded borders (app color on left, session color on right)
- **LivePulseChart** — canvas-based real-time bar chart with session-colored bars and emoji overlays for event types
- Filter panel with multi-select for app name, session ID, event category
- 12 hook event types each with dedicated emoji (PreToolUse, PostToolUse, Stop, SessionStart, etc.)
- Tool-specific icons (Bash, Read, Write, MCP)
- Chat transcript modal with syntax highlighting
- Dark/light theme with smooth animations

**What it does well:**
- **Dual-color system is brilliant** — primary color = which agent, secondary color = which session. Instantly scan multi-agent activity
- **LivePulseChart** — real-time heartbeat visualization showing agent activity as it happens
- **Directly relevant to ZAO** — monitors Claude Code sessions, which is exactly what BUILDER does on the VPS

**What it lacks:** No agent relationship graph. No task-level tracking. Event-stream only, no summary/dashboard view.

---

### 4. VoltAgent / VoltOps Console

**What it is:** Open-source TypeScript AI agent framework with integrated observability console.
**Tech:** TypeScript, React, n8n-style canvas visualization.
**URL:** https://github.com/VoltAgent/voltagent

**Visual layout:**
- Agent lifecycle canvas (n8n-style) — visualize LLM interactions, tool usage, state changes, and internal reasoning as connected nodes on a canvas
- Execution trace waterfall with hierarchical parent-child span visualization
- Memory inspector for viewing agent context and conversation history
- Performance metrics panel with real-time response times and resource utilization
- Logs panel with structured logging for every agent interaction

**What it does well:**
- **The n8n-style canvas** — showing agent operations as a visual flow (not just a list) makes complex multi-step reasoning legible
- **Memory inspector** — browse what the agent "knows" at any point in time
- **TypeScript-native** — same stack as ZAO OS, so patterns/components could be directly reused

**What it lacks:** Focused on single-agent deep inspection. No squad-level overview for multiple named agents.

---

### 5. Agent Swarm Dashboard (Smilkoski)

**What it is:** Real-time dashboard for multi-agent missions using CrewAI + Groq.
**Tech:** Django backend, Tailwind CSS, jQuery, Mermaid.js, Redis SSE.
**URL:** https://github.com/Smilkoski/agent-swarm-dashboard

**Visual layout:**
- Mission Control Panel — mission name, type selector (Feasibility/Swarm/Conference), "Start Mission" button
- **Live Timeline** — real-time message feed with agent names, timestamps, Markdown rendering
- **Live Agent Graph** — Mermaid.js flowchart showing "Swarm Ready" > Manager > individual agents > "Mission Complete"
- Sidebar History — past missions with names, start times, token totals
- Status Bar — "Live . X tokens . $Y cost" with real-time cost at $0.00006/token

**What it does well:**
- **Mission-centric framing** — you launch a "mission" and watch agents collaborate, not just monitor passively
- **Mermaid.js agent graph** — lightweight, no heavy graph library needed, shows flow of responsibility
- **Live cost tracking** — always visible, always updating
- **Dark mode by default, mobile-friendly**

**What it lacks:** No persistent agent state between missions. No communication protocol visualization.

---

### 6. Agency Swarm Visualization

**What it is:** Built into the Agency Swarm framework (VRSEN). ReactFlow-compatible graph export.
**URL:** https://agency-swarm.ai/core-framework/agencies/visualization

**Visual layout:**
- Interactive node-and-edge diagram
- Agent nodes show: name, description, entry point indicator, tool count
- Two edge types: **communication edges** (agent-to-agent collaboration) and **ownership edges** (agent-to-tool links)
- Two output modes: self-contained HTML file (quick view) or `get_agency_graph()` returning ReactFlow JSON for custom frontend integration

**What it does well:**
- **Communication flows are first-class** — directional edges explicitly show which agents can talk to which, using the `>` operator
- **ReactFlow JSON export** — can be directly consumed by a React frontend, which is exactly what ZAO would need
- **Tool ownership visualization** — see which agent has access to which tools

**What it lacks:** Static graph only. No real-time activity, no task tracking, no cost monitoring.

---

### 7. Azure Managed Grafana — Agent Framework Workflow Dashboard

**What it is:** Prebuilt Grafana dashboard (ID 24176) for Microsoft Agent Framework workflows.
**URL:** https://learn.microsoft.com/en-us/azure/managed-grafana/agent-framework-workflow-dashboard

**Visual layout:**
- **Workflow summary stats** — total workflows, executors, avg execution time, success rates (stat panels)
- **Execution monitoring** — time series charts with color-coded success/failure bars
- **Executor performance analysis** — table + bar chart showing execution count, duration, P95, success rate per executor
- **Visual workflow graph** — interactive node graph showing executor connections, dependencies, start points, execution flow
- **Interactive workflow selection** — table of recent runs with trace IDs, click to drill into full execution timeline
- **Error tracking** — failures at workflow and executor level with detailed error info

**What it does well:**
- **Enterprise-grade metrics** — P50, P95 latency, success rates, throughput with proper time-series visualization
- **Interactive node graph** — workflow structure as a clickable graph with zoom/navigate
- **Drill-down pattern** — overview > select workflow > see full trace with all executor calls

**What it lacks:** Requires Azure + Application Insights + OpenTelemetry. Overkill for 7 agents. No agent identity/personality concept.

---

## Honorable Mentions

| Tool | Key Feature | Relevance to ZAO |
|------|-------------|-------------------|
| **LangSmith** | Custom dashboards: token usage, P50/P99 latency, error rates, cost breakdowns, feedback scores | Good metric patterns to copy, but SaaS-only |
| **Langfuse** | Open-source (19K stars), self-hosted, agent graphs showing interaction dependencies, cost/latency dashboards | Strong OSS option, MIT licensed |
| **Helicone** | Proxy-based — one-line integration, custom property segmentation, per-user/per-model drill-down | Good analytics patterns, less relevant for squad view |
| **AgentRails** | Next.js + TypeScript + Tailwind, "Cursor for agents", embedded n8n workflow editor | Same stack as ZAO, good component patterns |
| **OpenAI Agents SDK Visualization** | Graphviz directed graph — agents as yellow boxes, tools as green ellipses, handoffs as solid arrows, tool calls as dotted arrows | Clean visual language for agent relationships |

---

## Common UI Patterns Across All Dashboards

### Pattern 1: Agent Status Cards
Every dashboard shows per-agent status. The best ones display:
- **Name + role/description**
- **Status indicator** (green pulse = active, yellow = idle, red = error, gray = offline)
- **Last activity timestamp** ("3 min ago")
- **Current task** (one-line summary)
- **Token/cost metrics** (session or cumulative)
- **Model identifier** (which LLM)

### Pattern 2: Event Timeline / Activity Feed
The most universally used pattern. Variants:
- **Waterfall** (AgentOps) — horizontal timeline with events as blocks, drill-down on click
- **Vertical feed** (Claude Code Hooks) — scrolling log with color-coded entries per agent
- **Chat-style** (AgentOps) — LLM calls rendered as chat bubbles
- **Mission timeline** (Agent Swarm) — mission-scoped with start/end boundaries

### Pattern 3: Node Graph / Topology View
Shows agent relationships:
- **Directed graph** (OpenAI SDK, Agency Swarm) — agents as nodes, handoffs/communication as directed edges
- **Mermaid flowchart** (Agent Swarm Dashboard) — lightweight, text-defined graph
- **ReactFlow canvas** (Agency Swarm, VoltAgent) — interactive, draggable nodes with zoom/pan
- **Knowledge graph** (Mission Control) — memory relationships between agents, sessions, and knowledge

### Pattern 4: Kanban / Task Board
For task lifecycle tracking:
- **Six-column** (Mission Control) — inbox > assigned > in progress > review > quality review > done
- **Mission launcher** (Agent Swarm) — select mission type > start > watch progress
- Drag-and-drop cards with priority, assignee, comments

### Pattern 5: Metrics / Cost Dashboard
Quantitative monitoring:
- **Token usage** — per-agent, per-model, per-session (Recharts, Grafana)
- **Cost tracking** — real-time running total, daily/weekly trends
- **Latency** — P50/P95/P99 response times
- **Success rates** — per-agent, per-task-type
- **Throughput** — tasks completed per hour/day

---

## What's Missing — Where ZAO Can Do Better

### 1. No "Squad Personality" View
Every dashboard treats agents as interchangeable workers. None shows agents as **named characters with roles, personalities, and relationships**. ZAO's agents have SOUL.md files, distinct missions, and a hierarchy (ZOE dispatches, ZOEY executes, SCOUT researches, etc.). A squad dashboard should make this visible.

### 2. No Agent-to-Agent Communication Visualization
Agency Swarm shows allowed communication flows as static edges. But nobody visualizes **actual messages between agents in real-time**. ZOE writes task files for ZOEY, ZOEY writes results back — this task/result handoff protocol is invisible in every dashboard reviewed.

### 3. No "Last N Results" Feed Per Agent
Dashboards show events or metrics, but none has a clean per-agent feed of **completed work products** — "SCOUT found 3 trending casts", "CASTER posted to Farcaster", "BUILDER merged PR #42". The results are the whole point.

### 4. No Mission/Campaign View
Agent Swarm Dashboard gets closest with its "mission" concept, but no dashboard tracks **ongoing campaigns** — multi-day, multi-agent efforts toward a goal (e.g., "Ship Mini App by Friday" involving BUILDER, CASTER, and WALLET).

### 5. No Community Context
None of these dashboards understand that agents serve a **community**. ZAO's agents exist to serve 188 members. Connecting agent activity to member impact ("CASTER's post got 12 replies from ZAO members") is unique to ZAO.

---

## Recommended Approach for ZAO's Agent Squad Dashboard

### Architecture: New Admin Tab, Not Separate App

Add an `agents` tab to the existing AdminPanel at `/admin`. The tab system is already built with grouped navigation. This keeps it within the existing auth, styling, and admin RBAC.

**File:** `src/components/admin/AgentSquad.tsx` (dynamically imported like all other admin tabs)

### Layout: Three-Zone Design

```
+--------------------------------------------------+
|  AGENT SQUAD (7 cards in a responsive grid)      |
|  [ZOE] [ZOEY] [BUILDER] [SCOUT] [WALLET]        |
|  [FISHBOWLZ] [CASTER]                           |
+--------------------------------------------------+
|  LEFT (60%)              |  RIGHT (40%)          |
|  Activity Feed           |  Squad Graph           |
|  (timeline of all agent  |  (node diagram showing |
|   actions, color-coded   |   who talks to who,    |
|   by agent)              |   with live pulses)    |
|                          +------------------------+
|                          |  Quick Stats           |
|                          |  (tokens today, tasks  |
|                          |   completed, cost)     |
+--------------------------------------------------+
```

### Zone 1: Agent Status Cards (Top)

Seven cards in a responsive grid (2 cols mobile, 4 cols tablet, 7 cols desktop).

Each card shows:
- **Agent name** + one-line role ("Orchestrator", "Action Agent", "Code Agent", etc.)
- **Status dot** — green (active session), yellow (idle, last seen < 1hr), red (error), gray (offline > 6hr)
- **Current task** — one line, truncated ("Scanning Farcaster trending...")
- **Last result** — one line ("Found 3 ZAO member casts" — 12 min ago)
- **Session count today** + token spend
- Click to expand: full task history, SOUL.md summary, recent results

Color scheme per agent (for timeline and graph):
| Agent | Color | Role |
|-------|-------|------|
| ZOE | Gold #f5a623 | Orchestrator |
| ZOEY | Cyan #22d3ee | Action Agent |
| BUILDER | Green #22c55e | Code Agent |
| SCOUT | Purple #a855f7 | Intel Agent |
| WALLET | Orange #f97316 | Finance Agent |
| FISHBOWLZ | Pink #ec4899 | Spaces Agent |
| CASTER | Blue #3b82f6 | Social Agent |

### Zone 2: Activity Feed (Bottom Left)

Vertical scrolling timeline, newest at top. Each entry:
- Agent color dot + name
- Action description ("Dispatched task to ZOEY: research x402 marketplace")
- Timestamp (relative: "3 min ago")
- Result badge if completed (green check, red X)
- Click to expand full details

Filter controls: by agent, by type (task/result/error/cron), by time range.

**Data source:** Poll the VPS via SSH or expose a lightweight API from OpenClaw that returns recent session logs. Initially could be a simple JSON file that ZOE maintains on the VPS, fetched via API route.

### Zone 3a: Squad Graph (Bottom Right Top)

ReactFlow mini-graph showing the 7 agents as nodes with directed edges for communication flows:
- ZOE (center) > ZOEY, BUILDER, SCOUT, WALLET, FISHBOWLZ, CASTER
- ZOEY > ZOE (results back)
- Edges pulse/glow when a message was sent recently
- Click a node to filter the activity feed to that agent

Use `@xyflow/react` (ReactFlow) — same library Agency Swarm uses for its graph export. Lightweight, React-native, well-documented.

### Zone 3b: Quick Stats (Bottom Right Bottom)

Four stat cards:
- **Tasks Today:** 12 completed / 2 in progress
- **Tokens Today:** 45.2K ($0.27)
- **Uptime:** 99.2% (ZOE last heartbeat 3 min ago)
- **Last Deploy:** BUILDER merged PR #42, 2 hours ago

### Data Pipeline

**Phase 1 (MVP):** ZOE writes a `status.json` to the VPS workspace on each heartbeat. A new API route `/api/admin/agents/status` SSHs to the VPS and reads the file. The admin tab polls this route every 60 seconds.

```
// status.json schema
{
  "timestamp": "2026-04-06T14:30:00Z",
  "agents": {
    "ZOE": {
      "status": "active",
      "currentTask": "Morning ecosystem scan",
      "lastResult": { "summary": "3 trending casts found", "at": "..." },
      "sessionsToday": 4,
      "tokensToday": 12400
    },
    ...
  },
  "recentActivity": [
    { "agent": "ZOE", "action": "dispatched", "target": "ZOEY", "task": "...", "at": "..." },
    ...
  ]
}
```

**Phase 2:** Replace SSH polling with a webhook from OpenClaw to `/api/webhooks/agent-status`. Real-time via SSE to the admin dashboard.

**Phase 3:** Mission Control v2 integration as the ops backend, with ZAO's custom squad UI as the frontend skin.

### Tech Stack for the Dashboard Component

| Concern | Library | Reason |
|---------|---------|--------|
| Graph | `@xyflow/react` (ReactFlow) | Agent relationship visualization, Agency Swarm compatible |
| Charts | `recharts` (already in Mission Control) | Token/cost sparklines in stat cards |
| Real-time | SSE via `EventSource` | Activity feed updates without polling |
| Animation | Tailwind + CSS transitions | Status dot pulse, edge glow on message |
| Layout | CSS Grid + Tailwind responsive | 7-card grid that works mobile through desktop |

### Implementation Phases

| Phase | What | Effort |
|-------|------|--------|
| P0 | Agent status cards (static data from config) + squad graph (ReactFlow) | 4 hours |
| P1 | VPS status.json + API route + live status cards | 3 hours |
| P2 | Activity feed with real-time polling | 3 hours |
| P3 | Quick stats with token/cost tracking | 2 hours |
| P4 | SSE real-time updates, edge glow animations | 4 hours |
| P5 | Mission Control v2 backend integration | 8 hours |

**Total MVP (P0-P2): ~10 hours. Full dashboard: ~24 hours.**

---

## Key Takeaways

1. **Mission Control v2 is the closest existing solution** — same tech stack (Next.js 16, React 19, Tailwind), native OpenClaw support, and it already has 32 panels including kanban, cost tracking, and agent cards. Worth deploying on the VPS alongside ZOE.

2. **AgentOps' waterfall pattern is the best for debugging** — if an agent task fails, a chronological waterfall of LLM calls > tool calls > errors is the fastest way to understand what happened.

3. **Agency Swarm's ReactFlow graph export is the right pattern for squad topology** — directed edges showing communication flows, with ReactFlow as the React library.

4. **ZAO's unique angle is the named squad with personalities** — no existing dashboard treats agents as characters with names, roles, and relationships. Building this creates something genuinely new.

5. **Start with a status.json file on the VPS** — the simplest possible data pipeline. ZOE already writes task files and results. Adding a structured status.json to the heartbeat routine takes 30 minutes and unlocks the entire dashboard.

---

## Sources

- [Mission Control — Builderz Labs](https://github.com/builderz-labs/mission-control)
- [AgentOps Dashboard Docs](https://docs.agentops.ai/v1/usage/dashboard-info)
- [Claude Code Hooks Multi-Agent Observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)
- [VoltAgent / VoltOps Console](https://github.com/VoltAgent/voltagent)
- [Agent Swarm Dashboard](https://github.com/Smilkoski/agent-swarm-dashboard)
- [Agency Swarm Visualization](https://agency-swarm.ai/core-framework/agencies/visualization)
- [Azure Grafana Agent Framework Workflow Dashboard](https://learn.microsoft.com/en-us/azure/managed-grafana/agent-framework-workflow-dashboard)
- [OpenAI Agents SDK Visualization](https://openai.github.io/openai-agents-python/visualization/)
- [AgentRails — Next.js Agent Dashboard](https://github.com/rforgeon/AgentRails)
- [Langfuse — Open Source LLM Observability](https://github.com/langfuse/langfuse)
- [LangSmith Observability](https://www.langchain.com/langsmith/observability)
- [LangGraph Studio](https://changelog.langchain.com/announcements/langgraph-studio-the-first-agent-ide)
- [CrewAI Platform](https://crewai.com/)
- [SigNoz CrewAI Dashboard Template](https://signoz.io/docs/dashboards/dashboard-templates/crewai-dashboard/)
- [CrewAI Visualizer](https://github.com/Eng-Elias/CrewAI-Visualizer)
- [Helicone LLM Observability](https://www.helicone.ai/)
- [Braintrust AI Observability Guide](https://www.braintrust.dev/articles/best-ai-observability-tools-2026)
- [ZAO Doc 266 — Mission Control v2](../266-mission-control-v2/)
- [ZAO Doc 278 — Agentic Bootcamp Gap Analysis](../278-agentic-bootcamp-zao-agent-squad/)
- [ZAO Doc 254 — ZOE Agent Ecosystem Status](../../events/254-zoe-agent-ecosystem-status/)
