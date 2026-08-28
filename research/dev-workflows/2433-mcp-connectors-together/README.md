---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: "2412, 2411, 2317, 2421, 2402, 2348, 2352, 2401, 2432"
original-query: "i wanna use our connectors more and first to gain context can we /zao-research how to use linear notion obsidian and canva and the rest of our mcp set togetehr and find if we could connect to more mcps to give our agentic infra a level up and be more autonomous"
tier: DEEP
---

# 2433 - The connector set, used together: what is in each, which loop each one shortens, and what to add

> **Goal:** Measure every MCP connector from inside a research lane (not the orchestrator's session), write the playbook for ZAO's five real loops with the connector order and the file of record for each, score every candidate addition against the glue-first ladder, and rank additions by the Zaal taps they remove this week.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Discord does not need a new MCP. Set one env var.** `bot/src/zoe/discord-webhook.ts` (70 lines, posts proactively, needs `DISCORD_WEBHOOK_STATUS`) and `bot/src/zoe/discord.ts` (309 lines, discord.js client that reads channels, needs `DISCORD_BOT_TOKEN`) are both merged and both unflagged. | Measured on the VPS 2026-08-28: `journalctl --user -u zoe-bot --since "7 days ago"` carries `[zoe/discord] DISCORD_BOT_TOKEN not set, skipping Discord client` **73 times**, and `grep` of `~/zao-bot-live/bot/.env` finds none of the four `DISCORD_*` names. Doc 2412 called Discord "the honest gap" - the read AND write paths exist; they are BUILT, not FLAGGED (`state-claims.md` rule 5). The webhook alone removes the paste-the-recap-to-Discord tap on every `/meeting`. |
| 2 | **Canva is connected, full, and earns a role in two loops: ZAOstock production (poster/deck) and publishing.** | Measured this lane: **16 brand kits** (15 named, incl. `ZAO STOCK`, `WaveWarz`, `ZTalent - The ZAO`, `ZAO-PALOOZA`, `Paragraph`), **50+ designs** (page 1 of `search-designs` returned 50 with a continuation token; `ZABAL Daily Designs` last edited 2026-08-20), 4 folders matching "zao". Doc 2412 measured it as an auth stub four days ago; that was true then and is not now. |
| 3 | **Notion stays off. It is not visible from a lane, and its contents could not be measured here.** If it earns a role it is a Zaal-facing surface, never a second memory (docs 2317 and 2421 stand). | In this lane the claude.ai Notion connector exposes only `authenticate` / `complete_authentication`, and the project-scoped `notion` entry is in `~/.claude.json` `projects["...ZAO OS V1"].disabledMcpServers`. The orchestrator's `~/Documents` session saw real Notion tools the same morning. **Connector visibility is per-cwd and per-session**, which means any "Notion is connected" claim must say from where. |
| 4 | **Linear: transport Connected, workspace not authorized, zero taps it would remove this week. WATCH.** | `claude mcp list` says `claude.ai Linear ... Connected`; the tool surface is the auth stub. Linear's own docs (read 2026-08-28): remote HTTP at `https://mcp.linear.app/mcp`, OAuth 2.1 with dynamic client registration, a `/mcp/readonly` endpoint. The board of record is Supabase `public.tasks` (**1,890 rows**, single writer `zao-tracker`, doc 2401). Linear would be a second board until Zaal decides to migrate; none of the 21 FOR ZAAL items in this week's dailies needs it. |
| 5 | **Add exactly two things, both rung 1 (platform-native, hosted, OAuth): Cal.com's hosted MCP (`https://mcp.cal.com/mcp`) and, when Zaal is ready to create a second bot token, Anthropic's own Telegram channel plugin as the Mac-side sender the ZOE loop is missing (daily item 20).** Everything else scored below is WATCH or NOT-FOR-US. | Cal.com is already the ZABAL Gamez booker (glossary) and doc 2412's overdue scheduler decision resolves toward it; the hosted server needs no key. The Telegram channel plugin is Apache-2.0 in `anthropics/claude-plugins-official` (34,858 stars, pushed 2026-08-28), and the only blocker for the loop's DM step is a sender on the Mac. Discord's channel plugin from the same repo is the read-path fallback if ZOE's own `discord.ts` is not flagged. |
| 6 | **Drop the ECC `server-github@2025.4.8` entry; do not add GitHub's official MCP.** | `gh` (`/opt/homebrew/bin/gh`) is rung 1 and every lane uses it; the ECC server was called **5 times in 30 days** (doc 2411). `github/github-mcp-server` (MIT LICENSE read, 32,576 stars, 100+ contributors, pushed 2026-08-28) is excellent and duplicates a CLI we already run from scripts for free (`code-over-inference.md`). |
| 7 | **Obsidian: doc 2317's verdict holds. File tools on `~/zao-vault`; `StevenStavrakis/obsidian-mcp` is still the adopt-later pick and is still alive.** | LICENSE read (MIT), 729 stars, 5 contributors, pushed 2026-08-27. The larger `jacksteamdev/obsidian-mcp-tools` (832 stars) is **archived**. Nothing in this week's dailies needed a vault MCP. |

## 1. Measured inventory, from this lane, 2026-08-28

Two measurements per server, because they disagree: transport health (`claude mcp list`, run from this worktree) and what the tool surface actually exposes to this session. Contents were read with the read-only tools only; nothing was created in Canva or anywhere else.

| Server | Transport (`claude mcp list`) | Tool surface here | What is actually in it (measured) |
|---|---|---|---|
| **Canva** (claude.ai) | Connected | real tools | 16 brand kits: one unnamed + CandyToyBox, Lens Protocol, Web3 Academy DAO, Thays Self-Image Curator, ZTalent - The ZAO, ZAO-PALOOZA, Rose City Web3, Student Loanz, Impact3 (x2), Press Release Marketplace, WaveWarz, Paragraph, Base app, WaveWarz OpenClaw, ZAO STOCK (`kAHTOce5OAk`). 50+ designs, newest `ZABAL Daily Designs` (8 pages, edited 2026-08-20), `ZABAL GAMEZ thumbnails` (28 pages), `ZAO-CHELLA Event Deck` (31 pages), `ZAO Hatz` (150 pages). Folders matching "zao": 4 |
| **Slack** (claude.ai) | Connected | real tools | **3 channels**, not 1: `#new-channel`, `#all-the-zao`, `#social`, all created by Zaal 2026-03-21, none archived. Doc 2412 probed with the query "zao"; this probe used the broadest query the tool accepts across public+private+archived. Its "re-probe Slack" action is done: three empty-looking channels is still a workspace nobody uses |
| **Dropbox** (claude.ai) | Connected | real tools | 4 root entries, unchanged from 2412: mount `Outfit 14A` (2024), three Dropbox onboarding files (2020) |
| **Google Drive** (claude.ai) | Connected | real tools | Live and current: `ZAOSTOCK - Organizing Doc (Oct 3, 2026)` (`1B78AVonJS3...`, 97 KB, modified 2026-08-27 23:36Z, owned by a ZAOstock collaborator, shared 2026-08-03); `ZAOstock` folder owned by info@thezao.com with `Artists/Fellenz`, `Artists/Bomb Squad`, `Artists/The Somes Sound` created 2026-08-24; `ZAO-STOCK Standup - 2026/08/24` recording (284 MB); `Artizen Community Calls - Recordings (May-Aug 2026)` shared 2026-08-25; `ZAUREN Budget 2026 V2` (modified 2026-08-24) |
| **Gmail** (claude.ai) | Connected | real tools | INBOX 13,200 messages / 10,775 threads; DRAFT **133**; SENT 6,022; 52,321 unread across the account; 19 labels, 11 of them auto-generated category labels prefixed with a recycling glyph |
| **Google Calendar** (claude.ai) | Connected | real tools | not re-measured this session (46 calls / 30 days in doc 2411; used by the orchestrator daily) |
| **Calendly** (claude.ai) | Connected | real tools | user `zaalp99`, timezone America/New_York, record updated 2026-08-25. Event types not re-listed (2412: 2 types, 1 active). The 2412 pick-one-scheduler decision, due 2026-08-26, is still open |
| **Notion** (claude.ai + project-scoped) | Connected / `Disabled for this project` | **auth stub only** | UNMEASURED from this lane. See decision 3 |
| **Linear** (claude.ai) | Connected | **auth stub only** | UNMEASURED - not authorized |
| **Paragraph** (project-scoped) | `! Needs authentication` | not loaded | the newsletter surface (doc 2348) is not reachable from this lane without a tap |
| **supabase-cowork** | Connected, `read_only=true` | real tools | 38 public tables: `tasks` 1,890, `contacts` 1,198, `bot_events` 807, `agent_runs` 165, `receipts` 165, `meeting_notes` 102, `audit_logs` 111, `repo_improvements` 47, `repo_decisions` 46, `task_source_cache` 31, `projects` 24, `brands` 22, `team_members` 14, `fleet_status` 11, `bot_heartbeats` 5. RLS on every table |
| **gdocs** (local, `~/bin/gdocs-mcp`) | Connected | real tools | the Google Docs write path from doc 2402; the ZAOstock organizing doc above is its main target |
| **exa, grep, dune, hyperagent, gitnexus** | Connected | real tools | as before; gitnexus stays CLAUDE.md-disabled by policy |
| **context7, playwright, serena** | `Connected` at 09:0x | session boot at 08:5x reported `CONNECT_TIMEOUT ... 30000ms` for context7 and playwright | transport flaps between boot and list; doc 2352 already records serena doing this. A "failed to connect" at boot is not "not configured" |
| **ECC github / memory / sequential-thinking** | Connected | real tools | 5 / 0 / 0 calls in 30 days (doc 2411) |
| **Expedia, TravExp** | Connected | real tools | no ZAO loop; 1 call in 30 days |
| **claude-in-chrome** | n/a (extension) | real tools | 1,786 calls / 30 days; still the browser |

**The orchestrator's session and this lane see different connector sets.** The ~/Documents session (08:5x, per the brief) had real Notion tools; this lane, same morning, same machine, has the auth stub and a project-level disable. Any inventory claim carries its cwd.

## 2. The "together" playbook - five loops, connector order, file of record

The rule for every loop: the file of record is written first, the message is the pointer (`handoff-discipline.md` rule 7). Connectors are listed in the order a lane calls them. **Gate** marks the step that stays Zaal's.

### (a) Meeting -> actions

1. **Google Calendar** (`list_events`) - find the event, attendees, the Meet/Zoom link. Owner of the invite habit is still Zaal (doc 2428).
2. **Google Drive** (`list_recent_files`) - the recording lands in Drive within the hour (`ZAO-STOCK Standup - 2026/08/24` did, 284 MB). `zao-ingest.sh` transcribes it locally (yt-dlp/whisper, free).
3. `/meeting` Phase 3.5 - the Orca lanes the meeting belongs to correct the transcript.
4. **gdocs** (`get_doc_as_markdown` then `insert_doc_elements`) - decisions and owed items go into the shared organizing doc when the meeting is ZAOstock (`1B78AVonJS3...`), because that is the doc Steve, Roddy and Dcoop read.
5. **supabase-cowork** - actions become `tasks` rows through `~/bin/zao-tracker` (the only writer). Outside-ZAO commitments go on the board, not only in prose (`recap-followthrough.md` rule 2).
6. **Vault** - `research/events/NNNN-*` recap + `~/zao-vault/daily/` line. File of record: the recap doc.
7. **Discord webhook** (`discord-webhook.ts`, once `DISCORD_WEBHOOK_STATUS` is set) - the recap summary posts to the status channel. Today this step is Zaal pasting the Telegram block by hand. **Gate:** any DM to a person outside ZAO.

Notion adds nothing here: the team reads Google Docs, the fleet reads the vault, the board is Supabase. Canva adds nothing.

### (b) ZAOstock production (Oct 3, 2026)

1. **gdocs** on `1B78AVonJS3...` - the organizing doc IS the production plan's public face; the repo copy is `zaostock/docs/plans/production-plan-2026-10-03.md`.
2. **Google Drive** `ZAOstock/Artists/<act>` folders (created 2026-08-24) - press kits, stage plots, riders per act.
3. **Gmail** `create_draft` - outreach to Steve, sponsors, the Chamber. 133 drafts already sit in the account. **Gate:** send.
4. **Google Calendar** - standups (the 08-24 one is recorded), the PA deadline 2026-09-11 (daily 08-28).
5. **Canva** `generate-design` with brand kit `ZAO STOCK` (`kAHTOce5OAk`), then `export-design` to PNG/PDF and `create_file` into the Drive `ZAOstock` folder - poster, sponsor one-pager, deck. The `ZAO-CHELLA Event Deck` (31 pages) and `Sponsor NFT` (11 pages) are the templates to fork. **Gate:** anything printed or posted.
6. **supabase-cowork** - `sponsors`, `artists`, `volunteers`, `budget_entries` tables exist and hold **0 rows each**; the board still runs on `tasks`. Filling those four tables is a data decision for Zaal, not a connector question.

File of record: the organizing doc for the team, the repo plan for the fleet. Canva improves this loop; Notion would duplicate the organizing doc.

### (c) Research -> decision

1. **exa** (`web_search_exa`, then `web_fetch_exa`) and `curl` + HTML strip - raw text for anything quoted (`research-grounding.md`). **context7** for library docs when it connects; `docs.discord.com/mcp` and `docs.whop.com/mcp` are the same shape (Mintlify docs-only MCPs, read-only, scoped to the docs site) for those two vendors.
2. **grep** (grep.app) and `gh` - what already exists in 126 ZAO repos and upstream.
3. **playwright** / **claude-in-chrome** - JS-walled pages. Reddit stays FAILED (`zao-fetch-reddit.sh --selftest` today: public `.json` returns `text/html`; 1 of 3 redlib instances answered).
4. Doc at `research/<topic>/NNNN-*` in ZAO OS V1 - file of record, PR by REST, never merged by the lane.
5. Vault grill: one line in `~/zao-vault/handoffs/GRILL-QUEUE.md` (or `grill-next.md` per doc 2432) when the doc needs a Zaal verdict.

Neither Notion nor Canva nor Linear touches this loop.

### (d) Publishing

1. Draft in the repo (`research/` or the site repo) - file of record.
2. **Paragraph MCP** - the newsletter body (doc 2348). Needs authentication from this lane today.
3. **Canva** - header image / social card from the `Paragraph` brand kit (`kAG4P6WcbYY`) or the brand's own kit; `export-design`; the PNG goes into the post via Drive or Paragraph upload.
4. `/socials` - platform posts drafted to the clipboard. **Gate:** every outbound post (Firefly, Telegram, Discord) is Zaal's tap, by rule (`feedback_firefly_only`, `agent-loops.md` rule 8).

Canva improves this loop (the image step was manual). Notion does not.

### (e) Fleet / orchestration

1. **Orca** - lanes, worktrees, `.handoffs/DONE.md`, `orca-board.log`.
2. **supabase-cowork** - the board (`tasks`), `fleet_status` (11 rows), `bot_heartbeats` (5), `agent_runs` (165). Read-only from MCP; writes go through `zao-tracker`.
3. **Vault** - `handoffs/<lane>.md` briefs, `IN-FLIGHT.md`, the daily. File of record for succession.
4. `gh` - PRs, issues, `gh api` for the doc-number scan. Not the ECC github server.
5. **Telegram** - ZOE on the VPS is the phone surface; doc 2432's rule: one interrupt, one digest. The loop's DM step has no Mac-side sender (daily item 20) - that is the one hole a connector fills (candidate 2 below).

Linear would replace step 2 only by decision; today it is a second board.

### Where Notion and Canva land

| Loop | Canva | Notion |
|---|---|---|
| (a) meeting | no | no - gdocs is the team doc, vault is memory |
| (b) ZAOstock | **yes** - poster/deck/one-pager from the `ZAO STOCK` kit | no - duplicates the organizing doc |
| (c) research | no | no |
| (d) publishing | **yes** - header/social images | no |
| (e) fleet | no | no |

Notion earns a role only as a surface Zaal (or a collaborator who lives in Notion) reads, fed FROM the vault or the organizing doc - never written to first. Nobody named such a reader this week.

## 3. Candidate MCP servers, glue-first scored

Licence is from the LICENSE file (Hard Requirement 13), read via `gh api repos/X/contents/LICENSE`. Liveness = last push. Rung per `notes/glue-first-standard.md` section 1. Verdict rule from the brief: adoption needs a named loop it shortens.

| Candidate | Source / endpoint | LICENSE file | Alive (last push) | Maintainers | Transport / auth | ZAO loop | Rung | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Discord - ZOE's own modules** | `bot/src/zoe/discord-webhook.ts` (70 lines), `bot/src/zoe/discord.ts` (309 lines) | ours | merged; unflagged on VPS (73 skip lines / 7 days) | ZAOOS | webhook URL / bot token via `.env` | (a) recap post, (e) status feed; read path for community channels | 4 (already written) | **ADOPT - set `DISCORD_WEBHOOK_STATUS`** (one `/secret` tap), then `DISCORD_BOT_TOKEN` when Zaal wants the read path |
| Discord - Anthropic channel plugin | `anthropics/claude-plugins-official/external_plugins/discord` | Apache-2.0 (read) | 2026-08-28 | Anthropic (34,858 stars) | Bun (installed, `~/.bun/bin/bun`); bot token via `/discord:configure`; research preview, needs claude.ai auth | phone -> lane via Discord DM; reply/react/edit tools | 1 | **WATCH** - Remote Control already covers phone -> lane; use only if ZOE's `discord.ts` stays unflagged and a read path is wanted in a lane |
| Discord - `barryyip0625/mcp-discord` | github | MIT (read) | 2026-08-05 | 15 contributors | stdio, bot token | full guild surface | 2 | WATCH - fallback if a lane needs channel management ZOE's client lacks |
| Discord - `v-3/discordmcp` | github | **no LICENSE file** | 2025-01-21 | 0 listed | stdio | - | - | NOT-FOR-US (unlicensed, dead 19 months) |
| **Telegram - Anthropic channel plugin** | `anthropics/claude-plugins-official/external_plugins/telegram` | Apache-2.0 (read) | 2026-08-28 | Anthropic | Bun; `TELEGRAM_BOT_TOKEN` in `~/.claude/channels/telegram/.env`; `TELEGRAM_STATE_DIR` per bot | (e) the loop's missing Mac-side DM sender (daily item 20) | 1 | **ADOPT-CANDIDATE, gated**: needs a NEW BotFather token (rule 9: never a second poller on ZOE's token) and Zaal's approval per the no-new-bots rule - this doc is that doc |
| Telegram - `chigwell/telegram-mcp` | github | Apache-2.0 (read) | 2026-08-23 | 48 contributors | stdio, Telethon **user session** | - | - | NOT-FOR-US - logs in as Zaal's account (secret + ToS risk); ZOE is the bot |
| Farcaster / Neynar | `https://docs.neynar.com/mcp` | n/a (hosted docs) | live | Neynar | HTTP, no auth | docs lookup only - it is a Mintlify docs MCP, not the API | - | NOT-FOR-US as an action surface; the Neynar SDK is in 181 `src/` files and ZOL on the Pi. Registry: 0 hits for "farcaster" / "neynar"; best OSS is `manimohans/farcaster-mcp` at 2 stars |
| Obsidian - `StevenStavrakis/obsidian-mcp` | github | MIT (read) | 2026-08-27 | 5 contributors | stdio, direct vault access, no plugin | vault | 2 | WATCH (doc 2317 adopt-later; trigger = concurrent-writer conflicts) |
| Obsidian - `jacksteamdev/obsidian-mcp-tools` | github | MIT | **archived** | 7 | - | - | NOT-FOR-US |
| Obsidian - `cyanheads/obsidian-mcp-server` | github | Apache-2.0 (read) | 2026-08-22 | 3 | needs the Local REST API plugin (Obsidian must be open) | - | - | NOT-FOR-US (wrong shape for an always-on agent, per 2317) |
| Vercel official | `https://mcp.vercel.com` | hosted, closed; overview repo has no LICENSE | live (docs read 2026-08-28) | Vercel | remote, OAuth | (d) deploy logs for the 4 Vercel sites (bettercallzaal.com, thezao.xyz, zabalgamez.com, zaostock.com) | 1 | WATCH - `vercel` CLI 48.12.0 is installed and scriptable for free; adopt the MCP only when a lane needs runtime logs in-context without a shell |
| GitHub official | `github/github-mcp-server` + `api.githubcopilot.com/mcp` | MIT (read) | 2026-08-28 | 100+ | remote OAuth or local binary | (e) | 1 | NOT-FOR-US as an addition - `gh` does it; **drop the ECC legacy server** |
| Linear | `https://mcp.linear.app/mcp` (`app.linear/linear` in the registry) | hosted | live (docs read) | Linear | remote, OAuth 2.1 + DCR, `/mcp/readonly` available | (e) board - only by migration | 1 | WATCH - decision-gated; 0 taps this week |
| **Cal.com hosted** | `https://mcp.cal.com/mcp` (source: `calcom/companion/apps/mcp-server`) | source repo has **no LICENSE file** at root or in `apps/mcp-server` (contents listed 2026-08-28); the hosted service is used under Cal.com's terms, not run by us | 2026-08-21 | 19 contributors | Streamable HTTP, OAuth 2.1 + PKCE, no key; 34 hosted tools (bookings, event types, schedules, attendees) | ZABAL Gamez workshop slots (`cal.com/bettercallzaal/zabal-games-workshop-slot`); closes doc 2412's two-scheduler cleanup | 1 | **ADOPT-CANDIDATE** - hosted, keyless, replaces the Calendly connector once Zaal picks Cal.com |
| Cal.com - `calcom/cal-mcp` (old) | github | no LICENSE file | 2025-05-22 | 1 | stdio, API key | - | - | NOT-FOR-US (superseded by the hosted server) |
| OBS - `royshil/obs-mcp` | github | GPL-2.0 (read) | 2025-08-26 | 2 | stdio, obs-websocket | (d) streaming | - | NOT-FOR-US - 12 months quiet; glue-first says keep OBS + Restream, do not wrap. Restream: 0 MCPs found |
| YouTube - `ZubeidHendricks/youtube-mcp-server` | github | MIT (read) | 2026-08-08 | 4 | stdio, API key | (c) ingest | - | NOT-FOR-US - `zao-ingest.sh` (yt-dlp + whisper) already does it free on the Pi |
| X | registry hits are paid trend APIs (`com.jojapi/twitter`, `ai.trendsapi/x-twitter`) | n/a | - | - | paid keys | - | - | NOT-FOR-US - `zao-fetch-x.sh` reads, Firefly posts (Zaal's tap) |
| Whop hosted | `https://mcp.whop.com/mcp` (source `whopio/whop-mcp-server`) | Apache-2.0 (read) | 2026-08-26 | 2 | remote, browser OAuth | sponsors / payments | 1 | WATCH - glue-first keeps payments native and manual; adopt when a ZAOstock tier sells through Whop (tier price: UNSET, Zaal has not typed one) |
| Arweave / ArDrive | registry: 0 for "arweave", "ardrive"; `gh search`: 0; `docs.ar.io/build/ai/mcp` 404 | - | - | - | - | music permaweb | - | nothing found to adopt; ArDrive CLI stays |
| Home Assistant | HA ships a native `mcp_server` integration (`/api/mcp`, token or OAuth); `homeassistant-ai/ha-mcp` MIT, 4,537 stars, 65 contributors, pushed 2026-08-28 | MIT (read) | today | 65 | - | none - ZAO runs no HA | 1 | NOT-FOR-US (no loop) |
| Cron / file-watch | Claude Code native: `Run prompts on a schedule`, `Push external events to Claude` (docs nav, `code.claude.com/docs/en/channels`), `CronCreate` tool present in this session; launchd (`zorca-bundle`), Pi/VPS cron | n/a | - | - | - | (e) | 1 | NOT-FOR-US as MCP - already native; registry "cron" hits are SaaS watchdogs |
| Notion hosted | `https://mcp.notion.com/mcp` | hosted | live (docs read) | Notion | remote, OAuth | none named | 1 | NOT-FOR-US this week; disconnect stands (2412) unless Zaal names a Notion reader |
| Canva hosted | `https://mcp.canva.com/mcp` | hosted | connected here | Canva | remote, OAuth | (b), (d) | 1 | **ADOPT - already connected**, give it the two loops above |

## 4. Autonomy ranking - taps removed this week

Ranked against the 21 numbered FOR ZAAL items in `daily/2026-08-26.md` and `2026-08-27.md` plus the 08-28 entries. Most of the 21 are pushes, key rotations, money, outbound sends and facts only Zaal knows - no connector removes those by rule. The ones a connector touches:

| Rank | Change | Daily item it removes or shortens | Taps / week (measured where possible) | Cost |
|---|---|---|---|---|
| 1 | **Set `DISCORD_WEBHOOK_STATUS`** for ZOE | the paste-the-recap step after every `/meeting`; the 08-28 daily lists three calls on one morning (Fractals Dan, Paul x Zaal, Daily Doots) plus the 08-24 standup | ~3-4 pastes/week become 0 | one `/secret` tap, zero code |
| 2 | **Telegram channel plugin as the loop's Mac-side sender** | item 20 - "the loop's DM step needs a sender"; today the orchestrator relays OUTBOX lines into the daily and Zaal replies there | removes the standing relay (not a per-week count; it is a blocker) | BotFather token (Zaal), `/plugin install telegram@claude-plugins-official`, `/telegram:configure` |
| 3 | **Cal.com hosted MCP** | doc 2412's scheduler decision (due 2026-08-26, open) and any "which workshop slots are booked" question | 0 measured this week; structural | one custom-connector add, OAuth tap |
| 4 | **Canva in the ZAOstock lane** | 08-28: brand identity assets for the Doots stream "ready with all links"; ZAOstock poster/deck | 1 this week | none - connected |
| 5 | **A write-capable `supabase-cowork` entry** (not a new connector) | item 6 - CRM `apply.sql` "needs a write-capable Supabase path" | 1 standing blocker | config change, Zaal-gated (RLS, service key) |
| 6 | **Drive re-auth as info@thezao.com** (gdocs) | item 12 | 1 | Zaal's OAuth tap |
| 7 | Linear, Notion, Vercel MCP, Whop | none this week | 0 | - |

What does not move: items 1-4 (X Space, Steve's reply, key rotation, the zorca push), 7 (fractal review), 18 (VPS), 21 (Aziz's RTMP key) are Zaal's by rule or by fact, and stay that way.

## 5. Adoption candidates (for `~/zao-vault/notes/adoption-candidates.md`, section 5 of the glue-first standard)

- **Cal.com hosted MCP** - `https://mcp.cal.com/mcp`; hosted by Cal.com, OAuth 2.1, no key; source `calcom/companion` (no LICENSE file - use the hosted service, do not vendor); replaces: the Calendly connector; maintained by Cal.com (19 contributors, pushed 2026-08-21).
- **Telegram channel plugin** - `telegram@claude-plugins-official`; Apache-2.0; replaces: the orchestrator's manual OUTBOX relay; maintained by Anthropic; needs a new bot token; research preview.
- **Discord channel plugin** - `discord@claude-plugins-official`; Apache-2.0; WATCH; replaces nothing while ZOE's `discord.ts` exists - flag that first.
- **Canva** - already connected; brand kit `ZAO STOCK` (`kAHTOce5OAk`), `WaveWarz` (`kAGtMJodRRw`), `Paragraph` (`kAG4P6WcbYY`); no code.

## Honest limits

- **Notion contents are UNMEASURED.** This lane could not authorize it and did not try to (an auth flow is Zaal's). The orchestrator's tool-surface observation is the only evidence Notion is connected anywhere, and it says nothing about what is in the workspace.
- **Canva design count is "50+"**, not an exact number: page 1 returned 50 with a continuation token and pagination was not walked.
- **Slack was probed with a single-character query** across all channel types; three channels is the whole result set (`End of results`). Message content was not read.
- **Google Calendar and Calendly event types were not re-listed**; 2412's counts stand.
- **The VPS Discord state was read from journald and env-var NAMES only**; no values were printed.
- **Cal.com's hosted tool count** is 34 on the hosted docs page and 57 in the `companion` repo README - the repo is ahead of the hosted deployment, or the docs are stale; UNRESOLVED.
- **Reddit FAILED** (`zao-fetch-reddit.sh --selftest`: `.json` walled, 1/3 redlib up); no Reddit thread was read. HN threads on these servers are thin (2-13 points, mostly zero comments) - community signal here is weak and is reported as such, not padded.
- **GitHub issue search on `modelcontextprotocol/servers` and `claude-plugins-official` returned nothing** for the terms tried; not escalated further.
- Connector visibility differs by cwd and session (decision 3); a second lane may see a third set.

## Also See

- [Doc 2412](../../infrastructure/2412-dead-mcp-servers-vault-board-integration/) - the empty-store measurement this extends; Canva and Slack rows corrected here
- [Doc 2411](../2411-tool-usage-audit-measured/) - the 30-day call counts
- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - file tools on the vault; obsidian-mcp adopt-later
- [Doc 2421](../2421-company-brain-hq-vs-zao-vault/) - vault is memory; source order
- [Doc 2402](../2402-agent-editing-google-docs/) - the gdocs write path used in loops (a) and (b)
- [Doc 2348](../../business/2348-newsletter-craft-paragraph-mcp/) - Paragraph in loop (d)
- [Doc 2352](../2352-serena-version-gap-silent-failures/) - transport flapping at boot
- [Doc 2401](../2401-zao-capture-ecosystem-zoe-vault-tracker-bonfire/) - `zao-tracker` as the board's single writer
- [Doc 2432](../../agents/2432-zoe-telegram-interrupt-rule/) - one interrupt, one digest; why a second Telegram bot is a doc-first decision
- `~/zao-vault/notes/glue-first-standard.md` - the ladder and checklist used above

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set `DISCORD_WEBHOOK_STATUS` in `~/zao-bot-live/bot/.env` on the VPS via `/secret` and restart `zoe-bot`; shipped when journald shows a `[zoe/scheduler]` post with no "webhook failed" line and the morning brief appears in the Discord status channel | @Zaal | Config (gated: outbound) | 2026-09-01 |
| Pick the scheduler (2412 action, overdue since 2026-08-26). If Cal.com: add custom connector `https://mcp.cal.com/mcp`, disconnect Calendly; shipped when `claude mcp list` shows calcom Connected and a lane reads one booking | @Zaal | Decision + config | 2026-09-04 |
| Approve or decline a second Telegram bot for the loop's Mac-side sender (item 20). If yes: BotFather token, `/plugin install telegram@claude-plugins-official`, `/telegram:configure`; shipped when one OUTBOX line reaches the phone with no orchestrator relay | @Zaal | Decision (gated: new bot) | 2026-09-04 |
| Copy section 5 into `~/zao-vault/notes/adoption-candidates.md` and add the corrected Canva/Slack rows to doc 2412's table as a dated note; shipped when both files carry a 2026-08-28 line | @Zaal (Claude, orchestrator) | Vault edit | 2026-08-29 |
| ZAOstock lane: draft the Oct 3 poster with `generate-design` from brand kit `ZAO STOCK` and `export-design` into Drive `ZAOstock` (`1ln781xPRNOLykAuaIsd1r2P-VmZM8zzW`); shipped when the PNG is in the folder for Zaal's review (nothing printed or posted) | @Zaal (Claude, zaostock lane) | Draft | 2026-09-05 |
| Remove the ECC `github` server from the plugin config (5 calls / 30 days; `gh` covers it); shipped when `claude mcp list` no longer lists `plugin:everything-claude-code:github` | @Zaal | Config | 2026-09-04 |
| Name a Notion reader or leave Notion disconnected; shipped when either a doc names the workspace and its reader, or the connector is off `claude mcp list` | @Zaal | Decision | 2026-09-04 |
| After the webhook is live: add the Discord post as a sink in the `/meeting` skill's distribution phase; shipped when a recap PR body shows the Discord post line | @Zaal (Claude, meetings lane) | PR | 2026-09-05 |

## Sources

Method is stated per source so a reader can tell a verbatim read from a summary (`research-grounding.md`).

- [FULL - live MCP tools, this lane, 2026-08-28] Canva `list-brand-kits` (16), `search-designs` sorted modified_descending (50 + continuation), `search-folders` "zao" (4); Slack `slack_search_channels` query "a", all types, archived included (3); Dropbox `list_folder` root non-recursive (4); Google Drive `list_recent_files` (15); Gmail `list_labels` (19 labels with counts); Calendly `users-get_current_user`; supabase-cowork `list_tables` public (38 tables with row counts).
- [FULL - `claude mcp list` run from this worktree 2026-08-28 09:0x] transport health for 26 entries, including `notion ... Disabled for this project` and `paragraph ... Needs authentication`.
- [FULL - `~/.claude.json` read with python, keys only] global `mcpServers` (7) and the ZAO OS V1 project entry with `disabledMcpServers: ['notion']`.
- [FULL - ssh to the VPS, journald + env-var names only] `journalctl --user -u zoe-bot --since "7 days ago"`: 73 x `[zoe/discord] DISCORD_BOT_TOKEN not set, skipping Discord client`; `grep -oE '^(DISCORD_...)='` on `~/zao-bot-live/bot/.env`: no match.
- [FULL - repo read] `bot/src/zoe/discord.ts` (309 lines, header), `bot/src/zoe/discord-webhook.ts` (70 lines, header), `bot/src/zoe/scheduler.ts:78,313`.
- [FULL - `gh api repos/.../contents/LICENSE`, base64-decoded, first lines read] `github/github-mcp-server` MIT; `homeassistant-ai/ha-mcp` MIT; `StevenStavrakis/obsidian-mcp` MIT; `cyanheads/obsidian-mcp-server` Apache-2.0; `barryyip0625/mcp-discord` MIT; `Oratorian/discord-node-mcp` MIT; `chigwell/telegram-mcp` Apache-2.0; `mcp-telegram/mcp-telegram` MIT; `ParthJadhav/telegram-notify-mcp` MIT; `ZubeidHendricks/youtube-mcp-server` MIT; `zxl777/youtube-transcript-mcp` MIT; `whopio/whop-mcp-server` Apache-2.0; `royshil/obs-mcp` GPL-2.0; `manimohans/farcaster-mcp` MIT; `iqaicom/mcp-discord` MIT; `pulsemcp/mcp-servers` MIT; `anthropics/claude-plugins-official` Apache-2.0; `modelcontextprotocol/servers` "undergoing a licensing transition from the MIT License to the Apache Li[cense]". No LICENSE file (LICENSE and LICENSE.md checked): `v-3/discordmcp`, `vercel/vercel-mcp-overview`, `calcom/cal-mcp`; `calcom/companion` root and `apps/mcp-server` directory listings contain no licence file.
- [FULL - `gh api repos/X` + `/contributors?per_page=100`] stars, `pushed_at`, `archived`, contributor counts for every repo in section 3, 2026-08-28.
- [FULL - `gh search repos`, sorted by stars] queries: discord / telegram / farcaster / neynar / obsidian / obs studio / youtube / whop / arweave / ardrive / cal.com / home assistant / cron scheduler / file watch mcp.
- [FULL - official MCP registry JSON, `https://registry.modelcontextprotocol.io/v0/servers?search=<q>&limit=8`] 17 queries; 0 results for farcaster, neynar, cal.com, restream, whop, arweave, ardrive.
- [FULL - `gh api .../claude-plugins-official/contents/external_plugins`] 15 plugins listed (asana context7 discord fakechat firebase github gitlab greptile imessage laravel-boost linear playwright serena telegram terraform); Discord and Telegram plugin READMEs decoded and read.
- [FULL - curl + HTML strip, raw text] `code.claude.com/docs/en/channels` (19,751 chars: "Channels are in research preview", "Telegram, Discord, and iMessage are included", `/discord:configure <token>` -> `~/.claude/channels/discord/.env`); `linear.app/docs/mcp` (OAuth 2.1 + DCR, `/mcp/readonly`); `vercel.com/docs/mcp/vercel-mcp` (`https://mcp.vercel.com`, OAuth); `developers.notion.com/docs/mcp`; `www.home-assistant.io/integrations/mcp_server/` (`/api/mcp`, token); `docs.discord.com/mcp` and `docs.whop.com/mcp` (both "read-only and scoped to" the docs site).
- [FULL - `gh api repos/whopio/whop-mcp-server/readme`, decoded] hosted endpoint `https://mcp.whop.com/mcp`, browser OAuth, separate from `@whop/mcp`.
- [FULL - `raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md`] 170 lines; reference servers archived to `servers-archived`.
- [PARTIAL - exa `web_search_exa`, highlights not the page] `cal.com/docs/mcp-server` (hosted `https://mcp.cal.com/mcp`, OAuth 2.1, 34 tools), `github.com/calcom/companion/blob/main/apps/mcp-server/README.md` (57 tools, OAuth 2.1 + PKCE); `docs.neynar.com/docs/neynar-farcaster-with-cursor` (`https://docs.neynar.com/mcp`); `docs.discord.com/developers/change-log` (docs MCP announced); `mcp.directory/blog/discord-mcp-complete-guide-2026` and `enterpret.com/guides/the-5-best-mcp-servers-for-discord-community-feedback` (both: "Discord has no official MCP server"; the Enterpret piece cites a review of ~7,000 public MCP servers - 8.5% OAuth, 41% no auth - a figure this doc did not verify); `claude.com/connectors`, `claude.com/docs/connectors/directory`, `support.claude.com/.../11176164` (directory shared across Claude products; free users limited to one custom connector).
- [PARTIAL - HTTP status + `<title>` only] `mcp.cal.com` 401, `mcp.vercel.com` 401, `mcp.whop.com` 200 "Connect Whop", `mcp.neynar.com` no response, `docs.neynar.com/docs/neynar-mcp-server` 404, `cal.com/docs/developing/mcp` 404, `www.canva.dev/docs/connect/mcp/` 404, `docs.ar.io/build/ai/mcp` 404.
- [FULL - HN Algolia keyless API, 5 queries] top hit per query: "Show HN: Klavis AI - Open-source MCP integration" (79 points, 50 comments, 2025-05-05, `news.ycombinator.com/item?id=43896410`); "Show HN: Open-Source Notion MCP Server" (9 points, 0 comments, 2025-12-15, id=46274686); "Show HN: Grove - Open-source remote MCP server for Obsidian vaults" (3 points, 2026-04-14, id=47764493); "DiscordMcp: Controlling Servers Through MCP" (2 points, 2026-05-14, id=48134875). Community signal is thin and is reported as thin.
- [FAILED - `~/bin/zao-fetch-reddit.sh --selftest`] public `.json` returns `text/html`; 1 of 3 redlib instances answered 200. No Reddit thread read.
- [FULL - vault + repo reads] `~/zao-vault/notes/glue-first-standard.md`, `orca-organization.md` conventions 10-12, `daily/2026-08-26.md` (FOR ZAAL 1-16), `2026-08-27.md` (17-21, system-audit corrections), `2026-08-28.md`; docs 2412, 2411, 2317, 2421 Key Decisions.
