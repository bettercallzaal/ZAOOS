# 131 — On-Chain Proposals & Governance for ZAO OS

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Evaluate on-chain proposal/voting mechanisms for ZAO — Nouns Builder Governor, Snapshot, OpenZeppelin Governor, and hybrid approaches
> **Builds on:** Doc 78 (Nouns Builder), Doc 31 (DAO Governance), Doc 56 (ORDAO Respect), Doc 108 (Superchain ORDAO)

---

## Key Decision

| Approach | Recommendation | Why |
|----------|---------------|-----|
| **Phase 1: ZOUNZ Governor (already deployed)** | **USE THIS FIRST** | ZAO already has a Nouns Builder DAO on Base with Governor contract at `0x9d98...`. Just need to build UI to read/create/vote on proposals. Zero new contracts needed. |
| **Phase 2: Snapshot embed** | **ADD AS FALLBACK** | For gasless votes where on-chain gas is friction. Iframe embed or API integration. Free, supports Optimism/Base tokens. |
| **Phase 3: Custom Governor + Respect voting** | **FUTURE** | Deploy OZ Governor with Respect-weighted voting. Requires ERC20Votes wrapper around Respect1155. Complex but ZAO's endgame. |

---

## Part 1: What ZAO Already Has

### Current Proposals System (Supabase — Off-Chain)

| Component | File | Status |
|-----------|------|--------|
| Proposals API (CRUD) | `src/app/api/proposals/route.ts` | Working |
| Vote API | `src/app/api/proposals/vote/route.ts` | Working (just fixed) |
| Proposals UI | `src/app/(auth)/fractals/ProposalsTab.tsx` | Working |
| Vote weight | On-chain Respect lookup (OG + ZOR balance) | Working |
| Auto-publish | Farcaster + Bluesky + X when threshold reached | Working |
| DB tables | `proposals`, `proposal_votes`, `proposal_comments` | Working |

**Problem:** Proposals and votes live in Supabase — not on-chain. This means:
- Votes are not verifiable or transparent
- No trustless execution (admin must manually implement approved proposals)
- No composability with other governance tools

### ZOUNZ DAO (On-Chain — Already Deployed)

| Contract | Address | Purpose |
|----------|---------|---------|
| **Token** | `0xCB80Ef04DA68667c9a4450013BDD69269842c883` | ERC-721 NFT (1 token = 1 vote) |
| **Auction** | `0xb2d43035c1d8b84bc816a5044335340dbf214bfb` | Daily NFT auctions |
| **Governor** | `0x9d98ec4ba9f10c942932cbde7747a3448e56817f` | Proposal creation + voting |
| **Treasury** | `0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f` | Holds ETH from auctions |

**The Governor contract is live on Base but ZAO OS has no UI for it.** Only the auction UI exists (`ZounzAuction.tsx`). This is the lowest-effort path to on-chain governance.

---

## Part 2: Three Approaches Compared

### Approach A: ZOUNZ Nouns Builder Governor (Recommended First)

**How it works:**
- ZOUNZ NFT holders can create proposals via the Governor contract
- Proposals describe on-chain actions (transfer ETH, call contracts, etc.)
- Voting period (configurable, typically 2-7 days)
- If quorum met + majority FOR → proposal enters timelock queue
- After timelock delay → can be executed on-chain (trustless)

**Governor ABI (key functions):**

```typescript
const governorAbi = parseAbi([
  // Read
  'function proposalCount() view returns (uint256)',
  'function proposals(bytes32 proposalId) view returns (address proposer, uint32 timeCreated, uint16 againstVotes, uint16 forVotes, uint16 abstainVotes, uint16 voteStart, uint32 voteEnd, uint32 proposalThreshold, uint32 quorumVotes, bool executed, bool canceled, bool vetoed)',
  'function getProposal(bytes32 proposalId) view returns (tuple)',
  'function state(bytes32 proposalId) view returns (uint256)',
  'function hasVoted(bytes32 proposalId, address voter) view returns (bool)',
  'function getVotes(address account) view returns (uint256)',

  // Write
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (bytes32)',
  'function castVote(bytes32 proposalId, uint256 support) returns (uint256)',
  'function queue(bytes32 proposalId) returns (uint256)',
  'function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash, address proposer) payable returns (uint256)',
  'function cancel(bytes32 proposalId)',
  'function veto(bytes32 proposalId)',
]);
```

**Integration effort:** ~8 hrs
- Read proposals from contract via viem (already have viem + Base RPC)
- Display in a new "On-Chain Proposals" section alongside existing Supabase proposals
- Create proposal form (targets, values, calldatas, description)
- Cast vote transaction (requires wallet connection — already have wagmi)
- Queue + execute for passed proposals

**SDK option:** `@public-assembly/builder-utils` (npm)
- React hooks: `useGovernorContext()` returns `{ proposals, governorAddress }`
- Wraps wagmi, viem, graphql-request
- Provides `ManagerProvider` that resolves all contract addresses from token address

### Approach B: Snapshot (Gasless Off-Chain + Optional On-Chain Execution)

**How it works:**
- Create a Snapshot space for ZAO (free, instant)
- Members vote by signing messages (no gas fees)
- Voting power derived from on-chain token balances (Respect, ZOUNZ, etc.)
- Results stored on IPFS (verifiable, permanent)
- Optional: Snapshot X for on-chain execution via Safe/Gnosis

**Snapshot Strategies (how voting power is calculated):**

| Strategy | How it works | ZAO fit |
|----------|-------------|---------|
| `erc20-balance-of` | ERC-20 token balance | Could wrap Respect as ERC-20 |
| `erc721` | NFT ownership (1 NFT = 1 vote) | ZOUNZ tokens |
| `erc1155-balance-of` | ERC-1155 balance | **Respect1155 directly** |
| `delegation` | Delegated voting power | Future phase |
| `ticket` | 1 person = 1 vote | Simple member votes |

**Snapshot X (fully on-chain, new):**
- Deployed on Ethereum, Optimism, Polygon, Arbitrum
- **Base NOT supported yet** as of March 2026
- Combines gasless voting UX with on-chain execution
- Uses Starknet for vote aggregation

**Integration options:**

1. **Iframe embed** (~2 hrs): Embed `https://snapshot.org/#/zao.eth/` in an iframe on the governance page. Quick but limited customization.

2. **API integration** (~6 hrs): Use Snapshot GraphQL API to read/display proposals natively. Members vote via Snapshot's signing flow.

3. **Full custom UI** (~12 hrs): Build proposal creation + voting UI using Snapshot.js SDK. Most work but best UX.

**Snapshot API:**
```graphql
query {
  proposals(where: { space: "zao.eth" }, orderBy: "created", orderDirection: desc) {
    id
    title
    body
    choices
    start
    end
    state
    scores
    votes
  }
}
```

### Approach C: Custom OpenZeppelin Governor + Respect Voting

**How it works:**
- Deploy custom Governor contract on Base
- Voting power = Respect balance (ERC-1155)
- Requires `ERC20Votes` wrapper around Respect1155 (Governor expects ERC-20 interface)
- Full trustless execution with timelock

**Challenge:** OZ Governor does NOT natively support ERC-1155 voting. You'd need:
1. A wrapper contract that implements `IVotes` interface
2. Reads `Respect1155.balanceOf(address, tokenId)` and translates to voting power
3. Handles delegation

**Effort:** ~20+ hrs (Solidity development + deployment + testing + UI)

**When to do this:** Phase 3, when ZAO has 100+ active members and needs trustless governance with Respect-weighted voting.

---

## Part 3: Hybrid Architecture (Recommended)

```
┌─────────────────────────────────────────────────────┐
│                   ZAO Governance Page                │
│                                                     │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Community    │ │ On-Chain     │ │ Snapshot     │ │
│  │ (Supabase)  │ │ (ZOUNZ Gov) │ │ (Gasless)    │ │
│  │             │ │              │ │              │ │
│  │ Social posts│ │ Treasury     │ │ Temperature  │ │
│  │ Polls       │ │ Contract     │ │ checks       │ │
│  │ Quick votes │ │ calls        │ │ Governance   │ │
│  │             │ │ ETH transfers│ │ questions    │ │
│  │ Respect-    │ │ NFT = 1 vote │ │ Respect      │ │
│  │ weighted    │ │              │ │ voting power │ │
│  └─────────────┘ └──────────────┘ └──────────────┘ │
│                                                     │
│  Tab: Community │ On-Chain │ Snapshot                │
└─────────────────────────────────────────────────────┘
```

**Three tabs on the governance page:**

1. **Community** (existing) — Supabase proposals for social decisions, quick polls, feature requests. Respect-weighted voting. Auto-publishes to Farcaster/Bluesky/X at 1000R threshold.

2. **On-Chain** (new) — ZOUNZ Governor proposals for treasury actions, contract calls, formal governance. ZOUNZ NFT = 1 vote. Trustless execution via timelock.

3. **Snapshot** (new) — Gasless governance for temperature checks and binding votes using Respect balance. Iframe or API integration.

---

## Part 4: Implementation Plan

### Sprint 1: ZOUNZ On-Chain Proposals (~8 hrs)

| Task | Effort | Details |
|------|--------|---------|
| Add Governor ABI to `src/lib/zounz/contracts.ts` | 30 min | Add `governorAbi` with propose/vote/state/queue/execute |
| Create `src/app/api/zounz/proposals/route.ts` | 2 hrs | Read proposals from Governor contract via viem multicall |
| Create `src/components/zounz/ZounzProposals.tsx` | 3 hrs | List proposals with status, vote counts, time remaining |
| Create proposal form | 1 hr | Description + optional on-chain action (ETH transfer) |
| Cast vote UI | 1 hr | For/Against/Abstain buttons triggering wallet tx via wagmi `useWriteContract` |
| Wire into ProposalsTab as new tab | 30 min | Add "On-Chain" tab alongside "Community" |

### Sprint 2: Snapshot Integration (~4 hrs)

| Task | Effort | Details |
|------|--------|---------|
| Create Snapshot space for ZAO | 30 min | Configure at app.snapshot.org with ERC-1155 Respect strategy |
| Option A: Iframe embed | 1 hr | `<iframe src="https://snapshot.org/#/zao.eth" />` in governance page |
| Option B: GraphQL API | 3 hrs | Fetch proposals via Snapshot API, render natively, link to Snapshot for voting |
| Add "Snapshot" tab to governance | 30 min | Third tab alongside Community + On-Chain |

### Sprint 3: Custom Respect Governor (Future — ~20 hrs)

| Task | Effort | Details |
|------|--------|---------|
| Write `RespectVotesWrapper.sol` | 6 hrs | IVotes adapter for Respect1155 |
| Deploy Governor + Timelock on Base | 2 hrs | Via OpenZeppelin Wizard |
| Integration + UI | 8 hrs | Full proposal lifecycle |
| Testing + audit | 4 hrs | Security review before mainnet |

---

## Part 5: Nouns Builder Governor — Detailed Technical Notes

### Proposal States

```typescript
enum ProposalState {
  Pending,    // Created but voting hasn't started
  Active,     // Voting is open
  Canceled,   // Proposer or veto canceled
  Defeated,   // Quorum not met or more against than for
  Succeeded,  // Passed vote, waiting for queue
  Queued,     // In timelock queue
  Expired,    // Timelock expired without execution
  Executed,   // Successfully executed on-chain
  Vetoed      // Vetoed by vetoer (founder)
}
```

### Reading Proposals with Viem

```typescript
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { ZOUNZ_GOVERNOR, governorAbi } from '@/lib/zounz/contracts';

const client = createPublicClient({ chain: base, transport: http() });

// Get proposal count
const count = await client.readContract({
  address: ZOUNZ_GOVERNOR,
  abi: governorAbi,
  functionName: 'proposalCount',
});

// Get voting power for an address
const votes = await client.readContract({
  address: ZOUNZ_GOVERNOR,
  abi: governorAbi,
  functionName: 'getVotes',
  args: [walletAddress],
});
```

### Casting a Vote with Wagmi

```typescript
import { useWriteContract } from 'wagmi';
import { ZOUNZ_GOVERNOR, governorAbi } from '@/lib/zounz/contracts';

const { writeContract } = useWriteContract();

// 0 = Against, 1 = For, 2 = Abstain
writeContract({
  address: ZOUNZ_GOVERNOR,
  abi: governorAbi,
  functionName: 'castVote',
  args: [proposalId, 1], // Vote FOR
});
```

### builder-utils SDK

```bash
npm install @public-assembly/builder-utils
```

```tsx
import { ManagerProvider, GovernorProvider, useGovernorContext } from '@public-assembly/builder-utils';

// Wrap app
<ManagerProvider tokenAddress={ZOUNZ_TOKEN}>
  <GovernorProvider>
    <ProposalsList />
  </GovernorProvider>
</ManagerProvider>

// In component
function ProposalsList() {
  const { proposals, governorAddress } = useGovernorContext();
  // proposals is an array of on-chain proposals
}
```

---

## Sources

- [Nouns Builder — Nouns your ideas](https://nouns.build/)
- [builder-utils — React hooks for Nouns Builder](https://github.com/public-assembly/builder-utils)
- [Nouns Builder Protocol Docs (Code4rena audit)](https://github.com/code-423n4/2022-09-nouns-builder/blob/main/docs/protocol-docs.md)
- [BuilderOSS/nouns-builder — GitHub](https://github.com/BuilderOSS/nouns-builder)
- [Snapshot Documentation](https://docs.snapshot.box/)
- [Snapshot X — On-chain voting protocol](https://snapshot.mirror.xyz/F0wSmh8LROHhLYGQ7VG6VEG1_L8_IQk8eC9U7gFwep0)
- [Snapshot X Voting Strategies](https://docs.snapshotx.xyz/protocol-sx-evm/voting-strategies)
- [OpenZeppelin Governor Docs](https://docs.openzeppelin.com/contracts/4.x/governance)
- [OZ Forum: ERC1155 as governance token](https://forum.openzeppelin.com/t/erc1155-as-governance-token/38619)
- [Tally — OpenZeppelin Governor](https://docs.tally.xyz/user-guides/governance-frameworks/openzeppelin-governor)
- [ZOUNZ on nouns.build](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
- [Doc 78 — Nouns Builder Integration](../078-nouns-builder-integration/)
- [Doc 31 — Governance & Tokenomics](../031-governance-dao-tokenomics/)
- [Doc 56 — ORDAO Respect System](../056-ordao-respect-system/)
