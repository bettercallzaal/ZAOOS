---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-06
superseded-by:
related-docs: "agents/2570-zoe-intake-from-iman-and-desk-bot, agents/2579-desk-bot-skills-from-other-agents"
original-query: "how can i improve his agent, lets resaerach online what might help"
tier: STANDARD
---

# 2627 - Desk bot: what to improve next (context, memory, voice and screenshots, quota)

> **Goal:** Rank the next improvements to @imanzaodesk_bot (ZAODEVZ/iman-desk) for Zaal and IMan, from what the code reads today and from how other small Telegram agents are built in 2026, staying on free Nemotron models.

"His agent" is read here as the desk bot IMan and Zaal both message. IMan's Claude Code side is covered only where the bot can feed it (decision 6).

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **FIX what the bot reads before adding anything.** Build the answer context from sections, not from the first 9,000 characters of README.md | Measured 6 Oct on iman-desk main: README.md is 29,441 bytes and `api/telegram.js` line 100 reads `file("README.md", 9000)`. The first 9,000 characters hold one `## ` heading, the pre-festival ZAOstock record. "Needs Zaal" (line 66), "Live now", "Unfinished" and "Working towards" are never sent to the model. So `/waiting` answers from STATUS.md and issue titles only |
| 2 | **ADD issue comments and the todo file to the context.** For `/waiting` and `?` questions, include the last 3 comments of each open `for-zaal` issue and `drafts/2026-10-04-all-todos.md` | The context has issue titles only (`#N [labels] title`). IMan's real asks live in comments (example: desk #65, where his 6 Oct question is a comment, not the title). Nemotron Lightning and Ultra take 1,000,000 tokens of context, so size is not the limit; the 9,000-character cut is ours |
| 3 | **ADD a small memory file the bot reads on every question: `bot/MEMORY.md`, 1,200 characters or less, edited by PR** | Every builder surveyed lands on plain markdown the human can read and correct. "Memory quality matters more than model quality" (dev.to, 23 Mar 2026). Ours would hold the settled facts the bot keeps getting asked: names only and no @s, no "rain or shine" in new copy, which partners are retired, who merges what |
| 4 | **BUILD voice notes and screenshots with a Nemotron model, no new vendor.** USE `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | Measured 6 Oct from the OpenRouter models API: 16 free models of 466; this one lists input `text, audio, image, video`, 256,000 context, tools. It is `nvidia/` and `:free`, so it passes the bot's existing filter and Zaal's Nemotron-only rule. Telegram lets bots download files up to 20 MB, which covers voice notes and screenshots |
| 5 | **MEASURE the daily quota and show it: add `/usage`.** | OpenRouter free models: 20 requests a minute, and **50 a day** if the account has bought under 10 credits all time, **1,000 a day** at 10 or more. Zaal set a $1 cap; whether the account ever bought 10 credits is UNKNOWN from this lane. One question can cost 3 requests (the fallback chain), so 50 a day is about 16 questions across both people. `GET /api/v1/key` returns `free_model_daily_requests {used, limit, remaining}` |
| 6 | **MAKE the morning digest quiet when nothing is stuck, and add an evening one for IMan's morning** | OpenClaw's heartbeat exists to "surface anything that needs attention without spamming you" and replies `NO_REPLY` when nothing does. Our digest always sends 4 messages. IMan starts his day around 1 AM ET and gets no digest at all; a second cron at 04:30 UTC gives him "what Zaal answered and asked overnight" |
| 7 | **SKIP:** vector databases, knowledge graphs, an always-on server, a self-editing agent | Volna's three-layer memory (Letta, daily logs, Neo4j) and SHIBA's TiDB index solve months of personal chat history. The desk's memory is already the repo. HN users report self-modifying agents on cheap models "write something unexpected into its config json, restart and crash" |

## Findings

### A. What the bot reads today (measured, iman-desk origin/main, 6 Oct 18:0x ET)

| Source | Limit in code | Real size | What is lost |
|---|---|---|---|
| STATUS.md | 6,000 chars | 1,809 bytes | Nothing |
| README.md | 9,000 chars | 29,441 bytes | Everything after the pre-festival section: Needs Zaal, Suggestions, Live now, Unfinished, Working towards |
| Newest `updates/YYYY-MM-DD.md` | 5,000 chars | varies | Tail of long days |
| Open issues | titles and labels, 60 | 9 open today | Every body and comment |
| TIMELINE.md (15,769 bytes), `projects/`, `drafts/` (47 files) | not read | | "What has IMan done?" cannot be answered |

Code: `api/telegram.js` lines 87 to 106 (`deskContext`), `api/_desk-bot.js` line 84 (`max_tokens: 700`).

The grounding check (`grounded()`, drops lines citing an issue number that is not in the context) stays. With comments added it gets more to check against.

### B. Media: today a voice note is filed as "open it in the chat"

`api/_desk-bot.js` line 225 labels the message `voice note`, `photo`, `file` or `video` and files an issue with the caption only. Doc 2579 parked this until after 3 Oct for want of a free transcription route. The route now exists inside the allowed vendor:

| Model (all `:free`, all live on 6 Oct by `zao-openrouter-preflight`) | Input | Context | Use |
|---|---|---|---|
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | text, audio, image, video | 256,000 | Transcribe a voice note; read a screenshot |
| `nvidia/nemotron-3-super-120b-a12b:free` | text | 262,144 | Answers; lists structured outputs |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | text | 1,000,000 | Answers, fallback |
| `nvidia/nemotron-3.5-lightning:free` | text | 1,000,000 | Answers, fallback |
| `nvidia/nemotron-3.5-content-safety:free` | text, image | 128,000 | Not needed for two allow-listed users |

Flow: `getFile` then download (Telegram: "bots can download files of up to 20MB in size"), send to the omni model, put the transcript or the description in the issue body under a "Transcript (machine, unchecked)" heading, keep the Telegram link. Other builders keep the raw input beside the summary and never overwrite it (Hermes journal guide: "Save the raw input ... Never overwrite Raw with your interpretation"). Transcription quality on this model is NOT measured here; test with 5 real voice notes before trusting it.

### C. Memory: what small agents do in 2026

| Agent | Memory design | Take for the desk |
|---|---|---|
| Claude Code + Obsidian companion (Nate Lemos, 13 Feb 2026) | Markdown only. Ephemeral notes per session; a daily task "Reads all ephemeral memory files, deduplicates, and synthesizes into long-term memory". "The system is deliberately simple because simple systems are reliable" | One small file, kept short by hand |
| Volna (Vlad Arbatov, 11 Mar 2026) | Three layers: Letta core blocks, daily episodic logs with a three-day window, Neo4j graph. Explicit character budgets per layer; writes happen after the reply | The budget idea: a fixed cap on what rides in every prompt |
| "I built my own AI that lives on Telegram" (dev.to, 23 Mar 2026) | Markdown files read before every conversation. "Scheduled tasks are the MVP" | Confirms digest first, memory second |
| SHIBA (Apache-2.0 per its README, not verified against the LICENSE file) | Markdown plus git as source of truth; forwarded or pasted text is marked untrusted and never auto-promoted | Do not let the bot write its own memory from chat |

The desk already has the hard part: the repo is the memory, and humans keep it. The missing piece is a short always-loaded file of settled facts, which is what SOUL.md, USER.md and CORE.md are in those systems. Edited by PR, never by the bot.

### D. Quota and free-model behaviour

- OpenRouter limits (raw doc, 6 Oct): `FREE_MODEL_RATE_LIMIT_RPM = 20`, `FREE_MODEL_NO_CREDITS_RPD = 50`, `FREE_MODEL_HAS_CREDITS_RPD = 1000`, `FREE_MODEL_CREDITS_THRESHOLD = 10`. The limit is account-wide, not per model.
- The bot walks 3 models on failure. A day of provider trouble multiplies requests by 3 and can spend the day's 50 by mid-morning. Stop the chain when the 429 comes from OpenRouter's own daily cap (the error carries `X-RateLimit-*` headers); keep walking only on provider errors.
- Community (HN, Show HN: Moltis, 131 points, 12 Feb 2026): token cost and compaction are the top complaints about always-on agents; one user on cheaper models: "it will write sometjing unexpected into its config json, restart and crash. Happens every few days". The desk bot has no self-editing and no long session, which is why it is cheap. Keep that.

### E. Proactive messages

- OpenClaw heartbeat: default interval 30 minutes; purpose "surface anything that needs attention without spamming you"; silent reply `NO_REPLY` (older configs `HEARTBEAT_OK`); an effectively empty checklist skips the model call.
- Ours: `api/digest.js` sends header, Stuck, Waiting on you, Moved, every day at 11:30 UTC, even when Stuck and Waiting are empty. Change: send the header only when all three lists are empty.
- IMan gets pings on new issues and comments (`scripts/tg-ping-iman.mjs`) but no summary at the start of his day.

## Comparison: what to build first

| Option | Effort | Cost | What Zaal sees |
|---|---|---|---|
| **1+2: context by section, comments, todo file** | About 60 lines in `api/telegram.js`, tests offline | 0 | `/waiting` lists IMan's real asks with links |
| 4: voice notes and screenshots | About 80 lines, one new model call per media message | 1 free request each | A voice note becomes an issue with its transcript |
| 5: `/usage` and stop-on-daily-cap | About 30 lines | 0 | "12 of 50 free requests used today" |
| 3: MEMORY.md | One file, 3 lines of code | 0 | Fewer wrong answers on settled facts |
| 6: quiet digest, IMan digest | About 25 lines, one cron line | 0 | No 4-message digest on quiet days |

Blocker for all of them: `OPENROUTER_API_KEY` is still missing in Vercel Production (measured 30 Sept, not re-measured here), so every model answer currently fails. That is Zaal's hand.

## Also See

- [agents/2570-zoe-intake-from-iman-and-desk-bot](../2570-zoe-intake-from-iman-and-desk-bot/): setup, webhook, the Actions schedule measurement
- [agents/2579-desk-bot-skills-from-other-agents](../2579-desk-bot-skills-from-other-agents/): buttons and digest (both shipped), voice and screenshots parked
- Tracker: no open cards matched "desk bot" on 6 Oct (searched status todo only; in_progress not searched)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add `OPENROUTER_API_KEY` to Vercel Production and Redeploy; done when `/status` answers | Zaal | Hand | 2026-10-08 |
| PR to ZAODEVZ/iman-desk: `deskContext` reads README by section, last 3 comments of each open for-zaal issue, and the todo file; done when the PR is merged and `/waiting` names desk #61 | iman-desk lane | PR | 2026-10-09 |
| PR: `/usage` from `GET /api/v1/key`, and stop the model chain on OpenRouter's daily-cap 429; done when merged with an offline test | iman-desk lane | PR | 2026-10-09 |
| PR: voice notes and photos through the omni Nemotron model, transcript in the issue body; done when 5 real voice notes are filed with transcripts Zaal accepts | iman-desk lane | PR | 2026-10-16 |
| PR: `bot/MEMORY.md` (1,200 characters or less) loaded into every answer; done when merged | iman-desk lane | PR | 2026-10-16 |
| PR: digest sends one line when nothing is stuck; second cron at 04:30 UTC to IMan; done when merged and one quiet day shows one message | iman-desk lane | PR | 2026-10-16 |

## Sources

- [OpenRouter, API Credit and Rate Limits (raw .md)](https://openrouter.ai/docs/api-reference/limits.md) - [FULL] method: curl of the raw markdown; constants quoted verbatim
- [OpenRouter models API](https://openrouter.ai/api/v1/models) - [FULL] method: curl of the JSON, 6 Oct 18:02 ET; 466 models, 16 free; model ids checked live with `zao-openrouter-preflight --scan`
- [Telegram Bot API](https://core.telegram.org/bots/api) - [PARTIAL - only the getFile limit and version lines were extracted] method: curl plus HTML strip; page lists Bot API 10.3
- [OpenClaw docs, Heartbeat](https://docs.openclaw.ai/gateway/heartbeat) - [PARTIAL - `NO_REPLY` line verified by curl; the 30-minute default and "without spamming you" come from the exa render] 
- [Nate Lemos, How to Build a Personal AI Companion That Actually Remembers You](https://nate.lemos.dev/blog/how-to-build-a-personal-ai-companion-that-actually-remembers-you) - [FULL] method: curl plus HTML strip, both quotes verified
- [dev.to, I Built My Own AI That Lives on Telegram](https://dev.to/hash02/i-built-my-own-ai-that-lives-on-telegram-heres-what-i-learned-1b7o) - [FULL] method: curl plus HTML strip, both quotes verified
- [Vlad Arbatov, Memory architecture of a persistent AI agent](https://blog.arbatov.dev/memory-architecture-of-a-persistent-ai-agent-9a94fa45b627) - [PARTIAL - curl returns 403; read through the exa render only, so no verbatim quotes are used]
- [HN, Show HN: Moltis](https://news.ycombinator.com/item?id=46993587) - [FULL] method: hn.algolia.com items API, comments read raw (community source)
- [takaya-okamoto/SHIBA README](https://github.com/takaya-okamoto/SHIBA) - [PARTIAL - README via exa render; LICENSE file not read, so the licence is the README's claim]
- ZAODEVZ/iman-desk origin/main: `api/telegram.js`, `api/_desk-bot.js`, `api/digest.js`, README.md - [FULL] method: git show, byte counts by wc
