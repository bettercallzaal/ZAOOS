---
topic: infrastructure
type: decision
status: approved
last-validated: 2026-07-17
related-docs: 928, 759, 1025, 1027, 1021
original-query: "build our half of Brandon's two-plane agent operating system"
tier: STANDARD
---

# 1410 - Agent Control Plane: The Machine Execution Layer (Our Half of Two-Plane OS)

> **Goal:** Implement the control plane infrastructure that Brandon's DreamNet two-plane operating system (human plane + machine execution plane) requires. This PR builds our infrastructure half - the Supabase schema, TypeScript types, assignment routing, and receipts tracking. Brandon's Gateway and capability connectors are later.

## Executive Summary

Brandon (DreamNet) designed a two-plane OS: humans work in the HUMAN PLANE (Telegram + UI), autonomous agents run in the MACHINE EXECUTION PLANE, one source of truth per object type. Zaal is adopting it with three adoptions already decided (below). This PR implements our infrastructure for the MACHINE plane - a schema layer in Supabase that:

1. Receives assignments from the human board (cowork tasks table)
2. Routes assignments to agents with capability matching + budget enforcement
3. Records every agent action as a receipt (proof-drop compatible)
4. Surfaces results back to Telegram and the board

This is the free half Zaal owns; Brandon's Gateway + capability library are integration (later). Without this control plane, every new agent integration is a custom duct-tape job. With it, each new agent is configuration.

## Three Adjustments (Vs. Brandon's Original Design)

Brandon proposed Slack + Linear + Notion as the human+decision planes. Zaal's adjustments, locked in with Brandon:

1. **Human plane = Telegram (ZOE) + zao.xyz cowork app, NOT Slack.** Telegram is where Zaal lives; the cowork app is our production task board. Both are lower-latency + owned.

2. **Execution authority stays in Supabase, NOT Linear.** The human task authority is `public.tasks` (the cowork board); we add a NEW `agent_runs` table for machine execution tracking in the SAME Supabase. This tightens the feedback loop - no external API calls to resolve "what is the current state of this assignment".

3. **Research/decisions canon stays in ZAOOS `research/`, NOT Notion.** Our institutional memory is git-versioned, linked in every research doc frontmatter, and readable by future agents. Notion was a one-way gate.

## Architecture: Two Views on One Supabase

```
HUMAN PLANE (Cowork Board)
    |
    v
public.tasks  <-- source of truth for assignments
    |
    +-- status in [backlog, ready-for-agent, in-progress, done, blocked]
    +-- assignee (field: which agent/team)
    +-- visibility (team/public/private)
    |
    v
[Transition: task status -> ready-for-agent triggers assignment emit]
    |
    v
MACHINE EXECUTION PLANE (Supabase agent_runs + receipts)
    |
    +-- agent_runs      <-- lease + status + budget tracking
    +-- receipts        <-- proof of every action (proof-drop aligned)
    |
    v
[Agent runs, emits receipts, result posted to board + Telegram]
    |
    v
Results bubble back to public.tasks (done/failed/blocked status)
    |
    v
HUMAN PLANE sees the outcome on the board
```

## Object Ownership: Who Owns What

| Object | Owner | Authority | Reads | Writes | Notes |
|--------|-------|-----------|-------|--------|-------|
| `public.tasks` (cowork board) | Human (via Telegram/UI) | Task board (Zaal) | agent_runs view for context | service-role via API routes | Source of truth for what work exists |
| `agent_runs` | Machine orchestrator (ZOE) | ZOE or routing agent | service-role only | service-role only | Lease holder + status tracking |
| `receipts` | Agent (action executor) | DreamNet Gateway | read-only from agents | service-role on agent's behalf | Proof of every action |
| Capability index | Brandon/DreamNet | Gateway definition | all agents | None (read-only catalog) | Which agents can do what (reserved) |
| Assignment envelope | ZOE (orchestrator) | ZOE | ZOE + target agent | ZOE writes, agent reads | The work directive |

## The Assignment Loop (End-to-End)

1. **Human Creates Task** - Zaal (or team) creates `public.tasks` row on the cowork board.
2. **Status Ready-for-Agent** - Task transitions to "ready-for-agent" status (Telegram button or UI).
3. **Assignment Emitted** - Supabase edge function OR n8n webhook (see spec below) emits `AssignmentEnvelope` from `public.tasks` + creates `agent_runs` row.
4. **Agent Routed** - ZOE (or a routing layer) matches assignment to capable agent, sets `assigned_agent` + `lease_owner` on `agent_runs`.
5. **Agent Executes** - Target agent claims the lease, polls the assignment from `agent_runs`, executes the work.
6. **Receipt Logged** - For each action, agent emits a `receipts` row (capability, tool, input_digest, result_type, evidence_url, approval_class).
7. **Result Posted** - Agent or ZOE updates `agent_runs.status` to done/failed/awaiting_approval, posts summary to Telegram.
8. **Board Updated** - ZOE or callback updates `public.tasks` status to done/blocked, Zaal sees result on the board.

## Priority-0 Build List (This PR)

- Schema (agent_runs, receipts, indexes, RLS) - ADDITIVE ONLY, no alter existing tables
- TypeScript types (AssignmentEnvelope, RunStatus, Receipt)
- Pure helpers (buildAssignmentEnvelope, nextRunStatus with legal transitions)
- Tests for pure helpers
- Bridge SPEC (describe the task -> assignment emit path, reference existing n8n workflows)
- Boot-verify (typecheck, vitest on new tests, do NOT run bot entrypoints)

## Strategic Note: Coupling to DreamNet

Adopting Brandon's control plane couples our execution strategy to DreamNet (doc 759). Brandon is a trusted contributor; the pattern is draft-PR-only review until he signs off. This is INTENTIONAL - we want unified agent control across the ZAO+DreamNet ecosystem, not a one-off ZAO orchestrator.

See doc 759 for the full picture. This PR is "build the infrastructure Zaal owns", not "deploy the full system".

## Gated Steps (After This PR)

- [ ] Database branch + migration apply (Zaal gates, never auto-apply)
- [ ] n8n webhook creation + secret config (Zaal + n8n admin)
- [ ] ZOE routing logic wiring (next phase, doc 1411)
- [ ] First agent integration test (after routing, see doc 1411)

## Also See

- Doc 759: ZOE orchestrator architecture (where routing + memory live)
- Doc 928: Agent loop best practices (operating rules for any autonomous loop)
- Doc 1025: ZAOOS estate split (what moves where)
- Doc 1027: Staged migration plan (how to extract bot safely)
- Brandon's DreamNet whitepaper (external, draft access)

## Next Actions

| Action | Owner | Due | Shipped Criteria |
|--------|-------|-----|------------------|
| Build control plane PR (schema + types + tests) | Claude | Now | PR URL, boot-verify PASS, gated steps listed |
| Review + sign-off | Zaal | After PR | Approve PR, review gated steps list |
| Apply migration (Supabase branch) | Zaal/Operator | Before n8n | Migration succeeds, `agent_runs` + `receipts` visible in Supabase UI |
| n8n bridge wire + test | TBD (Iman or ops) | After migration | Webhook fires on task status change, creates `agent_runs` row |
| ZOE routing integration | Claude | Doc 1411 | `agent_runs` rows picked up, assigned_agent field populated, agent executes |
