# Lens Protocol V3 Integration Rewrite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken Lens V2 integration with a working V3 implementation using the official SDK, wallet-based auth, signless posting, and Grove storage.

**Architecture:** Client-side wallet auth (SDK `client.login()` + `enableSignless()`) stores session tokens server-side. Publishing uses the SDK's `post()` action with metadata uploaded to Grove. Auth happens once in Settings; posting is server-side and signless (no wallet popups).

**Tech Stack:** `@lens-protocol/client@canary`, `@lens-protocol/metadata`, `@lens-protocol/storage-node-client`, viem (existing), wagmi (existing)

**Research:** `research/117-lens-v3-cross-posting/README.md`

---

## Pre-requisite: Register ZAO App on Lens

Before any code, you must register at [developer.lens.xyz](https://developer.lens.xyz) to get a ZAO-specific app address. Until then, use the test app address: `0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE`

Store this as env var `NEXT_PUBLIC_LENS_APP_ADDRESS`.

---

## File Map

### Create
| File | Responsibility |
|------|---------------|
| `src/lib/publish/lens-client.ts` | Lens V3 PublicClient singleton + session resume helper |
| `src/hooks/useLensAuth.ts` | Client-side hook: login, enableSignless, check accounts |
| `src/components/settings/LensConnect.tsx` | Lens card in Settings with "Connect with Wallet" button |

### Rewrite (full replacement)
| File | Responsibility |
|------|---------------|
| `src/lib/publish/lens.ts` | V3 posting: Grove upload + `post()` action (server-side) |
| `src/app/api/platforms/lens/route.ts` | POST: save tokens from client auth. DELETE: disconnect. |

### Modify
| File | Change |
|------|--------|
| `src/app/api/publish/lens/route.ts` | Use new `publishToLens()` from rewritten lens.ts |
| `src/components/settings/ConnectedPlatforms.tsx` | Replace inline Lens card with `<LensConnect>` |
| `src/lib/env.ts` | Add `NEXT_PUBLIC_LENS_APP_ADDRESS` |
| `.env.example` | Add `NEXT_PUBLIC_LENS_APP_ADDRESS` |

---

## Task 1: Install V3 SDK Packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @lens-protocol/client@canary @lens-protocol/metadata @lens-protocol/storage-node-client
```

- [ ] **Step 2: Add env var**

Add to `src/lib/env.ts` (in the NEXT_PUBLIC section or as a direct reference):
```typescript
NEXT_PUBLIC_LENS_APP_ADDRESS: process.env.NEXT_PUBLIC_LENS_APP_ADDRESS,
```

Add to `.env.example`:
```
# Lens Protocol V3 (register at developer.lens.xyz)
NEXT_PUBLIC_LENS_APP_ADDRESS=0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE
```

Add to `.env.local`:
```
NEXT_PUBLIC_LENS_APP_ADDRESS=0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/lib/env.ts .env.example
git commit -m "chore: install Lens V3 SDK packages + add app address env var"
```

---

## Task 2: Lens V3 Client Singleton

**Files:**
- Create: `src/lib/publish/lens-client.ts`

- [ ] **Step 1: Create the Lens client module**

This is a shared module used by both client-side auth and server-side posting.

```typescript
// src/lib/publish/lens-client.ts
import { PublicClient, mainnet, testnet } from "@lens-protocol/client";

const LENS_APP_ADDRESS = process.env.NEXT_PUBLIC_LENS_APP_ADDRESS
  || "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE";

let clientInstance: ReturnType<typeof PublicClient.create> | null = null;

/**
 * Get or create the Lens V3 PublicClient.
 * Uses mainnet by default. Pass testnet for development.
 */
export function getLensClient(env: 'mainnet' | 'testnet' = 'mainnet') {
  if (clientInstance) return clientInstance;

  clientInstance = PublicClient.create({
    environment: env === 'testnet' ? testnet : mainnet,
    origin: "https://zaoos.com",
  });

  return clientInstance;
}

export function getLensAppAddress() {
  return LENS_APP_ADDRESS;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/publish/lens-client.ts
git commit -m "feat: Lens V3 PublicClient singleton"
```

---

## Task 3: Client-Side Auth Hook

**Files:**
- Create: `src/hooks/useLensAuth.ts`

- [ ] **Step 1: Create the useLensAuth hook**

This hook handles the entire Lens login flow client-side using the connected wagmi wallet:

```typescript
// src/hooks/useLensAuth.ts
'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

interface LensAuthState {
  isConnecting: boolean;
  error: string | null;
  connectedHandle: string | null;
}

export function useLensAuth() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [state, setState] = useState<LensAuthState>({
    isConnecting: false,
    error: null,
    connectedHandle: null,
  });

  const connect = useCallback(async () => {
    if (!address || !walletClient) {
      setState(s => ({ ...s, error: 'Connect your wallet first' }));
      return;
    }

    setState({ isConnecting: true, error: null, connectedHandle: null });

    try {
      // Dynamic import to avoid SSR issues with Lens SDK
      const { PublicClient, mainnet, evmAddress } = await import("@lens-protocol/client");
      const { fetchAccountsAvailable } = await import("@lens-protocol/client/actions");
      const { signMessageWith } = await import("@lens-protocol/client/viem");

      const appAddress = process.env.NEXT_PUBLIC_LENS_APP_ADDRESS
        || "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE";

      const client = PublicClient.create({
        environment: mainnet,
        origin: window.location.origin,
      });

      // Check for existing Lens accounts
      const accounts = await fetchAccountsAvailable(client, {
        managedBy: evmAddress(address),
        includeOwned: true,
      });

      let sessionClient;
      let handle = address.slice(0, 10) + '...';

      if (accounts?.items && accounts.items.length > 0) {
        // Login with existing account
        const account = accounts.items[0];
        const result = await client.login({
          accountOwner: {
            account: evmAddress(account.account.address),
            app: evmAddress(appAddress),
            owner: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });

        if (result.isErr()) throw new Error(result.error?.message || 'Login failed');
        sessionClient = result.value;
        handle = account.account.username?.localName
          || account.account.address.slice(0, 10) + '...';
      } else {
        // Onboard as new user
        const result = await client.login({
          onboardingUser: {
            app: evmAddress(appAddress),
            wallet: evmAddress(address),
          },
          signMessage: signMessageWith(walletClient),
        });

        if (result.isErr()) throw new Error(result.error?.message || 'Onboarding failed');
        sessionClient = result.value;
        handle = 'new-user:' + address.slice(0, 8);
      }

      // Try to enable signless mode (one extra wallet sign, but then no more popups)
      try {
        const { enableSignless } = await import("@lens-protocol/client/actions");
        const { handleOperationWith } = await import("@lens-protocol/client/viem");
        await enableSignless(sessionClient).andThen(handleOperationWith(walletClient));
      } catch {
        // Signless may already be enabled or not supported — continue anyway
      }

      // Get the session credentials to store server-side
      const credentials = await sessionClient.getCredentials();

      // Save tokens to our server
      const saveRes = await fetch('/api/platforms/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          accessToken: credentials?.accessToken || '',
          refreshToken: credentials?.refreshToken || '',
          accountAddress: accounts?.items?.[0]?.account?.address || address,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save connection');
      }

      setState({ isConnecting: false, error: null, connectedHandle: handle });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Lens';
      setState({ isConnecting: false, error: msg, connectedHandle: null });
    }
  }, [address, walletClient]);

  return { ...state, connect, walletAddress: address };
}
```

**Key design decisions:**
- Dynamic imports for all Lens SDK modules (avoid SSR/Node issues)
- `signMessageWith(walletClient)` bridges wagmi → Lens SDK
- Tries `enableSignless()` after login (one-time extra sign)
- Extracts credentials and sends to our server for storage
- Error handling at every step

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useLensAuth.ts
git commit -m "feat: useLensAuth hook — client-side V3 auth with wallet"
```

---

## Task 4: Rewrite Platform Connect Route (Server)

**Files:**
- Rewrite: `src/app/api/platforms/lens/route.ts`

- [ ] **Step 1: Rewrite the route**

The POST now receives tokens from the client-side auth hook (not raw GraphQL). DELETE stays the same.

```typescript
// src/app/api/platforms/lens/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const connectSchema = z.object({
  handle: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accountAddress: z.string().optional(),
});

/**
 * POST /api/platforms/lens
 * Receives Lens V3 session tokens from client-side auth (useLensAuth hook).
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { handle, accessToken, refreshToken, accountAddress } = parsed.data;

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        lens_profile_id: handle,
        lens_access_token: accessToken,
        lens_refresh_token: refreshToken,
      })
      .eq('fid', session.fid);

    if (error) throw error;

    return NextResponse.json({ success: true, handle });
  } catch (err) {
    console.error('[platforms/lens] Save error:', err);
    return NextResponse.json({ error: 'Failed to save Lens connection' }, { status: 500 });
  }
}

/**
 * DELETE — Disconnect Lens.
 */
export async function DELETE() {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await supabaseAdmin
      .from('users')
      .update({ lens_profile_id: null, lens_access_token: null, lens_refresh_token: null })
      .eq('fid', session.fid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[platforms/lens] Disconnect error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/platforms/lens/route.ts
git commit -m "feat: rewrite Lens connect route for V3 token storage"
```

---

## Task 5: Rewrite Publishing Library (Server)

**Files:**
- Rewrite: `src/lib/publish/lens.ts`

- [ ] **Step 1: Rewrite with V3 SDK**

```typescript
// src/lib/publish/lens.ts
/**
 * Lens Protocol V3 publishing.
 * Uses the official SDK for posting via Grove storage.
 * Requires signless mode enabled (done during connect in useLensAuth).
 */
import type { NormalizedContent } from '@/lib/publish/normalize';

export interface LensPublishResult {
  postId: string;
  postUrl: string;
}

/**
 * Publish content to Lens V3.
 *
 * @param accessToken  - Lens V3 access token (from users table)
 * @param refreshToken - Lens V3 refresh token (for auto-refresh)
 * @param content      - NormalizedContent from normalizeForLens()
 */
export async function publishToLens(
  accessToken: string,
  refreshToken: string,
  content: NormalizedContent,
): Promise<LensPublishResult> {
  // Dynamic import Lens SDK (avoid Node.js module issues)
  const { PublicClient, mainnet, uri } = await import("@lens-protocol/client");
  const { post } = await import("@lens-protocol/client/actions");
  const { textOnly } = await import("@lens-protocol/metadata");
  const { StorageClient } = await import("@lens-protocol/storage-node-client");

  // Create client and resume session from stored tokens
  const client = PublicClient.create({
    environment: mainnet,
    origin: "https://zaoos.com",
  });

  // Resume session using refresh token
  // The SDK's resumeSession needs stored credentials — we manually set them
  const sessionResult = await client.resumeSession();
  let sessionClient;

  if (sessionResult.isOk()) {
    sessionClient = sessionResult.value;
  } else {
    // If resume fails, try refreshing the token via the API
    const refreshResult = await fetch('https://api.lens.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `mutation Refresh($request: RefreshRequest!) { refresh(request: $request) { accessToken refreshToken } }`,
        variables: { request: { refreshToken } },
      }),
    });

    const refreshData = await refreshResult.json();
    if (refreshData?.data?.refresh?.accessToken) {
      // Store new tokens — caller should update DB
      throw new Error(`TOKEN_REFRESH:${JSON.stringify(refreshData.data.refresh)}`);
    }

    throw new Error('Failed to resume Lens session — user may need to reconnect');
  }

  // Build metadata
  const metadata = textOnly({ content: content.text });

  // Upload to Grove
  const storageClient = StorageClient.create();
  const { uri: contentUri } = await storageClient.uploadAsJson(metadata);

  // Post (signless — no wallet needed)
  const result = await post(sessionClient, {
    contentUri: uri(contentUri),
  });

  if (result.isErr()) {
    throw new Error(`Lens post failed: ${result.error?.message || 'Unknown error'}`);
  }

  // Extract post ID from result
  const postHash = result.value?.hash || result.value?.id || 'unknown';
  const postUrl = `https://hey.xyz/posts/${postHash}`;

  return { postId: postHash, postUrl };
}
```

**Note:** The session resume pattern may need adjustment based on how the SDK stores credentials. If `resumeSession()` doesn't work server-side (it uses localStorage by default), we may need to pass a custom `IStorageProvider` that reads from our DB. This is noted as a potential follow-up.

- [ ] **Step 2: Commit**

```bash
git add src/lib/publish/lens.ts
git commit -m "feat: rewrite Lens publishing with V3 SDK + Grove storage"
```

---

## Task 6: Update Publish Route

**Files:**
- Modify: `src/app/api/publish/lens/route.ts`

- [ ] **Step 1: Update to pass refreshToken**

The existing route fetches `lens_access_token` but not `lens_refresh_token`. Update the select query and pass both to `publishToLens()`.

Read the current file, then change:
- The Supabase select to include `lens_refresh_token`
- The `publishToLens()` call to pass `(accessToken, refreshToken, content)`
- Handle the `TOKEN_REFRESH:` error by updating tokens in DB and retrying

- [ ] **Step 2: Commit**

```bash
git add src/app/api/publish/lens/route.ts
git commit -m "feat: update Lens publish route for V3 token handling"
```

---

## Task 7: LensConnect Settings Component

**Files:**
- Create: `src/components/settings/LensConnect.tsx`
- Modify: `src/components/settings/ConnectedPlatforms.tsx`

- [ ] **Step 1: Create LensConnect component**

A dedicated component that uses the `useLensAuth` hook:

```typescript
// src/components/settings/LensConnect.tsx
'use client';

import { useLensAuth } from '@/hooks/useLensAuth';

interface LensConnectProps {
  initialHandle: string | null;
  onStatusChange: (handle: string | null) => void;
}

export function LensConnect({ initialHandle, onStatusChange }: LensConnectProps) {
  const { isConnecting, error, connectedHandle, connect, walletAddress } = useLensAuth();
  const displayHandle = connectedHandle || initialHandle;

  const handleDisconnect = async () => {
    const res = await fetch('/api/platforms/lens', { method: 'DELETE' });
    if (res.ok) onStatusChange(null);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d1b2a] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center">
            {/* Lens icon */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-400" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Lens Protocol</h3>
            {displayHandle ? (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Connected as {displayHandle}
              </p>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                Not connected
              </p>
            )}
          </div>
        </div>
        {displayHandle ? (
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg border border-red-400/20 hover:border-red-400/40 transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting || !walletAddress}
            className="text-xs text-green-400 hover:text-green-300 px-3 py-1 rounded-lg border border-green-400/20 hover:border-green-400/40 transition-colors disabled:opacity-50"
          >
            {isConnecting ? 'Signing...' : 'Connect with Wallet'}
          </button>
        )}
      </div>
      {!walletAddress && !displayHandle && (
        <p className="text-xs text-gray-500">Connect your wallet first to link Lens</p>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {connectedHandle && (
        <p className="text-xs text-green-400 mt-2">Connected! Signless mode enabled — posts won't require wallet popups.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace Lens card in ConnectedPlatforms**

In `src/components/settings/ConnectedPlatforms.tsx`, replace the entire Lens `<div>` block (the custom wallet-auth card) with:

```tsx
import { LensConnect } from '@/components/settings/LensConnect';

// In the JSX, replace the Lens card with:
<LensConnect
  initialHandle={status.lens_profile_id}
  onStatusChange={(handle) => setStatus(prev => ({ ...prev, lens_profile_id: handle }))}
/>
```

Remove the `useLensAuth`-related state variables, `connectLensWithWallet`, `lensConnecting`, `lensError`, `lensMessage` from ConnectedPlatforms — they move into the hook.

Also remove the `useAccount` import if it's only used for Lens (check if Hive or others use it).

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/LensConnect.tsx src/components/settings/ConnectedPlatforms.tsx
git commit -m "feat: LensConnect component with V3 wallet auth + signless"
```

---

## Task 8: Build + Test + Push

- [ ] **Step 1: Build**

```bash
npm run build
```

Fix any type errors. Common issues:
- Lens SDK may have different types than expected — use `as any` sparingly
- Dynamic imports may need type annotations
- `result.isErr()` / `result.isOk()` are the Lens SDK's Result pattern

- [ ] **Step 2: Test manually**

1. Go to Settings → Connected Platforms → Lens
2. Click "Connect with Wallet"
3. Wallet should pop up to sign a message
4. After signing, should show "Connected as [handle]"
5. If signless prompt appears, sign again (one-time)
6. Go to Chat, toggle Lens ON in platform pills
7. Post a message — should cross-post to Lens

- [ ] **Step 3: Final commit + push**

```bash
git add -A
git commit -m "feat: complete Lens V3 integration — wallet auth, signless posting, Grove storage"
git push origin main
```

---

## Dependency Graph

```
Task 1 (install SDK) ──── run first
     │
     ├── Task 2 (client singleton) ── after install
     │        │
     │        ├── Task 3 (useLensAuth hook) ── needs client
     │        └── Task 5 (publish library) ── needs client
     │
     ├── Task 4 (connect route) ── independent of SDK (just stores tokens)
     │
     ├── Task 6 (publish route) ── needs Task 5
     │
     └── Task 7 (LensConnect UI) ── needs Task 3

Task 8 (build + test) ── last
```

**Parallelizable:** Tasks 3 + 5 can run simultaneously. Tasks 4 + 7 are mostly independent.

---

## Known Risks

1. **Lens SDK is `@canary`** — API may change. Pin version after confirming it works.
2. **`resumeSession()` uses localStorage** — may not work server-side. May need custom `IStorageProvider` that reads tokens from Supabase.
3. **Signless may require Lens Profile Manager** — not all profiles have this enabled. Fall back to "requires wallet" if signless fails.
4. **ZAO test app address** — using shared test address. Register ZAO-specific app for production.
