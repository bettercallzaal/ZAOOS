# 283 — Privy Embedded Wallets & Smart Wallets for FISHBOWLZ Token Mechanics on Base

> **Status:** Research complete
> **Date:** 2026-04-04
> **Goal:** Map every Privy wallet capability needed for FISHBOWLZ token mechanics: ETH tips, ERC-20 buys (SANG/ZABAL/$FISHBOWLZ), token-gated rooms, fee collection, server-side wallet ops, and Clanker token launch integration.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Tip speaker (ETH)** | ALREADY BUILT — `src/components/spaces/TipButton.tsx` uses wagmi `useSendTransaction` + viem `parseEther`. Works today for connected external wallets. ADD Privy embedded wallet support by wrapping `@privy-io/wagmi` `createConfig` so embedded wallets become the wagmi active wallet |
| **Token gate rooms** | ALREADY BUILT — `src/lib/spaces/tokenGate.ts` uses viem `readContract` to check ERC-20/ERC-721/ERC-1155 balance server-side. Plug `$FISHBOWLZ` contract address in as ERC-20 gate on Base (chainId 8453) when token launches |
| **Buy SANG/ZABAL/FISHBOWLZ in-app** | USE Uniswap V4 SDK + `@uniswap/universal-router-sdk`. Universal Router address on Base (all chains): `0x66a9893cc07d91d95644aedd05d03f95e1dba8af`. Privy embedded wallet signs the swap via `getEthereumProvider()` → viem `WalletClient`. Permit2 approval required for ERC-20 input tokens |
| **Privy wagmi integration** | REPLACE `src/lib/wagmi/config.ts`'s `createConfig` import from `wagmi` with `@privy-io/wagmi` `createConfig` — this is a drop-in replacement that syncs Privy wallets as wagmi connectors. All existing `useSendTransaction`/`useReadContract` hooks continue working unchanged |
| **Server-side wallet ops** | USE Privy Server Wallets API (`privy.wallets().ethereum().sendTransaction()`) for FISHBOWLZ treasury ops (auto fee collection, airdrops). caip2 for Base = `eip155:8453`. NOT available for user wallets — server wallets are programmatic wallets your app controls |
| **Fee collection (1–2%)** | USE on-chain fee split: send `tipAmount * 0.98` to speaker + `tipAmount * 0.02` to treasury as 2 separate transactions in the `handleSend` flow. OR use a Solidity Splitter contract for atomic split. Splitter is cleaner for production but 2-tx client-side is fine for v1 |
| **Clanker $FISHBOWLZ launch** | USE Clanker SDK v4 with `devBuy` param to seed initial liquidity. Post-launch, users swap via Uniswap V4 Universal Router. Clanker was acquired by Farcaster (Oct 2025) then transitioned to Neynar (Jan 2026) — it still deploys on Base via the same SDK/API |
| **Gas sponsorship** | USE Privy native gas sponsorship (toggle in dashboard) for embedded wallet txs — enables `"sponsor": true` flag on any transaction. Free during beta, tracked in Privy billing after. Base paymaster (Coinbase-sponsored) is a free alternative for Base-only apps |
| **Smart wallets vs embedded EOA** | USE embedded EOA (default) for v1 FISHBOWLZ — simpler, no AA overhead, already in `createOnLogin: 'users-without-wallets'` config from Doc 282. Add smart wallets (ZeroDev/Alchemy/Thirdweb) later if you need batched transactions (approve + swap in 1 click) or ERC-20 paymaster (pay gas in ZABAL) |
| **Privy pricing** | FREE for 0–499 MAU (hackathon safe). 50,000 signatures/month free. $1M/month transaction volume free. Gas sponsorship billed separately at usage-based rate after free beta |

---

## Comparison of Options

### Tip / ETH Transfer Methods

| Method | UX | User Requirement | Code Complexity | In ZAO OS Today? |
|--------|-----|-----------------|-----------------|-----------------|
| **wagmi `useSendTransaction`** (current) | Wallet popup confirmation | User must have connected external wallet OR Privy embedded wallet via `@privy-io/wagmi` | Low — already in `TipButton.tsx` | YES |
| **Privy `sendTransaction` hook** | Privy native modal (customizable) | Privy embedded wallet only | Low — `const { sendTransaction } = usePrivy()` | No, needs Privy setup |
| **`useWallets` + `getEthereumProvider` + viem `WalletClient`** | Native viem call, no Privy UI | Privy embedded wallet | Medium — manual provider wrap | No |
| **Server-side wallet (Privy API)** | Invisible to user | None — app wallet | Low server-side | No |

**Winner for v1:** Keep existing `useSendTransaction` from wagmi, but swap `createConfig` to `@privy-io/wagmi` version so embedded wallets work as the active wallet. Zero changes to `TipButton.tsx`.

### Token Swap Methods (Buy SANG/ZABAL/$FISHBOWLZ)

| Method | Complexity | Works with Privy | Base Support | Permit2 Needed? |
|--------|-----------|-----------------|--------------|-----------------|
| **Uniswap V4 SDK + Universal Router** | High — encode V4Planner actions | Yes — sign via `getEthereumProvider()` | Yes — Router at `0x66a9893cc07d91d95644aedd05d03f95e1dba8af` | Yes (ERC-20 input) |
| **Uniswap V3 SDK + SwapRouter** | Medium — still maintained | Yes | Yes | No (approval simpler) |
| **1inch API / 0x API** | Low — off-chain quote, on-chain execute | Yes | Yes | No |
| **Clanker direct buy API** | Low — Clanker handles routing | Yes (for Clanker-launched tokens) | Yes | No |

**Winner for $FISHBOWLZ buy:** Use 1inch or 0x API for swap quote (off-chain routing) + Privy `getEthereumProvider()` to sign the execute tx. Uniswap V4 SDK is the lowest-level control but highest complexity. V3 SDK is still valid for established pools.

### Fee Collection Models

| Model | Atomicity | Gas Cost | Implementation | Notes |
|-------|-----------|----------|---------------|-------|
| **2 separate txs (speaker 98% + treasury 2%)** | Not atomic — speaker gets paid even if treasury tx fails | 2x gas (~$0.002 on Base) | Client-side in `TipButton.tsx` | Good enough for v1 |
| **Splitter contract on-chain** | Atomic | 1 tx + contract overhead | Deploy `PaymentSplitter` contract | Best for production |
| **Server intercept + re-route** | Not atomic — server relays | Server controls fee logic | FISHBOWLZ API route intercepts after tx confirmation | Avoids smart contract deploy |
| **Privy server wallet intercept** | Not atomic | Server wallet pays fees | App-controlled treasury wallet skims confirmed tips | Requires Privy Server Wallets plan |

**Winner for v1:** 2 separate transactions. Replace `TipButton.tsx` `handleSend` to send `98%` to speaker and `2%` to treasury address simultaneously using `Promise.allSettled`.

### Smart Wallet Providers (if AA is needed later)

| Provider | Gas Sponsorship | Batch Txs | ERC-20 Paymaster | Privy Integration | Free Tier |
|----------|----------------|-----------|-----------------|-------------------|-----------|
| **ZeroDev (Kernel)** | Yes (Bundler API) | Yes | Yes | Official blog post | 100K ops/mo |
| **Alchemy (LightAccount)** | Yes (Gas Manager) | Yes | Yes | Native Privy support | 300M compute units |
| **Thirdweb** | Yes (60+ chains) | Yes | Yes | Native Privy support (Feb 2026) | 1M GU/mo |
| **Coinbase Smart Wallet** | Yes (Base paymaster) | Yes | No | Native Privy support | Free on Base |
| **Biconomy** | Yes | Yes | Yes | Privy support | 10K UserOps/mo |

**Winner if AA needed:** Coinbase Smart Wallet for Base — free paymaster via Coinbase, no setup cost, native to Base chain, and Privy has official support.

---

## ZAO OS Integration

### What's Already Built (Do Not Duplicate)

FISHBOWLZ already has complete token gate infrastructure:

- **`src/lib/spaces/tokenGate.ts`** — `checkTokenGate()` reads ERC-20/ERC-721/ERC-1155 balances server-side using viem `createPublicClient`. Already handles Base (chainId 8453). Plug $FISHBOWLZ contract address in directly.
- **`src/app/api/spaces/gate-check/route.ts`** — API endpoint that calls `checkTokenGate()`. Zod-validated, session-protected. Works today.
- **`src/components/spaces/TokenGateSection.tsx`** — UI for configuring a token gate on room creation. Already has ERC-20 + Base as options.
- **`src/components/spaces/TipButton.tsx`** — ETH tipping using wagmi `useSendTransaction` + `useWaitForTransactionReceipt`. Already fires analytics to `/api/spaces/tips`. Works on Base (`chainId: base.id`).
- **`src/lib/wagmi/config.ts`** — Wagmi config with Base, mainnet, optimism. Currently uses standard `wagmi` `createConfig` — needs 1 line change to use `@privy-io/wagmi` version.

### Step 1: Wire Privy Wallets into Existing wagmi Setup (1 file change)

```typescript
// src/lib/wagmi/config.ts — CHANGE THIS IMPORT
// Before:
import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
// After:
import { createConfig } from '@privy-io/wagmi';
import { http, cookieStorage, createStorage } from 'wagmi';

// Remove injected(), walletConnect(), coinbaseWallet() connectors from the config
// Privy drives connectors state — @privy-io/wagmi createConfig handles this

export function getWagmiConfig() {
  return createConfig({
    chains: [mainnet, base, optimism],
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
      [optimism.id]: http(),
    },
  });
}
```

Also wrap providers in `src/app/providers.tsx`:
```tsx
import { WagmiProvider } from '@privy-io/wagmi'; // NOT from 'wagmi'
```

After this change, Privy embedded wallets become the active wagmi wallet. All existing hooks (`useSendTransaction` in `TipButton.tsx`, `useReadContract`, etc.) work unchanged.

Install: `npm install @privy-io/wagmi`

### Step 2: Add Fee Split to TipButton

```tsx
// src/components/spaces/TipButton.tsx — add fee split
const TREASURY_ADDRESS = '0xYOUR_FISHBOWLZ_TREASURY' as `0x${string}`;
const FEE_BPS = 200n; // 2% in basis points

const handleSend = (val: string) => {
  const total = parseEther(val);
  const fee = (total * FEE_BPS) / 10000n;
  const speakerAmount = total - fee;

  // Primary: pay speaker
  sendTransaction({
    to: recipientAddress as `0x${string}`,
    value: speakerAmount,
    chainId: base.id,
  });

  // Fire-and-forget: fee to treasury (non-blocking)
  sendTransaction({
    to: TREASURY_ADDRESS,
    value: fee,
    chainId: base.id,
  });
};
```

Note: wagmi's `useSendTransaction` only manages one pending tx at a time. For atomic fee split, use a Solidity PaymentSplitter contract or 2 sequential sends after confirmation.

### Step 3: Token Gate for $FISHBOWLZ Rooms

When $FISHBOWLZ launches on Clanker (Base), plug its contract address into the existing gate system. No code changes required — just configure the room:

```typescript
// Room creation payload in src/app/api/fishbowlz/rooms/route.ts
const gateConfig = {
  type: 'erc20',
  contractAddress: '0xFISHBOWLZ_TOKEN_ADDRESS', // from Clanker deployment
  chainId: 8453, // Base
  minBalance: '1000000000000000000', // 1 FISHBOWLZ (18 decimals)
};
```

The existing `checkTokenGate()` in `src/lib/spaces/tokenGate.ts` handles this without changes.

### Step 4: In-App Token Buy (SANG/ZABAL/$FISHBOWLZ)

For a "Buy $FISHBOWLZ" button within a room:

```tsx
// New component: src/components/fishbowlz/BuyTokenButton.tsx
'use client';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, encodeFunctionData, parseUnits } from 'viem';
import { base } from 'viem/chains';

// Uniswap V3 swap router (simpler than V4 for token→token swaps)
const SWAP_ROUTER_V3 = '0x2626664c2603336E57B271c5C0b26F421741e481' as `0x${string}`; // Base
const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`; // Base WETH

export function BuyTokenButton({ tokenAddress, tokenSymbol }: { tokenAddress: `0x${string}`, tokenSymbol: string }) {
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  const handleBuy = async (ethAmount: string) => {
    if (!embeddedWallet) return;

    await embeddedWallet.switchChain(base.id);
    const provider = await embeddedWallet.getEthereumProvider();
    const walletClient = createWalletClient({
      account: embeddedWallet.address as `0x${string}`,
      chain: base,
      transport: custom(provider),
    });

    // ETH → token via Uniswap V3 ExactInputSingle
    const params = {
      tokenIn: WETH,
      tokenOut: tokenAddress,
      fee: 3000, // 0.3% pool
      recipient: embeddedWallet.address as `0x${string}`,
      amountIn: parseUnits(ethAmount, 18),
      amountOutMinimum: 0n, // TODO: add slippage protection in production
      sqrtPriceLimitX96: 0n,
    };

    const data = encodeFunctionData({
      abi: [{
        name: 'exactInputSingle',
        type: 'function',
        inputs: [{ name: 'params', type: 'tuple', components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ]}],
        outputs: [{ name: 'amountOut', type: 'uint256' }],
        stateMutability: 'payable',
      }],
      functionName: 'exactInputSingle',
      args: [params],
    });

    await walletClient.sendTransaction({
      account: embeddedWallet.address as `0x${string}`,
      to: SWAP_ROUTER_V3,
      data,
      value: parseUnits(ethAmount, 18), // ETH → WETH auto-wraps
    });
  };

  return (
    <button onClick={() => handleBuy('0.01')} className="...">
      Buy {tokenSymbol}
    </button>
  );
}
```

Note: Use Uniswap V3 `SwapRouter` (above) instead of V4 Universal Router for v1 — V3 pools are deeper for new tokens like Clanker deployments, and the API is simpler.

### Step 5: Server-Side Wallet for Treasury Operations (Privy Server Wallets)

```typescript
// src/app/api/fishbowlz/treasury/route.ts (new)
import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

// Send ETH from FISHBOWLZ treasury wallet to recipient
export async function transferFromTreasury(toAddress: string, amountWei: string) {
  const { hash } = await privy.wallets().ethereum().sendTransaction(
    process.env.FISHBOWLZ_TREASURY_WALLET_ID!, // Privy server wallet ID
    {
      caip2: 'eip155:8453', // Base
      params: {
        transaction: {
          to: toAddress,
          value: `0x${BigInt(amountWei).toString(16)}`,
          chain_id: 8453,
        },
      },
      sponsor: true, // Privy sponsors gas if enabled in dashboard
    }
  );
  return hash;
}
```

Server wallets are created in the Privy Dashboard under "Server Wallets" — they are NOT user wallets. You control them programmatically. Use for: automated airdrops, prize distribution, treasury management.

### Step 6: Clanker $FISHBOWLZ Token Launch

```typescript
// scripts/launch-fishbowlz-token.ts
import { Clanker } from 'clanker-sdk'; // npm install clanker-sdk
import { createPublicClient, createWalletClient, http, privateKeyToAccount } from 'viem';
import { base } from 'viem/chains';

const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
const publicClient = createPublicClient({ chain: base, transport: http() });
const walletClient = createWalletClient({ account, chain: base, transport: http() });

const clanker = new Clanker({ publicClient, wallet: walletClient });

const { txHash, waitForTransaction } = await clanker.deploy({
  name: 'FISHBOWLZ',
  symbol: 'FISHBOWLZ',
  tokenAdmin: account.address,
  // Optional: seed initial liquidity buy
  // devBuy: { eth: '0.1' }, // buys $0.1 worth at launch
  // Optional: set reward recipients (e.g. 5% to ZAO treasury)
  // fees: { recipients: [{ address: TREASURY, bps: 500 }] },
});

const result = await waitForTransaction();
console.log('$FISHBOWLZ deployed:', result.tokenAddress);
// → Use result.tokenAddress in TokenGateSection and BuyTokenButton
```

Install: `npm install clanker-sdk`

Clanker v4 deploys an ERC-20 + Uniswap V4 pool in a single transaction. Token has 100 billion fixed supply. Dynamic fees (1% base, 5% max). Deployed on Base.

---

## Full Feature Map: What's Free vs. Paid

| Feature | Free? | Notes |
|---------|-------|-------|
| Privy embedded wallets (create on login) | YES — 0–499 MAU free | From Doc 282: Developer tier is $0 |
| `useWallets()` + `sendTransaction` | YES | Part of embedded wallet SDK |
| `@privy-io/wagmi` integration | YES | Open source package |
| Token gate balance check (viem `readContract`) | YES | Pure RPC call, no Privy billing |
| Privy native gas sponsorship | Billed at usage after beta | Toggle in dashboard; 50K sigs/mo free |
| Privy server wallets | YES in free tier (limited) | Check dashboard for server wallet quota |
| Uniswap V3 swap | YES | No protocol fee for integrators |
| Clanker deployment | YES + pool creation fee | ~0.01 ETH deployment cost on Base |
| Base paymaster (Coinbase-sponsored) | YES | Free on Base for sponsored txs |
| ZeroDev smart wallets | YES — 100K ops/month | Via Privy + ZeroDev integration |

---

## Reference Implementations

| Project | License | Key Pattern |
|---------|---------|-------------|
| `privy-io/create-privy-pwa` | MIT | `useWallets()` + `getEthereumProvider()` + viem `WalletClient.sendTransaction()` for ETH transfers |
| `privy-io/base-paymaster-example` | MIT | Smart account + Base paymaster for sponsored txs; `SmartAccountContext.tsx` pattern |
| `privy-io/smart-wallets-starter` | Not specified | Smart wallets with Privy + Next.js |
| ZAO OS `TipButton.tsx` | Internal | wagmi `useSendTransaction` + `useWaitForTransactionReceipt` — already ships ETH tips on Base |
| ZAO OS `tokenGate.ts` | Internal | Server-side viem `readContract` for ERC-20/ERC-721/ERC-1155 balance check — production-ready |

### Key Code Pattern: ETH Send via Privy Embedded Wallet (from `create-privy-pwa`)

```typescript
// Find embedded wallet (walletClientType === 'privy')
const { wallets } = useWallets();
const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

// Get EIP-1193 provider and wrap with viem
await embeddedWallet.switchChain(base.id);
const provider = await embeddedWallet.getEthereumProvider();
const walletClient = createWalletClient({
  account: embeddedWallet.address as `0x${string}`,
  chain: base,
  transport: custom(provider), // from viem
});

// Send ETH
const txHash = await walletClient.sendTransaction({
  account: embeddedWallet.address as `0x${string}`,
  to: recipientAddress as `0x${string}`,
  value: parseEther('0.004'),
});
```

---

## Important Gotchas

1. **wagmi `createConfig` import change is mandatory** — using standard `wagmi` `createConfig` alongside Privy causes desync between Privy auth state and wagmi connector state. Must use `@privy-io/wagmi` version.
2. **`@privy-io/node` requires Node.js runtime** — set `export const runtime = 'nodejs'` in any API route calling Privy server wallets. Edge runtime does not work.
3. **`walletClientType === 'privy'`** — this string identifies embedded wallets vs external wallets in the `useWallets()` array. Other values: `'metamask'`, `'coinbase_wallet'`, `'rainbow'`, etc.
4. **Uniswap V3 vs V4 for Clanker tokens** — Clanker v4 deploys on Uniswap V4 pools. Use V4 Universal Router (`0x66a9893cc07d91d95644aedd05d03f95e1dba8af`) for swapping Clanker tokens, not V3 SwapRouter. V3 swap on a V4 pool will fail.
5. **`sponsor: true` requires dashboard toggle** — the `sponsor` flag in server wallet `sendTransaction` only works if you've enabled gas sponsorship in the Privy Dashboard for the target chain. It silently fails (falls back to user-paid gas) if not enabled.
6. **Privy acquired by Stripe (June 2025)** — SDK and pricing unchanged. Stripe integration is for stablecoin payments (Bridge), not wallet mechanics. No action needed.

---

## Sources

- [Privy Wallets Overview](https://docs.privy.io/wallets/overview) — wallet types, chains, features
- [Privy + wagmi Integration](https://docs.privy.io/wallets/connectors/ethereum/integrations/wagmi) — `@privy-io/wagmi` setup, `createConfig`, `WagmiProvider`
- [Privy Server Wallets — Ethereum Usage](https://docs.privy.io/guide/server-wallets/usage/ethereum) — `sendTransaction`, `caip2: 'eip155:8453'`, `sponsor: true`
- [Privy Native Gas Sponsorship Blog](https://privy.io/blog/introducing-privy-native-gas-sponsorship) — how sponsorship works, 50+ apps, 140K+ txs in beta
- [Privy + ZeroDev Partnership](https://privy.io/blog/zerodev-partnership) — smart wallet options
- [Base Docs: AA with Privy + Base Paymaster](https://docs.base.org/cookbook/account-abstraction/account-abstraction-on-base-using-privy-and-the-base-paymaster) — Coinbase-sponsored gas on Base
- [Uniswap V4 Single-Hop Swap Guide](https://docs.uniswap.org/sdk/v4/guides/swaps/single-hop-swapping) — V4Planner, Universal Router, code examples
- [Uniswap V4 Universal Router Address](https://docs.uniswap.org/contracts/v4/quickstart/swap) — `0x66a9893cc07d91d95644aedd05d03f95e1dba8af`
- [Clanker SDK v4.0.0 Docs](https://clanker.gitbook.io/clanker-documentation/sdk/v4.0.0) — deploy params, fee structure, Base deployment
- [create-privy-pwa embedded-wallet.tsx](https://github.com/privy-io/create-privy-pwa/blob/main/pages/embedded-wallet.tsx) — MIT, reference code for `getEthereumProvider()` pattern
- [privy-io/base-paymaster-example](https://github.com/privy-io/base-paymaster-example) — MIT, Base paymaster + smart account setup
- [Privy Pricing](https://www.privy.io/pricing) — free 0–499 MAU, $299/mo Starter, 50K sigs/mo free
