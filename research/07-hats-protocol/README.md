# Hats Protocol — NFT Role Hierarchies

> Source: [github.com/Hats-Protocol](https://github.com/Hats-Protocol) | [docs.hatsprotocol.xyz](https://docs.hatsprotocol.xyz) | [app.hatsprotocol.xyz](https://app.hatsprotocol.xyz)

## What Is Hats Protocol?

An **on-chain, tree-structured role and permissions system**. Every "hat" is a **non-transferable, revocable ERC-1155-compatible token** representing a role in an organizational hierarchy.

### Key Properties
- **Non-transferable** — hats are granted/revoked by admins, not traded
- **Revocable** — admin can revoke at any time
- **Hierarchical** — tree structure, every hat has one admin hat above it
- **Programmable eligibility** — smart contracts determine who can wear a hat
- **Programmable toggle** — hats auto-activate/deactivate based on on-chain conditions

---

## Tree Structure

```
              Top Hat (root)
             /       \
        Hat A         Hat B
       /    \            \
    Hat C   Hat D       Hat E
```

- **Top Hat** = root of org. Self-administered. Controls entire tree.
- **Admin Hat** = the hat directly above. Can create children, grant/revoke.
- **Hat IDs** = `uint256` encoding tree path via level-based bit-packing
- **Max depth:** 14 levels
- **Max hats per level:** 65,535

---

## Smart Contracts

### Core: `Hats.sol`
Single, singleton, non-upgradeable contract. Deployed once per chain via CREATE2 (deterministic address).

**Hat Properties (on-chain):**
| Field | Description |
|-------|-------------|
| `details` | String (typically IPFS URI → JSON role description) |
| `maxSupply` | Max simultaneous wearers |
| `eligibility` | Address of eligibility module (who can wear) |
| `toggle` | Address of toggle module (when hat is active) |
| `mutable` | Whether admin can change properties after creation |
| `imageURI` | Visual representation |

### Extension Interfaces

```solidity
interface IHatsEligibility {
    function getWearerStatus(address wearer, uint256 hatId)
        external view returns (bool eligible, bool standing);
}

interface IHatsToggle {
    function getHatStatus(uint256 hatId)
        external view returns (bool active);
}
```

### Pre-Built Modules
| Module | Description |
|--------|-------------|
| **Staking Eligibility** | Must stake tokens to wear a hat |
| **ERC-20/721/1155 Eligibility** | Token-gated roles |
| **Allowlist Eligibility** | Manually curated list |
| **Election Eligibility** | On-chain voting for roles |
| **Passthrough Eligibility** | Delegates to another hat |
| **Multi-claims Hatter** | Self-claim if eligible |
| **Season Toggle** | Time-based activation |

---

## Deployed Chains

Ethereum, **Optimism**, Arbitrum, Polygon, Gnosis, **Base**, testnets.

---

## SDKs

### `@hatsprotocol/sdk-v1-core` (TypeScript, built on viem)

```typescript
import { HatsClient } from "@hatsprotocol/sdk-v1-core";

const hatsClient = new HatsClient({
  chainId: 8453, // Base
  publicClient,
  walletClient,
});

// Check if address wears a hat
const isWearer = await hatsClient.isWearerOfHat({
  wearer: "0x...",
  hatId: BigInt("0x..."),
});

// Create a new hat
const result = await hatsClient.createHat({
  admin: topHatId,
  details: "ipfs://QmRoleDescription...",
  maxSupply: 5,
  eligibility: "0x...",
  toggle: "0x...",
  mutable: true,
  imageURI: "ipfs://QmImage...",
});

// Mint a hat to an address
await hatsClient.mintHat({
  hatId: curatorHatId,
  wearer: "0xNewCurator...",
});
```

### Other Packages
| Package | Purpose |
|---------|---------|
| `@hatsprotocol/sdk-v1-subgraph` | Query hat trees, wearers, events via The Graph |
| `@hatsprotocol/modules-sdk` | Deploy/configure eligibility and toggle modules |
| `@hatsprotocol/hats-signer-gate-sdk` | Safe multisig integration (hat wearers = signers) |
| `@hatsprotocol/hats-account-sdk` | ERC-6551 "hat accounts" (each hat has a smart account) |

---

## ZAO OS Hat Tree

### Proposed Structure

```
                    ZAO Top Hat (admin)
                   /        |         \
            Curators    Artists     Moderators
            /    \         |         /      \
      Senior  Junior   Featured   Senior   Junior
      Curator Curator   Artist     Mod      Mod
```

### Role Mapping

| Hat | Eligibility | Powers |
|-----|------------|--------|
| **ZAO Top Hat** | Core team multisig | Full governance, create/revoke all hats |
| **Senior Curator** | Respect ≥ 500 + staking | Feature tracks, create collections, 3x curation weight |
| **Junior Curator** | Respect ≥ 100 | 2x curation weight, suggest features |
| **Featured Artist** | Allowlist (curated by Senior Curators) | Artist badge, release highlights, auto-boost |
| **Senior Mod** | Allowlist (by Top Hat) | Content removal, ban users, manage channels |
| **Junior Mod** | Election by community | Flag content, soft-hide posts, first-response |

### Role Details (IPFS JSON)
```json
{
  "type": "1.0",
  "data": {
    "name": "Senior Curator",
    "description": "Trusted music curators with proven track record",
    "responsibilities": ["Review submissions", "Feature tracks", "Create collections"],
    "authorities": ["feature_content", "create_collection", "boost_3x"],
    "requirements": { "minRespect": 500, "staking": true }
  }
}
```

### Access Control in ZAO OS

```typescript
// Middleware: check hat before allowing action
async function requireHat(userAddress: string, action: string) {
  const roleHatMap: Record<string, bigint> = {
    "feature_content": SENIOR_CURATOR_HAT_ID,
    "suggest_feature": JUNIOR_CURATOR_HAT_ID,
    "moderate_post": SENIOR_MOD_HAT_ID,
    "flag_content": JUNIOR_MOD_HAT_ID,
    "artist_release": FEATURED_ARTIST_HAT_ID,
  };

  const hatId = roleHatMap[action];
  if (!hatId) return false;

  return await hatsClient.isWearerOfHat({ wearer: userAddress, hatId });
}
```

### Auto-Eligibility via Respect

Custom eligibility module that checks Respect balance:

```solidity
contract RespectEligibility is IHatsEligibility {
    IRespectLedger public respectLedger;
    uint256 public minRespect;

    function getWearerStatus(address wearer, uint256)
        external view returns (bool eligible, bool standing)
    {
        uint256 respect = respectLedger.balanceOf(wearer);
        eligible = respect >= minRespect;
        standing = true; // or add slashing conditions
    }
}
```

---

## Hats Anchor App

The **hats-anchor-app** is a reference frontend (Next.js/React) demonstrating:
- **HatsSignerGate** — Safe module where hat wearers auto-become Safe signers
- Role-based treasury management — the org tree controls who signs transactions
- Example: Curators hat controls a curation rewards Safe

---

## Key Advantages for ZAO OS

1. **On-chain provenance** — roles are verifiable, not just DB entries
2. **Composable** — other protocols can check hat ownership
3. **Auto-accountability** — eligibility modules auto-revoke if Respect drops
4. **Delegation** — admin hats delegate without giving root access
5. **Portable** — users carry roles across any Hats-aware app

## Limitations

- Every mint/revoke = on-chain tx (use L2: Base or OP for low gas)
- Tree is append-only (can deactivate, not delete hats)
- Max 14 levels deep, 65,535 hats per level
