---
topic: agents
type: decision
status: awaiting-zaal-approval
last-validated: 2026-10-17
related-docs: "1135, 2679, 2432, 601, 1187, 116"
original-query: "make (1) lane about making the zoe better i wanna use it more in telegram and also in discord lets make a discord version of it (Zaal, via the seat, 2026-10-17)"
tier: STANDARD
---

# 2685 - ZOE on Discord: the second adapter already exists, here is what it needs

> **Goal:** Zaal wants to use ZOE from Discord as well as Telegram. CLAUDE.md says no new bot without a numbered doc and his explicit approval. This doc shows that there is no new bot to approve. ZOE's Discord adapter is built, wired into the one ZOE process and running on the same brain. It is off only because no token is set. The doc names what it lacks against Telegram and asks him one question.

Written Sat 17 Oct 2026, 19:2x to 19:4x UTC (clock from `date -u`), by the zoe lane. The code was read on ZAOOS main at ca1e8359f. The VPS was read only: the journal and `zoe-liveness`. Nothing was restarted and no env value was read.

## Key decisions

| Decision | Call | Why |
|---|---|---|
| Build a Discord bot | **NO, it exists** | `bot/src/zoe/discord.ts` (327 lines) is booted by `bot/src/zoe/index.ts:65` and `:4951` inside `zoe-bot.service`. It is one process and one poller per platform, and it calls the same `runConciergeTurn` as Telegram (`discord.ts:199`). It shipped in 4ce58a20 (2026-07-14), #1807 (2026-07-21) and #3565 (2026-09-18); doc 1135 is its design. |
| Why it is silent | **No token on the VPS** | The VPS journal, read 2026-10-17, prints `[zoe/discord] DISCORD_BOT_TOKEN not set, skipping Discord client` on every boot (5 boots today, the last at 19:20 UTC). `discord.ts:118-121` returns early when the token is unset. |
| Turning it on | **Zaal's, two steps** | (1) Create the Discord application and bot in the Developer Portal and invite it to the server or servers he picks. (2) Put `DISCORD_BOT_TOKEN` and `DISCORD_ZAAL_ID` in ZOE's env on the VPS and restart. Both are settings and credentials (`/secret` for the token), so neither is a lane's to do. |
| Message Content intent | **DROP it before go-live** | `discord.ts:128` asks for `GatewayIntentBits.MessageContent`, a privileged intent. ZOE reads only DMs and @mentions (`discord.ts:150-170`). Discord's docs say content is delivered without the intent for "Direct Messages sent to your app" and "Messages that @mention your app" (quoted below). Dropping it means less data and no Portal toggle. |
| Spend cap | **ADD before go-live** | Telegram member DMs are capped per hour (`member-dm.ts`, `ZOE_MEMBER_DM_PER_HOUR`, wired at `index.ts:2347`). Discord has no cap of any kind. A grep of `discord.ts` for `rate`, `limit`, `budget`, `cooldown` and `cap` found none. Any server member who DMs or @mentions ZOE gets a full model turn, unlimited. |

## 1. What already works (code on main, ca1e8359f)

| Behaviour | Where |
|---|---|
| Responds to DMs from anyone and to @mentions in server text channels; never posts on its own | `discord.ts:150-170` |
| Same brain: `runConciergeTurn` with memory from `buildMemoryBlocks`, in ZOE's voice | `discord.ts:177-210` |
| Memory scoped like Telegram groups. Only Zaal's own DM gets `private`; any other DM or channel gets a sanitized scope | `discord-scope.ts:24-28` (fix #3565, 2026-09-18) |
| Tools only in Zaal's own DM; every other scope only talks | `discord.ts:208` (`toolPolicyForScope`), and #3975 for the talk-only CLI path |
| Community answers can wait for Zaal's Approve / Regen / Skip buttons in his Discord DM, and are held, not sent, if he cannot be reached | `discord.ts:215-246`, `:270-325`, `discord-scope.ts:35-37`; behind `DISCORD_COMMUNITY_ASKS_ENABLED=1` |
| 2000-character chunking, typing indicator, error replies | `discord.ts:56-70`, `:170`, `:251-263` |
| Status mirror by webhook, no bot needed | `discord-webhook.ts` (`postStatusToDiscord`), **built but not wired**: a grep for callers outside the module found 0 |

A separate Discord bot, ZAI (`bot/src/zai/`, doc 1187), does voice capture under its own token (`DISCORD_CAPTURE_TOKEN` / `ZAI_DISCORD_TOKEN`, `zai/config.ts`). It is a different identity with a different job. This doc does not touch it, and the two must never share a token.

## 2. Gaps against Telegram, smallest first

| # | Gap | Fix | Size |
|---|---|---|---|
| D1 | No spend cap on Discord turns | Reuse `newMemberDmLimiter` from `member-dm.ts`, keyed by Discord user id. Zaal is exempt; one plain line when the limit is hit | ~30 lines + tests |
| D2 | Privileged Message Content intent requested but not needed | Remove `GatewayIntentBits.MessageContent` from `discord.ts:128` and the doc comment at `:14-18` | 3 lines + a test on the intent list |
| D3 | No live log line on success | The connect log at `discord.ts:134` exists. Add `featureRan('discord-reply', ...)` on the reply path so "it is live" can be measured (`state-claims.md`, "Silence is not evidence") | 1 line |
| D4 | Owner gets text only, no buttons | On Telegram, Zaal answers by tapping. In his Discord DM the grill and waiting cards could carry the same A/B/C buttons. **Not first:** this is a second copy of the card UI, and doc 2432 caps interrupts at one surface. Recommended: keep his questions on Telegram, so Discord answers when asked and pushes nothing | after he has used it |
| D5 | Status mirror not wired | Call `postStatusToDiscord` where the group status already goes, under `DISCORD_WEBHOOK_STATUS` (unset means no-op today) | small, after D1 to D3 |
| D6 | Slash commands | `/ask` and `/task` as application commands (doc 1135 Stage 1). Mentions already cover asking, so this is polish | later |

## 3. The surface rule on Discord (mirrors the Telegram rule)

- **Zaal's Discord DM:** his private ZOE, the same as his Telegram DM. Full memory, tools, answers when he asks. **Questions to him stay on Telegram** (one interrupt surface, doc 2432). Discord pushes nothing to him unprompted.
- **Server channels:** answer only when @mentioned, sanitized scope, talk-only. Turn on `DISCORD_COMMUNITY_ASKS_ENABLED=1` if a non-owner answer should wait for his tap before it posts. That is the Telegram rule "group = status, never his private context".
- **Other people's DMs:** sanitized scope, talk-only, capped by D1.
- **Which servers and channels:** his fact, so it is part of the question in section 5. The vault socials map lists two candidates: "The ZAO" Discord and the "BetterCallZaal Server" (`~/zao-vault/notes/socials-map.md`). The adapter answers in every channel of every server it is invited to, so the invite list is the channel list.

## 4. Operating limits

- **One poller per token:** a Discord gateway token in two processes means both receive every event and both reply. The adapter lives only in `zoe-bot.service`. The token must not be reused by ZAI, a Mac run or a test. Rule 9 of `agent-loops.md`, the same as `project_zoe_one_instance_409`.
- **Cost:** D1 caps other people. Zaal's own turns cost what his Telegram turns cost. `send-budget.ts` wraps Telegram's `bot.api` only, so Discord replies are outside its daily cap. D1 is what bounds them.
- **Library:** discord.js 14.14.0, pinned in `bot/package-lock.json` and already installed. No new dependency.

## 5. The question for Zaal (sent through the seat)

ZOE on Discord: it is already built on the same ZOE, it is off only because there is no Discord token. How do you want it turned on?

- **A (recommended):** I ship D1 to D3 (cap, drop the privileged intent, live log) as one PR first. Then you create the Discord bot, invite it to The ZAO server, and set the token. Your DM gets full ZOE; channels answer on @mention only, with your Approve button on community answers.
- **B:** Same as A, but only your Discord DM to start. Invite it to a private server with just you, and open it to The ZAO server after a week.
- **C:** Not now. Keep ZOE on Telegram only. The doc and the code stay as they are.

## 6. What not to build

- No second Discord bot, no second persona, no "ZOE for Discord" process (doc 601, CLAUDE.md).
- No Discord copy of the grill or of the waiting cards (D4) until he asks for one.
- Nothing posted on his behalf. Community answers can wait for his tap, and the adapter never posts unprompted.

## Sources

- [FULL] ZAOOS main at ca1e8359f, read in a worktree 2026-10-17: `bot/src/zoe/discord.ts`, `discord-scope.ts`, `discord-webhook.ts`, `index.ts` (lines 65, 2343-2347, 4949-4951), `member-dm.ts` (header), `bot/src/zai/index.ts` and `config.ts` (headers), `bot/package-lock.json` (discord.js 14.14.0). History: `git log -- bot/src/zoe/discord.ts`.
- [FULL] VPS `journalctl --user -u zoe-bot`, last 7 days, read 2026-10-17 19:2x UTC: the `DISCORD_BOT_TOKEN not set` line on each boot. `scripts/agents/zoe-liveness.py --remote`: live host at ca1e8359, `bot=active`.
- [FULL] Discord developer docs, raw from GitHub `discord/discord-api-docs` main, fetched 2026-10-17 19:33 UTC with curl:
  - `developers/gateway/you-might-not-need-a-privileged-intent.mdx` (200, 10,554 bytes). Lines 108-114, verbatim: "The Message Content intent is **not** needed for your app to access message content in these situations: ... **Direct Messages sent to your app** ... **Messages that @mention your app**".
  - `developers/events/gateway.mdx` (200, 52,760 bytes). Line 302: privileged intents must be toggled in the Developer Portal, and verified apps (required in 100+ guilds) need approval. Line 304: an unconfigured privileged intent closes the connection with code 4014.
- [FULL] Doc 1135 (`research/agents/1135-discord-agent-capabilities/index.md`), the stage plan this doc updates. Its Stage 0 runbook is still the go-live path, except that it predates D1 and D2.
- `~/zao-vault/notes/socials-map.md`, section "BetterCallZaal (personal)" and "The ZAO DAO", for the two candidate servers.

## Next actions

| Action | Owner | Type | By when |
|---|---|---|---|
| Answer section 5 (A, B or C) | Zaal | gated, his fact | his next tap window |
| On A or B: PR with D1 to D3, flag-free because the adapter is off until the token exists | zoe lane | PR | after his answer |
| Create the Discord app and bot, invite to the chosen server, set `DISCORD_BOT_TOKEN` and `DISCORD_ZAAL_ID` via `/secret`, restart ZOE | Zaal | settings and credential | after the PR merges |
| Verify live: `[zoe/discord] connected as` in the journal, then one DM round trip | zoe lane | read-only | after the restart |
