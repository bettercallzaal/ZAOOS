---
topic: governance
type: guide
status: research-complete
last-validated: 2026-08-21
related-docs: "07, 55, 075, identity/005"
tier: STANDARD
original-query: "Build Hats Protocol tree reader into ZAO OS for on-chain role management (reconstructed)"
---

# 059 — ZAO Hats Tree: On-Chain State & ZAO OS Integration Plan

> **Goal:** Document ZAO's on-chain role structure via Hats Protocol (Optimism tree 226) and design ZAO OS integration to read/write hats independently of app.hatsprotocol.xyz

**Re-validated 2026-08-21 (zao-identity lane).** Two corrections to the 2026-05-21
version, both confirmed by direct `eth_call` — not the dead subgraph, not a doc:

1. **The tree is at least 5 levels deep, not 3.** Levels 1-3 below (Configurator ->
   Governance Council -> 17 project hats) were already correct. What was missing:
   most project hats have a **Manager** role hat as a child (level 4), and several
   Manager hats have further children (level 5) that are real membership/role hats
   with actual wearer counts — one is a 67-wearer "Community Member" hat. See
   `## 1b` below. **Section 5's "What to Build" is now built** — `src/lib/hats/`
   exists — but its tree walker stops one level short of this layer; see `## 1c`.
2. **The IPFS metadata resolves fine.** A 2026-08-21 check (before this
   re-validation) reported all details CIDs empty across four gateways and flagged
   them as possibly unpinned. Re-fetched today via `ipfs.io` with a normal
   `curl` — every CID resolved on the first try. The gateways were the problem
   (likely the same class of failure this repo already has a rule about — see
   `liveness-probe-guard.md`), not the pins. Do not carry the "may be unpinned"
   caution forward.

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

### 1b. Levels 4-5 (new, 2026-08-21) — the tree keeps going below the 17 project hats

Verified by direct `eth_call` to `viewHat(hatId)` on `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`
(Optimism, `mainnet.optimism.io` and `optimism.publicnode.com` — the first rate-limited
mid-sweep, the second did not), computing child hat IDs per the encoding this repo's
own `src/lib/hats/constants.ts` already uses (16-bit level segments starting at bit 224).

**Level 4 — most project hats have a child "Manager" role hat**, active, maxSupply 1
(one seat). 13 of the 16 project hats have at least one; `cocConcertz` and the four
`futureProject*` placeholders do not (0 children — nothing to manage yet):

| Project (level 3) | Level-4 child | maxSupply/supply | children |
|---|---|---|---|
| Community | Community Manager | 1/1 | 4 |
| Location | Location Manager | 1/1 | 7 |
| ZAO 101 | ZAO 101 Manager | 1/1 | 3 |
| ZAO Fractals | ZAO FRACTALS Manager | 1/0 | 1 |
| Wave WarZ DAO | Wave WarZ DAO Manager | 1/1 | 3 |
| Wave WarZ DAO | (2nd child) "New Hat" | 1/0 | 0, **inactive** |
| ZAO Festivals | ZAO FESTIVALS Manager | 1/1 | 2 |
| ZTalent Newsletter | ZTalent Newsletter Manager | 1/0 | 3 |
| ZAO Cards | ZAO CARDS COMMUNITY MANAGER | 1/0 | 1 |
| ZAO Cards | ZAO CARDS Creative Director | 1/1 | 0 |
| Student $LOANZ | $LOANZ Managers | 3/3 | 1 |
| MIDI-ZAO-NKZ | Zen-Sai | 1/1 | 1 |
| MIDI-ZAO-NKZ | (2nd child) same CID as Zen-Sai | 1/0 | 0, **inactive** |
| Let's Talk about Web 3 | LTAW3 Season 1 | 1/0 | 0 |
| Let's Talk about Web 3 | LTAW3 Season 2 | 1/0 | 3 |
| Let's Talk about Web 3 | LTAW3 Season 3 | 1/0 | 0 |

**Level 5 — under several Manager hats, real member/role hats with actual headcounts.**
Sampled all 29 level-5 hats under the 11 branches that have level-4 children (some
level-4 nodes, e.g. `location.1`, themselves have up to 7 children — not fully named
yet, see gap below). The pattern: most are further single-seat sub-roles, but a few
are genuine membership hats:

- **Community Manager's 3rd child: maxSupply 1000, supply 67** — 67 wearers. This is
  almost certainly the general "Community Member" hat and is the largest wearer count
  found anywhere in the tree.
- ZAO 101's 3rd child and ZTalent Newsletter's 2nd child: maxSupply 10, supply 3 each.
- Let's Talk about Web 3 Season 1: maxSupply 3, supply 3 (full).
- MIDI-ZAO-NKZ's Zen-Sai child: 1/1 (filled).
- Several level-4 nodes have children not yet resolved at all: Location Manager (7
  children), Wave WarZ DAO Manager (3), ZAO Festivals' two managers (6 and 8
  children each — likely per-event or per-role hats), ZAO Cards Community Manager
  (3), Student $LOANZ Managers (1).

**Gap, stated plainly:** this pass did not walk past level 5, and several level-4/5
nodes above have unresolved children of their own (Location Manager's 7, both ZAO
Festivals managers' 6+8, etc.). The tree likely has 100+ total hats. What's here is
enough to know the SHAPE (project -> manager -> member/sub-role, membership hats
carry real headcounts) and to unblock priority-2/3 work below; a full leaf-level
census is follow-up work, not done here. The `wavewarz` project hat also carries a
**custom eligibility module** (`0x7234c36A71ec237c2Ae7698e8916e0735001E9Af`, not the
default `0x...4A75` manual-eligibility address every other hat in the tree uses) —
worth understanding before treating WaveWarZ hats as manually-gated like the rest.

### 1c. Code gap: `src/lib/hats/tree.ts` stops one level short

`fetchHatTree()` in `src/lib/hats/tree.ts` recurses with the guard
`if (numChildren > 0 && level < 4)`. Counting from the top hat as level 0, that walks
top -> configurator -> council/members -> project hats -> **Manager hats (level 4)**,
then stops — it never fetches what a Manager hat wears, i.e. exactly the 67-wearer
"Community Member" hat and its siblings found above. Anyone building a member-facing
"who's on this project" view or a hats-based gate for a project's actual contributors
(not just its Manager) needs to raise that cutoff or make it configurable. This is a
one-line change to a function that already exists and already resolves IPFS names —
not new architecture.

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

**Correction 2026-08-21:** `scripts/read-hats-tree.ts` does not exist in this repo
(`ls scripts/read-hats-tree.ts` -> no such file, checked at re-validation). Either it
was never committed or was removed since 2026-05-21; git history was not searched.
The equivalent walk now lives in `src/lib/hats/tree.ts` (`fetchHatTree()`), reachable
via `GET /api/hats/tree` — but see `## 1c` for its depth limit. Do not assume the
script below is runnable without first checking it exists.

`scripts/read-hats-tree.ts` — reads the full ZAO tree from Optimism using viem. Run with:

```bash
npx tsx scripts/read-hats-tree.ts
```

---

## Sources

- [Hats Protocol Contract (Optimism)](https://optimistic.etherscan.io/address/0x3bc1a0ad72417f2d411118085256fc53cbddd137) [FULL] — Immutable ERC-1155 contract at 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 on Optimism (chain ID 10). Verified 2026-05-20.
- [ZAO Tree on Hats App](https://app.hatsprotocol.xyz/trees/10/226) [FULL] — ZAO tree 226 live with 17 sub-hats, structure verified 2026-05-20. Configurator 2/5, Governance Council Members 3/5, COC Concertz 1/1 wearer.
- [@hatsprotocol/sdk-v1-core (MIT)](https://github.com/Hats-Protocol/sdk-v1-core) [FULL] — v1 SDK published on npm, MIT license, integrates with viem. Verified as maintained.
- [Hats Protocol Docs](https://docs.hatsprotocol.xyz/) [FULL] — Complete developer and user docs. ERC-1155 standard confirmed. IPFS details field confirmed.
- [Hats Protocol Website](https://www.hatsprotocol.xyz/) [FULL] — 50+ DAOs using Hats as of 2026. Composability integrations (Safe Signing, Snapshot, Tally, Unlock) verified.
- [Hats Anchor App (MIT)](https://github.com/Hats-Protocol/hats-anchor-app) [PARTIAL] — Reference implementation; ERC-1155 compatibility confirmed.

**Validation:** Tree 226 state confirmed live 2026-05-20. SDK v1 core is non-upgradeable per contract design. IPFS pin resilience documented. CREATE2 deterministic deployment across chains confirmed.

- [Hats Protocol Contract (Optimism), direct `eth_call`](https://mainnet.optimism.io) [FULL] — re-validated 2026-08-21 via `cast call viewHat(uint256)` against `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`, `optimism.publicnode.com` as the working RPC (the docs.optimism.io default rate-limited mid-sweep). All level 1-5 hat data in `## 1b` above came from these calls, not from the app.hatsprotocol.xyz UI or the (dead) subgraph.
- IPFS `details` CIDs for every hat cited above [FULL] — resolved via `curl https://ipfs.io/ipfs/<cid>`, plain JSON, no gateway 403s or empty bodies on this pass.
