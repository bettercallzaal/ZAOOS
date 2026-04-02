# Sprint 3: Arweave Music Upload (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable ZAO artists to upload MP3 + cover art to Arweave via ArDrive Turbo for permanent storage, with UDL licensing and Supabase tracking

**Architecture:** Server-side upload via ArDrive Turbo SDK (artist doesn't need an Arweave wallet). Audio + cover art → Arweave permanent storage. Metadata tracked in Supabase `arweave_assets` table. Cost ~$0.05/track, paid by app wallet.

**Tech Stack:** @ardrive/turbo-sdk, arweave, Supabase, Next.js FormData API

---

## Task 1: Install Arweave Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @ardrive/turbo-sdk arweave
```

Note: We're NOT installing Arweave Wallet Kit yet — that's Phase 2 (Mint UI) and Phase 3 (Collect). Phase 1 is server-side only.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add ArDrive Turbo SDK + arweave dependencies"
```

---

## Task 2: Arweave Upload Helper Library

**Files:**
- Create: `src/lib/music/arweave.ts`

- [ ] **Step 1: Create the upload helper**

This module provides server-side upload to Arweave via ArDrive Turbo. The Turbo SDK handles payment (Turbo Credits or AR tokens from the app wallet).

```typescript
// src/lib/music/arweave.ts
import { TurboFactory } from '@ardrive/turbo-sdk';
import { Readable } from 'stream';

const UDL_LICENSE_TX = 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8';

export const LICENSE_PRESETS = {
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
} as const;

export type LicensePreset = keyof typeof LICENSE_PRESETS;

function getTurboClient() {
  const keyStr = process.env.ARWEAVE_WALLET_KEY;
  if (!keyStr) throw new Error('ARWEAVE_WALLET_KEY not configured');

  let jwk: object;
  try {
    jwk = JSON.parse(keyStr);
  } catch {
    // Try base64 decode
    jwk = JSON.parse(Buffer.from(keyStr, 'base64').toString('utf-8'));
  }

  return TurboFactory.authenticated({ privateKey: jwk });
}

export interface UploadResult {
  txId: string;
  url: string;
  arUri: string;
}

export async function uploadToArweave(
  buffer: Buffer,
  contentType: string,
  tags: { name: string; value: string }[]
): Promise<UploadResult> {
  const turbo = getTurboClient();

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

export function buildMusicTags(opts: {
  title: string;
  artist: string;
  genre?: string;
  description?: string;
  coverTxId?: string;
  licensePreset: LicensePreset;
}): { name: string; value: string }[] {
  const licenseTags = LICENSE_PRESETS[opts.licensePreset];

  const tags: { name: string; value: string }[] = [
    { name: 'App-Name', value: 'ZAO-OS' },
    { name: 'App-Version', value: '1.0.0' },
    { name: 'Type', value: 'music-track' },
    { name: 'Title', value: opts.title },
    { name: 'Artist', value: opts.artist },
    { name: 'License', value: UDL_LICENSE_TX },
  ];

  if (opts.genre) tags.push({ name: 'Genre', value: opts.genre });
  if (opts.description) tags.push({ name: 'Description', value: opts.description });
  if (opts.coverTxId) tags.push({ name: 'Thumbnail', value: opts.coverTxId });

  // Add UDL license terms
  for (const [key, value] of Object.entries(licenseTags)) {
    tags.push({ name: key, value });
  }

  return tags;
}

export function isArweaveConfigured(): boolean {
  return !!process.env.ARWEAVE_WALLET_KEY;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep error | head -10`

Note: The ArDrive Turbo SDK types may not be perfect. If there are type issues with `TurboFactory`, check the actual SDK exports and adjust. The SDK may export differently — check `node_modules/@ardrive/turbo-sdk` for the actual API.

- [ ] **Step 3: Commit**

```bash
git add src/lib/music/arweave.ts
git commit -m "feat: add Arweave upload helper with ArDrive Turbo + UDL licensing"
```

---

## Task 3: Mint API Route

**Files:**
- Create: `src/app/api/music/mint/route.ts`

- [ ] **Step 1: Create the mint route**

This is the main API endpoint. It receives FormData (audio file + optional cover art + metadata JSON), uploads both to Arweave, and stores the result in Supabase.

```typescript
// src/app/api/music/mint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { uploadToArweave, buildMusicTags, isArweaveConfigured } from '@/lib/music/arweave';
import type { LicensePreset } from '@/lib/music/arweave';

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB

const MetadataSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  genre: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  licensePreset: z.enum(['community', 'collectible', 'premium', 'open']).default('collectible'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isArweaveConfigured()) {
      return NextResponse.json({ error: 'Arweave not configured' }, { status: 503 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const coverFile = formData.get('cover') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    // Validate audio file
    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }
    if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
      return NextResponse.json({ error: `Invalid audio type: ${audioFile.type}. Allowed: MP3, MP4, WAV, FLAC, OGG, AAC` }, { status: 400 });
    }
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: 'Audio file too large (max 50MB)' }, { status: 400 });
    }

    // Validate cover art
    if (coverFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
        return NextResponse.json({ error: `Invalid image type: ${coverFile.type}` }, { status: 400 });
      }
      if (coverFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Cover image too large (max 5MB)' }, { status: 400 });
      }
    }

    // Validate metadata
    if (!metadataStr) {
      return NextResponse.json({ error: 'Metadata required' }, { status: 400 });
    }

    let metadataJson: unknown;
    try {
      metadataJson = JSON.parse(metadataStr);
    } catch {
      return NextResponse.json({ error: 'Invalid metadata JSON' }, { status: 400 });
    }

    const parsed = MetadataSchema.safeParse(metadataJson);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid metadata', details: parsed.error.flatten() }, { status: 400 });
    }

    const metadata = parsed.data;

    // 1. Upload cover art first (if provided) to get txId for thumbnail tag
    let coverTxId: string | undefined;
    let coverUrl: string | undefined;
    if (coverFile) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await uploadToArweave(coverBuffer, coverFile.type, [
        { name: 'App-Name', value: 'ZAO-OS' },
        { name: 'Type', value: 'music-cover' },
        { name: 'Title', value: `${metadata.title} — Cover` },
      ]);
      coverTxId = coverResult.txId;
      coverUrl = coverResult.url;
    }

    // 2. Upload audio with full metadata tags + license
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const tags = buildMusicTags({
      title: metadata.title,
      artist: metadata.artist,
      genre: metadata.genre,
      description: metadata.description,
      coverTxId,
      licensePreset: metadata.licensePreset as LicensePreset,
    });

    const audioResult = await uploadToArweave(audioBuffer, audioFile.type, tags);

    // 3. Store in Supabase
    const { data: asset, error: dbError } = await supabaseAdmin
      .from('arweave_assets')
      .insert({
        fid: session.fid,
        arweave_tx_id: audioResult.txId,
        title: metadata.title,
        artist: metadata.artist,
        content_type: audioFile.type,
        cover_tx_id: coverTxId || null,
        genre: metadata.genre || null,
        description: metadata.description || null,
        license_preset: metadata.licensePreset,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[music/mint] DB error:', dbError);
      // Upload succeeded but DB failed — log but don't fail
      // The Arweave data is permanent regardless
    }

    return NextResponse.json({
      success: true,
      asset: {
        id: asset?.id || null,
        txId: audioResult.txId,
        url: audioResult.url,
        arUri: audioResult.arUri,
        coverUrl: coverUrl || null,
        bazarUrl: `https://bazar.arweave.net/#/asset/${audioResult.txId}`,
      },
    });
  } catch (error) {
    console.error('[music/mint] Error:', error);
    const message = error instanceof Error ? error.message : 'Mint failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep error | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/music/mint/route.ts
git commit -m "feat: add music mint API — upload audio + cover to Arweave"
```

---

## Task 4: Database Migration SQL

**Files:**
- Create: `scripts/migrations/arweave-assets.sql`

- [ ] **Step 1: Create the migration script**

```sql
-- scripts/migrations/arweave-assets.sql
-- Arweave atomic assets minted by ZAO members

CREATE TABLE IF NOT EXISTS arweave_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  arweave_tx_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  content_type TEXT NOT NULL,
  cover_tx_id TEXT,
  genre TEXT,
  description TEXT,
  license_preset TEXT DEFAULT 'collectible',
  price_u NUMERIC,
  edition_size INTEGER,
  collected_count INTEGER DEFAULT 0,
  ucm_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  song_id UUID
);

CREATE TABLE IF NOT EXISTS arweave_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES arweave_assets(id),
  collector_address TEXT NOT NULL,
  collector_fid INTEGER,
  price_paid NUMERIC,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_arweave_assets_fid ON arweave_assets(fid);
CREATE INDEX IF NOT EXISTS idx_arweave_assets_created ON arweave_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arweave_collections_asset ON arweave_collections(asset_id);
CREATE INDEX IF NOT EXISTS idx_arweave_collections_fid ON arweave_collections(collector_fid);

-- RLS
ALTER TABLE arweave_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE arweave_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on arweave_assets"
  ON arweave_assets FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on arweave_collections"
  ON arweave_collections FOR ALL USING (auth.role() = 'service_role');

-- Also create system_state table if it doesn't exist (used by ZOUNZ cron)
CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only on system_state"
  ON system_state FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Commit**

```bash
git add scripts/migrations/arweave-assets.sql
git commit -m "feat: add arweave_assets + arweave_collections migration SQL"
```

---

## Task 5: Add License Presets to community.config.ts

**Files:**
- Modify: `community.config.ts`

- [ ] **Step 1: Read community.config.ts**

Find the existing config structure and add an `arweave` section.

- [ ] **Step 2: Add arweave config**

Add to the config object:

```typescript
arweave: {
  gateway: 'https://arweave.net',
  bazarUrl: 'https://bazar.arweave.net',
  appName: 'ZAO-OS',
  appVersion: '1.0.0',
  defaultLicense: 'collectible' as const,
  udlContractTx: 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8',
  maxAudioSize: 50 * 1024 * 1024, // 50MB
  maxCoverSize: 5 * 1024 * 1024,  // 5MB
  allowedAudioTypes: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac'],
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
},
```

- [ ] **Step 3: Commit**

```bash
git add community.config.ts
git commit -m "feat: add Arweave config to community.config.ts"
```

---

## Task 6: Add ARWEAVE_WALLET_KEY to .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add Arweave env vars**

Add to .env.example:

```bash
# Arweave / ArDrive Turbo (enables permanent music storage)
# Generate wallet at https://arweave.app, download keyfile
# Paste minified JSON or base64-encoded keyfile content
ARWEAVE_WALLET_KEY=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add ARWEAVE_WALLET_KEY to .env.example"
```

---

## Summary

| Task | Feature | Files | Est. |
|------|---------|-------|------|
| 1 | Install deps | package.json | 2 min |
| 2 | Upload helper | src/lib/music/arweave.ts | 10 min |
| 3 | Mint API route | src/app/api/music/mint/route.ts | 15 min |
| 4 | DB migration | scripts/migrations/arweave-assets.sql | 5 min |
| 5 | Community config | community.config.ts | 5 min |
| 6 | Env vars | .env.example | 2 min |

**Total: 6 tasks, ~40 minutes**

Phase 1 gives you the backend foundation. Phase 2 (Mint UI wizard) and Phase 3 (Collect button) build on top of this in future sessions.
