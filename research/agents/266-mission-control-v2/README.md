# 266 — Mission Control v2: Open-Source AI Agent Orchestration

> **Status:** Research complete
> **Date:** March 29, 2026
> **Author:** ZOE ⚡
> **Tags:** `#infrastructure` `#agent-ops` `#open-source` `#orchestration`

---

## tl;dr

**Mission Control v2** (by Builderz Labs, @nyk_builderz) is an open-source, self-hosted AI agent ops platform. It provides a single dashboard for observability, orchestration, cost tracking, and governance across multiple agent frameworks — including **OpenClaw**. Think: aFleet / LangSmith meets open-source, deployable on your own VPS.

**Relevance to ZAO:** We're running OpenClaw + Paperclip as our agent squad. Mission Control could replace the Paperclip dashboard with a richer ops layer, or complement it. Worth watching closely.

---

## What It Is

Mission Control is an **agent orchestration dashboard** — a single SPA that connects to multiple agent gateways and gives you:

- **31 panels** covering tasks, agents, skills, logs, tokens, memory, security, cron, alerts, webhooks, pipelines
- **Real-time** WebSocket + SSE updates with smart polling
- **SQLite-backed** — zero Redis/Postgres dependency, one `pnpm start` to run
- **Multi-gateway** — adapters for OpenClaw, CrewAI, LangGraph, AutoGen, Claude SDK
- **MIT licensed**, self-hosted, no forced telemetry

---

## Key Features

### Observability
- Live session replay and debugging
- Memory knowledge graph visualization
- Token usage + cost per-agent breakdowns
- Claude Code session auto-discovery

### Orchestration
- Six-column Kanban with threaded collaboration
- Natural language recurring task scheduling ("every morning at 9am")
- **Aegis quality gates** — automated review blocks task completion without sign-off
- Task dispatch with CLI agent execution

### Automation
- Multi-gateway with OS-level agent discovery
- **Bidirectional GitHub Issues sync**
- Skills Hub with security scanner (pulls from ClawdHub + skills.sh)
- Webhooks with HMAC-SHA256 + circuit breaker

### Security
- RBAC: Viewer / Operator / Admin roles
- Session + API key auth; Google Sign-In with admin approval
- **Four-layer eval framework**: trust scoring, secret detection, MCP call auditing, hook profiles (minimal/standard/strict)
- Hardened Docker compose profile: read-only filesystem, capability dropping, HSTS, network isolation

---

## OpenClaw Integration

Mission Control v2 has **native OpenClaw support**:

- `OpenClaw doctor/fix` — auto-detect and fix OpenClaw issues from the dashboard
- `OpenClaw update flow` — managed updates
- `OpenClaw backups` — one-click backup orchestration
- `OpenClaw deploy hardening` — production security hardening
- Session streaming, log aggregation, and agent task dispatch via the OpenClaw gateway adapter

This means it can sit **on top of our current OpenClaw + Paperclip setup** and provide a richer ops interface.

---

## Benchmark Signal from @nyk_builderz

Same author published data on LangChain's coding agent:
- **66.5%** on Terminal Bench 2.0 (Top 5) — up from 52.8% (Top 30)
- **Key insight:** Zero model changes — improvement came from **harness/ops layer**, not the model
- 7 independent studies: **70–95% failure rate** on complex enterprise tasks
- Gartner: **40%+ of agentic AI projects will be canceled by 2027**

**Implication:** The ops/harness layer is the real differentiator. Mission Control is explicitly building for that layer.

---

## Relevance to ZAO OS

| ZAO Need | Mission Control Capability |
|---|---|
| Agent squad observability | 31-panel dashboard, live sessions, token tracking |
| GitHub sync | Bidirectional Issues sync (already in MC) |
| Quality gates | Aegis review system |
| Skills management | Skills Hub with ClawdHub/security scanning |
| Backup/hardening | OpenClaw-native backup + hardened deploy |
| Multi-agent workflows | Kanban + cron + task dispatch |

**Current ZAO stack:** OpenClaw gateway + Paperclip dashboard + 5 agents (CEO, Researcher, QA, Engineer, Community Manager)

**Potential upgrade path:** Replace Paperclip dashboard with Mission Control (or run both — MC as ops layer, Paperclip for agent spawning). MC's OpenClaw adapter means direct compatibility with our existing setup.

---

## Links

- **GitHub:** https://github.com/builderz-labs/mission-control
- **Dashboard:** https://mc.builderz.dev/
- **Author:** @nyk_builderz (Nyk, Co-Founder & CEO @ Builderz)

---

## Next Steps

1. **Watch** — star the repo, follow releases
2. **Test locally** — spin up on VPS in parallel with existing Paperclip setup
3. **Evaluate** — compare MC's OpenClaw integration against our current Paperclip dashboard
4. **Consider** — MC as the ops/thin-ops layer for the ZAO agent squad (replace or augment Paperclip)

---

*Research doc 208. ZOE ⚡ — ZAO OS orchestration layer.*
