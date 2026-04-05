# 72 — Paperclip Functionality Deep Dive: How Agents Actually Work

> **Status:** Research complete
> **Date:** March 19, 2026
> **Goal:** Understand why CEO+Engineer work but Research Agent doesn't, document all Paperclip configuration, and fix the "Standing by" problem

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Why Research Agent fails** | It has NO tasks assigned. The Paperclip skill says "nothing assigned = exit." CEO works because it creates its own work. Engineer works because CEO assigns it work. Research Agent is an IC with no assignments. |
| **Fix #1** | ASSIGN tasks to the Research Agent — either CEO creates them or you create them via UI with the agent selected as assignee |
| **Fix #2** | SET `instructionsFilePath` to `agents/researcher/AGENTS.md` via API: `PATCH /api/agents/{id}` with `{"adapterConfig": {"instructionsFilePath": "agents/researcher/AGENTS.md"}}` |
| **Fix #3** | SET `promptTemplate` to tell the agent what to do on wake: `"You are the Research Agent for The ZAO. Check your Paperclip inbox for assigned tasks. Read agents/researcher/AGENTS.md for your identity."` |
| **Fix #4** | DISABLE timer heartbeat, enable `wakeOnAssignment` only — agent wakes when given work, sleeps otherwise |
| **Model for Research** | USE Sonnet (not Opus) — good reasoning, lower cost, won't burn rate limits |

---

## Root Cause: Why "Standing By" Happens

The Paperclip skill (injected into every agent) has this rule in Step 4:

> "If nothing is assigned and there is no valid mention-based ownership handoff, **EXIT THE HEARTBEAT.**"

Every heartbeat, the Research Agent:
1. Wakes up
2. Calls `GET /api/agents/me/inbox-lite`
3. Gets empty list (no tasks assigned)
4. No `PAPERCLIP_TASK_ID` set
5. Follows the rule: nothing assigned = exit
6. Says "Standing by" and exits

**CEO works** because it's the root agent — it creates its own strategic work.
**Engineer works** because the CEO assigns tasks to it.
**Research Agent has no one assigning it tasks.**

---

## How Paperclip Agents Actually Work (The Full Chain)

### 1. Wakeup Trigger Fires

4 types: `timer` (scheduled), `assignment` (task assigned), `on_demand` (manual), `automation` (system).

Priority: `on_demand` > `assignment` > `timer`/`automation`.

### 2. Context Injection

Paperclip creates an `AdapterInvokeInput` with:
- `companyId`, `agentId`, `runId`
- `cwd` (working directory)
- `prompt` (rendered from `promptTemplate`)
- `env` (all `PAPERCLIP_*` vars)
- `runtimeState` (session IDs for resume)

### 3. Claude Code Adapter Execution

For `claude_local`:
```bash
claude --print <prompt> --output-format json --add-dir <skills-temp-dir>
```

If resuming: adds `--resume <sessionId>`
If `dangerouslySkipPermissions`: adds that flag

### 4. The Agent Gets

- The **Paperclip skill** (via `--add-dir`) — tells it HOW to coordinate
- All **PAPERCLIP_* env vars** — identity, task, wake reason
- The **promptTemplate** rendered — tells it WHAT to do
- The **instructionsFilePath** content — tells it WHO it is
- **Session context** from prior runs (if resuming)

### 5. The 9-Step Heartbeat

```
1. Identity    → GET /api/agents/me
2. Approvals   → Check PAPERCLIP_APPROVAL_ID
3. Inbox       → GET /api/agents/me/inbox-lite
4. Pick work   → in_progress first, then todo. NOTHING = EXIT.
5. Checkout    → POST /api/issues/{id}/checkout (409 = stop)
6. Context     → GET /api/issues/{id}/heartbeat-context
7. Work        → Use domain tools (Read, Write, WebSearch, etc.)
8. Status      → PATCH status, comment results
9. Delegate    → Create subtasks if needed
```

---

## All Configuration Options (Claude Local Adapter)

| Field | Type | Required | ZAO Setting |
|-------|------|----------|-------------|
| `cwd` | string | **Yes** | `/Users/zaalpanthaki/Documents/ZAO-OS-V1` |
| `model` | string | No | `claude-sonnet-4-6` for Research, `claude-opus-4-6` for CEO |
| `promptTemplate` | string | No | See below |
| `instructionsFilePath` | string | No | `agents/researcher/AGENTS.md` |
| `env` | object | No | Additional env vars |
| `timeoutSec` | number | No | 300 (5 min default) |
| `maxTurnsPerRun` | number | No | 300 default |
| `dangerouslySkipPermissions` | boolean | No | `true` for Paperclip agents (they need to write files) |

### Recommended promptTemplate for Research Agent

```
You are {{agent.name}}, the Head of Research & Documentation for {{company.name}}.

Your instruction file is at agents/researcher/AGENTS.md — read it first.

On every heartbeat:
1. Call GET /api/agents/me/inbox-lite to check for assigned tasks
2. If you have tasks, checkout and execute them
3. If no tasks, check PAPERCLIP_TASK_ID env var
4. Follow the /zao-research skill workflow for all research
5. Update all 5 index files after creating any research doc
6. Comment your findings on the Paperclip issue when done
```

### Heartbeat Configuration for Research Agent

```json
{
  "heartbeat": {
    "enabled": false,
    "intervalSec": 0,
    "wakeOnAssignment": true,
    "wakeOnOnDemand": true,
    "wakeOnAutomation": false,
    "cooldownSec": 30
  }
}
```

This means: no scheduled heartbeats (saves rate limit). Wakes ONLY when you assign a task or manually trigger.

---

## How to Fix the Research Agent (Step by Step)

### Step 1: Set instructionsFilePath

In Paperclip dashboard → Research Agent → Configuration, or via API:

```bash
curl -X PATCH http://localhost:3100/api/agents/<research-agent-id> \
  -H "Content-Type: application/json" \
  -d '{"adapterConfig": {"instructionsFilePath": "agents/researcher/AGENTS.md"}}'
```

### Step 2: Set promptTemplate

```bash
curl -X PATCH http://localhost:3100/api/agents/<research-agent-id> \
  -H "Content-Type: application/json" \
  -d '{"adapterConfig": {"promptTemplate": "You are {{agent.name}} for {{company.name}}. Read agents/researcher/AGENTS.md for your identity. Check your Paperclip inbox for assigned research tasks and execute them using the /zao-research workflow."}}'
```

### Step 3: Disable Timer Heartbeat

In dashboard → Research Agent → Configuration → set heartbeat interval to 0 or disable scheduled heartbeats.

### Step 4: Set dangerouslySkipPermissions

The Research Agent needs to write files (research docs, index updates). Without this, it hits permission prompts and can't proceed:

```bash
curl -X PATCH http://localhost:3100/api/agents/<research-agent-id> \
  -H "Content-Type: application/json" \
  -d '{"adapterConfig": {"dangerouslySkipPermissions": true}}'
```

### Step 5: Create a Task and Assign It

```bash
pnpm paperclipai issue create \
  --company-id <company-id> \
  --title "Research Farcaster 2026 protocol updates" \
  --description "Create research/72-farcaster-2026-updates/README.md covering Snapchain, Neynar+Clanker acquisition, DAU. Follow /zao-research workflow. Update all indexes." \
  --status todo \
  --assignee-agent-id <research-agent-id>
```

### Step 6: Trigger Heartbeat

In dashboard → Research Agent → click "Wake" button, or:

```bash
pnpm paperclipai heartbeat run --agent-id <research-agent-id>
```

---

## Key Paperclip API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| My identity | GET | `/api/agents/me` |
| My inbox | GET | `/api/agents/me/inbox-lite` |
| Checkout task | POST | `/api/issues/:id/checkout` |
| Task context | GET | `/api/issues/:id/heartbeat-context` |
| Update task | PATCH | `/api/issues/:id` |
| Comment | POST | `/api/issues/:id/comments` |
| Create subtask | POST | `/api/companies/:id/issues` |
| Release stuck task | POST | `/api/issues/:id/release` |
| Update agent config | PATCH | `/api/agents/:id` |
| Set instructions | PATCH | `/api/agents/:id/instructions-path` |
| Dashboard | GET | `/api/companies/:id/dashboard` |
| Search issues | GET | `/api/companies/:id/issues?q=term` |
| Health check | GET | `/api/health` |

---

## CLI Quick Reference

```bash
# Issues
pnpm paperclipai issue list [--status todo,in_progress] [--assignee <id>]
pnpm paperclipai issue create --title "..." --description "..." --assignee-agent-id <id>
pnpm paperclipai issue get <id>
pnpm paperclipai issue release <id>          # Unstick agent

# Agents
pnpm paperclipai agent list
pnpm paperclipai agent get <id> --json       # Full config dump

# Heartbeats
pnpm paperclipai heartbeat run --agent-id <id>  # Manual trigger

# System
pnpm paperclipai doctor                      # Diagnostics
pnpm paperclipai configure                   # Settings
```

---

## Known Issues Affecting ZAO

| Issue | Impact | Workaround |
|-------|--------|------------|
| **#111 ToolSearch unavailable** | Daemon-spawned agents can't use deferred tools (WebSearch, WebFetch) | Pre-configure MCP servers in `.mcp.json` |
| **#469 Workspace unavailable** | Path interpolation fails (shows `[]` in path) | Use symlink without spaces |
| **#1241 Thundering herd** | Multiple agents wake simultaneously, cascade 429s | Stagger heartbeats, disable timers |
| **#1245 Stale execution locks** | Release endpoint doesn't clear `execution_run_id` | Use CLI `issue release` |
| **Permission prompts** | Agent hits Claude Code permission dialog and can't proceed | Set `dangerouslySkipPermissions: true` |

---

## Sources

- [Paperclip SKILL.md (raw)](https://raw.githubusercontent.com/paperclipai/paperclip/master/skills/paperclip/SKILL.md) — the core agent coordination skill
- [PARA Memory Skill](https://raw.githubusercontent.com/paperclipai/paperclip/master/skills/para-memory-files/SKILL.md)
- [CLI Reference](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/CLI.md)
- [Agent Runs Spec](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/spec/agent-runs.md)
- [Claude Local Adapter](https://raw.githubusercontent.com/paperclipai/paperclip/master/docs/adapters/claude-local.md)
- [What an Agent Does Every Heartbeat](https://paperclipai.info/blogs/explain_heartbeat/)
- [Quickstart Best Practices Gist](https://gist.github.com/Bennn1O/1a720a142a0ca3be089577fbdc94d899)
- [GitHub Issue #111](https://github.com/paperclipai/paperclip/issues/111) — ToolSearch unavailable
- [GitHub Issue #469](https://github.com/paperclipai/paperclip/issues/469) — Workspace unavailable
- [GitHub Issue #1241](https://github.com/paperclipai/paperclip/issues/1241) — Thundering herd
- [Doc 67 — Paperclip AI Agent Company](../../_archive/067-paperclip-ai-agent-company/)
- [Doc 71 — Paperclip Rate Limits](../../agents/071-paperclip-rate-limits-multi-agent/)
