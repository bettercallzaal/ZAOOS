---
topic: agents
type: decision
status: research-complete
last-validated: 2026-06-25
superseded-by:
related-docs: 288, 289, 899
original-query: "keep /looping research on agents and how we can make ours better and more accessible through dashboards"
tier: STANDARD
---

# 907 - Agent Fleet Dashboard (make ZAO's agents visible + controllable)

> **Goal:** One screen to see + steer the whole agent fleet (ZOE, ZOL, Hermes, the Pi researchers, the ecosystem-monitor) without ssh - status, cost, logs, and one-tap approvals. Decide build-vs-buy.

## Key decisions (recommendations first)

| Decision | Call | Why |
|----------|------|-----|
| Build vs buy | **BUILD a custom Next.js + Supabase fleet dashboard** | ZAO already runs Next.js 16 + Supabase + iron-session + Telegram. One approver (Zaal), agents on machines you control (VPS + Pi). SaaS (AgentOps/Langfuse Cloud) = vendor lock-in + data leaves + you'd still build custom approval UX. |
| Where it lives | **`/agents` route in ZAOOS (or zoe.zaoos.com)**, mobile-first, navy/gold | Reuses existing app + auth. No new infra. |
| Data plane | **Supabase tables** `agent_state`, `agent_logs`, `agent_approvals`; agents heartbeat every 30s | Supabase realtime gives live updates cheaply; same DB the app already uses. (NOTE: new tables = a migration = ask-first.) |
| Approvals | **Tiered + Telegram dual-surface** (the tiers ZOE's `approvals.ts` already encodes) | Telegram for fast yes/no, dashboard for the audit trail + complex cards. No new modal UX. |
| Deep tracing | **Defer Langfuse (self-hosted) to a later phase** | MIT, Postgres-native, but the custom grid covers visibility first. Add it only if you need per-step LLM traces. |

## The fleet dashboard spec

**Top bar:** fleet status ("5/7 online"), total cost today, critical alerts (offline unit / approval timeout).

**Agent-card grid** (3-col desktop / 1-col mobile), one card per agent (ZOE, ZOL, Hermes, YT researcher, SEO researcher, ecosystem-monitor): status (OFFLINE/IDLE/WORKING/ERROR), current/last action + time, tokens + $ today, health (uptime, error rate), buttons [View Logs] [Start/Stop] [Approve].

**Approvals sidebar:** `agent_approvals WHERE status='pending'` as cards - agent, action, a 15-min countdown bar, APPROVE/REJECT. One-tap, no prose.

**Activity feed (last 2h):** timeline of agent actions. **Cost breakdown (expandable):** per-agent, per-model, trend.

**Data sources:** VPS/Pi agents write heartbeat -> `agent_state`; actions -> `agent_logs`; pending -> `agent_approvals`. Dashboard reads via Supabase realtime (or 2s poll). Auth = existing iron-session (Zaal only).

## Approval pattern (matches what ZOE already has)

Tiered, per `approvals.ts` + the autonomy tiers: **Tier 0** auto (read/research/draft) - no card; **Tier 1** async one-tap (low-cost posts, follows) - Telegram button + dashboard card; **Tier 2** blocking (money, posting as @zaal, commitments) - card + 15-min SLA, auto-reject on timeout (no silent block). Telegram button POSTs to `/api/approvals/<id>/decide` -> Supabase -> agent resumes. Dashboard + Telegram stay in sync off the same table.

## Code / reference implementations (searched)

| Repo | License | Take |
|------|---------|------|
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | MIT | Self-hostable trace store on Postgres; the later "deep tracing" option. |
| [arize-ai/phoenix](https://github.com/arize-ai/phoenix) | ELv2 | Local-first OTel tracing + 50+ evals; good for quick inspection. |
| [agentops-ai/agentops](https://github.com/agentops-ai/agentops) | OSS SDK | 2-line session/cost tracking; the buy option (SaaS backend). |
| [Helicone/helicone](https://github.com/Helicone/helicone) | OSS | LLM cost tracking pattern. |
| Hermes Agent Kanban | (Nous) | Multi-agent board UX reference. |

ZAO-side: the fleet board already exists at thezao.xyz/bots (fleet-heartbeat timer) + the partial zoe.zaoos.com - this doc unifies them. `bot/src/zoe/approvals.ts` is the approval state machine to wire to.

## Build vs buy - numbers

| Option | Setup | Monthly | Verdict |
|--------|-------|---------|---------|
| **Build (custom Next.js + Supabase)** | ~40h | $0 (existing infra) | **PICK** |
| Langfuse Cloud (hybrid) | ~10h | $100-300 | Later, for tracing |
| AgentOps / SaaS | ~2h | $500-2000 (est) | Only at 50+ agents / compliance |

## Also See

- [Doc 899](../899-zoe-agent-fleet-audit/) - the fleet this dashboards
- [Doc 288](../288-agent-squad-monitoring-dashboards/) + [Doc 289](../289-zoe-dashboard-chat-ux-patterns/) - prior dashboard research
- `bot/src/zoe/approvals.ts`, `bot/src/zoe/call-budget.ts`, `scripts/ecosystem-monitor/` - existing pieces to surface

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve the Supabase schema (agent_state/logs/approvals) - it's a migration | @Zaal | Decision | Before build |
| Add 30s heartbeat to each agent runner (VPS + Pi) -> agent_state | @ZOE | Build | Week 1 |
| Build `/agents` card grid + realtime status | @ZOE | Build | Week 2 |
| Wire approvals sidebar + Telegram dual-surface to /api/approvals | @ZOE | Build | Week 3 |
| Defer Langfuse self-hosted for deep tracing | @Zaal | Later | Phase 4 |

## Sources

- [FULL] [langfuse/langfuse](https://github.com/langfuse/langfuse), [arize-ai/phoenix](https://github.com/arize-ai/phoenix), [agentops-ai/agentops](https://github.com/agentops-ai/agentops), [Helicone/helicone](https://github.com/Helicone/helicone) - OSS observability repos (licenses above)
- [FULL] [Langfuse observability docs](https://langfuse.com/docs/observability/overview), [Arize Phoenix docs](https://arize.com/phoenix/)
- [FULL] [Claude Agent SDK cost tracking](https://platform.claude.com/docs/en/agent-sdk/cost-tracking), [Supabase + Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [PARTIAL] [AgentOps practitioner guide](https://machinelearningmastery.com/the-practitioners-guide-to-agentops/), [Datadog LangGraph monitoring](https://www.datadoghq.com/blog/langgraph-agent-monitoring/), [Hermes Agent Kanban](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban) - skimmed for patterns
