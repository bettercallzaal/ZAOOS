---
topic: community
type: audit
status: draft
last-validated: 2026-09-27
superseded-by:
related-docs: "2566, 2253, 2090, 2244"
original-query: "can we loop on researhcing more of how to integrate imans desk"
tier: STANDARD
---

# 2567 - Wiring iman-desk into the rest of the ZAO estate

> **Goal:** ZAODEVZ/iman-desk is where Iman's work and Zaal's rulings meet.
> Today it touches the rest of the estate (vault, board, tracker, ZOE,
> Telegram, Postiz, the live sites) mostly by a lane retyping things. This doc
> takes one integration point at a time, measures how that piece works today
> from its code and data, and ends each section with one build step.

Written a section per pass of a research loop, 27 Sept 2026. Counts only; no
private chat content. Builds on [community/2566](../2566-iman-overnight-loop/)
(the overnight loop), which is live on the desk as PRs #22 to #27.

## Key Decisions

| Integration point | Call | Section |
|---|---|---|
| Telegram to desk capture | **BUILD, issues not files, token first** | 1 |
| Board (thezao.xyz/today) | pending | - |
| Vault decisions to desk | pending | - |
| zao-tracker | pending | - |
| ZOE | pending | - |
| Postiz | pending | - |
| Uptime and claims guards | pending | - |
| Iman's other ZAODEVZ repos | pending | - |

## The map (measured 27 Sept)

| Point | Direction | How it moves today |
|---|---|---|
| Vault decisions | vault to desk | A lane reads `decisions/` and comments on a `for-iman` issue by hand |
| Board card | desk to board | dotfiles #379: a job on Zaal's Mac at 05:20, 07:40 and 09:10 ET turns the Morning report into a card |
| Telegram | Zaal to desk | Nothing. Rulings sent by DM reach the desk only if a lane or Iman retypes them |
| Postiz | desk to socials | Nothing yet. Desk #30 asks Iman to set it up, due 30 Sept |
| Live sites | sites to desk | Nothing. The desk's README lists 12 live addresses, and nothing checks them |

## 1. Telegram to desk capture

**What exists.** `ZAODEVZ/ZAOartizen` carries a Telegram capture bot:
`.github/workflows/telegram-capture.yml` plus `scripts/tg-capture.mjs`
(229 lines, Node 22). Every 15 minutes, a GitHub job calls Telegram's
`getUpdates` and keeps only messages from an allow-list
(`TELEGRAM_ALLOWED_CHATS`, `TELEGRAM_ALLOWED_USERS`). It refuses to run with an
empty list. It appends each message to `meetings/raw/`, saves the offset to a
committed file, and commits. A `concurrency` group stops two runs from
double-capturing, and the push retries a rebase three times.

**What it has done.** Nothing. Measured from the Actions API, 27 Sept:

| Measure | Value |
|---|---|
| Runs since the first on 21 Sept | 37 |
| Failed | **37 of 37** |
| Error in the latest run | `TELEGRAM_BOT_TOKEN is not set. See meetings/telegram-bot.md.` |
| Commits ever touching `meetings/raw` | 1 |

The code has never been exercised against a live bot. The only missing
piece is a one-time secret, and nobody has added it in six days. This is the
2244 posting failure again: the missing step is setup, not code.

**Why it matters for the desk.** It is the one integration that changes how
a ruling travels. From Monday 28 Sept Zaal is off the Mac. Today a ruling
given by phone reaches the desk only if a lane retypes it (the 15 Sept review
found 5 of 11 Needs-Zaal rows already answered but never relayed). A bot Zaal
can message, turning each message into a `for-iman` issue, removes the lane
from that path.

**What to change when porting it.**

| ZAOartizen does | iman-desk should |
|---|---|
| Append to `meetings/raw/*.md` and commit | Open a `for-iman` issue per message, titled from its first line, labelled `from-telegram` |
| Commit an offset file on every run | Keep the offset in a repo variable, or commit it on its own. The desk's `main` is also Iman's working branch, so a commit every 15 minutes would bury his history |
| Fail loudly without a token (37 red runs) | Skip with a notice while the token is absent, like `bettercallzaal/zaalcaster`'s `post-due.yml`, and start failing once it is set and the call breaks |
| Allow a chat list | Allow **Zaal's user id only**. A desk issue is an instruction to Iman, so only Zaal's messages count |

**The gated parts, stated plainly.** Creating the bot (BotFather), putting its
token in the repo's Actions secrets, and finding Zaal's numeric user id are
Zaal's steps, through `/secret`. The token never appears in chat, the desk or
this doc. Nothing here posts publicly. The bot only reads what is sent to it.

**Build step.** A PR to iman-desk adding `.github/workflows/telegram-to-issue.yml`
and `scripts/tg-to-issue.mjs`, adapted from `tg-capture.mjs` as in the table.
It is done when a dry run passes with the token absent (a skip, not a red
run) and one message from Zaal's id becomes one `for-iman` issue. Owner:
Zaal's iman-desk lane builds it. Zaal adds the token. Iman merges.

Also for ZAOartizen itself: its capture should skip rather than fail while the
token is unset. 37 red runs teach its readers to ignore red, the same point
Vault made about the desk's Vercel status.

## Also See

- [community/2566 - The overnight loop](../2566-iman-overnight-loop/)
- [community/2253 - Working with Iman: every friction is structural](../2253-iman-workflow-structural-frictions/)
- [cross-platform/2244 - The posting platform decision](../../cross-platform/2244-posting-platform-decision/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Build `telegram-to-issue` on iman-desk; done when a message from Zaal's id becomes a `for-iman` issue and a tokenless run skips green | Zaal's iman-desk lane | PR | 2026-09-30 |
| Create the bot and add `TELEGRAM_BOT_TOKEN` to iman-desk Actions secrets via `/secret`; done when the secret is listed in repo settings | @Zaal | Setup | 2026-09-30 |
| Make ZAOartizen's capture skip while the token is unset; done when its next scheduled run is green | Zaal's iman-desk lane | PR | 2026-10-06 |

## Sources

- `ZAODEVZ/ZAOartizen` `.github/workflows/telegram-capture.yml` and `scripts/tg-capture.mjs` `[FULL]`, method: `gh api` contents, read 27 Sept.
- `ZAODEVZ/ZAOartizen` Actions runs for `telegram-capture.yml` `[FULL]`, method: `gh api .../runs?per_page=100`, conclusions counted; failed log read with `gh run view --log-failed`.
- `bettercallzaal/zaalcaster` `.github/workflows/post-due.yml` `[FULL]`, method: `gh api` contents (the skip-when-unset pattern).
- `ZAODEVZ/iman-desk` at origin/main, README Live table and open issues `[FULL]`, method: `git` and `gh`.
- [Telegram Bot API, getUpdates](https://core.telegram.org/bots/api#getupdates) `[FULL]`, method: curl plus HTML strip. Confirms the offset rule: an update counts as confirmed once `getUpdates` is called with a higher offset, and incoming updates are kept for at most 24 hours. A day of failed runs therefore loses messages..
