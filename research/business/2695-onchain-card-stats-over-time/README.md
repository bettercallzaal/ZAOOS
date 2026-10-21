---
topic: business
type: decision
status: research-complete
last-validated: 2026-10-21
superseded-by:
related-docs: business/2648-baserooms-os-product-review, business/2687-baserooms-mcp-connect, business/2529-zao-artist-trading-cards, business/2694-card-generator-stream-asks (open PR #4082)
original-query: "can u kepe researching more on all of these topics using the seat" (Zaal, 2026-10-21, zao-media pane). Topic 2 as routed by the seat: "Inscribing card stats on chain over time [1:26:42]; recursive on-chain inscription on Base as Slava explained in Zaal's interview last week; 'base room buddies' ($250k figure UNVERIFIED) [1:24:43]."
tier: QUICK
---

# 2695 - Card stats on chain over time: recursive inscription on Base, attestations, or events

> **Goal:** Pick how a ZAO TCG card's stats (for example a WaveWarZ artist's numbers) get written on chain once a day, so the history can be read back. Use what Slava explained about recursive inscription on Base as the reference build.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE EAS attestations on Base for the daily stat snapshot.** One schema such as `cardId, day, stats...`, one attestation per card per day, signed by a ZAO key. | EAS is a predeploy on Base at `0x4200...0021`. It answers `version()` = 1.0.1 and has 2,055 bytes of code. The schema registry is at `0x4200...0020`. Its README lists "Trust Scores" and "Clout" as uses, so a daily stat record is the intended use. Every attestation has a timestamp and an attester, and anyone can read it back from the chain. |
| 2 | **USE recursive inscription (SSTORE2 chunks, EthFS) only for the card ART and other large blobs. Do not use it for daily stats.** | Slava's method is for content too big for one block: "each note can be its own block... like 25 kilobytes" and new blocks "point at the old stuff" [Slava 10:07-10:45]. A day's stats are a few numbers. Chunked bytecode storage pays to deploy a contract per chunk, which daily small data does not need. |
| 3 | **Reuse EthFS's FileStore on Base instead of deploying our own store,** once the licence is settled. | FileStore `0xFe1411d6864592549AdE050215482e4385dFa0FB` has 7,153 bytes of code on Base, the same address as on Ethereum mainnet (a deterministic deploy). The repo moved to `frolic/ethfs`, which has 170 stars. **No LICENSE file was found** in the repo tree and the API licence field is empty. Unlicensed means all rights reserved, so ask before building on the contracts. |
| 4 | **Do not cite "a quarter of a million dollars" for Base Rooms Buddies.** | On stream [1:24:43] Zaal says "A quarter of a million dollars", but the transcript does not say what it measures. Measured on 2026-10-21 at Base block 52,918,195, Buddies `totalSupply()` = 422. At 10 USDC per mint (doc 2648) that is at most 4,220 USDC of mint revenue. Doc 2648 measured about 2,600 USDC on 2026-10-08. The $250k figure is UNVERIFIED and does not match either number. |
| 5 | **Build this after the card builder v1, not before.** Zaal said so himself. | Zaal [1:26:13]: "I don't want to build that where I'm at right now as a developer... I'm still in building good websites phase." |

## What Slava explained (BCZ YapZ, 2026-10-15)

Read from the YouTube auto-captions of https://youtu.be/PgSQk_YvJ90, 8:30 to 15:00.

| Point | Slava's words (caption timestamp) |
|---|---|
| Inscriptions on Base, coming from Bitcoin Ordinals | "I wanted to bring inscriptions to Base cuz like I came from the whole Bitcoin Ordinal world" (8:30). On Bitcoin "you have to pay thousands of dollars to be able to put anything into a block" (8:50) |
| Buddies fully on chain | "inscribe these Buddies on chain, put all the code alongside with them, um not having to use any external storage" (9:04) |
| Other apps read them because they are on chain and openly licensed | Chip Works, Highverse and OpenSea show a Buddy "because it's just on chain" (9:29-9:55) |
| Recursion | "put stuff in blocks and then mint new blocks to point at the old stuff" (10:09). A song of about 3 MB does not fit in one block, so each note goes in its own block of about 25 KB (10:24-10:32) |
| Licensing and x402 | "either use it freely or... just tag me... or pay me a penny through X402 now with your agent" (13:34-13:41) |
| His view on rights | Publishing on chain means "you have now allowed everyone to make copies of your work" (14:24-14:46). **That is Slava's opinion, not legal advice.** It matters for artists' cards and needs a lawyer before any ZAO copy repeats it |

## Options for stats over time

| Option | What it is | Readable by other contracts | Fits daily stats | Notes |
|---|---|---|---|---|
| **EAS attestation** (recommended) | One signed record per card per day, against a registered schema | Yes, through EAS | Yes | Predeploy on Base, v1.0.1. Free protocol, gas only. The attester address proves the record came from The ZAO |
| Event log | The contract emits `StatsSnapshot(cardId, day, data)` | No, only off-chain indexers can read it | Yes, and the cheapest | History lives in logs, so an app needs an indexer. No standard schema |
| Recursive inscription (SSTORE2 / EthFS) | Data stored as contract bytecode in chunks of up to 24 KB, recombined by a reader | Yes | No, more than daily numbers need | Right for card art, audio and code. EthFS README: "splits files into 24kb chunks (max contract size)" |
| Database only (today) | Stats in Supabase | No | Yes | What Zaal wants to move past: "inscribed on chain not just in a database" [1:27:05] |

Gas: Base `eth_gasPrice` read 0.0060 gwei on 2026-10-21. No transaction was estimated, so this doc makes no USD per-snapshot claim.

## The stream, for the record

- Zaal [1:26:42]: "if we can inscribe stats we can inscribe stats at a specific moment in time we can inscribe moments in wave wars history... we're gonna inscribe canon jones's stats every single day". ("canon jones" is Whisper's spelling. The artist is Cannon Jones.)
- Ohnahji [1:27:12], attributed from the words only (doc: zao-media shareout): "you got to get to new eden that's what we're doing... it's cron jobs documenting what's going on on the island on chain". That is topic 3 of this batch.

## What this means for The ZAO

A card's daily stats can be on chain and readable by anyone, on a chain where gas read 0.0060 gwei today (no per-snapshot cost was measured). The way to do it is an EAS attestation, not the recursive inscription Slava uses for art. Inscription is the tool for the card art itself.

## Also See

- [Doc 2648 - Base Rooms OS product review](../2648-baserooms-os-product-review/) - Buddies contract, mint price, the 2,600 USDC figure
- [Doc 2687 - Base Rooms MCP connect](../2687-baserooms-mcp-connect/)
- [Doc 2529 - ZAO artist trading cards](../2529-zao-artist-trading-cards/)
- Doc 2694 - the card generator stream asks (open PR #4082)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide whether daily card stats go on chain at all, and for which card first (Cannon Jones per the stream). Done when the answer is in the zao-tcg plan | Zaal | Decision | 2026-11-04 |
| Draft the EAS schema (card id, day, stat fields) and register it on Base Sepolia, not mainnet. Done when a PR in zao-tcg holds the schema and one test attestation's UID | bandzbuilds lane | PR | 2026-11-18 |
| Ask the EthFS maintainers about the licence before reusing FileStore for card art. Done when the answer is quoted in this doc | bandzbuilds lane | Todo | 2026-11-04 |
| Ask Zaal what "a quarter of a million dollars" at 1:24:43 measured, so the figure can be cited or dropped. Done when this doc's decision 4 is updated | Zaal | Decision | 2026-10-28 |

## Sources

- B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo, local mlx-whisper transcript, window 1:19:50 to 1:28:00 read in full [FULL]
- BCZ YapZ with Slava (Base Rooms), 2026-10-15, https://youtu.be/PgSQk_YvJ90 [PARTIAL - YouTube auto-captions 8:30 to 15:00 read in full. Audio download failed: `zao-ingest.sh` got HTTP 403, and yt-dlp offered only format 18. Captions are machine text, so the quotes may have small word errors]
- https://github.com/frolic/ethfs README [FULL - GitHub API; moved from holic/ethfs]
- https://github.com/ethereum-attestation-service/eas-contracts README, Base deployment section [FULL - GitHub API; LICENSE file reads MIT]
- https://docs.attest.org/docs/welcome [FAILED - HTTP 200 but a JavaScript shell with 30 characters of text; the README above replaced it]
- Base mainnet RPC https://mainnet.base.org: `eth_call totalSupply()` on Buddies `0x2B48fFaa0c453786EBF1a786c6f2e21Dcb97f29b` = 422; `eth_getCode` on EAS `0x4200000000000000000000000000000000000021` (2,055 bytes) and EthFS FileStore (7,153 bytes); `version()` = 1.0.1; `eth_gasPrice` = 0.0060 gwei; block 52,918,195 [FULL]
- Doc 2648 at origin/main `c68c0880f`, for the 10 USDC mint price and the 2,600 USDC figure [FULL]
