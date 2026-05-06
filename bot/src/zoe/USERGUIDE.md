# ZOE userguide (May 4 2026)

Open Telegram. Find `@zaoclaw_bot`. That is ZOE.

ZOE is your concierge. One bot, one relationship. Runs on VPS 1 as `zoe-bot.service`. Auth-locked to your Telegram ID — anyone else who DMs gets ignored.

---

## What you can do today

### Free-form chat
Send any message. ZOE replies in 5-10 seconds.

- Short factual question → routed to Haiku (fastest, cheap)
- Default → routed to Sonnet
- Strategic / "should I" / "trade-off" → auto-escalates to Opus

Examples:
- `what should I focus on this morning`
- `should I push ZAOstock spinout this week or wait for the city council vote`
- `summarize my open PRs`

### Slash commands

| Command | What it does |
|---------|--------------|
| `/start` | Wakes ZOE, confirms identity |
| `/tasks` | Lists open tasks from `~/.zao/zoe/tasks.json` |
| `/seed` | Re-seeds the 8 doc-601 starter tasks if your queue is empty |

### Note prefix — the feedback loop

Anything you start with `note:` (or `cc:` or `claude:`) is captured to a notes file ZOE keeps for the next Claude Code session.

```
note: morning brief was too long, cut to 3 bullets
note: dispatcher should also support @hermes
note: when I say "ship it" without context, default to the last open PR
cc: rename the bot to ZOE in BotFather
```

ZOE replies with a thumbs-up emoji and the count of pending notes. No concierge turn runs. The note is appended to `/home/zaal/.zao/zoe/claude-code-notes.md` on VPS 1 with timestamp.

When you open Claude Code next, just say: **"what feedback did I leave for you?"** Claude pulls the file via SSH, processes everything, and clears the file.

---

## What runs automatically

### 5:00 AM EST — morning brief
ZOE pulls last 24h commits + open PRs + your top 5 open tasks and DMs you a 6-line brief. Idempotent (sentinel file, no double-fire if scheduler restarts).

### 9:00 PM EST — evening reflection
3 questions:
1. What shipped today?
2. What's stuck?
3. Tomorrow's first task?

Plus (per doc 606) a "Captures from today" block listing meeting transcripts + voice notes + tagged DMs that should land in Bonfire. Tap each: `Now (push to Bonfire)` / `Later` / `Shelve`.

Today the captures file is empty so you'll just see the 3 questions. Once Granola is wired (your Phase 1 task), captures appear here.

---

## What's coming next

### Phase 1 (this week, doc 605)
- Playwright MCP unlock — ZOE can browse the web (Farcaster, X, blogs, research links)
- Langfuse traces — observability for every concierge turn (catches silent failures)
- Promptfoo CI gate — regression-test ZOE replies on PRs

### Phase 2 (doc 607)
- `@zaostock <cmd>` — relay from your ZOE DM to ZAOstock bot
- `@bonfire <query>` — relay to Bonfire knowledge graph
- `@hermes <task>` — relay to Hermes coder/critic

### Brand-assistant slash commands (doc 607)
- `/firefly <url> [context]` — 3 Firefly drafts (FC + X)
- `/youtube <url> [transcript]` — YouTube description with chapters
- `/cast <url>` — Farcaster long-form
- `/thread <topic>` — X thread
- `/onepager <topic>` — pitch one-pager
- `/announcement <topic>` (in ZAOstock bot) — festival broadcast

### Phase 3+
- Bonfire SDK recall (when Joshua.eth ships the API key)
- Voice mode via LiveKit Agents + Cartesia (post-ZAOstock spinout)
- Limitless Pendant ambient capture (after $199 budget)

---

## Memory layout

What ZOE remembers, where:

| File | What | Touched by |
|------|------|-----------|
| `~/.zao/zoe/persona.md` | ZOE identity + Year-of-the-ZABAL voice rules | versioned in repo, copied on first boot |
| `~/.zao/zoe/human.md` | Your facts (ENS, schedule, projects, relationships) | refreshed daily by ZOE |
| `~/.zao/zoe/recent.json` | last 5 turns (FIFO ring buffer) | every concierge turn |
| `~/.zao/zoe/tasks.json` | open task queue | `/tasks`, `/seed`, task ops in concierge replies |
| `~/.zao/zoe/captures/<YYYY-MM-DD>.json` | today's meeting/voice/dm captures | written by Granola hook (TBD) + voice handler (TBD) |
| `~/.zao/zoe/sentinels/<trigger>-<date>.flag` | idempotency flags for scheduler | brief / reflect cron |
| `~/.zao/zoe/claude-code-notes.md` | your `note:` prefix messages | ZOE on note: prefix; cleared by Claude Code on read |

---

## Anti-patterns ZOE will NOT do

(per doc 604 / openclaw lessons)

- **Empty replies.** Every reply > 5 chars or it gets blocked + logged. No more "·" pings.
- **"Would you like me to..."** ZOE just does it.
- **Memory state lies.** ZOE never claims a task was completed if the JSON didn't change. (Doc 581 lesson.)
- **Quiet hours.** None. You explicitly said "rather get pinged than ignored." So 5am brief + 9pm reflection always fire.

---

## Troubleshooting

**ZOE not replying:**
```bash
ssh zaal@31.97.148.88 "systemctl --user status zoe-bot.service"
```
If `inactive (dead)`:
```bash
ssh zaal@31.97.148.88 "systemctl --user restart zoe-bot.service"
```

**Want to see logs:**
```bash
ssh zaal@31.97.148.88 "journalctl --user -u zoe-bot.service -f"
```

**Reset tasks:** DM `/seed` — re-seeds the 8 starter tasks (only if queue is empty; safe to run multiple times).

**Bot says wrong thing:** DM `note: <what was wrong + what should have happened>` — fixes get triaged in next Claude Code session.

---

## Cheat sheet (for the lock screen)

```
@zaoclaw_bot

/start         wake ZOE
/tasks         show open tasks
/seed          seed initial tasks

note: <feedback>    save for Claude Code
free text          concierge reply

5am EST  - morning brief
9pm EST  - evening reflection
```

---

Authored 2026-05-04. Updated when ZOE ships new commands.
