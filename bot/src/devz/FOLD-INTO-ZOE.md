# Folding ZAO Devz into ZOE (plan, 2026-11-07)

Zaal, 2026-11-07 (ruling 304): "we can remove zaodevz bot move everyhting to zoe for now tbh". This supersedes waiting two weeks for the featureRan data from #4252. In the ZAO Devz chat ZOE speaks only when tagged or replied to (ruling 300, #4258).

This note is the plan. The code is a separate held PR. `bot/src/devz/` stays in the repo, unwired, until Zaal says to delete it.

## What ZAO Devz does today, and where each piece goes

| Devz today (`bot/src/devz/index.ts`) | In ZOE after the fold |
|---|---|
| `/fix <issue>` (Devz bot, admin only via `BOT_ADMIN_TELEGRAM_IDS`, only in the `ZAO_DEVZ_CHAT_ID` chat, needs the claude CLI) | ZOE group command `/fix <issue>`, same three gates. A slash command addressed to ZOE counts as an address under ruling 300 (`isCommand`, as `/ask` does). |
| @mention of the Devz bot with 10+ characters | Not ported as "any mention is a fix". A mention of ZOE stays a normal ZOE turn (concierge). A mention that starts `fix:` (for example `@zaoclaw_bot fix: add a healthcheck`) routes to the same path as `/fix`, checked before the concierge (first-handler-wins rule 1). |
| `/fix_status [id]` on both bots | ZOE group command `/fix_status [id]`, same output (`listOpenRuns`, `getRun` from `bot/src/hermes/db.ts`). |
| `/whoami` | ZOE already has `/chatid`. Not ported. |
| `/start`, `/help` | Not ported. A ZOE `/help` per chat is Iman's item 5 in iman-desk #168, so it is left to him. |
| `POST /hermes-dispatch` on 127.0.0.1:3007 | Not ported. Its only caller in the repo is the old portal bot (`infra/portal/bin/bot.mjs`), and Zaal's VPS read on 2026-11-07 found no portal unit running. |
| Two voices: the Devz bot as Coder, the Hermes bot as Critic, narrating `HermesNarrator` events | One voice, ZOE, posting into the Devz chat with a role prefix: `Coder:` for `onCoderStart`, `onCoderDone`, `onRetry`; `Critic:` for `onCriticStart`, `onCriticDone`; plain for `onPrOpened`, `onEscalated`, `onFailed`. Built on the narrator ZOE already passes to `dispatchHermesRun` in the ZAAL BOTZ coding path (`bot/src/zoe/index.ts`), not a copy of the Devz one. |
| `featureRan` lines `devz-fix`, `devz-fix-status`, `devz-run-finished` (#4252) | Same names, emitted from ZOE, so the count carries across. |
| Heartbeat `startHeartbeat` / `startBeat` for the devz process | Gone with the process; ZOE's own heartbeat covers it. |

## What stays the same

- The Hermes pipeline itself (`bot/src/hermes/runner.ts`): coder, critic, retry up to 3, PR at score 70 or above, its own daily cap. ZOE already calls it from five places.
- PR-only. Nothing merges; the PR link lands in the chat for Zaal.
- The ZAO Devz group profile (#4256) tells ZOE what the group is.

## Order

1. This plan (held PR).
2. Code PR on ZOE: `/fix`, `fix:` after a mention, `/fix_status`, the one-voice narrator, tests with a red control. `bot/src/devz/` untouched. Off unless `ZOE_DEVZ_FOLD=1`, so ZOE and the Devz bot never both answer `/fix` in one chat.
3. CLAUDE.md and AGENTS.md Primary Surfaces rows updated (a commit on #4255 if it is still open, else a new docs PR).

## Zaal's steps, after the code PR is merged and live

1. Set `ZOE_DEVZ_FOLD=1` for zoe-bot.service on the VPS and restart it.
2. Stop and disable `zao-devz-stack.service` (`systemctl --user stop zao-devz-stack && systemctl --user disable zao-devz-stack`).
3. Remove the Devz bot and the Hermes bot from the ZAO Devz chat.
4. Later, on his word: a PR that deletes `bot/src/devz/`.

Steps 1 and 2 should happen together, so one bot answers `/fix` at a time.
