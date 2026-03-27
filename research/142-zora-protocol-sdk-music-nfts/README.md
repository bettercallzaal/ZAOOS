# 142 — Zora Protocol SDK: Building ZAO's Music NFT Minting Platform

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Technical implementation guide for music NFT minting in ZAO OS using Zora Protocol SDK on Base

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **SDK** | `@zoralabs/protocol-sdk` v0.9.x + `viem@2.x` — already compatible with ZAO's wagmi setup |
| **Token standard** | ERC-1155 via `create1155` — multi-edition, cheapest per-mint, secondary market built-in |
| **Chain** | Base (chain ID 8453) — same as ZOUNZ, cheapest L2 for minting |
| **Metadata storage** | IPFS via Pinata (same as builder-template-app uses) |
| **Payout** | 0xSplits address as `payoutRecipient` — automated revenue distribution |

## Architecture: How It Fits ZAO OS

```
src/
├── app/api/music/mint/
│   ├── create/route.ts      # Create new 1155 contract + first token
│   ├── add-token/route.ts   # Add token to existing contract
│   └── metadata/route.ts    # Upload audio + image to IPFS
├── components/music/
│   ├── MintTrack.tsx         # Artist minting form
│   ├── CollectTrack.tsx      # Fan collection button
│   └── MintSuccess.tsx       # Post-mint share flow
├── lib/music/
│   ├── zora.ts               # Zora SDK client setup
│   └── splits.ts             # 0xSplits configuration
```

## SDK Setup

```typescript
// src/lib/music/zora.ts
import { createCreatorClient, createCollectorClient } from '@zoralabs/protocol-sdk';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const creatorClient = createCreatorClient({
  chainId: base.id,
  publicClient,
});

export const collectorClient = createCollectorClient({
  chainId: base.id,
  publicClient,
});
```

## Minting Flow

### Step 1: Upload Audio + Artwork to IPFS
```typescript
// POST /api/music/mint/metadata
// Upload audio file (mp3/wav/flac) + cover art to Pinata
// Returns: { audioUri: "ipfs://...", imageUri: "ipfs://...", metadataUri: "ipfs://..." }
```

### Step 2: Create 1155 Edition
```typescript
const { parameters, contractAddress } = await creatorClient.create1155({
  contract: {
    name: "ZAO Music",
    uri: contractMetadataUri, // Collection-level metadata
  },
  token: {
    tokenMetadataURI: metadataUri, // Track-specific metadata (audio, artwork, title, artist)
    payoutRecipient: splitsAddress, // 0xSplits address for revenue distribution
    createReferral: zaoTreasuryAddress, // ZAO treasury earns referral fee
  },
  account: artistWalletAddress,
});
// Use wagmi's useWriteContract to execute the transaction
```

### Step 3: Fan Collects (Mints)
```typescript
const { parameters } = await collectorClient.mint({
  tokenContract: contractAddress,
  mintType: "1155",
  tokenId: 1n,
  quantityToMint: 1,
  mintComment: "Collected via ZAO OS 🎵",
  mintReferral: zaoTreasuryAddress, // ZAO earns mint referral reward
  minterAccount: fanWalletAddress,
});
```

## Metadata Standard for Music NFTs

```json
{
  "name": "Track Title",
  "description": "Artist Name — Album Name",
  "image": "ipfs://QmCoverArt...",
  "animation_url": "ipfs://QmAudioFile...",
  "content": {
    "mime": "audio/mpeg",
    "uri": "ipfs://QmAudioFile..."
  },
  "attributes": [
    { "trait_type": "Artist", "value": "Artist Name" },
    { "trait_type": "Genre", "value": "Hip Hop" },
    { "trait_type": "Duration", "value": "3:42" },
    { "trait_type": "BPM", "value": "120" },
    { "trait_type": "Released", "value": "2026-03-26" }
  ]
}
```

## Revenue Flow

```
Fan mints for 0.001 ETH
    │
    ├─► Zora Protocol Fee (small %)
    │       └─► Creator reward: 42.9% of protocol fee
    │
    ├─► Mint Referral (ZAO Treasury)
    │       └─► Referral reward from Zora
    │
    └─► Payout Recipient (0xSplits address)
            ├─► Artist: 80%
            ├─► ZAO Treasury: 10%
            └─► Curator/Submitter: 10%
```

## Cost Analysis (Base Chain)

| Action | Cost (ETH) | Cost (USD @ $3500) |
|--------|-----------|-------------------|
| Deploy 1155 contract | ~0.0001 | ~$0.35 |
| Create token (first mint) | ~0.0002 | ~$0.70 |
| Collector mint | ~0.0001 | ~$0.35 |
| Deploy Split | ~0.0001 | ~$0.35 |
| **Total artist setup** | **~0.0003** | **~$1.05** |

## Integration with Existing ZAO OS Code

**Already exists (reuse):**
- `src/lib/wagmi/config.ts` — Base chain configured, wallet connectors ready
- `src/app/api/music/wallet/route.ts` — Music NFT detection (Alchemy + Zora APIs)
- `src/components/zounz/ZounzAuction.tsx` — Pattern for wagmi contract interaction
- `community.config.ts` — ZOUNZ contracts config, add music NFT config here

**New files needed:**
- `src/lib/music/zora.ts` — Zora SDK client
- `src/lib/music/splits.ts` — 0xSplits client
- `src/app/api/music/mint/` — Minting API routes (3 routes)
- `src/components/music/MintTrack.tsx` — Minting UI
- `src/components/music/CollectTrack.tsx` — Collection button

## Supported Audio Formats
- MP3 (recommended — smallest file, widest support)
- WAV (lossless, larger)
- FLAC (lossless, compressed)
- OGG, AAC, M4A

## Sources

- [Zora Protocol SDK Intro](https://nft-docs.zora.co/protocol-sdk/introduction)
- [Zora Protocol SDK npm](https://www.npmjs.com/package/@zoralabs/protocol-sdk)
- [Zora 1155 Minting Docs](https://docs.zora.co/contracts/Minting1155)
- [Base Docs: Mint with Zora](https://docs.base.org/cookbook/use-case-guides/creator/nft-minting-with-zora)
- [Zora Protocol SDK Changelog](https://nft-docs.zora.co/changelogs/protocol-sdk)
- [Zora GitHub](https://github.com/ourzora)
