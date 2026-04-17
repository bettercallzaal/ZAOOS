# 415 — Composio Agent Orchestrator (AO)

> **Status:** Research complete
> **Date:** 2026-04-16
> **Goal:** Evaluate ComposioHQ/agent-orchestrator — fleet manager for parallel AI coding agents — for ZAO OS workflow.
> **Source:** https://github.com/ComposioHQ/agent-orchestrator, inbox forward from Zaal

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Adopt AO for ZAO OS?** | PILOT on 1 project. Plugin architecture + tmux runtime + GitHub tracker fits existing `/worksession` flow. Try it before replacing manual parallel Claude Code. |
| **Replace `/worksession`?** | NO yet. Keep `/worksession` (doc 412) as default. AO is heavier — adopt only when 3+ simultaneous PRs become routine. |
| **Notifier integration** | USE built-in OpenClaw notifier — ZAO already runs OpenClaw VPS. Wire AO events into the existing agent squad (see `project_openclaw_status.md`). |
| **CI auto-fix** | ENABLE `reactions.ci-failed: auto: true` once we have green baseline. Biome + typecheck failures are exactly the "reroute logs to agent" loop AO automates. |
| **Auto-merge** | KEEP `approved-and-green: auto: false`. Zaal merges himself (see `feedback_always_pr.md`). |

---

## What It Is

Node.js CLI + web dashboard (`localhost:3000`) that spawns parallel AI coding agents, each in its own git worktree + branch + PR. When CI fails or reviewers comment, feedback routes back to the agent automatically.

**Tagline:** "Running one agent is easy. Running 30 across different issues is a coordination problem."

| Metric | Value |
|--------|-------|
| **Stars** | 6,300 |
| **Forks** | 850 |
| **License** | MIT |
| **Current version** | 0.2.5 |
| **Test cases** | 3,288 |
| **Open PRs** | 345 |
| **Open issues** | 276 |
| **npm package** | `@aoagents/ao` |
| **Install** | `npm install -g @aoagents/ao` |
| **Prerequisites** | Node.js 20+, Git 2.25+, tmux, gh CLI |

---

## Architecture — 7 Plugin Slots

| Slot | Default | Alternatives |
|------|---------|--------------|
| Runtime | tmux | process |
| Agent | claude-code | codex, aider, cursor, opencode |
| Workspace | worktree | clone |
| Tracker | github | linear, gitlab |
| SCM | github | gitlab |
| Notifier | desktop | slack, discord, composio, webhook, **openclaw** |
| Terminal | iterm2 | web |

Each plugin = one TypeScript interface implementation. Interfaces in `packages/core/src/types.ts`. Lifecycle stays in core.

---

## How It Works

1. `ao start <repo>` — clones repo, launches dashboard + orchestrator agent
2. Orchestrator spawns workers — each GitHub/Linear issue gets its own agent in isolated git worktree
3. Agents work autonomously — read code, write tests, open PRs
4. Reactions route feedback — CI failures + review comments sent back to the spawning agent
5. Human reviews + merges — escalation only on judgment calls

---

## Config (`agent-orchestrator.yaml`)

```yaml
port: 3000
defaults:
  runtime: tmux
  agent: claude-code
  workspace: worktree
  notifiers: [desktop]

projects:
  zao-os:
    repo: bettercallzaal/zao-os
    path: ~/Documents/ZAO OS V1
    defaultBranch: main
    sessionPrefix: zao

reactions:
  ci-failed:
    auto: true
    action: send-to-agent
    retries: 2
  changes-requested:
    auto: true
    action: send-to-agent
    escalateAfter: 30m
  approved-and-green:
    auto: false   # Zaal merges himself
    action: notify

power:
  preventIdleSleep: true  # keep Mac awake for remote access via Tailscale
```

---

## Comparison — Parallel Agent Orchestration

| Tool | Scope | Model | Isolation | Cost | Best For |
|------|-------|-------|-----------|------|----------|
| **Composio AO** | Fleet (30+) | Local + dashboard | Git worktrees + tmux | Free, OSS MIT | Running many agents across many repos |
| **Conductor.build** | Fleet (3-10) | Mac app | Git worktrees | Closed, $? | Polished GUI, YC S24 |
| **Replicas** (doc 412) | Cloud delegation | Cloud VMs | Isolated VMs | SaaS, $? | Background task offload |
| **`/worksession`** (ZAO) | Single session | Manual terminal | Git worktrees | Free | Current flow, 1-3 parallel |
| **Claude Code subagents** | Sub-task | In-process | Fresh context window | Token cost | Research + verification |

---

## ZAO OS Integration

### Repos AO could manage
- `bettercallzaal` (static + Farcaster Mini App) — **PILOT TARGET**, smallest blast radius
- `coc-concertz` (Next.js 16 + Firebase) — second if pilot green
- `zao-os` (this repo, 301 API routes, 279 components) — last, after trust established
- ~~`fishbowlz`~~ — DEPRECATED 2026-04-16, partnering with Juke (nickysap) Farcaster audio client instead

### Plug into existing infra
- **OpenClaw notifier** — AO has a built-in OpenClaw notifier. ZAO already runs OpenClaw VPS at `31.97.148.88` (`project_openclaw_setup.md`). Wire AO events → agent squad dashboard (`project_agent_squad_dashboard.md`).
- **GitHub tracker** — issues filed at `bettercallzaal/zao-os` become AO tasks.
- **tmux runtime** — fits Zaal's terminal-native workflow.
- **Remote access** — AO's `caffeinate` keeps Mac awake. Already on Tailscale. Access dashboard from phone during lunch stream / prime building window (`user_zaal_schedule.md`).

### Files touched on adoption
- New: `agent-orchestrator.yaml` (root)
- Update: `CLAUDE.md` — add AO alongside `/worksession`
- Update: `.claude/rules/` — CI failure reaction rules

### When NOT to use AO
- Single-session feature work → `/worksession` is lighter
- Solo design / brainstorm → Claude Code direct
- Security-sensitive agent trading changes (`src/lib/agents/`) → manual only per `CLAUDE.md` boundaries

---

## Pilot Plan

1. Install: `npm install -g @aoagents/ao`
2. Point at **bettercallzaal** first (smallest surface — static site + Mini App)
3. Config: tmux + claude-code + worktree + github + desktop notifier
4. Test on 2-3 trivial GitHub issues (lint fixes, typo PRs)
5. Validate CI auto-fix loop works against bettercallzaal's CI
6. If green after 1 week → roll to zao-os
7. If OpenClaw notifier stable → wire into agent squad dashboard

---

## Sources

- [ComposioHQ/agent-orchestrator README](https://github.com/ComposioHQ/agent-orchestrator)
- [Demo tweet — @agent_wrapper](https://x.com/agent_wrapper/status/2026329204405723180)
- [Self-improving system article](https://x.com/agent_wrapper/status/2025986105485733945)
- [npm @aoagents/ao](https://www.npmjs.com/package/@aoagents/ao)
- [Discord](https://discord.gg/UZv7JjxbwG)
- Related: [Doc 412 — Conductor / Replicas / AO Agents roundup](../412-ai-dev-tools-roundup-conductor-replicas-aoagents/)
