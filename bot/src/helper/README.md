# North Creek helper

A Telegram bot that answers one outside collaborator's questions about his own
website, from three handoff files, and does nothing else. No tools, no repo
access, none of ZOE's memory. Design and reasons: research doc 2661
(`research/agents/2661-brian-helper-telegram-bot`). Zaal chose a separate bot:
vault decisions item 166, 2026-10-11.

**Merging this code starts nothing.** The unit is not enabled and the process
exits unless `HELPER_ENABLED=1`.

## What is in code, not in the prompt

| Limit | Where |
|---|---|
| Only allowlisted numeric ids reach the model; private chats only | `handle.ts`, `gate.ts` |
| Daily cap, counted before the model call, kept across restarts | `gate.ts` `capCheck` |
| Footer on every answer: "I cannot commit Zaal to anything." | `gate.ts` `withFooter` |
| A pasted password, login code or key is not forwarded or logged | `gate.ts` `looksLikeSecret` |
| The model request has no tools | `answer.ts` `buildRequest` |
| Will not start on another bot's token | `gate.ts` `tokenCollision` |
| One instance per host; heartbeat at `~/.zao/beats/nc-helper` | `index.ts` |

Message text is never logged. The journal gets ids, sizes and token counts.

## Zaal's steps to turn it on (none are done by merging)

1. In BotFather, make a new bot. Do not reuse any existing bot's token.
2. On the VPS, write `~/.zao/private/nc-helper.env` (mode 600) through the
   secrets flow, never pasted into a terminal pane:

   ```
   HELPER_ENABLED=1
   HELPER_BOT_TOKEN=<from BotFather>
   ANTHROPIC_API_KEY=<a model key>
   HELPER_DOCS_DIR=/home/zaal/.zao/nc-helper/docs
   HELPER_ALLOWED_IDS=<your id>
   # optional: HELPER_MODEL=claude-haiku-5-5   HELPER_DAILY_CAP=40
   ```

3. Copy `AGENT.md`, `README.md` and `WALKTHROUGH.md` from the site repo's
   `handoff/` folder into `HELPER_DOCS_DIR`.
4. Install and start the unit:
   `cp bot/systemd/nc-helper.service ~/.config/systemd/user/ && systemctl --user daemon-reload && systemctl --user enable --now nc-helper`
5. Have Brian message the bot. It refuses and tells him his id. Add that id
   to `HELPER_ALLOWED_IDS` and `systemctl --user restart nc-helper`.

Check it: `journalctl --user -u nc-helper -n 20` shows three `loaded` lines
with file hashes and `polling as @...`; the first real answer prints one
`[helper/ran]` line.

## Stopping it

- One person: remove the id from `HELPER_ALLOWED_IDS`, restart.
- The bot: `systemctl --user disable --now nc-helper`.
- Everywhere at once: revoke the token in BotFather.

## Updating what it knows

Copy the new files into `HELPER_DOCS_DIR` and restart. The boot log prints a
hash of each file, so a stale copy can be seen.
