---
topic: music
type: audit
status: research-complete
last-validated: 2026-09-28
superseded-by:
related-docs: "business/584-empire-builder-farcaster-creator-playbooks, agents/2040-suchbot-evaluation-for-zoe"
original-query: "https://github.com/mxjxn/cryptoart-studio - what it is, who built it, whether it is live, and what it means for The ZAO (artist tooling, FISHBOWLZ, WaveWarZ, poidh, Farcaster mini apps)"
tier: STANDARD
---

# 2574 - CryptoArt Studio: one artist's Farcaster auction stack, and the one thing ZOUNZ does not do

> **Goal:** Decide what, if anything, The ZAO takes from `mxjxn/cryptoart-studio` - measured against what ZAOOS already runs on Base today.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DO NOT fork or vendor this code.** | **There is no LICENSE file and the API licence field is `NONE`.** That is all rights reserved, not public domain (`.claude/rules/credit-attribution.md`). The README says "This repository is open source" and **the repository does not carry a licence that makes that true.** Copying any of it is a legal exposure, not a technical choice. |
| 2 | **STUDY the seller registry, which is the one primitive ZAOOS lacks.** | ZAOOS already runs a live on-chain auction on Base - `src/components/zounz/ZounzAuction.tsx`, viem + wagmi, real `writeContract` bidding against a Nouns Builder DAO. But a Nouns Builder auction sells **one token per period from one treasury**. It cannot let 188 community members list their own work. cryptoart-studio's "membership-based seller registry" is exactly that missing piece. |
| 3 | **ASK mxjxn directly rather than reverse-engineering.** | He is already in our data: ranked **#7 in the Empire Builder leaderboard at $1,436** (`business/584-empire-builder-farcaster-creator-playbooks`, line 52), and `snap.mxjxn.com` appears in `agents/2040-suchbot-evaluation-for-zoe`. He is a Farcaster artist we have measured twice, not a stranger. A licence clarification and a conversation cost one message; a reimplementation costs a quarter. |
| 4 | **SKIP the LSSVM half for now.** | `mxjxn/such-lssvm` has **0 stars and no push since 2026-07-01**, three months stale, while the main repo was pushed 2026-09-16. NFT liquidity pools are not a problem The ZAO has. |

## What it actually is

A Turborepo monorepo for **the Cryptoart channel on Farcaster**, built by **Max Jackson (mxjxn)** - an artist with his own Manifold contracts at `mxjxn.art`, not a tooling company. He forked **Manifold Gallery's auctionhouse** and deployed it on Base so artists in his channel could auction their own work.

Four pieces, per the README:

1. **MVP App** - marketplace with auctions, curation and social features
2. **Creator Core Contracts** - extendible ERC721/ERC1155 with an extension system and upgradeable proxies
3. **Auctionhouse Contracts** - the Manifold Gallery fork, with a membership-based seller registry
4. **Auctionhouse Subgraph** - The Graph indexer for marketplace events

## Is it live? Yes, and it was checked on chain rather than taken from the page

The docs site claims "All contracts are deployed on Base Mainnet". That claim was verified directly against a Base RPC with `eth_getCode`, **with a control**:

| Address | What | `eth_getCode` |
|---|---|---|
| `0x1Cb0c1F72Ba7547fC99c4b5333d8aBA1eD6b31A9` | cryptoart Auctionhouse Marketplace | **426 chars, DEPLOYED** |
| `0xF6B4bDF778db19DD5928248DE4C18Ce22E8a5f5e` | LSSVM Router | **34,900 chars, DEPLOYED** |
| `0xCB80Ef04DA68667c9a4450013BDD69269842c883` | **ZOUNZ**, ours, for comparison | **1,052 chars, DEPLOYED** |
| `0x000000000000000000000000000000000000dEaD` | control, must have no code | **2 chars, NO CODE** |

The control is the point: the check can return a negative, so the three positives mean something. Both public surfaces also answer HTTP 200 - `mxjxn.github.io/cryptoart-studio/` (22,729 bytes) and `snap.mxjxn.com` (1,200 bytes) - while a nonexistent host on the same command returns `000`.

**Note on the 426 characters.** That is about 213 bytes of bytecode, small enough to be a proxy rather than a full implementation. Deployed is established; what sits behind it is not, and nobody read the storage slot.

## Who built it, measured

`zao-research-snapshot mxjxn/cryptoart-studio`, 2026-09-28:

    stars 1   forks 1   watchers 0   issues 29   contributors 4
    licence NONE - all rights reserved
    last activity 2026-09-16
    top: mxjxn(904); Copilot(81); claude(4); cursoragent(3)
    36 commits in the last 90 days (control: a future window returns 0)

**904 of roughly 992 attributed commits are his.** The other three contributors are Copilot, Claude and Cursor. This is one artist plus AI assistants, shipping real deployed contracts, with **one star and 29 open issues**. Nobody is watching it, which is a fact about attention and not about quality - the contracts are on chain either way.

## The comparison that matters

| | **ZOUNZ (ours, live)** | **cryptoart-studio** | **poidh (ours, live)** |
|---|---|---|---|
| Shape | Nouns Builder DAO auction | Manifold Gallery fork | Bounty escrow |
| Who can sell | **The DAO only** | **Any registered member** | n/a, bounties not sales |
| Cadence | One token per period | Many concurrent listings | Per round |
| Chain | Base | Base | Base |
| Our code | `src/components/zounz/ZounzAuction.tsx` (348 lines), `src/app/api/cron/zounz-events/route.ts` | none | `~/Documents/zpoidh` |
| Licence to reuse | ours | **NONE - cannot copy** | ours |

**The gap is one sentence: ZAOOS can run an auction, and it cannot run a marketplace.** Ten files in ZAOOS mention `auction` and **zero mention `manifold`** (control: 58 files mention `farcaster`, so the grep works). Every auction path we have assumes a single seller.

For ZAOstock artists, FISHBOWLZ, or any of the 188 gated members wanting to sell their own work, that is the missing primitive - and cryptoart-studio is a working, on-chain, single-artist-built proof that the Manifold fork route is viable on Base.

## Findings

1. **"Open source" in a README is not a licence.** The repo says it is open source, ships `OPEN_SOURCE_GUIDE.md` and `OPEN_SOURCE_MIGRATION_SUMMARY.md`, and has **no LICENSE file**. This was checked by fetching the file, not by reading the API field, per Hard Requirement 13. The migration is in progress; the legal state today is all rights reserved.
2. **The repository is full of incident reports**, which is a signal of a real system rather than a demo: `AFFECTED_LISTINGS_REPORT.md`, `AUCTION_EARLY_TERMINATION_REPORT.md`, `DATABASE_CONNECTION_FIX.md`, `DISK_IO_SOLUTION_SUMMARY.md`. Somebody has been paged by this thing.
3. **It is an AI-built codebase and does not hide it.** `agent-checklist.mdx` sits at the root; Copilot, Claude and Cursor are three of its four contributors. Relevant to us because it is the same build method this estate uses, at a similar scale, by one person.
4. **The docs site is a developer-tools site, not a product site.** Title: "CryptoArt Studio - Developer Tools". It publishes contract addresses and integration guides. The intent is for other people to build on it, which makes the missing licence the binding constraint rather than a detail.

## Also See

- [business/584 - Empire Builder x Farcaster: Top-Creator Playbooks](../../business/584-empire-builder-farcaster-creator-playbooks/) - MXJXN at #7, $1,436, measured 2025-09-30
- [agents/2040 - Suchbot Evaluation for ZOE](../../agents/2040-suchbot-evaluation-for-zoe/) - `snap.mxjxn.com`, the same builder's Snap server
- Doc **2572**, parklet layout AI-CAD format, is **IN FLIGHT on PR #3684 and not yet on main** - cited as a PR, not as a path, because the path does not exist yet

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Message mxjxn on Farcaster asking (a) what licence he intends for the repo and (b) whether the membership seller registry is reusable - a reply, in the thread, is the shipped artifact | @Zaal | Outbound | 2026-10-08 |
| Open a ZAOOS issue titled "ZOUNZ auctions one token; members cannot list their own" citing this doc and `src/components/zounz/ZounzAuction.tsx` - the issue existing is the shipped artifact | @Zaal | Issue | 2026-10-08 |
| Re-snapshot `mxjxn/cryptoart-studio` and re-check for a LICENSE file; the first look recorded 1 star and no licence, and the second look is where this pays | @Zaal | Re-check | 2026-10-28 |

## Sources

- [github.com/mxjxn/cryptoart-studio](https://github.com/mxjxn/cryptoart-studio) - **[FULL, method: `gh api` repo + readme + contents, base64-decoded]** metadata, README, top-level tree, contributors
- [mxjxn.github.io/cryptoart-studio](https://mxjxn.github.io/cryptoart-studio/) - **[FULL, method: `curl` + python HTML strip]** HTTP 200, 22,729 bytes; contract addresses and chain read from the stripped text, not from a summary
- Base mainnet RPC `https://mainnet.base.org` - **[FULL, method: `eth_getCode` JSON-RPC with a control address]** all four results in the table above
- [github.com/mxjxn/such-lssvm](https://github.com/mxjxn/such-lssvm) - **[FULL, method: `gh api`]** 0 stars, last push 2026-07-01
- [snap.mxjxn.com](https://snap.mxjxn.com/) - **[PARTIAL, method: `curl`]** HTTP 200 but only 1,200 bytes, a JS shell; contents not read, and not escalated because nothing in this doc rests on it
- [manifold.gallery/eth:0x707c45204afa2abed0c322e1458540ddb0320851](https://manifold.gallery/eth:0x707c45204afa2abed0c322e1458540ddb0320851) - **[PARTIAL, method: WebSearch result listing]** establishes MXJXN Editions exists on Manifold; the page itself was not fetched
- [github.com/kugusha/art-farcaster](https://github.com/kugusha/art-farcaster) - **[PARTIAL, method: WebSearch result listing]** community index of Farcaster art channels; used only to corroborate that the Cryptoart channel is a known channel
- WebSearch, query `mxjxn Cryptoart channel Farcaster auctionhouse Manifold gallery Base` - **[FULL, method: WebSearch]** the community source for this doc; established that mxjxn is Max Jackson and that the auctionhouse is a Manifold Gallery fork
- ZAOOS local checkout, `src/components/zounz/ZounzAuction.tsx` and `src/app/api/cron/zounz-events/route.ts` - **[FULL, method: `grep` on the working tree, with a control term]** the ours side of the comparison

**Not established, stated so nobody inherits it as fact:** what sits behind the 426-byte auctionhouse address; whether the Cryptoart channel has meaningful volume; and whether mxjxn intends a permissive licence. The first needs a storage read, the second needs the subgraph, the third needs asking him.
