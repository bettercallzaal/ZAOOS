# ORDAO & Respect Game System -- Research

> The Optimistic Respect-based DAO (ORDAO) governance system, the Respect Game, and how The ZAO uses fractal scoring for on-chain reputation.

---

## Overview

ORDAO is a governance toolset built by [Optimystics](https://github.com/Optimystics) for DAOs that use non-transferable reputation tokens ("Respect"). At its core is the **Optimistic Respect-based Executive Contract (OREC)**, a smart contract enabling democratic on-chain execution while solving the voter-apathy problem that plagues traditional DAO governance.

The system was originally developed for **Optimism Fractal** and has since been generalized for any community -- including The ZAO -- to deploy their own fractal governance with Respect tokens on the Optimism Superchain.

---

## GitHub Repositories

All code lives under the [Optimystics GitHub org](https://github.com/Optimystics) (16 repos total):

| Repo | Description | License |
|------|-------------|---------|
| **[ordao](https://github.com/Optimystics/ordao)** | Core monorepo: OREC contracts, orclient, ornode, ortypes, GUI, console | GPL-3.0 |
| **[frapps](https://github.com/Optimystics/frapps)** | Modular toolkit for fractal apps on Ethereum/EVM chains | MIT/GPL-3.0 |
| **[respect.games-ui](https://github.com/Optimystics/respect.games-ui)** | UI for the respect.games async app | MIT |
| **[respect.games-graph](https://github.com/Optimystics/respect.games-graph)** | Graph Protocol integrations for respect.games | TypeScript |
| **[Respect.Games-app-smart-contracts](https://github.com/Optimystics/Respect.Games-app-smart-contracts)** | Solidity contracts for async Respect Games | MIT |
| **[op-fractal-sc](https://github.com/Optimystics/op-fractal-sc)** | Original Optimism Fractal smart contracts (legacy) | GPL-3.0 |
| **[fractalgram](https://github.com/Optimystics/fractalgram)** | Telegram web client for DAO participants | GPL-3.0 |
| **[OptimismFractal.com](https://github.com/Optimystics/OptimismFractal.com)** | Website for Optimism Fractal | -- |

The upstream development repo is [sim31/ordao](https://github.com/sim31/ordao) (254+ commits), which is forked into the Optimystics org.

---

## ORDAO Architecture

The ORDAO monorepo is structured as a Lerna/NX workspace (92% TypeScript, 7% Solidity):

```
ordao/
├── contracts/
│   ├── orec/              # OREC: Optimistic Respect-based Executive Contract
│   └── respect1155/       # Respect1155: ERC-1155 non-transferable token
├── services/
│   └── ornode/            # API for storing proposals + Respect metadata
├── libs/
│   ├── orclient/          # Client library abstracting blockchain/backend comms
│   └── ortypes/           # Shared TypeScript types & utilities
├── apps/
│   ├── gui/               # Frontend (breakout-result submission for fractals)
│   └── console/           # Browser console interface with docs
├── tools/                 # Dev/deploy/admin scripts
└── docs/                  # Specifications (OREC.md, OF_ORDAO_UPGRADE.md, etc.)
```

### Dependency Graph

```
apps/gui ──────► libs/orclient ──────► libs/ortypes ──────► contracts/orec
apps/console ──► libs/orclient          │                    contracts/respect1155
                                        │
                 services/ornode ────────┘
```

---

## OREC: The Optimistic Respect-based Executive Contract

### The Problem with Traditional DAO Voting

Traditional DAOs suffer from voter apathy: low turnout forces low quorum thresholds, which compromises security. Setting quorum too high causes the DAO to get stuck. Most DAOs fall back to multisig control by founders, which is centralized.

### How OREC Solves It

OREC uses an **optimistic consent-based** mechanism. Instead of requiring a majority to vote "yes," it assumes that proposals representing community consensus will pass unless actively blocked:

1. **Anyone** can create a proposal to execute a transaction
2. **Voting period**: anyone can vote YES or NO (votes weighted by Respect held)
3. **Veto period**: only NO votes accepted -- no new YES votes allowed
4. **Execution**: if the proposal passes, anyone can trigger execution

### Passing Conditions

A proposal passes when ALL of these hold:
- `voting_period + veto_period` time has elapsed since creation
- At least `prop_weight_threshold` Respect is voting YES
- `yes_weight > 2 * no_weight` (YES must exceed double the NO weight)

This means **2/3 + 1 of participating Respect** can pass a proposal, and **1/3 of participating Respect** can block it.

### Key Parameters

| Parameter | Purpose |
|-----------|---------|
| `voting_period` | Duration of first stage where YES and NO votes accepted |
| `veto_period` | Duration of second stage where only NO votes accepted |
| `prop_weight_threshold` | Minimum Respect voting YES for eligibility |
| `respect_contract` | Address of the Respect token contract |
| `max_live_votes` | Max live proposals one account can vote YES on (spam prevention) |

### Why "Optimistic"

The system trusts a minority of proactive contributors to initiate proposals. Security comes from the veto period -- a challenge window (similar to optimistic rollup challenge periods) where the community can block anything contentious. The assumption is that community consensus is built off-chain first, and OREC is the final on-chain execution step.

### Anti-Spam Protection

The `max_live_votes` parameter prevents a single Respect-holder from spamming proposals. Without it, anyone above the threshold could create unlimited proposals, forcing honest members to waste gas vetoing each one.

---

## The Respect Game

The Respect Game is the mechanism by which communities evaluate contributions and distribute non-transferable Respect tokens. It was pioneered by Fractally (created by Dan Larimer) and adapted by Optimism Fractal.

### How a Weekly Session Works

1. **Gathering**: Participants join a video call at a scheduled time
2. **Random breakout rooms**: Players are randomly divided into groups of 3-6 people (ideally 6)
3. **Contribution sharing**: Each person gets ~4 minutes to share what they did for the community that week (building software, creating content, onboarding members, etc.)
4. **Consensus ranking**: The group discusses and ranks members from most to least helpful
5. **2/3 majority required**: At least 2/3 of the group must agree on the ranking for it to be valid
6. **On-chain submission**: Results are submitted on-chain via the ORDAO frontend

### Session Duration

The breakout portion lasts approximately 45 minutes. The full weekly event includes gathering, breakout rooms, and regrouping.

### Fractal Scaling

The Respect Game can accommodate any number of players due to its fractal nature:
- If there are many participants, they split into multiple breakout groups
- In larger fractals, top-ranked contributors from Round 1 are regrouped into new groups of 6 for Round 2
- This process can repeat up to 5 rounds or until fewer than 6 people remain
- This is the "fractal" in "fractal governance" -- the structure repeats at each scale

---

## Fibonacci Scoring System

### Base Scoring (Single Breakout Room)

Respect tokens are distributed using Fibonacci-weighted values based on rank within a breakout group of 6:

| Rank in Group | Level | Respect Awarded | Description |
|---------------|-------|-----------------|-------------|
| 6th (lowest)  | 1     | 1               | Participated but ranked last |
| 5th           | 2     | 2               | |
| 4th           | 3     | 3               | |
| 3rd           | 4     | 5               | |
| 2nd           | 5     | 8               | |
| 1st (highest) | 6     | 13              | Top contributor in the group |

Each successive level earns approximately 60% more than the one below it, following the Fibonacci ratio (phi ~ 1.618). The top 33% of contributors earn 66% of the Respect -- a softer distribution than the Pareto principle (80/20).

### Multi-Round Scoring

In larger communities with multiple fractal rounds, scores compound across rounds. The numbers referenced in The ZAO context (5, 8, 10, 13, 21, 34, 55, 110) represent total Respect earned across multiple rounds of play, where top performers from initial breakout rooms advance to subsequent rounds and accumulate additional Respect at each level.

### Why Fibonacci

- Natural hierarchy without extreme inequality
- Each level is meaningfully more than the last (not linear, not exponential)
- Self-similar at every scale (fractal property)
- Resistant to gaming -- you cannot buy your way up, only earn through peer recognition

---

## Smart Contracts on Optimism

### OG Respect (ZAO RESPECT TOKEN)

| Field | Value |
|-------|-------|
| **Address** | [`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`](https://optimistic.etherscan.io/address/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957) |
| **Network** | OP Mainnet (Optimism) |
| **Standard** | ERC-20 (TokenERC20 via Minimal Proxy) |
| **Symbol** | ZAO |
| **Deployed by** | zaal.eth (`0x7234c36a71ec237c2ae7698e8916e0735001e9af`) |
| **Compiler** | Solidity v0.8.23 |
| **Transactions** | 438 |
| **Features** | Role-based access (MINTER_ROLE, TRANSFER_ROLE), signature-based minting, ERC20Votes integration, ERC-2771 meta-transactions, burn functionality |

This is the original ZAO Respect token -- an ERC-20 with role-based minting. Points are awarded for community participation: introducing yourself (25 pts), camera on in meetings (10 pts), content creation (10-50 pts), being an artist on the ZAO website (50 pts), and ranked contributions from Respect Game sessions.

### ZOR (ZAO Respect via Respect1155)

| Field | Value |
|-------|-------|
| **Address** | [`0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`](https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c) |
| **Network** | OP Mainnet (Optimism) |
| **Standard** | ERC-1155 (Respect1155) |
| **Deployed** | ~187 days ago (from Sept 2025) |
| **Compiler** | Solidity v0.8.28 |
| **Source** | Verified on Etherscan |
| **Key functions** | `mintRespect()`, `burnRespect()`, `mintRespectGroup()`, `burnRespectGroup()`, `setURI()`, `setContractURI()` |
| **Access control** | Ownable (OpenZeppelin) -- only owner can mint/burn |

This is the newer ORDAO-based contract using the **Respect1155** standard from the ordao repo. It extends `Respect1155Base` and uses ERC-1155 to represent both fungible Respect balances and individual non-transferable tokens (NTTs) with value attributes.

### Parent/Child Token System

The ORDAO upgrade introduces a dual-token architecture:

1. **Parent Respect Token** (old ERC-20 contract, e.g., `FractalRespect` or the OG ZAO token):
   - The existing token with established distribution history
   - Used to determine **vote weights in OREC** during the transition period
   - Represents historical reputation

2. **Child Respect Token** (new Respect1155 contract, e.g., ZOR):
   - Minted going forward via OREC proposals
   - ERC-1155 standard: combines a fungible token (total Respect balance) with individual NTTs (each representing a specific award, e.g., a breakout room result)
   - Each NTT has a `value` attribute that sums to the holder's fungible balance
   - Owner is set to the OREC contract, so Respect distribution is governed democratically

This design allows a smooth upgrade: the parent token bootstraps governance (providing vote weights for OREC), while the child token becomes the new standard for ongoing Respect distribution.

---

## How Breakout Results Get Submitted On-Chain

### Legacy Flow (pre-ORDAO)

1. Breakout rooms play the Respect Game and reach consensus on rankings
2. A required number of participants submit the result on-chain (arbitrary threshold)
3. An administrator account manually creates transactions to distribute Respect
4. If not enough submissions were made, the Optimism Fractal Council voted on Snapshot to approve distribution anyway

### ORDAO Flow (current)

1. Breakout rooms play the Respect Game as before
2. The ORDAO frontend translates the ranking into an **OREC proposal** to distribute Respect
3. When a participant submits the result, they are actually **voting YES** on that OREC proposal
4. The proposal enters the voting period, then the veto period
5. If the proposal passes (2/3 of participating Respect agrees, no blocking veto):
   - Anyone can trigger execution by clicking a button and signing a transaction
   - The Respect1155 contract mints the appropriate tokens to each ranked participant
6. Respect amounts are **automatically calculated** by the frontend based on the Fibonacci ranking

This "semi-automated" flow means no administrator needs to manually distribute tokens. The only manual step is someone clicking "execute" after the proposal passes.

---

## The Optimism Fractal Council

The **Sages Council** is a governance body formed from Respect Game results:

- Consists of up to **6 members** with the most accumulated Respect
- Members must opt in by registering in a poll each period
- Ensures that only actively contributing members govern
- Uses **Hats Protocol** for on-chain role management (programmable roles as ERC-1155 tokens)
- Optimism Fractal won a **Hats Protocol Hatathon** for their integration

The council can pass proposals, manage community resources, and make decisions between weekly Respect Game sessions. Respect-weighted voting ensures governance power reflects actual contribution history.

---

## Frapps: Fractal Apps Toolkit

[Frapps](https://github.com/Optimystics/frapps) is the broader toolkit consolidating three implementations:

1. **ORDAO/Fractalgram**: Smart contracts (OREC) + Telegram-based frontend for real-time consensus and on-chain submission
2. **Respect.Games**: Async gameplay app with full-featured UI, user profiles, proposal voting, and Graph Protocol integration for querying on-chain data. Completed September 2024, in testing with multiple communities.
3. **Original Optimism Fractal Software**: Live since October 2023 on OP Mainnet with basic Respect Game infrastructure

The frapps.xyz domain hosts deployable fractal apps. Communities can configure their own instance by adding a directory and `frapp.json` file. Documentation for the orclient API is available at [orclient-docs.frapps.xyz](https://orclient-docs.frapps.xyz).

---

## Key Concepts Summary

| Concept | Definition |
|---------|------------|
| **Respect** | Non-transferable, soulbound reputation token earned through peer evaluation |
| **Respect Game** | Weekly structured session where breakout groups rank contributions |
| **OREC** | Optimistic smart contract that executes proposals unless vetoed |
| **ORDAO** | Full toolset: OREC + Respect1155 + ornode + orclient + apps |
| **Fibonacci scoring** | 1, 2, 3, 5, 8, 13 Respect per rank in a 6-person breakout |
| **Fractal scaling** | Top performers advance to additional rounds for more Respect |
| **Veto period** | Challenge window where only NO votes are accepted |
| **Respect1155** | ERC-1155 contract: fungible Respect + individual NTTs per award |
| **Parent/child tokens** | Old token bootstraps governance; new token minted via OREC |
| **Sages Council** | Up to 6 top Respect-holders who opt in to govern |

---

## Relevance to ZAO OS

The ZAO already has two Respect contracts deployed on Optimism:

1. **OG ZAO Respect (ERC-20)** at `0x34cE...6957` -- deployed by zaal.eth, used for the initial points system
2. **ZOR Respect1155** at `0x9885...445c` -- the ORDAO-standard contract for democratic Respect distribution

### Integration Opportunities

- **Respect Game in ZAO OS**: Build a breakout-room UI within the app (the ORDAO `gui` only implements basic submission; there is room for a better UX)
- **orclient integration**: Use the `@ordao/orclient` npm package to interact with OREC and Respect1155 from the Next.js backend
- **Governance proposals**: Let ZAO members create and vote on OREC proposals directly in the app
- **Council formation**: Display the top Respect-holders as the ZAO council, potentially integrated with Hats Protocol roles
- **Respect-weighted features**: Use on-chain Respect balances to gate features, weight curation scores, or determine governance power
- **Async Respect Games**: The Respect.Games app supports async play -- could be adapted for ZAO members in different timezones

### Technical Notes

- The `orclient` library abstracts all blockchain and ornode communication -- ideal for building a custom frontend
- The `ortypes` package provides TypeScript types for all ORDAO data structures
- OREC parameters (voting period, veto period, thresholds) are configurable per deployment
- The parent/child token pattern allows The ZAO to migrate from the OG ERC-20 to Respect1155 without losing historical reputation

---

## Sources

- [Optimystics GitHub Organization](https://github.com/Optimystics)
- [ORDAO Repository (sim31/ordao)](https://github.com/sim31/ordao)
- [OREC Specification](https://github.com/sim31/ordao/blob/main/docs/OREC.md)
- [ORDAO Upgrade Path](https://github.com/sim31/ordao/blob/main/docs/OF_ORDAO_UPGRADE.md)
- [Optimystics.io -- ORDAO](https://optimystics.io/ordao)
- [Optimystics.io -- OREC](https://optimystics.io/orec)
- [Optimystics.io -- Respect Tokens](https://optimystics.io/respect)
- [Optimystics.io -- Introducing the Respect Game](https://optimystics.io/introducing-the-respect-game)
- [Optimism Fractal](https://optimismfractal.com)
- [Optimism Fractal Council](https://optimismfractal.com/council)
- [Optimism Fractal Accounts](https://optimismfractal.com/account)
- [Fractally Whitepaper Addendum 1](https://hive.blog/fractally/@dan/fractally-white-paper-addendum-1)
- [Introducing Fractally](https://fractally.com/blog/introducing-fractally)
- [Fractal Decision-Making Processes](https://edenfractal.com/fractal-decision-making-processes)
- [orclient API Docs](https://orclient-docs.frapps.xyz)
- [OG Respect on Etherscan](https://optimistic.etherscan.io/address/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957)
- [ZOR Respect1155 on Etherscan](https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c)
- [The ZAO Token Page](https://www.thezao.com/zao-token)
- [Optimism Fractal Season 5 Governance Forum Post](https://gov.optimism.io/t/optimism-fractal-season-5-level-up-with-weekly-respect-games-on-the-superchain/9294)
- [Optimism Fractal Respect Game Research](https://gov.optimism.io/t/optimism-fractal-respect-game-research-into-democratic-fund-distribution/9617)
