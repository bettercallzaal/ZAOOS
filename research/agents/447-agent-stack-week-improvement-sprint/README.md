# 447 - Agent Stack 7-Day Improvement Sprint

> **Status:** Plan (no implementation)
> **Date:** 2026-04-20
> **Goal:** Synthesize docs 435 (ZOE effectiveness), 436 (phone agentic stack health), and 440 (Claude Code process level-up) into the top 5 concrete agent improvements to ship in the next 7 days (2026-04-20 through 2026-04-27). Each item has specific code change locations, effort/value scores, and dependencies.

---

## Key Decisions / Recommendations

Ship these 5 improvements in order. Total estimated effort: ~6 hours of focused work across 7 days.

| # | Improvement | Effort (1-5) | Value (1-5) | Source Doc |
|---|-------------|:---:|:---:|---|
| 1 | ZOE context awareness — auto-inject git/AO/PR state into system prompt | 3 | 5 | 435 #6, 440 #5 |
| 2 | Per-project memory files for ZOE | 2 | 5 | 435 #7 |
| 3 | Claude Code SessionStart hook — auto-worksession | 1 | 4 | 440 #2 |
| 4 | Voice message -> todo transcription | 3 | 5 | 435 #9, 436 gap 5 |
| 5 | `/now` live activity dashboard | 3 | 4 | 436 gap 1 |

---

## Improvement 1: ZOE Context Awareness

**What:** Auto-read `git HEAD`, AO active sessions, and open PRs into ZOE's system prompt on every message. ZOE becomes situationally aware instead of replying generically.

**Why ship this week:** Every ZOE reply currently lacks project context. This is the single highest-leverage change — ZOE goes from "generic assistant" to "aware co-pilot" with one shell-out per reply.

**Effort:** 3/5 (90 min)
**Value:** 5/5

**Code changes:**

| File (VPS path) | Change |
|---|---|
| `~/zoe-bot/bot.mjs` | Add `buildContext()` function that shells out to gather state |
| `~/zoe-bot/bot.mjs` | Inject context output into the system prompt passed to Claude |
| `~/zoe-bot/context-cache.sh` | NEW — gathers git log, `gh pr list`, `tmux ls`, AO session status. Writes to `/tmp/zoe-context.md` with 5-min TTL |

**Context gathered (cached 5 min):**
- `git log --since='24 hours ago' --oneline` on `~/code/ZAOOS`
- `gh pr list --state open --limit 5`
- `tmux ls | head` (which AO sessions running)
- `tail -20 ~/openclaw-workspace/TASKS.md`

**Dependencies:** None. Ships standalone.

**Verification:** Send ZOE a message like "what am I working on?" — reply should reference actual open PRs and recent commits.

---

## Improvement 2: Per-Project Memory Files

**What:** Create per-project memory files (`zao-os.md`, `zaostock.md`, `wavewarz.md`, `coc.md`, `bcz.md`, `personal.md`, `global.md`) in `~/openclaw-workspace/memory/`. Auto-select by keyword match in user message. `global.md` always loaded, max 1 project file injected per reply.

**Why ship this week:** Solves "ZOE replies generically" across projects. Combined with Improvement 1 (context awareness), ZOE gains both real-time situational awareness AND persistent project knowledge.

**Effort:** 2/5 (60 min)
**Value:** 5/5

**Code changes:**

| File (VPS path) | Change |
|---|---|
| `~/openclaw-workspace/memory/global.md` | NEW — always-loaded facts (Zaal's role, ZAO basics, agent squad names) |
| `~/openclaw-workspace/memory/zao-os.md` | NEW — ZAO OS project context (stack, key decisions, current priorities) |
| `~/openclaw-workspace/memory/zaostock.md` | NEW — ZAOstock context |
| `~/openclaw-workspace/memory/wavewarz.md` | NEW — WaveWarZ context |
| `~/openclaw-workspace/memory/bcz.md` | NEW — BetterCallZaal context |
| `~/openclaw-workspace/memory/personal.md` | NEW — personal/life context |
| `~/zoe-bot/bot.mjs` | Add `selectProjectMemory(message)` — keyword matcher that picks the right file. Inject into system prompt alongside global.md |

**Keyword mapping:**
- `zao os`, `zaoos`, `farcaster`, `neynar`, `supabase` -> `zao-os.md`
- `stock`, `zaostock`, `booth`, `merch` -> `zaostock.md`
- `wave`, `wavewarz`, `game` -> `wavewarz.md`
- `bcz`, `bettercallzaal`, `website` -> `bcz.md`
- `personal`, `life`, `health`, `family` -> `personal.md`

**Dependencies:** None. Ships standalone. Pairs well with #1 but independent.

**Verification:** Message ZOE about "ZAOstock booth pricing" — reply should use zaostock.md context, not generic.

---

## Improvement 3: Claude Code SessionStart Hook

**What:** Add a `SessionStart` hook to `.claude/settings.json` that auto-creates a `ws/` branch, eliminating the recurring "I forgot `/worksession`" bug.

**Why ship this week:** Smallest effort, highest reliability gain. Every Claude Code session currently requires manually invoking `/worksession`. Forgetting it means working on wrong branch, potential merge conflicts, lost work. A 15-min fix that prevents a recurring class of errors.

**Effort:** 1/5 (15 min)
**Value:** 4/5

**Code changes:**

| File (repo path) | Change |
|---|---|
| `.claude/settings.json` | Add `hooks.SessionStart` entry pointing to hook script |
| `.claude/hooks/ensure-ws-branch.sh` | NEW — checks if on a `ws/` or `session/` branch; if not, creates one. Equivalent to what `/worksession` does today |

**Hook script logic:**
```bash
#!/bin/bash
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" == ws/* ]] || [[ "$BRANCH" == session/* ]]; then
  exit 0  # already on a worksession branch
fi
# Create ws/ branch from main
git checkout -b "ws/$(whoami)-$(date +%s)" main 2>/dev/null || true
```

**Dependencies:** None.

**Verification:** Open a new Claude Code terminal — should auto-land on a `ws/` branch without invoking `/worksession`.

---

## Improvement 4: Voice Message -> Todo Transcription

**What:** Handle `msg.voice` in `bot.mjs` — download voice file via Telegram Bot API `getFile`, transcribe via Claude audio input, parse for slash commands or default to `/todo`.

**Why ship this week:** Walking brain-dump is the #1 uncaptured input mode. iPhone Telegram has native voice recording (tap+hold mic on lock screen). Unlocks hands-free todo capture for walks, drives, cooking.

**Effort:** 3/5 (90 min)
**Value:** 5/5

**Code changes:**

| File (VPS path) | Change |
|---|---|
| `~/zoe-bot/bot.mjs` | Add voice message handler: detect `msg.voice`, download via `bot.getFile(file_id)` + `https://api.telegram.org/file/bot<token>/<file_path>` |
| `~/zoe-bot/bot.mjs` | Transcribe downloaded OGG/OPUS via Claude API audio input (cost: ~$0.01/min) |
| `~/zoe-bot/bot.mjs` | Parse transcription: if starts with `/todo`, `/done`, `/note`, etc. -> route to existing command handler. Else wrap as `/todo <transcription>` |

**Flow:**
1. User holds mic in Telegram, says "call Steve Peer about booth pricing P1"
2. `bot.mjs` detects `msg.voice`, downloads OGG file
3. Sends to Claude with audio input -> gets transcription
4. Detects no slash prefix -> wraps as `/todo call Steve Peer about booth pricing P1`
5. Existing todo handler saves it
6. Replies: "Added: call Steve Peer about booth pricing [P1]"

**Dependencies:** Requires Anthropic API key with audio input support (already available on VPS).

**Verification:** Send a voice message to @zaoclaw_bot saying "todo test voice capture P2" -> should appear in todos list.

---

## Improvement 5: `/now` Live Activity Dashboard

**What:** New portal page at `portal.zaoos.com/now` showing a unified real-time view of what's running: AO sessions, tmux sessions, recent Telegram commands, cron last-fire times.

**Why ship this week:** Currently "what's running" is scattered across 5 dashboards (AO, Paperclip, tmux, portal, cron.log). Zaal checks 3-4 tabs to get the picture. One page replaces all of them for the "status glance" use case.

**Effort:** 3/5 (90 min)
**Value:** 4/5

**Code changes:**

| File (VPS path) | Change |
|---|---|
| `infra/portal/caddy/portal/now.html` | NEW — single-page dashboard with auto-refresh (polling every 10s) |
| `infra/portal/bin/spawn-server.js` | Add `GET /api/now` endpoint that aggregates: AO sessions (from `localhost:3001/api/sessions`), tmux list (`tmux ls`), last 5 cron fires (`tail -5 ~/test-checklist/cron.log`), last 5 Telegram commands (`tail -5 ~/zoe-bot/commands.log`) |
| `infra/portal/caddy/portal/index.html` | Add "Now" tile to landing page nav |
| `~/zoe-bot/bot.mjs` | Append to `~/zoe-bot/commands.log` on each slash command (1-line append) |

**Dashboard sections:**
- **AO Sessions** — status (WORKING/REVIEW/DONE), branch, age
- **tmux Sessions** — name, uptime
- **Recent Cron Fires** — timestamp, script name, result
- **Recent Commands** — last 5 Telegram commands with timestamps

**Dependencies:** AO REST API must be accessible at `localhost:3001` (already running per doc 436 health check).

**Verification:** Load `portal.zaoos.com/now` on phone — should show live AO sessions and tmux status.

---

## Sprint Schedule

| Day | Ship | Estimated Time |
|-----|------|---------------|
| Mon 4/21 | #3 SessionStart hook (15 min) + #2 per-project memory files (60 min) | 75 min |
| Tue 4/22 | #1 ZOE context awareness (90 min) | 90 min |
| Wed 4/23 | #4 Voice message transcription (90 min) | 90 min |
| Thu 4/24 | #5 `/now` dashboard (90 min) | 90 min |
| Fri 4/25 | Buffer day — fix bugs from #1-5, polish | as needed |
| Sat 4/26 | Soak test all 5 improvements in real daily use | 0 (just use them) |
| Sun 4/27 | Retro — write doc 448 with what shipped, what broke, what's next | 30 min |

**Total: ~6 hours of implementation across 7 days.**

---

## What We Deliberately Skipped

| Item | Why Skip (for now) |
|------|-------------------|
| Inline Telegram keyboards (436 gap 4) | Tap-the-URL works today. Polish, not leverage. Ship after the 5 core items. |
| Paperclip quick-assign from portal (436 gap 3) | Paperclip usage is low. Validate agent quality first. |
| Claude Routines migration (440 #6) | VPS crons work fine today. Migrate when VPS reliability becomes a problem. |
| Cross-model Codex review (440 #7) | Already installed, zero effort. Just start using it — no sprint item needed. |
| `/ask` external research (435 #5) | DuckDuckGo MCP exists but ZOE's primary value is project-aware, not web-search. |
| Multi-user tenant separation (435 #13) | YAGNI at 1 user. |
| Auto-research-doc -> MEMORY.md (435 #11) | Quality-of-life, not leverage. After the 5 core items. |
| Per-subtree CLAUDE.md hierarchy (440 #5) | 14 files to add. Valuable but mechanical — do it in a separate session, not sprint-blocking. |
| `/multiagent` slash command (440) | Parallel agent spawning already works via AO. A slash command saves 30 sec per spawn — nice but not sprint-priority. |

---

## Success Criteria

By 2026-04-27 (end of sprint):

1. ZOE replies reference actual git/PR state when asked "what am I working on" (context awareness)
2. ZOE uses project-specific knowledge when discussing ZAOstock vs ZAO OS (per-project memory)
3. New Claude Code sessions auto-land on `ws/` branches (SessionStart hook)
4. Voice messages to @zaoclaw_bot create todos (voice transcription)
5. `portal.zaoos.com/now` shows live AO + tmux + cron status on phone (activity dashboard)

---

## Comparison - Improvement Selection Criteria

| Criterion | Weight | Why |
|-----------|--------|-----|
| Value to daily flow | 40% | Does this save Zaal time or reduce friction every day? |
| Effort to ship | 25% | Can it ship in one focused session (< 2 hrs)? |
| Independence | 20% | Does it ship standalone without blocking on other work? |
| Risk | 15% | Could it break existing working systems? |

All 5 selected items score high on value, low on effort, are independent of each other, and carry low risk (read-only or additive changes, no destructive modifications to existing flows).

---

## ZAO Ecosystem Integration

### Cross-doc alignment

- [doc 435 - ZOE effectiveness v2 playbook](../435-zoe-effectiveness-v2-playbook/) — source of improvements #1, #2, #4
- [doc 436 - phone agentic stack health](../../infrastructure/436-phone-agentic-stack-playbook-health/) — source of improvements #4, #5
- [doc 440 - Claude Code process level-up](../../dev-workflows/440-claude-code-process-level-up/) — source of improvement #3
- [doc 434 - portal todos + Telegram commands](../../infrastructure/434-portal-personal-todos-zoe-telegram-commands/) — foundation for #4 voice handler
- [doc 305 - pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/) — flow-state protocol respected by all 5 items

### Files touched (summary)

**VPS files:**
- `~/zoe-bot/bot.mjs` — improvements #1, #2, #4, #5
- `~/zoe-bot/context-cache.sh` — NEW (improvement #1)
- `~/zoe-bot/commands.log` — NEW (improvement #5)
- `~/openclaw-workspace/memory/*.md` — 6 NEW files (improvement #2)
- `infra/portal/caddy/portal/now.html` — NEW (improvement #5)
- `infra/portal/bin/spawn-server.js` — improvement #5

**Repo files:**
- `.claude/settings.json` — improvement #3
- `.claude/hooks/ensure-ws-branch.sh` — NEW (improvement #3)

---

## Sources

- [doc 435 - ZOE effectiveness v2 playbook](../435-zoe-effectiveness-v2-playbook/README.md)
- [doc 436 - phone agentic stack playbook + health](../../infrastructure/436-phone-agentic-stack-playbook-health/README.md)
- [doc 440 - Claude Code process level-up](../../dev-workflows/440-claude-code-process-level-up/README.md)
- [Telegram Bot API voice messages](https://core.telegram.org/bots/api#voice)
- [Anthropic audio input](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- [Anthropic Hooks in Claude Code](https://docs.claude.com/en/docs/claude-code/hooks)
