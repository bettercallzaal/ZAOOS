# 434 - Portal v4: Personal Todos + ZOE Telegram Commands

> **Status:** Shipped + live
> **Date:** 2026-04-18
> **Goal:** Extend the portal todos brain-dump (doc 433) to cover personal life, not just code. Wire ZOE Telegram bot so you can add/mark/list todos without opening the portal.

---

## Key Decisions / Recommendations

| # | Decision | State |
|---|---------|-------|
| 1 | Unify work + life in one todos list, separate by `project` field | **LIVE** |
| 2 | Add life projects to dropdown: Personal, Health, Family, Finance, Learning, Errands, Home | **LIVE** portal.zaoos.com/todos |
| 3 | Add tag-suggestion pills: #call #errand #health #bill #read #buy #message #bug #idea #book | **LIVE** |
| 4 | Wire Telegram `/todo`, `/done`, `/list`, `/p1`, `/p0`, `/note`, `/help` commands | **LIVE** @zaoclaw_bot |
| 5 | Parse `P0-P3`, `+Project`, `#tags` inline in `/todo` messages | **LIVE** |
| 6 | Use same JSON store `~/portal-state/todos.json` for both portal + Telegram | **LIVE** |

**Rule of thumb:** If you can type or speak it in under 5 seconds, use Telegram `/todo`. If you have a list or want to categorize heavily, use the portal UI.

---

## Telegram Command Reference (test now)

Open `@zaoclaw_bot` in Telegram. Send any of these:

```
/help                                    show command list
/todo call mom P1 +Family #call          add with priority + project + tag
/todo buy new running shoes #buy         just text + tag (P2 default, no project)
/todo read Range book #book #read +Learning
/list                                    top 12 open by priority
/p1                                      only P0 + P1 open
/p0                                      only P0 open
/done 35ae                               mark done by ID prefix
/done mom                                mark done by text match
/note 35ae remind Sat morning            append note to todo
```

Any message NOT starting with a `/` command still routes to ZOE (Claude). So `/list` is instant, free-form chat still works.

### Inline syntax

| Token | Meaning | Example |
|-------|---------|---------|
| `P0`-`P3` | Priority | `P1` -> P1 |
| `+Word` | Project | `+Personal` -> project Personal |
| `#tag` | Tag | `#call` `#bill` |
| rest | Body text | stripped of above tokens |

---

## Brain-Dump Routing (updated from doc 433)

| Input | Fastest route | Where it goes |
|-------|---------------|---------------|
| Walking, short idea (under 5 sec) | Telegram `/todo ...` | portal.zaoos.com/todos |
| Walking, long list | Telegram open portal -> Bulk add | portal todos |
| Sitting, long list | portal.zaoos.com/todos -> Bulk add | portal todos |
| Review open work | portal.zaoos.com/todos OR Telegram `/p1` | portal todos |
| Kick off an agent | portal.zaoos.com -> Quick Spawn OR portal todos -> tap "spawn" | AO sessions |
| Daily morning scan | Telegram `/p1` | top P0-P1 items |
| End of day sweep | Telegram `/list` | top 12 open |
| Link to read | Telegram `/todo read <url> #read` | portal todos filtered by #read |
| Bill to pay | Telegram `/todo pay Comcast $X #bill +Finance` | portal todos |
| Errand | Telegram `/todo pick up Rx #errand` | portal todos |
| Calls to make | Telegram `/todo call Steve Peer #call +ZAOstock` | portal todos |
| Health | Telegram `/todo book dentist #health +Health` | portal todos |
| Reading queue | portal todos filter `#read` | portal todos |
| Recurring task | Claude Routines (doc 422) | cloud cron |
| Long planning doc | `/zao-research` | research library |

---

## Example - 10 personal todos you can drop in right now

Open Telegram `@zaoclaw_bot` and paste these (one per line, send one at a time):

```
/todo call Steve Peer about ZAO Stock #call +ZAOstock P1
/todo book dentist cleaning #health +Health
/todo renew car registration #errand +Personal P1
/todo read Range by David Epstein #book #read +Learning
/todo finish tax doc prep by April 30 #bill +Finance P1
/todo weekly fractal prep Monday 6pm #call +ZAOOS
/todo pick up dry cleaning #errand
/todo message mom about Mother Day #message +Family
/todo order birthday gift for X #buy +Family
/todo schedule eye exam #health +Health P3
```

After sending, tap `/list` -> all 10 show ranked by priority. Open portal.zaoos.com/todos -> filter `+Personal` or `#health` to see subsets.

---

## Morning ZOE Digest (proposed next ship)

Not live yet - documented here for track. Extend cron:

```
0 7 * * * /home/zaal/bin/morning-digest.sh >> /home/zaal/morning.log 2>&1
```

`morning-digest.sh` reads top 5 P0-P1 open todos from `~/portal-state/todos.json`, formats them, sends via Telegram. Wakes with ZAO priorities.

Similar `evening-digest.sh` at 9pm ET asks "Which of today's P1 did you do? Reply `/done <id>` or `/done <text>`."

---

## Comparison - Where to Store Todos

| Option | Sync phone <-> computer | Search | Filter | Telegram | Agent-spawn | Verdict |
|--------|-------------------------|--------|--------|----------|-------------|---------|
| **portal.zaoos.com/todos + `/todo` Telegram** (this) | Yes (VPS JSON) | Yes | Yes | Yes | Yes | **PRIMARY** |
| Apple Reminders | Yes (iCloud) | Yes | Limited | No | No | Good for calendar tie-in, can't spawn |
| Todoist | Yes | Yes | Yes | Via app | No | Free tier limits, paid for projects |
| Things 3 | iOS/Mac only | Yes | Yes | No | No | Beautiful but isolated |
| Notion | Yes | Yes | Yes | No | No | Too slow on phone |
| Plain text file | If synced | grep | No | No | No | Skip |
| Obsidian | Via sync | Yes | Plugins | No | No | Desktop-first |

**Why the portal wins for this use case:** same data accessible from iPhone browser, Claude Code TUI (`cat ~/portal-state/todos.json`), Telegram, and AO spawn buttons. No other tool links "todo" with "spin up an agent to do it."

---

## ZAO Ecosystem Integration

### Files / surfaces

- `infra/portal/caddy/portal/todos.html` - project dropdown + tag suggestions
- `infra/portal/bin/bot.mjs` - NEW (mirrored from zoe-bot with `/todo` commands)
- `~/portal-state/todos.json` - single source of truth on VPS
- `~/zoe-bot/bot.mjs` - live deployed

### Cross-doc alignment

- [doc 433 - portal v3 brain-dump origin](../433-portal-todos-brain-dump-universal-nav/)
- [doc 431 - portal v2 plan](../431-portal-universal-nav-v2-improvements/)
- [doc 430 - portal v1 improvements](../430-portal-stack-improvements-plan/)
- [doc 428 - portal infra origin](../428-unified-agent-portal-ao-phone-access/)
- [doc 305 - pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/)
- [doc 422 - Claude Routines (morning/evening digest home)](../../dev-workflows/422-claude-routines-zao-automation-stack/)

---

## Known Open Items

- Morning + evening Telegram digest not yet shipped (cron + script documented above).
- `bot.mjs` is NOT yet in `infra/portal/bin/` from the same flow - need to add on next sync.
- Voice-to-todo via Safari webkitSpeechRecognition on portal /todos still deferred (doc 431 backlog).
- No way to convert a todo INTO a Claude Routine yet (e.g. "run this todo every Tuesday at 10am").
- Telegram `/schedule <cron> <prompt>` would be a natural extension once Claude Routines are on.

---

## Sources

- [Companion - doc 433](../433-portal-todos-brain-dump-universal-nav/README.md)
- [Companion - doc 428](../428-unified-agent-portal-ao-phone-access/README.md)
- [Telegram Bot API sendMessage](https://core.telegram.org/bots/api#sendmessage)
- [Telegram Bot API getUpdates long polling](https://core.telegram.org/bots/api#getupdates)
- [infra/portal repo](../../../infra/portal/)
