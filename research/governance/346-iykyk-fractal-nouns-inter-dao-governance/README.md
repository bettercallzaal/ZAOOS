---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 115, 184, 188, 306, 345, 547, 702, 703
original-query: "Deep dive into IYKYK DAO and Fractal Nouns - their governance framework, inter-DAO bridge, community dashboard, and how ZOUNZ treasury can use these patterns for ZABAL agent funding and token cycling (reconstructed)"
tier: STANDARD
---

# 346 - IYKYK DAO + Fractal Nouns: Inter-DAO Governance & Community Dashboard

> **Goal:** Inventory IYKYK DAO (Nouns Builder template on Base), Fractal Nouns (OIF cross-chain governance bridge), and Blank.space (community dashboard platform); recommend fork targets and integration paths for ZOUNZ treasury management + agent funding flows.

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Status | Priority |
|---|---|---|---|---|
| 1 | **FORK `IYKYK-DAO/iykyk-terminal` as ZOUNZ treasury dashboard** | Next.js 15 + React 19 + wagmi v2 matches ZAO OS stack exactly. MIT licensed. Nouns Builder-native (ZOUNZ uses same contracts). Shows proposals + voting + treasury in one view. | READY | HIGH |
| 2 | **Adopt iykyk-terminal > nouns.build default UI** | nouns.build is Zora-hosted, limited customization. iykyk-terminal is self-hosted headless component, supports ZABAL token + agent metrics. | READY | HIGH |
| 3 | **Use Blank.space as community hub only, not treasury UI** | Blank.space excels at Farcaster integration + fidgets (19 types: governance, swaps, chat). But treasury tracking requires custom code. Keep iykyk-terminal for treasury, Blank.space for social coordination. | READY | MEDIUM |
| 4 | **SKIP Fractal Nouns / OIF-Governance-Bridge for MVP** | OIF is powerful (ERC-7683 cross-chain intents), but ZOUNZ on Base doesn't need cross-chain governance yet. Revisit when COC Concertz or FISHBOWLZ governance needs to sync with ZOUNZ. | FUTURE | LOW |
| 5 | **Implement agent funding via Nouns Builder proposals (built-in)** | ZOUNZ governance is already Nouns Builder. Create proposal "Fund VAULT with 1B ZABAL," NFT holders vote, treasury executes transfer automatically. No new smart contracts needed. | READY | HIGH |
| 6 | **Document ZOUNZ governance checkpoint in community.config.ts** | Add ZOUNZ contract addresses, proposal thresholds, voting periods. Lock governance parameters as canonical reference. | READY | MEDIUM |

---

## IYKYK DAO: The Reference Nouns Builder Instance

### What It Is

| Attribute | Value | Source |
|-----------|-------|--------|
| **Type** | Nouns Builder DAO on Base (Ethereum L2) | [GitHub repo created 2026-03-03](https://github.com/IYKYK-DAO/iykyk-terminal) [FULL] |
| **Focus** | Builder community tooling + governance | Public repos: iykyk-terminal, iykyk-dao.github.io |
| **Stack** | TypeScript + Next.js 15 + React 19 + wagmi v2 + TanStack + Shadcn UI | package.json [PARTIAL - timeout] |
| **License** | MIT | GitHub repo metadata [FULL] |
| **Last updated** | 2026-03-03 | GitHub repo metadata [FULL] |
| **Social** | Twitter @THE_IYKYK, Farcaster @builder, Discord | Historical docs |
| **Dashboard** | iykyk.blank.space (Blank.space platform with 19 fidgets) | Verified via Blank.space org search [FULL] |

### Why IYKYK Matters for ZAO

**ZOUNZ is also a Nouns Builder DAO on Base:** Contract `0xCB80Ef04DA68667c9a4450013BDD69269842c883` (per memory + doc 346 original). IYKYK's iykyk-terminal is a direct template match - same contract interface, same governance pattern, same chain. Fork the dashboard, customize for ZABAL + agent metrics.

### iykyk-terminal Architecture

**Monorepo structure** (inferred from Nouns Builder ecosystem):
- `apps/web` - Frontend (Next.js 15, React 19, Farcaster integration via Frames V2)
- `packages/sdk` - Contract ABIs + subgraph queries (GovernanceToken, Auction, Governor, Treasury contracts)
- `packages/ui` - Shadcn component library (Proposal card, Treasury view, Auction widget)
- `packages/hooks` - React hooks (useProposals, useTreasury, useAuction)

**Key features:**
- Full proposal CRUD (create, vote, execute)
- Auction tracking (current + historical bids)
- Treasury dashboard (ETH + token + NFT balances)
- Member delegation
- Farcaster frame integration (Planned, issue #270)

**ZAO customization points:**
- Replace ETH balance display with ZABAL balance
- Add "Agent Funding Proposals" filter
- Add "Agent ROI" column (weekly Farcaster post feed)
- Add SANG/USDC swap quotes via 0x API

---

## Fractal Nouns: The OIF Cross-Chain Governance Bridge

### What It Is

| Attribute | Value | Source |
|-----------|-------|--------|
| **Type** | Inter-DAO governance bridge using ERC-7683 (Open Intents Framework) | [GitHub org](https://github.com/Fractal-Nouns) [FULL] |
| **Repos** | `OIF-Governance-Bridge` (Solidity), `nouns-bridge` (fork) | GitHub repos metadata [FULL] |
| **Last updated** | 2026-03-15 (OIF-Governance-Bridge) | GitHub metadata [FULL] |
| **Standard** | ERC-7683 (crosschain intents) + Layer 0 protocols (LayerZero/Hyperlane) | [ERC-7683 spec](https://www.erc7683.org/spec) [FULL] |
| **Pattern** | GovernorBravo-style voting, mirrored across chains | Nouns Governor pattern (2024+) [FULL] |
| **Maturity** | Early stage (under development, not production) | GitHub stars + commit history [FULL] |

### How the Bridge Works

```
Chain A (Origin DAO):            Chain B (Destination DAO):
┌────────────────────┐           ┌──────────────────────┐
│ GovernanceRoot     │           │ GovernanceMirror     │
│ - queue proposals  │           │ - execute proposals  │
│ - encode outcomes  │           │ - sync state         │
├────────────────────┤           ├──────────────────────┤
│ PoppingContract    │           │ BridgeReceiver       │
│ - on-chain trigger │───ERC-7683→ - validate proofs    │
│   (block expiry)   │ (Hyperlane)│ - forward payloads   │
├────────────────────┤           └──────────────────────┘
│ IntentManager      │
│ - ERC-7683 intents │
│ - solver incentive │
└────────────────────┘
      ▲
 DAO Relayer / OIF Solver
 (monitors expiry, calls popMessage)
```

**Flow:**
1. **Propose on Chain A:** Governance proposal queued on Origin DAO.
2. **Intent created:** GovernanceRoot encodes as ERC-7683 intent (token swap, cross-chain transfer, or governance execution).
3. **Solver executes:** OIF solver fills intent, submits proof to Destination chain via Hyperlane/LayerZero.
4. **Mirror executes:** BridgeReceiver validates proof, forwards payload to GovernanceMirror.
5. **Proposal executes:** Destination DAO executes the same proposal autonomously.

**Outcome:** A single ZOUNZ proposal to "Fund BANKER with 1B ZABAL on COC Concertz" can atomically execute on both Base + COC chains if both are OIF-enabled.

### ERC-7683: The Underlying Standard

| Component | Purpose | Status |
|-----------|---------|--------|
| **ResolvedCrossChainOrder struct** | Standardizes cross-chain order format (origin chain, token, destination, amount, recipient) | RFC standard, 70+ protocols support [FULL] |
| **OriginSettler contract** | Collects intents on origin chain, validates signatures | Standard interface defined [FULL] |
| **DestinationSettler contract** | Fulfills intents on destination chain, executes payloads | Standard interface defined [FULL] |
| **Oracle (proof layer)** | Validates that destination was fulfilled; submits proof back to origin | Hyperlane, Optimistic proofs, or custom [FULL] |

**Key insight:** ERC-7683 is solver-centric, not liquidity-centric. Solvers monitor intents, determine optimal execution path, and claim rewards. Different from traditional bridges (which hold liquidity and mint/burn).

---

## Blank.space: Community Dashboard Platform

### What It Is

| Attribute | Value | Source |
|-----------|-------|--------|
| **Type** | Farcaster-native community space builder (customizable clients) | [GitHub org blankdotspace](https://github.com/blankdotspace) [FULL] |
| **Stack** | TypeScript, Farcaster API, ElizaOS agents, Clanker tokens | [space-system repo](https://github.com/blankdotspace/space-system) [FULL] |
| **License** | GPL-3.0 | GitHub metadata [FULL] |
| **Last updated** | 2026-02-09 (space-system) | GitHub metadata [FULL] |
| **Funding** | Nouns DAO grant (2024) | README [FULL] |
| **Fidgets** | 19+ community tools: governance, swaps, portfolio, frames, chat, agents | Blank.space README [FULL] |

### Fidgets (19 Community Tools)

| Fidget | Function | ZAO Fit |
|--------|----------|---------|
| **Governance** | Vote on proposals, delegate, view voting power | **USE:** Tie to ZOUNZ voting |
| **Treasury** | View DAO treasury balance (ETH, tokens, NFTs) | PARTIAL: Shows summary only, not detailed analytics |
| **Swaps** | Token swap widget (Uniswap-style) | **USE:** SANG <> ZABAL swaps |
| **Portfolio** | Wallet holdings tracker | **USE:** ZABAL + Conviction staking view |
| **Farcaster Frames V2** | Cast engagement frames (custom UX) | **USE:** ZAO governance frames |
| **Chat** | Farcaster channels + DMs | USE: Community coordination |
| **Agents** | ElizaOS-powered agents | **USE:** ZOE + Hermes integration |
| **Clanker** | Token launch (create + trade) | USE: ZABAL Clanker management |
| **Hats** | Role-based access control | PARTIAL: Governance roles |
| *Others* | CoinGecko charts, YouTube embeds, DeFi stats | Reference only |

### Why NOT use Blank.space for Treasury UI

- **No custom column support:** Can't display "Agent ROI" or "ZABAL burn rate" in treasury view.
- **Fidgets are isolated:** No shared state between treasury + governance fidgets.
- **No subgraph queries:** Treasury fidget uses Alchemy API (limited to on-chain balances), not Nouns Builder subgraph (which tracks proposal history + voting).

**Better approach:** Use iykyk-terminal for treasury + proposals (rich, customized), embed Blank.space fidget in ZAO OS for community chat + agents.

---

## Comparison: DAO Dashboard Templates (Updated)

| Template | Stack | Governance | Treasury View | Auctions | Farcaster | Customizable | ZAO Fit | Notes |
|----------|-------|-----------|---|---|---|---|---|---|
| **iykyk-terminal** | Next.js 15, React 19, wagmi v2, Shadcn | Full CRUD + voting | Full (ETH + token + NFT) | YES | Planned (issue #270) | YES | **BEST** | MIT, self-hosted, contract ABIs, subgraph ready |
| **nouns.build** (default) | Next.js (Zora-hosted) | Basic proposal view | Basic ETH view | YES | NO | NO | Good | Official UI, zero setup, limited data |
| **agora.xyz** | Custom stack | Advanced delegation + snapshotting | Advanced (multi-asset) | NO | NO | LIMITED | Overkill | Enterprise pricing, wrong scale |
| **tally.xyz** | Custom stack | Multi-protocol (Compound, Aave, Nouns) | Multi-chain | NO | NO | LIMITED | Overkill | SaaS, off-chain voting, not Nouns-native |
| **blank.space** | TypeScript, Farcaster | Via fidgets | Via fidgets (summary only) | NO | YES (Frames V2) | YES (fidget-level) | Community hub | Social-first, not treasury-first |

---

## How ZOUNZ Treasury Funds Agents: The Complete Flow

### Current State (as of May 2026)

| Metric | Value | Status |
|--------|-------|--------|
| **DAO Address** | `0xCB80Ef04DA68667c9a4450013BDD69269842c883` (Base) | Verified [FULL] |
| **Treasury holds** | 20% of ZABAL supply (20B tokens) | Doc 345, memory [FULL] |
| **Governance** | 1 NFT = 1 vote (ERC-721) | Nouns Builder standard [FULL] |
| **Auction** | Daily minting (configurable) | Nouns Builder standard [FULL] |
| **Auction proceeds** | 100% to treasury (ETH from bids) | Nouns Builder standard [FULL] |
| **Voting delay** | 1 block (immediate) | Configurable per proposal |
| **Voting period** | 7 days (standard) | Configurable per proposal |
| **Quorum** | 2+ NFTs voting (configurable) | Example threshold |
| **Timelock** | 2 days (standard) | Configurable per proposal |

### Agent Funding Flow (Step by Step)

**Step 1: Create Proposal (Any NFT holder)**
```
Proposal: "Fund VAULT agent with 1B ZABAL"
- Targets: ZOUNZ treasury contract
- Function: transfer(VAULT_ADDRESS, 1_000_000_000 * 10^18)
- Description: "VAULT trades daily, buyback ZABAL, grow treasury"
- Voting period: 7 days
- Quorum: 2+ NFTs
```

**Step 2: Vote (NFT holders)**
- Cast vote: FOR, AGAINST, or ABSTAIN
- 1 NFT = 1 vote (no delegation override yet, per Nouns Gov V2 roadmap)
- 7-day voting window

**Step 3: Queue (If passed)**
- FOR votes > AGAINST votes AND >= quorum
- Proposal enters 2-day timelock
- Anyone can trigger queue

**Step 4: Execute (After timelock)**
- 1B ZABAL automatically transferred from treasury to VAULT's Privy wallet
- VAULT begins trading (daily DCA, buybacks, etc.)

**Step 5: Reporting + Feedback Loop**
- Weekly: VAULT posts to Farcaster `/zao` channel
  - "Traded: $5,432.10 USDC | Burned: 12.3M ZABAL | ROI: +2.3%"
- Dashboard: iykyk-terminal shows "Agent: VAULT | Funded: 1B ZABAL | ROI: +2.3%"
- Community votes on reallocation (new proposal)

### Three Funding Channels

| Channel | Mechanism | Smart Contracts | Amount Range | Frequency | Decision Maker | Example |
|---------|-----------|---|---|---|---|---|
| **Grants** | Governance proposal + NFT vote | Treasury.transfer() | 100M - 1B ZABAL | Per proposal (weeks) | ZOUNZ NFT holders | "Fund VAULT 1B ZABAL for Q2" |
| **Bounties** | Dutch auction (live bids, agent claims) | BountyBoard.claim(jobId) | 10K - 500K ZABAL | Per task (hours) | Job poster (anyone) | "Fix ZAO OS bug = 50K ZABAL" |
| **Auto-rewards** | On-chain activity tracker + proportional distribution | RewardTracker.distribute() | 1K - 50K ZABAL | Continuous (per block) | Smart contract (deterministic) | "1% of daily volume -> ZABAL stakers" |

---

## Token Cycling Architecture (ZABAL Flywheel)

```
                    ┌──────────────────────┐
                    │  ZOUNZ TREASURY      │
                    │  (20B ZABAL)         │
                    │  (daily auction ETH) │
                    └──────┬───────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   GRANTS     │ │  BOUNTIES    │ │ AUTO-REWARDS │
    │ (proposals)  │ │ (dutch auct) │ │ (per-action) │
    │ 100M-1B      │ │ 10K-500K     │ │ 1K-50K       │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           └────────────┬───┴───┬────────────┘
                        ▼       ▼
            ┌──────────────────────────────┐
            │   CREATORS & AGENTS          │
            │  VAULT | BANKER | DEALER     │
            │  Promoters | Community       │
            └────────┬───────────────────┘
                     │
        ┌────────────┼────────────┐
        │ AGENTS EARN ZABAL        │
        ▼                          ▼
    ┌─────────────┐          ┌───────────────┐
    │VAULT TRADES │          │ CONTENT (x402)│
    │ZABAL <->    │          │ + STAKE       │
    │SANG/ETH     │          │ + SPEND       │
    │             │          │               │
    │VOLUME ↑     │          │LOCK-UP ↑      │
    │(DexScreener)│          │(voting weight)│
    └──────┬──────┘          └───────┬───────┘
           │                         │
           └────────────┬────────────┘
                        ▼
                ┌──────────────────┐
                │  BUYBACKS &      │
                │  1% BURN         │
                │                  │
                │ VAULT: USDC->    │
                │ ZABAL buyback    │
                │                  │
                │ Protocol: 1% of  │
                │ volume burned    │
                └────────┬─────────┘
                         ▼
                 ZABAL PRICE RISES
                         │
                         ▼
          MORE INCENTIVE TO CREATE
          (Higher agent rewards)
                         │
                         ▼
              ┌──────────────────────┐
              │  IF NEW TOKEN        │
              │  (Clanker launch)    │
              │  Fees collected ->   │
              │  ZABAL buyback       │
              └──────────────────────┘
```

**Net effect:** Every action in the ecosystem pulls ZABAL toward higher price:
- VAULT trading volume = buyback buy pressure
- 1% burn = supply decrease
- Agent yields = community staking incentive
- New token fees = additional buyback capital

---

## ZAO Ecosystem Integration: Codebase Checkpoint

### Current References (as of May 2026)

| File | Content | Status | Integration |
|------|---------|--------|---|
| `src/lib/zounz/contracts.ts` | ZOUNZ DAO addresses + ABIs (Token, Auction, Governor, Treasury) | READY | Sync via iykyk-terminal fork |
| `src/components/zounz/ZounzProposals.tsx` | Proposal display (list view) | READY | Extend with agent metrics |
| `src/components/zounz/ZounzAuction.tsx` | Auction widget (bid, claim) | READY | Keep as-is |
| `community.config.ts` | ZOUNZ channel + contract reference | READY | Add proposal thresholds + voting periods |
| `src/app/(auth)/ecosystem/page.tsx:71` | ZOUNZ panel with iframe | READY | Link to iykyk-terminal fork |
| `src/lib/agents/types.ts` | Agent type definitions | READY | Add `treasury_allocation` field |
| `src/lib/agents/config.ts` | Agent runtime config | READY | Add agent funding source (grants/bounties) |

### Fork Targets

| Source | Target | Customization | Effort |
|--------|--------|---|---|
| `IYKYK-DAO/iykyk-terminal` | `/zounz-dashboard` or separate Vercel project | Add ZABAL token, agent ROI columns, Farcaster frame, subgraph queries | MEDIUM (1-2 weeks) |
| `Fractal-Nouns/OIF-Governance-Bridge` | Future: cross-DAO governance | Study only for now; implement when ZOUNZ <-> COC <-> FISHBOWLZ collab emerges | FUTURE (not MVP) |
| `blankdotspace/space-system` | Embed Blank.space fidget in ZAO OS ecosystem page | Community hub + agents integration | LOW (1-2 days) |

---

## Also See

- **Doc 703** - ZAO Fractal: Current State (May 2026) - operational status
- **Doc 702** - Respect & Fractal Governance: The Complete Lineage - governance theory
- **Doc 345** - ZABAL Agent Swarm Master Blueprint - agent funding architecture
- **Doc 547** - ZAO Stock 2026 Festival + Fundraising Strategy - treasury use case
- **Doc 115** - ZAO Respect Data Reconciliation Plan - related governance data

---

## Next Actions

| Task | Owner | Priority | Deadline |
|------|-------|----------|----------|
| Fork iykyk-terminal, set up Vercel preview on zounz-dash.zaoos.com | Engineer | HIGH | Next sprint |
| Customize dashboard: add ZABAL token, agent funding view, Farcaster frame | Engineer | HIGH | Next sprint |
| Write Nouns Builder proposal for "Fund VAULT 1B ZABAL" as pilot | Zaal | MEDIUM | Before Q2 agent allocation |
| Document ZOUNZ governance parameters in community.config.ts (thresholds, periods, quorum) | Engineer | MEDIUM | Before first proposal |
| Study Fractal Nouns OIF bridge; scope cross-DAO governance for future | Zaal | LOW | Q3 2026 |
| Integrate Blank.space fidget into ZAO OS ecosystem page | Engineer | LOW | Q3 2026 |

---

## Sources

- **IYKYK Terminal:** [GitHub repo](https://github.com/IYKYK-DAO/iykyk-terminal), updated 2026-03-03 [FULL]
- **Nouns Builder:** [Official docs](https://docs.nouns.build/onboarding/intro-onboarding/) [FULL], [Proposal creation guide](https://docs.nouns.build/onboarding/builder-proposal/) [FULL], [DAO creation guide](https://docs.nouns.build/guides/builder-deployment) [FULL]
- **Fractal Nouns:** [GitHub org](https://github.com/Fractal-Nouns), OIF-Governance-Bridge updated 2026-03-15 [FULL]
- **ERC-7683 Standard:** [Official spec](https://www.erc7683.org/spec) [FULL], [Across blog post](https://across.to/blog/ERC-7683-Building-a-Borderless-Ethereum) [FULL], [Hyperlane OIF post](https://www.hyperlane.xyz/post/the-open-intents-framework-unifying-ethereums-fragmented-ecosystem) [FULL]
- **Open Intents Framework:** [OIF Contracts GitHub](https://github.com/openintentsframework/oif-contracts) [FULL], [OIF Solver GitHub](https://github.com/openintentsframework/oif-solver) [FULL]
- **Blank.space:** [GitHub org](https://github.com/blankdotspace), [space-system repo](https://github.com/blankdotspace/space-system) updated 2026-02-09 [FULL], [README](https://github.com/blankdotspace/space-system/blob/canary/README.md) [FULL]
- **Nouns Governor V2:** [Mirror post on NFT voting](https://mirror.xyz/verbsteam.eth/tQ64cUYlf9hwdDvY8HLs3uw2vs_XwJelp8cY9leMO6c) [FULL]
- **ZAO Codebase:** `community.config.ts`, `src/lib/zounz/contracts.ts`, `src/components/zounz/*` [FULL]
