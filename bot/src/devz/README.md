# ZAO Devz Dual-Bot Stack

Two Telegram bots, one Node process, one chat. They narrate the Hermes Coder + Critic loop as separate identities so the conversation reads like two agents reviewing each other's work.

## Architecture

```
Zaal in ZAO Devz Telegram chat
            |
            | /fix <issue>
            v
+-------------------+
| @ZAODevzBot       |  <- Coder (this bot dispatches the loop)
| posts:            |
|   "Coder starting"|
|   "Coder done.    |
|    3 files."      |
+-------------------+
            |
            v
   bot/src/hermes/runner.ts (in-process)
   spawns Claude Code CLI in /tmp/hermes-{id}/
   Coder pass (opus) -> Critic pass (sonnet)
            |
            v
+-------------------+
| @HermesBot        |  <- Critic (same process, different token)
| posts:            |
|   "Reviewing..."  |
|   "Score 85.      |
|    PR #N opened." |
+-------------------+
            |
            v
[Zaal pushes after review] -> safe-git-push.sh -> branch protection
```

## Required Telegram Setup (one-time)

1. Talk to @BotFather, create two bots:
   - `@ZAODevzBot` (or whatever name you choose) - the Coder
   - `@HermesZAOBot` (or similar) - the Critic
2. Save both tokens
3. Create a private Telegram group called "ZAO Devz" (or similar)
4. Add @ZAODevzBot to the group, make it admin
5. Add @HermesBot to the group, make it admin
6. Get the group's chat id: send `/whoami` in the group after the bots run, or use `@RawDataBot` first

## Required Env Vars

In `~/zaostock-bot/.env` or wherever the stack runs:

```
ZAO_DEVZ_BOT_TOKEN=<from BotFather>
HERMES_BOT_TOKEN=<from BotFather>
ZAO_DEVZ_CHAT_ID=<-100xxxxxxxx, the Telegram group id>
BOT_ADMIN_TELEGRAM_IDS=<your tg user id, comma-separated for multiple>
ZAAL_TELEGRAM_ID=<your tg user id, used for cc tag>

# Already required by the rest of the bot:
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional Hermes overrides:
HERMES_FIXER_MODEL=opus
HERMES_CRITIC_MODEL=sonnet
HERMES_FIXER_BUDGET_USD=5
HERMES_CRITIC_BUDGET_USD=1
HERMES_REPO_URL=https://github.com/bettercallzaal/ZAOOS.git
HERMES_GIT_USER_NAME=Hermes Bot
HERMES_GIT_USER_EMAIL=hermes@thezao.com
HERMES_CLAUDE_BIN=/path/to/claude  # only if not on PATH
```

No `ANTHROPIC_API_KEY` needed - Hermes uses Claude Code CLI which reads Max-plan auth from `~/.claude/auth.json`.

## VPS Deployment

```bash
ssh zaal@31.97.148.88
cd ~/zaostock-bot
git pull
npm install

# Add the env vars above to ~/zaostock-bot/.env
chmod 600 ~/zaostock-bot/.env

# Apply hermes_runs migration in Supabase SQL editor (one-time)
# - paste contents of bot/migrations/hermes_runs.sql

# Confirm Claude Code CLI on PATH for zaal user
which claude
ls -la ~/.claude/auth.json

# Test run (manual, not via systemd):
npm run start:devz
# Should print: ZAODevzBot=@... HermesBot=@... chat=<id>
# In the Telegram group, try /whoami in DM or /fix Add a healthcheck

# Once happy, install systemd unit:
cat <<'UNIT' > ~/.config/systemd/user/zao-devz-stack.service
[Unit]
Description=ZAO Devz dual-bot (Coder + Critic)
After=network-online.target

[Service]
Type=simple
WorkingDirectory=%h/zaostock-bot
ExecStart=%h/zaostock-bot/node_modules/.bin/tsx %h/zaostock-bot/src/devz/index.ts
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now zao-devz-stack
journalctl --user -u zao-devz-stack -f  # watch boot
```

## First Test

In the ZAO Devz group, as an admin user:

```
/fix Add a /healthcheck command to the bot that returns "OK - hermes alive"
```

Expected message sequence:

```
ZAODevzBot: Got it. Spinning up the loop. Updates incoming from me + HermesBot.
ZAODevzBot: Coder starting (attempt 1/3) on run abc12345
            Issue: Add a /healthcheck command...
            Model: opus | Tools: Read/Edit/Write/Glob/Grep
[~3-5 min later]
ZAODevzBot: Coder done on run abc12345 (attempt 1). Changed 1 files:
              - bot/src/index.ts
            Handing to @HermesBot.
HermesBot:  Reviewing run abc12345. Reading diff + source. Model: sonnet.
[~30s later]
HermesBot:  Score 85/100 (PASS) on run abc12345
            Feedback: clean addition, follows existing command pattern
HermesBot:  READY. Score 85/100. PR #N: https://github.com/.../pull/N
            Run: abc12345
            cc Zaal - push when good
```

If score drops below 70:

```
HermesBot:  Score 55/100 (NEEDS REVISION) on run abc12345
            Feedback: missing Zod validation on input
ZAODevzBot: Retrying run abc12345 (attempt 2). Critic said: missing Zod validation on input
ZAODevzBot: Coder starting (attempt 2/3)...
[loops up to 3 attempts, then escalates]
```

## Safety Recap

Same as before:
- Admin-only `/fix` (BOT_ADMIN_TELEGRAM_IDS gate)
- Bot only accepts `/fix` from the configured ZAO_DEVZ_CHAT_ID
- HERMES_FORBIDDEN_PATHS refuses `bot/src/hermes/` and `.env*`
- No git commit/push tools allowed in Coder Claude Code session
- Coder runs in isolated `/tmp/hermes-{id}/` workdir, cleaned up on exit
- All actual `git push` goes through `~/bin/safe-git-push.sh` + GitHub branch protection
- Override: `ALLOW_UNSAFE_PUSH=1` for true emergencies only
