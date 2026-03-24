# 125 — Coinflow Fiat Checkout for ZAO OS

> **Status:** Research complete
> **Date:** March 24, 2026
> **Goal:** Evaluate Coinflow as a fiat-to-crypto checkout solution for ZAO OS (memberships, music purchases, WaveWarZ entries)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use Coinflow?** | YES — fiat on-ramp with card/ACH/Apple Pay that settles directly to USDC on EVM chains (Base, Arbitrum). Perfect for ZAO's non-crypto-native artists |
| **Settlement** | Use **EVM contract settlement** on Base (ZAO's primary chain) — Coinflow sends USDC directly to your smart contract |
| **Integration method** | `@coinflow/react` npm package — `CoinflowPurchase` React component, works with wagmi/viem |
| **Payment methods** | Cards (Visa/MC/Amex/Discover), ACH, Apple Pay, Google Pay, PIX — covers global artist community |
| **Credits system** | Consider Coinflow Credits for in-app currency (pre-loaded USD wallet, non-withdrawable, no expiration) — good for WaveWarZ battles or music tips |
| **Webhooks** | 24+ event types with HMAC signature verification — use for confirming purchases in Supabase |
| **Not yet in codebase** | Zero Coinflow references in `src/`. This is net-new integration work |

---

## How Coinflow Checkout Works

### One-Time Purchase Flow

```
User submits payment info
  → Coinflow authorizes via payment processor + fraud checks
  → Funds settle to merchant settlement location (USDC on-chain OR credits)
  → Webhook fires to your API endpoint
  → User receives goods/services
```

### Credits Purchase Flow (Alternative)

```
User pays via card/ACH/Apple Pay
  → Coinflow issues credits (1:1 USD)
  → Credits stored in Coinflow digital wallet
  → User redeems credits for in-app purchases
  → Coinflow converts credits → USDC → deposits to merchant wallet
```

Credits are: non-withdrawable, non-transferable, platform-locked, no expiration.

### Rate Limiting

- 5 failed checkout attempts per 10 minutes per user

---

## EVM Settlement: How It Works On-Chain

This is the critical flow for ZAO OS on Base:

### Transaction Lifecycle

1. **User submits card info** → Coinflow authorizes + chargeback validation
2. **Contract preparation** → Coinflow contract receives: USDC approval amount, merchant contract address, function call data
3. **Token approval** → Coinflow calls `approve()` on USDC contract for merchant contract access
4. **Merchant invocation** → Coinflow calls merchant contract with provided function data
5. **Settlement** → Merchant contract calls `transferFrom()` on USDC to move funds to recipient

### Smart Contract Architecture

Three contracts interact:

| Contract | Role |
|----------|------|
| **USDC Contract** | Receives `approve()` and `transferFrom()` calls |
| **Coinflow Contract** | Holds USDC, executes approvals, invokes merchant contracts |
| **Merchant Contract (yours)** | Handles payment fulfillment, NFT distribution, must embed end-user wallet address in function params |

### Error Handling

- **Upfront simulation** — Coinflow simulates transactions before executing to catch failures
- **`revertReason`** — returned in response for debugging
- **Common error:** `"INSUFFICIENT FUNDS TO REDEEM"` = balance too low
- **Debugging tools:** Tenderly for detailed tx failure analysis
- **Validation:** Verify `to` matches Coinflow contract, `from` matches USDC-paying wallet

---

## Supported Chains & Settlement Options

| Chain | Contract Settlement | Wallet Settlement | Credits |
|-------|-------------------|-------------------|---------|
| **Base** | Yes | Yes | Yes |
| **Ethereum** | Yes | Yes | Yes |
| **Polygon** | Yes | Yes | Yes |
| **Arbitrum** | Yes | Yes | Yes |
| **Monad** | Yes | Yes | Yes |
| **Solana** | Yes (programs) | Yes | Yes |
| **Stellar** | Yes (Soroban) | No | Yes |

**ZAO OS should use Base** — matches existing chain (Respect tokens on Optimism/Base).

### Settlement Types

| Type | Description | Best For |
|------|-------------|----------|
| **Contract** | USDC sent to your smart contract, triggers function call | NFT mints, membership purchases, complex logic |
| **Merchant Wallet** | USDC sent directly to a wallet address | Simple payments, tips |
| **Coinflow Wallet** | Coinflow manages the funds (recommended by Coinflow) | Credits system, managed balances |

---

## React SDK Integration

### Package

```bash
npm install @coinflow/react
```

### Core Component: `CoinflowPurchase`

```tsx
"use client";

import { CoinflowPurchase } from '@coinflow/react';

// For EVM chains (Base/Arbitrum)
<CoinflowPurchase
  wallet={wallet}                    // Wagmi wallet adapter
  merchantId="your-merchant-id"      // From Coinflow dashboard
  blockchain="base"                  // "base" | "ethereum" | "polygon" | "arbitrum"
  env="prod"                         // "prod" | "sandbox" | "staging"
  amount={25}                        // Fixed amount in USD
  settlementType="USDC"              // "Credits" | "USDC" | "Bank"
  onSuccess={() => handleSuccess()}  // Callback on completion
  webhookInfo={{ userId, productId }} // Custom metadata passed to webhooks
  email={user.email}                 // Pre-populate email
  disableApplePay={false}
  disableGooglePay={false}
/>
```

### Key Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `wallet` | Wallet | Yes | Wallet adapter (wagmi for EVM) |
| `merchantId` | string | Yes | Your Coinflow merchant ID |
| `blockchain` | string | Yes | Target chain |
| `env` | string | No | Environment (default: `prod`) |
| `amount` | number | No | Fixed purchase amount (USD) |
| `settlementType` | string | No | `"Credits"` / `"USDC"` / `"Bank"` |
| `onSuccess` | function | No | Success callback |
| `webhookInfo` | object | No | Custom metadata for webhook payloads |
| `email` | string | No | Pre-fill customer email |
| `chargebackProtectionData` | array | No | Product details for chargeback protection |
| `customerInfo` | object | No | Customer demographics for KYC |
| `token` | string | No | Payment token (default: USDC) |
| `transaction` | Transaction | No | On-chain tx to execute (for contract settlement) |

### EVM-Specific Notes

- Supports permit-based transactions (EIP-2612) by default
- Disable with `usePermit: false` to fall back to standard `approve` flow
- No hard dependency on wagmi/ethers — generic EVM wallet interface

---

## Webhooks

### Event Types (24+)

**Card/Apple Pay/Google Pay:**
- `Settled` — payment complete
- `Card Payment Authorized` — card charged successfully
- `Card Payment Declined` — card rejected
- `Card Payment Suspected Fraud` — flagged for review
- `Payment Pending Review` — manual review needed

**Chargebacks:**
- `Card Payment Chargeback Opened`
- `Card Payment Chargeback Won`
- `Card Payment Chargeback Lost`

**ACH:**
- `ACH Initiated` → `ACH Batched` → `Settled`
- `ACH Returned` / `ACH Failed`

**PIX:** `Settled`, `PIX Failed`, `PIX Expiration`

**Crypto:** `USDC Payment Received`, `Crypto Overpayment`, `Crypto Underpayment`

**Subscriptions:** `Created`, `Canceled`, `Expired`, `Failure`, `Concluded`

**Other:** `Refund`, `Payment Expiration`

### Webhook Payload Structure

```json
{
  "eventType": "Settled",
  "category": "Purchase",
  "created": "2026-03-24T12:00:00Z",
  "data": {
    "id": "txn_abc123",
    "signature": "hmac_signature_for_verification",
    "webhookInfo": { "userId": "...", "productId": "..." },
    "subtotal": { "cents": 2500, "currency": "USD" },
    "fees": { "cents": 75, "currency": "USD" },
    "gasFees": { "cents": 5, "currency": "USD" },
    "chargebackProtectionFees": { "cents": 0, "currency": "USD" },
    "total": { "cents": 2580, "currency": "USD" },
    "merchantId": "your_merchant_id",
    "customerId": "cust_xyz"
  }
}
```

### Implementation Notes

- **Deduplication required** — webhooks may fire more than once
- **HMAC signature verification** — validate `data.signature` field
- All monetary values in **cents** with currency code
- `webhookInfo` contains your custom metadata (pass user IDs, product IDs, etc.)

---

## ZAO OS Integration Plan

### Use Cases

| Use Case | Settlement Type | Flow |
|----------|----------------|------|
| **ZAO Membership purchase** | Contract (mint NFT) | Card → USDC → contract mints membership NFT |
| **WaveWarZ battle entry** | Credits or USDC | Card → credits → redeem for battle stakes |
| **Music tips / support** | Wallet | Card → USDC → artist wallet |
| **Merch / digital goods** | Wallet or Contract | Card → USDC → merchant |

### Implementation Steps

1. **Sign up** at Coinflow, get `merchantId`
2. **Install** `@coinflow/react`
3. **Create API route** `src/app/api/payments/webhook/route.ts` — handle Coinflow webhook events, verify HMAC, update Supabase
4. **Create component** `src/components/payments/CoinflowCheckout.tsx` — wrap `CoinflowPurchase` with ZAO styling
5. **Deploy contract** (if using contract settlement) — Base USDC receiver that mints membership NFTs
6. **Configure webhooks** in Coinflow dashboard pointing to your API route
7. **Add deduplication** — store `data.id` in Supabase `payments` table, skip duplicates

### Supported Payment Methods for ZAO

| Method | Availability | Notes |
|--------|-------------|-------|
| Visa/MC/Amex/Discover | Global | Primary method |
| Apple Pay | iOS/Safari | Great for mobile-first ZAO |
| Google Pay | Android/Chrome | Great for mobile-first ZAO |
| ACH | US only | Lower fees, slower settlement |
| PIX | Brazil only | Instant, popular in LATAM music scene |
| SEPA | EU | Good for European artists |

---

## What's NOT in the Docs

- **Specific fee percentages** — not published, likely custom per merchant
- **Webhook retry policy** — not documented (assume at-least-once delivery)
- **Rate limits on API** — only checkout attempts (5/10min) documented
- **Contract whitelisting process** — mentioned but no steps given
- **KYC thresholds** — references Sumsub/Persona integration but no dollar limits

---

## Sources

- [Coinflow Checkout Overview](https://docs.coinflow.cash/guides/checkout/checkout-overview/how-checkout-works)
- [EVM Transactions In-Depth](https://docs.coinflow.cash/guides/checkout/settlement-locations/evm-transactions-in-depth)
- [Settlement Locations](https://docs.coinflow.cash/guides/checkout/settlement-locations)
- [React Environment Properties](https://docs.coinflow.cash/guides/developer-resources/checkout-implementation/developer-react-environment-properties)
- [Checkout Webhooks](https://docs.coinflow.cash/guides/checkout/checkout-webhooks)
- [GitHub: coinflow-labs-us/coinflow-react](https://github.com/coinflow-labs-us/coinflow-react)
- [Coinflow Docs Home](https://docs.coinflow.cash)
