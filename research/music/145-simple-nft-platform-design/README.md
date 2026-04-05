# 145 — Simple NFT Platform Design: Music Collectibles for ZAO Members

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Design a dead-simple NFT minting experience for ZAO artists who are NOT crypto-native

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Simplicity** | ONE button to mint. No gas estimation, no ABI knowledge, no Etherscan. |
| **Abstraction** | Server-side contract creation via API routes. Artist just fills a form. |
| **Wallet** | Use existing wagmi wallet connection (MetaMask, WalletConnect, Coinbase) |
| **Pricing** | Default free mint (0 ETH) with optional paid mint. Gas sponsored by ZAO treasury for first release. |
| **Template** | Pre-configured splits. Artist doesn't need to understand 0xSplits. |

## The Problem

Most music NFT platforms are too complex for artists:
- Sound.xyz (dead) required wallet setup + understanding of editions + pricing
- Zora's native UI requires understanding gas, contracts, metadata
- Catalog is invitation-only and Ethereum mainnet (expensive)

ZAO's advantage: **100-member gated community** where we control the UX end-to-end.

## User Experience Design

### Artist Minting Flow (3 Steps)

```
┌──────────────────────────────────────┐
│         STEP 1: Upload Track         │
│                                      │
│  [🎵 Drop your track here]           │
│                                      │
│  Track Title: _______________        │
│  Artist Name: (auto-filled)          │
│  Genre: [dropdown]                   │
│  Cover Art: [upload]                 │
│                                      │
│  [Next →]                            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         STEP 2: Set Price            │
│                                      │
│  ○ Free collect (recommended)        │
│  ○ 0.001 ETH (~$3.50)               │
│  ○ 0.005 ETH (~$17.50)              │
│  ○ Custom: _____ ETH                 │
│                                      │
│  Edition size:                       │
│  ○ Open (unlimited)                  │
│  ○ Limited: _____ copies             │
│                                      │
│  Revenue split:                      │
│  You: 80% | ZAO Treasury: 10%       │
│  Curator: 10%                        │
│  [Customize split...]                │
│                                      │
│  [Next →]                            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         STEP 3: Confirm & Mint       │
│                                      │
│  "Summer Vibes" by ArtistName        │
│  [cover art preview]                 │
│  [▶ audio preview]                   │
│                                      │
│  Price: Free collect                 │
│  Edition: Open                       │
│  Chain: Base                         │
│  Split: You 80% / Treasury 10% /    │
│         Curator 10%                  │
│                                      │
│  Estimated cost: ~$1.05              │
│  (Contract deploy + first mint)      │
│                                      │
│  [🎵 Mint Your Track]               │
└──────────────────────────────────────┘
```

### Collector Flow (1 Step)

```
┌──────────────────────────────────────┐
│  Track Card (in music library)       │
│                                      │
│  [cover art]                         │
│  "Summer Vibes" — ArtistName         │
│  ▶ Play | ♥ Like | 🔗 Share          │
│                                      │
│  ┌────────────────────────────┐      │
│  │  [Collect] Free            │      │
│  │  42 collected              │      │
│  └────────────────────────────┘      │
│                                      │
└──────────────────────────────────────┘
```

## Technical Implementation

### Server-Side Abstraction

```typescript
// POST /api/music/mint/create
// Artist submits form → server handles ALL complexity

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = MintTrackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { title, audioIpfs, imageIpfs, price, editionSize, splits } = parsed.data;

  // 1. Upload metadata to IPFS
  // 2. Predict split address
  // 3. Return transaction parameters for client-side signing
  // (Artist only signs ONE transaction)
}
```

### What the Artist NEVER Sees
- Contract ABI or bytecode
- Gas estimation
- Etherscan links
- Split contract deployment details
- IPFS hashing
- Chain selection (always Base)

### What the Artist DOES See
- Upload form (title, audio, cover art)
- Price picker (free/cheap/custom)
- Revenue split preview (with percentages and names)
- One "Mint" button
- Success screen with share links

## Gas Sponsorship for Onboarding

**First release free:** ZAO Treasury sponsors gas for each artist's first mint.

Implementation:
- Treasury holds small ETH balance on Base
- API route uses treasury's app wallet to relay the creation transaction
- After first release, artist pays their own gas (~$1.05)
- Proposal to the ZOUNZ DAO to allocate treasury funds for sponsorship

## Integration with Existing Music Library

The NFT mint button appears **alongside existing music features:**
- Track appears in the regular music library after minting
- Play counts tracked via existing `POST /api/music/library/play`
- Respect reactions still work
- Trending algorithm includes mint count as engagement signal
- "Collect" button appears next to "Like" and "Share"

## Mobile-First Design

Following ZAO's mobile-first approach:
- Upload form optimized for phone (large touch targets)
- Audio preview in-form
- Wallet connection via WalletConnect (works in mobile browsers)
- Success screen with one-tap share to Farcaster

## Sources

- [Zora Protocol SDK](https://nft-docs.zora.co/protocol-sdk/introduction)
- [0xSplits SDK](https://docs.splits.org/sdk)
- [Base Chain Costs](https://docs.base.org/)
- ZAO OS codebase: `src/components/music/`, `src/app/api/music/`
