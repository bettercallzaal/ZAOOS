# North Creek helper

A Telegram bot that answers one outside collaborator's questions about his own
website, from three handoff files, and does nothing else. No tools, no repo
access, none of ZOE's memory. Design and reasons: research doc 2661
(`research/agents/2661-north-creek-helper-telegram-bot`). Zaal chose a separate bot:
vault decisions item 166, 2026-10-11.

**Merging this code starts nothing.** The unit is not enabled and the process
exits unless `HELPER_ENABLED=1`.

## What is in code, not in the prompt

| Limit | Where |
|---|---|
| Only allowlisted numeric ids reach the model, two at most; private chats only | `handle.ts`, `gate.ts` |
| Daily cap, counted before the model call, kept across restarts | `gate.ts` `capCheck` |
| Footer on every reply, the refusals and limit lines included: "I cannot commit Zaal to anything." | `gate.ts` `withFooter` |
| A pasted password, login code or key is not forwarded or logged; an answer shaped like one is not sent | `gate.ts` `looksLikeSecret` |
| The model request has no tools | `answer.ts` `buildRequest` |
| Per-user burst limit (5 questions in 5 minutes) and a 2,000 character limit on a question | `gate.ts` `rateCheck`, `handle.ts` |
| Will not start unless the token is for the pinned bot id, checked against the token and against Telegram's getMe | `gate.ts` `identityProblem` |
| One instance per host, judged by the last holder's pid and by the lock's age; heartbeat at `~/.zao/beats/nc-helper`, written only while polling succeeds | `index.ts`, `gate.ts` `pollIsFresh` |
| A model error is one fixed line to the user and an error class in the log; one call may take 60 seconds | `handle.ts`, `index.ts` |

## It fails closed

Nothing defaults to "allow". The process refuses to start when the bot token, the bot id, the model key, the allowlist or the docs directory is unset, when the allowlist has any entry that is not a numeric id, when the cap is set to something that is not a whole number from 1 to 500, when a handoff file is missing or empty, or when the cap file exists but cannot be read. While running, a cap file that cannot be read or saved means it answers nobody, with one fixed line; it never counts from zero. Only a cap file that does not exist yet starts at zero.

## What is kept, and who can read it

- Message text is never logged. The journal gets the sender's numeric id, the message length, token counts and the kind of outcome. A refused stranger's id is logged, at most once an hour; that id is how Zaal adds him.
- The journal is the VPS user journal. Measured 2026-10-11: journald there keeps 7 days (`MaxRetentionSec=7day`). It is readable by the `zaal` account, which Zaal and the lanes that ssh in use, and by root.
- The last 6 turns per user are held in memory so a follow-up makes sense. They are gone on restart and never written to disk.
- The cap file holds a date and a count, nothing else.
- His questions do leave the host: to Telegram, which carries the chat, and to the model provider, which answers it. What they keep is under their terms, not this repo's.
- The three files are his own instruction sheet and the helper may repeat them word for word. Nothing secret is ever put in the prompt.

## Zaal's steps to turn it on (none are done by merging)

1. In BotFather, make a new bot. Do not reuse any existing bot's token.
2. On the VPS, write `~/.zao/private/nc-helper.env` (mode 600) through the
   secrets flow, never pasted into a terminal pane:

   ```
   HELPER_ENABLED=1
   HELPER_BOT_TOKEN=<from BotFather>
   HELPER_BOT_ID=<the number before the colon in that token>
   ANTHROPIC_API_KEY=<a model key>
   HELPER_DOCS_DIR=/home/zaal/.zao/nc-helper/docs
   HELPER_ALLOWED_IDS=<your own numeric Telegram id; it will not start without at least one>
   # optional: HELPER_MODEL=claude-opus-5-5 (default is claude-haiku-5-5, the smallest)
   # optional: HELPER_DAILY_CAP=40
   ```

3. Copy the three files into `HELPER_DOCS_DIR`. They live in two repos:
   `AGENT.md` and `WALKTHROUGH.md` from `handoff/` in `bettercallzaal/north-creek`,
   and `README.md` from the root of `north-creek-site` (his instruction sheet;
   there is no `handoff/README.md`). After the site repo moves to his account,
   take `README.md` from his copy.
4. Install and start the unit:
   `cp bot/systemd/nc-helper.service ~/.config/systemd/user/ && systemctl --user daemon-reload && systemctl --user enable --now nc-helper`
5. Have the collaborator message the bot. It refuses and tells him his id. Add that id
   to `HELPER_ALLOWED_IDS` and `systemctl --user restart nc-helper`.

Check it: `journalctl --user -u nc-helper -n 20` shows three `loaded` lines
with file hashes and `polling as @... (id ...)`; the first real answer prints one
`[helper/ran]` line.

## Stopping it

- One person: remove the id from `HELPER_ALLOWED_IDS`, restart.
- The bot: `systemctl --user disable --now nc-helper`.
- Everywhere at once: revoke the token in BotFather.

## Updating what it knows

Copy the new files into `HELPER_DOCS_DIR` and restart. The boot log prints a
hash of each file, so a stale copy can be seen.
