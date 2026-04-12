# 346 -- IYKYK DAO + Fractal Nouns: Inter-DAO Governance & Community Dashboard for ZOUNZ

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Deep dive into IYKYK DAO and Fractal Nouns -- their governance framework, inter-DAO bridge, community dashboard, and how ZOUNZ treasury can use these patterns for ZABAL agent funding and token cycling

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Community dashboard** | FORK `IYKYK-DAO/iykyk-terminal` (MIT, Next.js 15, React 19, Base chain) as template for ZOUNZ treasury dashboard. Shows auctions, proposals, treasury, members, delegates. Almost identical stack to ZAO OS |
| **Inter-DAO governance bridge** | STUDY `Fractal-Nouns/OIF-Governance-Bridge` for future cross-DAO coordination (ZOUNZ <-> COC <-> FISHBOWLZ). Uses Open Intents Framework (ERC-7683) + LayerZero/Hyperlane for cross-chain governance messaging. SKIP for now -- overkill until ZOUNZ has multiple chain deployments |
| **Blank.space dashboard** | USE blank.space platform for community hub (IYKYK uses it at iykyk.blank.space). 19 fidgets including governance, portfolio, swaps, Farcaster frames, chat. Could deploy zabal.blank.space for community |
| **ZOUNZ proposal for agent funding** | USE Nouns Builder's built-in proposal system. Create a ZOUNZ governance proposal: "Fund VAULT/BANKER/DEALER agents with X ZABAL from treasury." NFT holders vote. Treasury releases ZABAL on approval |
| **iykyk-terminal for treasury view** | FORK and customize for ZOUNZ: show treasury ZABAL balance, daily auction proceeds, active agent proposals, ZABAL burn rate, agent performance metrics |
| **Bonfire pattern** | INVESTIGATE -- "bonfires" appear to be community gathering events tied to IYKYK's Nouns Builder DAO. Similar to ZAO's weekly fractal meetings. Could tie ZABAL rewards to bonfire attendance |

---

## What IYKYK DAO Is

**A Nouns Builder DAO on Base** focused on the builder community. Key details:

| Aspect | Details |
|--------|---------|
| Platform | Nouns Builder (nouns.build) on Base chain |
| Template | `iykyk-terminal` -- headless Next.js 15 dashboard for DAO management |
| Dashboard | iykyk.blank.space (Blank framework with 19 fidgets) |
| Social | Twitter @THE_IYKYK, Farcaster @builder, Discord |
| Repos | 2 public: `iykyk-terminal` (TypeScript/Next.js), `iykyk-dao.github.io` (HTML) |
| Focus | Builder tooling for Nouns ecosystem DAOs |

**Why it matters for ZAO:** ZOUNZ is ALSO a Nouns Builder DAO on Base (`0xCB80Ef04DA68667c9a4450013BDD69269842c883`). IYKYK's terminal template is a direct fork target for ZOUNZ's treasury management dashboard.

---

## What Fractal Nouns Is

**An inter-DAO governance bridge** using the Open Intents Framework. Key details:

| Aspect | Details |
|--------|---------|
| Repos | 2 public: `OIF-Governance-Bridge` (Solidity), `nouns-bridge` (fork) |
| Architecture | 7 components across 2 chains for synchronized governance |
| Messaging | LayerZero, Axelar, or Hyperlane (Layer 0 protocols) |
| Standard | ERC-7683 (Open Intents Framework) |
| Pattern | Nounish (GovernorBravo-style) |
| Status | Early stage (0 stars, March 2026 last update) |

### How the Governance Bridge Works

```
Chain A (Origin DAO):                    Chain B (Destination DAO):
┌─────────────────────┐                  ┌──────────────────────┐
│ GovernanceRoot      │                  │ GovernanceMirror     │
│ - queues proposals  │                  │ - executes proposals │
│ - encodes outcomes  │                  │ - mirrors state      │
├─────────────────────┤                  ├──────────────────────┤
│ PoppingContract     │                  │ BridgeReceiver       │
│ - triggers dispatch │──── Layer 0 ────>│ - validates proofs   │
│   on block expiry   │  (LayerZero/    │ - forwards payloads  │
├─────────────────────┤   Hyperlane)     └──────────────────────┘
│ IntentManager (OIF) │
│ - ERC-7683 intents  │
│ - solver rewards    │
└─────────────────────┘
         ▲
    DAO Relayer / OIF Solver
    (monitors expiry, calls popMessage)
```

**Why it matters for ZAO (future):** When ZOUNZ governance needs to coordinate with COC Concertz or FISHBOWLZ DAOs across chains, this bridge enables synchronized voting. A ZOUNZ proposal to fund BANKER on COC Concertz could automatically execute on both chains. SKIP for now -- single-chain (Base) is sufficient.

---

## Comparison: DAO Dashboard Templates

| Template | Stack | Governance | Treasury | Auctions | Farcaster | Base | ZAO Fit |
|----------|-------|-----------|----------|----------|-----------|------|---------|
| **iykyk-terminal** | Next.js 15, React 19, wagmi v2, TanStack, Shadcn | Full proposal CRUD + voting | ETH + token + NFT tracking | Current + historical | Planned (issue #270) | YES | **BEST** -- almost identical stack, Nouns Builder native |
| **nouns.build** (default) | Next.js, Zora-hosted | Basic proposal view | Basic ETH view | YES | NO | YES | Good but not customizable |
| **agora.xyz** | Custom | Advanced delegation | Advanced | NO | NO | YES | Overkill for our scale |
| **tally.xyz** | Custom | Multi-protocol | Multi-chain | NO | NO | YES | Enterprise, wrong audience |
| **blank.space** | Framework + fidgets | Via fidgets | Via fidgets | NO | YES (Frames V2) | YES | Good for community hub, not treasury mgmt |

---

## How ZOUNZ Treasury Funds Agents (The Pattern)

### Current State

| Detail | Value |
|--------|-------|
| ZOUNZ DAO | Nouns Builder on Base: `0xCB80Ef04DA68667c9a4450013BDD69269842c883` |
| Treasury holds | 20% of ZABAL supply (20B tokens) |
| Governance | 1 NFT = 1 vote |
| Auction cadence | Daily (configurable) |
| Auction proceeds | 100% to treasury (ETH) |

### Proposed Agent Funding Flow

```
1. ZOUNZ NFT holders propose: "Fund VAULT with 1B ZABAL from treasury"
   - Proposal created via iykyk-terminal fork or nouns.build
   - 48-hour voting period
   - Quorum: 2+ NFTs voting (configurable)

2. If passed:
   - Treasury contract executes ERC-20 transfer
   - 1B ZABAL moves to VAULT's Privy wallet
   - VAULT begins daily DCA trading

3. Agent reports back:
   - Weekly Farcaster post to /zao: "VAULT traded $X.XX this week, burned Y ZABAL"
   - Treasury dashboard shows ROI on agent allocation
   - Community votes on increasing/decreasing allocation

4. Revenue cycle:
   - VAULT earns USDC from x402 content sales
   - VAULT converts USDC -> ZABAL (buyback)
   - Net effect: treasury ZABAL grows through agent activity
```

### Three Funding Channels

| Channel | Mechanism | Amount | Frequency | Who Decides |
|---------|-----------|--------|-----------|-------------|
| **Bounty Board** | Dutch auction smart contract, agents claim jobs | 10K-500K ZABAL per job | Per task | Poster (anyone) |
| **Grants** | ZOUNZ governance proposal, NFT holders vote | 100M-1B ZABAL per grant | Per proposal | NFT holders |
| **Auto-rewards** | On-chain activity tracking, proportional distribution | 1K-50K ZABAL per action | Continuous | Smart contract (automatic) |

---

## Token Cycling Architecture

```
                    ┌─────────────────────┐
                    │   ZOUNZ TREASURY    │
                    │   (20B ZABAL)       │
                    └──────┬──────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   GRANTS    │ │  BOUNTIES   │ │ AUTO-REWARDS│
    │ (proposals) │ │(dutch auct.)│ │ (per-action)│
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           ▼               ▼               ▼
    ┌─────────────────────────────────────────┐
    │        CREATORS & AGENTS                │
    │  VAULT | BANKER | DEALER | Promoters    │
    └──────┬──────────────────────────────────┘
           │
    ┌──────┼──────────────────────────────┐
    │      │ EARN ZABAL                   │
    │      ▼                              │
    │  ┌────────┐  ┌────────┐  ┌────────┐ │
    │  │ TRADE  │  │ STAKE  │  │ SPEND  │ │
    │  │ZABAL<> │  │Convic- │  │Content │ │
    │  │SANG/ETH│  │tion    │  │x402    │ │
    │  └───┬────┘  └───┬────┘  └───┬────┘ │
    │      │           │           │      │
    │      ▼           ▼           ▼      │
    │  VOLUME      LOCK-UP      COMMERCE  │
    │  (DexScreener)(governance)(publish)  │
    └──────┬──────────────────────────────┘
           │
           ▼
    ┌─────────────┐     ┌─────────────┐
    │  1% BURN    │     │  BUYBACKS   │
    │  (deflation)│     │  (agents    │
    │             │     │  convert    │
    │             │     │  USDC→ZABAL)│
    └──────┬──────┘     └──────┬──────┘
           │                   │
           └───────┬───────────┘
                   ▼
            ZABAL PRICE ↑
                   │
                   ▼
            MORE INCENTIVE
            TO CREATE & TRADE
                   │
                   ▼
            ┌──────────────┐
            │ IF NEW TOKEN │
            │ (Clanker)    │
            │ Fees → ZABAL │
            │ buyback      │
            └──────────────┘
```

---

## ZAO Ecosystem Integration

### Codebase References

| File | Connection |
|------|-----------|
| `src/lib/zounz/contracts.ts` | ZOUNZ DAO contract addresses + ABIs (Token, Auction, Governor, Treasury) |
| `src/components/zounz/ZounzProposals.tsx` | Existing proposal display component |
| `src/components/zounz/ZounzAuction.tsx:300` | "ZABAL Nouns DAO on Base" banner |
| `community.config.ts` | ZOUNZ contract addresses, channels |
| `src/app/(auth)/ecosystem/page.tsx:71` | ZOUNZ ecosystem panel with iframe |
| `src/lib/agents/types.ts` | Agent types -- add treasury interaction methods |
| `src/lib/agents/config.ts` | Agent config -- add treasury_allocation field |

### What to Fork

| Source | What | Adapt For |
|--------|------|----------|
| `IYKYK-DAO/iykyk-terminal` | Full Nouns Builder dashboard | ZOUNZ treasury view with agent metrics |
| `Fractal-Nouns/OIF-Governance-Bridge` | Inter-DAO governance | Future: ZOUNZ<->COC<->FISHBOWLZ coordination |
| `clawdbotatg/agent-bounty-board` | Dutch auction agent jobs | ZABAL-denominated bounties for creators |
| `clawdbotatg/clawdviction` | Conviction staking | ZABAL staking for governance weight |

---

## Sources

- [IYKYK Terminal GitHub](https://github.com/IYKYK-DAO/iykyk-terminal)
- [IYKYK Dashboard](https://iykyk.blank.space)
- [Fractal Nouns OIF-Governance-Bridge](https://github.com/Fractal-Nouns/OIF-Governance-Bridge)
- [Fractal Nouns GitHub](https://github.com/orgs/Fractal-Nouns)
- [Nouns Builder](https://nouns.build/)
- [Open Intents Framework (ERC-7683)](https://www.gate.com/learn/articles/ethereum-s-new-open-intents-framework/8051)
- [Blank.space Platform](https://blank.space)
- [ZOUNZ DAO on Nouns Builder](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
- [Doc 339 - CLAWD Patterns](../../agents/339-austin-griffith-clawd-ethskills-agent-patterns/)
- [Doc 340 - 4 Forkable Systems](../../agents/340-clawd-patterns-deep-dive-4-systems/)
- [Doc 345 - Master Blueprint](../../agents/345-zabal-agent-swarm-master-blueprint/)
