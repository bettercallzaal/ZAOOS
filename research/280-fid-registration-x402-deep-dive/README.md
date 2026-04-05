# 280 — FID Registration & x402 Deep Dive: How to Give ZAO Agents a Farcaster Identity

> **Status:** Research complete
> **Date:** 2026-04-05
> **Goal:** Map every path to registering a Farcaster FID for CASTER agent, understand why fid-forge x402 failed, and determine the cheapest/fastest approach

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Registration method** | USE direct on-chain via `rishavmukherji/farcaster-agent` pattern — $7 storage + ~$0.25 gas on Optimism, no intermediary, full control. We already have the wallet and viem. |
| **Why NOT fid-forge** | SKIP fid-forge — their x402 implementation returns empty `{}` on 402 (missing `x402Version` and `accepts` fields the spec requires). Their Stripe fallback works but adds unnecessary dependency for a $7 on-chain call. |
| **Why NOT Neynar register** | SKIP Neynar account registration — requires `x-wallet-id` (Neynar wallet pre-funding), $5+ ETH on Optimism, mnemonic-based signing, and their custody model. Over-engineered for an agent FID. |
| **Signer approach** | USE self-signed key request via KeyGateway — generates Ed25519 keypair locally, registers via EIP-712 signed metadata. No Neynar dependency for the signer itself. |
| **x402 for API calls** | USE `x402-fetch` (v1.1.0, already installed) for Neynar hub API calls AFTER registration — $0.001 USDC/call on Base, standard spec works fine with Neynar's hub. fid-forge was the broken one, not x402 itself. |
| **Funding** | SEND ~$10 ETH to `0x3D04...` on Optimism (not Base). The $2 USDC already on Base stays for x402 hub calls later. Registration is ETH on Optimism, not USDC on Base. |
| **Hub for profile setup** | USE `crackle.farcaster.xyz:3383` — official Farcaster hub, well-synced. Pinata hub lags on new FID recognition. |

## Comparison of FID Registration Methods

| Method | Cost | Chain | Dependencies | x402 Support | Agent-Friendly | ZAO Fit |
|--------|------|-------|-------------|-------------|----------------|---------|
| **Direct on-chain** (IdGateway.register) | $7 storage + ~$0.25 gas | Optimism | viem, @farcaster/hub-nodejs | N/A (no x402 needed) | YES — full control, no intermediary | **BEST** |
| **fid-forge** (fidforge.11211.me) | ~$2 Stripe or x402 | Optimism (via service) | fid-forge API | BROKEN — 402 returns `{}`, missing spec fields | PARTIAL — good API but x402 non-standard | SKIP |
| **Neynar register** (POST /v2/farcaster/user) | $5+ ETH pre-fund | Optimism (via Neynar) | Neynar API key, wallet-id, mnemonic | N/A | NO — requires mnemonic, custody model | SKIP |
| **Warpcast app** (manual) | $7 | Optimism | Manual browser flow | N/A | NO — not programmatic | SKIP |

## Why fid-forge x402 Failed (Root Cause)

The x402 spec (Coinbase, v2) requires the 402 response body to contain:

```json
{
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "network": "base",
      "maxAmountRequired": "1000000",
      "resource": "...",
      "payTo": "0x...",
      ...
    }
  ]
}
```

fid-forge's 402 response returns:
```json
{}
```

The `x402-fetch` library (line 39 of `dist/cjs/index.js`) does `const { x402Version, accepts } = await response.json()` — and then tries `accepts.map(...)` on `undefined`, which throws `TypeError: Cannot read properties of undefined (reading 'map')`.

**fid-forge advertises x402 support but doesn't implement the standard response format.** Their x402 endpoint is effectively broken for any standard x402 client.

## The Direct On-Chain Path (What We Should Do)

### Architecture

```
1. Fund wallet with ~$10 ETH on Optimism
2. Call IdGateway.register(recovery) → get FID
3. Generate Ed25519 signer keypair
4. Sign EIP-712 metadata with custody wallet
5. Call KeyGateway.add(keyType, key, metadataType, metadata) → signer registered
6. Register fname via fnames.farcaster.xyz/transfers (EIP-712 sign)
7. Set profile via hub messages (UserDataAdd)
8. Post welcome cast via hub (CastAdd)
```

### Contract Addresses (Optimism Mainnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| IdGateway | `0x00000000Fc25870C6eD6b6c7E41Fb078b7656f69` | FID registration |
| IdRegistry | `0x00000000Fc6c5F01Fc30151999387Bb99A9f489b` | FID ownership lookup |
| KeyGateway | `0x00000000fC56947c7E7183f8Ca4B62398CaAdf0B` | Signer key registration |
| KeyRegistry | `0x00000000Fc1237824fb747aBDE0FF18990E59b7e` | Signer key lookup |
| SignedKeyRequestValidator | `0x00000000FC700472606ED4fA22623Acf62c60553` | Metadata encoding for self-signed keys |

### Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Storage (1 unit, required) | $7 USD in ETH | Price from IdGateway.price(), includes 1-year storage |
| IdGateway.register() gas | ~$0.05 | Optimism L2 gas is cheap |
| KeyGateway.add() gas | ~$0.05 | Second transaction |
| fname registration | $0 | Free API call + EIP-712 signature |
| Profile setup | $0 | Hub messages, no gas |
| **Total** | **~$7.30 ETH on Optimism** | One-time cost, FID is permanent |

### Key Dependencies

```json
{
  "viem": "^2.x",
  "@farcaster/hub-nodejs": "^0.12.x",
  "@noble/ed25519": "^1.6.x"
}
```

All three are already installed in ZAO OS.

## x402 Is Fine — Just Not for fid-forge

x402 works correctly for its intended use: **paying for API calls after registration**. The breakdown:

| Use Case | x402 Status | Notes |
|----------|-------------|-------|
| Neynar hub API (hub-api.neynar.com) | WORKS | $0.001 USDC/call on Base, standard spec |
| fid-forge registration | BROKEN | Non-standard 402 response body |
| publish.new marketplace | WORKS | Agent buying/selling digital goods |
| Future Neynar MCP | EXPECTED | Neynar planning x402 MCP server support |

The `x402-fetch` package (v1.1.0) already installed works with any spec-compliant x402 server. The $2 USDC Zaal sent to Base is ready for Neynar hub calls once CASTER has a FID.

### How x402-fetch Works (from source, line 32-71)

```typescript
// 1. Make initial request
const response = await fetch(input, init);
if (response.status !== 402) return response; // Not paywalled

// 2. Parse payment requirements from 402 body
const { x402Version, accepts } = await response.json();
// ↑ This is where fid-forge fails — returns {} instead

// 3. Select matching payment scheme for our network
const selectedRequirements = selectPaymentRequirements(accepts, network, "exact");

// 4. Sign the payment authorization (EIP-3009 for USDC)
const paymentHeader = await createPaymentHeader(walletClient, x402Version, selectedRequirements);

// 5. Retry with X-PAYMENT header
return fetch(input, { ...init, headers: { "X-PAYMENT": paymentHeader } });
```

## ZAO OS Integration

### Existing Files That Help
- `scripts/generate-wallet.ts` — already generated the wallet (`0x3D04...`)
- `src/lib/fc-identity.ts` — FC identity gating (quality score + FID resolver)
- `src/lib/farcaster/neynar.ts` — Neynar SDK client (for post-registration API calls)
- `community.config.ts` — app FID 19640 (Zaal's FID, CASTER needs its own)
- `node_modules/x402-fetch` — v1.1.0 installed, works for standard x402 servers
- `node_modules/@noble/ed25519` — v1.6.1 installed for signer key generation

### Script to Create (replaces broken fid-forge script)

`scripts/register-caster-fid-onchain.ts` — Direct on-chain registration:

```typescript
// Phase 1: Register FID
// - Call IdGateway.price() to get current cost
// - Call IdGateway.register(recoveryAddress) with msg.value = price
// - Read IdRegistry.idOf(address) to get assigned FID

// Phase 2: Add Signer Key
// - Generate Ed25519 keypair
// - Sign EIP-712 SignedKeyRequest with custody wallet
// - Encode metadata via SignedKeyRequestValidator
// - Call KeyGateway.add(1, pubkey, 1, metadata)

// Phase 3: Register Username
// - Sign EIP-712 UserNameProof (chainId: 1, Ethereum mainnet)
// - POST to fnames.farcaster.xyz/transfers

// Phase 4: Set Profile + Welcome Cast
// - Connect to crackle.farcaster.xyz:3383
// - Submit UserDataAdd messages (USERNAME, DISPLAY, PFP, BIO, URL)
// - Submit CastAdd with welcome text to /agents channel
```

### Post-Registration: Neynar x402 for Ongoing API Calls

After CASTER has a FID + signer, use `x402-fetch` for Neynar hub API calls:

```typescript
import { wrapFetchWithPayment, createSigner } from 'x402-fetch';

const signer = await createSigner('base', AGENT_WALLET_PRIVATE_KEY);
const payingFetch = wrapFetchWithPayment(fetch, signer);

// This auto-handles 402 and pays $0.001 USDC per call
const response = await payingFetch('https://hub-api.neynar.com/v1/submitMessage', {
  method: 'POST',
  body: castMessage,
});
```

## What Zaal Needs to Do

1. **Bridge ~$10 ETH to Optimism** for the wallet address `0x3D041C14Eb8c803D2bE39d7576C27D6Bd1966604`
   - Use the [Optimism Bridge](https://app.optimism.io/bridge) or any cross-chain bridge
   - The $7 storage fee is the bulk; rest is gas
2. Tell me when the ETH is on Optimism — I'll run the on-chain registration script

**The $2 USDC on Base is NOT wasted** — it stays in the wallet for x402 Neynar hub API calls ($0.001/call = 2,000 casts).

## Reference Implementations

| Project | License | Key Pattern | What We Borrow |
|---------|---------|-------------|----------------|
| [rishavmukherji/farcaster-agent](https://github.com/rishavmukherji/farcaster-agent) | MIT | Direct IdGateway.register() + KeyGateway.add() | Full registration flow, self-signed key metadata encoding |
| [coinbase/x402](https://github.com/coinbase/x402) | Apache-2.0 | x402-fetch client, EIP-3009 payment signing | Post-registration hub API payments |
| [farcasterxyz/hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) | MIT | @farcaster/hub-nodejs, NobleEd25519Signer | Profile setup + cast submission via hub |

## Sources

- [Farcaster IdGateway Docs](https://docs.farcaster.xyz/reference/contracts/reference/id-gateway)
- [Farcaster Hello World Guide](https://docs.farcaster.xyz/developers/guides/basics/hello-world)
- [rishavmukherji/farcaster-agent (MIT)](https://github.com/rishavmukherji/farcaster-agent)
- [Coinbase x402 Protocol Spec](https://github.com/coinbase/x402)
- [x402-fetch npm package](https://www.npmjs.com/package/x402-fetch)
- [fid-forge API (llms.txt)](https://fidforge.11211.me/llms.txt)
- [Neynar Create Account Guide](https://docs.neynar.com/docs/how-to-create-a-new-farcaster-account-with-neynar)
- [Neynar x402 Vision](https://neynar.com/blog/agents-frames-and-the-future-of-farcaster-neynar-s-vision-for-x402)
- [ERC-8004 Trustless Agents (EIP)](https://eips.ethereum.org/EIPS/eip-8004)
- [Farcaster Contracts (GitHub)](https://github.com/farcasterxyz/contracts)
