# 407 - Music NFT Sales via Coinflow: Fiat-to-Mint on Base

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** How to sell music NFTs in ZAO OS where collectors pay with credit card and receive an NFT minted on Base - using Coinflow contract settlement
> **Updates:** Doc 125 (Coinflow SDK), Doc 145 (simple NFT platform), Doc 155 (end-to-end music NFT), Doc 141 (on-chain distribution), Doc 406 (Coinflow ISV)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Fiat checkout for NFTs** | USE Coinflow contract settlement on Base - card payment triggers smart contract mint, collector gets NFT without touching crypto |
| **NFT standard** | USE ERC-1155 (multi-edition) via custom contract on Base - matches Doc 141 recommendation, cheapest for music editions |
| **Storage** | USE Arweave via ArDrive Turbo SDK for permanent audio + art storage (Doc 155). IPFS as cheaper alternative for MVP. |
| **Revenue split** | USE 0xSplits as `payoutRecipient` on mint contract - Artist 80%, ZAO Treasury 10%, Curator 10% (Doc 141/143) |
| **Gas fees** | Coinflow handles gas via gasless transactions - collector pays $0 gas. Only pays card fees + NFT price. |
| **Package** | `@coinflowlabs/react` (npm name changed from `@coinflow/react`) - v5.12.0+ supports Base, card forms, theming |
| **Wallet requirement** | NONE for collector - Coinflow creates/manages wallet. Artist needs wagmi wallet for receiving splits. |

---

## How It Works: Credit Card to Music NFT

```
Collector clicks "Buy" on music NFT ($5)
  |
  v
CoinflowPurchase component opens (card/Apple Pay/Google Pay)
  |
  v
Coinflow processes card payment ($5 + fees)
  |
  v
Coinflow converts fiat -> USDC on Base
  |
  v
Coinflow calls YOUR smart contract with mint function data
  Contract receives USDC approval
  Contract calls transferFrom() to move USDC
  Contract mints ERC-1155 NFT to collector's wallet
  |
  v
USDC flows to 0xSplits contract
  -> Artist: 80% ($4.00)
  -> ZAO Treasury: 10% ($0.50)
  -> Curator: 10% ($0.50)
  |
  v
Webhook fires to /api/payments/coinflow/webhook/route.ts
  -> Record sale in Supabase
  -> Update collector's NFT gallery
  -> Notify artist
```

---

## Smart Contract Architecture

### Three Contracts Interact

| Contract | Role | Who Deploys |
|----------|------|-------------|
| **USDC Contract** (Base) | Receives `approve()` and `transferFrom()` | Already deployed (Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) |
| **Coinflow Contract** | Holds USDC, executes approvals, invokes merchant contract | Coinflow (already deployed) |
| **ZAO Music Mint Contract** | Accepts USDC, mints ERC-1155 NFT to buyer, routes payment to 0xSplits | ZAO deploys on Base |

### ZAO Music Mint Contract (Simplified)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZAOMusicMint is ERC1155 {
    IERC20 public usdc;
    address public splitRecipient; // 0xSplits contract
    
    struct Track {
        uint256 price;      // in USDC (6 decimals)
        uint256 minted;
        uint256 maxSupply;  // 0 = unlimited
        string metadataURI; // Arweave URI
        address artist;
    }
    
    mapping(uint256 => Track) public tracks;
    uint256 public nextTrackId;
    
    // Called by Coinflow contract settlement
    function mintWithUSDC(
        uint256 trackId,
        address buyer
    ) external {
        Track storage track = tracks[trackId];
        require(track.maxSupply == 0 || track.minted < track.maxSupply, "Sold out");
        
        // Coinflow already approved USDC - pull payment
        usdc.transferFrom(msg.sender, splitRecipient, track.price);
        
        // Mint NFT to buyer
        _mint(buyer, trackId, 1, "");
        track.minted++;
    }
    
    // Artist creates a new track listing
    function createTrack(
        uint256 price,
        uint256 maxSupply,
        string calldata metadataURI
    ) external returns (uint256) {
        uint256 id = nextTrackId++;
        tracks[id] = Track(price, 0, maxSupply, metadataURI, msg.sender);
        return id;
    }
}
```

### Contract Must Be Whitelisted

Coinflow requires your contract address whitelisted in merchant settings before it can be called via settlement.

---

## React Implementation

### Install

```bash
npm i @coinflowlabs/react
```

### CoinflowPurchase for Music NFT

```tsx
"use client";

import { CoinflowPurchase } from '@coinflowlabs/react';
import { useAccount } from 'wagmi';
import { encodeFunctionData } from 'viem';

// ABI for mintWithUSDC(uint256 trackId, address buyer)
const MINT_ABI = [{
  name: 'mintWithUSDC',
  type: 'function',
  inputs: [
    { name: 'trackId', type: 'uint256' },
    { name: 'buyer', type: 'address' }
  ],
  outputs: []
}] as const;

interface MusicNFTCheckoutProps {
  trackId: number;
  priceUSD: number; // e.g. 5.00
  trackTitle: string;
  artistName: string;
}

export function MusicNFTCheckout({ trackId, priceUSD, trackTitle, artistName }: MusicNFTCheckoutProps) {
  const { address } = useAccount();

  // Encode the mint function call
  const txData = encodeFunctionData({
    abi: MINT_ABI,
    functionName: 'mintWithUSDC',
    args: [BigInt(trackId), address as `0x${string}`]
  });

  return (
    <CoinflowPurchase
      wallet={{
        address: address!,
        sendTransaction: async (tx) => {
          // Coinflow handles this via contract settlement
          return { hash: '' };
        },
        signMessage: async (msg) => {
          // EIP-712 signing for credits auth
        }
      }}
      merchantId="zao-merchant-id"
      blockchain="base"
      env="sandbox" // "prod" when live
      subtotal={{ cents: priceUSD * 100, currency: 'USD' }}
      settlementType="Credits"
      jwtToken={jwtToken} // from tokenized checkout params
      onSuccess={() => {
        // Refresh NFT gallery, show success toast
        console.log(`Minted track ${trackId} for ${address}`);
      }}
      webhookInfo={{
        trackId,
        trackTitle,
        artistName,
        buyerAddress: address,
        type: 'music_nft_mint'
      }}
      chargebackProtectionData={[{
        productName: trackTitle,
        productType: 'digital_music_nft',
        quantity: 1,
      }]}
      allowedPaymentMethods={['card', 'applePay', 'googlePay', 'usdc']}
    />
  );
}
```

### API Route: Tokenize Checkout (Server-Side)

```typescript
// src/app/api/payments/coinflow/tokenize/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { encodeFunctionData } from 'viem';

const schema = z.object({
  trackId: z.number(),
  buyerAddress: z.string(),
  priceUSD: z.number().min(0.01).max(10000),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { trackId, buyerAddress, priceUSD } = parsed.data;

    const txData = encodeFunctionData({
      abi: MINT_ABI,
      functionName: 'mintWithUSDC',
      args: [BigInt(trackId), buyerAddress as `0x${string}`]
    });

    const res = await fetch('https://api.coinflow.cash/api/checkout/jwt-token', {
      method: 'POST',
      headers: {
        'Authorization': process.env.COINFLOW_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subtotal: { currency: 'USD', cents: Math.round(priceUSD * 100) },
        blockchain: 'base',
        transactionData: {
          transaction: {
            data: txData,
            to: process.env.ZAO_MUSIC_MINT_CONTRACT!, // whitelisted contract
          }
        },
        settlementType: 'Credits',
      }),
    });

    const { jwtToken } = await res.json();
    return NextResponse.json({ jwtToken });
  } catch (error) {
    console.error('Coinflow tokenize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Webhook Handler

```typescript
// src/app/api/payments/coinflow/webhook/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventType, data } = body;

    // Verify HMAC signature
    // TODO: Implement signature verification with webhook secret

    // Deduplication - skip if already processed
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('provider_id', data.id)
      .single();

    if (existing) return NextResponse.json({ ok: true });

    if (eventType === 'Settled') {
      const { webhookInfo, subtotal } = data;

      // Record payment
      await supabaseAdmin.from('payments').insert({
        fid: webhookInfo.buyerFid,
        provider: 'coinflow',
        provider_id: data.id,
        product_type: 'music_nft',
        product_id: `track_${webhookInfo.trackId}`,
        amount_cents: subtotal.cents,
        currency: subtotal.currency,
        status: 'completed',
        metadata: webhookInfo,
      });

      // Update collector's NFT gallery
      await supabaseAdmin.from('nft_collections').insert({
        fid: webhookInfo.buyerFid,
        track_id: webhookInfo.trackId,
        contract_address: process.env.ZAO_MUSIC_MINT_CONTRACT,
        chain: 'base',
        tx_hash: data.transactionHash,
      });
    }

    if (eventType === 'Card Payment Chargeback Opened') {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'disputed' })
        .eq('provider_id', data.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Coinflow webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Comparison: NFT Checkout Options

| Feature | Coinflow | Crossmint | Transak | Direct Crypto |
|---------|----------|-----------|---------|---------------|
| **Fiat cards** | Yes | Yes | Yes | No |
| **Apple/Google Pay** | Yes | Yes | No | No |
| **ACH** | Yes | No | Yes | No |
| **Base chain** | Yes | Yes | Yes | Yes |
| **Gas sponsorship** | Yes (gasless tx) | Yes | No | No |
| **Contract settlement** | Yes (USDC) | Yes (credit card) | No (withdrawal only) | N/A |
| **React SDK** | `@coinflowlabs/react` | `@crossmint/client-sdk-react-ui` | `@transak/transak-sdk` | wagmi/viem |
| **ISV/marketplace** | Yes (ZAO is ISV) | No | No | N/A |
| **Revenue share** | Yes (ISV earns) | No | No | N/A |
| **Music-specific** | No (generic) | No | No | No |
| **Existing relationship** | Yes (Michael, app submitted) | No | No | N/A |
| **Best for ZAO** | **YES** - ISV revenue + fiat bridge + Base + existing relationship | Backup option | Not ideal | Power users only |

---

## The Collector Experience (No Crypto Knowledge Needed)

```
┌──────────────────────────────────────┐
│         ZAO Music Collectible        │
│                                      │
│  [Album Art]   "Summer Vibes"        │
│                by ArtistName         │
│                [>> preview audio]    │
│                                      │
│  Edition: 47/100 collected           │
│  Price: $5.00                        │
│                                      │
│  [>> Collect Now]                    │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Coinflow Checkout           │   │
│  │                              │   │
│  │  [Apple Pay]  [Google Pay]   │   │
│  │                              │   │
│  │  Card: 4242 **** **** ****  │   │
│  │  Exp: 12/28  CVV: ***       │   │
│  │                              │   │
│  │  Total: $5.00 + $0.45 fees  │   │
│  │                              │   │
│  │  [Pay $5.45]                │   │
│  └──────────────────────────────┘   │
│                                      │
│  You'll receive a music NFT on Base  │
│  No wallet needed - we handle it!    │
└──────────────────────────────────────┘
```

Collector does NOT need to:
- Own crypto
- Have a wallet extension
- Understand gas fees
- Know what Base is
- Sign any blockchain transactions

Coinflow handles wallet creation, USDC conversion, gas, and contract interaction.

---

## Revenue Flow with Numbers

### Example: $5 Music NFT

| Step | Amount | Who |
|------|--------|-----|
| Collector pays | $5.45 | (price + ~9% fees) |
| Coinflow fees | ~$0.45 | Coinflow (card processing + service) |
| USDC to 0xSplits | $5.00 | On-chain |
| Artist receives | $4.00 (80%) | Via 0xSplits |
| ZAO Treasury | $0.50 (10%) | Via 0xSplits |
| Curator receives | $0.50 (10%) | Via 0xSplits |
| ZAO ISV revenue share | TBD% of fees | Via Coinflow Launchpad |

### At Scale: 100 Music NFTs Sold

| Metric | Value |
|--------|-------|
| Gross revenue | $500 |
| Artist payouts | $400 |
| ZAO Treasury | $50 |
| Curator payouts | $50 |
| Coinflow fees (est.) | ~$45 |
| ZAO ISV share (est.) | ~$10-15 |
| Net to ZAO | $60-65 (treasury + ISV share) |

---

## Implementation Steps

| # | Step | Effort | Dependency |
|---|------|--------|------------|
| 1 | Deploy ZAO Music Mint contract on Base testnet | 4 hrs | Solidity dev |
| 2 | Whitelist contract in Coinflow merchant settings | 30 min | Coinflow dashboard access |
| 3 | Set up 0xSplits contract for default artist split | 1 hr | Doc 143 |
| 4 | Build `MusicNFTCheckout` component | 3 hrs | `@coinflowlabs/react` |
| 5 | Build tokenize API route | 2 hrs | Coinflow API key |
| 6 | Build webhook handler | 2 hrs | Webhook secret |
| 7 | Build artist upload flow (Doc 155 screens) | 6 hrs | ArDrive Turbo SDK |
| 8 | Build collector NFT gallery view | 4 hrs | Supabase `nft_collections` table |
| 9 | Test end-to-end in sandbox | 2 hrs | Sandbox card numbers |
| 10 | Deploy contract to Base mainnet + go live | 2 hrs | Coinflow prod approval |
| **Total** | | **~26 hrs** | |

---

## Files to Create

| File | Purpose |
|------|---------|
| `contracts/ZAOMusicMint.sol` | ERC-1155 mint contract with USDC payment |
| `src/components/music/MusicNFTCheckout.tsx` | Coinflow checkout wrapper for music NFTs |
| `src/app/api/payments/coinflow/tokenize/route.ts` | Server-side checkout param tokenization |
| `src/app/api/payments/coinflow/webhook/route.ts` | Webhook handler for payment events |
| `src/components/music/ArtistMintForm.tsx` | 3-screen upload flow (Doc 155) |
| `src/components/music/CollectorGallery.tsx` | NFT gallery for collectors |
| `src/lib/payments/coinflow.ts` | Coinflow client helpers |

---

## Environment Variables

```env
# Server-only (NEVER expose to browser)
COINFLOW_API_KEY=...
COINFLOW_WEBHOOK_SECRET=...
ZAO_MUSIC_MINT_CONTRACT=0x...  # Base contract address

# Client-safe
NEXT_PUBLIC_COINFLOW_MERCHANT_ID=...
NEXT_PUBLIC_COINFLOW_ENV=sandbox  # or prod
```

---

## Sources

- [Coinflow USDC to EVM Contract Guide](https://docs.coinflow.cash/guides/checkout/implementation-overview/implementation-guides/credit-purchase-usdc-to-evm-contract)
- [Coinflow React SDK - GitHub](https://github.com/coinflow-labs-us/coinflow-react)
- [@coinflowlabs/react - npm](https://www.npmjs.com/package/@coinflowlabs/react)
- [Coinflow Supported Tokens & Chains](https://docs.coinflow.cash/guides/checkout/payment-methods/payment-methods/crypto-payments/supported-tokens-and-chains)
- [Coinflow Getting Started](https://docs.coinflow.cash/guides/checkout/implementation-overview/getting-started-with-implmentation)
- [Coinflow EVM NFT Purchases Announcement](https://www.linkedin.com/posts/coinflow-labs_coinflow-announces-support-for-evm-nft-purchases-activity-7152715383248982016-dS6W)
- [Doc 125 - Coinflow SDK](../../business/125-coinflow-fiat-checkout/)
- [Doc 141 - On-Chain Music Distribution](../141-onchain-music-distribution-landscape/)
- [Doc 145 - Simple NFT Platform Design](../145-simple-nft-platform-design/)
- [Doc 155 - End-to-End Music NFT](../155-music-nft-end-to-end-implementation/)
- [Doc 406 - Coinflow ISV Deep Dive](../../business/406-coinflow-isv-deep-dive-wavewarz-zao/)
