---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-09-30
superseded-by:
related-docs: "agents/2570-zoe-intake-from-iman-and-desk-bot, dev-workflows/763-kanban-async-team-best-practices, agents/2174-bidirectional-relay-feedback-loops, agents/495-team-telegram-bot-2026-patterns"
original-query: "Much better now let's research other agents and what they do and the skills we can build into ours"
tier: STANDARD
---

# 2579 - Desk bot: what other agents do, and the skills to build into ours

> **Goal:** Compare @imanzaodesk_bot with async standup bots, Telegram AI bots and a Claude Code Telegram bridge, and rank the skills worth building into ours for Zaal (phone only, short messages) at free-model cost.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **BUILD tap-to-answer buttons first.** IMan's questions arrive as a message with Yes / No / "Say what" buttons; a tap posts "Answers from Zaal" on the issue | Zaal answers by number today, typed on a phone. Telegram inline keyboards ("a special keyboard with predefined reply options") turn that into one tap. No model call, so free |
| 2 | **BUILD one daily digest at 7:30 AM ET**: what IMan finished overnight, what waits on Zaal, anything stuck 2+ days | Geekbot's core promise is "Scheduled summaries that highlight your teams participation, blockers". The push-on-commit updates already cover "what moved"; the digest adds "what is stuck" once a day |
| 3 | **PUT the digest on Vercel Cron, not GitHub Actions** | Actions ran our 15-minute schedule 4 to 7 hours apart on 29 Sept (doc 2570, measured). Vercel Hobby allows one cron a day at ±59 min; Pro allows per-minute. One a day is all the digest needs |
| 4 | **LEAD every summary with blockers, not activity** | The strongest criticism of standup tools (HN, Spinach launch, 290 points): they turn standups into status reports; "the point of having the team together daily is to raise exceptions/problems/blockers". /waiting and the "stuck" line carry the value |
| 5 | **AFTER 3 Oct: voice notes and screenshots become real issues** | Both big Telegram bots do voice transcription (Whisper). Zaal sends screenshots and voice constantly; today they file as "open it in the chat". Needs a free transcription route, not yet measured |
| 6 | **SKIP for now:** polls/surveys, retros, planning poker, per-user budgets, a Claude Code bridge | Built for 10+ person teams (Standuply "50,000 businesses") or for coding from the phone. The desk has two people and a $1 cap |
| 7 | **BORROW ideas only from claude-code-telegram, no code** | It has no LICENSE file (checked LICENSE, LICENSE.md, LICENSE.txt: all 404), so all rights reserved |

## Findings

### A. What we have (iman-desk main, 30 Sept)

| Skill | Where |
|---|---|
| Messages become desk issues (Zaal to IMan, IMan to Zaal) | `api/_desk-bot.js` `handleUpdate` |
| Questions answered from the desk, free Nemotron only | `?`, `/ask`, `/status`, `/waiting`, `/updates` |
| IMan's desk pushes messaged to Zaal, one short message per item | `.github/workflows/desk-updates-to-telegram.yml`, `scripts/tg-notify.mjs` |
| Instant replies and "typing..." | `api/telegram.js` (webhook merged, waiting on Vercel settings, desk #51) |

### B. What the others do

| Agent | Kind | What it does that we do not | Fit for the desk |
|---|---|---|---|
| **Geekbot** (Slack, Teams) | Async standup bot | "The bot comes to you!": it starts the standup and collects answers; scheduled summaries with participation, blockers and sentiment; polls; now an MCP server and CLI for AI agents. Free up to 10 users | Digest (decision 2); blockers first (4). Skip polls |
| **Standuply** (Slack, Teams) | Standup and agile bot | Standups by text, voice or video; retros; backlog grooming; planning poker; To-Dos synced with Jira and GitHub; 30-day trial | Voice notes (5). The rest is for scrum teams |
| **n3d1117/chatgpt-telegram-bot** (3,463 stars, last push 3 Jun 2025, GPL-2.0) | Telegram AI chat | Typing indicator, allowed-users list, Whisper voice transcription, vision, per-user token budgets and `/stats`, conversation summaries, plugins | We already have typing and allow-listing. Voice and vision (5) |
| **overwirehq/claude-code-telegram** (2,797 stars, last push 22 Sept 2026, no licence) | Claude Code from Telegram | Session memory per project; "Quick actions system with context-aware buttons"; webhooks from GitHub routed through the agent for summaries; cron scheduler; "Persistent typing indicator"; voice transcription; audit log | Buttons (1), scheduled jobs (2). A coding bridge is out of scope |

### C. Why buttons come first

- Telegram, Bot Features: "Whenever your bot sends a message, it can display a special keyboard with predefined reply options." Inline buttons send a callback the bot handles. That fits the webhook we already have.
- Every IMan question already carries a default (CLAUDE.md, "Ask with a default"). So a question becomes three buttons: **Yes (the default)**, **No**, **Say what**. A tap posts `Answers from Zaal` with the question number on the issue. No typing, no model, no cost.
- claude-code-telegram lists "context-aware buttons" as a core feature for the same reason: a phone user taps faster than they type.

### D. Why a digest, and why blockers lead

- Geekbot sells "Scheduled summaries" and "Identify blockers as they happen".
- On HN (Launch HN: Spinach.io, 2022, 290 points, 181 comments), the top critics say standup tools shrink into status reports. One: "Progress can be reported asynchronously... the point of having the team together daily is to raise exceptions/problems/blockers". Another: "the chance of miscommunication increased when we introduced tooling like this."
- So the digest leads with **what is stuck** (for-iman issues with no IMan comment for 2+ days, for-zaal issues older than a day) and **what waits on Zaal**, then what moved. It is 3 to 6 short messages, under the one-item-per-message rule set on 30 Sept.

### E. Where it runs

| Option | How often | Fit |
|---|---|---|
| GitHub Actions schedule | Promised every 15 min; measured 4 to 7 h apart on 29 Sept | No |
| **Vercel Cron** | Hobby: "once per day", "Per-hour (±59 min)". Pro: once per minute | **Yes**, one daily digest. The vault logged thezao's team moving to Pro on 28 Sept; if so, precision is per-minute |
| An always-on box (Pi, VPS) | Any | Only if a second daily job appears |

## Also See

- [agents/2570-zoe-intake-from-iman-and-desk-bot](../2570-zoe-intake-from-iman-and-desk-bot/): the bot's setup and the Actions schedule measurement
- [dev-workflows/763-kanban-async-team-best-practices](../../dev-workflows/763-kanban-async-team-best-practices/)
- [agents/2174-bidirectional-relay-feedback-loops](../2174-bidirectional-relay-feedback-loops/)
- [agents/495-team-telegram-bot-2026-patterns](../495-team-telegram-bot-2026-patterns/)
- iman-desk #51 (webhook settings), `docs/telegram.md`

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Put the four webhook settings in Vercel and Redeploy (desk #51). Done when `/status` answers in under a minute | @Zaal | Setup | 2026-10-01 |
| Tap-to-answer buttons: IMan's numbered questions reach Zaal with Yes / No / Say what; a tap posts "Answers from Zaal" on the issue. Done when a tap lands on a test issue | Zaal's iman-desk lane builds; @Zaal merges | PR | 2026-10-02 |
| Daily 7:30 AM ET digest on Vercel Cron: stuck, waiting on Zaal, then moved, one short message each. Done when it arrives two mornings running | Zaal's iman-desk lane builds; @Zaal merges | PR | 2026-10-06 |
| Measure a free transcription route for voice notes (e.g. a free multimodal model on OpenRouter) and write the result in this doc. Done when one Zaal voice note becomes an issue with its text | Zaal's iman-desk lane | Research | 2026-10-08 |
| Screenshots: attach the image to the filed issue instead of "open it in the chat". Done when a photo from Zaal shows in the issue | Zaal's iman-desk lane builds; @Zaal merges | PR | 2026-10-10 |

## Sources

- [FULL, method: curl + HTML strip] [Geekbot home](https://geekbot.com/), fetched 2026-09-30
- [FULL, method: curl + HTML strip] [Standuply home](https://standuply.com/), fetched 2026-09-30
- [FULL, method: gh api README] [overwirehq/claude-code-telegram](https://github.com/overwirehq/claude-code-telegram), 2,797 stars, last push 2026-09-22; LICENSE, LICENSE.md, LICENSE.txt all 404 on raw.githubusercontent.com
- [FULL, method: gh api README + LICENSE file] [n3d1117/chatgpt-telegram-bot](https://github.com/n3d1117/chatgpt-telegram-bot), 3,463 stars, last push 2025-06-03, GPL-2.0 (from the LICENSE file)
- [FULL, method: HN Algolia API, 6 largest comment threads] [Launch HN: Spinach.io (YC W22) - Better daily standups](https://news.ycombinator.com/item?id=32911232), 2022-09-20, 290 points, 181 comments
- [FULL, method: curl + HTML strip] [Vercel Cron Jobs, usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing), fetched 2026-09-30
- [FULL, method: curl + HTML strip] [Telegram Bot Features, keyboards](https://core.telegram.org/bots/features), fetched 2026-09-28
- [FULL, method: code read] ZAODEVZ/iman-desk main: `api/_desk-bot.js`, `api/telegram.js`, `scripts/tg-notify.mjs`, 2026-09-30
