# ZAO Team Bots (Magnetiq + AttaBotty)

Two conversational Telegram bots, one Node process, two separate group chats.
Sibling to the `bot/src/devz/` dual-bot stack but generalized for any 2-person
collab where Zaal pairs with a teammate.

## Architecture

```
+----------------------------------+
| zao-team-bots (systemd, VPS 1)   |
| node_modules/.bin/tsx index.ts   |
|                                   |
|  +-----------+    +-----------+   |
|  | Magnetiq  |    | AttaBotty |   |
|  | grammy    |    | grammy    |   |
|  | Bot       |    | Bot       |   |
|  +-----+-----+    +-----+-----+   |
|        |                |          |
|        v                v          |
|  +----------------------------+    |
|  | shared: brain (Claude CLI),|    |
|  | memory (Supabase), cron    |    |
|  +----------------------------+    |
+----------------------------------+
   |                              |
   v                              v
Magnetiq group               AttaBotty group
(Zaal + Tyler)              (Zaal + AttaBotty + Onagi)
```

- One TG bot per group, gated to its `chat_id`.
- Each bot has its own persona at `magnetiq/persona.md` and `attabotty/persona.md`.
- Brain = `bot/src/hermes/claude-cli.ts` (Max-plan auth, no API key).
  - Sonnet 4.6 for chat replies, $0.50 cap each.
  - Opus 4.7 for `/research` ($3 cap) and the daily summary ($1 cap).
- Memory = Supabase tables `team_bot_*` (see `bot/migrations/team_bots.sql`).
- Daily summary fires via `node-cron` at 06:00 America/New_York by default.

## Telegram setup (Zaal does this once)

1. Open @BotFather. `/newbot` twice. Suggested names:
   - `@zao_magnetiq_bot` -> token goes to `MAGNETIQ_BOT_TOKEN`
   - `@z_attabotty_bot`  -> token goes to `ATTABOTTY_BOT_TOKEN`
2. Create 2 private groups. Add the matching bot as **admin** (so it can
   read messages without `/setprivacy` weirdness):
   - "ZAO x Magnetiq" -> add Zaal + Tyler
   - "Z x AttaBotty"  -> add Zaal + AttaBotty (Onagi later)
3. Get each `chat_id`. Easiest: once bot is live, send `/whoami` in the group.
   Until then, use @RawDataBot.
4. Get each member's TG `user_id` (same `/whoami` works).

## Env vars (add to `~/zaostock-bot/.env` on VPS 1, chmod 600)

```
# Magnetiq bot
MAGNETIQ_BOT_TOKEN=<from BotFather>
MAGNETIQ_CHAT_ID=-100xxxxxxxx
MAGNETIQ_ALLOWED_IDS=<zaal_id>,<tyler_id>
MAGNETIQ_SUMMARY_CRON=0 6 * * *

# AttaBotty bot
ATTABOTTY_BOT_TOKEN=<from BotFather>
ATTABOTTY_CHAT_ID=-100xxxxxxxx
ATTABOTTY_ALLOWED_IDS=<zaal_id>,<attabotty_id>
ATTABOTTY_SUMMARY_CRON=0 6 * * *

# Shared (already used by zaostock + devz bots, do not duplicate)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional model + budget tuning (defaults are fine)
TEAMS_CHAT_MODEL=sonnet
TEAMS_RESEARCH_MODEL=opus
TEAMS_SUMMARY_MODEL=opus
TEAMS_CHAT_BUDGET=0.50
TEAMS_RESEARCH_BUDGET=3.00
TEAMS_SUMMARY_BUDGET=1.00
TEAMS_TZ=America/New_York

# Run only one bot? Useful while bootstrapping
# TEAMS_RUN=magnetiq
# TEAMS_RUN=attabotty
# TEAMS_RUN=magnetiq,attabotty  (default)
```

## Database (one-time)

Run `bot/migrations/team_bots.sql` in Supabase SQL editor.

## Local dev

```bash
cd bot
npm install
npm run dev:teams
```

You can test with `TEAMS_RUN=magnetiq` to boot only one while still
bootstrapping the other.

## VPS deploy

```bash
ssh zaal@31.97.148.88
cd ~/zaostock-bot && git pull && npm install

# add env vars (above) to ~/zaostock-bot/.env, chmod 600

# apply the migration in Supabase SQL editor (paste bot/migrations/team_bots.sql)

# confirm claude CLI on PATH (same auth Hermes uses)
which claude
ls -la ~/.claude/auth.json

# manual smoke test
npm run start:teams
# expected: "[teams/magnetiq] polling" + "[teams/attabotty] polling"
# in each group: /whoami should reply

# install systemd unit
cp bot/systemd/zao-team-bots.service ~/.config/systemd/user/zao-team-bots.service
systemctl --user daemon-reload
systemctl --user enable --now zao-team-bots
journalctl --user -u zao-team-bots -f
```

## Commands (in either group)

| Command | Who | Effect |
|---|---|---|
| `/help` | anyone | show this list |
| `/whoami` | anyone | print chat_id + your tg id |
| `/research <topic>` | allowlist | Opus runs a STANDARD-tier research pass |
| `/idea <text>` | allowlist | log idea, never forgotten |
| `/task <text>` | allowlist | log task |
| `/tasks` | anyone | list open tasks |
| `/done <id>` | allowlist | close a task |
| `/clip <url> <note>` | allowlist | log a clip-worthy moment |
| `/fact <text>` | allowlist | teach the bot a fact about the team |
| `/context` | anyone | dump what bot knows (for correction) |
| `/summary` | allowlist | run daily-summary now (cron also fires 06:00) |
| `@mention` or reply | allowlist | reactive chat reply, Sonnet, $0.50 cap |

## Behavior

- **Reactive only.** No periodic nags. Bot speaks when @mentioned, replied to,
  or `/command`-ed. Plus the daily 06:00 summary cron.
- **Allowlist enforced.** Non-allowlisted users see no replies and cannot trigger
  state-mutating commands.
- **Chat-scope gated.** The bot ignores all messages outside its configured group.
- **Memory persistent.** Every message logged to `team_bot_messages` for 24h
  context stitching. `/fact` teaches durable knowledge. `/task` creates closable
  todos. `/clip` and `/idea` are append-only.

## Safety

- No git push / git commit allowed (disallowedTools in brain.ts).
- No `Edit`/`Write` tools in brain (read-only across the repo).
- Persona files include hard rules: never reveal env vars, never invent
  commitments on Zaal's behalf, never tag external people without approval.
- Each bot is gated to a single chat_id.

## See also

- Doc 640 - Magnetiq bot product spec
- Doc 642 - AttaBotty bot product spec
- Doc 644 - ZAO agent stack canon (the template these instances follow)
