# ZOE userguide (May 5 2026)

Open Telegram. DM `@zaoclaw_bot`. That is ZOE. One bot, one relationship. Auth-locked to your Telegram ID; anyone else gets ignored.

---

## Quick start - the 5 things to try first

```
/agents                                            see what helpers are available
@research is Granola free tier good enough         get a sourced answer in ~10s
@newsletter today - busy week, BCZ YapZ today      draft today's Year-of-the-ZABAL entry
note: rename the bot to ZOE in BotFather           save feedback for next Claude Code session
what should I focus on this morning                free-form concierge turn
```

If those four work, the rest of the guide is just more depth.

---

## Slash commands

| Command | What it does |
|---------|--------------|
| `/start` | Wakes ZOE, confirms identity |
| `/agents` | Lists 4 helpers + what each does |
| `/help` | Same as `/agents` (alias) |
| `/tasks` | Shows your open tasks from `~/.zao/zoe/tasks.json` |
| `/seed` | Seeds 8 starter tasks if queue is empty (safe to run multiple times) |
| `/notes` | Shows pending feedback notes (last 5 with timestamps) |

---

## The 4 helpers (`@<name> <text>`)

### 1. `@recall` - query Bonfire memory

```
@recall what did Roddy say about Aug 28
@recall who runs livestream for ZAOstock
```

Replies with what the Zabal Bonfire knows. Today the bonfire is mostly empty - you'll get generic answers until we run the bootstrap pass (doc 614). To seed it now: DM @zabal_bonfire directly with facts you want recalled later.

When SDK key arrives + bootstrap runs, `@recall` returns Zaal-specific synthesized answers like @zabal_bonfire DM does. Same wiring, no code change.

### 2. `@research` - sub-300-word sourced answer

```
@research what's actually new in Granola free tier
@research is Khoj or Bonfire better for personal KGs
@research what is Songchain Ram is building
```

~10 sec reply. Sourced. Decision-led format. NOT a full /zao-research run (that's still a Claude Code session task). Use this for one-screen answers in your daily flow.

### 3. `@newsletter` - Year of the ZABAL daily entry

Two modes:

**Draft mode** - one paragraph or compact list of what mattered today:
```
@newsletter Day-after-birthday recap. Won Farcaster hackathon track. Cut all my hair. Hosted Fractal Sunday. ZAOstock cobuilds Mondays 11:30am EST regular slot. Today: BCZ YapZ ep with Kenny POIDH plus second bounty after.
```

**Edit mode** - revise today's draft with an addition:
```
@newsletter edit add the Rome conference - 2 main stage ZABAL mentions now
@newsletter add quote "you are loved by the universe"
@newsletter also include the Granola free tier signup
```

Voice locked to BetterCallZaal Year-of-the-ZABAL per doc 610. Auto-fills date + day-of-year + day-name in header. Pulls today's commits + PRs + captures into "The Day" section automatically. Anti-patterns blocked: aphoristic closes, "the machine" cliches, "there is a thing that happens" constructions, parallel-structure 3-beat closes.

Output saves to `~/.zao/zoe/newsletters/<date>.md` so edit mode finds it.

### 4. `@zaostock` - cross-bot relay

```
@zaostock test - confirming relay works
@zaostock reminder Mon 11:30am cobuild starts in 15
@zaostock new partner: Web3Metal via Shawn
```

Posts the message AS @ZAOstockTeamBot. Right now goes to your DM (since `ZAOSTOCK_TEAM_CHAT_ID` env not set). When you set the team group ID, it posts to the team chat instead.

---

## The `note:` prefix - feedback loop

Anything you send starting with `note:`, `cc:`, or `claude:` is captured to a notes file ZOE keeps for the next Claude Code session.

```
note: morning brief was too long, cut to 3 bullets
note: dispatcher should also support @hermes
note: when I say "ship it" without context, default to last open PR
cc: rename bot to ZOE in BotFather
claude: research <X> next session
```

ZOE replies with the count of pending notes. NO concierge turn fires. The note appends to `/home/zaal/.zao/zoe/claude-code-notes.md` on VPS with timestamp.

When you next open Claude Code, just say: **"what feedback did I leave for you?"** Claude pulls the file via SSH, processes everything, clears it.

`/notes` shows the last 5 pending notes from your phone.

---

## Free-form chat (no @ prefix, no slash)

Any plain text routes to the concierge. Auto-routes by intent:
- Short factual ("what time is", "summarize my open PRs") → Haiku, fastest
- Default → Sonnet
- Strategic ("should I", "trade-off", "is it worth") → Opus

Voice rules locked: short paragraphs, max 2 sentences each, blank lines between, default 3-6 lines per reply, phone-readable.

---

## Tip cron - hourly userguide reminders

Top of every hour ZOE auto-fires a tip from a 25-tip pool covering everything in this guide. Cycles round-robin (you'll eventually see each one). Skips the 9am UTC and 1am UTC slots so it never overlaps morning brief or evening reflection.

If too noisy:
```
stop tips
```
DM that to silence the cron. Resume with:
```
start tips
```

---

## Auto cron jobs

| When | What |
|------|------|
| 5:00 AM EST (9:00 UTC) | Morning brief - last 24h commits, open PRs, top 5 tasks |
| 9:00 PM EST (1:00 UTC) | Evening reflection - 3 questions + captures-from-today gate |
| Top of every hour (UTC) | One tip from the 25-tip pool (skip brief/reflect slots) |

All idempotent (sentinel files prevent double-fires on scheduler restart).

---

## Memory layout (what ZOE remembers)

```
~/.zao/zoe/
├─ persona.md              ZOE identity + voice rules (loaded into every concierge call)
├─ human.md                Your facts (schedule, projects, relationships)
├─ brand.md                Year-of-the-ZABAL voice + 5 example posts
├─ recent.json             last 5 turns (FIFO ring buffer)
├─ tasks.json              open task queue
├─ captures/<date>.json    today's meeting/voice/dm captures
├─ newsletters/<date>.md   today's @newsletter draft (so edit mode reads it)
├─ sentinels/              idempotency flags for scheduler
├─ claude-code-notes.md    your note: prefix messages
└─ tip-pointer.txt         hourly tip round-robin index
```

Everything's flat-file JSON or markdown. Inspect anything via SSH.

---

## What's NOT live yet (coming)

| When | What |
|------|------|
| This week | Inbox autonomy - ZOE polls `zoe-zao@agentmail.to` every 30 min, auto-categorizes, files. (Doc 611 Phase 1 + doc 612.) |
| This week | Audit log - every autonomous action logged to `~/.zao/zoe/audit.log` |
| Next week | Bonfire pipeline - daily proposed-adds review with Now/Later/Shelve buttons. (Doc 611 Phase 2 + doc 614 ontology.) |
| Week 3 | `@research --deep`, `@audit`, `@summarize` subagents (budget-capped, Langfuse-traced). (Doc 611 Phase 3.) |
| Week 3 | Self-improvement loop - ZOE classifies your `note:` corrections, weekly Sunday retro proposes prompt edits. (Doc 611 Phase 4.) |
| When budget clears | Voice mode via LiveKit + Cartesia. Limitless Pendant ambient capture. |

---

## Anti-patterns - what ZOE WILL NEVER DO

- **Empty replies.** Every reply > 5 chars or blocked + logged. No "·" pings.
- **"Would you like me to..."** ZOE just does the thing.
- **Memory state lies.** ZOE never claims a task changed if the JSON didn't change.
- **Quiet hours.** None - you said "rather get pinged than ignored."
- **Public posts without you.** ZOE drafts; you ship.
- **Team broadcasts without you.** `@zaostock` previews to your DM today; team group needs explicit env switch.
- **Wallet ops, on-chain transactions, money moves.** Hard wall.
- **File deletes / git pushes / git resets.** disallowedTools blocks them.

---

## Troubleshooting

**ZOE not replying:**
```bash
ssh zaal@31.97.148.88 "systemctl --user status zoe-bot.service | head -3"
```

**Want live logs:**
```bash
ssh zaal@31.97.148.88 "journalctl --user -u zoe-bot.service -f"
```

**Restart bot (after env change):**
```bash
ssh zaal@31.97.148.88 "systemctl --user restart zoe-bot.service"
```

**Reset tasks:** DM `/seed` (only seeds if empty; safe to run repeatedly).

**Bot got something wrong:** DM `note: <what was wrong + what you wanted>`. Fixes get processed in next Claude Code session.

---

## Cheat sheet (for the lock screen)

```
@zaoclaw_bot

SLASH:    /agents /tasks /seed /notes /start /help
HELPERS:  @recall  @research  @newsletter  @zaostock
SAVE:     note: <feedback>
TIPS:     stop tips / start tips
EDIT:     @newsletter edit <addition>

5am EST  morning brief
9pm EST  evening reflection
hourly   userguide tip
```

---

## How to test today (your starter checklist)

Try these in order. Each one tests a different surface.

1. `/start` - confirms ZOE up.
2. `/agents` - see the helper menu.
3. `what should I focus on this morning` - free-form concierge.
4. `@research is Granola free tier good enough` - sourced answer subagent.
5. `@newsletter today - testing the ZABAL voice on a Tuesday` - daily entry draft.
6. `@newsletter edit also won a hackathon track this week` - edit mode (requires step 5 first).
7. `@zaostock test - confirming cross-bot relay works` - watch a SECOND bot identity post in your DM.
8. `note: this is great, ship more agents` - feedback capture.
9. `/notes` - confirm the note got captured.
10. `stop tips` then `start tips` - test the cron-toggle commands.

If any of these feels off, `note: <step N> did <wrong thing>` and Claude fixes it in the next session.

---

Authored 2026-05-05. Updated when ZOE ships new commands.
