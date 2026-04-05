# 150 — Arweave: Permanent Music Storage for ZAO OS

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Replace IPFS/Zora with Arweave for permanent, pay-once music storage — audio files live forever

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Storage** | USE Arweave via Irys SDK — permanent storage, pay once, ~$0.04 per 5MB audio file |
| **Upload tool** | Irys (formerly Bundlr) — handles 90%+ of Arweave uploads, JS/TS SDK, 14 payment tokens |
| **Fast option** | ArDrive Turbo — fiat payments (credit card), faster uploads, same Arweave permanence |
| **Why not IPFS?** | IPFS requires ongoing pinning ($). Files disappear when pins expire. Arweave = pay once, stored 200+ years. |
| **Why not Zora?** | Zora stores metadata on IPFS (not permanent) and ties you to their protocol. Arweave is protocol-agnostic. |
| **NFT metadata** | Store on Arweave (`ar://` URIs). Point ERC-1155 `tokenURI` and `animation_url` to Arweave. |

## Why Arweave Over IPFS for Music

| Feature | IPFS (Pinata) | Arweave |
|---------|---------------|---------|
| **Permanence** | No — requires ongoing pinning payments | Yes — 200+ years guaranteed |
| **Cost model** | Monthly (~$20/mo for 50GB) | One-time (~$0.008/MB) |
| **Audio file (5MB)** | ~$0.02/month forever | ~$0.04 once, forever |
| **100 tracks (500MB)** | ~$2/month ($24/year) | ~$4 total, forever |
| **1000 tracks (5GB)** | ~$20/month ($240/year) | ~$40 total, forever |
| **Gateway** | `ipfs.io/ipfs/{hash}` | `arweave.net/{txId}` |
| **File disappears?** | Yes, if pin expires | Never |
| **Already in ZAO?** | Yes — `next.config.ts` allows `ipfs.io` images | Partially — `next.config.ts` allows `arweave.net` images |

**Break-even:** Arweave pays for itself vs IPFS pinning after ~2 months for a music library.

## Arweave Cost Analysis for ZAO Music

Current Arweave pricing (March 2026): **~$6.35-$8.00 per GB** (one-time)

| Content Type | Avg Size | Cost (one-time) | Notes |
|-------------|----------|-----------------|-------|
| MP3 track (128kbps, 4min) | 3.8 MB | $0.03 | Most common format |
| MP3 track (320kbps, 4min) | 9.6 MB | $0.07 | High quality |
| WAV track (4min) | 40 MB | $0.30 | Lossless |
| FLAC track (4min) | 25 MB | $0.19 | Lossless compressed |
| Cover art (1400x1400 JPG) | 0.5 MB | $0.004 | Album/single cover |
| JSON metadata | 0.002 MB | $0.00002 | Token metadata |
| **Full release (MP3 + art + metadata)** | **~4.3 MB** | **~$0.034** | Typical single |
| **10-track album** | **~43 MB** | **~$0.34** | Full album |

**For ZAO's 100-member community:**
- 50 releases/month × $0.034 = **$1.70/month** in storage (one-time!)
- After 1 year: 600 tracks permanently stored for **~$20 total**

## Upload Options

### Option 1: Irys SDK (Recommended)

Irys handles 90%+ of all Arweave uploads. TypeScript SDK, 14 payment tokens.

```typescript
// src/lib/music/arweave.ts
import Irys from '@irys/sdk';

const irys = new Irys({
  network: 'mainnet',
  token: 'ethereum', // Pay in ETH (or MATIC, SOL, AVAX, etc.)
  key: process.env.ARWEAVE_PRIVATE_KEY,
  config: { providerUrl: 'https://mainnet.base.org' },
});

// Check upload cost
const price = await irys.getPrice(fileSize); // Returns cost in atomic units

// Upload audio file
const receipt = await irys.uploadFile('./track.mp3', {
  tags: [
    { name: 'Content-Type', value: 'audio/mpeg' },
    { name: 'App-Name', value: 'ZAO-OS' },
    { name: 'Artist', value: artistName },
    { name: 'Title', value: trackTitle },
  ],
});

const permanentUrl = `https://arweave.net/${receipt.id}`;
// This URL works FOREVER
```

**Supported payment tokens:** ETH, MATIC, SOL, AVAX, BOBA, AR, APTOS, NEAR, BNB, FANTOM, and more.

### Option 2: ArDrive Turbo (Fiat Payments)

For artists who don't have crypto — pay with credit card.

```typescript
import { TurboFactory } from '@ardrive/turbo-sdk';

const turbo = TurboFactory.authenticated({ privateKey });

// Upload with Turbo Credits (purchasable via credit card)
const { id } = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./track.mp3'),
  fileSizeFactory: () => fileSize,
});

const permanentUrl = `https://arweave.net/${id}`;
```

### Option 3: Direct Arweave (Advanced)

For maximum decentralization — upload directly to Arweave network.

```typescript
import Arweave from 'arweave';

const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const key = JSON.parse(process.env.ARWEAVE_WALLET_KEY);

const tx = await arweave.createTransaction({ data: audioBuffer }, key);
tx.addTag('Content-Type', 'audio/mpeg');
tx.addTag('App-Name', 'ZAO-OS');

await arweave.transactions.sign(tx, key);
await arweave.transactions.post(tx);

const permanentUrl = `https://arweave.net/${tx.id}`;
```

## Music NFT Metadata on Arweave

```json
{
  "name": "Track Title",
  "description": "Artist Name — Released via ZAO OS",
  "image": "ar://CoverArtTxId",
  "animation_url": "ar://AudioFileTxId",
  "external_url": "https://zaoos.xyz/music/track-id",
  "attributes": [
    { "trait_type": "Artist", "value": "Artist Name" },
    { "trait_type": "Genre", "value": "Hip Hop" },
    { "trait_type": "Duration", "value": "3:42" },
    { "trait_type": "Format", "value": "MP3 320kbps" },
    { "trait_type": "Storage", "value": "Arweave (permanent)" }
  ]
}
```

**Key difference from IPFS:** `ar://` URIs are permanent. No pinning service required. The content is guaranteed to exist at that address for 200+ years.

## Integration with ZAO OS Codebase

**Already exists:**
- `next.config.ts` line 43: `arweave.net` allowed as image remote pattern ✅
- `src/app/api/music/wallet/route.ts`: Detects NFTs with Arweave metadata ✅
- Research doc 33: Planned Arweave migration for NFT permanence ✅

**New files needed:**
```
src/lib/music/arweave.ts          # Irys SDK client + upload helpers
src/app/api/music/upload/route.ts  # Server-side audio upload to Arweave
```

**Flow:**
1. Artist uploads audio via ZAO OS form
2. Server-side API route uploads to Arweave via Irys
3. Returns `ar://` URI for audio + cover art + metadata
4. URI used as `tokenURI` in ERC-1155 mint (via thirdweb or custom contract)
5. Audio playable via `https://arweave.net/{txId}` — forever

## Important: Irys Migration Note

As of 2025-2026, Irys is migrating from pure Arweave bundling to the **Irys Datachain** — their own L1 for permanent data. The `@irys/sdk` package still works for Arweave uploads, but monitor for:
- Package name changes
- New pricing models
- Potential deprecation of Arweave-only mode

**Recommendation:** Use `@irys/sdk` now, but abstract the upload behind `src/lib/music/arweave.ts` so we can swap providers without changing calling code.

## Arweave vs Alternatives Summary

| Feature | Arweave (Irys) | IPFS (Pinata) | Filecoin | Zora IPFS |
|---------|---------------|---------------|----------|-----------|
| Permanent? | Yes (200+ yr) | No (pin required) | No (deals expire) | No (pin required) |
| Cost model | One-time | Monthly | Deal-based | Bundled with mint |
| Audio file (5MB) | $0.04 once | $0.02/month | Variable | Free with mint |
| Music-specific | No (general) | No (general) | No (general) | Yes (metadata) |
| Protocol lock-in | None | None | None | Zora protocol |
| ZAO already uses | Image gateway | Gateway fallback | No | No |
| JS SDK | @irys/sdk | @pinata/sdk | @web3-storage | @zoralabs/protocol-sdk |

## Sources

- [Arweave](https://arweave.org/) — Permanent storage network
- [Arweave Fee Calculator](https://ar-fees.arweave.net/) — Real-time pricing
- [Arweave Storage Calculator](https://arweave-calculator.com/) — Cost estimates
- [Irys SDK npm](https://www.npmjs.com/package/@irys/sdk) — Upload tool
- [Irys Docs](https://docs.irys.xyz/irys-sdk) — SDK documentation
- [Irys GitHub](https://github.com/Irys-xyz) — Source code
- [ArDrive](https://ardrive.io/) — Fiat upload option
- [ArDrive Turbo SDK](https://www.npmjs.com/package/@ardrive/turbo-sdk)
- [Arweave Pricing Analysis](https://www.oreateai.com/blog/arweave-storage-pricing-unpacking-the-cost-of-permanent-data/)
- [3fi: Web3 Music on Arweave](https://github.com/svskaushik/3fi-Arweave-Bundlr) — Reference implementation
