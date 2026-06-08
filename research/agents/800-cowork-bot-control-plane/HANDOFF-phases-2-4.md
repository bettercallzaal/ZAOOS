# Handoff - Bot control plane Phases 2-4 (built 2026-06-07)

All code for Phases 2 (Control), 3 (Task), 4 (Converse) is **built, typechecked, and
pushed**. Nothing below is live yet - these are the manual steps (DB / Vercel / restart /
enable) that only you can do. Do them in order.

## What shipped (code)

- **Cowork** (ZAODEVZ/ZAOcowork `main`, commit `c84cb2d`, Vercel auto-deployed):
  migration `012_bot_commands.sql`; `POST/GET /api/v1/bots/commands`,
  `POST /api/v1/bots/commands/:id/result`, `GET /api/v1/bots/:bot/commands`;
  `/bots` detail panel control affordances (admin-gated): start/stop/restart/pause,
  assign-task form, ask box, command history.
- **ZAOOS** (`claude/gifted-euler-bYhl7`, commit `3473a841`): cowork.ts command-queue
  client + `startCommandPoller`; zoe wired for `ask`/`run_task` (via `runConciergeTurn`,
  marks the todo) + pause/resume/restart; `bot/src/fleet-agent/` + staged systemd unit.
- **zaostock snapshot** (`~/zaostock-bot`, not git): re-patched in place for lifecycle
  (pause/resume/restart). Backups: `/tmp/zaostock-index.beforeP234.bak`.

Routes verified deployed (503 "apply 012" until the table exists; 401 unauthed).

## Command routing (by design)

- **bot-self** (`restart`, `pause`, `resume`, `run_task`, `ask`): the running bot polls
  its own queue and executes. Works without the fleet-agent.
- **host/fleet** (`start`, `stop`): need `systemctl`, so the `zao-fleet-agent` does them.
  `restart` is bot-self (process exits non-zero; systemd restarts).
- run_task/ask are served by ZOE only (it has a brain). zaostock reports them unsupported.

## Manual steps (in order)

### 1. Supabase SQL editor (project `etwvzrmlxeobinrlytza`) - apply migration 012

```sql
CREATE TABLE IF NOT EXISTS bot_commands (
  id           BIGSERIAL PRIMARY KEY,
  bot          TEXT NOT NULL,
  command      TEXT NOT NULL,
  args         JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'claimed', 'done', 'error')),
  result       JSONB,
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS bot_commands_bot_status_idx ON bot_commands(bot, status, created_at);
CREATE INDEX IF NOT EXISTS bot_commands_status_command_idx ON bot_commands(status, command, created_at);
```

### 2. Vercel (ZAOcowork project) - add the `fleet` token + redeploy

Replace `COWORK_BOT_TOKENS` with (adds `fleet=`; keeps the three existing tokens):

```
COWORK_BOT_TOKENS=<see chat - contains live secrets, not committed>
```

Then redeploy (the env change needs a redeploy; the code already auto-deployed).

### 3. Restart the bots to load the Phase 2-4 poller code

```
ssh zaal@31.97.148.88 'systemctl --user restart zoe-bot zaostock-bot'
```

(`zao-devz-stack` stays stopped per the prior decision.)

### 4. (Optional) Enable zao-fleet-agent - ONLY if you want UI start/stop to work

```
ssh zaal@31.97.148.88 'systemctl --user daemon-reload && systemctl --user enable --now zao-fleet-agent'
```

Risk: this starts a new always-on process that can run `systemctl --user
{start,stop,restart}` on the three known bot units only (whitelisted in code via
execFile, never arbitrary shell). Without it, pause/resume/restart/ask/run_task all
still work - only the UI start/stop buttons are inert. The unit + its token drop-in are
already staged at `~/.config/systemd/user/zao-fleet-agent.service{,.d/cowork.conf}`; the
fleet token there must match the `fleet=` entry you set in step 2.

## Verify after steps 1-3

As an admin, open `/bots`, expand a bot: you should see Control buttons, an assign-task
form, an ask box, and the command history. Try `ask` -> a reply appears in the history
within ~30s (ZOE). `pause`/`resume`/`restart` work on zoe + zaostock. `start`/`stop`
only after step 4.
