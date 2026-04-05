# 151 — ZOUNZ Music Distribution Without Zora: Arweave + Thirdweb + 0xSplits

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Redesign ZAO's on-chain music distribution replacing Zora with Arweave for storage and thirdweb/Manifold for minting — fully open, DAO-governed

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Storage** | Arweave via Irys SDK — permanent, pay-once (~$0.04/track). Replaces Zora's IPFS. |
| **Minting** | thirdweb ERC-1155 Edition contract on Base — open source, no protocol lock-in, same chain as ZOUNZ |
| **Alternative mint** | Manifold Creator contract — more established, extensions framework, audio NFT support |
| **Revenue splits** | 0xSplits on Base — unchanged from Doc 143. Works with ANY ERC-1155, not just Zora. |
| **Governance** | ZOUNZ DAO proposals fund releases — unchanged from Doc 144. |
| **Why not Zora?** | Protocol lock-in, pivoting to "attention markets" on Solana, IPFS not permanent, Zora takes protocol fees |

## Why Drop Zora?

| Issue | Detail |
|-------|--------|
| **Protocol lock-in** | Zora's `create1155` ties you to their contract factory. You don't own the contract. |
| **IPFS not permanent** | Zora stores metadata on IPFS. Files can disappear if pinning lapses. |
| **Protocol fees** | Zora takes a cut of every mint via protocol rewards. |
| **Pivot to Solana** | Feb 2026: Zora launched "attention markets" on Solana. Their focus is shifting from Base NFTs. |
| **Closed factory** | Zora's 1155 factory is their smart contract. You can't customize minting logic. |
| **No audio-first features** | Zora treats audio the same as images — no play tracking, no streaming integration. |

## The New Stack (Zora-Free)

```
┌─────────────────────────────────────────────────────┐
│                    ZAO OS Frontend                    │
│              (Next.js 16 + React 19)                  │
│                                                       │
│  Artist uploads track                                 │
│       │                                               │
│       ▼                                               │
│  ┌──────────────┐                                     │
│  │ Arweave      │ ← Permanent storage via Irys SDK    │
│  │ (ar:// URIs) │   Audio + Cover + Metadata           │
│  │ $0.04/track  │   Pay once, stored 200+ years        │
│  └──────┬───────┘                                     │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐                                     │
│  │ thirdweb     │ ← ERC-1155 Edition on Base           │
│  │ Edition      │   YOU own the contract                │
│  │ Contract     │   No protocol fees to thirdweb        │
│  │ (Base)       │   tokenURI → ar:// metadata           │
│  └──────┬───────┘                                     │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐                                     │
│  │ 0xSplits     │ ← Automated revenue distribution     │
│  │ (Base)       │   Artist 80% / Treasury 10% /        │
│  │              │   Curator 10%                         │
│  └──────┬───────┘                                     │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐                                     │
│  │ ZOUNZ DAO    │ ← Governance layer                   │
│  │ (Base)       │   Proposals fund releases             │
│  │              │   Treasury earns from splits           │
│  └──────────────┘                                     │
└─────────────────────────────────────────────────────┘
```

## Minting: thirdweb vs Manifold vs Custom

### Option A: thirdweb Edition (ERC-1155) — RECOMMENDED

**Why:** Open source, free to deploy, YOU own the contract, Base chain support, TypeScript SDK.

```typescript
// src/lib/music/mint.ts
import { ThirdwebSDK } from '@thirdweb-dev/sdk';

const sdk = ThirdwebSDK.fromPrivateKey(process.env.APP_SIGNER_PRIVATE_KEY, 'base');

// Deploy once — ZAO's music NFT contract
const contract = await sdk.deployer.deployEdition({
  name: 'ZAO Music',
  description: 'Music collectibles from The ZAO community',
  primary_sale_recipient: SPLITS_ADDRESS, // 0xSplits handles distribution
  seller_fee_basis_points: 250, // 2.5% secondary royalty
  fee_recipient: SPLITS_ADDRESS,
});

// Mint a new track edition
await contract.erc1155.mint({
  metadata: {
    name: trackTitle,
    description: `${artistName} — via ZAO OS`,
    image: `ar://${coverArtTxId}`,        // Arweave permanent
    animation_url: `ar://${audioTxId}`,    // Arweave permanent
    external_url: `https://zaoos.xyz/music/${trackId}`,
    attributes: [
      { trait_type: 'Artist', value: artistName },
      { trait_type: 'Genre', value: genre },
      { trait_type: 'Duration', value: duration },
    ],
  },
  supply: editionSize, // Open edition or limited
  to: artistAddress,
});
```

**Cost on Base:** ~$0.50 to deploy contract, ~$0.10 per mint

**Advantages over Zora:**
- You own the contract (not Zora's factory)
- No protocol fees
- Full control over minting logic
- Claim conditions (allowlists, time-based, max per wallet)
- Delayed reveals, burn-to-redeem mechanics
- Secondary royalties enforced via EIP-2981

### Option B: Manifold Creator Contract

**Why:** Most established creator contract. Full extensions framework. Audio NFT native support.

```typescript
// Manifold uses their Studio UI or Solidity extensions
// Deploy ERC-1155 Manifold Creator contract on Base
// Register mint extension for ZAO music editions
// Use Lazy Mint extension for gas-efficient batch minting
```

**Advantages:**
- Recognized on ALL marketplaces (OpenSea, Blur, etc.)
- Extensions: open editions, burn-to-redeem, auctions, galleries
- Unlimited file size support
- 4K+ asset quality
- Established reputation (used by major artists)

**Disadvantages:**
- More complex than thirdweb
- Studio UI adds abstraction layer
- Less TypeScript SDK-native than thirdweb

### Option C: Custom Solidity Contract

**Why:** Maximum control. No dependencies.

```solidity
// Minimal ERC-1155 with Arweave metadata
contract ZAOMusic is ERC1155, Ownable {
    mapping(uint256 => string) public tokenArweaveURI;
    mapping(uint256 => address) public tokenSplits;

    function mint(uint256 tokenId, uint256 amount) external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        _mint(msg.sender, tokenId, amount, "");
        // Forward payment to 0xSplits
        payable(tokenSplits[tokenId]).transfer(msg.value);
    }
}
```

**Advantages:** Zero dependencies, zero fees, full control
**Disadvantages:** Must handle security, upgrades, marketplace compatibility yourself

## Revenue Flow (Zora-Free)

```
Fan mints for 0.001 ETH
    │
    ├─► NO protocol fee (unlike Zora's cut)
    │
    └─► 100% goes to 0xSplits address
            ├─► Artist: 80% (0.0008 ETH)
            ├─► ZAO Treasury: 10% (0.0001 ETH)
            └─► Curator: 10% (0.0001 ETH)
```

**vs Zora's flow:**
```
Fan mints on Zora
    │
    ├─► Zora Protocol Fee (their cut)
    ├─► Zora Protocol Rewards (42.9% back to creator — but Zora keeps the rest)
    └─► Payout recipient (0xSplits)
```

**Result:** Without Zora, 100% of mint revenue goes directly to the Split. No middleman.

## ZOUNZ Governance Integration (Same as Doc 144, No Zora)

### Proposal Types Still Work

| Proposal | How It Works Without Zora |
|----------|--------------------------|
| "Fund Artist Release" | Treasury sends ETH to cover Arweave upload + contract deployment (~$1) |
| "Feature Track" | No change — in-app curation |
| "Change Split" | No change — 0xSplits is protocol-agnostic |
| "Community Compilation" | Deploy one thirdweb Edition with multiple token IDs |

### Revenue Cycle

```
ZOUNZ Daily Auction → Treasury
    │
    ├─► Fund music releases (proposals)
    │       └─► Arweave upload ($0.04) + thirdweb deploy ($0.50)
    │
    └─► Earn from splits
            └─► 10% of all music NFT revenue → Treasury
```

## Cost Comparison: Zora vs Zora-Free

| Action | With Zora (Base) | Without Zora (Base) |
|--------|-----------------|-------------------|
| Store audio | Free (IPFS, but impermanent) | $0.04 (Arweave, permanent) |
| Deploy contract | ~$0.35 (Zora factory) | ~$0.50 (thirdweb) — ONE TIME |
| Mint token | ~$0.10 + Zora fee | ~$0.10 (no protocol fee) |
| Secondary royalty | Via Zora protocol | Via EIP-2981 (standard) |
| **100 mints** | ~$10 + Zora fees | ~$10 + $0.04 storage |
| **Protocol fee** | Yes (Zora takes cut) | **None** |
| **Storage permanent?** | No (IPFS pins expire) | **Yes (200+ years)** |

## New File Structure

```
src/
├── lib/music/
│   ├── arweave.ts         # Irys SDK client + upload helpers
│   ├── mint.ts            # thirdweb Edition deployment + minting
│   └── splits.ts          # 0xSplits (unchanged from Doc 143)
├── app/api/music/
│   ├── upload/route.ts    # Upload audio + art to Arweave
│   ├── mint/
│   │   ├── create/route.ts   # Deploy edition + first token
│   │   ├── collect/route.ts  # Collector mint
│   │   └── dashboard/route.ts # Artist earnings
```

## Dependencies

```json
{
  "@irys/sdk": "^0.2.0",
  "@thirdweb-dev/sdk": "^5.0.0",
  "@0xsplits/splits-sdk": "^6.4.1"
}
```

No `@zoralabs/protocol-sdk` needed.

## Migration from Doc 142/144

| Doc 142 (Zora) | This Doc (Zora-Free) |
|----------------|---------------------|
| `@zoralabs/protocol-sdk` | `@thirdweb-dev/sdk` or custom contract |
| `create1155` | `sdk.deployer.deployEdition` + `erc1155.mint` |
| IPFS via Zora | Arweave via Irys |
| Zora secondary market | Any marketplace (OpenSea, Blur, etc.) |
| Zora protocol rewards | No protocol fees — 100% to Split |
| `payoutRecipient` on Zora | `primary_sale_recipient` on thirdweb → Split address |

## Open Source & Forkability

The Zora-free stack is MORE forkable:
- **thirdweb contracts:** MIT licensed, verified on Etherscan
- **0xSplits:** Open source, deterministic addresses
- **Arweave:** Permissionless storage, no accounts needed
- **Nouns Builder:** MIT licensed contracts
- **community.config.ts:** Still the single fork point

Any community can replicate this without depending on Zora's protocol or governance.

## Sources

- [thirdweb ERC-1155 Edition](https://thirdweb.com/thirdweb.eth/TokenERC1155)
- [thirdweb SDK](https://portal.thirdweb.com/typescript/sdk.erc1155.mint)
- [thirdweb Deploy Docs](https://portal.thirdweb.com/contracts/build/extensions/erc-1155/ERC1155Mintable)
- [Manifold Creator Core](https://github.com/manifoldxyz/creator-core-solidity)
- [Manifold Studio Guide](https://nftevening.com/manifold-studio-guide-from-no-code-nfts-to-open-edition-nft-minting/)
- [Arweave](https://arweave.org/) | [Irys SDK](https://www.npmjs.com/package/@irys/sdk)
- [0xSplits](https://docs.splits.org/) | [Zora + Splits blog](https://splits.org/blog/zora-integration/)
- [ZOUNZ DAO](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
- [Doc 142 — Zora SDK (superseded)](../../_archive/142-zora-protocol-sdk-music-nfts/)
- [Doc 144 — ZOUNZ + Music (original)](../../music/144-zounz-music-nft-unified-distribution/)
- [Doc 150 — Arweave Storage](../../_archive/150-arweave-permanent-music-storage/)
