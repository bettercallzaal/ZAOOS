# 59 — ZAO Hats Tree: On-Chain State & ZAO OS Integration Plan

> **Status:** Research complete
> **Date:** March 18, 2026
> **Priority:** High — build Hats reader into ZAO OS before app.hatsprotocol.xyz potentially goes offline
> **Tree URL:** https://app.hatsprotocol.xyz/trees/10/226

---

## 1. ZAO Hat Tree (Live On-Chain Data)

Tree 226 on Optimism, queried directly from the Hats Protocol contract.

### Tree Structure

```
ZAO (Top Hat)
└── Configurator (2/5 wearers)
    ├── Governance Council (0/1 wearers)
    │   ├── Community
    │   ├── Location
    │   ├── ZAO 101
    │   ├── ZAO Fractals
    │   ├── Wave WarZ DAO
    │   ├── ZAO FESTIVALS
    │   ├── ZTalent Newsletter
    │   ├── ZAO Cards
    │   ├── Student $LOANZ
    │   ├── (unnamed - supply 0)
    │   ├── Future Project 3
    │   ├── Future Project 4
    │   ├── COC ConcertZ (1/1 wearer)
    │   ├── MIDI-ZAO-NKZ
    │   ├── Let's Talk about Web 3
    │   ├── Future Project 1
    │   └── Future Project 2
    └── Governance Council Members (3/5 wearers)
```

### Hat IDs

| Hat | ID (hex) | Supply |
|-----|----------|--------|
| **ZAO (Top Hat)** | `0x000000e2000000000000...` | 1/1 |
| **Configurator** | `0x000000e2000100000000...` | 2/5 |
| **Governance Council** | `0x000000e2000100010000...` | 0/1 |
| **Governance Council Members** | `0x000000e2000100020000...` | 3/5 |

### Key Observations

- **17 sub-hats** under Governance Council representing different project areas
- Most sub-hats have **0 supply** — roles defined but not yet assigned to wearers
- **COC ConcertZ** has 1 wearer (the only assigned project hat)
- **"Future Project" placeholders** exist (1, 2, 3, 4) for expansion
- **Configurator** hat has 2 of 5 possible wearers — these are the tree admins
- **Governance Council Members** hat has 3 of 5 — the active council
- All hats use **manual eligibility** (not token-gated yet)
- All hats are **mutable** (can be updated)

---

## 2. Contract Details

| Detail | Value |
|--------|-------|
| **Contract** | `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` |
| **Chain** | Optimism (chain ID 10) |
| **Tree ID** | 226 |
| **Standard** | ERC-1155 compatible |
| **Non-upgradeable** | Yes — immutable contract |
| **Same address on all chains** | Yes (deployed via CREATE2) |

---

## 3. Why Build Into ZAO OS

The Hats Protocol team's `app.hatsprotocol.xyz` frontend may not be maintained indefinitely. The contracts are **permanent and non-upgradeable** on Optimism, but the UI to interact with them could disappear.

ZAO needs its own interface to:
1. **View the hat tree** — who holds what roles
2. **Check hat ownership** — gate features based on hats (e.g., only Configurators can access admin)
3. **Mint/transfer hats** — assign roles to new members
4. **Create new hats** — add roles as the org grows
5. **Display role badges** — show hat names on profiles

---

## 4. Integration Architecture

### Required Packages

```bash
npm install @hatsprotocol/sdk-v1-core
```

That's it. The SDK is MIT-licensed, built on viem (already in ZAO OS), and exports the full contract ABI.

### Read-Only Integration (Phase 1)

```typescript
import { HatsClient } from "@hatsprotocol/sdk-v1-core";
import { createPublicClient, http } from "viem";
import { optimism } from "viem/chains";

const publicClient = createPublicClient({
  chain: optimism,
  transport: http(),
});

const hatsClient = new HatsClient({
  chainId: 10,
  publicClient,
});

// Check if a user wears a specific hat
const isCouncilMember = await hatsClient.isWearerOfHat({
  wearer: userAddress,
  hatId: GOVERNANCE_COUNCIL_MEMBERS_HAT_ID,
});

// Get hat details
const hat = await hatsClient.viewHat(hatId);
// => { details, maxSupply, supply, eligibility, toggle, imageUri, numChildren, mutable, active }
```

### Write Operations (Phase 2, requires wallet)

```typescript
const hatsClient = new HatsClient({
  chainId: 10,
  publicClient,
  walletClient, // from wagmi
});

// Mint a hat to a member
await hatsClient.mintHat({
  account: adminAddress,
  hatId: targetHatId,
  wearer: memberAddress,
});

// Create a new role under an existing hat
await hatsClient.createHat({
  admin: parentHatId,
  details: "ipfs://...",
  maxSupply: 5,
  eligibility: "0x0000000000000000000000000000000000000000",
  toggle: "0x0000000000000000000000000000000000000000",
  mutable: true,
  imageURI: "",
});
```

### IPFS Details Resolution

Hat `details` fields are IPFS URIs containing JSON:
```json
{
  "type": "1.0",
  "data": {
    "name": "Governance Council",
    "description": "",
    "responsibilities": [],
    "authorities": [],
    "eligibility": { "manual": true, "criteria": [] },
    "toggle": { "manual": true, "criteria": [] }
  }
}
```

Use any IPFS gateway to resolve: `https://gateway.pinata.cloud/ipfs/{cid}`

### Key Contract Functions

| Function | Purpose | Needs Wallet? |
|----------|---------|---------------|
| `viewHat(hatId)` | Get hat properties | No |
| `isWearerOfHat(wearer, hatId)` | Check if address wears hat | No |
| `isAdminOfHat(user, hatId)` | Check admin status | No |
| `isEligible(wearer, hatId)` | Check eligibility | No |
| `mintHat(hatId, wearer)` | Assign hat to address | Yes |
| `createHat(...)` | Create new child hat | Yes |
| `transferHat(hatId, from, to)` | Move hat between addresses | Yes |
| `renounceHat(hatId)` | Remove your own hat | Yes |

---

## 5. ZAO OS Feature Mapping

### What to Build

| Feature | Scope | Effort |
|---------|-------|--------|
| **Hat tree viewer** | Display tree structure on a page, show who wears what | 2 days |
| **Role badges** | Show hat name on profile cards and chat messages | 1 day |
| **Hat-based gating** | Check `isWearerOfHat()` before allowing admin/mod actions | 1 day |
| **Hat management** (admin) | Mint, transfer, create hats within ZAO OS | 2-3 days |

### Where It Fits in ZAO OS

```
src/
├── lib/
│   └── hats/
│       ├── client.ts         # HatsClient initialization
│       ├── tree.ts           # Fetch tree structure, resolve IPFS details
│       └── constants.ts      # Hat IDs for ZAO tree 226
├── app/
│   └── api/
│       └── hats/
│           ├── tree/route.ts     # GET - return full tree with resolved names
│           └── check/route.ts    # GET - check if user wears a hat
├── components/
│   └── hats/
│       ├── HatTree.tsx           # Visual tree display
│       ├── HatBadge.tsx          # Small badge showing hat name
│       └── HatManager.tsx        # Admin UI for minting/creating hats
```

### Hat ID Constants

```typescript
// src/lib/hats/constants.ts
export const ZAO_TREE_ID = 226;
export const ZAO_TOP_HAT = BigInt('0x000000e200000000000000000000000000000000000000000000000000000000');
export const CONFIGURATOR_HAT = BigInt('0x000000e200010000000000000000000000000000000000000000000000000000');
export const GOVERNANCE_COUNCIL = BigInt('0x000000e200010001000000000000000000000000000000000000000000000000');
export const COUNCIL_MEMBERS = BigInt('0x000000e200010002000000000000000000000000000000000000000000000000');
```

---

## 6. No Dependency on app.hatsprotocol.xyz

The contracts are **permanent on Optimism**. Even if the Hats Protocol website shuts down:

- Contract at `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` is immutable
- SDK `@hatsprotocol/sdk-v1-core` is MIT-licensed, published on npm
- IPFS content (hat details) is permanent if pinned
- ZAO OS can read and write directly to the contract using viem

The only potential dependency is the **subgraph** for historical queries. If The Graph endpoint goes down, ZAO can fall back to direct contract event log queries (slower but works without any third-party service).

---

## 7. Existing Utility Script

`scripts/read-hats-tree.ts` — reads the full ZAO tree from Optimism using viem. Run with:

```bash
npx tsx scripts/read-hats-tree.ts
```

---

## Sources

- [Hats Protocol Contract (Optimism)](https://optimistic.etherscan.io/address/0x3bc1a0ad72417f2d411118085256fc53cbddd137)
- [ZAO Tree on Hats App](https://app.hatsprotocol.xyz/trees/10/226)
- [@hatsprotocol/sdk-v1-core (MIT)](https://github.com/Hats-Protocol/sdk-v1-core)
- [Hats Protocol Docs](https://docs.hatsprotocol.xyz/)
- [Hats Anchor App (MIT)](https://github.com/Hats-Protocol/hats-anchor-app)
- Research doc 07 — Hats Protocol core concepts
- Research doc 55 — Hats Anchor App and DAO tooling landscape
