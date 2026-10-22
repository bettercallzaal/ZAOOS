---
topic: business
type: market-research
status: research-complete
last-validated: 2026-10-21
superseded-by:
related-docs: business/759-poidh-history-origin-to-2026, business/2522-poidh-live-bounty-market, business/2203-poidh-zao-full-lore-history, business/2234-leftclaw-x402-poidh-bounty-funding, agents/2659-new-eden-agent-world
original-query: "can u kepe researching more on all of these topics using the seat" (Zaal, 2026-10-21, zao-media pane). Topic 8 as routed by the seat: "Poidh and Kenny as on-chain social and p2p ad spend [1:17:56]; NARS among first clients."
tier: QUICK
---

# 2697 - POIDH as "onchain social": who builds on it, its agent interface, and the ad-spend framing

> **Goal:** Check what was said about POIDH on the 2026-10-21 B and Z Build stream (that it is onchain social, that people build clients on it, that NARS was an early one, and that bounties are better than ads) against POIDH's own surfaces and what is on GitHub today.

**This extends the POIDH docs, it does not repeat them.** History is in `business/759-poidh-history-origin-to-2026` (the number 759 is shared by two docs; this is the business one), the market in `business/2522-poidh-live-bounty-market`. Neither covers third-party builders, POIDH's agent interface, or NARS: a grep of every POIDH doc on origin/main for "nars", "client", "onchain social" and "advertis" finds only two unrelated "crypto clients" lines.

Stream: B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo. Timestamps are from its mlx-whisper transcript, which spells POIDH "Poid".

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE "an onchain social bounty protocol" when describing POIDH. It is POIDH's own wording.** | `https://poidh.xyz/llms.txt` (fetched 2026-10-21): "poidh ("pics or it didn't happen") is an onchain social bounty protocol where people create, fund, complete, and verify bounties using proof." That backs Zaal's account of Kenny's framing [1:17:56]. |
| 2 | **USE POIDH's MCP server for read-only ZAO agent work (finding bounties, reading accounts). Keep every `prepare_*` call behind a human signature.** | `https://poidh.xyz/api/mcp` answered `tools/list` with 11 tools: 4 reads (`find_bounties`, `get_bounty`, `get_account`, `get_leaderboard`) and 7 `prepare_*` tools that each build an unsigned transaction. The agent cannot sign, which is the safe shape. An outside report lists 20 findings against these tools (9 bugs, 6 inconsistencies, 5 UX/protocol issues), so do not trust them unchecked. |
| 3 | **The "people build clients on POIDH" claim is true. Record the builders. Do not assume they are maintained.** | A GitHub repository search for `poidh` on 2026-10-21 returned discovery tools, feeds, a marketplace, a mini app and several autonomous bots, most with 0 to 2 stars. Several were built as POIDH bounty entries (see the table). |
| 4 | **NARS: UNVERIFIED. Do not cite it as a POIDH client.** | One web search for NARS with POIDH found nothing, and NARS appears in none of the 600 casts Kenny (FID 2210) posted between 2026-09-17 and 2026-10-22. It may be Whisper mishearing a name. Ask Zaal. |
| 5 | **"Bounties as peer-to-peer ad spend" is Zaal's view and a fair one, not a measured return.** | Zaal [1:18:25-1:18:46]: "it's like 5, 10, 20x what I've put in at least. Not dollar value, but like what I see as... ad spend... I want to spend it on [poidh] because it's peer-to-peer." He says himself it is not a dollar figure. Measured BCZ round outcomes are in doc 2522. |

## Who builds on POIDH (GitHub, 2026-10-21)

From `gh search repos poidh`, read 2026-10-21. Stars at that moment. POIDH's own app is `picsoritdidnthappen/poidh-app`: MIT (LICENSE file), 39 stars, 73 forks, created 2024-01-09, last push 2026-10-21 (`pushed_at`).

| Kind | Repos (owner/name, stars) |
|---|---|
| Discovery and data | `agentatwork/poidh-atlas` ("Every poidh bounty on every chain, read straight from the contracts", 0), `agentatwork/poidh-payout-record` (per-issuer payout reliability, 0), `uShure/poidh-radar` (0), `kaythefriend/poidh-quest` (0), `Sarahluna77/poidh-bounty-huunt` (0) |
| Feeds and markets | `ren2140eth/poidh-reel` ("TikTok-style feed of poidh claim history", an entry for bounty 1306, 0), `arcabotai/poidhmp` ("claim NFT marketplace and discovery layer", 0) |
| Clients and front ends | `Heesho/poidh-miniapp` (0), `arcacomputer/poidhultra` (0), `Arinzaay007/onchain-poaps-frontend` (a POIDH bounty entry, 2) |
| Autonomous bots | `0x94t3z/poidh-sentinel` (4), `Pascaline06/poidh-bot` (2), `livinalt/poidh-bot` (0), `Akin-Tunde/PoidhBot` (0) |
| Agent tooling | `AlexanderCGKarlsson/poidhverse` ("public copy of the poidhverse... SKILL.MD for on-chain apps", 1). That account appears to be the builder of New Eden, whose world now holds an agent-built "poidh notice board" (doc 2659) |
| The ZAO's own | `bettercallzaal/poidhz` ("BCZ POIDH bounty ops: rounds, judging pages, brand kits, leaderboard"), public, last push 2026-10-21 |

POIDH's agent resources, per its `llms.txt`: an agent skill at `https://poidh.xyz/skill.md`, docs at `https://docs.poidh.xyz/`, and the open-source app. The app holds the MCP server at `src/app/api/mcp/route.ts` and the browser WebMCP tools at `src/components/global/WebMcpTools.tsx` (read from the repo tree).

## What this means for The ZAO

POIDH calls itself onchain social, and it is built for agents as well as people, with read tools and unsigned-transaction builders. The ZAO already runs bounties on it (`poidhz`). The next cheap step is letting a ZAO agent read open bounties through the MCP server, with a human signing anything that moves money.

## Also See

- [Doc 759 - POIDH history](../759-poidh-history-origin-to-2026/)
- [Doc 2522 - the live bounty market](../2522-poidh-live-bounty-market/)
- [Doc 2203 - POIDH and ZAO, full history](../2203-poidh-zao-full-lore-history/)
- [Doc 2234 - x402 to POIDH funding](../2234-leftclaw-x402-poidh-bounty-funding/)
- [Doc 2659 - New Eden](../../agents/2659-new-eden-agent-world/) - the poidh notice board inside the world

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Say what "NARS" was at 1:19:48, so it can be cited or dropped. Shipped when decision 4 is updated | Zaal | Decision | 2026-10-28 |
| Wire POIDH's MCP read tools (`find_bounties`, `get_bounty`) into one ZAO agent, with no `prepare_*` tool exposed. Shipped when a PR shows a bounty list read through it | bandzbuilds lane | PR | 2026-11-11 |
| Re-run the GitHub builder search and mark which repos had commits in the last 30 days. Shipped when this table carries an "active" column | bandzbuilds lane | Re-research | 2026-11-21 |

## Sources

- B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo, local mlx-whisper transcript, window 1:16:30 to 1:20:05 [FULL]
- https://poidh.xyz/llms.txt [FULL - curl, 643 bytes, quoted above]
- https://poidh.xyz/api/mcp, JSON-RPC `tools/list` [FULL - curl POST, read-only, 11 tools listed]
- https://github.com/picsoritdidnthappen/poidh-app [FULL - GitHub API: repo record, LICENSE file, README, file tree]
- https://github.com/swiftbotlab/poidh-mcp-edge-cases [FULL - README; the 20-findings count is that report's own]
- GitHub repository search `poidh`, 2026-10-21 [FULL - `gh search repos`, descriptions and stars as listed]
- Kenny's casts, FID 2210, 600 casts from 2026-09-17 to 2026-10-22, via `https://haatz.quilibrium.com/v2/farcaster/feed/user/casts` [FULL - searched for "onchain social", "nars", "client", "ad spend", "advertis", "peer to peer"; no hits]
- Web search "NARS poidh bounties integration client" [FULL - no relevant result]
- ZAOOS research POIDH docs on origin/main, grep for coverage [FULL]
