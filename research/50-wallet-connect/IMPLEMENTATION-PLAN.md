# Wallet Connection + Multi-Wallet for ZAO OS

> **Date:** March 14, 2026
> **Stack:** wagmi v2 + ConnectKit (MIT) + existing XMTP browser-sdk v7

---

## Architecture

```
Farcaster Sign-In (Neynar/iron-session) = REQUIRED (gates access)
Wallet Connection (wagmi/ConnectKit)     = OPTIONAL (enables real-wallet XMTP)
Burner Key XMTP (auto-connect)           = FALLBACK (always available)
```

---

## Why ConnectKit over RainbowKit

| Factor | ConnectKit | RainbowKit |
|--------|-----------|------------|
| Bundle size | Lighter | Heavier |
| Complexity | Simpler API | More wallet options |
| License | MIT | MIT |
| WalletConnect needed | Yes (free projectId) | Yes (free projectId) |

ConnectKit is lighter and simpler — we only need wallet signing for XMTP, not DeFi flows.

**Neither needs SIWE** — our auth is Farcaster-based. Wallet connection is purely for XMTP.

---

## Packages to Install

```bash
npm install connectkit wagmi@^2 @wagmi/core@^2
```

Already have: `viem@^2.47.2`, `@tanstack/react-query`, `react@19`

**Env var needed:**
```
NEXT_PUBLIC_WC_PROJECT_ID=<from cloud.walletconnect.com, free tier>
```

---

## File-by-File Plan

### 1. New: `src/lib/wagmi/config.ts`

wagmi config with SSR support (cookieStorage, not localStorage).

```typescript
import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
import { mainnet, base, optimism } from 'wagmi/chains';

export function getWagmiConfig() {
  return createConfig({
    chains: [mainnet, base, optimism],
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
      [optimism.id]: http(),
    },
  });
}
```

Chains: mainnet (default), Base (Farcaster L2), Optimism (existing RPC).

### 2. Modify: `src/app/layout.tsx`

Add SSR cookie hydration (layout becomes async):

```typescript
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import { getWagmiConfig } from '@/lib/wagmi/config';

export default async function RootLayout({ children }) {
  const initialState = cookieToInitialState(
    getWagmiConfig(),
    (await headers()).get('cookie')
  );
  return (
    <html lang="en">
      <body>
        <Providers wagmiInitialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
```

### 3. Modify: `src/app/providers.tsx`

Wrap existing providers with WagmiProvider + ConnectKitProvider:

```
WagmiProvider > QueryClientProvider > ConnectKitProvider > AuthKitProvider > AudioProviders > MiniAppGate
```

- Share a single QueryClient between wagmi and existing code
- Use `useState(() => getWagmiConfig())` to avoid shared state between SSR requests

### 4. New: `src/hooks/useWalletXMTP.ts`

Bridge hook connecting wagmi wallet to XMTP:

```typescript
import { useAccount, useWalletClient } from 'wagmi';
import { useXMTPContext } from '@/contexts/XMTPContext';

export function useWalletXMTP() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connectWallet } = useXMTPContext();

  const connectWalletToXMTP = async () => {
    if (!address || !walletClient) return;
    const signMessage = async (msg: string) => walletClient.signMessage({ message: msg });
    await connectWallet(address, signMessage);
  };

  return { connectWalletToXMTP, canConnect: isConnected && !!walletClient };
}
```

**Key insight:** No changes needed to XMTPContext or xmtp/client.ts — `connectWallet(address, signMessage)` already accepts exactly this shape.

### 5. New: `src/components/wallet/ConnectWalletButton.tsx`

Two-step UX: (1) ConnectKit connects wallet, (2) user clicks to link to XMTP.

---

## How the Bridge Works

```
wagmi useWalletClient() → viem WalletClient → walletClient.signMessage()
                                                       ↓
XMTPContext.connectWallet(address, signMessage)
         ↓
createWalletSigner(address, signMessage) → XMTP Signer → Client.create(signer)
```

**Zero changes to XMTP layer.** The existing `createWalletSigner` in `src/lib/xmtp/client.ts` is already designed for this.

---

## Multi-Wallet (XMTP v3 Native)

- Single inbox supports up to 256 linked addresses
- `client.unsafe_addAccount(newSigner, true)` links a wallet to existing inbox
- First wallet = recovery identity (cannot be removed)
- **Warning:** linking a wallet that already has its own inbox removes it from the old inbox (irreversible)

**Recommendation:** Phase 1 = separate clients per wallet (current approach). Phase 2 = identity linking via `unsafe_addAccount` after validating the UX.

---

## What to Keep vs Replace

| Component | Action |
|-----------|--------|
| `src/lib/xmtp/client.ts` | Keep — already has `createWalletSigner` |
| `src/contexts/XMTPContext.tsx` | Keep — `connectWallet` accepts `(address, signMessage)` |
| `autoConnect(fid)` burner key flow | Keep as default/fallback |
| `QueryClient` creation in providers | Refactor — share single instance with wagmi |
| `src/app/providers.tsx` | Add WagmiProvider + ConnectKitProvider wrapping |
| `src/app/layout.tsx` | Add async + headers() + initialState |

---

## SSR Pitfalls to Avoid

1. `ssr: true` in wagmi config (prevents hydration mismatch)
2. `cookieStorage` not `localStorage` (SSR-safe)
3. `useState(() => getWagmiConfig())` (no shared state between requests)
4. ConnectKitProvider must be inside WagmiProvider
5. Share single QueryClient between wagmi and existing TanStack Query usage

---

## Potential Issues

1. **WalletConnect polyfills** — WC v2 uses Node APIs. ConnectKit's `getDefaultConfig` handles most, but watch for build errors.
2. **Two viem instances** — run `npm ls viem` after install to verify no duplicates.
3. **Mobile mini-app context** — Warpcast's injected wallet provider should auto-detect via ConnectKit.
4. **XMTP WASM loading** — verify `bindings_wasm_bg.wasm` still loads after adding providers.

---

## Sources

- wagmi SSR Guide: https://wagmi.sh/react/guides/ssr
- ConnectKit: https://docs.family.co/connectkit/getting-started
- XMTP Multi-Wallet Identity: https://docs.xmtp.org/protocol/v3/identity
- XMTP Manage Inboxes: https://docs.xmtp.org/chat-apps/core-messaging/manage-inboxes
- WalletConnect Cloud: https://cloud.walletconnect.com
