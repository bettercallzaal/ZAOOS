# 117 — Lens Protocol V3 Cross-Posting for ZAO OS

> **Status:** Research complete
> **Date:** March 23, 2026
> **Goal:** Fix broken Lens integration — correct API, auth flow, and posting for Lens V3

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **API Endpoint** | `https://api.lens.xyz/graphql` — NOT `api-v2.lens.dev` (V2 is dead) |
| **SDK** | `@lens-protocol/client@canary` — V3 SDK, NOT the old v2 package |
| **Auth** | SDK-based `client.login()` with `signMessageWith(walletClient)` from viem |
| **Posting** | `post(sessionClient, { contentUri })` — upload metadata to Grove first |
| **Metadata** | Use `@lens-protocol/metadata` package for `textOnly()`, `image()`, etc. |
| **Storage** | Grove (Lens's decentralized storage) via `StorageClient` |
| **Our bug** | We were calling `api-v2.lens.dev` with V2 GraphQL mutations — endpoint is dead |

## What Was Wrong in Our Code

| File | Problem |
|------|---------|
| `src/lib/publish/lens.ts` | Uses `api-v2.lens.dev` endpoint (dead). Uses V2 mutations (`postOnMomoka`, `createOnchainPostTypedData`). Momoka doesn't exist in V3. |
| `src/app/api/platforms/lens/route.ts` | Uses V2 `profiles` query against V2 endpoint. GraphQL schema is completely different in V3. |
| `src/components/settings/ConnectedPlatforms.tsx` | Auth flow tries to call dead V2 API |

## Correct V3 Implementation

### 1. Install Dependencies

```bash
npm install @lens-protocol/client@canary @lens-protocol/metadata
```

### 2. Client Setup

```typescript
import { PublicClient, mainnet } from "@lens-protocol/client";

const client = PublicClient.create({
  environment: mainnet,
  origin: "https://zaoos.com",
  // Optional: apiKey for higher rate limits (server-side only)
});
```

### 3. Authentication Flow

**V3 uses the SDK's built-in `client.login()` — NOT raw GraphQL mutations.**

```typescript
import { signMessageWith } from "@lens-protocol/client/viem";
import { evmAddress } from "@lens-protocol/client";
import { fetchAccountsAvailable } from "@lens-protocol/client/actions";

// Step 1: Check if wallet has Lens accounts
const accounts = await fetchAccountsAvailable(client, {
  managedBy: evmAddress(walletAddress),
  includeOwned: true,
});

if (accounts.items.length === 0) {
  // No Lens account on this wallet
  // User can onboard:
  const authenticated = await client.login({
    onboardingUser: {
      app: evmAddress("0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE"), // ZAO's app address (mainnet)
      wallet: evmAddress(walletAddress),
    },
    signMessage: signMessageWith(walletClient),
  });
  const sessionClient = authenticated.value;
}

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

**Key differences from V2:**
- No raw `challenge` + `authenticate` mutations — SDK handles it
- Must specify `app` address (register at Lens Developer Dashboard)
- `signMessageWith(walletClient)` from `@lens-protocol/client/viem` bridges wagmi
- Returns `sessionClient` directly (not tokens you store manually)

### 4. Creating a Post

```typescript
import { textOnly } from "@lens-protocol/metadata";
import { StorageClient } from "@lens-protocol/storage-node-client";
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

### 5. Session Persistence

```typescript
// Resume session (uses storage from client creation)
const resumed = await client.resumeSession();
if (resumed.isOk()) {
  const sessionClient = resumed.value;
  // Can now post without re-authenticating
}

// Logout
await client.logout();
```

## Architecture for ZAO OS

### Problem: Auth Requires Client-Side Wallet Signing

Lens V3 auth requires `signMessage` from the user's wallet. This MUST happen client-side (browser). Our current approach of server-side auth is impossible.

### Solution: Client-Side Auth + Server-Side Posting

```
Settings Page (Client)                   Server
┌──────────────────────┐                ┌──────────────────┐
│ 1. Connect Wallet    │                │                  │
│ 2. client.login()    │──── tokens ───►│ Store tokens     │
│    (wallet signs)    │                │ in Supabase      │
│ 3. Show "Connected"  │                │                  │
└──────────────────────┘                └──────────────────┘

Compose Bar (Client)                     Server
┌──────────────────────┐                ┌──────────────────┐
│ Toggle Lens ON       │                │ 4. Fetch tokens  │
│ Hit "Publish (N)"    │──── cast ─────►│ 5. Resume session│
│                      │                │ 6. Upload Grove  │
│                      │                │ 7. post()        │
│                      │◄── result ─────│ 8. Log result    │
└──────────────────────┘                └──────────────────┘
```

**Wait — there's a catch.** The `sessionClient` needs the wallet to sign transactions for posting (via `handleOperationWith(walletClient)`). This means posting ALSO needs client-side signing unless the user enables **Signless mode**.

### Signless Mode (Recommended)

```typescript
import { enableSignless } from "@lens-protocol/client/actions";

// After login, enable signless for gasless, no-popup posting
await enableSignless(sessionClient)
  .andThen(handleOperationWith(walletClient));
```

Once signless is enabled, the server can post on behalf of the user without wallet popups. The Lens Profile Manager handles signing.

### Revised Architecture

1. **Settings → Connect Lens**: client.login() + enableSignless() (two wallet signs, one-time)
2. **Store**: Save Lens session tokens + account address in Supabase
3. **Publish**: Server resumes session, posts via `post()` without wallet (signless)

## V3 API Endpoints

| Environment | Endpoint |
|-------------|----------|
| **Mainnet** | `https://api.lens.xyz/graphql` |
| **Testnet** | `https://api.testnet.lens.xyz/graphql` |
| **V2 (DEAD)** | ~~`https://api-v2.lens.dev`~~ |

## Dependencies

```bash
npm install @lens-protocol/client@canary @lens-protocol/metadata @lens-protocol/storage-node-client
```

All packages require `viem` (already in ZAO OS as dependency of wagmi).

## ZAO App Registration

To use Lens V3, ZAO OS needs a registered app address. Register at the [Lens Developer Dashboard](https://developer.lens.xyz).

- **Mainnet test app**: `0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE`
- **Testnet test app**: `0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7`

For production, register a ZAO-specific app to get a dedicated address.

## Implementation Priority

1. Register ZAO app on Lens Developer Dashboard
2. Install V3 SDK packages
3. Rewrite `ConnectedPlatforms.tsx` Lens card to use SDK `client.login()` + `enableSignless()`
4. Rewrite `src/lib/publish/lens.ts` to use `post()` action + Grove storage
5. Update `src/app/api/publish/lens/route.ts` to resume session + post

## Sources

- [Lens Authentication Docs](https://lens.xyz/docs/protocol/authentication)
- [Lens TypeScript SDK](https://lens.xyz/docs/protocol/getting-started/typescript)
- [Lens Create a Post](https://lens.xyz/docs/protocol/feeds/post)
- [Lens GraphQL API](https://lens.xyz/docs/protocol/getting-started/graphql)
- [Lens SDK GitHub](https://github.com/lens-protocol/lens-sdk)
- [Doc 36 — Lens Protocol Deep Dive](../036-lens-protocol-deep-dive/)
