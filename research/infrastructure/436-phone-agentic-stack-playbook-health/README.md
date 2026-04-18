# 436 - Phone Agentic Stack Playbook + Health Check

> **Status:** Live inventory + health verified
> **Date:** 2026-04-18
> **Goal:** Single reference for every ZAO surface Zaal can hit from a phone today, what each does, how to capture input to agents, and what's missing. Live health check snapshot. Ship-next ranking.

---

## Key Decisions / Recommendations

Top 5 ship-next to make the stack even more phone-useful:

| # | Gap | Proposed surface | Effort | Why |
|---|-----|------------------|--------|-----|
| 1 | No "what's running right now" unified view | `portal.zaoos.com/now` — live feed of AO sessions + Paperclip tasks + recent Telegram commands + cron fires | 90 min | Currently scattered across 5 dashboards. Pulls from AO REST, crontab last-run log, todos delta. |
| 2 | No cross-agent memory view | `portal.zaoos.com/memory` — tail of `~/openclaw-workspace/memory/*.md` + ZOE conversation log last 24h + auto-memory files in `~/.claude/projects/` | 60 min | See what ZOE knows + remembers about each project. Makes memory debuggable. |
| 3 | Can't start a Paperclip task from phone | Portal tile -> POST to Paperclip API /tasks (it already runs on `localhost:3100`) | 45 min | Quick-spawn covers AO, not Paperclip. Paperclip is good at long-lived tasks (CEO/Researcher/Engineer). |
| 4 | No inline keyboards on Telegram nudges | Add inline buttons "done / snooze / spawn" on morning brief + evening reflect | 60 min | One-tap action without switching to portal. |
| 5 | No voice todo yet | Handle `msg.voice` in `bot.mjs` -> download -> Claude audio input -> treat as `/todo` | 90 min | Walking-around capture. iPhone Telegram has native voice message mic. |

---

## Stack Health (2026-04-18, live)

| Surface | Status | Evidence |
|---------|--------|----------|
| portal.zaoos.com | **200** | curl with cookie |
| ao.zaoos.com | **200** | live |
| claude.zaoos.com | **200** | live |
| paperclip.zaoos.com | **200** | live |
| agents.zaoos.com (OpenClaw) | **200** | live |
| zoe.zaoos.com | **200** | live |
| pixels.zaoos.com | **502** | pre-existing unrelated issue |
| portal-state/todos.json | **35 todos, 31 open** | 3 just marked done (rotate, mark-tests, zao-portal-infra) |
| test-checklist state | **1/5 done** | PWA install marked |
| Telegram bot | **live, new code** | grep -c recap|summarize|focus = 17 |
| Ports listening | **all 11 up** | 3001-3005, 7681-7682, 18789, 5070, 5072, 3100 |
| tmux sessions | **8 alive** | ao, auth-server, caddy, claude-zaoos, cloudflared, spawn-server, ttyd, zaoos-orchestrator-4 |
| Crons installed | **4/4** | watchdog (1m), test-nudge (4x/day), morning-brief (5am ET), evening-reflect (9pm ET) |

---

## Complete Phone Surface Inventory

### Landing + brain dump

| URL | Purpose | Capture pattern |
|-----|---------|-----------------|
| `portal.zaoos.com/` | Landing: 8 tiles, Quick Spawn, session history, 5 templates | Quick Spawn form -> agent runs on VPS |
| `portal.zaoos.com/todos` | Full todo board: filters (status/priority/tag/project/search), bulk add, 10 tag-suggestion pills, single + bulk add, spawn-from-todo button | Type todo -> Add OR paste lines -> Bulk add |
| `portal.zaoos.com/test-checklist` | 5-test checklist progress, tap to mark done/undo | Tap link in Telegram nudge OR mark in UI |

### Agent dashboards (iframe-wrapped with universal nav dock)

| URL | Purpose | Capture pattern |
|-----|---------|-----------------|
| `ao.zaoos.com/` | Composio AO dashboard. Parallel Claude Code sessions each in git worktree + branch + PR. WORKING/REVIEW/MERGE columns | "Open Orchestrator" -> type spawn prompt -> session appears under WORKING |
| `claude.zaoos.com/` | Live Claude Code TUI via ttyd. tmux-persisted session `claude-zaoos` on `~/code/ZAOOS`. Reload any time, same state | Tap terminal -> iOS keyboard -> type prompt. Two-finger scroll to read history |
| `paperclip.zaoos.com/` | Paperclip task board. Long-lived agents (CEO, Researcher, Engineer, QA, CommunityManager). No auth | Paperclip web UI -> assign issue to agent |
| `zoe.zaoos.com/` | ZOE chat dashboard, pixel office. No auth | Browser-only view, no capture yet |
| `agents.zaoos.com/` | OpenClaw gateway. 7-agent squad (ZOE/ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER) | View-only; dispatch via Telegram DM to ZOE |
| `zaoos.com/admin/agents` | ZAO OS Agent Squad Monitor. Supabase event stream. Session-auth | Live feed of what agents did in ZAO OS |

### Telegram (native iPhone app, always on)

| Command | Effect | Latency |
|---------|--------|---------|
| `/todo <text> [P0-P3] [+Project] [#tags]` | Add todo directly to portal-state | Instant (no LLM) |
| `/done <id-prefix or text-match>` | Mark done | Instant |
| `/list` | Top 12 open by priority | Instant |
| `/p1` | Only P0 + P1 open | Instant |
| `/p0` | Only P0 open | Instant |
| `/note <id> <text>` | Append note to todo | Instant |
| `/recap [N]` | Last N days (default 14) commits + PRs + research + todo delta | 3-8 sec (reads git + gh) |
| `/summarize <project>` | Project status: todos + commits + PRs | 3-8 sec |
| `/focus <mins>` | Mute test-checklist nudge for N min, max 480 | Instant |
| `/help` | Command cheat sheet | Instant |
| any freeform text | Routes to Claude (ZOE persona via openclaw-workspace/SOUL.md) | 5-30 sec |

### Proactive nudges (Telegram, scheduled)

| Time (ET) | Cron (UTC) | What |
|-----------|------------|------|
| 5am daily | `0 9 * * *` | Morning brief: P0/P1 todos + last-24h commits + open PRs |
| 9pm daily | `0 1 * * *` | Evening reflect: done-today + top 3 for tomorrow |
| 9am/1pm/5pm/9pm | `0 13,17,21,1 * * *` | Test-checklist nudge (next pending test). De-duped 3h, skips during /focus |

### SSH + Claude Code

| How | What |
|-----|------|
| `ssh zaal@31.97.148.88` | Root shell on VPS 1 |
| `tmux attach -t claude-zaoos` | Attach to the same Claude session claude.zaoos.com renders |
| `tmux attach -t ao` | Watch Composio AO orchestrator logs |
| `~/bin/morning-brief.sh` | Fire brief manually |
| `~/bin/watchdog.sh` | Force-respawn any dead tmux session |

---

## Capture patterns - when to use what

| Input type | Fastest route | Why |
|-----------|---------------|-----|
| Walking thought, under 5 sec | Telegram `/todo ...` | Native iPhone, zero context switch |
| Long list to brain-dump | `portal.zaoos.com/todos` Bulk add | One todo per line, instant multi-insert |
| Bug you hit mid-work | `/todo <repro> #bug` in Telegram | Searchable later by tag |
| Kick off an agent now | `portal.zaoos.com` Quick Spawn | Form -> AO spawns -> WORKING card in 10 sec |
| Resume a stopped agent | `ao.zaoos.com` -> tap session | Live terminal streams via node-pty |
| Write code from phone (short) | `claude.zaoos.com` | tmux-persisted, scrolling works |
| Write code from phone (long) | Don't. Use laptop. | iOS keyboard too small for multi-file edits |
| Question for ZOE | Telegram freeform message | Routes to Claude via openclaw |
| Status of a project | Telegram `/summarize ZAOOS` | 3-sec reply |
| "What did we do" review | Telegram `/recap 14` | Commits + PRs + research + todo delta |
| Deep work session | Telegram `/focus 90` | Mutes test-checklist nudges |
| Artist/vendor outbound call | Doc 433 ring-a-ding (future) | Separate persona from ZOE |

---

## Example workflows

### Workflow 1: Brain-dump on a walk

1. Open Telegram @zaoclaw_bot
2. Voice tap (or text): `/todo call Steve Peer re ZAO Stock booth price P1 +ZAOstock #call`
3. Keep walking. Done.
4. Later: `/p1` shows it in the queue. Tap the link when you act on it.

### Workflow 2: Start an autonomous agent before bed

1. Home-screen PWA -> portal.zaoos.com
2. Quick Spawn: "fix any lint or typecheck errors in the current branch and push the fix"
3. Tap Spawn -> AO starts session in `~/code/ZAOOS/.worktree/claude-lint-X`
4. Close phone.
5. Morning brief at 5am ET shows the new merged PR.

### Workflow 3: Review what shipped this week

Telegram: `/recap 7`

Returns:
```
Recap - last 7 days (since 2026-04-11)

COMMITS on main: 42
MERGED PRS: 19
NEW RESEARCH DOCS: 11
TODOS: +37 added, 8 completed
```

### Workflow 4: Kick a todo into an agent

1. Portal -> `/todos` -> tap "spawn" on "bump all minor dependencies and open a PR"
2. Lands on portal home with Quick Spawn prefilled
3. Tap Spawn -> AO picks it up

### Workflow 5: Deep work block

1. Sit down to code. Phone near.
2. Telegram `/focus 120`
3. Ignore phone 2 hours. No pings.
4. Come up for air. `/focus 0` to resume nudges.

---

## Gaps worth building next (matches Key Decisions at top)

### Gap 1: `/now` live activity view

Nothing today tells Zaal at a glance "what is running right now." Proposal:

- New page at `portal.zaoos.com/now`
- Reads AO REST (`localhost:3001/api/sessions`) for live sessions + status + branch
- Reads tmux sessions (`ssh shell out`) for running scripts
- Reads crontab `last run` via a tiny sidecar logger
- Auto-refresh every 10 sec via SSE or polling

### Gap 2: `/memory` cross-agent memory tail

Today ZOE has `~/openclaw-workspace/memory/*.md`, Claude Code has `~/.claude/projects/.../memory/MEMORY.md`, Claudesidian-workbench-style CLAUDE.md nesting is partially done in packages/. No single view.

Proposal: `portal.zaoos.com/memory` shows:
- Last 5 `openclaw-workspace/memory/*.md` files sorted by mtime
- Last 10 recent auto-memory additions (saves from Claude chat)
- ZOE conversation log last 24h (key phrases only, anonymized if needed)

### Gap 3: Paperclip quick-assign from portal

Paperclip already runs on the VPS at `localhost:3100`. Has CEO/Researcher/Engineer agents. Not reachable from phone except by loading the Paperclip UI itself (not mobile-friendly).

Proposal: portal quick-assign form -> POST to Paperclip API `/tasks` with title + agent assignment.

### Gap 4: Inline Telegram buttons on nudges

Morning brief + evening reflect currently text-only. Add inline keyboard:
- Morning brief: `[show full list]` `[focus 60]` `[focus 120]`
- Evening reflect: `[add tomorrow intent]` `[wrap for the day]`
- Test nudge: `[done]` `[snooze 3h]` `[open portal]`

### Gap 5: Voice message -> todo

iPhone Telegram has native voice message recording (tap + hold mic). `bot.mjs` can detect `msg.voice`, download via `getFile` + file_path, transcribe via Claude audio input (docs.anthropic.com cost: ~$0.01/min). If transcription starts with a slash command keyword, run the command. Else treat as `/todo` body.

---

## Comparison - Phone Capture Tools

| Tool | Latency | Searchable | Filterable | Spawn agent? | Current ZAO pick |
|------|---------|------------|------------|--------------|-------------------|
| **Telegram /todo** | Instant | Yes | By tag/priority/project | No (use portal spawn link) | **Primary walk-around** |
| **portal.zaoos.com/todos** | 1-2 sec | Yes | Full filter chips | Yes (spawn button) | **Primary sit-down** |
| **portal.zaoos.com/** Quick Spawn | 10 sec to launch | N/A | N/A | Yes directly | **Primary agent kickoff** |
| **claude.zaoos.com** | 1-2 sec keystrokes | tmux scrollback | N/A | Freeform | **Primary live-code-review** |
| **ao.zaoos.com** | 2-5 sec per tap | Session list | Per-status column | Yes | **Primary agent-watching** |
| Apple Reminders | 1 sec add | iCloud search | Limited | No | Skip |
| Notion mobile | 4-6 sec lag | Yes | Yes | No | Skip |
| Paper notebook | 2 sec | No | No | No | Skip |

---

## ZAO Ecosystem Integration

### Files / surfaces touched

- `infra/portal/caddy/portal/index.html` - landing with spawn form + history
- `infra/portal/caddy/portal/todos.html` - todo UI
- `infra/portal/caddy/claude/index.html` - iframe wrapper for ttyd
- `infra/portal/caddy/ao/index.html` - iframe wrapper for AO
- `infra/portal/bin/bot.mjs` - Telegram handler with slash commands
- `infra/portal/bin/spawn-server.js` - `/api/spawn` + `/api/todos` CRUD + test-checklist
- `infra/portal/bin/auth-server.js` - cookie login
- `infra/portal/bin/morning-brief.sh` - 5am ET cron
- `infra/portal/bin/evening-reflect.sh` - 9pm ET cron
- `infra/portal/bin/test-checklist-ping.sh` - 4x/day nudge + /focus aware
- `infra/portal/bin/watchdog.sh` - keeps everything alive
- `~/openclaw-workspace/` - ZOE SOUL/AGENTS/MEMORY/TASKS + 7-agent workspace

### Cross-doc alignment

- [doc 428 - unified agent portal origin](../428-unified-agent-portal-ao-phone-access/)
- [doc 430 - portal improvements plan](../430-portal-stack-improvements-plan/)
- [doc 431 - portal v2 universal nav](../431-portal-universal-nav-v2-improvements/)
- [doc 433 - portal v3 todos brain-dump](../433-portal-todos-brain-dump-universal-nav/)
- [doc 434 - personal todos + ZOE slash commands](../434-portal-personal-todos-zoe-telegram-commands/)
- [doc 435 - ZOE effectiveness v2 playbook](../../agents/435-zoe-effectiveness-v2-playbook/)
- [doc 245 - ZOE upgrade autonomous workflow](../../agents/245-zoe-upgrade-autonomous-workflow-2026/)
- [doc 305 - pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/)
- [doc 422 - Claude Routines automation](../../dev-workflows/422-claude-routines-zao-automation-stack/)

---

## Sources

- [Companion - doc 428 portal origin](../428-unified-agent-portal-ao-phone-access/README.md)
- [Companion - doc 435 ZOE effectiveness v2](../../agents/435-zoe-effectiveness-v2-playbook/README.md)
- [Companion - doc 434 Telegram slash commands](../434-portal-personal-todos-zoe-telegram-commands/README.md)
- [Companion - doc 433 portal todos brain-dump](../433-portal-todos-brain-dump-universal-nav/README.md)
- [Composio AO docs](https://github.com/ComposioHQ/agent-orchestrator)
- [Telegram Bot API inline keyboards](https://core.telegram.org/bots/api#inlinekeyboardmarkup)
- [Telegram Bot API voice messages](https://core.telegram.org/bots/api#voice)
- [Anthropic audio input](https://docs.anthropic.com/en/docs/build-with-claude/vision)
