---
topic: governance
type: audit
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: "governance/2558-dao-periodic-reactivation-precedent, governance/2562-zao-fractal-state-and-build-plan, governance/981-fractal-bot-synthesis, governance/982-fresh-fractal-bot-rebuild-stack"
original-query: "we honestly need to build a proper system for the ZAO holders to approve it can u reivew all repos and see what has been built like that we have used snapshot in the past"
tier: STANDARD
---

# 2642 - How ZAO holders can approve a ZIP: every voting system already built, measured, and which to reuse

> **Goal:** Zaal asked, in answer to whether merging a ZIP means it is accepted (zao-papers #14; vault `decisions/grill-2026-10-08-grill-morning.md` item 5), for "a proper system for the ZAO holders to approve it", after a review of what has already been built. This doc inventories every approval or voting system across `bettercallzaal` and `ZAODEVZ`, read-only, says which is live, and recommends how ZIPs get approved by reusing what exists. **Nothing is built.**

## Summary

1. ZAO has built four ways to vote, not zero: OREC on-chain, a Snapshot space, an in-app proposal vote in ZAO OS, and a Nouns Builder DAO on Base.
2. Only one is live today: **OREC**, which had votes on 5 and 6 October 2026, almost all sent through one relayer wallet.
3. The **Snapshot space "ZAO" (zaal.eth)** is the one you remember. It ran 16 proposals from July 2024 to December 2025 with 29 votes in total, and it already counts the right tokens (OG plus ZOR Respect).
4. There is a catch documented in doc 2562: OREC counts only OG Respect, which stopped being minted in December 2025. Newer members hold ZOR, so on OREC they cannot vote.
5. The ZIP process already names OREC as the vote for governance ZIPs. What it lacks is a vote every Respect holder can join.
6. Recommendation: use the Snapshot space for the holder vote on ZIPs now (it already weighs OG plus ZOR, costs voters nothing, and needs no code), and keep OREC for anything that must execute on-chain. One decision is his: whether ZIP-2 itself goes to that vote.

## The inventory

| # | System | What it is | Live or dead (measured 2026-10-08) | Where it lives | Who can vote |
|---|---|---|---|---|---|
| 1 | **OREC** (ORDAO's Optimistic Respect-based Executive Contract) | On-chain proposals that execute after a vote window and a veto window | **LIVE.** Blockscout, transactions to the contract: `vote` 2026-10-06 16:30 UTC, `vote` 2026-10-05 23:00, `execute` 2026-10-05 22:39, all from `0x7234c36A...` | Optimism, `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | OG Respect holders only: "`OREC.respectContract()` returns `0x34cE...6957`, the OG ERC-20" (doc 2562). Rules from memory `reference_zao_respect_onchain_facts` (verified 2026-07-05): 72h vote, 72h veto, `minWeight` 1,000 Respect, `maxLiveYesVotes` 9. 130 proposals as of July, one relayer did 122 |
| 2 | **OG Respect** (ERC-20) | The original Respect token, fractals 1 to 73 | **FROZEN.** Latest direct transactions are transfers on 2025-12-18 (Blockscout); doc 2562 dates the newest transfer 2025-12-20 | Optimism, `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Holding it is the vote weight on OREC and on Snapshot |
| 3 | **ZOR Respect** (ERC-1155) | Respect from fractals 74 onward | Minted through OREC executions, so it moves without its own direct transactions (one direct transaction on Blockscout, 2025-09-11) | Optimism, `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Counted by Snapshot and by ZAO OS; NOT counted by OREC |
| 4 | **Snapshot space "ZAO"** | Gasless off-chain voting | **DORMANT.** Snapshot GraphQL: 16 proposals, first 2024-07-30, last 2025-12-21 ("Testing 1 Prop", 0 votes). 29 votes across all 16, median 1. 11 followers. Recent ones were monthly priority polls ("ZAO – 10/1/25-10/31/25 – 6PM EST", 1 vote) | `snapshot.org/#/zaal.eth`; configured in ZAOOS `community.config.ts` (`space: 'zaal.eth'`, "Used for weekly priority polls with approval voting") | Strategies, read from the GraphQL: `erc20-balance-of` on OG (symbol "ZAO", Optimism) **plus** `erc1155-balance-of` on ZOR. So OG and ZOR holders both count |
| 5 | **ZAO OS in-app proposals** | Proposals, comments and votes inside the ZAOOS app; vote weight "= user's current on-chain OG + ZOR balance" | Code is on main: `src/app/api/proposals/` (route, vote, comment, test-publish, with tests), session-guarded (`getSessionData`), stores to the `proposals` table. **How many proposals exist and when the last vote was: UNKNOWN** (a production database read was not made) | ZAOOS `src/app/api/proposals/`, `src/lib/respect/voteWeight.ts`, `src/components/governance/` (`DiscordProposals`, `ProposalComments`, `SnapshotPolls`, `CreateWeeklyPoll`, `LiveFractalDashboard`, `EventsCalendar`) | Signed-in ZAO OS members with Respect; weight is OG plus ZOR, and the route refuses a vote if a balance read fails |
| 6 | **ZOUNZ** (Nouns Builder DAO) | An auction-minted NFT DAO with a governor and treasury | **Token supply 15** (read directly: `totalSupply()` on Base). Governor activity: UNKNOWN (Base's explorer returned 403) | Base: token `0xCB80Ef04DA68667c9a4450013BDD69269842c883`, governor `0x9d98ec4ba9f10c942932cbde7747a3448e56817f`, treasury `0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f` (ZAOOS `src/lib/zounz/contracts.ts`); UI in ZAOOS `src/components/zounz/` and `src/app/api/zounz/proposals/` | Holders of the 15 ZOUNZ NFTs |
| 7 | **`bettercallzaal/ZOUNZ` repo** | Not the DAO: "Farcaster Music Mini App - AI music generation, Audius discovery, Zora NFT minting on Base, Attention Markets on Solana" | Archived (repo flag), last pushed 2026-08-25 | GitHub | Not a voting system |
| 8 | **The weekly Fractal** (Respect Game) | Small-group consensus meetings that distribute Respect; also a ratification route in the ZIP process | Running weekly (ZAODEVZ/ZAOfractal README: "run unbroken on Mondays at 6pm EST since around August 2024"); OREC's 5 and 6 October activity fits a Monday session | `bettercallzaal/zao-fractal-bot` (Discord bot, rebuild pushed 2026-09-29, uses `@ordao/orclient`), 9 archived earlier bot repos, ZAODEVZ/ZAOfractal (papers site) | Fractal participants, by peer ranking |
| 9 | **`zaofractal-contracts`** | "soulbound ZAORespect token (drop-in for OREC) ... Pre-launch, unaudited" | **NOT DEPLOYED** (its own description) | Private repo `bettercallzaal/zaofractal-contracts` | Not yet |
| 10 | **Hats tree 226** | Role management, not voting | Configured (`community.config.ts`: tree 226, Optimism) | Optimism Hats v1 | Roles, not votes |

Also found, not a voting system: `bettercallzaal/nouns-snap` (README could not be decoded), `zao-papers` (the ZIP documents themselves), `downeast-zao` (a governance idea, paused on 2026-10-08 per seat item 56).

## What the ZIP process already says

`bettercallzaal/zao-papers` `PROCESS.md`, "Ratification Process" (read raw):
- Small / Process ZIPs: "No formal vote needed if no objections after 1 week review".
- Governance / Fractal ZIPs: "Ratified through The Fractal (weekly Respect-weighted consensus game) OR voted via ORDAO/OREC on-chain".
- Protocol / On-Chain ZIPs: "Voted via ORDAO (Respect-weighted governance). Must pass OREC conditions: YES votes > 2x NO votes, meeting participation threshold".
- Framework / Foundational ZIPs: "Ratified through Fractal discussion + community consensus. May require explicit Zaal approval".

So the process is written. The question in zao-papers #14 is whether a merge counts as acceptance; PROCESS.md says ratification first.

## The gap

1. **OREC leaves out newer members.** It reads OG only, and OG has been frozen since December 2025 (doc 2562, decision 1). Anyone who joined after fractal 73 holds ZOR and has no OREC vote. ZIP-2 (Season 3) proposes an activation wrapper partly to fix this, and doc 2562 says to decide "whether the activation wrapper wraps OG, ZOR, or a sum of both" before building.
2. **OREC is effectively one operator.** 122 of 130 proposals came from one relayer (memory, July); today's transactions are from the same address. A holder vote that only one wallet submits is not yet a holder vote.
3. **Snapshot counts the right people but nobody uses it.** It already weighs OG plus ZOR. Its last real proposal had one vote.
4. **The ZAO OS proposal vote counts the right people too**, but its use is unmeasured.

## Recommendation (reuse, build nothing)

| Step | What | Uses | Who |
|---|---|---|---|
| 1 | **ZIPs are approved by a Snapshot vote in the existing "ZAO" space**, open for a fixed window, weighted by OG plus ZOR exactly as the space is already configured | Snapshot `zaal.eth` (system 4) | A ZIP author or the seat creates the proposal; creating it is a public post, so Zaal's step |
| 2 | **Pass rule borrowed from what is written:** OREC's "YES votes > 2x NO votes", plus a quorum stated as a share of the active pool (doc 2558: "Define quorum as a percentage of the CURRENT active pool") | PROCESS.md, doc 2558 | Written into PROCESS.md by a ZIP, which is itself the first thing voted on |
| 3 | **Anything that must execute on-chain still goes through OREC** after the Snapshot vote passes | OREC (system 1) | The usual relayer |
| 4 | **Merge records, the vote accepts.** A ZIP PR merges as Draft or Review; its status changes to Accepted only with a link to the passed vote | zao-papers PROCESS.md | ZIP author |
| 5 | **Later, not now:** when ZIP-2's wrapper is decided, point OREC at a token that includes ZOR, so the on-chain path and the Snapshot path count the same people | `zaofractal-contracts` (system 9), doc 2562 | Needs audit; out of scope here |

Why Snapshot for step 1: it is the only existing system that is gasless for voters, already counts both OG and ZOR holders, and needs no code. Its weakness is low past turnout (median 1 vote), which a holder-approval process would have to fix by asking people, not by building.

The ZAO OS in-app vote (system 5) is a reasonable alternative front end, but its usage is unmeasured and it would need a database read to confirm it works in production. ZOUNZ (system 6) has 15 NFTs and is a different electorate from Respect holders.

## Decisions for Zaal (one each)

- **zips-1 (zao-papers #14):** merge records, a vote accepts? This doc's evidence supports option A as asked.
- **Which vote:** Snapshot "ZAO" space for ZIP approval (recommended), OREC only, or the ZAO OS in-app vote.
- **ZIP-2 first:** does ZIP-2 itself go to the holder vote it would define?

## Sources

All read 2026-10-08.

1. Snapshot GraphQL, `https://hub.snapshot.org/graphql`, space `zaal.eth` and its 100 latest proposals [FULL, raw JSON]
2. Optimism Blockscout API v2, transactions to OREC, ZOR and OG [FULL, raw JSON, first page each]
3. Base RPC `mainnet.base.org`, `totalSupply()` on the ZOUNZ token [FULL]; Base Blockscout for the governor [FAILED: HTTP 403]
4. ZAOOS origin/main: `community.config.ts` (snapshot, respect, hats, zounz blocks), `src/lib/zounz/contracts.ts`, `src/lib/respect/voteWeight.ts`, `src/app/api/proposals/vote/route.ts`, file lists of `src/components/governance/` and `src/app/(auth)/governance/` [FULL for what is cited]
5. ZAOOS docs 2558 and 2562, key-decision tables [FULL for the rows cited]; 159 doc folders under `research/governance/` (counted, not read)
6. `bettercallzaal/zao-papers`: README, `PROCESS.md` ratification section, `zips/zip-0002-season-3.md` by keyword [FULL / PARTIAL]
7. READMEs of `bettercallzaal/zao-fractal-bot`, `bettercallzaal/zaofractal-contracts` (Foundry boilerplate only), `ZAODEVZ/ZAOfractal` [FULL]; `bettercallzaal/nouns-snap` [FAILED: README did not decode]
8. `gh repo list` for both owners, filtered by governance terms [FULL]
9. Agent memory `reference_zao_respect_onchain_facts` (verified on-chain 2026-07-05) [FULL; not re-verified today except OREC's latest activity]

Not measured: the number of rows in ZAO OS's `proposals` table, ZOUNZ governor proposals, the current Respect holder count (156 as of 2026-07-05), and whether `zao-fractal-bot` is running on the VPS today.
