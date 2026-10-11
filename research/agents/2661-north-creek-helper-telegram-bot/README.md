---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-11
superseded-by:
related-docs: "601, 650, 1023"
original-query: "Zaal's ruling, vault decisions item 166: B, a brand-new Telegram bot for the North Creek collaborator (named in the request; name removed here), not the ZOE guest mode. Write the numbered research doc the no-new-bots rule requires: what the bot is, what it must never do, who may talk to it, the daily cap, the one-instance guard and heartbeat, where it runs and what a sixth process costs, the model and cost per question, how it is stopped, and why it is a separate bot."
tier: STANDARD
---

# 2661 - The North Creek helper: one new Telegram bot, question answering only

> **Goal:** Give Zaal the design he is approving before any new bot process exists: a Telegram bot that answers one outside collaborator's questions about his own website from three files, and can do nothing else.

**This is a design. Nothing in it is running as of 2026-10-11.** The code is written in ZAOOS #3914, which is open and not merged. It will not be live for the visit on 2026-10-12 unless that PR, its review and Zaal's own token all land first.

**Updated 2026-10-11, the same day, after review.** The first version of this doc merged before it was graded. The review (the seat evaluator's verdict comment on ZAOOS #3911) found one control that could not work and four things a doc for an always-on process has to say and did not. What changed: the token check is replaced by a pinned bot identity (decision 7); a new section says what happens when configuration or state is missing; a new section says what is kept and who can read it; a new section covers errors and abuse; the default model is now the smallest one (decision 6); an uncited compliance figure is removed from decision 4.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | BUILD a separate bot, working name `nc-helper`, in `bot/src/helper/`. Not a ZOE mode. | Zaal chose it: vault decisions item 166, verbatim "B". |
| 2 | The model call carries NO tools. The process has no repo access and its env file holds two secrets only: its own bot token and one model key. | A helper with nothing to call cannot be talked into calling it. OWASP LLM01 says to "restrict the model's access privileges to the minimum necessary". |
| 3 | An allowlist of numeric Telegram user ids, set in the env file: the collaborator's and Zaal's, two at most. Everyone else gets one refusal line and no model call. Private chats only. | Usernames can change hands; ids do not. No model call for strangers means no spend and no surface. |
| 4 | The limits live in CODE, not in the prompt: the allowlist, the daily cap, a per-user burst limit, a length limit, the footer "I cannot commit Zaal to anything." on every reply, and a refusal to forward or send text that looks like a password or key. | A prompt is a request the model may or may not follow. A check in code runs every time. |
| 5 | It reads the three files from a plain directory on the host, set by `HELPER_DOCS_DIR`. It never fetches them from GitHub. | The files are moving to a new site-only repo (item 165). A local copy means the bot needs no GitHub credential and does not break when the repo moves. |
| 6 | Model is one env var, `HELPER_MODEL`. Default `claude-haiku-5-5`, the smallest current model. | The job is reading three short files back to one person, and Zaal's standing rule is the cheapest surface that does the job. At the cap the largest model costs about forty times as much a month. He can override it. |
| 7 | Its own token, made by Zaal in BotFather, and a pinned identity: `HELPER_BOT_ID` must be set, the token's own id must equal it, and Telegram's getMe must agree, before polling starts. | One poller per token (`agent-loops.md` rule 9). A second poller on another bot's token takes that bot's messages. |
| 8 | Fail closed. Any required setting that is unset, empty or malformed is a refusal to start. State that cannot be read answers nobody. Nothing defaults to "allow". | A missing setting that reads as "no limit" is the usual way a limit disappears. |
| 9 | Ships with the unit not enabled and a flag `HELPER_ENABLED` that must be `1`. Zaal starts it. | PR-only, flag-gated off. Starting a process that talks to an outside person is his hand. |

## What it is

A Telegram bot that the North Creek collaborator, the collective's lead, can message with questions about changing and publishing his website. It answers from three files written by lane 8 and nothing else:

- `handoff/AGENT.md` (3,904 bytes): the helper's brief. Who the collaborator is, how to answer, what it must not do.
- `handoff/README.md` (5,175 bytes): the instruction sheet.
- `handoff/WALKTHROUGH.md` (5,086 bytes): the GitHub and Vercel walk-through.

Total 14,165 bytes, measured 2026-10-11 from the north-creek repo, PR #18, head `619b35ed`. That PR is a draft and the files are moving to a new site-only repo (item 165, decided the same afternoon).

One wrinkle: `AGENT.md` says "Give the helper this file and `handoff/README.md`. It answers from those two files." The seat's instruction names three. This design loads all three, because the walk-through is what he will ask about. If lane 8 meant two, dropping one is a one-line change.

Each question is one model call: system prompt = the brief plus the files, messages = the last few turns of this chat plus the new question. No tools, no search, no file writes.

## What it must never do

| Never | How it is enforced |
|---|---|
| Use a tool, read a repo, run a command | The request to the model has no `tools` field. The process has no git checkout to read and no shell-out. A test asserts the request body has no tools. |
| Hold ZOE's memory or Zaal's private facts | It is a separate process with its own env file. It never opens `~/.zao/zoe/`. The only text it loads is the three files. |
| Take credentials | Code checks each incoming message for key and password shapes before the model sees it. A match is not sent to the model and not logged; the reply tells him to change it. The model's answer gets the same check before it is sent. |
| Promise anything for Zaal | The footer "I cannot commit Zaal to anything." is appended in code to every reply, including the refusal and limit lines. The brief also forbids it, but the footer does not depend on the model obeying. |
| Claim it changed the site | It cannot. The brief tells it to say so. |
| Talk to anyone else | Allowlist check before anything else. Groups are ignored. |
| Run up a bill | Daily cap and a per-user burst limit, both in code. |
| Keep a record of the conversation | See "What is kept, and who can read it". |

A community case for why the footer and the "ask Zaal" rule matter: in 2024 a tribunal held Air Canada responsible for what its website chatbot told a customer. The airline argued the bot was responsible for its own words and lost. A helper that speaks for a named person binds that person in the listener's mind whatever the small print says, so this one is built to refuse the role.

**The files are not secret from the two allowed users.** A model can repeat anything it is given, so the rule is that nothing secret is ever put in the prompt. The prompt holds the brief, the two instruction files and one fixed sentence saying it has no tools; a test asserts there is nothing else. The files are the collaborator's own instruction sheet, so the helper quoting them word for word is fine.

## Who may talk to it

- `HELPER_ALLOWED_IDS`: a comma-separated list of numeric Telegram user ids. The collaborator's and Zaal's. More than two is a refusal to start: a third person is a change to this design, not a setting.
- The helper never messages anyone first; it only replies. So the collaborator messages it once, is refused, and the refusal line tells him his own id: "This helper is private. Your id is N. Send that number to Zaal." Zaal adds the id to the env file and restarts. Zaal's own id goes in first, so the list is never empty.
- The refusal is sent at most once per user per hour (the limiter at `bot/src/zoe/owner-only.ts:31`), so the bot cannot be used to spam.
- Private chats only. If added to a group it answers nothing.

## The cap

- `HELPER_DAILY_CAP`, default 40 questions per day across all allowed users, day measured in America/New_York. Ceiling 500.
- Counted in `~/.zao/nc-helper/cap.json`, before the model call, so a failing model cannot be retried for free. Over the cap the reply is one fixed line with no model call.
- Messages are handled one at a time, so two questions cannot share a count.
- 40 is a starting number, not a measured one. One person asking about one website should not come near it.

## When configuration or state is missing

Every setting and every piece of state has three possible readings: good, absent, and unreadable. Only "good" lets a question through.

| What | Unset or empty | Malformed or unreadable |
|---|---|---|
| `HELPER_ENABLED` | exits without polling | anything but `1` exits without polling |
| `HELPER_BOT_TOKEN`, `HELPER_BOT_ID`, model key, `HELPER_DOCS_DIR` | refuses to start | refuses to start |
| `HELPER_ALLOWED_IDS` | refuses to start | any entry that is not a numeric id refuses to start; nothing is silently dropped. More than two ids refuses to start |
| `HELPER_DAILY_CAP` | the default, 40 | anything but a whole number from 1 to 500 refuses to start; it never becomes the default |
| A handoff file | refuses to start | an empty file refuses to start |
| The cap file | no file yet is the first question ever and starts at zero | a file that exists but cannot be read, is not the exact expected shape, has a negative or fractional count, or carries a day later than today: **answers nobody**, with one fixed line, logged as an error, until a person fixes the file. It never counts from zero. Checked at boot as well |
| The cap file cannot be written | n/a | the question is not asked |
| Telegram's getMe at boot | n/a | a failed call or a different bot id refuses to start |
| The lock's pid file | no file: falls back to the lock's age | text that is not a pid counts as a live holder: it does not start |

## What is kept, and who can read it

What the collaborator types is a third person's data.

- **Message text is never logged.** The journal line for a message carries his numeric Telegram id, the message length, token counts and the kind of outcome. The function that writes it is not given the text; a test asserts the line holds none of it.
- **A refused stranger's id is logged**, at most once an hour, with no text. That id is how Zaal adds someone.
- **Where and for how long.** The journal is the systemd user journal on the VPS. Measured 2026-10-11 over ssh: `MaxRetentionSec=7day`, `SystemMaxUse=1G`, and the oldest entry was from 2026-10-05. So seven days.
- **Who can read it.** The `zaal` unix account on the VPS, which Zaal and the lanes that ssh in as him use, and root. Two human login accounts exist on the box (`zaal`, `ubuntu`).
- **In memory.** The last 6 turns per user, so a follow-up question makes sense. Gone on restart. Never written to disk.
- **On disk.** The cap file holds a date and a count. A lock file and a pid file hold a timestamp and a process id. The heartbeat file holds a timestamp. Nothing else.
- **What leaves the host.** His questions go to Telegram, which carries the chat, and to the model provider, which answers it. What they keep is under their terms. This doc makes no claim about either.

## Errors, limits and abuse

| Case | What happens |
|---|---|
| The model call errors or times out (60 seconds, one retry by the SDK) | One fixed line: "Something went wrong on my side. Try again, or ask Zaal." A rate-limit error gets "The service I use is busy." The error class is logged, never the text. The question has already been counted. Nothing of the turn is remembered. |
| The model declines or returns nothing | One fixed line pointing him to Zaal. Not remembered. |
| A question over 2,000 characters | Not forwarded, not counted. A fixed line asks for the one part he is stuck on. |
| An answer over one Telegram message | Cut to fit, footer kept. |
| More than 5 questions from one user in 5 minutes | A fixed line, no model call, not counted. Per user, so one person cannot slow the other. |
| Someone tries to talk it out of its rules | It has no tools and no secrets, so the worst case is an embarrassing sentence with the footer on it. |

## One instance, and a heartbeat

- **Identity check at boot.** A Telegram token is the bot's numeric id, a colon, and a secret. `HELPER_BOT_ID` must be set. Before any network call the token's own id must equal it; then the process calls getMe once and Telegram's answer must equal it too. Any mismatch, or a getMe that fails, is a refusal to start. The first version of this doc compared the token with the other bots' token variables "in the environment". This process loads only its own env file, so none of them is ever there and that check could never fire.
- **Lock.** An atomic create of `~/.zao/nc-helper/lock` (the technique at `bot/src/zoe/tick-lock.ts:164` and `:176`), judged two ways: a pid file says whether the last holder is still running, and the lock's own timestamp covers a pid file that was lost. A live holder blocks a second copy however old the timestamp; a dead one is cleared at once.
- **Heartbeat.** `~/.zao/beats/nc-helper` is written once a minute, but only while the poll loop's own calls to Telegram keep succeeding. If polling dies and the process lingers, the beat stops within two minutes. Measured 2026-10-11: `~/.zao/beats` does not exist on the VPS, so none of the bots there writes a beat; this would be the first.
- **Proof it ran.** One `[helper/ran]` log line the first time it answers after a boot, on the success path.
- What this does not cover: a second copy on a different machine with the same token. Both would pass the identity check, and Telegram would split messages between them. One unit on one host is the plan; revoking the token is the cure.

## Where it runs, and what one more process costs

The VPS (`ssh vps`), as a systemd user unit, like the others. Measured over ssh on 2026-10-11 at 20:12 UTC:

| Measure | Reading |
|---|---|
| Cores | 2 |
| Load average | 0.06, 0.05, 0.00 |
| CPU idle (second `top` sample) | 98.6 percent |
| Memory | 7,940 MB total, 6,322 MB available |
| Disk | 47 GB free of 96 GB |
| Long-running user services now, by cgroup memory | zoe-bot 162 MB, zao-devz-stack 189 MB, cowork-agent 155 MB, zaostock-bot 78 MB, farscout 40 MB, zao-bus 17 MB |

Six services are listed; this would be the seventh, and the fifth Telegram poller. The closest shape to it is `zaostock-bot`: one grammY poller and no agent. So it costs roughly 80 MB, about 1 percent of memory, and no measurable CPU while idle. The box has room. That 80 MB is read off a neighbour, not measured on this bot. The unit file caps it at 300 MB.

## The model, and cost

The call is the Anthropic Messages API through the official TypeScript SDK. That is one new dependency for `bot/`, `@anthropic-ai/sdk`, which the repo's rules put in the ask-first column. The alternative is the raw `fetch` call already at `bot/src/zai/llm-handler.ts:52`; the SDK is recommended because it retries and types its errors.

It needs an API key. That is separate from Zaal's Claude subscription and is billed per token.

**Estimate, not a measurement.** Tokens are taken as bytes divided by four, not counted with the API. A worst-case question is about 5,500 tokens in (3,540 for the files, the rest for instructions, a few turns of history and the question) and 600 out including the model's own reasoning.

| Model | Price in / out per million tokens | One question | 40 a day (the cap) | A 31-day month at the cap |
|---|---|---|---|---|
| `claude-haiku-5-5` (default) | $0.10 / $0.50 | under 0.1 cent | about $0.03 | about $1 |
| `claude-sonnet-5-5` | $2 / $10 | about 1.7 cents | about $0.68 | about $21 |
| `claude-opus-5-5` | $4 / $20 | about 3.4 cents | about $1.36 | about $42 |

Prices read from Anthropic's pricing page on 2026-10-11. The month column is the ceiling the cap allows, not a forecast. Prompt caching would cut the input half further, but the files may be under the size the larger models will cache, so it is not counted.

## How it is stopped

Three switches, weakest to strongest:

1. Remove an id from `HELPER_ALLOWED_IDS` and restart: that person is refused. Zaal does this; the env file is his.
2. `systemctl --user disable --now nc-helper`: the bot goes silent. Zaal, or a lane on his word.
3. Revoke the token in BotFather: the bot is dead on every machine at once, including any copy nobody knew about. Zaal only.

Deleting the bot's files is Zaal's, as always.

## Why a separate bot and not a persona

Zaal's words are short. Asked to pick between a guest mode inside ZOE, a new bot, and no build, he typed "B" (item 166). The request that started it, as the seat relayed it from lane 8, was for "an agent ... so he can talk to the telgram agent to ask it questions". He did not give a reason, and this doc does not invent one for him.

What the choice buys, measured against the option this lane first recommended:

| | A: guest mode in ZOE | B: separate bot (chosen) | C: no build |
|---|---|---|---|
| The collaborator can message it privately | No, a three-person group | Yes | n/a |
| Shares a process with ZOE's tools and memory | Yes, kept apart only by code | No, a different process and a different env file | n/a |
| A mistake in the guard exposes | ZOE's memory, tools, Zaal's facts | Three files about his own website | nothing |
| New token, process and doc needed | No | Yes | No |
| Can be handed to the collaborator or shut off without touching ZOE | No | Yes | n/a |

The standing rule is `CLAUDE.md`, "Rule: no new bots without doc": a numbered research doc plus explicit Zaal approval, with new brand voices going into ZOE as persona blocks. This is not a brand voice. It is a walled-off helper for someone outside The ZAO, and the wall is the point. The rule's other half is this doc. The cleanup decision behind the rule is `agents/601-agent-stack-cleanup-decision`.

## Risks that remain

- **Prompt injection still works on the words.** The collaborator, or anyone who gets his phone, can try to make it say something silly. With no tools and no secrets in reach, the worst case is an embarrassing sentence, and the footer is on it. See `security/1023-prompt-injection-threat-landscape-2026`.
- **The files can go stale.** They are a copy. When the site-only repo changes them, someone has to copy them again and restart. The bot logs a hash of each file at boot so a stale copy can be seen.
- **Wrong answers about GitHub and Vercel.** Both move their buttons. The brief tells the helper to ask what he sees. Nothing checks its answers.
- **One more thing to keep alive.** The heartbeat makes a dead one visible; nothing restarts a hung poller or pages on a stale beat yet.
- **Never run.** As of this writing the code has been typechecked, bundled and unit tested. It has not talked to Telegram or a model, because no token or key exists for it.

## Also See

- `agents/601-agent-stack-cleanup-decision`: why new bots need a doc.
- `agents/650-cowork-zaodevz-imanagent`: an earlier allowlisted Telegram bot in this estate.
- `security/1023-prompt-injection-threat-landscape-2026`: the injection shapes this design avoids by having no tools.
- Vault decisions items 165, 166 and 167, 2026-10-11.
- ZAOOS #3914: the build.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Review and merge the build, ZAOOS #3914. Shipped when it is on main. | Zaal or the merge lane | PR | 2026-10-12 |
| Decide the model (`HELPER_MODEL`, default the smallest) and whether the new SDK dependency is accepted. Shipped when he says which. | Zaal | Decision | With the build PR review; no date set by this lane |
| Create the bot in BotFather, store its token, its numeric id and a model key through the secrets flow. Shipped when the env file exists on the VPS. | Zaal | His hand | After the build PR merges; no date set by this lane |
| Copy the three files to `HELPER_DOCS_DIR` from the site-only repo once lane 8 has created it. Shipped when the bot's boot log prints three hashes. | lane 8, then Zaal | Ops | After item 165's repo exists; no date set by this lane |
| Start the unit, have the collaborator message it, add his id. Shipped when a `[helper/ran]` line is in the journal. | Zaal | His hand | After all of the above; not possible for 2026-10-12 unless they land first |

## Sources

- [Telegram Bot API, getUpdates](https://core.telegram.org/bots/api#getupdates) `[FULL]`, method: curl plus HTML strip, 2026-10-11. Used for: long polling returns updates to whoever calls; "will not work if an outgoing webhook is set up". It does not state what happens with two pollers; that part rests on `.claude/rules/agent-loops.md` rule 9.
- [OWASP LLM01: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) `[FULL]`, method: curl plus HTML strip. Quoted: "Restrict the model's access privileges to the minimum necessary for its intended operations."
- [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) `[FULL]`, method: curl plus HTML strip. The three price rows and the cache multipliers.
- [Hacker News: Air Canada is responsible for chatbot's mistake](https://news.ycombinator.com/item?id=39378235) `[PARTIAL - the first six of 53 top-level comments were read, not the whole tree]`, method: HN Algolia items API. 371 points. Community source for the "a bot's words bind its owner" point; the linked news article itself was not fetched.
- North Creek handoff files, `bettercallzaal/north-creek` PR #18 at head `619b35ed` `[FULL]`, method: `gh api` contents. Sizes and the brief's rules. Draft PR, private working repo.
- VPS measurements `[FULL]`, method: ssh. Host: `nproc`, `uptime`, `free -m`, `top -b -n 2`, `systemctl --user show -p MemoryCurrent`, 2026-10-11 20:12 UTC. Journal: `/etc/systemd/journald.conf`, `journalctl --disk-usage`, the oldest entry, and the login accounts in `/etc/passwd`, 2026-10-11 20:31 UTC.
- ZAOOS source on origin/main `fb8de4fa`: `bot/src/zoe/owner-only.ts:31`, `bot/src/zoe/tick-lock.ts:164` and `:176`, `bot/src/zai/llm-handler.ts:52`, `bot/src/agent-markup.ts:152`, `bot/package-lock.json:2724` (grammY pinned at 1.42.0).
- [grammY deployment types](https://grammy.dev/guide/deployment-types) `[FAILED - fetched, but the page text read here did not contain the two-poller statement looked for]`. Not relied on.
- [Telegram bot FAQ](https://core.telegram.org/bots/faq) `[FAILED - fetched, 7,609 characters, no statement found on bots messaging first]`. Not relied on; the doc now states only what this bot's own code does.
