---
topic: community, governance, technology
type: whitepaper-draft
status: DRAFT — Chapters 2, 3, 4. Connect to existing Draft 4.5 (Chapter 1 = research/community/051-zao-whitepaper-2026/drafts/draft-4.4.md). Complete Chapters 5-7 per rebuild spec (docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md).
last-validated: 2026-07-20
related-docs: 051-zao-whitepaper-2026, 1542-zao-geo-entity-brief, 1272-zao-agent-stack-jul2026, 058-respect-deep-dive
board-tasks: "ZAO Protocol Whitepaper rebuild — Chapter 2 onward"
action-owner: Zaal (voice pass + diagrams); ZOE (auto-cite from Bonfire when read-path opens)
---

# 1613 — ZAO Protocol Whitepaper: Chapters 2, 3, 4 (Draft)

> **What this is:** Draft for Chapters 2, 3, and 4 of the ZAO Protocol Whitepaper rebuild. Chapter 1 = existing Draft 4.5 (`research/community/051-zao-whitepaper-2026/drafts/draft-4.4.md`, keep as-is). Chapters 5-7 follow in a subsequent doc. Rebuild spec: `docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md`.
>
> **Voice target:** Clear, simple, spartan. Short sentences. Active voice. Technical precision. No jargon for jargon's sake. Builder audience — founders, devs, researchers.

---

## Chapter 2 — The Protocol Architecture

The ZAO is not one app. It is not one chain. It is a coordination layer.

Think of it as a stack. Four layers, each with a different job.

---

**Layer 1: Identity**

Every ZAO participant gets a stable identity. Three components:

- **ZID** — an off-chain numeric ID assigned sequentially. It binds social handles (Farcaster, X, Discord) to a wallet address. Stored in the ZAO OS user table. Not a contract. A directory.
- **ENS** — Ethereum Name Service handles (`.eth`) for human-readable wallet names. ZAO members link their ENS to their ZID.
- **Hats Protocol roles** — on-chain permissions on Optimism, deployed at `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`. Roles encode who can propose to the OREC, who can moderate channels, who holds admin keys. Role hierarchy: Zaal holds the top hat; sub-hats are distributed to contributors.

Identity is persistent. Wallets can change. ENS names can transfer. Hats can be revoked. But a ZID anchors the participant's history to one identity even as keys rotate.

---

**Layer 2: Reputation**

Two on-chain reputation systems run in parallel on Optimism Mainnet.

**OG Respect** (`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`)
An ERC-20 soulbound token. Non-transferable. Earned by attending Fractal sessions. 2% decay per week of inactivity — reputation requires showing up. OG holders who rank highly in consecutive sessions earn ZOUNZ NFTs (governance power in the ZOUNZ DAO).

**ZOR Respect** (`0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`)
An ERC-1155 soulbound token on Optimism. WaveWarZ-specific. Earned by attending Fractal sessions that include a WaveWarZ governance context. As of July 2026: 43 verified holder wallets. Used to vote on WaveWarZ platform decisions — artist rosters, charity partners, format changes.

Both tokens are soulbound by design. You cannot buy reputation at the ZAO. You can only earn it.

---

**Layer 3: Coordination**

The coordination layer is where value moves.

**ZABAL** (`0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`) — an ERC-20 on Base. Launched January 1, 2026. The front-end coin of the ZAO ecosystem. ZABAL earned through community activity flows into a leaderboard system. ZABAL is used for ZABAL Games challenges and as a ZABAL marketplace medium of exchange (`/marketplace`). Swap route: ETH→SANG→ZABAL (not ETH→ZABAL direct, due to liquidity routing).

**ZOUNZ DAO** (`0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f`) — A Nouns Builder fork on Base. Holds 20% reserve of ZABAL token. Governance via ERC-721 ZOUNZ NFTs. ZOUNZ are earned — not purchased — by OG Respect holders who reach the top curators tier in consecutive sessions. The DAO treasury controls ZABAL reserve allocation.

**Empire Builder** — ZAO's content protocol integration. Empire Builder gives ZAO creators a token-gated content layer. Integration allows ZAO artists to launch fan coins and community paywalls through the same tooling.

---

**Layer 4: Distribution**

The distribution layer is where output reaches audiences.

**WaveWarZ** — a live music battle prediction market on Solana. Artists compete in 15-minute battles. ZOR holders vote. Trading fees accumulate during battles. Winner takes more; loser still earns. As of July 2026: 1,245 battles, 523.991 SOL total volume, 9.0988 SOL distributed to losing artists.

**ZAO OS** — the coordination and research hub at `zaoos.com` (also `thezao.xyz`). 1,600+ research documents. Gated client for ZAO members. Onboarding flows. The source of truth for what ZAO builds.

**ZABAL Bonfire** (`zabal.bonfires.ai`) — the ZAO knowledge graph. Every research doc, meeting note, and agent output feeds into it. AI recall against the graph enables the ZAO assistant to answer from grounded facts.

**ZOL** (`@zolbot`, FID 3338501) — ZAO's Farcaster-native agent. Monitors `/wavewarz`, `/zabal`, and `/zao` channels. Posts battle results, artist spotlights, and weekly channel recaps. Runs on Raspberry Pi.

---

**The Four-Layer View**

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: IDENTITY                                              │
│  ZID (off-chain) + ENS + Hats roles (Optimism)                 │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: REPUTATION                                            │
│  OG Respect (Optimism ERC-20, soulbound, 2% decay)             │
│  ZOR Respect (Optimism ERC-1155, soulbound, 43 holders)        │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: COORDINATION                                          │
│  ZABAL (Base ERC-20) + ZOUNZ DAO (Base, Nouns Builder)         │
│  Empire Builder integration + SongJam                          │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4: DISTRIBUTION                                          │
│  WaveWarZ (Solana) + ZAO OS + ZABAL Bonfire + ZOL (Farcaster)  │
└─────────────────────────────────────────────────────────────────┘
```

These layers are not a rigid hierarchy. They interoperate. A ZOR holder (Layer 2) votes on a WaveWarZ artist selection (Layer 4) that affects ZABAL distribution (Layer 3) which is logged to Bonfire (Layer 4) and attributed to a ZID (Layer 1). Every action touches all four layers.

---

## Chapter 3 — Token Mechanics

The ZAO uses five tokens. Each one has a specific job.

None of them are investments. None of them represent fractional ownership of anything. They represent participation, reputation, and earned access.

---

### ZABAL — Community Currency

**Contract:** `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (Base ERC-20)  
**Launched:** January 1, 2026  
**Purpose:** Medium of exchange within the ZAO ecosystem

ZABAL is earned by participating in ZAO activities: completing ZABAL Games challenges, winning bounties, contributing research, attending events, showing up. ZABAL is spent in the ZABAL marketplace — buying community services, knowledge boxes, and partner products. ZABAL can also be sold; the price is determined by the market.

**Swap route:** The best swap path for ETH into ZABAL goes through SANG as an intermediary. Direct ETH→ZABAL routes have poor liquidity. Use: `ETH → SANG → ZABAL`.

**ZABAL Games** uses ZABAL as its rewards currency. Complete a challenge, earn ZABAL. Top the leaderboard, earn more. This creates a participation flywheel: ZABAL Games attracts participants → participants earn ZABAL → ZABAL earns marketplace value → more participants join.

---

### ZOUNZ — Governance NFT

**Contract:** `0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f` (Base, Nouns Builder fork)  
**Purpose:** DAO governance + ZABAL reserve access

ZOUNZ are ERC-721 NFTs. The ZOUNZ DAO holds 20% of the ZABAL token reserve. ZOUNZ holders vote on how that reserve is deployed — development grants, event funding, artist commissions.

ZOUNZ are not purchasable. They are earned by OG Respect holders who reach the top curation tier in consecutive Fractal sessions. The most consistent contributors get DAO governance power.

---

### OG Respect — Community Reputation

**Contract:** `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (Optimism Mainnet, ERC-20)  
**Purpose:** Community contribution tracking

OG Respect is a soulbound ERC-20 on Optimism. You earn it by attending Fractal sessions and ranking contributions. You lose 2% per week of inactivity. It cannot be transferred, sold, or delegated. It measures consistent community presence.

OG Respect has tiers. High-tier OG holders unlock ZOUNZ eligibility. OG Respect is the oldest ZAO credential — it predates ZABAL and ZOR. Participants who have held OG Respect continuously since 2024 are the ZAO's longest-running community members.

---

### ZOR Respect — WaveWarZ Governance

**Contract:** `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism Mainnet, ERC-1155, token ID 1)  
**Purpose:** WaveWarZ platform governance

ZOR is an ERC-1155 soulbound token on Optimism. It is earned specifically through ZAO Fractal sessions that include WaveWarZ governance context. As of July 2026: 43 verified ZOR holder wallets.

ZOR holders vote on WaveWarZ platform decisions:
- Artist roster selection
- Battle format changes
- Charity partner selection for charity battles
- Season structure

One ZOR holder = one vote. No weighting by amount held (soulbound; amounts reflect attendance frequency, not stake).

**Africa Battle Week** (September 26, 2026) — ZOR holders will vote on the charity that receives 100% of the SOL payout from the US vs West Africa battle.

---

### ZOL Credits — Activity Points

**Status:** In design (not yet deployed as a contract)  
**Purpose:** Lightweight contribution credits, earned through ZAO activity

ZOL credits are the planned lightweight activity layer sitting below ZABAL. Earning ZOL credits by participating in events and contributing content eventually unlocks ZABAL rewards. The exact mechanics are being finalized.

---

**Token Interaction Summary**

```
Attend Fractal → earn OG Respect + ZOR Respect
                              ↓
         OG Respect tier → ZOUNZ NFT eligibility
         ZOR → vote on WaveWarZ decisions
                              ↓
         ZOUNZ DAO → deploys ZABAL reserve
         ZABAL → earns from ZABAL Games + events
                              ↓
         Spend ZABAL in marketplace or sell
```

The flow is linear: show up → earn reputation → unlock governance → govern resource allocation → earn currency → use or sell. There is no shortcut. Buying ZABAL doesn't buy reputation. Buying ZOUNZ is not possible.

---

## Chapter 4 — Governance

The ZAO makes decisions by showing up every week.

Since 2024, the ZAO has held 90+ consecutive Fractal sessions with zero quorum failures. That number is unusual in web3. Most DAOs fail within 3-6 months. The ZAO has not missed a week.

---

### Fractal Democracy

Fractal Democracy is derived from ORDAO (Optimystics). It runs as follows:

A group of six meets. Each person shares their contribution from the past week in 90 seconds or less. The group listens. Then everyone ranks the six contributions — who gave the most value this week? Rankings get submitted. The algorithm (Friend of a Friend weighted median) resolves the consensus. Tokens are distributed based on rank.

**Why this works:** No single person decides who contributed. The group decides collectively, in small groups where everyone knows each other. Gaming is nearly impossible — you'd have to coordinate a cartel in a group of six where every person's contribution is visible.

**ZAO runs this every Monday at 6pm EST.** Held in Discord (voice, breakout rooms). Facilitated by a rotating coordinator. OG Respect distributes to attendees. ZOR distributes to WaveWarZ-context sessions.

The Fractal bot (`fractalbotjuly2026`) runs the session: breakout room assignment, timer, submission collection, rank aggregation.

---

### OREC — On-Chain Governance Record

**Contract:** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` (Optimism Mainnet)

OREC stands for Optimistic Respect-based Executive Contract. Here is how it works:

1. A proposal is submitted on-chain.
2. A dispute window opens (typically 7 days).
3. If no one disputes, the proposal executes automatically.
4. If disputed, it goes to a ZOR vote.

This pattern is called "optimistic governance." You trust the proposer unless someone objects. It allows fast execution on non-controversial decisions while preserving the community's ability to stop anything harmful.

ZAO uses OREC for: artist roster changes, charity partner selection, platform parameter updates.

What ZAO does NOT put through OREC: operational decisions that don't affect the protocol, emergency responses (those happen fast, then get ratified), research directions.

---

### Hats Protocol

**Contract:** `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` (Optimism Mainnet)

Hats Protocol assigns roles as on-chain tokens. Roles define permissions. The ZAO hat tree:

- **Top Hat** — held by Zaal Panthaki. Can create/revoke all sub-hats.
- **Coordinator Hat** — held by active session coordinators. Can run Fractal sessions, collect rankings.
- **Channel Moderator Hat** — can moderate /wavewarz, /zabal, /zao Farcaster channels.
- **Builder Hat** — can submit OREC proposals.

When a contributor steps back, Zaal revokes the hat. No smart contract update needed. The role transfers cleanly. Hats make succession and role rotation on-chain and auditable.

---

### ZOUNZ DAO

**Contract:** `0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f` (Base)

The ZOUNZ DAO is a Nouns Builder fork. It governs the ZABAL reserve (20% of ZABAL token supply). ZOUNZ holders submit proposals for how to deploy the reserve. Proposals follow a standard Nouns DAO flow: proposal period → voting period → timelock → execution.

ZOUNZ are earned, not auctioned. The original Nouns Builder model auctions one NFT per day. The ZAO modified this: ZOUNZ are minted to top OG Respect holders when they reach the curator tier. This keeps governance power with proven contributors, not buyers.

---

### How Governance Decisions Actually Flow

A concrete example: Africa Battle Week charity vote (July 24, 2026).

1. ZAO holds a WaveWarZ Fractal session (distributes ZOR to attendees).
2. A shortlist of 3 charities is published on Farcaster.
3. ZOR holders vote via Snapshot (`snapshot.org/#/thezao.eth`) using the `erc1155-balance-of` strategy (ERC-1155, Optimism, network ID 10, token address as above).
4. Voting window: 24 hours.
5. The winning charity receives 100% of the SOL payout from the September 26 battle.
6. ZOE posts the result to Farcaster + Telegram within 30 minutes of the window closing.

No multisig. No core team override. The 43 ZOR holders decide.

---

**Sources**

- `research/community/051-zao-whitepaper-2026/drafts/draft-4.4.md` — Chapter 1 source (community pitch)
- `docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md` — chapter outline + source query list
- `research/identity/1542-zao-geo-entity-brief/README.md` — entity facts (contracts, stats)
- `src/lib/wavewarz/constants.ts` — 43 verified ZOR holder wallets
- `research/governance/1575-zor-token-africa-battle-week-vote-setup/README.md` — ZOR Snapshot strategy
- `CLAUDE.md` — project map, contract addresses, canonical repo list
- `research/community/624-nexus-portal-canon-may7/README.md` — NEXUS identity context
- Board task: "ZAO Protocol Whitepaper rebuild — Chapter 2 onward"
