# ZOE Post Slate v1

ZOE drafts 4 categories of social posts and DMs Zaal random suggestions throughout the day. He copy-pastes the keepers into Firefly. Hand-tunes weights after a week of real usage.

## Categories

| Category | Source(s) v1 | Source(s) v2 (planned) |
|---|---|---|
| `build` | Last 24h commits + open PRs (`gh pr list`) | Vercel deploy status, test runs |
| `ecosystem` | Last 7d commits to ZAOOS as proxy for ZAO momentum | Farcaster /thezao channel, ZABAL Base contract activity, member roster diffs |
| `event` | `~/.zao/zoe/events/{today,tomorrow}.txt` (manually seeded) | Google Calendar MCP via Claude CLI subprocess |
| `personal` | `~/.zao/zoe/voice-memos/YYYY-MM-DD.md` (one-liner captures via `/voicememo`) | Lunch stream transcripts via `zao-transcribe`, persona + recent Telegram messages |

## Cadence

- Target: **7 pings/day** (configurable via `pingsPerDay` option)
- Window: **5am - 10pm America/New_York**
- Minimum gap: **20 minutes** between pings
- No quiet hours (per `feedback_no_flow_state_gate.md`)
- Schedule re-rolled at midnight ET; stored at `~/.zao/zoe/posts/schedule.json`
- Category weights: build=3, ecosystem=2, event=1, personal=1

## Telegram surface

```
Post draft (build):

doc 653 audit — paperclipai crash-looped 107k times since last reboot. fixing today, cleaner crontab tomorrow.

— copy + paste into Firefly when ready
```

User flow: read on phone, copy text, open Firefly, paste, ship.

No buttons / no API calls / no clipboard skill in v1. Lowest blast radius.

## Capture command

```
/voicememo built imanagent v0 in 90 min while iman watched
/vm just got off a call with cassie, debrief is locked
```

Appends to `~/.zao/zoe/voice-memos/YYYY-MM-DD.md` with timestamp. Drafter pulls last 8 lines from today + yesterday on each personal-category fire.

## State + logs

| File | Purpose |
|---|---|
| `~/.zao/zoe/posts/schedule.json` | Today's rolled schedule + fired flags |
| `~/.zao/zoe/posts/log.jsonl` | One-line-per-event audit log: rolls, sends, skips, errors |
| `~/.zao/zoe/voice-memos/YYYY-MM-DD.md` | Daily voice memo append log |
| `~/.zao/zoe/events/today.txt` | One event per line, manually seeded for now |
| `~/.zao/zoe/events/tomorrow.txt` | Same, tomorrow |

## Voice rules (in `drafters.ts`)

- Year-of-the-ZABAL tone
- No emojis, no em dashes, no marketing-speak
- 1-3 short lines, hard cap 280 chars
- Brand spellings exact
- First person where natural

## Drafter model

Default `haiku` (cheap, fast, good enough for 280-char drafts). Escalate to `sonnet` per-category if quality drops.

Drafters use the Hermes pattern (`callClaudeCli` from `../hermes/claude-cli`) - Max plan OAuth, no API key billing.

## Disable / tune

- Stop the whole scheduler: comment out `startPostsScheduler(...)` in `bot/src/zoe/scheduler.ts`
- Change pings/day: pass `pingsPerDay: 4` (or whatever) when calling `startPostsScheduler`
- Change category weights: edit `CATEGORY_WEIGHTS` in `scheduler.ts`
- Change window: edit `WINDOW_START_HOUR_ET` / `WINDOW_END_HOUR_ET`

## Deploy

Same path as the rest of zoe-bot:

```bash
ssh zaal@31.97.148.88 'cd /home/zaal/zao-os && git pull && systemctl --user restart zoe-bot && sleep 5 && journalctl --user -u zoe-bot.service -n 30 --no-pager'
```

Healthy first-boot log lines:
```
[zoe/posts] scheduler started (target 7 pings/day, window 5am-10pm ET)
[zoe/posts] rolled schedule for 2026-05-17: 7 pings
```

## v2 roadmap (do not build until v1 has run for 1 week)

1. Inline keyboard buttons: `[Post]` `[Regen]` `[Skip]` `[Edit]` (per Doc 652 / grill answer "later")
2. Skip-rate learning: bump down category weights if skip rate > 60% over 7 days
3. Calendar source: wire Google Calendar MCP
4. Stream transcript source: integrate `zao-transcribe`
5. Voice note ingestion: handle `ctx.message.voice` via Whisper or zao-transcribe
6. Auto-post path: Firefly API integration (per grill Q4 hybrid option)

## Spec source

Grill answers from Zaal on 2026-05-16, summarized in commit body for PR.
