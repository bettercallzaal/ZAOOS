# 491 — Install QuadWork for the 3-Repo Split (zao-research / zao-chat / zao-brain)

> **Status:** Plan ready, install requires Zaal at keyboard
> **Date:** 2026-04-23
> **Goal:** Stand up QuadWork v1.12.0 (project7) as the 4-agent dev team that runs against `zao-chat` and `zao-brain` overnight while the 3-repo extraction proceeds. Cast confirmed via [farcaster.xyz/project7/0xab94a7ad](https://farcaster.xyz/project7/0xab94a7ad).

This doc is the **install + 3-repo wiring** companion to doc 487 (QuadWork general evaluation). Read 487 first if you haven't.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Install QuadWork now? | USE — v1.12.0 (published 2 days ago), MIT, 4 deps only (express, multer, node-pty, ws), 3.0 MB unpacked. Maintainer = project7 (Hunt Town builder). |
| Run on which repos? | USE on **`zao-chat`** and **`zao-brain`** after they exist. SKIP on `zao-research` (mostly markdown writes, no PR review value). SKIP on current `zao-os` (too many sensitive paths). |
| Use during the migration itself? | SKIP. Repo extraction is git surgery (`git filter-repo`), not code generation. QuadWork is for ongoing dev after the split. |
| Agent role assignment? | USE cross-frontier per doc 479 (Walden's clean-context reviewer pattern): **Head = Codex, Dev = Claude Code, Reviewer1 = Codex, Reviewer2 = Claude Code**. Mixed providers catch more bugs. |
| Branch protection? | USE on `main` of both new repos before any QuadWork run. 2-of-2 reviewer approval required. |
| Disk budget | 77 MB AgentChattr clone × 2 projects = **154 MB**. Plus 4 git worktrees × 2 projects. Acceptable on Zaal's laptop. |
| Allowlist scope | USE per-repo `.quadwork-allowlist` to whitelist paths agents can touch. Keep `community.config.ts`, `.env*`, `contracts/`, auth, secrets out of scope from day 1. |
| First batch type? | USE **docs + tests only** for batch 1 of each repo. Earn trust before letting it touch product code. |

## Comparison of Options (vs doc 487)

| Question | Doc 487 framing | This doc's update |
|---|---|---|
| When to install | "Use for overnight batches" | Install **now**, point at new repos as they land |
| Which repos | "ZAO OS docs backlog, test coverage, per-brand bots" | **`zao-chat` + `zao-brain`** specifically (the 3-repo split context) |
| Agent assignment | Codex+Claude generic | Locked: Head=Codex, Dev=Claude, RE1=Codex, RE2=Claude — same as project7's recommended default |
| Risk surface | Generic | Allowlist `community.config.ts` and contracts OUT from day 1 |

## Install Commands (Zaal runs these — interactive)

Prereqs already verified on this machine: Node v23.3.0, npx, Homebrew at `/opt/homebrew`, `gh` logged in as `bettercallzaal`.

In a terminal Zaal owns (so the wizard can prompt for sudo / GitHub auth / API key choices):

```bash
# 1. One-time install
npx quadwork init

# 2. After install, dashboard opens at http://127.0.0.1:8400
#    → click "Setup" to add the first project

# 3. To add a project later:
#    open http://127.0.0.1:8400/setup

# 4. Daily start
npx quadwork start

# 5. Stop everything
npx quadwork stop
```

The wizard installs Python, GitHub CLI (already present), AI tools, and runs auth. Existing `gh` auth carries over.

**Don't run `npx quadwork init` from Claude Code in this session** — it's interactive. Zaal starts it; this session pre-stages everything else.

## Per-Project Config Template

After `init` is done, drop this in `~/.quadwork/config.json` for each repo:

```json
{
  "port": 8400,
  "operator_name": "zaal",
  "projects": [
    {
      "id": "zao-chat",
      "name": "ZAO Chat",
      "repo": "thezao/zao-chat",
      "working_dir": "/Users/zaalpanthaki/Documents/zao-chat",
      "agentchattr_url": "http://127.0.0.1:8300",
      "mcp_http_port": 8200,
      "mcp_sse_port": 8201,
      "auto_continue_loop_guard": false,
      "auto_continue_delay_sec": 30,
      "auto_restore_after_restart": false,
      "agents": {
        "head": { "cwd": "/Users/zaalpanthaki/Documents/zao-chat-head", "command": "codex" },
        "dev":  { "cwd": "/Users/zaalpanthaki/Documents/zao-chat-dev",  "command": "claude" },
        "re1":  { "cwd": "/Users/zaalpanthaki/Documents/zao-chat-re1",  "command": "codex" },
        "re2":  { "cwd": "/Users/zaalpanthaki/Documents/zao-chat-re2",  "command": "claude" }
      }
    },
    {
      "id": "zao-brain",
      "name": "ZAO Brain",
      "repo": "thezao/zao-brain",
      "working_dir": "/Users/zaalpanthaki/Documents/zao-brain",
      "agentchattr_url": "http://127.0.0.1:8310",
      "mcp_http_port": 8210,
      "mcp_sse_port": 8211,
      "auto_continue_loop_guard": false,
      "auto_continue_delay_sec": 30,
      "auto_restore_after_restart": false,
      "agents": {
        "head": { "cwd": "/Users/zaalpanthaki/Documents/zao-brain-head", "command": "codex" },
        "dev":  { "cwd": "/Users/zaalpanthaki/Documents/zao-brain-dev",  "command": "claude" },
        "re1":  { "cwd": "/Users/zaalpanthaki/Documents/zao-brain-re1",  "command": "codex" },
        "re2":  { "cwd": "/Users/zaalpanthaki/Documents/zao-brain-re2",  "command": "claude" }
      }
    }
  ]
}
```

Repo names assume answers to the 3-repo plan questions. Adjust IDs/paths if names change.

## `.quadwork-allowlist` (NEW convention, per-repo)

QuadWork doesn't ship a built-in allowlist. We add one as a docs-level guard the agent prompts must read on every batch.

`zao-chat/.quadwork-allowlist`:
```
# Touchable paths
src/app/feed/**
src/app/channels/**
src/app/messages/**
src/app/profiles/**
src/app/members/**
src/app/notifications/**
src/components/feed/**
src/components/chat/**
src/components/xmtp/**
src/components/members/**
src/components/channels/**
src/lib/farcaster/**
src/lib/xmtp/**
src/lib/stream/**
src/lib/members/**
docs/**

# OFF LIMITS
# .env*
# community.config.ts
# src/lib/auth/**
# src/lib/agents/**
# contracts/**
# scripts/**
```

`zao-brain/.quadwork-allowlist`: similar, scoped to its own surface.

Add to each repo's `CLAUDE.md`:

> Before any Edit/Write, agents MUST read `.quadwork-allowlist`. Never touch paths outside it. If the task requires a path outside the allowlist, halt and ask the operator.

## How This Plugs Into the 3-Repo Plan

```
Day 0 (today):       Zaal runs `npx quadwork init` once, dashboard opens, baseline working
Day 1:               Zaal answers the 7 split questions in the prior message
Day 2:               Cut zao-research via git filter-repo (no QuadWork — pure surgery)
Day 3:               Cut zao-chat via git filter-repo
Day 3:               Add zao-chat as project to QuadWork, queue first overnight batch (docs only)
Day 4:               Scaffold zao-brain (uses CyrilXBT JARVIS layout from doc 478 + Matricula loop from doc 484)
Day 4:               Add zao-brain to QuadWork, queue first overnight batch (test coverage)
Day 5+:              QuadWork runs both projects nightly. Zaal merges manually for first 2 weeks, then enables auto-merge.
```

## Specific Numbers

- **v1.12.0** — current QuadWork version (npm `quadwork`).
- **53** versions published (active maintainership).
- **2 days ago** — last publish.
- **3.0 MB** unpacked size.
- **4 dependencies**: express ^5.2.1, multer ^2.1.1, node-pty ^1.2.0-beta.12, ws ^8.20.0.
- **77 MB × 2 projects = 154 MB** AgentChattr clone disk.
- **4 git worktrees × 2 projects = 8 worktrees** to track.
- **Port 8400** dashboard, **8200/8201** MCP HTTP/SSE for chat, **8210/8211** for brain (avoid collisions).
- **15-minute** scheduled trigger cadence.
- **2-of-2** reviewer approval gate.
- **MIT** license.
- **Node 22+** required (we have 23.3.0).

## Risks & Guardrails

- **Secrets** — `.env*` and any file matching `.claude/rules/secret-hygiene.md` patterns must NEVER appear in QuadWork worktrees. Verify with a pre-merge grep in CI.
- **Branch protection bypass** — confirm `main` requires 2 reviews + linear history before any QuadWork run.
- **Cost** — Codex + Claude × 4 agents × 15-min ticks can burn API credit fast. Cap with a per-repo daily budget (Matricula doc 484 energy-manager pattern: $0.50/day per agent = $2/day per project = $4/day for both projects).
- **Reviewer collusion** — same model in all 4 slots = no real second opinion. Lock to cross-frontier (Codex + Claude alternating).
- **Auto-merge regret** — keep `auto_continue_loop_guard: false` for the first 2 weeks. Manual merge until trust is earned.

## What to Skip

- SKIP running QuadWork against the current `zao-os` repo. Too many sensitive surfaces (auth, agents, contracts, payments).
- SKIP enabling Discord bridge in v1. Telegram bridge to Zaal's existing ZOE flow is enough.
- SKIP `--legacy` cleanup until per-project clones are confirmed working.
- SKIP forwarding port 8400 outside `127.0.0.1`. Local only.

## Concrete Integration Points

- `~/.quadwork/config.json` — global QuadWork config (out-of-repo).
- `~/.quadwork/{project_id}/` — per-project AgentChattr + queue.
- New: `zao-chat/.quadwork-allowlist`, `zao-brain/.quadwork-allowlist`.
- New: `zao-chat/CLAUDE.md`, `zao-brain/CLAUDE.md` — both reference the allowlist convention.
- Existing: `.claude/rules/secret-hygiene.md` (this repo) — copy into both new repos before any QuadWork batch.
- Existing: `~/.claude/skills/jarvis/` (per doc 478) — installed alongside QuadWork so daily ritual is a single tool surface.

## Sources

- [project7 launch cast on Farcaster](https://farcaster.xyz/project7/0xab94a7ad)
- [github.com/realproject7/quadwork](https://github.com/realproject7/quadwork)
- [QuadWork demo (YouTube)](https://www.youtube.com/watch?v=Q0814uXjYoQ)
- [quadwork.xyz](https://quadwork.xyz/)
- [npm quadwork](https://www.npmjs.com/package/quadwork)
- [Hunt Town Discord (questions)](https://discord.gg/syhbYPk3Wq)
- [AgentChattr (bcurts)](https://github.com/bcurts/agentchattr) — the chat server QuadWork depends on
- Doc 487 — general QuadWork eval
- Doc 479 — Walden's clean-context reviewer pattern (the "why" behind cross-frontier RE1/RE2)
- Doc 478 — JARVIS pattern (companion daily ritual)
- Doc 484 — Matricula energy-manager (cost cap pattern)
