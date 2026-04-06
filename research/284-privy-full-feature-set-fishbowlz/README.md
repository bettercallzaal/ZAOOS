# 284 — Privy Full Feature Set for FISHBOWLZ

> **Status:** Research complete
> **Date:** 2026-04-04
> **Goal:** Deep-dive all Privy features and map each one to FISHBOWLZ use cases — tipping, token gating, gasless onboarding, Farcaster Mini App auth, earn, webhooks, and cross-app wallets

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Embedded wallets for tipping** | USE embedded wallets for speaker tipping — every Privy login auto-creates a wallet; use `sendTransaction` with ETH/USDC on Base. Free on developer tier |
| **Farcaster signer (write access)** | USE `useFarcasterSigner()` — Privy sponsors ALL signer creation, zero warps cost, completely free. Users authorize once, then cast forever |
| **Mini App auth** | USE `loginToMiniApp()` — this is the correct entry point for FISHBOWLZ as a Farcaster Mini App. Returns FID + username + pfp. Do NOT use normal `login()` for mini apps |
| **Smart wallets / gas sponsorship** | USE native gas sponsorship (toggle in dashboard + `sponsor: true` in transactions) — covers Base, Ethereum, Optimism, Polygon. Actual gas cost + convenience fee; no explicit per-tx pricing published, included in developer plan |
| **Token gating** | SKIP Privy's native balance check for custom tokens (ERC-20 only works server-side, no custom token lookup by contract address in public docs). USE Viem/Alchemy to read on-chain balance instead, then gate in your API route |
| **Privy Earn** | SKIP for FISHBOWLZ MVP — Privy Earn connects idle balances to Morpho/Aave DeFi vaults. Valuable for "room treasury" features later but complex for a hackathon |
| **Webhooks for Supabase sync** | USE `user.created` webhook to auto-insert Privy users into Supabase `fishbowl_users` table — straightforward signed-payload pattern. 12 total event types, free on all tiers |
| **Cross-app wallets** | SKIP enabling as provider for now — adds complexity. USE as requester to let Zora/OpenSea users bring their wallets in without re-creating one |
| **Privy + Neynar** | USE Privy for auth/wallet, Neynar for feed/social graph — they are complementary. Privy gives FID + wallet; Neynar gives followers, casts, notifications. No official Privy+Neynar SDK but standard pattern: `user.farcaster.fid` → Neynar API calls |
| **Pricing for hackathon** | Free tier ($0, 0–499 MAU) covers everything: embedded wallets, Farcaster signers, gas sponsorship, webhooks, all SDKs. No credit card needed |

---

## Comparison of Options

### 1. Auth Method Comparison

| Option | Farcaster FID | Embedded Wallet | Mini App Auth | Gas Sponsorship | Free Tier |
|--------|--------------|-----------------|--------------|----------------|-----------|
| **Privy** | Yes — `user.farcaster.fid` | Auto-created on login | `loginToMiniApp()` native | Native (dashboard toggle) | 0–499 MAU = $0 |
| Farcaster AuthKit | Yes — native SIWF | No | No native support | No | Free (self-hosted) |
| Dynamic.xyz | Yes via social | Yes | No | Via ZeroDev partner | 0–1,000 MAU = $0 |
| Web3Auth | Yes via social | Yes | No | Via Biconomy partner | 0–1,000 MAU = $0 |
| Iron-session (current ZAO) | Via Neynar flow | No | No | No | Free (self-hosted) |

**Winner:** Privy — only option with all 5 capabilities native, free tier adequate for FISHBOWLZ.

### 2. Token Gating Approaches

| Approach | Custom ERC-20 | NFT | On-chain | Complexity | Cost |
|----------|--------------|-----|----------|------------|------|
| **Privy REST API (`/balance`)** | Native tokens only (ETH, USDC, USDT) | No | Server-side | Low | Free |
| **Viem `readContract` + custom ABI** | Yes — any contract address | Yes | Server-side | Medium | Free (RPC cost) |
| **Alchemy NFT API** | Yes | Yes | Server-side | Low | Free up to 300M CUs/mo |
| **Token.art / Unlock Protocol** | Yes | Yes | Client or server | High | Paid |

**Winner for ZABAL gating:** Viem `readContract` — call `balanceOf(walletAddress)` on ZABAL contract, check against threshold. 3 lines of code.

### 3. Tipping Mechanism Comparison

| Approach | UX | Chains | Gas | Cost to FISHBOWLZ |
|----------|----|--------|-----|-------------------|
| **Privy embedded wallet + sendTransaction** | Seamless (no popup) | Base, Ethereum, Polygon | Sponsor with `sponsor:true` | Gas cost + Privy fee |
| External wallet (MetaMask popup) | Interrupts experience | Any EVM | User pays | $0 |
| Zora Protocol rewards | Built-in | Base | Gasless | 0% fee |
| Stream.io reactions + off-chain ledger | No real ETH | N/A | N/A | $0 |

**Winner for FISHBOWLZ:** Privy embedded wallet + Base chain. Users never see a wallet popup; tipping is 1 tap. Gas-sponsor on Base makes it effectively free (Base gas is fractions of a cent).

---

## Feature 1: Embedded Wallets

**What it is:** Privy creates a self-custodial wallet for every user at login — no MetaMask, no seed phrase required. Keys are secured in TEE (Trusted Execution Environment) or on-device secure enclave.

**Supported chains (EVM + SVM):**
- Ethereum mainnet + testnets (Sepolia, Holesky)
- Base mainnet + Sepolia
- Optimism, Arbitrum, Polygon, BNB Smart Chain
- 13+ other EVM chains
- Solana mainnet + Devnet
- Bitcoin, Spark, TRON, Stellar

**Key config:**

```tsx
// In PrivyProvider config
embeddedWallets: {
  ethereum: {
    createOnLogin: 'users-without-wallets', // auto-create for new users
    // OR: 'all-users' to always create
    // OR: 'off' to disable
  },
  solana: {
    createOnLogin: 'users-without-wallets',
  },
}
```

**Tipping a speaker:**

```typescript
import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { parseEther, parseUnits } from 'viem';

function TipButton({ speakerAddress, amount }: { speakerAddress: string; amount: string }) {
  const { sendTransaction } = useSendTransaction();

  const tipSpeaker = async () => {
    // ETH tip on Base
    await sendTransaction({
      to: speakerAddress,
      value: parseEther(amount), // e.g. '0.001' = $3 at $3000/ETH
      chainId: 8453, // Base mainnet
      sponsor: true, // FISHBOWLZ pays gas
    });
  };

  return <button onClick={tipSpeaker}>Tip {amount} ETH</button>;
}
```

**USDC tip (ERC-20):**

```typescript
import { encodeFunctionData } from 'viem';
import { erc20Abi } from 'viem';

const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

await sendTransaction({
  to: USDC_BASE,
  data: encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [speakerAddress, parseUnits('1', 6)], // 1 USDC (6 decimals)
  }),
  chainId: 8453,
  sponsor: true,
});
```

**Collecting room fees (premium rooms):**
Same pattern — when a user joins a premium room, call `sendTransaction` to transfer USDC to the room host's wallet (or a ZAO treasury address). Server-side: verify the transaction hash on-chain before granting room access.

---

## Feature 2: Farcaster Integration Deep Dive

### 2a. Login (Read Access) — Already in Doc 282

Privy returns `user.farcaster.fid`, `username`, `displayName`, `bio`, `pfp`, `url`, `ownerAddress`. Free, cached at login, 24-hour refresh limit.

### 2b. Write Access (Farcaster Signers) — THIS IS BIG

Privy's `useFarcasterSigner()` hook creates a non-custodial Ed25519 signer that lets users post casts, likes, recasts, and follows from FISHBOWLZ.

**Privy sponsors ALL signer creation. Zero warps cost to you or your users.**

```tsx
import { useFarcasterSigner } from '@privy-io/react-auth';
import { HubRestAPIClient } from '@standard-crypto/farcaster-js';

function CastFromRoom({ roomId }: { roomId: string }) {
  const { user } = usePrivy();
  const { requestFarcasterSignerFromWarpcast, getFarcasterSignerPublicKey, signFarcasterMessage } =
    useFarcasterSigner();

  // Check if signer already authorized
  const signerPublicKey = user?.linkedAccounts
    .find((a) => a.type === 'farcaster')
    ?.signerPublicKey;

  const authorizeSigner = async () => {
    // Opens Warpcast/Farcaster app for user to approve — one-time
    await requestFarcasterSignerFromWarpcast();
  };

  const castRoomLink = async () => {
    if (!signerPublicKey) {
      await authorizeSigner();
    }

    // Build ExternalEd25519Signer
    const privySigner = {
      scheme: 1,
      getSignerKey: async () => Buffer.from(await getFarcasterSignerPublicKey(), 'hex'),
      signMessageHash: async (hash: Uint8Array) => {
        const sig = await signFarcasterMessage(hash);
        return Buffer.from(sig, 'hex');
      },
    };

    const hub = new HubRestAPIClient({ hubUrl: 'https://hoyt.farcaster.xyz:2281' });
    await hub.submitCast(
      {
        text: `🐠 Live in FISHBOWLZ: "${roomTitle}" — join now`,
        embeds: [{ url: `https://fishbowlz.xyz/rooms/${roomId}` }],
      },
      user.farcaster.fid,
      privySigner
    );
  };

  return <button onClick={castRoomLink}>Share Room to Farcaster</button>;
}
```

**Additional write operations:**
```typescript
// Follow a user (e.g., auto-follow room host after joining)
await hub.followUser(hostFid, user.farcaster.fid, privySigner);

// Like a cast (e.g., react to a song request)
await hub.submitReaction({ type: 1, target: { fid: castFid, hash: castHash } }, userFid, signer);

// Recast a room announcement
await hub.submitReaction({ type: 2, target: { fid: castFid, hash: castHash } }, userFid, signer);
```

**Critical constraints:**
- Requires embedded wallet in **on-device mode** (NOT TEE mode)
- Incompatible with MFA and embedded wallet passwords
- Revoking a signer deletes ALL messages posted by it — warn users

### 2c. Mini App / Frame Auth

FISHBOWLZ as a Farcaster Mini App uses `loginToMiniApp()` — NOT `login()`.

```tsx
import { usePrivy } from '@privy-io/react-auth';
import sdk from '@farcaster/miniapp-sdk';

function MiniAppLogin() {
  const { initLoginToMiniApp, loginToMiniApp } = usePrivy();

  const loginAsMiniApp = async () => {
    const { nonce } = await initLoginToMiniApp();

    // Farcaster app produces a FIP-11 signature
    const { message, signature } = await sdk.actions.signIn({ nonce });

    // Privy verifies + creates session
    await loginToMiniApp({ message, signature });
    // Now user.farcaster.fid is available
  };

  return <button onClick={loginAsMiniApp}>Sign In with Farcaster</button>;
}
```

**Required PrivyProvider config for Mini Apps:**
```tsx
<PrivyProvider
  config={{
    appearance: {
      loginMethods: ['farcaster'], // farcaster must be in loginMethods
    },
  }}
>
```

**Required dashboard setting:** Add `https://farcaster.xyz` to allowed domains.

**Limitation:** Automatic embedded wallet creation is NOT supported inside Farcaster Mini Apps. Create wallets on first external visit, or let users link externally.

### 2d. Privy + Neynar: How They Work Together

Privy handles auth + wallet. Neynar handles social graph + feed + notifications. They are complementary, not competing.

**Pattern:**
```typescript
// After Privy login — user.farcaster.fid is available
const fid = user.farcaster.fid;

// Use Neynar for social data that Privy doesn't provide:
// - Follower/following counts
// - Feed (casts from followed users)
// - Cast lookup by hash
// - Channel membership
// - Notifications
const neynarUser = await neynarClient.fetchBulkUsers({ fids: [fid] });
const followerCount = neynarUser.users[0].follower_count;
const followingCount = neynarUser.users[0].following_count;

// Privy provides what Neynar doesn't:
// - Embedded wallet address
// - Token balances
// - Transaction signing
// - Gas sponsorship
```

**Practical FISHBOWLZ use:** When a user joins a room, Privy gives you their wallet + FID instantly. Use FID to fetch their Neynar profile for social proof (follower count shown in speaker badge). Zero extra auth steps.

---

## Feature 3: Smart Wallets (Account Abstraction)

Privy smart wallets are ERC-4337 compatible accounts on supported EVM chains. Users get a smart contract wallet in addition to their EOA embedded wallet.

**Key capabilities:**
- **Gasless transactions:** You pay gas via a paymaster, user never needs ETH
- **Batched transactions:** Multiple actions in one transaction (e.g., tip + follow + react in 1 tx)
- **Spending policies:** Limit what the wallet can do (max amount per tx, allowed contracts only)
- **Native to Base:** Base Paymaster integration is fully supported

**Setup:**

```tsx
<PrivyProvider
  config={{
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'users-without-wallets',
      },
    },
    // Enable smart wallets (account abstraction)
    smartWallets: {
      enabled: true,
      chains: [
        {
          id: 8453, // Base mainnet
          rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL,
        },
      ],
    },
  }}
>
```

**Gas sponsorship (native, no ZeroDev required):**

```typescript
// Simply add sponsor: true to any sendTransaction call
await sendTransaction({
  to: recipientAddress,
  value: parseEther('0.001'),
  chainId: 8453,
  sponsor: true, // Privy's paymaster covers gas
});
```

**Dashboard setup:**
1. Go to Gas Sponsorship tab in Privy dashboard
2. Enable sponsorship
3. Select chains (Base, Ethereum, etc.)
4. Add ETH/SOL to your sponsorship balance
5. Any tx with `sponsor: true` is automatically covered

**Cost:** Actual network gas costs + Privy convenience fee. No explicit per-tx rate published. On Base (cheap L2), sponsoring 100 transactions costs roughly $0.01–$0.10 total. Contact sales@privy.io for high-volume pricing.

**For FISHBOWLZ:** Sponsor all tipping and room-join transactions on Base. Users experience web2-like UX. At current Base gas prices (~0.001 gwei), sponsoring 10,000 transactions costs ~$5.

---

## Feature 4: Token Gating

Privy does NOT have a built-in token gating UI. Its balance API fetches balances for native tokens (ETH, USDC, USDT, SOL). For custom ERC-20 tokens like ZABAL, use Viem server-side.

**ZABAL token gating pattern:**

```typescript
// src/app/api/fishbowlz/rooms/[id]/join/route.ts
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const ZABAL_CONTRACT = '0x...'; // ZABAL token address on Base
const REQUIRED_BALANCE = 100n * 10n ** 18n; // 100 ZABAL (18 decimals)

const erc20BalanceAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // 1. Verify Privy token, get wallet address
  const claims = await privyClient.utils().auth().verifyAccessToken({ access_token: token });
  const privyUser = await privyClient.getUser(claims.userId);
  const walletAddress = privyUser.wallet?.address;

  if (!walletAddress) {
    return NextResponse.json({ error: 'No wallet found' }, { status: 403 });
  }

  // 2. Check room — does it require token gating?
  const { data: room } = await supabase
    .from('fishbowl_rooms')
    .select('token_gate_required, token_gate_amount')
    .eq('id', params.id)
    .single();

  if (room.token_gate_required) {
    // 3. Read on-chain balance
    const client = createPublicClient({ chain: base, transport: http() });
    const balance = await client.readContract({
      address: ZABAL_CONTRACT,
      abi: erc20BalanceAbi,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    if (balance < REQUIRED_BALANCE) {
      return NextResponse.json(
        { error: 'Insufficient ZABAL balance', required: '100', held: balance.toString() },
        { status: 403 }
      );
    }
  }

  // 4. Grant access
  return NextResponse.json({ access: 'granted' });
}
```

**NFT gating (same pattern with ERC-721):**
```typescript
const erc721BalanceAbi = [
  { name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

const nftBalance = await client.readContract({
  address: NFT_CONTRACT,
  abi: erc721BalanceAbi,
  functionName: 'balanceOf',
  args: [walletAddress as `0x${string}`],
});
// nftBalance > 0n = holds at least 1 NFT
```

**Privy's balance API (for native tokens only):**
```bash
GET https://api.privy.io/v1/wallets/<wallet_id>/balance?chain=base&asset=usdc
# Returns: { raw_value: "1000000", raw_value_decimals: "1.0", chain: "base", asset: "usdc" }
```

Use this for checking USDC balance in premium room fee flows.

---

## Feature 5: Privy Earn (Balance Yield)

Privy Earn connects user wallet balances to curated DeFi yield strategies. Launched in 2025, powered by Morpho vaults with risk management from Steakhouse Financial and Gauntlet. Aave and Kamino also supported.

**What it enables:**
- Users deposit idle ETH/USDC into yield-bearing vaults
- Earn ~4–8% APY on stablecoin balances (varies by vault/market)
- App developers can optionally take a revenue share from vault yield
- Kraken uses this for their "DeFi Earn" product via Privy

**FISHBOWLZ use case (post-MVP, room treasury):**
- Users deposit tips into a shared room vault
- Room creator earns yield on accumulated tips
- Withdraw at room end with earned interest

**Code pattern (Aave via Privy):**
```typescript
import { useSupply, useAaveReserve } from '@aave/react';
import { useSendTransaction } from '@privy-io/react-auth';

// Deposit USDC into Aave v3 on Base (yield ~5% APY)
const { supply } = useSupply({ asset: USDC_BASE, poolAddress: AAVE_POOL_BASE });
await supply({ amount: parseUnits('100', 6) }); // Deposit 100 USDC
```

**Verdict for FISHBOWLZ:** SKIP for MVP. Add in v2 as a "room treasury" feature where rooms can pool tips and earn yield between sessions.

---

## Feature 6: Gas Sponsorship (Full Details)

**Setup (3 steps):**
1. **Dashboard:** Gas Sponsorship tab → enable → select chains
2. **Fund:** Send ETH/SOL to your Privy-managed sponsorship wallet
3. **Code:** Add `sponsor: true` to any transaction

**Supported networks:** Ethereum, Base, Optimism, Arbitrum, Polygon, BNB Smart Chain, Solana, and 13+ other EVM chains. Additional networks: contact sales@privy.io.

**How it works technically:**
- **EVM:** User's embedded wallet is upgraded to a Kernel smart contract. Privy's partnered paymaster covers fees automatically.
- **Solana:** A Privy-managed fee payer wallet funded with SOL covers transaction fees.

**Cost structure:**
- Actual network gas + Privy convenience fee (exact % not public)
- Included in free developer tier for low volume
- Enterprise: custom per-transaction or per-wallet pricing, starting at $0.001/signature

**Practical costs on Base:**
- Base gas is extremely cheap (~0.001 gwei base fee)
- 1,000 sponsored transactions on Base ≈ $0.10–$1.00 total
- Sponsoring all FISHBOWLZ tipping transactions for a hackathon: ~$5

**Policy controls (advanced):**
- Allowlist specific contract addresses
- Cap maximum ETH/USDC per transaction
- Restrict calldata patterns

---

## Feature 7: Webhooks

Privy fires signed webhook payloads to your endpoint for 12 event types.

### Complete Event List

| Category | Event | When it fires |
|----------|-------|--------------|
| **User** | `user.created` | New user signs up — use this to add to Supabase |
| **User** | `user.authenticated` | Every login — use for analytics |
| **User** | `account.linked` | User links a new account (wallet, email, etc.) |
| **User** | `account.unlinked` | User removes an account |
| **User** | `account.updated` | Profile data changes (FID refresh) |
| **User** | `account.transferred` | User transfers their account |
| **Wallet** | `wallet.created` | Embedded wallet created — use to record wallet address |
| **Wallet** | `wallet.private_key_exported` | User exported their key |
| **Wallet** | `wallet.recovery_set` | Recovery method configured |
| **Wallet** | `wallet.recovered` | Wallet recovered |
| **MFA** | `mfa.enabled` | User enabled 2FA |
| **MFA** | `mfa.disabled` | User disabled 2FA |

### Auto-add users to Supabase on signup

```typescript
// src/app/api/webhooks/privy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyPrivyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('privy-signature') ?? '';

  // Verify webhook authenticity
  if (!verifyPrivyWebhook(body, signature, process.env.PRIVY_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === 'user.created') {
    const user = event.data.user;
    const fid = user.farcaster?.fid;
    const walletAddress = user.wallet?.address;

    // Auto-insert into Supabase
    await supabase.from('fishbowl_users').upsert({
      privy_did: user.id,
      fid: fid ?? null,
      username: user.farcaster?.username ?? null,
      pfp: user.farcaster?.pfp ?? null,
      wallet_address: walletAddress ?? null,
      created_at: user.createdAt,
    }, { onConflict: 'privy_did' });
  }

  if (event.type === 'wallet.created') {
    const walletAddress = event.data.wallet.address;
    const userId = event.data.wallet.userId;

    await supabase.from('fishbowl_users')
      .update({ wallet_address: walletAddress })
      .eq('privy_did', userId);
  }

  return NextResponse.json({ ok: true });
}
```

**Setup in dashboard:**
1. Dashboard → Webhooks → Add endpoint
2. Enter `https://fishbowlz.xyz/api/webhooks/privy`
3. Select events: `user.created`, `wallet.created`
4. Copy webhook secret to `.env`

**Cost:** Free on all tiers — webhooks are included.

---

## Feature 8: Cross-App Wallets (Global Wallets)

Privy's cross-app wallet system lets users port their embedded wallet across apps.

### Two Roles

**Provider:** Your app hosts wallets and makes them available to others.
- Config: Dashboard → User management → Global Wallet → "Make my wallet available for other apps"
- Settings: Read-only mode (address only) or Full mode (sign transactions)
- Use: Build network effects — users bring their FISHBOWLZ wallet to other apps in ZAO ecosystem

**Requester:** Your app accesses wallets from other apps.
- Config: Reference provider app IDs in code
- Works with RainbowKit connector via `@privy-io/cross-app-connect`
- Use: Let Zora, OpenSea, Fantasy users join FISHBOWLZ rooms with their existing wallet (no new wallet creation friction)

### FISHBOWLZ Recommendation

**Enable as provider** for the ZAO ecosystem:
- FISHBOWLZ wallet works in ZAO OS, WAVEWARZ, and future ZAO apps
- Users keep one wallet across all ZAO products

**Enable as requester** to accept wallets from:
- Zora (NFT collectors can gate into music rooms)
- OpenSea (NFT holders can verify ownership)
- Any future ZAO partner apps

```typescript
// requester integration via RainbowKit
import { createCrossAppConnector } from '@privy-io/cross-app-connect';

const fishbowlzConnector = createCrossAppConnector({
  // FISHBOWLZ itself as provider
  providerAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
});
```

---

## Feature 9: Farcaster Profile Data (What Privy Returns vs What Needs Neynar)

| Data | Privy Returns | Needs Neynar |
|------|--------------|-------------|
| FID | `user.farcaster.fid` | — |
| Username | `user.farcaster.username` | — |
| Display name | `user.farcaster.displayName` | — |
| Bio | `user.farcaster.bio` | — |
| Profile picture URL | `user.farcaster.pfp` | — |
| Owner ETH address | `user.farcaster.ownerAddress` | — |
| Signer public key | `user.farcaster.signerPublicKey` | — |
| Follower count | — | `neynar.fetchBulkUsers({ fids }).users[0].follower_count` |
| Following count | — | `neynar.fetchBulkUsers({ fids }).users[0].following_count` |
| Recent casts | — | `neynar.fetchCastsForUser({ fid })` |
| Channel memberships | — | `neynar.fetchUserChannels({ fid })` |
| Social graph | — | `neynar.fetchUserFollowers({ fid })` |
| Notifications | — | Neynar webhook or poll |

**Profile cache refresh:** Privy caches at login. To refresh: `POST https://auth.privy.io/api/v1/users/farcaster/refresh` (max 1x per 24 hours per user).

---

## ZAO OS Integration

### Files to Create/Modify for FISHBOWLZ

| File | Action | Purpose |
|------|--------|---------|
| `src/app/fishbowlz/layout.tsx` | MODIFY | Wrap with `PrivyProvider` (dark theme + `#f5a623` gold) |
| `src/lib/auth/privy.ts` | CREATE | `PrivyClient` singleton for server routes |
| `src/app/api/webhooks/privy/route.ts` | CREATE | Handle `user.created` + `wallet.created` → sync to Supabase |
| `src/app/fishbowlz/[id]/page.tsx` | MODIFY | Use `loginToMiniApp()` for Mini App context |
| `src/app/api/fishbowlz/rooms/[id]/join/route.ts` | MODIFY | Add token gating via Viem `readContract` |
| `src/app/api/fishbowlz/tip/route.ts` | CREATE | Accept tip → call `sendTransaction` with `sponsor:true` |
| `src/components/fishbowlz/TipButton.tsx` | CREATE | 1-tap tipping UI using Privy embedded wallet |
| `src/components/fishbowlz/ShareRoom.tsx` | CREATE | Cast room link via `useFarcasterSigner()` |

### ENV Vars (Full Set)

```bash
# Privy (already in Doc 282)
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_app_secret
PRIVY_VERIFICATION_KEY=your_jwt_key       # optional, faster verification

# New for this doc
PRIVY_WEBHOOK_SECRET=your_webhook_secret  # from dashboard → webhooks
```

### Supabase Table Addition

```sql
-- Add columns to fishbowl_users for Privy data
ALTER TABLE fishbowl_users ADD COLUMN IF NOT EXISTS privy_did TEXT UNIQUE;
ALTER TABLE fishbowl_users ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Add token gating to rooms table
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS token_gate_required BOOLEAN DEFAULT FALSE;
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS token_gate_contract TEXT;
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS token_gate_amount TEXT DEFAULT '0';
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS entry_fee_usdc NUMERIC DEFAULT 0;
```

---

## Pricing: Complete Breakdown

| Tier | MAU | Cost | Signatures/mo | Tx Volume/mo |
|------|-----|------|--------------|-------------|
| **Developer (Free)** | 0–499 | $0 | 50,000 | $1M |
| Scale | 500–2,499 | $299/mo | Unlimited | Unlimited |
| Scale | 2,500–9,999 | $499/mo | Unlimited | Unlimited |
| Enterprise | 10,000+ | Custom | Custom | Custom |

**What's free in Developer tier:**
- All embedded wallet features (EVM + Solana)
- All auth methods (Farcaster, wallet, email, SMS, Google, Apple, passkeys)
- Farcaster signers (Privy sponsors signer warps cost)
- Native gas sponsorship (you fund the ETH; Privy convenience fee applies but is not itemized)
- All webhooks (12 event types)
- Cross-app wallet (provider + requester)
- Analytics dashboard
- SDKs: Web (React), Mobile (React Native, iOS, Swift, Android), Unity

**Note:** $0.001/signature on Enterprise — at hackathon scale (<1,000 signatures), this is irrelevant.

**Stripe acquisition (June 2025):** Privy operates as "Privy, a Stripe company." No SDK/pricing changes. Long-term direction is stablecoin payments via Stripe Bridge — likely adds USDC on/off-ramp as a future native feature.

---

## Reference Implementations

| Project | Stars | License | Key Pattern |
|---------|-------|---------|-------------|
| `privy-io/examples` (privy-next-farcaster) | Official | MIT | Farcaster login + write, Next.js App Router |
| `privy-io/privy-frames-v2-demo` | Official | MIT | Mini App / Frames v2 auth pattern (archived Sep 2025) |
| `privy-io/cross-app-connect-demo` | Official | MIT | Cross-app wallet requester setup |
| `privy-io/smart-wallets-starter` | Official | MIT | Smart wallets + gas sponsorship + Next.js |
| Blackbird (production) | N/A | Proprietary | Restaurant loyalty + onchain payments via Privy embedded wallets |
| Kraken DeFi Earn (production) | N/A | Proprietary | Privy Earn / yield vault integration |

---

## Sources

- [Privy Docs — Writing to Farcaster](https://docs.privy.io/recipes/farcaster/writes)
- [Privy Docs — Farcaster Mini Apps](https://docs.privy.io/recipes/farcaster/mini-apps)
- [Privy Docs — Wallets Overview](https://docs.privy.io/wallets/overview)
- [Privy Docs — Gas Sponsorship Overview](https://docs.privy.io/wallets/gas-and-asset-management/gas/overview)
- [Privy Docs — Fetch Balance](https://docs.privy.io/wallets/gas-and-asset-management/assets/fetch-balance)
- [Privy Docs — Global/Cross-App Wallets Overview](https://docs.privy.io/wallets/global-wallets/overview)
- [Privy Docs — Cross-App Wallet Provider Setup](https://docs.privy.io/guide/react/cross-app/provider)
- [Privy Docs — Handling Webhook Events](https://docs.privy.io/user-management/users/webhooks/handling-events)
- [Privy Docs — Yield / Aave Integration](https://docs.privy.io/recipes/yield/aave-guide)
- [Privy Blog — Native Gas Sponsorship Launch](https://privy.io/blog/introducing-privy-native-gas-sponsorship)
- [Privy Blog — Cross-App Wallets Launch](https://privy.io/blog/cross-app-wallet-launch)
- [Privy Pricing Page](https://www.privy.io/pricing)
- [Base Docs — Account Abstraction with Privy + Base Paymaster](https://docs.base.org/learn/onchain-app-development/account-abstraction/account-abstraction-on-base-using-privy-and-the-base-paymaster)
- [Privy Blog — Kraken DeFi Earn](https://privy.io/blog/kraken-launches-defi-earn-with-privy-wallets)
- [Gauntlet + Privy Earn Partnership](https://www.gauntlet.xyz/resources/privy-and-gauntlet-partnership)
- [Farcaster Mini App Auth Docs](https://miniapps.farcaster.xyz/docs/guides/auth)
- [Doc 282 — Privy Auth Integration for FISHBOWLZ](../282-privy-auth-fishbowlz-integration/)
