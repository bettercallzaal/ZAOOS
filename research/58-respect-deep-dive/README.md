# 58 — Respect System Deep Dive: Scoring Math, On-Chain State & ORDAO Integration

> **Status:** Research complete
> **Date:** March 17, 2026
> **Priority:** Critical — directly informs Sprint 2 (Respect Activation)
> **Sources:** 3 parallel research agents covering orclient SDK, Fibonacci scoring math, on-chain token data

---

## 1. On-Chain State of ZAO's Respect Tokens

### OG Respect (ERC-20)

| Field | Value |
|-------|-------|
| **Address** | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |
| **Chain** | Optimism |
| **Standard** | ERC-20 (thirdweb Minimal Proxy) |
| **Symbol** | ZAO |
| **Total Supply** | 38,484 ZAO |
| **Holders** | 122 addresses |
| **Transactions** | 438 |
| **Deployed** | July 30, 2024 |
| **Last Activity** | December 18, 2025 (frozen for ~3 months) |
| **Transfer model** | Transfer-restricted via `TRANSFER_ROLE` (soulbound at contract level) |
| **Governance** | Manual minting by zaal.eth via `MINTER_ROLE` |

**Status:** Frozen. No longer being actively minted. Legacy token.

### ZOR (Respect1155)

| Field | Value |
|-------|-------|
| **Address** | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| **Chain** | Optimism |
| **Standard** | ERC-1155 (Respect1155) |
| **Deployed** | September 11, 2025 |
| **Holders** | 4 addresses |
| **Last Activity** | March 16, 2026 (yesterday — actively minting) |
| **Owner** | OREC contract `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| **Transfer model** | Soulbound — all ERC-1155 transfer functions throw |
| **Governance** | Democratic — only OREC can mint/burn via passed proposals |

**Status:** Active. Being minted via OREC proposals. 167 OREC transactions, regular voting/execution (March 10-16, 2026).

### OREC Contract

| Field | Value |
|-------|-------|
| **Address** | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| **Chain** | Optimism |
| **Function** | Governance — reads OG token for vote weights, owns ZOR for minting |
| **Transactions** | 167 |
| **Last Activity** | March 16, 2026 |

### Parent/Child Relationship

```
OG ZAO (ERC-20, frozen)     →  provides vote weights to OREC
     ↓
OREC (governance contract)  →  reads OG balances, executes proposals
     ↓
ZOR (Respect1155, active)   →  minted by OREC when proposals pass
```

OG bootstraps governance. ZOR is the new standard. Both live on Optimism.

---

## 2. Fibonacci Scoring Mathematics

### Single-Round Scoring (Group of 6)

| Rank | Respect Earned | Fibonacci Index |
|------|---------------|-----------------|
| 6th (lowest) | 5 | — |
| 5th | 8 | — |
| 4th | 13 | — |
| 3rd | 21 | — |
| 2nd | 34 | — |
| 1st (highest) | 55 | — |

**Total per group:** 136 Respect per session.
**Top 33% earn 65.6%** of the allocation — softer than Pareto (80/20).

### Multi-Round Compounding (Not Recommended for ZAO)

In a 216-person community with 5 rounds, the top performer earns 610 Respect vs 1 for the lowest — a 610:1 ratio. Dan Larimer's own Addendum acknowledges "later rounds amplify errors as fewer measurements allocate larger percentages."

**Recommendation: Use single-round.** Optimism Fractal also simplified to single-round.

### Optimal Group Size: 6

- 6 people = 15 pairwise comparisons (tractable in 30 min)
- 13:1 max ratio provides meaningful differentiation
- One bad-faith actor = only 17% of group (vs 33% in group of 3)
- Top 3 advance cleanly: 50% halving per round if ever scaling to multi-round
- Accept groups of 4-5 when numbers don't fill all groups of 6

---

## 3. Decay Equilibrium Analysis

### 2% Weekly Decay Properties

Formula: `R(t) = R(t-1) * 0.98 + earned(t)`

**Equilibrium (constant earning):** `R_eq = earned / 0.02`

| Weekly Earning | Who | Equilibrium Balance | Tier at Equilibrium |
|---------------|-----|--------------------|--------------------|
| 55 (1st place every week) | Top contributor | 2,750 | Elder |
| 34 (2nd place every week) | Strong contributor | 1,700 | Curator |
| 21 (3rd place every week) | Regular contributor | 1,050 | Curator |
| 13 (4th place every week) | Participant | 650 | Curator |
| 8 (5th place every week) | Low participant | 400 | Member |
| 5 (6th place every week) | Minimal participant | 250 | Member |
| 0 (inactive) | Absent | Decays to 0 | Newcomer |

### Half-Life: 34 Weeks

At 2% weekly decay, a balance loses half its value in 34 weeks (~8 months). Contributions from 8 months ago still carry half-weight.

### Decay Timeline for Legend (10,000 Respect)

| Weeks Inactive | Balance | Tier |
|---------------|---------|------|
| 0 | 10,000 | Legend |
| 34 | 5,000 | Elder (half-life) |
| 69 | 2,500 | Elder |
| 115 | 1,000 | Curator |
| 228 | 100 | Member |
| 456 | 1 | Newcomer |

**4.4 years of complete inactivity** to decay from Legend to irrelevance.

### Alternative Decay Rates (Reference)

| Weekly Decay | Half-life | Equilibrium at 55/wk | Legend→1 |
|-------------|-----------|---------------------|----------|
| 1% | 69 weeks | 5,500 | 912 weeks |
| **2%** | **34 weeks** | **2,750** | **456 weeks** |
| 5% | 14 weeks | 1,100 | 179 weeks |
| 8% | 8 weeks | 688 | 112 weeks |
| 10% | 7 weeks | 550 | 88 weeks |

**2% is recommended.** Rewards sustained participation without being too "forgetful."

### Inequality Analysis

**Gini coefficient within a single Fibonacci round: ~0.23** — dramatically more equal than typical DAOs (0.97-0.99).

Over time with consistent participation, Gini stays ~0.23-0.30. With varied attendance, it rises to 0.4-0.5. Still far more equal than any token-voting DAO.

---

## 4. ORDAO orclient SDK Integration

### What It Is

`@ordao/orclient` is the TypeScript SDK for interacting with OREC and Respect1155 contracts. Published on npm. Used by Fractalgram, Respect.Games, and the ORDAO GUI.

### Key Functions for ZAO

| Function | What It Does |
|----------|-------------|
| `proposeBreakoutResult()` | Submit breakout room rankings as an OREC proposal (auto-calculates Fibonacci Respect) |
| `vote(propId, "Yes"/"No")` | Vote on a proposal (weighted by Respect balance) |
| `execute(propId)` | Execute a passed proposal (triggers Respect minting) |
| `getRespectOf(address)` | Get a wallet's Respect balance |
| `getAwards(spec)` | Get individual NTTs (award history) |
| `getProposals(spec)` | Query proposals with filters |

### How Breakout Result Submission Works

```typescript
import { createOrclient } from "@ordao/orclient";

const client = await createOrclient({
  title: "ZAO Fractal",
  contracts: {
    newRespect: "0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c",
    orec: "0xcB05F9254765CA521F7698e61E0A6CA6456Be532"
  },
  ornodeUrl: "https://zao-ornode.frapps.xyz",
  chainInfo: { chainId: "0xA", rpcUrls: ["https://mainnet.optimism.io/"], ... }
}, window.ethereum);

// After breakout room consensus:
await client.proposeBreakoutResult({
  meetingNum: weekNumber,
  groupNum: roomNumber,
  rankings: [addr1, addr2, addr3, addr4, addr5, addr6] // highest to lowest
}, { vote: "Yes" });
```

Respect amounts (55, 34, 21, 13, 8, 5) are calculated automatically from the rankings.

### OREC Governance Flow

1. Participant submits breakout result → creates OREC proposal + votes YES
2. **Voting period**: others can vote YES or NO (weighted by Respect)
3. **Passing condition**: `yesWeight >= minWeight` AND `yesWeight > 2 * noWeight`
4. **Veto period**: only NO votes accepted (challenge window)
5. **Execution**: anyone clicks execute → Respect1155 mints tokens to ranked participants

### Integration Considerations

| Consideration | Detail |
|--------------|--------|
| **License** | GPL-3.0 — ZAO OS is MIT. Need service boundary or dual-license discussion with maintainer. |
| **Wallet requirement** | orclient needs EIP-1193 provider. ZAO uses Farcaster signers, not Ethereum wallets. Members need wallet connection for on-chain proposals. |
| **ornode dependency** | ZAO must run its own ornode backend (Node.js indexer). ZAO already has one: `zao-ornode.frapps.xyz` |
| **Gas costs** | Each breakout submission = one Optimism transaction. Cents at current L2 costs. |
| **ethers v6** | orclient uses ethers v6. ZAO OS uses viem. May need both or a wrapper. |
| **Existing deployment** | ZAO already has OREC + Respect1155 deployed and active (167 transactions) |

### ZAO Already Has Infrastructure

The research revealed that ZAO already has:
- **OREC contract deployed and active** at `0xcB05...Be532`
- **ZOR Respect1155 deployed** at `0x9885...445c`
- **ornode running** at `zao-ornode.frapps.xyz`
- **Regular OREC voting and execution** happening (March 10-16, 2026)

This means the on-chain governance infrastructure already exists. Sprint 2's off-chain ledger should **sync from this existing on-chain state**, not replace it.

---

## 5. Implications for Sprint 2

### Architecture Decision

The off-chain ledger (`respect_balances` in Supabase) should be a **read cache** of the on-chain state, not the primary system:

```
OREC (on-chain, already active)
  ↓ proposeBreakoutResult → vote → execute → mint ZOR
  ↓
Respect1155 (on-chain, ZOR balances)
  ↓ sync via multicall (already built in leaderboard.ts)
  ↓
respect_balances (off-chain cache in Supabase)
  ↓ apply 2% weekly decay for tier calculation
  ↓
ZAO OS UI (leaderboard, tier badges, vote weight)
```

### Updated Sprint 2 Tasks

1. **Keep existing on-chain sync** (`leaderboard.ts`) as the source of truth
2. **Add `respect_balances` table** as a cache with tier calculation and decay
3. **Sync job** reads from on-chain (OG + ZOR) and populates off-chain ledger
4. **Decay job** applies 2% weekly to the off-chain balances for tier display
5. **Tier badges** displayed from off-chain tier field
6. **Vote weight** still reads on-chain (current behavior) — this is correct

### Future Sprint: orclient Integration

A future sprint could add a **breakout room UI** in ZAO OS that calls `proposeBreakoutResult()` via orclient, letting members submit fractal results directly from the Farcaster client instead of using Fractalgram on Telegram.

This would require:
- Resolving GPL-3.0 vs MIT license (service boundary or dual-license)
- Adding wallet connection for on-chain proposals
- Building the breakout room UX (group assignment, ranking, submission)

---

## 6. Key Numbers for Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Group size | 6 (accept 4-5) | 15 pairwise comparisons, 13:1 ratio, 17% bad-faith tolerance |
| Scoring | 5, 8, 13, 21, 34, 55 | Standard Fibonacci, single-round |
| Decay rate | 2% weekly | 34-week half-life, rewards sustained participation |
| Newcomer threshold | 0 | Basic access |
| Member threshold | 100 | ~20 weeks at 5/week earning |
| Curator threshold | 500 | ~10 weeks at 55/week earning |
| Elder threshold | 2000 | ~36 weeks at 55/week earning |
| Legend threshold | 10000 | Requires sustained top performance over many months |
| Decay to irrelevance | 4.4 years | From Legend (10,000) to below 100 |

---

## Sources

### On-Chain Data
- [OG Respect on Etherscan](https://optimistic.etherscan.io/address/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957)
- [ZOR Respect1155 on Etherscan](https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c)
- [OREC Contract on Etherscan](https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532)

### Scoring Math
- [Fractally Whitepaper Addendum 1 (Dan Larimer)](https://hive.blog/fractally/@dan/fractally-white-paper-addendum-1)
- [Introducing Fractally](https://fractally.com/blog/introducing-fractally)
- [ERC-7787: Soulbound Degradable Governance](https://eips.ethereum.org/EIPS/eip-7787)
- [On Simulating Fractal Governance (Matt Langston)](https://hive.blog/fractally/@mattlangston/on-simulating-fractal-governance)

### ORDAO SDK
- [@ordao/orclient on npm](https://www.npmjs.com/package/@ordao/orclient)
- [ORDAO GitHub](https://github.com/sim31/ordao)
- [orclient API Docs](https://orclient-docs.frapps.xyz)
- [OREC Specification](https://optimystics.io/orec)
- [Optimystics Toolkit](https://optimystics.io/tools)
