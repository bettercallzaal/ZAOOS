---
topic: community
type: audit
status: research-complete
last-validated: 2026-10-29
related-docs: "community/050-the-zao-complete-guide, community/427-uvr-jadyn-violet-brand-intro-bot, community/1552-zao-telegram-welcome-sequence, agents/2685-zoe-discord-surface, governance/981-fractal-bot-synthesis"
original-query: "https://github.com/ZAODEVZ/zao-guide lets research, /zao-research this and lets research the zaoresearch skill please as well (Zaal, relayed by the seat, 2026-10-29)"
tier: STANDARD
---

# 2719 - ZAODEVZ/zao-guide is PlugZ: a Discord welcome and matchmaking bot, audited

> **Goal:** Say what the `ZAODEVZ/zao-guide` repo is, who made it and when, what is in it, how it sits next to the ZAO docs and bots that already exist, what in it is stale or wrong, and what to do next.

Read on Thu 2026-10-29 (clock from `date`, 05:55 EDT) from a read-only clone at `bfa4bae`, the head of `master`. **The repo is PRIVATE and ZAOOS is public**, so this doc describes structure and behaviour and quotes only short config lines, never secrets or code blocks. Nothing in the repo was changed. Whether the bot is running anywhere today was **not** established: it runs on "the computer that runs it", and no process or heartbeat for it was found or looked for on any machine.

## Key Decisions

| Decision | Call | Why |
|---|---|---|
| Is it a new bot under the "no new bots without doc" rule? | **YES. This doc is the first numbered doc about it**, written after it was built. Zaal approves or retires it | `zao-research-index "PlugZ"` and `"RewindZ"` on origin/main `17e55427d` returned "no matches". The repo was created 2026-10-23 and grew to 5 commits by 2026-10-25 with no ZAOOS doc |
| The ZABAL Gamez auto-feed | **TURN IT OFF until the API returns season champions, not a ballot.** Highest-severity finding | `zabalgamez.com/api/leaderboard?format=standings&limit=3` returned, on 2026-10-29, `status: closed`, `sourceLabel: "Builder QV ballot"`, top entry `kayonfire` (37 votes). `src/news.js` turns a `closed` status into the headline "@kayonfire won the season" and posts it to every ZAO server's news channel. The zabalgamez ICM box says the Season 1 champions were n3m, ghostmintops and uniquebeing404. Whether the bot has already posted this is UNKNOWN |
| Member DMs and intros sent to Gemini's free tier | **USE a paid Gemini key or the Claude key for anything a member types** | Google's Gemini API terms, read raw 2026-10-29: "Do not submit sensitive, confidential, or personal information to the Unpaid Services." `src/ai.js` has a header comment about working around the Gemini free tier being busy, so the free tier is the expected setup, and DM text goes to `think()` (`src/index.js:111`). ZAOOS `.claude/rules/claude-usage.md` says the same thing for ZAO's own code |
| Facts in the guide files | **REGROUND on the ICM boxes** (wavewarz, fractal, thezao) | Three mismatches, table in section 4. The bot's own system prompt says "Never make up links, dates or people", but the files it answers from carry claims the boxes do not |
| `/ask` vs ZAOpaperzBOT | **KEEP both for now, and route long questions to ZAOpaperzBOT** | `bettercallzaal/ZAOpaperzBOT` (public, last push 2026-09-21) already answers `/zao` questions on Discord from the live papers. PlugZ's `/ask` answers from 9 hand-written Q&As. Different depth, same job |
| Licence | **ADD a LICENSE file** if MIT is meant | `package.json` says `"license": "MIT"`; `gh api repos/ZAODEVZ/zao-guide/contents/LICENSE` returned 404. Private and unlicensed is all-rights-reserved. The two font licences (`assets/Poppins-OFL.txt`, `assets/LuckiestGuy-LICENSE.txt`) are present |

## 1. What it is

The repo is named `zao-guide` and its GitHub description still reads "Welcome and help bot for the ZAO Discord servers", but the product was renamed **PlugZ** in the second commit (`d471b1e`, "PlugZ: the plug on the ZAO servers"). `package.json` names it `plugz` at version `0.2.0`.

It is a Node 20 Discord bot with two dependencies, `discord.js` 14.27.0 and `@resvg/resvg-js` 2.6.2 (SVG to PNG, no browser). Eight source files total 741 lines (`src/index.js` is 270 of them), plus 124 lines of tests.

What it does, read from `README.md` and `src/register.js`:

| Feature | Where | Notes |
|---|---|---|
| Welcome post with role buttons (Artist, Producer, DJ, Fan, Builder) when someone joins | `src/index.js:71`, `servers/zao-music.json` | Needs the `GuildMembers` privileged intent (`src/index.js:19`). Commit `bfa4bae` makes the role buttons create a missing role |
| Welcome DM listing the five programs and the latest news | `src/index.js:77-93`, `programs.json` | Programs: WaveWarZ, ZAO Fractal, ZABAL Gamez, ZAO MixZ, ZAO Festivals |
| DM Q&A: newcomers ask PlugZ anything in DMs | `src/index.js:105-112` | Text goes to the configured AI, or to the closest guide answer without one |
| `/intro`: four boxes, posted as a 1080x1350 navy-and-gold card | `src/card.js`, `src/intros.js` | Each card is also saved to `data/cards/` "for content later" |
| The plug: tags the 2-3 people a newcomer should meet | `src/intros.js:55` `findPeople` | AI ranks everyone's intros; falls back to shared words |
| `/plug <need>`, `/who @member`, `/ask`, `/links`, `/start`, `/whatsup` | `src/register.js:8-17` | 8 slash commands in all |
| `/update`: team posts a result as a WINNER card to every ZAO server's news channel | `src/register.js:18`, `src/index.js:198` | Gated by Manage Server or the `PLUGZ_ADMINS` id list |
| ZABAL Gamez feed every 30 minutes | `src/news.js:51-66`, `src/index.js:264` | The only automatic feed; WaveWarZ and Fractal results go in by `/update` |

Configuration is one JSON file per server under `servers/`. Only `servers/zao-music.json` exists, matched by the server name "ZAO Music" until a `guild_id` is filled in (it is empty).

The AI layer (`src/ai.js`) uses Claude when `ANTHROPIC_API_KEY` is set and otherwise Gemini, falling through a list of six Gemini model ids when one is busy. The default Claude model for notes is `claude-opus-5-5` and for talk `claude-haiku-5-5`. The Gemini model ids were not checked against Google's model list.

State lives on the host only: `data/intros.json`, `data/news.json`, `data/cards/`, all gitignored. There is no database and no backup.

## 2. Who made it and when

| Fact | Value | Source |
|---|---|---|
| Created | 2026-10-23 14:36 UTC | `gh repo view --json createdAt` |
| Last push | 2026-10-25 03:04 UTC | `gh repo view --json pushedAt` |
| Commits | 5, all on `master`, 2,094 lines added and 118 deleted | `git log --numstat` |
| Author on every commit | the `ZAODEVZ` account, noreply address | `git log --format='%an <%ae>'` |
| Co-author on every commit | `Claude Opus 5.5` | each commit body |
| Commit clock | `+0200` on all five | `git log --format=%ci` |
| Collaborators | `bettercallzaal`, `ZAODEVZ` | `gh api repos/ZAODEVZ/zao-guide/collaborators` |
| Stars / forks | 0 / 0 | `gh repo view` |

Which person was at the keyboard is not established by any of this. `SETUP.md` writes the env path as `zao-guide\.env` (a Windows path separator) and mentions "RewindZ" as a sibling private bot; no repo named RewindZ was found under either owner by `gh search code "RewindZ" --owner=bettercallzaal --owner=ZAODEVZ` (zero hits).

## 3. How it relates to what already exists

| Existing thing | Overlap with PlugZ | Relationship |
|---|---|---|
| `bettercallzaal/ZAOpaperzBOT` (public, created 2026-07-11) | Discord Q&A about The ZAO, multi-server | Its README says it answers `/zao` questions "from the live papers (not hardcoded Q&A)" with a pgvector store. PlugZ `/ask` is the hardcoded kind. Two bots answering "what is The ZAO" in the same servers will disagree once the papers move |
| `bettercallzaal/zao-fractal-bot` (public, pushed 2026-10-28) | Discord, ZAO Fractal | Doc [427](../427-uvr-jadyn-violet-brand-intro-bot/) describes an earlier Fractal bot with an `/intro` command (`cogs/intro.py`). A `gh search code intro` on the current repo returned nothing, so whether today's Fractal bot still has `/intro` is UNKNOWN |
| ZOE's Discord adapter | Discord DMs answered by an AI | Doc [2685](../../agents/2685-zoe-discord-surface/) found `bot/src/zoe/discord.ts` built and silent for lack of a token, and asked for a spend cap before go-live. PlugZ has the same open question: no per-user rate limit was found in `src/index.js` |
| Doc [1552](../1552-zao-telegram-welcome-sequence/), Telegram welcome sequence | New-member welcome | Same job on Telegram, written for ZOE. PlugZ is the first welcome flow found that is code, not a plan |
| Doc [050](../050-the-zao-complete-guide/), The ZAO complete guide | What The ZAO is | The long-form source a guide file should be checked against, alongside the ICM boxes |
| ICM boxes at context.thezao.com | Every fact PlugZ states | `.claude/rules/icm-grounding.md`: brand facts come from the box. PlugZ's guide and programs files were hand-written in parallel. Section 4 lists where they differ |

## 4. What is stale or wrong

Each row compares a line in the repo at `bfa4bae` with the ICM box fetched from `https://context.thezao.com/<name>` on 2026-10-29 (HTTP 200 for all five boxes read).

| Repo says | Where | ICM box says | Severity |
|---|---|---|---|
| A `closed` leaderboard means "@<top> won the season" | `src/news.js:60-61` | zabalgamez: champions n3m, ghostmintops, uniquebeing404; the live API's closed board is a "Builder QV ballot" topped by kayonfire | HIGH: posts a false winner to every server, automatically |
| WaveWarZ quick battles "9 PM Eastern, Monday, Wednesday and Friday" | `programs.json`, `servers/zao-music.json` | wavewarz: "weekdays (Mon-Fri ~8:30pm EST)" | MEDIUM: newcomers get the wrong schedule |
| ZAO Fractal "Running since August 2024" | `programs.json` | fractal and thezao: "meeting weekly since 30 July 2024" | LOW |
| The ZAO "Founded by Zaal (BetterCallZaal) in 2024" | `servers/zao-music.json` | thezao: "Founded by Zaal Panthaki (BetterCallZaal)", no year | LOW: the year is not in the box; verify or drop it |
| The repo's name and description say "ZAO Guide" | GitHub metadata | The product is PlugZ | LOW |
| Bot messages carry emojis (welcome, role labels, cards) | `src/guide.js:22`, `src/index.js:152`, `servers/zao-music.json` | zao-assistant box: "No emojis, no em dashes" | LOW: the box states the voice for The ZAO; whether a community bot follows it is Zaal's call. The tests already enforce no em dashes |

What PlugZ gets right, checked: the tests pass (14 of 14, `npm test`, Node test runner, in the scratch clone at `bfa4bae` on 2026-10-29); every link in `servers/zao-music.json` and `programs.json` that was tried returned 200 (`zaomixz.vercel.app`, `/how`, `thezao.com`, `wavewarz.com`, `zaostock.com`, `zabalgamez.com`); no retired partner name appears in `src/`, `servers/`, `programs.json` or `README.md` (case-insensitive grep over the same paths; the control word `wavewarz` hit 6 files, the retired names hit 0); the `/update` command is permission-gated; `.env` and `data/` are gitignored; and the bot does not request the `MessageContent` privileged intent, which Discord's gateway docs say is not needed for DMs.

## 5. What is missing

| Gap | Why it matters |
|---|---|
| No heartbeat or liveness signal | `.claude/rules/silent-failure-guard.md` rule 10: a process with no beat cannot be told apart from a dead one. Nobody can say today whether PlugZ is up |
| No backup of `data/intros.json` and `data/cards/` | Every member intro lives on one computer. Losing the disk loses the network the bot exists to build |
| No consent step for reusing intro cards on Instagram, X or Farcaster | The README says cards are kept "for content later" and are "ready to post". Posting a member's photo and details outside Discord is outbound, which is Zaal's gate, and needs the member's yes |
| No rate limit on DM Q&A or `/plug` | Same gap doc 2685 flagged for ZOE: any member can spend the AI key |
| Only one server file | The README says "Copy `zao-music.json` for ZAO and WaveWarZ"; those files do not exist yet |
| No CI | Tests run only by hand |

## Also See

- [Doc 2685 - ZOE on Discord](../../agents/2685-zoe-discord-surface/)
- [Doc 427 - UVR intro bot brief](../427-uvr-jadyn-violet-brand-intro-bot/)
- [Doc 1552 - Telegram welcome sequence](../1552-zao-telegram-welcome-sequence/)
- [Doc 981 - Fractal bot synthesis](../../governance/981-fractal-bot-synthesis/)
- [Doc 050 - The ZAO complete guide](../050-the-zao-complete-guide/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide: approve PlugZ as a ZAO bot, or park it. Done when the ruling is recorded in the decisions file | @Zaal | Decision | 2026-11-05 |
| Turn off the ZABAL auto-feed, or change `src/news.js` to post only when the API names champions. Done when a PR to ZAODEVZ/zao-guide merges, and the news channels are checked for a wrong "won the season" post | @Zaal (names the maintainer) | PR | 2026-11-01 |
| Route DM and intro text away from the Gemini free tier (paid key or Claude only). Done when the PR merges and `.env.example` says so | PlugZ maintainer, named by @Zaal | PR | 2026-11-05 |
| Reground `programs.json` and `servers/zao-music.json` on the wavewarz, fractal and thezao ICM boxes (the four rows in section 4). Done when the PR merges | PlugZ maintainer, named by @Zaal | PR | 2026-11-05 |
| Add a LICENSE file matching `package.json`, and rename the repo description to PlugZ. Done when both show on GitHub | @Zaal | Repo setting | 2026-11-05 |
| Add a heartbeat (one line per feed cycle) and a nightly copy of `data/` off the host. Done when the beat file updates and a copy exists elsewhere | PlugZ maintainer, named by @Zaal | PR | 2026-11-12 |
| Decide whether intro cards may be reposted outside Discord, and if so add an opt-in button. Done when the ruling is recorded | @Zaal | Decision | 2026-11-12 |

## Sources

- [ZAODEVZ/zao-guide](https://github.com/ZAODEVZ/zao-guide) (private) `[FULL]` - `gh repo view`, `gh api` contents and collaborators, and a read-only `git clone` to scratch at `bfa4bae`; every file in section 1 read from disk, tests run
- [zabalgamez.com leaderboard API](https://zabalgamez.com/api/leaderboard?format=standings&limit=3) `[FULL]` - `curl`, HTTP 200, raw JSON read 2026-10-29
- [ICM box: zabalgamez](https://context.thezao.com/zabalgamez) `[FULL]` - `curl`, raw text
- [ICM box: wavewarz](https://context.thezao.com/wavewarz) `[FULL]` - `curl`, raw text
- [ICM box: fractal](https://context.thezao.com/fractal) `[FULL]` - `curl`, raw text
- [ICM box: thezao](https://context.thezao.com/thezao) `[FULL]` - `curl`, raw text
- [ICM box: zao-assistant](https://context.thezao.com/zao-assistant) `[FULL]` - `curl`, raw text
- [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms) `[FULL]` - `curl` plus HTML strip; the "Unpaid Services" section read and quoted from the stripped text
- [Discord API docs, Gateway: privileged intents](https://github.com/discord/discord-api-docs/blob/main/developers/events/gateway.mdx) `[FULL]` - raw markdown via `raw.githubusercontent.com`, lines 302-304 and 445-469 read
- [discord.js issue #9550, guildMemberAdd not firing](https://github.com/discordjs/discord.js/issues/9550) `[FULL]` - community source, `gh api` issue body and comments; shows the failure mode a welcome bot hits when the members intent is not on, which `SETUP.md` step 2 guards against
- [bettercallzaal/ZAOpaperzBOT](https://github.com/bettercallzaal/ZAOpaperzBOT) `[PARTIAL - README first 40 lines only, code not read]` - `gh api .../readme`
- [bettercallzaal/zao-fractal-bot](https://github.com/bettercallzaal/zao-fractal-bot) `[PARTIAL - metadata and one code search; source not read]`
- ZAOOS research library: `zao-research-index` on origin/main `17e55427d` for "zao guide", "onboarding guide", "discord bot", "PlugZ", "RewindZ"; docs 427, 2685, 1552, 050 read in their first 30 lines; doc numbers resolved with `zao-research-health --resolve`
