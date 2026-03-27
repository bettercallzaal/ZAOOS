# 153 — BazAR & Atomic Assets: Arweave-Native Music Distribution for ZAO

> **Status:** Research complete
> **Date:** March 27, 2026
> **Goal:** Evaluate BazAR marketplace and Arweave atomic assets as a Zora-free, fully on-chain music distribution layer for ZAO OS

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use BazAR for distribution?** | YES — This is the Arweave-native marketplace. Music as atomic assets = data + contract + license in ONE transaction. Fully on-chain. No IPFS. No Zora. |
| **Use UCM protocol?** | YES — Universal Content Marketplace is the trustless on-chain orderbook for trading. Works for music, art, apps, anything. |
| **Use UDL for licensing?** | YES — Universal Data License lets ZAO artists set royalties, derivative rights, commercial terms per track. Hard-coded into the asset. |
| **Replaces thirdweb ERC-1155?** | PARTIALLY — Atomic assets are the Arweave-native alternative to ERC-1155 on Base. Can use BOTH: atomic assets on Arweave + ERC-1155 on Base. |
| **Minting tool** | ArDrive CLI or BazAR Studio (Helix) for no-code. Akord SDK is sunsetting — DO NOT USE. |
| **Trading currency** | $U token (swap from $AR). Artists earn in $U + $PIXL rewards. |

## What Are Atomic Assets?

Unlike ERC-721/1155 NFTs where the media lives on IPFS and the contract lives on Ethereum/Base, **atomic assets store EVERYTHING in one Arweave transaction:**

```
Traditional NFT (ERC-1155 on Base):
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Smart Contract│ ──► │ IPFS Metadata│ ──► │ IPFS Audio   │
│ (Base chain) │     │ (can vanish) │     │ (can vanish) │
└──────────────┘     └──────────────┘     └──────────────┘
  3 separate things, 2 can break

Atomic Asset (Arweave):
┌─────────────────────────────────────────────┐
│           ONE Arweave Transaction            │
│                                              │
│  Data:      The audio file itself            │
│  Tags:      Title, artist, genre, type       │
│  Contract:  AO process (ownership, trading)  │
│  License:   UDL (royalties, rights)          │
│                                              │
│  ALL permanent. ALL in one ID.               │
│  Nothing can break. Nothing can vanish.      │
└─────────────────────────────────────────────┘
```

**Key difference:** No external dependencies. No IPFS pins to maintain. No separate chain for the contract. The asset IS the contract IS the data IS the license.

## BazAR: The Marketplace

[BazAR](https://bazar.arweave.net/) is the first fully decentralized atomic asset exchange on Arweave.

### How It Works

1. **Creator uploads** audio + metadata as an atomic asset (via Helix/BazAR Studio or CLI)
2. **Asset gets tags:** Content-Type, Title, Artist, UDL license terms
3. **AO process spawned:** Smart contract for ownership, transfer, fractionalization
4. **Listed on UCM:** Trustless on-chain orderbook — no centralized marketplace needed
5. **Collectors buy** with $U token (swappable from $AR)
6. **Royalties enforced** via UDL — hard-coded, can't be bypassed
7. **$PIXL rewards** for active buyers (streak bonuses)

### BazAR Features

| Feature | Detail |
|---------|--------|
| **Fully decentralized** | No server, no company, no custodian. All on Arweave + AO. |
| **Atomic assets** | Data + contract + license in one transaction |
| **Fractionalization** | Partial ownership — multiple people can own shares of a track |
| **UCM orderbook** | Trustless trading, no intermediary |
| **UDL licensing** | Creator sets royalties, commercial use, derivative rights |
| **$U token** | Trading currency (swap from $AR via Permaswap) |
| **$PIXL rewards** | Bonus tokens for buyers, streak multipliers |
| **Permanent** | Assets exist 200+ years on Arweave |
| **Open source** | [github.com/permaweb/bazar](https://github.com/permaweb/bazar) (ISC license) |

### BazAR vs Other Marketplaces

| Feature | BazAR (Arweave) | OpenSea (ETH/Base) | Zora (Base) |
|---------|----------------|-------------------|-------------|
| Data storage | Permanent (Arweave) | IPFS (can vanish) | IPFS (can vanish) |
| Contract location | AO (on Arweave) | EVM chain | EVM chain |
| License enforcement | UDL (on-chain) | Off-chain/honor system | None built-in |
| Protocol fees | None | 2.5% | Zora protocol fee |
| Fractionalization | Native | Requires separate protocol | No |
| Audio-first | Any content type | Image-focused | Any content type |
| Royalties | UDL-enforced, programmable | EIP-2981 (optional) | Zora protocol rewards |
| Decentralization | Fully (no server) | Centralized company | Semi-centralized |

## UCM: Universal Content Marketplace Protocol

The UCM is NOT a company — it's an **on-chain orderbook protocol** built on AO ([github.com/permaweb/ao-ucm](https://github.com/permaweb/ao-ucm)).

**What it does:**
- Matches buy/sell orders for atomic assets
- Settles trades trustlessly (no escrow, no intermediary)
- Supports ANY content type: images, music, videos, papers, apps, domains
- Royalty distribution on every sale via UDL

**For ZAO:** UCM is the protocol layer. BazAR is just ONE UI for UCM. ZAO OS can build its OWN music-specific UCM interface — a custom frontend that queries the same orderbook but designed for music.

## UDL: Universal Data License

The [UDL](https://udlicense.arweave.net/) is attached as tags to each atomic asset. It's legally enforceable and on-chain.

### UDL Tags for Music

```typescript
const udlTags = [
  // License identification
  { name: 'License', value: 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8' }, // UDL contract tx

  // Commercial use
  { name: 'Commercial-Use', value: 'Allowed' }, // or 'Allowed-With-Credit'

  // Derivative works (remixes)
  { name: 'Derivation', value: 'Allowed-With-RevenueShare-25%' },
  // Artist gets 25% of any derivative work revenue

  // Payment model
  { name: 'License-Fee', value: 'One-Time-0.001' }, // 0.001 AR per access
  // OR: 'Monthly-0.01' for subscription model

  // Access control
  { name: 'Access-Fee', value: 'One-Time-0.001' }, // Pay to stream/download

  // Currency
  { name: 'Currency', value: 'AR' }, // or 'U' for $U token
];
```

### ZAO Music License Presets

```typescript
// community.config.ts addition
export const musicLicensePresets = {
  // Free to listen, credit required, no commercial use
  communityShare: {
    'Commercial-Use': 'Allowed-With-Credit',
    'Derivation': 'Allowed-With-Credit',
    'Access-Fee': 'None',
  },

  // Collectible — pay to own, free to listen
  collectible: {
    'Commercial-Use': 'Allowed-With-Credit',
    'Derivation': 'Allowed-With-RevenueShare-25%',
    'Access-Fee': 'None',
  },

  // Premium — pay to access
  premium: {
    'Commercial-Use': 'Disallowed',
    'Derivation': 'Disallowed',
    'Access-Fee': 'One-Time-0.001',
  },

  // Open — full creative commons
  open: {
    'Commercial-Use': 'Allowed',
    'Derivation': 'Allowed',
    'Access-Fee': 'None',
  },
};
```

## How to Create Music Atomic Assets

### Option 1: BazAR Studio / Helix (No-Code)

For artists who don't code:
1. Go to [studio_bazar.arweave.net](https://studio_bazar.arweave.net/) or [helix.arweave.net](https://helix.arweave.net/)
2. Connect ArConnect wallet (or sign in with Google via Othent)
3. Upload audio file (any format, no size limit on Arweave)
4. Fill metadata: title, artist, description
5. Set UDL license terms (royalties, commercial use, derivatives)
6. Fund with Turbo Credits (credit card via Stripe)
7. Asset is minted, permanent, and listed on BazAR

### Option 2: ArDrive CLI (Developer)

```bash
# Deploy an atomic asset via ArDrive CLI
ardrive upload-file \
  --local-file-path ./track.mp3 \
  --content-type audio/mpeg \
  --tags '{"App-Name":"ZAO-OS","Type":"music-track","Title":"Track Name","Artist":"Artist Name"}' \
  --udl '{"Commercial-Use":"Allowed-With-Credit","Derivation":"Allowed-With-RevenueShare-25%"}' \
  --wallet-file ./wallet.json
```

### Option 3: Programmatic (ZAO OS API Route)

```typescript
// POST /api/music/mint/atomic
import { TurboFactory } from '@ardrive/turbo-sdk';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const audioFile = formData.get('audio') as File;
  const title = formData.get('title') as string;
  const artist = formData.get('artist') as string;
  const license = formData.get('license') as string; // preset name

  const turbo = TurboFactory.authenticated({
    privateKey: JSON.parse(process.env.ARWEAVE_WALLET_KEY!),
  });

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
  const licensePreset = musicLicensePresets[license];

  // Upload as atomic asset with UDL
  const receipt = await turbo.uploadFile({
    fileStreamFactory: () => Readable.from(audioBuffer),
    fileSizeFactory: () => audioBuffer.length,
    dataItemOpts: {
      tags: [
        { name: 'Content-Type', value: audioFile.type },
        { name: 'App-Name', value: 'ZAO-OS' },
        { name: 'Type', value: 'music-track' },
        { name: 'Title', value: title },
        { name: 'Artist', value: artist },
        { name: 'Artist-FID', value: String(session.fid) },
        // UDL License
        { name: 'License', value: 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8' },
        ...Object.entries(licensePreset).map(([k, v]) => ({ name: k, value: v })),
      ],
    },
  });

  // Asset is now permanent on Arweave with built-in licensing
  return NextResponse.json({
    success: true,
    assetId: receipt.id,
    url: `https://arweave.net/${receipt.id}`,
    bazarUrl: `https://bazar.arweave.net/#/asset/${receipt.id}`,
  });
}
```

## ZAO Integration Architecture

### Dual Distribution Model

ZAO can do BOTH — atomic assets on Arweave AND ERC-1155 on Base:

```
Artist uploads track via ZAO OS
    │
    ├──► Arweave Atomic Asset (permanent, licensed)
    │    ├─ Data: audio file on Arweave
    │    ├─ License: UDL (royalties enforced)
    │    ├─ Trading: UCM orderbook ($U token)
    │    └─ Marketplace: BazAR + ZAO custom UI
    │
    └──► ERC-1155 on Base (optional, for EVM collectors)
         ├─ tokenURI → ar:// (points to Arweave asset)
         ├─ Revenue: 0xSplits (80/10/10)
         └─ Marketplace: OpenSea, Blur, etc.
```

**Why both?** Different audiences:
- Arweave community → BazAR, $U token, atomic assets
- Farcaster/Base community → ERC-1155, ETH, OpenSea
- Same audio file, permanent on Arweave either way

### Custom ZAO Music UCM Interface

Instead of sending users to bazar.arweave.net, build a **ZAO-branded UCM interface** inside ZAO OS:

```
src/components/music/
├── AtomicMint.tsx       # Upload + mint atomic asset
├── AtomicCollect.tsx    # Buy/collect from UCM orderbook
├── AtomicLicense.tsx    # UDL license picker (presets)
└── PermawebLibrary.tsx  # Browse ZAO music on Arweave via GraphQL
```

Query all ZAO music from Arweave:
```graphql
query ZAOMusic {
  transactions(
    tags: [
      { name: "App-Name", values: ["ZAO-OS"] },
      { name: "Type", values: ["music-track"] },
      { name: "Content-Type", values: ["audio/mpeg", "audio/wav", "audio/flac"] }
    ]
    sort: HEIGHT_DESC
    first: 50
  ) {
    edges {
      node {
        id
        tags { name value }
        owner { address }
        block { timestamp }
      }
    }
  }
}
```

## IMPORTANT: Akord is Sunsetting

Akord (`@akord/akord-js`) was previously recommended for minting atomic assets. **Akord is sunsetting its Arweave product** and transitioning to Walrus protocol on Sui blockchain.

**DO NOT USE Akord SDK.** Use ArDrive Turbo SDK instead.

## Cost Analysis

| Action | Cost | Notes |
|--------|------|-------|
| Upload 5MB MP3 as atomic asset | ~$0.04 one-time | Permanent forever |
| UDL license attachment | $0 | Just tags, included in upload |
| List on UCM/BazAR | $0 | No listing fee |
| UCM trade fee | Minimal (AO compute) | Fraction of a cent |
| $U token swap from $AR | Variable | Market rate on Permaswap |
| **Total per track** | **~$0.04** | Compare: Zora = $0.35+ per deploy |

## Revenue Model for ZAO Artists

| Revenue Source | How It Works |
|---------------|-------------|
| **Primary sales** | Collectors buy atomic asset on UCM ($U token) |
| **Royalties** | UDL enforces % on every resale (artist-defined, e.g., 10%) |
| **Derivative revenue** | If someone remixes, UDL enforces revenue share (e.g., 25%) |
| **Access fees** | Optional per-stream/per-download payments |
| **$PIXL rewards** | Buyers earn $PIXL for purchasing on BazAR (incentivizes collecting) |
| **Fractionalization** | Sell partial ownership of a track (multiple co-owners) |
| **0xSplits** | If ALSO minted as ERC-1155 on Base, splits handle Base revenue |

## Comparison: Atomic Assets vs ERC-1155 (thirdweb) for ZAO

| Feature | Atomic Assets (Arweave) | ERC-1155 (thirdweb on Base) |
|---------|------------------------|---------------------------|
| Data permanence | Guaranteed 200+ years | Depends on IPFS pinning |
| All-in-one | Data + contract + license = 1 tx | Contract on Base + media on IPFS/Arweave |
| Minting cost | ~$0.04 | ~$0.60 (deploy + mint) |
| Licensing | UDL (programmable, on-chain) | EIP-2981 (optional, basic) |
| Fractionalization | Native | Requires separate protocol |
| Marketplace | BazAR (UCM) | OpenSea, Blur |
| Audience | Arweave/permaweb community | Farcaster/Base/EVM community |
| Revenue splits | UDL royalties | 0xSplits |
| Trading token | $U (swap from $AR) | ETH |
| Decentralization | Maximum (no server) | Semi (relies on RPCs) |

**Recommendation:** Use atomic assets as the PRIMARY distribution method. Add ERC-1155 on Base as SECONDARY for EVM/Farcaster audience.

## Implementation Plan

### Phase 1: Atomic Asset Minting (Week 1)
- Create `src/lib/music/atomic.ts` — ArDrive Turbo upload with UDL tags
- Create `POST /api/music/mint/atomic` — server-side minting route
- Add license presets to `community.config.ts`
- Build `AtomicMint.tsx` — 3-step upload form

### Phase 2: BazAR Integration (Week 2)
- Build `PermawebLibrary.tsx` — query ZAO music via Arweave GraphQL
- Build `AtomicCollect.tsx` — buy/collect with ArConnect wallet
- Link to BazAR for each asset: `bazar.arweave.net/#/asset/{id}`

### Phase 3: Custom UCM UI (Week 3-4)
- Build ZAO-branded UCM interface for music browsing + collecting
- Integrate UCM orderbook queries
- Show artist earnings from UDL royalties

### Phase 4: Dual Distribution (Week 4+)
- Optional ERC-1155 on Base pointing to `ar://` URIs
- Unified artist dashboard: Arweave earnings + Base earnings

## Cross-References

| Doc | Relevance |
|-----|-----------|
| [152 — Arweave Ecosystem Deep Dive](../152-arweave-ecosystem-deep-dive/) | AO compute, ArDrive Turbo, Wayfinder CDN, GraphQL indexing |
| [151 — Distribution Without Zora](../151-zounz-distribution-without-zora/) | thirdweb ERC-1155 path (now secondary to atomic assets) |
| [150 — Arweave Storage](../150-arweave-permanent-music-storage/) | Basic Arweave intro + pricing |
| [149 — BuilderOSS Deep Dive](../149-buildeross-deep-dive-everything/) | ZOUNZ governance layer |
| [144 — ZOUNZ Unified Distribution](../144-zounz-music-nft-unified-distribution/) | Original ZOUNZ + music plan (used Zora) |

## Sources

### BazAR & UCM
- [BazAR Marketplace](https://bazar.arweave.net/) — Live marketplace
- [BazAR GitHub](https://github.com/permaweb/bazar) — ISC license, TypeScript
- [BazAR Studio](https://studio_bazar.arweave.net/) — No-code minting via Helix
- [BazAR Launch Announcement](https://medium.com/@perma_dao/bazar-launches-atomic-assets-market-powered-by-ucm-and-udl-603d6998032)
- [BazAR on ArweaveHub](https://arweavehub.com/discover/bazar-marketplace)
- [UCM Protocol (ao-ucm)](https://github.com/permaweb/ao-ucm)

### Atomic Assets
- [Tradeable Atomic Asset Spec](https://atomic-assets.arweave.net/)
- [Atomic NFT Standard](https://github.com/atomic-nfts/standard)
- [Arweave Paves Way for Creators](https://medium.com/@perma_dao/arweave-paves-the-way-for-creators-atomic-assets-are-the-right-nfts-5c82adaeab0d)
- [Getting Started on BazAR](https://mirror.xyz/jonnyringo.eth/MGB99MmaiXkrAtYXjudRr3XdSdwki3zlwl9Xe2ZHA0Q)
- [Arweave Cookbook: Atomic Assets](https://cookbook.arweave.dev/guides/smartweave/atomic-assets/akord.html)

### UDL (Universal Data License)
- [UDL Official](https://udlicense.arweave.net/)
- [Introducing UDL](https://mirror.xyz/0x64eA438bd2784F2C52a9095Ec0F6158f847182d9/AjNBmiD4A4Sw-ouV9YtCO6RCq0uXXcGwVJMB5cdfbhE)
- [UDL Explained](https://dev.to/fllstck/the-universal-data-license-explained-2di)
- [UDL with Helix and BazAR](https://mirror.xyz/afmedia.eth/NYOndU5OcCCp9pNnJDOuvdQmfjNbwlIy0OwWsJTG-Xg)
- [Monetize Content with UDL](https://dev.to/fllstck/monetize-your-content-with-the-udl-1i1l)

### Minting Tools
- [ArDrive CLI: Deploy Atomic Assets](https://cookbook.arweave.dev/guides/smartweave/atomic-assets/ardrive-cli.html)
- [ArDrive Turbo SDK](https://github.com/ardriveapp/turbo-sdk) — MIT license
- [Helix Upload Tool](https://helix.arweave.net/)
- [Akord (SUNSETTING — DO NOT USE)](https://akord.com/blog/akord-announces-atomic-nft-minting-tool)

### ar.io & BazAR Integration
- [BazAR Case Study on ar.io](https://ar.io/case-studies/bazar)
- [ANTs on BazAR](https://docs.arweave.net/learn/guides/ants-on-bazar)
