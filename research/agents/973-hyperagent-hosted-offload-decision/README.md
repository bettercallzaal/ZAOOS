---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-05
superseded-by:
related-docs: 601, 737, 972
original-query: "research Hyperagent and decide how to add it to our workflow"
tier: STANDARD
---

# 973 - Hyperagent as ZAO's hosted offload layer (decision)

> **Goal:** Decide whether and how to add Hyperagent (Airtable's agent platform) to the ZAO agent workflow.

## Decision

**Adopt Hyperagent as a bounded "hosted offload layer" - trial with ONE agent (CRM on the old Airtable), keep the ZAO core self-hosted.** Do not move the core there. Measure cost over ~2 weeks, then decide whether to add more offload agents.

This is deliberately narrow: Hyperagent is architecturally a hosted mirror of ZOE (system-prompt agents + per-agent tools + memory + budget + self-improvement + MCP). ZAO already has that self-hosted, and doc 972 named **self-hosted independence** as part of the moat. So the value of Hyperagent is NOT the architecture - it is the **integrations already wired** (Airtable, Gmail, Slack, GitHub, Notion, Google Calendar, Hunter.io, etc.) for tasks ZAO has not built connectors for.

## What Hyperagent is (verified 2026-07-05)

By **Airtable**, launched April 2026. Hosted autonomous agents, each with its own system prompt, **per-agent** integrations (OAuth, not global), memory, and budget cap. Runs frontier models incl. Claude Opus 4.8. Each agent runs in a dedicated VM with a real browser - it executes (reads/writes Airtable, browses, sends), not just chats. It self-improves (auto-suggests skills + memories to review or auto-accept). Anything not native: bring your own MCP server or build a Skill (with its own stored creds).

Run modes: chat (Plan vs Execute), Live mode (watch + redirect mid-run), scheduled runs, Slack @mention, and deploy-a-working-thread-as-an-agent (webhook / email / schedule).

## Where it fits the ZAO stack (a 6th layer: hosted offload)

Layers 1-5 (doc 972) are all self-hosted. Hyperagent adds a bounded 6th surface:

| Hand OFF to Hyperagent | Keep self-hosted (never move) |
|---|---|
| Integration-heavy, **non-sensitive** tasks: Airtable CRM tidy/enrich, Gmail outreach follow-ups, lead enrichment (Hunter.io), Slack/Discord ops, calendar prep | Farcaster signer / ZOL posting, VAULT/BANKER/DEALER trading, governance / Respect, ZOE core memory, anything holding keys |

Rationale: the data for offload tasks either already lives in the connected tool (Airtable-to-Airtable is not a new-party leak) or is low-sensitivity. The core stays on ZAO infra for control + the moat.

## First agent: ZAO CRM Assistant (old Airtable)

Note: the ZAO CRM proper is on **Supabase** ([[737]] / crm-supabase-not-airtable). This targets Zaal's **separate/legacy Airtable** he wants to keep using - not a reversal of that decision.

- **Job:** read Airtable -> enrich/flag -> write back on approval (the proven Airtable+Hyperagent pattern: read record, research, synthesize, write back + notify).
- **Batch-loop pattern (the "10 passes"):** process ~25 records per run, run ~10 passes (scheduled or manual), review each batch's writes. Ten cheap, reviewable passes beat one runaway run.
- **Trust:** reads auto, **writes/deletes require approval** to start. Plan mode for anything new.
- **Config:** paste-ready Identity/system prompt delivered to Zaal 2026-07-05 (clipboard `hyperagent-crm-agent-config`).

## Guardrails (non-negotiable)

- **PII:** never hand it signer keys or third-party PII beyond what already lives in the connected tool. Per-agent creds only. Honors `.claude/rules/pii-hygiene.md`.
- **Budget:** pay-as-you-go; light tasks < $10 but daily-across-teams reaches hundreds/mo. Set a **per-agent cap**, use **Plan mode** to preview cost, watch **per-thread cost**. Web research is the credit hog - feed it data. **Background tasks cannot be stopped mid-run** (runaway risk) - keep expensive jobs in foreground/Plan.
- **Bounded trial first:** one agent, measured, before any expansion.

## Also See

- [[972]] - ZAO agent stack vs the field (self-hosted moat; this is the hosted-offload complement)
- [[601]] - agent stack cleanup (why the core fleet is deliberately small + self-hosted)
- [[737]] - CRM on Supabase (this Airtable is the legacy/separate base)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create the ZAO CRM Assistant agent in Hyperagent (paste config, connect old Airtable, set budget cap + writes-on-approval) | @Zaal | Setup | 2026-07-08 |
| Run the CRM agent in ~25-record batches, ~10 passes, review each batch | @Zaal | Run | 2026-07-12 |
| Review 2-week cost + value; decide expand (outreach/enrichment agents) or stop | @Zaal | Decision | 2026-07-19 |

## Sources

Verified 2026-07-05 (full fetches):
- https://sidsaladi.substack.com/p/hyperagent-101-the-complete-guide - complete how-to (create/run/skills/memory/budget/trust)
- https://www.gapconsulting.io/blog/i-automated-client-research-with-hyperagent-by-airtable-here-s-how - real Airtable+Hyperagent CRM/research workflow
- https://www.aitoolssme.com/review/hyperagent - day-to-day usage + gotchas (background tasks can't stop, research cost)
- https://www.airtable.com/platform/ai-agents - Airtable's own agent platform page
- https://abduzeedo.com/hyperagent-ai-agent-platform-built-airtable - product overview
