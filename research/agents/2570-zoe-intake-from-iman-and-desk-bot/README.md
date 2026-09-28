---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-28
superseded-by:
related-docs: "community/2567-iman-desk-integration, community/2566-iman-overnight-loop, agents/547-multi-agent-coordination-bonfire-zoe-hermes, agents/527-multi-bot-telegram-coordination-best-practices, agents/495-team-telegram-bot-2026-patterns"
original-query: "and /meeting and reviwe ChatExport_2026-09-28 all this and make sure we can work on my ZOE to amke it good to receive from imani and lets also prep the botfarther for iman's bot itself"
tier: STANDARD
---

# 2570 - ZOE intake from IMan, and the desk bot setup

> **Goal:** Find why ZOE loses what IMan sends her in the ZAO + IMAN group, say what to change, and have the iman-desk Telegram bot (card 10135) ready for Zaal to create in one sitting.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **FIX the escalation regex so it carries the whole message, not the first line.** One flag: add `s` to both patterns in `bot/src/zoe/groups.ts:188` | 3 of IMan's 15 "tell Zaal" relays lost 12 to 19 lines each. Zaal received only the first line of the 22 Sept list, the 27 Sept sign-in and the 27 Sept call notes |
| 2 | **WRITE every escalation into ZOE's memory for the group and for Zaal's DM** (`pushRecent`), before the early `return` at `bot/src/zoe/index.ts:2840` | The escalation path returns before `dispatchConcierge`, whose `pushRecent` at `index.ts:3197` is the only place a group turn is remembered. On 20 and 21 Sept Zaal asked ZOE about IMan's message in the group and she said "I don't have Iman's actual questions visible" |
| 3 | **RECORD untagged messages from allowlisted team members to the archive** (not the 8-turn prompt window), at the `!gate.allow` return, `index.ts:2332` | 17 of IMan's 33 messages had no tag: sign-ins, flyers, PR reviews. ZOE receives them (privacy mode is off, measured below) and drops them. Do this after 3 Oct: it changes what every group turn sees |
| 4 | **DO NOT change ZOE's privacy mode.** It is already off | `getMe` on @zaoclaw_bot, 28 Sept: `can_read_all_group_messages: true`. The loss is in ZOE's code, not Telegram |
| 5 | **CREATE the desk bot now, DM-only.** BotFather steps below. Username `imandesk_bot` | iman-desk PR #31 (merged 28 Sept) runs every 15 minutes and skips until `TELEGRAM_BOT_TOKEN` exists. No secret is set today (`gh secret list` empty) |
| 6 | **ROUTE numbered answers to the newest open `for-zaal` issue** (small follow-up PR to `scripts/tg-to-desk.mjs`) | The script sends "1 yes, 2 no" to the newest `tonight` issue. The overnight loop is off (#38) and 0 `tonight` issues are open, so answers land as a new issue titled "1 yes, 2 no" with no link to the questions |

## Findings

### A. What the ZAO + IMAN export shows (19 to 28 Sept 2026)

Source: `~/Downloads/Telegram Desktop/ChatExport_2026-09-28/messages.html`, parsed in full. 67 messages; 33 from IMan.

| Measure | Count |
|---|---|
| IMan messages | 33 |
| IMan "tell Zaal" escalations ZOE acknowledged with "Noted. I have passed this message directly to Zaal's priority inbox." | 15 |
| Escalations longer than one line (truncated in the DM to Zaal) | 3, dropping 19, 12 and 14 lines |
| IMan messages with no @zaoclaw_bot tag (never enter ZOE memory) | 17 |
| Times Zaal asked ZOE in the group about IMan's message and she had nothing | 2 (20 Sept 19:04 "Iman just asked some questions", 21 Sept 17:54 "can u review") |

IMan worked around it on 21 Sept by posting the questions again as plain text: "The questions you asked ZOE about last night, she did not show you, so here they are plain". The desk also recorded the truncation on 18 Sept ("rest of the note cut off in the relay").

IMan posts most updates twice, once plain and once tagged. With fix 2 and 3 the plain copy is enough.

### B. The three code paths (ZAOOS main, 1afa280, 28 Sept)

| # | Where | What happens |
|---|---|---|
| 1 | `bot/src/zoe/groups.ts:188` `detectGroupEscalation` | `/(?:tell\|ask\|...)\s+zaal...\s*(.+)/i`. Without the `s` flag, `.` stops at the first newline, so `note` is line one only. The DM to Zaal and the task title both carry the stub |
| 2 | `bot/src/zoe/index.ts:2816-2840` `handleGroupMessage` | Sends the DM, adds a task, replies "Noted", then `return`. `pushRecent` is never called for the group or for Zaal's DM scope |
| 3 | `bot/src/zoe/index.ts:2332` gate | `if (!gate.allow) { ... return; }`. An untagged message is logged to the console and dropped |

Memory shape: `bot/src/zoe/memory.ts:564` `pushRecent` keeps a ring buffer of `RECENT_MAX = 8` turns as the prompt window, and archives each turn. So fix 3 must write to the archive only, or IMan's long sign-ins push Zaal's own turns out of the 8-turn window.

### C. Telegram side

- **ZOE's privacy mode is off.** `getMe` for `@zaoclaw_bot`, 28 Sept 2026 (token read from `~/.zao/private/tg.env`, not printed): `can_join_groups: true`, `can_read_all_group_messages: true`. Doc `agents/547-multi-agent-coordination-bonfire-zoe-hermes` says "ZOE: PM-only, privacy mode irrelevant". That is stale: ZOE has been in groups since at least 19 Sept.
- Telegram, Bot Features: "By default, all bots added to groups run in Privacy Mode and only see relevant messages and commands", and privacy mode "can be disabled so that the bot receives all messages like an ordinary user (the bot will need to be re-added to the group for this change to take effect)."
- Telegram, Bot FAQ: "bots will not be able to see messages from other bots regardless of mode." The ZAO + IMAN group holds 6 other bots. None of them can read ZOE, and ZOE cannot read them.
- Telegram, Bot API: updates "will not be kept longer than 24 hours". The desk bot's 15-minute poll has a 24-hour margin; a day of failed Actions runs loses messages. The workflow header already says so.
- GitHub Actions: "The schedule event can be delayed during periods of high loads ... High load times include the start of every hour." The desk workflow already runs off the hour. Also: "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days."
- Community, grammY #563 (2024): a grammY user saw only `/commands` in a group and "solved by turning off privacy mode in BotFather prompt." ZOE runs grammY `^1.29.0`. Same library, but ZOE's symptom is not this one: her messages arrive and her code drops them.

### D. The desk bot, what it needs (iman-desk PR #31, merged 28 Sept)

| Item | State, 28 Sept |
|---|---|
| `scripts/tg-to-desk.mjs` + `.github/workflows/telegram-to-desk.yml` | On main, workflow `active` |
| `TELEGRAM_BOT_TOKEN` Actions secret | Not set (`gh secret list --repo ZAODEVZ/iman-desk` returns 0) |
| `TELEGRAM_ALLOWED_USER_ID` Actions variable | Not set (`gh variable list` returns 0) |
| Can Zaal set them? | Yes. GitHub: "For a personal account repository, you must be a repository collaborator." `bettercallzaal` has `push: true`, `admin: false` on the repo |
| Runs so far | 0 |

Usernames probed on t.me, 28 Sept (a control check found both `zaoclaw_bot` and `BotFather`): `imandesk_bot`, `iman_desk_bot`, `zaoimandesk_bot`, `idesk_zao_bot` show no profile. That means likely free; BotFather has the final word.

## BotFather, step by step (Zaal, phone, about 5 minutes)

1. Open @BotFather, send `/newbot`.
2. Name: `IMan Desk`.
3. Username: `imandesk_bot`. If taken: `iman_desk_bot`, then `zaoimandesk_bot`.
4. BotFather replies with the token. **Do not paste it anywhere in Telegram or chat.**
5. `/setjoingroups` -> pick the bot -> `Disable`. It is a DM inbox for Zaal only. Nobody can add it to a group.
6. `/setdescription`: `Zaal's line to IMan's desk. Messages become desk issues on ZAODEVZ/iman-desk. Answers that start with a number go to IMan's open questions.`
7. `/setcommands`: leave empty. The script reads plain messages.
8. At the Mac: run `/secret` and set `TELEGRAM_BOT_TOKEN` as an Actions secret on `ZAODEVZ/iman-desk`. The value never enters a transcript.
9. From the phone, send the bot one message, e.g. `test`.
10. Wait for the next run (at most 15 minutes), or run the workflow by hand. The log prints `sender id <n>`. Set that number as the Actions variable `TELEGRAM_ALLOWED_USER_ID`.
11. Send `test 2`. Done when the bot replies "On the desk: <issue link>".

Privacy mode (`/setprivacy`) does not matter here: step 5 keeps the bot out of groups, and private chats are always delivered.

## Also See

- [community/2567-iman-desk-integration](../../community/2567-iman-desk-integration/) - the phone-to-desk design this bot implements
- [community/2566-iman-overnight-loop](../../community/2566-iman-overnight-loop/) - the loop that was switched off on 27 Sept (#38)
- [agents/547-multi-agent-coordination-bonfire-zoe-hermes](../547-multi-agent-coordination-bonfire-zoe-hermes/) - privacy mode per bot; its ZOE row is stale
- [agents/527-multi-bot-telegram-coordination-best-practices](../527-multi-bot-telegram-coordination-best-practices/)
- [agents/495-team-telegram-bot-2026-patterns](../495-team-telegram-bot-2026-patterns/)
- Vault card 10135 (BotFather, due 28 Sept)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Create the desk bot in BotFather (steps 1 to 7). Done when BotFather shows `@imandesk_bot` with joins disabled | @Zaal | Phone | 2026-09-28 |
| Set `TELEGRAM_BOT_TOKEN` via `/secret`, then `TELEGRAM_ALLOWED_USER_ID` from the run log (steps 8 to 11). Done when the bot replies with an issue link | @Zaal | Mac | 2026-09-28 |
| ZAOOS PR: `s` flag on the escalation regex + `pushRecent` to group and DM scope on escalation. Done when merged and a two-line test message from a non-Zaal account reaches Zaal's DM whole | @Zaal (merge, VPS test); Zaal's iman-desk lane writes it | PR | 2026-09-30 |
| iman-desk PR: numbered answers go to the newest open `for-zaal` issue when no `tonight` issue is open. Done when IMan merges it | IMan merges; Zaal's iman-desk lane writes it | PR | 2026-09-30 |
| ZAOOS PR: archive untagged messages from `member_allowlist` in groups, not the 8-turn window. Done when merged and ZOE answers "what did IMan post today" from the group | @Zaal | PR | 2026-10-07 |
| Correct the ZOE row in doc agents/547 ("PM-only") to "groups, privacy off, measured 2026-09-28". Done when the edit is merged | @Zaal | PR | 2026-10-07 |

## Sources

- [FULL, method: file parse] ZAO + IMAN Telegram export, 19 to 28 Sept 2026, `~/Downloads/Telegram Desktop/ChatExport_2026-09-28/messages.html` (local, not public)
- [FULL, method: git show origin/main] `bot/src/zoe/groups.ts`, `bot/src/zoe/index.ts`, `bot/src/zoe/memory.ts`, ZAOOS 1afa280
- [FULL, method: Bot API getMe] @zaoclaw_bot, 28 Sept 2026
- [FULL, method: curl + HTML strip] [Telegram Bot Features, Privacy Mode](https://core.telegram.org/bots/features#privacy-mode), verified 2026-09-28
- [FULL, method: curl + HTML strip] [Telegram Bot FAQ](https://core.telegram.org/bots/faq), verified 2026-09-28
- [FULL, method: curl + HTML strip] [Telegram Bot API, Getting updates](https://core.telegram.org/bots/api#getting-updates), verified 2026-09-28
- [FULL, method: curl + HTML strip] [GitHub Docs, Events that trigger workflows: schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), verified 2026-09-28
- [FULL, method: curl + HTML strip] [GitHub Docs, Using secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), verified 2026-09-28
- [FULL, method: gh api] [grammY issue #563, "How do I listen for every messages in a group chat?"](https://github.com/grammyjs/grammY/issues/563), 2 comments
- [FULL, method: gh api] [iman-desk PR #31](https://github.com/ZAODEVZ/iman-desk/pull/31) and `scripts/tg-to-desk.mjs` on main
