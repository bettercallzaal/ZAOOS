# ZAO Devz Bot — Setup Guide

Autonomous coding agent for the ZAO DEVZ Telegram group. Phase 1 scope:
slash + @mention commands that dispatch real coding tasks to the existing
AO spawn-agent pipeline. Opens PRs, bot reports links, owner merges.

## First-time setup (5 steps, difficulty 3/10)

### 1. Create the Telegram bot

- Open Telegram -> message @BotFather -> `/newbot`
- Suggested name: `ZAO Devz` (public display name)
- Suggested username: `zaodevz_bot` (or `zao_devz_bot` if taken)
- BotFather will hand back a token like `7234567890:AAH1a2B3cD4e...`
- Send `/setprivacy` to BotFather, pick `zaodevz_bot`, choose **Disable** so the
  bot can read all messages in groups (needed to see `@zaodevz spawn` mentions).
- Send `/setjoingroups` to BotFather, same bot, choose **Enable**.

### 2. Add the bot to the ZAO DEVZ group

- In the ZAO DEVZ Telegram group -> Group name -> Manage -> Administrators ->
  Add administrator -> search `@zaodevz_bot` -> add with at minimum:
  - `Delete Messages` (for clawback cases)
  - `Send Messages` (obviously)
  - No other perms needed
- Grab the group's chat ID. Easiest: send any message to `@zaodevz_bot` first
  via the group, then on the VPS run:

```bash
source ~/.env.portal
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" | \
  jq '.result[] | {chat_id: .message.chat.id, title: .message.chat.title}'
```

Group chat IDs are negative (e.g. `-1002345678901`).

### 3. Install token + config on VPS

SSH in, create the bot's runtime dir with the token:

```bash
ssh zaal@31.97.148.88
mkdir -p ~/zoe-devz
cp ~/zao-os/infra/portal/bin/bots/zao-devz/.env.example ~/zoe-devz/.env
nano ~/zoe-devz/.env
```

Fill in the 4 values:
- `TELEGRAM_BOT_TOKEN=<token from BotFather>`
- `ALLOWED_USERS=1447437687,<other-dev-ids-if-any>`
- `ALLOWED_GROUPS=<the negative chat id from step 2>`
- `OWNER_USER_ID=1447437687` (Zaal — only one who can merge)

Save, then tighten perms:

```bash
chmod 600 ~/zoe-devz/.env
```

### 4. Wait for watchdog to pick it up

Watchdog's check `[ -f "$HOME/zoe-devz/.env" ]` now passes. Next tick (within
1 min) respawns `zoe-devz-bot` tmux session. Verify:

```bash
sleep 70   # one tick
tmux ls | grep zoe-devz
pgrep -af devz-bot.mjs
grep '"event":"boot"' ~/zoe-bot/events.jsonl | grep zao-devz | tail -1
```

(The boot event goes to the same `events.jsonl` but with `"source":"zao-devz"`.)

### 5. First real dispatch

In the ZAO DEVZ Telegram group, send:

```
@zaodevz spawn fix a typo in research/agents/README.md line 1
```

Expected within 30s:
1. Bot reply: `[DEVZ] dispatching — fix a typo in research/agents/...`
2. Bot reply: `[DEVZ] spawned. session=xyz... Watcher will post PR link when ready. (1/3 today)`
3. AO spawns a Claude Code session that creates `ws/act-research-agents-readme-...`, edits the doc, opens a PR.
4. Within ~5-15 min: session-watcher (existing cron) posts `[SHIPPED] doc X -> PR #N <url>` to Zaal's private ZOE chat (not the devz group — that stays clean).
5. Zaal reviews diff, DMs `/approve <pr-number>` to the bot in the devz group.
6. Bot squash-merges + deletes the branch.

## Commands reference

| Command | Who can use | What |
|---|---|---|
| `@zaodevz spawn <task>` | Any ALLOWED_USER | Dispatches AO session on new branch |
| `/spawn <task>` | Any ALLOWED_USER | Same |
| `/status` | Any ALLOWED_USER | Open PRs + last-24h merges digest |
| `/approve <pr>` | OWNER_USER_ID only | Squash-merge + delete branch |
| `/help` | Any ALLOWED_USER | Command list |

## Rate limits + budget

- 3 spawns/user/day (rolling 24h)
- 10 spawns/group/day (rolling 24h)
- $5 Claude budget per spawn (via `spawn-agent --max-budget-usd 5`)
- Rolling 24h windows reset on a per-event basis, not midnight

## Operational

Bot state:
- `~/zoe-devz/.env` — token + allowlist (600, not committed)
- `~/zoe-devz/bot.log` — stdout (`tee` from watchdog)
- `~/.cache/zoe-devz/rate.json` — spawn rate limit tracker
- `~/zoe-bot/events.jsonl` — all events, `"source":"zao-devz"` for this bot
- Tmux session: `zoe-devz-bot`
- Respawned by `~/bin/watchdog.sh` every minute if dead
- Code synced by `~/bin/auto-sync.sh` — edits to `bots/zao-devz/bot.mjs` in main
  auto-bounce within ~1-2 min

## Troubleshooting

Bot not responding:
```bash
# Env file present?
ls -la ~/zoe-devz/.env
# Process alive?
pgrep -af devz-bot.mjs
# Tmux running?
tmux ls | grep zoe-devz
# Recent errors?
grep '"source":"zao-devz"' ~/zoe-bot/events.jsonl | tail -10
# Force a respawn:
tmux kill-session -t zoe-devz-bot; bash ~/bin/watchdog.sh
```

Bot spawning but not responding to messages:
- Check group privacy setting (BotFather `/setprivacy` must be Disable).
- Check group chat id matches `ALLOWED_GROUPS` (leading `-` required).

PR not opening after spawn:
- Check spawn-server logs: `tail -20 ~/spawn-server.log`
- Check AO session: `ls -t ~/.agent-orchestrator/ZAOOS/sessions/ | head -3`
- Check session-watcher: `tail -10 ~/.cache/zoe-telegram/session-watcher.log`

## Limits (Phase 1 deliberately small)

- No free-form conversation. Bot only responds to its 5 commands.
- No inline keyboard buttons (callback_query unhandled).
- No cross-bot dispatch (`@zoey from devz` deferred).
- No cost tracking integration yet (B4 task in doc 465).
- No Anthropic API use — relies on `claude -p` inside the AO session only.

Each of these is a deliberate Phase 2 item once ZAO Devz proves out in live
use in the group.
