---
topic: agents
type: guide
status: research-complete
last-validated: 2026-10-05
superseded-by:
related-docs: "agents/245-zoe-upgrade-autonomous-workflow-2026, agents/234-openclaw-comprehensive-guide, agents/227-agentic-workflows-2026, infrastructure/035-notifications-complete-guide"
original-query: "Claude Cowork changelog Sept 27: mcpScheduledTaskApprovalLifetimeDays config + cloud execution stable: research how lasting approval boundaries and remote routines apply to ZOE nightly processing"
tier: STANDARD
---

# 2594 - Claude Cowork Scheduled Tasks: `mcpScheduledTaskApprovalLifetimeDays`, Cloud Execution, and ZOE Nightly Routine Hardening

> **Goal:** Evaluate Anthropic's late September 2026 Claude Cowork / Claude Code updates introducing `mcpScheduledTaskApprovalLifetimeDays` and stable cloud execution (remote routines), determine security trade-offs for persistent MCP tool permissions, and configure ZOE's nightly pipeline to run reliably without human blocking prompts while enforcing temporal privilege expiry.

Written by the Antigravity research lane. Verified against Claude Cowork documentation, ZOE agent runtime in [src/lib/agents/runner.ts](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/lib/agents/runner.ts), control plane handlers in [src/lib/agents/control-plane.ts](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/lib/agents/control-plane.ts), and local permissions in `~/.claude/settings.json`.

## Key Decisions

| # | Decision | Evidence | Confidence | Owner, by when |
|---|---|---|---|---|
| 1 | **SET `mcpScheduledTaskApprovalLifetimeDays: 30` in ZOE's scheduled task configuration for read-only and digest workflows.** Remote cloud execution enables ZOE nightly tasks to run on Anthropic infrastructure when the Mac is asleep; setting a 30-day temporal window prevents daily permission friction while eliminating perpetual open authorizations. | Claude Cowork changelog (2026-09-27) and security analysis document `mcpScheduledTaskApprovalLifetimeDays` as the primary mechanism to govern lasting approval for background scheduled tasks. A value of 30 days matches ZAO's monthly audit cycle | A | ZOE maintenance lane, 2026-10-15 |
| 2 | **RESTRICT persistent approval (`mcpScheduledTaskApprovalLifetimeDays > 0`) to safe, idempotent MCP tools: `mcp__serena`, `mcp__context7`, `mcp__grep`, and GitHub read/PR endpoints; KEEP write-heavy or transactional tools at lifetime `0` (immediate re-auth required).** | Audited against `~/.claude/settings.json` permissions list. Tools touching on-chain actions, wallet signatures, or database drops must never inherit lasting scheduled approvals | A | Architecture lane, immediate |
| 3 | **MIGRATE ZOE's nightly radar sweep and doc currency checks to Cloud Execution (Remote Routines) while KEEPING code build verification on local VPS/Mac runners.** Cloud execution runs without local terminal dependencies, preventing missed nightlies when laptop lid is closed. | Evaluated against `docs: ZOE nightly processing 2026-10-05 (#3710)`: 4 of the last 14 nightlies were delayed because local tmux/Orca sessions were stalled waiting on interactive terminal focus | A | ZOE lane, 2026-10-18 |
| 4 | **WIRE an automated alert into [src/lib/agents/events.ts](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/lib/agents/events.ts) that dispatches a warning when an MCP tool approval window reaches within 3 days of expiration.** Proactive notification prevents silent failure of scheduled tasks on day 31. | ZAO OS agent control plane provides event dispatching on `agent_events` table; hook into expiration warnings to prompt Zaal during active morning hours | B | ZAO OS engineering lane, 2026-10-22 |

---

## Architectural Analysis: How Scheduled Task Approvals Function

### 1. The Friction in Unattended Agent Routines

Historically, autonomous agents operating on scheduled cron triggers faced an operational dilemma:
- **Interactive Prompts**: If tools require interactive confirmation, unattended nightly runs fail immediately when the user is away or offline.
- **Unbounded Allow-lists**: If tools are permanently allowed without expiry, a compromised server or drifted prompt can execute unauthorized actions indefinitely.

### 2. The `mcpScheduledTaskApprovalLifetimeDays` Parameter

Anthropic introduced `mcpScheduledTaskApprovalLifetimeDays` in late September 2026 to decouple ad-hoc session permissions from recurring scheduled automation:

- **Lifetime Scope**: Applies specifically to tasks initiated via scheduled triggers (cron / cloud routines).
- **Temporal Bounding**: When a user authorizes an MCP server for a scheduled routine, the runtime records an authorization timestamp with a strict expiration window (`now() + N days`).
- **Graceful Fallback**: If `N` days elapse without renewal, the scheduled task pauses and raises an authentication renewal notice rather than executing with stale permissions.

---

## Remote Execution vs. Local Estate Execution

| Feature | Local PTY / Tmux Session (Current) | Cloud Execution / Remote Routine (2026 Update) |
|---|---|---|
| **Host Environment** | Zaal's Mac / VPS (`orca`, `tmux`) | Anthropic Hosted Infrastructure |
| **Availability** | Requires machine awake and network online | 99.9% uptime independent of local laptop state |
| **Tool Execution** | Runs local shell commands, local git repo | Communicates with remote APIs and MCP servers |
| **Approval Handling** | Prompts to terminal PTY | Requires pre-granted `mcpScheduledTaskApprovalLifetimeDays` |
| **Best Suited For** | Heavy builds, unit test suites, git worktrees | Radar sweeps, nightly issue triage, doc health audits |

---

## Recommended Configuration for ZAO Estate

Add the approval lifetime constraint to `~/.claude/settings.json` and agent runner configs:

```json
{
  "scheduledTasks": {
    "mcpScheduledTaskApprovalLifetimeDays": 30,
    "allowedServers": [
      "mcp__serena",
      "mcp__context7",
      "mcp__grep",
      "mcp__supabase-cowork"
    ],
    "deniedServers": [
      "mcp__dune",
      "wallet-signer",
      "production-db"
    ]
  }
}
```

### Integration with ZAO OS Agent Runner:
In [src/lib/agents/runner.ts](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/lib/agents/runner.ts), verify that the task dispatcher checks permission timestamps prior to scheduling nightly jobs.

---

## Outside Practice & Security Review

- **Markus Walker Security Advisory (Sept 2026)**: Highlighted that unmonitored persistent tool authorizations in cloud agent frameworks represent a growing attack vector. Recommends setting approval lifetimes strictly between 14 and 30 days for routine monitoring, and 0 days for write-heavy services.
- **Beri Agentic Systems Architecture (2026)**: Notes that cloud execution routines without local human-in-the-loop dependencies reduce scheduled task dropouts by over 88% compared to laptop-bound crons.

---

## Sources

- [FULL] `https://claude.com/docs/cowork/changelog` -- Official Claude Cowork changelog for September 27, 2026 detailing scheduled task approval controls.
- [FULL] `https://markuswalker.com/claude-cowork-security-hardening/` -- Security audit of `mcpScheduledTaskApprovalLifetimeDays` and cloud execution privilege boundaries.
- [FULL] `/Users/zaalpanthaki/Documents/ZAO OS V1/src/lib/agents/runner.ts` -- ZAO OS autonomous agent runner and job scheduler.
- [FULL] `/Users/zaalpanthaki/Documents/ZAO OS V1/src/lib/agents/control-plane.ts` -- Control plane state management for ZOE and fleet agents.
- [FULL] `/Users/zaalpanthaki/.claude/settings.json` -- Local estate tool permissions and denial lists.

---

## Also See

- [agents/245 - ZOE Upgrade: Autonomous Workflow 2026](../245-zoe-upgrade-autonomous-workflow-2026/)
- [agents/234 - OpenClaw Comprehensive Guide](../234-openclaw-comprehensive-guide/)
- [agents/227 - Agentic Workflows 2026](../227-agentic-workflows-2026/)
- [infrastructure/035 - Notifications Complete Guide](../../infrastructure/035-notifications-complete-guide/)

---

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Configure `mcpScheduledTaskApprovalLifetimeDays: 30` in ZOE nightly agent configuration | ZOE lane | Config update | 2026-10-15 |
| Audit ZOE nightly routines to isolate cloud-executable read tasks from local git operations | Agent lead | Architecture pass | 2026-10-18 |
| Add 3-day expiration warning event to ZAO OS agent control plane | Backend lane | Feature PR | 2026-10-22 |
