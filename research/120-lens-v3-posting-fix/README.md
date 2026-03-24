# 120 — Lens V3 Posting Fix: Grove Storage + Correct URI Format

> **Status:** Research complete
> **Date:** March 23, 2026
> **Goal:** Fix Lens posting — posts get a "success" hash but don't appear on Hey.xyz

## Root Cause

Our code uses a `data:application/json;base64,...` URI as the `contentUri` in the post mutation. The Lens V3 API accepts this and returns a transaction hash, but **the content is never stored anywhere accessible**. Hey.xyz can't find the post metadata because it's not on Grove (Lens's decentralized storage).

## Fix: Upload to Grove First, Then Post

### Step 1: Install `@lens-chain/storage-client`

```bash
npm install @lens-chain/storage-client@latest --legacy-peer-deps
```

**Note:** The package name is `@lens-chain/storage-client` (NOT `@lens-protocol/storage-node-client` — that's the old one).

### Step 2: Upload metadata to Grove

```typescript
import { StorageClient } from "@lens-chain/storage-client";

const storageClient = StorageClient.create();

const metadata = {
  $schema: 'https://json-schemas.lens.dev/publications/text/3.0.0.json',
  lens: {
    id: crypto.randomUUID(),
    locale: 'en',
    mainContentFocus: 'TEXT_ONLY',
    content: 'Your post text here',
    appId: 'zao-os',
  },
};

const { uri } = await storageClient.uploadAsJson(metadata);
// uri = "lens://6fb1561685fe6fed59f9057019b48c72c0cec1ea..."
```

**Verified working:** Tested locally, returns `lens://` URI immediately.

### Step 3: Use the `lens://` URI in the post mutation

```graphql
mutation {
  post(request: { contentUri: "lens://6fb1561685fe..." }) {
    ... on PostResponse { hash }
    ... on SponsoredTransactionRequest { reason }
    ... on SelfFundedTransactionRequest { reason }
    ... on TransactionWillFail { reason }
  }
}
```

### Step 4: Post URL on Hey.xyz

Hey.xyz V3 post URLs use the format: `https://hey.xyz/posts/{postSlug}`

The `hash` returned by the mutation is a **transaction hash** on Lens Chain, not a post slug. To get the post URL, we need to either:
1. Query the post by transaction hash after it's indexed
2. Use the user's profile URL: `https://hey.xyz/u/{handle}` (posts appear on their timeline)

For now, link to the user's profile after cross-posting.

## What Changes in `src/lib/publish/lens.ts`

| Before (broken) | After (fixed) |
|-----------------|---------------|
| `data:application/json;base64,...` as contentUri | Upload to Grove → use `lens://` URI |
| Content not stored anywhere | Content on Grove (decentralized, permanent) |
| `https://hey.xyz/posts/{txHash}` URL | `https://hey.xyz/u/{handle}` or query for post slug |

## Code Change

```typescript
// OLD (broken):
const contentURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

// NEW (working):
const { StorageClient } = await import('@lens-chain/storage-client');
const storageClient = StorageClient.create();
const { uri: contentURI } = await storageClient.uploadAsJson(metadata);
// contentURI = "lens://6fb156..."
```

## Dependencies

- `@lens-chain/storage-client` — Grove storage SDK (new, replaces @lens-protocol/storage-node-client)
- Already installed and tested locally

## Sources

- [Lens Create a Post](https://lens.xyz/docs/protocol/feeds/post) — official posting docs
- [Grove Getting Started](https://lens.xyz/docs/storage/usage/getting-started) — storage setup
- [@lens-chain/storage-client npm](https://www.npmjs.com/package/@lens-chain/storage-client) — package
- [Doc 117 — Lens V3 Cross-Posting](../117-lens-v3-cross-posting/) — previous research
- Local test: `StorageClient.create()` + `uploadAsJson()` returns `lens://` URI successfully
