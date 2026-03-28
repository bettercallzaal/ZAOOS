# 155 — End-to-End Music NFT: Upload → Mint → Buy (Implementation Plan)

> **Status:** Research complete + implementation plan
> **Date:** March 27, 2026
> **Goal:** Complete step-by-step plan for a ZAO musician to upload MP3/MP4 + cover art, mint as purchasable atomic asset on Arweave/BazAR, and for collectors to buy easily

## The User Story

> "I'm a ZAO musician. I have an MP3 and a cover image. I want to put it up as an NFT that people can buy. I don't understand crypto."

**This doc solves that.** Every screen, every API call, every file.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Upload tool** | ArDrive Turbo SDK (`@ardrive/turbo-sdk`) — permanent Arweave storage, fiat payments via Stripe |
| **Asset type** | Arweave atomic asset — data + contract + license = ONE transaction |
| **Marketplace** | BazAR (UCM orderbook) + direct purchase within ZAO OS |
| **Wallet (artist)** | Existing EVM wallet (wagmi) for auth + ArConnect for Arweave ops. OR server-side upload with ZAO's app wallet. |
| **Wallet (buyer)** | Arweave Wallet Kit (`@arweave-wallet-kit/react`) — supports ArConnect + browser wallet |
| **Fiat option** | Turbo Credits via Stripe (credit card) for upload costs. $U token via Permaswap for purchases. |
| **License** | UDL presets — artist picks from "Community Share", "Collectible", "Premium", "Open" |
| **Othent (Google login)** | DO NOT USE — deprecated end of 2025 |

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ARTIST FLOW (3 screens)                   │
│                                                              │
│  Screen 1: UPLOAD                                            │
│  ┌──────────────────────────────────┐                        │
│  │ [🎵 Drop your MP3/MP4 here]      │                        │
│  │ [🖼️ Drop cover art here]          │                        │
│  │                                    │                        │
│  │ Title: ________________________   │                        │
│  │ Artist: (auto-filled from profile)│                        │
│  │ Genre: [dropdown]                 │                        │
│  │ Description: __________________   │                        │
│  │                                    │                        │
│  │ [Next →]                          │                        │
│  └──────────────────────────────────┘                        │
│                                                              │
│  Screen 2: PRICE & LICENSE                                   │
│  ┌──────────────────────────────────┐                        │
│  │ How should people use your music? │                        │
│  │                                    │                        │
│  │ ○ Community Share (free, credit)  │                        │
│  │ ● Collectible (free to listen,    │                        │
│  │   buy to own, 10% resale royalty) │ ← default              │
│  │ ○ Premium (pay to access)         │                        │
│  │ ○ Open (full creative commons)    │                        │
│  │                                    │                        │
│  │ Price to collect:                 │                        │
│  │ ○ Free                            │                        │
│  │ ● 1 $U (~$0.50)       ← default  │                        │
│  │ ○ 5 $U (~$2.50)                  │                        │
│  │ ○ Custom: ___                     │                        │
│  │                                    │                        │
│  │ Edition size:                     │                        │
│  │ ● Open (unlimited)    ← default  │                        │
│  │ ○ Limited: ___ copies             │                        │
│  │                                    │                        │
│  │ [Next →]                          │                        │
│  └──────────────────────────────────┘                        │
│                                                              │
│  Screen 3: CONFIRM & MINT                                    │
│  ┌──────────────────────────────────┐                        │
│  │ [cover art]  "Track Title"        │                        │
│  │              by Artist Name       │                        │
│  │              [▶ preview audio]    │                        │
│  │                                    │                        │
│  │ License: Collectible              │                        │
│  │ Price: 1 $U per collect           │                        │
│  │ Royalty: 10% on resales           │                        │
│  │ Edition: Open                     │                        │
│  │                                    │                        │
│  │ Storage cost: ~$0.05 (one-time)   │                        │
│  │ Stored on: Arweave (permanent)    │                        │
│  │                                    │                        │
│  │ [🎵 Mint & List]                  │                        │
│  │                                    │                        │
│  │ ⏳ Uploading to Arweave...        │                        │
│  │ ✅ Audio stored permanently        │                        │
│  │ ✅ Cover art stored permanently    │                        │
│  │ ✅ Minted as atomic asset          │                        │
│  │ ✅ Listed on BazAR                 │                        │
│  │                                    │                        │
│  │ [Share on Farcaster] [View on BazAR] │                    │
│  └──────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    COLLECTOR FLOW (1 click)                   │
│                                                              │
│  In ZAO OS music library or track page:                      │
│  ┌──────────────────────────────────┐                        │
│  │ [cover art]                       │                        │
│  │ "Track Title" — Artist Name       │                        │
│  │ [▶ Play] [♥ Like] [🔗 Share]     │                        │
│  │                                    │                        │
│  │ ┌────────────────────────────┐    │                        │
│  │ │ [Collect] 1 $U             │    │                        │
│  │ │ 23 collected • Permanent   │    │                        │
│  │ └────────────────────────────┘    │                        │
│  │                                    │                        │
│  │ → Click "Collect"                 │                        │
│  │ → ArConnect popup: "Confirm 1 $U" │                        │
│  │ → ✅ "You own this track!"        │                        │
│  │ → Shows in your profile NFTs      │                        │
│  └──────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## What Happens Under the Hood

### Artist Mints (Server-Side)

```
Artist clicks "Mint & List"
    │
    ▼
1. ZAO OS server receives FormData (audio + cover + metadata)
    │
    ▼
2. Upload cover art to Arweave via ArDrive Turbo
   → Returns coverTxId (ar://coverTxId)
    │
    ▼
3. Upload audio to Arweave via ArDrive Turbo
   with tags: Content-Type, App-Name, Title, Artist, UDL license
   → Returns audioTxId (ar://audioTxId)
   → THIS IS the atomic asset ID (audio IS the asset)
    │
    ▼
4. Register asset on AO (spawn process with token handlers)
   → Asset becomes tradeable on UCM
    │
    ▼
5. List on UCM orderbook at artist's price
   → Appears on BazAR automatically
    │
    ▼
6. Save to Supabase: song_submissions + arweave_assets table
   → Track appears in ZAO OS music library
   → "Collect" button shows price
    │
    ▼
7. Return success to artist with share links
```

### Collector Buys (Client-Side)

```
Collector clicks "Collect" button
    │
    ▼
1. ArConnect wallet popup (or Arweave Wallet Kit connect)
    │
    ▼
2. Send $U token to UCM orderbook (AO message)
    │
    ▼
3. UCM transfers atomic asset ownership to collector
    │
    ▼
4. Asset appears in collector's ArConnect / BazAR profile
    │
    ▼
5. ZAO OS updates local state (collected count, owner list)
```

## New Files to Create

```
src/
├── lib/music/
│   ├── arweave.ts             # ArDrive Turbo upload helper
│   ├── atomic.ts              # AO atomic asset creation + registration
│   └── ucm.ts                 # UCM orderbook listing + purchase
│
├── app/api/music/
│   ├── mint/
│   │   └── route.ts           # POST: Upload + mint atomic asset (server-side)
│   └── collect/
│       └── route.ts           # POST: Record collection in Supabase
│
├── components/music/
│   ├── MintTrack.tsx           # 3-screen mint wizard
│   ├── CollectButton.tsx       # "Collect" button for track cards
│   ├── MintSuccess.tsx         # Post-mint share screen
│   └── LicensePicker.tsx       # UDL license preset selector
│
├── providers/
│   └── ArweaveProvider.tsx     # Arweave Wallet Kit provider wrapper
│
└── types/
    └── arweave.ts              # Arweave-specific types
```

## New Dependencies

```json
{
  "@ardrive/turbo-sdk": "latest",
  "@arweave-wallet-kit/react": "latest",
  "@arweave-wallet-kit/core": "latest",
  "@arweave-wallet-kit/styles": "latest",
  "@arweave-wallet-kit/wander-strategy": "latest",
  "arweave": "^1.15.0",
  "ar-gql": "latest"
}
```

**NOT using:** `@irys/sdk` (deprecated), `@akord/akord-js` (sunsetting), Othent (deprecated end 2025)

## New Database Table

```sql
-- Arweave atomic assets minted by ZAO members
CREATE TABLE arweave_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL REFERENCES respect_members(fid),
  arweave_tx_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  content_type TEXT NOT NULL, -- audio/mpeg, video/mp4
  cover_tx_id TEXT, -- Arweave tx for cover art
  genre TEXT,
  description TEXT,
  license_preset TEXT DEFAULT 'collectible', -- community, collectible, premium, open
  price_u NUMERIC, -- Price in $U tokens (null = free)
  edition_size INTEGER, -- null = open edition
  collected_count INTEGER DEFAULT 0,
  ucm_order_id TEXT, -- UCM listing ID
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Link to existing songs table
  song_id UUID REFERENCES songs(id)
);

-- Track who collected what
CREATE TABLE arweave_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES arweave_assets(id),
  collector_address TEXT NOT NULL, -- Arweave address
  collector_fid INTEGER, -- If ZAO member
  price_paid NUMERIC,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation: Key Code

### 1. ArDrive Turbo Upload (Server-Side)

```typescript
// src/lib/music/arweave.ts
import { TurboFactory } from '@ardrive/turbo-sdk';
import { Readable } from 'stream';

const turbo = TurboFactory.authenticated({
  privateKey: JSON.parse(process.env.ARWEAVE_WALLET_KEY!),
});

export async function uploadToArweave(
  buffer: Buffer,
  contentType: string,
  tags: { name: string; value: string }[]
) {
  const receipt = await turbo.uploadFile({
    fileStreamFactory: () => Readable.from(buffer),
    fileSizeFactory: () => buffer.length,
    dataItemOpts: {
      tags: [
        { name: 'Content-Type', value: contentType },
        ...tags,
      ],
    },
  });

  return {
    txId: receipt.id,
    url: `https://arweave.net/${receipt.id}`,
    arUri: `ar://${receipt.id}`,
  };
}
```

### 2. Mint API Route

```typescript
// src/app/api/music/mint/route.ts
import { getSession } from '@/lib/auth/session';
import { uploadToArweave } from '@/lib/music/arweave';
import { supabaseAdmin } from '@/lib/db/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const MintSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  genre: z.string().optional(),
  description: z.string().optional(),
  licensePreset: z.enum(['community', 'collectible', 'premium', 'open']),
  priceU: z.number().nullable(),
  editionSize: z.number().nullable(),
});

const LICENSE_PRESETS = {
  community: {
    'Commercial-Use': 'Allowed-With-Credit',
    'Derivation': 'Allowed-With-Credit',
  },
  collectible: {
    'Commercial-Use': 'Allowed-With-Credit',
    'Derivation': 'Allowed-With-RevenueShare-25%',
  },
  premium: {
    'Commercial-Use': 'Disallowed',
    'Derivation': 'Disallowed',
    'Access-Fee': 'One-Time-0.001',
  },
  open: {
    'Commercial-Use': 'Allowed',
    'Derivation': 'Allowed',
  },
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const audioFile = formData.get('audio') as File;
  const coverFile = formData.get('cover') as File | null;
  const metadataJson = formData.get('metadata') as string;

  if (!audioFile) {
    return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
  }

  const parsed = MintSchema.safeParse(JSON.parse(metadataJson));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, artist, genre, description, licensePreset, priceU, editionSize } = parsed.data;
  const udlTags = LICENSE_PRESETS[licensePreset];

  try {
    // 1. Upload cover art (if provided)
    let coverTxId: string | null = null;
    if (coverFile) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await uploadToArweave(coverBuffer, coverFile.type, [
        { name: 'App-Name', value: 'ZAO-OS' },
        { name: 'Type', value: 'cover-art' },
        { name: 'Title', value: title },
      ]);
      coverTxId = coverResult.txId;
    }

    // 2. Upload audio as atomic asset with UDL
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioResult = await uploadToArweave(audioBuffer, audioFile.type, [
      { name: 'App-Name', value: 'ZAO-OS' },
      { name: 'Type', value: 'music-track' },
      { name: 'Title', value: title },
      { name: 'Artist', value: artist },
      { name: 'Artist-FID', value: String(session.fid) },
      { name: 'Genre', value: genre || '' },
      { name: 'Description', value: description || '' },
      ...(coverTxId ? [{ name: 'Thumbnail', value: coverTxId }] : []),
      // UDL License
      { name: 'License', value: 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8' },
      ...Object.entries(udlTags).map(([k, v]) => ({ name: k, value: v })),
    ]);

    // 3. Save to Supabase
    const { data: asset, error: dbError } = await supabaseAdmin
      .from('arweave_assets')
      .insert({
        fid: session.fid,
        arweave_tx_id: audioResult.txId,
        title,
        artist,
        content_type: audioFile.type,
        cover_tx_id: coverTxId,
        genre,
        description,
        license_preset: licensePreset,
        price_u: priceU,
        edition_size: editionSize,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 4. Also add to songs library for playback
    await supabaseAdmin.from('songs').insert({
      url: audioResult.url,
      title,
      artist,
      artwork_url: coverTxId ? `https://arweave.net/${coverTxId}` : null,
      platform: 'arweave',
      submitted_by_fid: session.fid,
      play_count: 0,
      source: 'mint',
    });

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        txId: audioResult.txId,
        url: audioResult.url,
        coverUrl: coverTxId ? `https://arweave.net/${coverTxId}` : null,
        bazarUrl: `https://bazar.arweave.net/#/asset/${audioResult.txId}`,
      },
    });
  } catch (err) {
    console.error('[Mint] Error:', err);
    return NextResponse.json({ error: 'Mint failed' }, { status: 500 });
  }
}
```

### 3. Arweave Wallet Provider

```typescript
// src/providers/ArweaveProvider.tsx
'use client';

import { ArweaveWalletKit } from '@arweave-wallet-kit/react';
import { ArConnectStrategy } from '@arweave-wallet-kit/wander-strategy';
import '@arweave-wallet-kit/styles/styles.css';

export function ArweaveProvider({ children }: { children: React.ReactNode }) {
  return (
    <ArweaveWalletKit
      config={{
        permissions: ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'ACCESS_PUBLIC_KEY'],
        appInfo: {
          name: 'ZAO OS',
          logo: 'https://zaoos.xyz/logo.png',
        },
        strategies: [new ArConnectStrategy()],
      }}
    >
      {children}
    </ArweaveWalletKit>
  );
}
```

### 4. Collect Button Component

```typescript
// src/components/music/CollectButton.tsx
'use client';

import { useConnection } from '@arweave-wallet-kit/react';
import { useState } from 'react';

interface CollectButtonProps {
  assetTxId: string;
  priceU: number | null;
  collectedCount: number;
}

export function CollectButton({ assetTxId, priceU, collectedCount }: CollectButtonProps) {
  const { connected, connect } = useConnection();
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);

  async function handleCollect() {
    if (!connected) {
      await connect();
      return;
    }

    setCollecting(true);
    try {
      // Send purchase message to UCM via AO
      // This transfers $U tokens and assigns ownership
      const res = await fetch('/api/music/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetTxId }),
      });

      if (res.ok) {
        setCollected(true);
      }
    } finally {
      setCollecting(false);
    }
  }

  if (collected) {
    return (
      <button className="bg-green-600 text-white rounded-full px-4 py-2 text-sm" disabled>
        ✓ Collected
      </button>
    );
  }

  return (
    <button
      onClick={handleCollect}
      disabled={collecting}
      className="bg-[#f5a623] hover:bg-[#e09515] text-[#0a1628] font-semibold rounded-full px-4 py-2 text-sm transition-colors"
    >
      {collecting ? '...' : `Collect${priceU ? ` ${priceU} $U` : ''}`}
      <span className="ml-2 text-xs opacity-70">{collectedCount} collected</span>
    </button>
  );
}
```

## How Buying Actually Works (The $U Token Flow)

### For Crypto Users
1. User has $AR tokens (from exchange or ArConnect purchase)
2. Swap $AR → $U at [getu.g8way.io](https://getu.g8way.io) or Permaswap
3. Click "Collect" in ZAO OS → ArConnect confirms $U transfer
4. UCM orderbook settles trade → ownership transfers

### For Non-Crypto Users (Fiat Path)
1. Buy Turbo Credits with credit card at [ardrive.io](https://ardrive.io)
2. Turbo Credits can fund uploads but NOT purchases (limitation)
3. **Current friction point:** Buying atomic assets still requires $U tokens
4. **Future:** BazAR may add fiat checkout (not available yet)

### Workaround for Fiat Purchases
ZAO can act as a proxy buyer:
1. Collector pays ZAO treasury via Stripe (fiat)
2. ZAO server uses treasury $U to purchase on behalf of collector
3. Transfer ownership to collector's Arweave address
4. This requires trust in ZAO (semi-custodial for the purchase step)

## Where the "Collect" Button Goes

In `MusicEmbed.tsx` (existing component, ~290 lines), add alongside existing actions:

```tsx
{/* Existing buttons */}
<button>▶ Play</button>
<button>♥ Like</button>
<button>🔗 Share</button>

{/* NEW: Collect button (only if track has arweave_tx_id) */}
{track.arweave_tx_id && (
  <CollectButton
    assetTxId={track.arweave_tx_id}
    priceU={track.price_u}
    collectedCount={track.collected_count}
  />
)}
```

## Implementation Phases

### Phase 1: Upload & Store (Week 1) — 12 hours
| Task | File | Hours |
|------|------|-------|
| Install `@ardrive/turbo-sdk`, `arweave` | package.json | 0.5 |
| Create `src/lib/music/arweave.ts` — upload helper | New | 2 |
| Create `POST /api/music/mint/route.ts` — server-side mint | New | 4 |
| Create `arweave_assets` + `arweave_collections` tables | SQL migration | 1 |
| Add `ARWEAVE_WALLET_KEY` to env vars | .env | 0.5 |
| Test: upload MP3, verify on arweave.net | Manual | 2 |
| Add license presets to `community.config.ts` | Edit | 1 |
| Update songs table to support `platform: 'arweave'` | Edit library.ts | 1 |

### Phase 2: Mint UI (Week 2) — 14 hours
| Task | File | Hours |
|------|------|-------|
| Install Arweave Wallet Kit packages | package.json | 0.5 |
| Create `ArweaveProvider.tsx` wrapper | New | 1 |
| Create `LicensePicker.tsx` — UDL preset UI | New | 2 |
| Create `MintTrack.tsx` — 3-screen wizard | New | 6 |
| Create `MintSuccess.tsx` — share screen | New | 2 |
| Add "Mint" entry point in music sidebar/nav | Edit | 1 |
| Mobile-first responsive design | Styling | 1.5 |

### Phase 3: Collect Flow (Week 3) — 10 hours
| Task | File | Hours |
|------|------|-------|
| Create `CollectButton.tsx` | New | 3 |
| Create `POST /api/music/collect/route.ts` | New | 3 |
| Add CollectButton to `MusicEmbed.tsx` | Edit | 1 |
| Show collected count on track cards | Edit | 1 |
| Show "owned" badge for collectors | Edit | 1 |
| Test full flow: mint → collect → verify | Manual | 1 |

### Phase 4: BazAR Integration (Week 4) — 8 hours
| Task | File | Hours |
|------|------|-------|
| Link to BazAR for each minted track | Edit | 1 |
| Build Arweave GraphQL music index | New | 3 |
| "Permaweb Library" view in sidebar | New | 3 |
| Share to Farcaster with BazAR link | Edit | 1 |

### Phase 5: Revenue & Analytics (Week 5) — 8 hours
| Task | File | Hours |
|------|------|-------|
| Artist earnings dashboard (collections, revenue) | New | 4 |
| ZOUNZ treasury earnings from music | Edit | 2 |
| Collection analytics (who collected what) | New | 2 |

**Total: ~52 hours over 5 weeks**

## Cost Summary

| Item | Cost | Who Pays |
|------|------|----------|
| Upload MP3 (5MB) | ~$0.04 | ZAO treasury (first release free) or artist |
| Upload cover art (500KB) | ~$0.004 | Included with above |
| Upload metadata | ~$0.00002 | Included with above |
| **Total per release** | **~$0.05** | One-time, permanent |
| Arweave wallet key | One-time generation | Free |
| ArConnect (buyer) | Free browser extension | Free |
| BazAR listing | Free | Free |

## What Already Exists (Reuse)

| Existing Code | How It Helps |
|--------------|-------------|
| `SongSubmit.tsx` | Genre tags, validation patterns, submission flow UX |
| `MusicEmbed.tsx` | Track display — add "Collect" button here |
| `useAuth` hook | Session data with `walletAddress` and `fid` |
| `wagmi` config | Wallet connection (EVM side) |
| `supabaseAdmin` | Server-side DB operations |
| `songs` table | Add `platform: 'arweave'` tracks alongside existing |
| `next.config.ts` | `arweave.net` already allowed for images |
| Zod validation | Use for mint form validation |

## Cross-References

| Doc | What It Provides |
|-----|-----------------|
| [152 — Arweave Ecosystem](../152-arweave-ecosystem-deep-dive/) | ArDrive Turbo setup, Wayfinder CDN, GraphQL queries |
| [153 — BazAR & Atomic Assets](../153-bazar-arweave-atomic-assets-music/) | UCM, UDL license specs, BazAR marketplace details |
| [150 — Arweave Storage](../150-arweave-permanent-music-storage/) | Cost analysis, upload options |
| [151 — Distribution Without Zora](../151-zounz-distribution-without-zora/) | thirdweb ERC-1155 as secondary (optional) |
| [145 — Simple NFT Platform](../145-simple-nft-platform-design/) | UX design for non-crypto artists |
| [128 — Music Player Audit](../190-music-player-complete-audit/) | Existing player infrastructure |

## Sources

- [ArDrive Turbo SDK](https://github.com/ardriveapp/turbo-sdk) — MIT, upload to Arweave
- [ArDrive Turbo Docs](https://docs.ardrive.io/docs/turbo/turbo-sdk/)
- [Arweave Wallet Kit](https://docs.arweavekit.com/arweave-wallet-kit/setup) — React hooks
- [@arweave-wallet-kit/react npm](https://www.npmjs.com/package/@arweave-wallet-kit/react)
- [ArConnect](https://www.arconnect.io/) — Browser wallet
- [BazAR Marketplace](https://bazar.arweave.net/) — Atomic asset exchange
- [BazAR Studio / Helix](https://studio_bazar.arweave.net/) — No-code minting
- [UDL License](https://udlicense.arweave.net/) — Universal Data License
- [UCM Protocol](https://github.com/permaweb/ao-ucm) — On-chain orderbook
- [Atomic Asset Spec](https://atomic-assets.arweave.net/)
- [Arweave GraphQL Guide](https://gql-guide.arweave.net/)
- [Deploy Atomic Assets with ArDrive CLI](https://cookbook.arweave.dev/guides/smartweave/atomic-assets/ardrive-cli.html)
- [Othent (DEPRECATED end 2025)](https://docs.othent.io/) — DO NOT USE
