---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-11
superseded-by:
related-docs: "601, 650, 1023"
original-query: "Zaal's ruling, vault decisions item 166: B, a brand-new Telegram bot for Brian (North Creek), not the ZOE guest mode. Write the numbered research doc the no-new-bots rule requires: what the bot is, what it must never do, who may talk to it, the daily cap, the one-instance guard and heartbeat, where it runs and what a sixth process costs, the model and cost per question, how it is stopped, and why it is a separate bot."
tier: STANDARD
---

# 2661 - The North Creek helper: one new Telegram bot, question answering only

> **Goal:** Give Zaal the design he is approving before any new bot process exists: a Telegram bot that answers one outside collaborator's questions about his own website from three files, and can do nothing else.

**This is a design. Nothing in it is built or running as of 2026-10-11.** It will not be live for the visit on 2026-10-12 unless this doc, the build, the review and Zaal's own token all land first.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | BUILD a separate bot, working name `nc-helper`, in `bot/src/helper/`. Not a ZOE mode. | Zaal chose it: vault decisions item 166, verbatim "B". |
| 2 | The model call carries NO tools. The process has no repo access and its env file holds two secrets only: its own bot token and one model key. | A helper with nothing to call cannot be talked into calling it. OWASP LLM01 says to "restrict the model's access privileges to the minimum necessary". |
| 3 | An allowlist of numeric Telegram user ids, set in the env file: Brian's and Zaal's. Everyone else gets one refusal line and no model call. Private chats only. | Usernames can change hands; ids do not. No model call for strangers means no spend and no surface. |
| 4 | Three limits live in CODE, not in the prompt: the daily cap, the footer "I cannot commit Zaal to anything.", and a refusal to forward a message that looks like a password or key. | A prompt is a request. This estate measures prose rules at 3 to 40 percent compliance and mechanical ones at about 100. |
| 5 | It reads the three files from a plain directory on the host, set by `HELPER_DOCS_DIR`. It never fetches them from GitHub. | The files are moving to a new site-only repo (item 165). A local copy means the bot needs no GitHub credential and does not break when the repo moves. |
| 6 | Model is one env var, `HELPER_MODEL`. Default `claude-opus-5-5`. Zaal can set `claude-haiku-5-5` and pay about one fortieth. | Cost is his call, not this lane's. Both prices are in the table below. |
| 7 | Its own token, made by Zaal in BotFather. The process refuses to start if its token equals any other bot token in its environment. | One poller per token (`agent-loops.md` rule 9). Two processes on one token split the updates between them. |
| 8 | Ships with the unit not enabled and a flag `HELPER_ENABLED` that must be `1`. Zaal starts it. | PR-only, flag-gated off. Starting a process that talks to an outside person is his hand. |

## What it is

A Telegram bot that Brian, who leads design for North Creek, can message with questions about changing and publishing his website. It answers from three files written by lane 8 and nothing else:

- `handoff/AGENT.md` (3,904 bytes): the helper's brief. Who Brian is, how to answer, what it must not do.
- `handoff/README.md` (5,175 bytes): the instruction sheet.
- `handoff/WALKTHROUGH.md` (5,086 bytes): the GitHub and Vercel walk-through.

Total 14,165 bytes, measured 2026-10-11 from the north-creek repo, PR #18, head `619b35ed`. That PR is a draft and the files are moving to a new site-only repo (item 165, decided the same afternoon).

One wrinkle to settle at build time: `AGENT.md` says "Give the helper this file and `handoff/README.md`. It answers from those two files." The seat's instruction names three. This design loads all three, because the walk-through is what Brian will ask about. If lane 8 meant two, dropping one is a one-line change.

Each question is one model call: system prompt = the brief plus the files, messages = the last few turns of this chat plus the new question. No tools, no search, no file writes.

## What it must never do

| Never | How it is enforced |
|---|---|
| Use a tool, read a repo, run a command | The request to the model has no `tools` field. The process has no git checkout to read and no shell-out. A test asserts the request body has no tools. |
| Hold ZOE's memory or Zaal's private facts | It is a separate process with its own env file. It never opens `~/.zao/zoe/`. The only text it loads is the three files. |
| Take credentials | Code checks each incoming message for key and password shapes before the model sees it. A match is not sent to the model and not logged; the reply tells him to change it. The brief says the same in words. |
| Promise anything for Zaal | The footer "I cannot commit Zaal to anything." is appended in code to every answer. The brief also forbids it, but the footer does not depend on the model obeying. |
| Claim it changed the site | It cannot. The brief tells it to say so. |
| Talk to anyone else | Allowlist check before anything else. Groups are ignored. |
| Run up a bill | Daily cap in code, counted in a state file so a restart does not reset it. |
| Keep a record of the conversation | The last few turns are held in memory only, so a follow-up question makes sense. Nothing is written to disk. The journal gets the user id, message length and token counts, never the text. |

A community case for why the footer and the "ask Zaal" rule matter: in 2024 a tribunal held Air Canada responsible for what its website chatbot told a customer. The airline argued the bot was responsible for its own words and lost. A helper that speaks for a named person binds that person in the listener's mind whatever the small print says, so this one is built to refuse the role.

## Who may talk to it

- `HELPER_ALLOWED_IDS`: a comma-separated list of numeric Telegram user ids. Brian's and Zaal's.
- Telegram bots cannot message a person first; the person has to open the chat. So Brian messages it once, is refused, and the refusal line tells him his own id: "This helper is private. Your id is N. Send that number to Zaal." Zaal adds the id to the env file and restarts. That is the whole onboarding, and it means nobody has to look up an id by hand.
- The refusal is sent at most once per user per hour (the pattern already in `bot/src/zoe/owner-only.ts`), so the bot cannot be used to spam.
- Private chats only. If added to a group it answers nothing.

## The cap

- `HELPER_DAILY_CAP`, default 40 questions per day across all allowed users, day measured in America/New_York.
- Counted in `~/.zao/nc-helper/cap.json`. Over the cap the reply is one fixed line with no model call: "That is the limit for today. Ask Zaal directly or try tomorrow."
- 40 is a starting number, not a measured one. One person asking about one website should not come near it.

## One instance, and a heartbeat

- **Token check at boot.** If `HELPER_BOT_TOKEN` equals the value of any other bot token variable present in the environment, the process exits before polling. The other bots' variable names are in the repo: `ZOE_BOT_TOKEN`, `BOT_TOKEN`, `TELEGRAM_BOT_TOKEN`, `ZAOSTOCK_BOT_TOKEN`, `ZAO_DEVZ_BOT_TOKEN`, `HERMES_BOT_TOKEN`, `COWORK_BOT_TOKEN`.
- **Lock file.** An atomic create of `~/.zao/nc-helper/lock`, the same technique as `bot/src/zoe/tick-lock.ts`. A second copy on the same host fails to take it and exits.
- **Heartbeat.** The process touches `~/.zao/beats/nc-helper` once a minute. Measured 2026-10-11: that directory does not exist on the VPS, so none of the five bots there writes a beat. This would be the first, and the process creates the directory.
- **Proof it ran.** One `[helper/ran]` log line the first time it answers after a boot, on the success path.
- What this does not cover: a second copy on a different machine. The lock is per host. Telegram's own behaviour with two pollers on one token is the backstop, and the single unit file on a single host is the plan.

## Where it runs, and what a sixth process costs

The VPS (`ssh vps`), as a systemd user unit, like the others. Measured over ssh on 2026-10-11 at 20:12 UTC:

| Measure | Reading |
|---|---|
| Cores | 2 |
| Load average | 0.06, 0.05, 0.00 |
| CPU idle (second `top` sample) | 98.6 percent |
| Memory | 7,940 MB total, 6,322 MB available |
| Disk | 47 GB free of 96 GB |
| Bot processes now | zoe-bot 162 MB, zao-devz-stack 189 MB, cowork-agent 155 MB, zaostock-bot 78 MB, farscout 40 MB, zao-bus 17 MB (cgroup memory) |

The closest shape to this bot is `zaostock-bot`: one grammY poller and no agent. So a sixth process costs roughly 80 MB, about 1 percent of memory, and no measurable CPU while idle. The box has room. That 80 MB is read off a neighbour, not measured on this bot.

## The model, and cost per question

The call is the Anthropic Messages API through the official TypeScript SDK. That is one new dependency for `bot/`, `@anthropic-ai/sdk`, which the repo's rules put in the ask-first column. The alternative is the raw `fetch` call already in `bot/src/zai/llm-handler.ts`; the SDK is recommended because it retries and types its errors.

It needs an API key. That is separate from Zaal's Claude subscription and is billed per token.

**Estimate, not a measurement.** Tokens are taken as bytes divided by four, not counted with the API. A worst-case question is about 5,500 tokens in (3,540 for the files, the rest for instructions, a few turns of history and the question) and 600 out including the model's own reasoning.

| Model | Price in / out per million tokens | One question | 40 a day (the cap) |
|---|---|---|---|
| `claude-opus-5-5` (default) | $4 / $20 | about 3.4 cents | about $1.36 |
| `claude-sonnet-5-5` | $2 / $10 | about 1.7 cents | about $0.68 |
| `claude-haiku-5-5` | $0.10 / $0.50 | under 0.1 cent | about $0.03 |

Prices read from Anthropic's pricing page on 2026-10-11. Prompt caching would cut the input half further, but the files may be under the size the larger models will cache, so it is not counted here.

The build PR can replace this estimate with a real count before the bot runs.

## How it is stopped

Three switches, weakest to strongest:

1. Remove an id from `HELPER_ALLOWED_IDS` and restart: that person is refused.
2. `systemctl --user stop nc-helper && systemctl --user disable nc-helper`: the bot goes silent. Messages to it get no reply.
3. Revoke the token in BotFather: the bot is dead on every machine at once, including any copy nobody knew about.

Deleting the bot's files is Zaal's, as always.

## Why a separate bot and not a persona

Zaal's words are short. Asked to pick between a guest mode inside ZOE, a new bot, and no build, he typed "B" (item 166). The request that started it, as the seat relayed it from lane 8, was for "an agent ... so he can talk to the telgram agent to ask it questions". He did not give a reason, and this doc does not invent one for him.

What the choice buys, measured against the option this lane first recommended:

| | A: guest mode in ZOE | B: separate bot (chosen) | C: no build |
|---|---|---|---|
| Brian can message it privately | No, a three-person group | Yes | n/a |
| Shares a process with ZOE's tools and memory | Yes, kept apart only by code | No, a different process and a different env file | n/a |
| A mistake in the guard exposes | ZOE's memory, tools, Zaal's facts | Three files about his own website | nothing |
| New token, process and doc needed | No | Yes | No |
| Can be handed to Brian or shut off without touching ZOE | No | Yes | n/a |

The standing rule is `CLAUDE.md`, "Rule: no new bots without doc": a numbered research doc plus explicit Zaal approval, with new brand voices going into ZOE as persona blocks. This is not a brand voice. It is a walled-off helper for someone outside The ZAO, and the wall is the point. The rule's other half is this doc. The cleanup decision behind the rule is `agents/601-agent-stack-cleanup-decision`.

## Risks that remain

- **Prompt injection still works on the words.** Brian, or anyone who gets his phone, can try to make it say something silly. With no tools and no secrets in reach, the worst case is an embarrassing sentence, and the footer is on it. See `security/1023-prompt-injection-threat-landscape-2026`.
- **The files can go stale.** They are a copy. When the site-only repo changes them, someone has to copy them again and restart. The bot logs a hash of each file at boot so a stale copy can be seen.
- **Wrong answers about GitHub and Vercel.** Both move their buttons. The brief tells the helper to ask what he sees. Nothing checks its answers.
- **A sixth thing to keep alive.** The heartbeat makes a dead one visible; nothing restarts or pages on it yet.

## Also See

- `agents/601-agent-stack-cleanup-decision`: why new bots need a doc.
- `agents/650-cowork-zaodevz-imanagent`: an earlier allowlisted Telegram bot in this estate.
- `security/1023-prompt-injection-threat-landscape-2026`: the injection shapes this design avoids by having no tools.
- Vault decisions items 165 and 166, 2026-10-11.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Review and merge this doc. Shipped when it is on main. | Zaal or the merge lane | PR | 2026-10-12 |
| Build PR: `bot/src/helper/`, a unit file not enabled, tests for the allowlist refusal, the cap, the footer and the no-tools request. Shipped when the PR is open and its tests pass. | zoe lane | PR | 2026-10-11 |
| Decide the model (`HELPER_MODEL`) and whether the new SDK dependency is accepted. Shipped when he says which. | Zaal | Decision | With the build PR review; no date set by this lane |
| Create the bot in BotFather, store its token and a model key through the secrets flow. Shipped when the env file exists on the VPS. | Zaal | His hand | After the build PR merges; no date set by this lane |
| Copy the three files to `HELPER_DOCS_DIR` from the site-only repo once lane 8 has created it. Shipped when the bot's boot log prints three hashes. | lane 8, then Zaal | Ops | After item 165's repo exists; no date set by this lane |
| Start the unit, have Brian message it, add his id. Shipped when a `[helper/ran]` line is in the journal. | Zaal | His hand | After all of the above; not possible for 2026-10-12 unless they land first |

## Sources

- [Telegram Bot API, getUpdates](https://core.telegram.org/bots/api#getupdates) `[FULL]`, method: curl plus HTML strip, 2026-10-11. Used for: long polling returns updates to whoever calls; "will not work if an outgoing webhook is set up". It does not state what happens with two pollers; that part rests on `.claude/rules/agent-loops.md` rule 9.
- [OWASP LLM01: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) `[FULL]`, method: curl plus HTML strip. Quoted: "Restrict the model's access privileges to the minimum necessary for its intended operations."
- [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) `[FULL]`, method: curl plus HTML strip. The three price rows and the cache multipliers.
- [Hacker News: Air Canada is responsible for chatbot's mistake](https://news.ycombinator.com/item?id=39378235) `[PARTIAL - the first six of 53 top-level comments were read, not the whole tree]`, method: HN Algolia items API. 371 points. Community source for the "a bot's words bind its owner" point; the linked news article itself was not fetched.
- North Creek handoff files, `bettercallzaal/north-creek` PR #18 at head `619b35ed` `[FULL]`, method: `gh api` contents. Sizes and the brief's rules. Draft PR, private working repo.
- VPS measurements `[FULL]`, method: ssh, `nproc`, `uptime`, `free -m`, `top -b -n 2`, `systemctl --user show -p MemoryCurrent`, 2026-10-11 20:12 UTC.
- ZAOOS source on origin/main `623b0529`: `bot/src/zoe/owner-only.ts`, `bot/src/zoe/tick-lock.ts`, `bot/src/zai/llm-handler.ts`, `bot/package-lock.json` (grammY pinned at 1.42.0).
- [grammY deployment types](https://grammy.dev/guide/deployment-types) `[FAILED - fetched, but the page text read here did not contain the two-poller statement looked for]`. Not relied on.
- [Telegram bot FAQ](https://core.telegram.org/bots/faq) `[FAILED - fetched, 7,609 characters, no statement found on bots messaging first]`. The "person must open the chat" line rests on how every bot in this estate already behaves, not on this page.
