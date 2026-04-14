# VPS Configuration Changelog

## April 13, 2026

### OpenClaw Config (openclaw.json)
- `nativeSkills: false` -- disables OpenClaw intercepting /slash commands so they pass through to M2.7 as regular messages. ZOE reads COMMANDS.md to handle them.
- Location: `/home/zaal/openclaw/openclaw.json` (host) mounted to `/home/node/.openclaw/openclaw.json` (container)
- Host dir owned by `ubuntu` (uid 1000), `zaal` (uid 1001) needs docker volume mount to edit

### Files Deployed to Container
- `SOUL.md` -- Updated: added Commands section (references COMMANDS.md), proactive behavior rules, task CRUD instructions
- `AGENTS.md` -- Updated: replaced DND windows with proactive ping rules, always-available policy, max 3-4 pings/day, task management role
- `COMMANDS.md` -- NEW: 16 Telegram slash commands (tasks, add, done, next, carry, priorities, status, inbox, brief, newsletter, idea, research, bookmark, commands, schedule, week)
- Location: `/home/node/openclaw-workspace/` (container), mounted from `/home/zaal/openclaw-workspace/` (host)

### Scheduled Triggers (RemoteTrigger API)
| Trigger | ID | Cron (UTC) | EST | What |
|---------|-----|-----------|-----|------|
| ZOE Nightly Processor | trig_017ZtkhQcEoy3wjEqZ8wGfPy | 3 3 * * * | ~11pm daily | Inbox, newsletter, briefing, tasks |
| ZOE Morning Briefing | trig_012FUhqZtyxzGwPFktFy1Xxf | 27 8 * * 1-5 | ~4:27am M-F | Deliver briefing + job scan |
| ZOE Lunch Ping | trig_01KXuM6StaK7gejfo25qzmYj | 27 15 * * 1-5 | ~11:27am M-F | 3 actionable items |

### BotFather Commands (user must paste to @BotFather)
```
tasks - Show today's priorities and status
add - Add a task to today
done - Mark a task complete
next - What should I do next
carry - Move task to tomorrow
priorities - Show top 3 priorities
status - Project status and open PRs
inbox - Show unread inbox items
brief - Resend morning briefing
newsletter - Show newsletter draft
idea - Save an idea
research - Queue research topic
bookmark - Save a bookmark
commands - Show all commands
schedule - Today's schedule
week - Weekly summary so far
```
