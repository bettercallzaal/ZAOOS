# 117 — Lens V3 Integration (Consolidated)

> **Status:** Research complete — BLOCKED (no server-side posting)
> **Date:** March 2026 (consolidated April 5, 2026)
> **Goal:** Evaluate Lens V3 for cross-posting from ZAO OS

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Overall verdict** | **DEFER Lens cross-posting** — ship Bluesky, X, Hive first. Come back when multi-wallet management exists (Sprint 5+). |
| **Blocker** | Lens V3 requires an ETH wallet signature to auth. ZAO OS users log in via Farcaster (different wallet). No server-only posting path exists. |
| **Signless mode** | Exists but requires ONE initial signature from the Lens-owning ETH wallet — unavoidable. |
| **API Endpoint** | `https://api.lens.xyz/graphql` — NOT `api-v2.lens.dev` (V2 is dead) |
| **SDK** | `@lens-protocol/client@canary` — V3 SDK, NOT the old v2 package |
| **Auth** | SDK-based `client.login()` with `signMessageWith(walletClient)` from viem |
| **Posting** | `post(sessionClient, { contentUri })` — upload metadata to Grove first |
| **Storage** | Grove via `@lens-chain/storage-client` (NOT old `@lens-protocol/storage-node-client`) |
| **Content URI** | Must be `lens://` URI from Grove — `data:` base64 URIs silently fail |
| **Our V2 code** | Completely broken — calls dead `api-v2.lens.dev` with extinct Momoka mutations |

### When to revisit Lens

1. We add proper multi-wallet management (Sprint 5+)
2. Or Lens adds app-level posting (unlikely)
3. Or we build a dedicated "Connect ETH Wallet for Lens" flow

### Cross-posting platform status

| Platform | Status |
|----------|--------|
| Bluesky | Working (already cross-posting) |
| X/Twitter | Ready (admin-only, env vars) |
| Hive | Ready (posting key stored) |
| Lens | DEFERRED — needs dedicated wallet connection flow |

---

## Lens V3 API & Posting

*From Doc 117 — March 23, 2026*

### What Was Wrong in Our Code

| File | Problem |
|------|---------|
| `src/lib/publish/lens.ts` | Uses `api-v2.lens.dev` endpoint (dead). Uses V2 mutations (`postOnMomoka`, `createOnchainPostTypedData`). Momoka doesn't exist in V3. |
| `src/app/api/platforms/lens/route.ts` | Uses V2 `profiles` query against V2 endpoint. GraphQL schema is completely different in V3. |
| `src/components/settings/ConnectedPlatforms.tsx` | Auth flow tries to call dead V2 API |

### V3 Client Setup

```typescript
import { PublicClient, mainnet } from "@lens-protocol/client";

const client = PublicClient.create({
  environment: mainnet,
  origin: "https://zaoos.com",
});
```

### V3 Authentication Flow

V3 uses the SDK's built-in `client.login()` — NOT raw GraphQL mutations.

```typescript
import { signMessageWith } from "@lens-protocol/client/viem";
import { evmAddress } from "@lens-protocol/client";
import { fetchAccountsAvailable } from "@lens-protocol/client/actions";

// Step 1: Check if wallet has Lens accounts
const accounts = await fetchAccountsAvailable(client, {
  managedBy: evmAddress(walletAddress),
  includeOwned: true,
});

// Step 2: Login with existing account
const authenticated = await client.login({
  accountOwner: {
    account: evmAddress(accounts.items[0].account.address),
    app: evmAddress("0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE"),
    owner: evmAddress(walletAddress),
  },
  signMessage: signMessageWith(walletClient),
});
const sessionClient = authenticated.value;
```

Key differences from V2:
- No raw `challenge` + `authenticate` mutations — SDK handles it
- Must specify `app` address (register at Lens Developer Dashboard)
- `signMessageWith(walletClient)` from `@lens-protocol/client/viem` bridges wagmi
- Returns `sessionClient` directly (not tokens you store manually)

### V3 Posting

```typescript
import { textOnly } from "@lens-protocol/metadata";
import { StorageClient } from "@lens-chain/storage-client";
import { uri } from "@lens-protocol/client";
import { post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";

// Step 1: Create metadata
const metadata = textOnly({
  content: "Posted via ZAO OS — music community on Farcaster",
});

// Step 2: Upload to Grove (Lens storage)
const storageClient = StorageClient.create();
const { uri: contentUri } = await storageClient.uploadAsJson(metadata);

// Step 3: Create post
const result = await post(sessionClient, {
  contentUri: uri(contentUri),
}).andThen(handleOperationWith(walletClient));
```

### Signless Mode

```typescript
import { enableSignless } from "@lens-protocol/client/actions";

// After login, enable signless for gasless, no-popup posting
await enableSignless(sessionClient)
  .andThen(handleOperationWith(walletClient));
```

Once signless is enabled, the server can post on behalf of the user without wallet popups.

### V3 API Endpoints

| Environment | Endpoint |
|-------------|----------|
| **Mainnet** | `https://api.lens.xyz/graphql` |
| **Testnet** | `https://api.testnet.lens.xyz/graphql` |
| **V2 (DEAD)** | ~~`https://api-v2.lens.dev`~~ |

### ZAO App Registration

- **Mainnet test app**: `0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE`
- **Testnet test app**: `0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7`
- For production, register a ZAO-specific app at the [Lens Developer Dashboard](https://developer.lens.xyz).

### Dependencies

```bash
npm install @lens-protocol/client@canary @lens-protocol/metadata @lens-chain/storage-client
```

---

## Grove Storage & Posting Fix

*From Doc 120 — March 23, 2026*

### Root Cause

Our code used a `data:application/json;base64,...` URI as the `contentUri` in the post mutation. The Lens V3 API accepts this and returns a transaction hash, but **the content is never stored anywhere accessible**. Hey.xyz can't find the post metadata because it's not on Grove (Lens's decentralized storage).

### Fix: Upload to Grove First, Then Post

```typescript
// OLD (broken):
const contentURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

// NEW (working):
const { StorageClient } = await import('@lens-chain/storage-client');
const storageClient = StorageClient.create();
const { uri: contentURI } = await storageClient.uploadAsJson(metadata);
// contentURI = "lens://6fb156..."
```

### What Changed

| Before (broken) | After (fixed) |
|-----------------|---------------|
| `data:application/json;base64,...` as contentUri | Upload to Grove, use `lens://` URI |
| Content not stored anywhere | Content on Grove (decentralized, permanent) |
| `https://hey.xyz/posts/{txHash}` URL | `https://hey.xyz/u/{handle}` or query for post slug |

### Storage Package

The correct package is `@lens-chain/storage-client` (NOT `@lens-protocol/storage-node-client` — that's the old one).

### Post URLs on Hey.xyz

Hey.xyz V3 post URLs use the format: `https://hey.xyz/posts/{postSlug}`. The `hash` returned by the mutation is a transaction hash on Lens Chain, not a post slug. For now, link to the user's profile: `https://hey.xyz/u/{handle}`.

---

## Auth Verdict & Blockers

*From Doc 121 — March 24, 2026*

### No Server-Only Posting Path Exists

Lens V3 requires a wallet signature to authenticate. Period. There is no server API key, no app-level posting, no way to bypass wallet signing entirely.

"Signless mode" exists — the user signs ONCE to delegate the Lens API as an executor, then all future posts happen without wallet popups. But that initial signature MUST come from the wallet that owns the Lens account.

### The ZAO OS Blocker

| What we need | What Lens requires |
|-------------|-------------------|
| Post from server-side after user connects in Settings | User must sign with the **specific ETH wallet** that owns their Lens profile |
| User logged in via Farcaster (SIWF) — different wallet | Lens SDK uses wagmi `useWalletClient()` which returns whatever wallet is active |
| User has Phantom (Solana) connected via RainbowKit | Lens needs an ETH wallet (Rabby, MetaMask, etc.) |

**The core problem:** ZAO OS users log in via Farcaster (not ETH wallet). Their Lens profile is on a different ETH wallet. The Lens SDK needs that specific wallet to sign.

### Options Evaluated

| Option | Effort | UX | Verdict |
|--------|--------|-----|---------|
| **A: Require ETH Wallet Connection** | 2-4 hours | Annoying (wallet switching) | Viable if we keep Lens |
| **B: Defer Lens to Phase 2** | 30 min to disable | Clean | **RECOMMENDED** |
| **C: Manual Token Entry** | 1 hour | Terrible (devs only) | Rejected |

### Implementation Priority (When We Return)

1. Register ZAO app on Lens Developer Dashboard
2. Install V3 SDK packages
3. Add "Connect ETH Wallet" step in Lens settings (RainbowKit)
4. Rewrite `ConnectedPlatforms.tsx` Lens card to use SDK `client.login()` + `enableSignless()`
5. Rewrite `src/lib/publish/lens.ts` to use `post()` action + Grove storage
6. Update `src/app/api/publish/lens/route.ts` to resume session + post

---

## Sources

- [Lens Authentication Docs](https://lens.xyz/docs/protocol/authentication)
- [Lens TypeScript SDK](https://lens.xyz/docs/protocol/getting-started/typescript)
- [Lens Create a Post](https://lens.xyz/docs/protocol/feeds/post)
- [Lens GraphQL API](https://lens.xyz/docs/protocol/getting-started/graphql)
- [Lens SDK GitHub](https://github.com/lens-protocol/lens-sdk)
- [Lens Sponsored Transactions](https://www.lens.xyz/docs/best-practices/gasless/sponsored-transactions)
- [Lens V3 GitHub](https://github.com/lens-protocol/lens-v3)
- [Grove Getting Started](https://lens.xyz/docs/storage/usage/getting-started)
- [@lens-chain/storage-client npm](https://www.npmjs.com/package/@lens-chain/storage-client)
- [Doc 36 — Lens Protocol Deep Dive](../../_archive/036-lens-protocol-deep-dive/)
