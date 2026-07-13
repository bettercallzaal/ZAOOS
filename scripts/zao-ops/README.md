# zao-ops - phone-first operator toolkit for the ZAO team

Three small CLIs that turn ZOE (your Telegram bot) into a control surface: you
conduct from your phone, terminals do the work, and every decision comes back to
you as a button in one place.

Donated to the ZAO team 2026-07-11 (built in the ZAOOS lab). Generic + config-
driven - point them at your own bot + group and they work.

**New to the team?** Start with [ONBOARDING.md](./ONBOARDING.md) - it walks you through setup and your first 5 minutes.

## The tools

| Tool | What it does |
|------|--------------|
| `zao-ask` | Fire a button-question into your Telegram General topic. Any terminal/worker calls it when it needs a decision; the answer routes back by question id. |
| `zao-cockpit` | Print your operator brief in the terminal (do-first, needs-you, PRs to review, idea inbox, stale items) - reads the shared cowork tracker. |
| `zao-sweep` | Post that same brief into General so your morning is one place: read the digest, click the waiting buttons. Cron it for an auto-morning sweep. |

## The loop they create

```
capture -> a worker grinds -> it hits a decision -> zao-ask fires a button into General
        -> you sweep the buttons -> the answer routes back -> the worker ships
```

Work fans **out** (many terminals in parallel). Your input fans **in** (one button queue). You stay the conductor.

## Setup

1. A Telegram bot (BotFather) that is an admin of a forum-enabled group (Topics on).
2. Config file `~/.zao/private/tg.env` (chmod 600, never committed):

   ```
   ZOE_BOT_TOKEN=123456:your-bot-token
   ZAAL_BOTZ_GROUP_ID=-1001234567890
   ```

3. `ZAO_VPS_HOST` env var pointing at the host that runs the cockpit brief
   (defaults to the ZAO ops box). `zao-cockpit`/`zao-sweep` ssh there to build
   the brief where the tracker creds live.
4. Put the scripts on your PATH: `ln -s "$PWD"/scripts/zao-ops/zao-* ~/bin/`.

## Usage

```bash
# ask a question (buttons + a "Type my own" freetext option)
zao-ask publish "Publish the newsletter now?" "Publish" "Hold"

# read the cockpit in your terminal
zao-cockpit

# push the cockpit digest into General
zao-sweep
```

Question ids should be namespaced per terminal/task, e.g. `zaostock-publish`, so
each terminal reads back its own answers. Answers are logged by the bot to its
`recent/` store; an open session reads them via the inbox bridge.

### Targeting a different chat

If your bot (ZOE) is a member of more than one group - e.g. a project-specific
team chat alongside your main ops group - redirect a batch of asks without a
second copy of the script:

```bash
ZAO_ASK_TARGET_GID=-1009876543210 zao-ask siteleadconfirm "Confirmed for Site Lead?" "Yes" "No"
```

Falls back to `ZAAL_BOTZ_GROUP_ID` from `tg.env` when unset, so existing calls
are unaffected. `/chatid` (in the bot's other repo, `bot/src/zoe/index.ts`)
gives you the target group's id from inside that chat.

## Notes

- No secrets in these scripts - the bot token lives only in `tg.env` (gitignored).
- Telegram caps `callback_data` at 64 bytes, so `zao-ask` sends short slug codes
  on the buttons (the label is the full text).
- Design + rationale: `research/dev-workflows/1031-second-brain-system-design/`.
