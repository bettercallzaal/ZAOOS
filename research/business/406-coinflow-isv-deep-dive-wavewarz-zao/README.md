# 406 - Coinflow ISV Deep Dive: WaveWarZ + ZAO Integration

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Deep dive on Coinflow ISV program, Launchpad accelerator, supported chains/tokens, and implementation plan for both WaveWarZ (merchant) and ZAO (ISV)
> **Updates:** Doc 125 (Coinflow SDK), Doc 222 (payment infrastructure comparison)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **ZAO as ISV** | YES - ZAO submitted ISV application via Launchpad (April 2026). ISV path = revenue share on every WaveWarZ + ZAO OS transaction. This is the right structure. |
| **WaveWarZ as submerchant** | YES - merchantID `wavestation` already assigned. WaveWarZ is a submerchant under ZAO ISV umbrella. Hurricane building MVP. |
| **Chain for WaveWarZ** | USE Solana - Hurricane asked about it, Coinflow covers all Solana tx fees, cheapest option. WaveWarZ prediction markets benefit from fast finality. |
| **Chain for ZAO OS** | USE Base - matches existing infra (Respect tokens, ZOUNZ on Base/Optimism). Coinflow supports Base with 17+ tokens including DEGEN, HIGHER, MOXIE. |
| **Settlement type** | USE contract settlement for NFT mints/memberships, wallet settlement for tips/simple payments, credits for WaveWarZ battle entries |
| **Integration priority** | WaveWarZ first (Hurricane building MVP), ZAO OS second (broader payment infra per Doc 222 dual-rail plan) |
| **Launchpad benefits** | TAKE the $0 setup, interchange-plus pricing, named engineer support, co-marketing. No equity taken, no cohort schedule. |

---

## Relationship Context (from Chat)

**Coinflow contact:** Michael (sales/onboarding)
**Timeline:**
- Initial alignment call happened (Zaal + Hurricane + Michael)
- Michael sent pricing email + onboarding application
- WaveWarZ merchantID assigned: `wavestation`
- ZAO ISV application submitted via coinflow.cash/launchpad/
- Michael offered dedicated call to discuss both WaveWarZ + ZAO deeper
- Hurricane delegating tasks to focus on WaveWarZ MVP build

**Key relationship notes:**
- Michael responsive, follows up consistently
- Offered separate merchantID or onboarding for ZAO (not mixed with WaveWarZ)
- Willing to loop in relevant parties for technical questions
- ZAO positioned as incubator that founded WaveWarZ

---

## Coinflow Launchpad ISV Program

### Eligibility (ZAO qualifies)

| Requirement | ZAO Status |
|-------------|------------|
| ARR under $10M | Yes (pre-revenue) |
| 20-1,000 submerchants | Path to 20+ (WaveWarZ, COC Concertz, FISHBOWLZ, future communities) |
| Typical ACV $1K-$5K | Fits community platform model |
| Online card/ACH payments | Yes |

### Benefits ZAO Gets

| Benefit | Detail |
|---------|--------|
| **$0 setup fees** | No platform fees, no setup costs |
| **Interchange-plus pricing** | ~30% more revenue share vs flat-rate models. Day one. |
| **Instant settlement** | Stablecoin-powered, same-transaction settlement for submerchants |
| **Named engineer** | 24/7 integration support from dedicated Coinflow engineer |
| **Automated KYC/KYB** | Coinflow handles submerchant onboarding via Persona |
| **Payment splitting** | Automatic splits at transaction time (artist/platform/treasury) |
| **Co-marketing** | Social amplification, partner network introductions |
| **Quarterly check-ins** | Growth partnership with architecture reviews |
| **Bespoke features** | Coinflow builds features for your specific use case |
| **No equity** | Not a traditional accelerator. No cohort, no demo day. |

### Application Timeline

1. Application submitted (done - April 2026)
2. 30-minute ISV specialist call (pending)
3. Integration phase (days to weeks, at your pace)
4. Ongoing quarterly growth partnership

---

## Supported Chains & Tokens (Full List)

### Base (ZAO OS primary chain)

| Category | Tokens |
|----------|--------|
| **Major** | ETH, AERO, cbBTC |
| **Stablecoins** | EURC, GTT, USDC |
| **Volatile** | $MFER, 9-5, BUILD, CLANKER, CRASH, DEGEN, DOG, DOGINME, FARTHER, HIGHER, HUNT, LUM, MOXIE, ONCHAIN, TALENT, TN100X, TYBG |

**ZAO-relevant tokens on Base:** DEGEN, HIGHER, MOXIE, BUILD - all Farcaster ecosystem tokens ZAO members hold.

### Solana (WaveWarZ primary chain)

| Category | Tokens |
|----------|--------|
| **Major** | SOL |
| **Stablecoins** | USDC |

**Coinflow covers ALL Solana transaction fees** - zero cost to WaveWarZ for processing.

### Other Supported Chains

| Chain | Majors | Stablecoins |
|-------|--------|-------------|
| **Ethereum** | ETH, ARB, POL, SAND, UNI | USDC, USDGLO, USDT, DAI |
| **Optimism** | ETH, OP, WETH | USDC, USDGLO, USDT, DAI, LUSD |
| **Arbitrum** | ETH, ARB, WETH | USDC, USDGLO |
| **Polygon** | POL, AAVE, SAND, UNI, WETH | USDC, USDC.e, USDGLO, DAI |
| **Avalanche** | AVAX, WETH | EURC, USDC |
| **Bitcoin** | BTC | - |

---

## February 2026 Platform Updates

| Feature | Impact for ZAO/WaveWarZ |
|---------|------------------------|
| **Smart Payment Orchestration** | 2.3 processors per transaction, auto-failover, up to 6bps cost reduction |
| **PayPal/Venmo Payouts** | Alternative payout method for artists who prefer PayPal |
| **ACH Pay-In via Braid** | Lower-cost payment option for higher-value ZAO Stock tickets |
| **Monad Integration** | USDC + gas-sponsored payments on Monad |
| **Persona KYC Sharing** | Reusable identity verification - faster onboarding for submerchants |
| **Geographic Controls** | State-level purchase restrictions for compliance |
| **Merchant Invoicing** | Self-serve billing, settlement balance payments |

---

## Integration Architecture: ZAO as ISV

```
                    ZAO (ISV)
                    Launchpad
                       |
          +------------+------------+
          |            |            |
     WaveWarZ     ZAO OS      Future Apps
     (Solana)     (Base)     (COC Concertz,
   merchantID:               FISHBOWLZ, etc.)
   "wavestation"
          |            |
    +-----+----+  +----+-----+
    |          |  |          |
  Battles   Entry Membership  Tips
  (Credits) (USDC) (Contract) (Wallet)
```

### WaveWarZ Implementation (Solana)

| Use Case | Settlement | Flow |
|----------|-----------|------|
| Battle entry fee | Credits | Card -> Credits -> redeem for battle stake |
| Artist tips | Wallet | Card -> USDC -> artist wallet on Solana |
| Merch/digital | Wallet | Card -> USDC -> merchant wallet |

### ZAO OS Implementation (Base)

| Use Case | Settlement | Flow |
|----------|-----------|------|
| Membership NFT | Contract | Card -> USDC -> contract mints NFT on Base |
| ZAO Stock tickets | Contract | Card -> USDC -> contract mints attendance NFT |
| Music tips | Wallet | Card -> USDC -> artist wallet on Base |
| ZABAL purchases | Credits | Card -> Credits -> redeem for ZABAL tokens |

---

## SDK Integration (3 Paths)

### Path 1: Checkout Link (fastest, no frontend code)

Generate hosted checkout URL, redirect users. Good for WaveWarZ MVP.

### Path 2: React SDK (recommended for ZAO OS)

```tsx
"use client";
import { CoinflowPurchase } from '@coinflow/react';

<CoinflowPurchase
  wallet={wallet}
  merchantId="wavestation"  // or ZAO merchant ID
  blockchain="base"         // or "solana" for WaveWarZ
  env="sandbox"             // "sandbox" | "prod"
  amount={25}
  settlementType="USDC"
  onSuccess={() => handleSuccess()}
  webhookInfo={{ userId, productId }}
/>
```

### Path 3: API Integration (custom UI)

Direct API for mobile or non-React platforms.

### Auth/Session Setup

```bash
# Create session key for non-crypto users
POST https://api-sandbox.coinflow.cash/api/auth/session-key
Headers:
  Authorization: Bearer <API_KEY>
  x-coinflow-auth-blockchain: base
  x-coinflow-auth-wallet: <wallet_address>
```

Session keys valid 24 hours, then refresh.

---

## Compliance & Security

| Feature | Detail |
|---------|--------|
| **PCI DSS** | Level 1 compliant |
| **SOC 2** | Certified |
| **KYC/AML** | Built-in via Persona (reusable across Coinflow partners) |
| **Chargeback protection** | Available, requires script on every page |
| **3D Secure** | Supported, test with sandbox card numbers |
| **Geographic controls** | State-level restrictions via billing address + IP |
| **Fraud detection** | Smart orchestration routes around risky processors |

---

## Pricing (What We Know)

| Item | Detail |
|------|--------|
| **Setup fees** | $0 (Launchpad) |
| **Platform fees** | $0 (Launchpad) |
| **Pricing model** | Interchange-plus (not flat rate) |
| **Specific rates** | Custom per MSA - not published |
| **Solana tx fees** | Coinflow covers 100% |
| **Revenue share** | ISV earns share on every transaction |
| **Fee types** | Transaction fee (blockchain) + Service fee (Coinflow) |
| **Series A** | $25M (Oct 2025) led by Pantera Capital, with Coinbase Ventures, CMT Digital, Jump Capital |

**Comparison to alternatives:**
- Stripe Connect: 2.9% + 30c (published, predictable)
- Coinbase Commerce: 1% flat (crypto only)
- Coinflow: Custom interchange-plus (likely competitive, need MSA for exact rates)

---

## Next Steps

| Step | Owner | Status |
|------|-------|--------|
| Complete WaveWarZ onboarding with Michael | Hurricane | In progress |
| Schedule ISV specialist call for ZAO | Zaal | Pending (application submitted) |
| Get sandbox API keys for both merchants | Michael | After onboarding call |
| Build WaveWarZ MVP checkout (Checkout Link path) | Hurricane | After sandbox access |
| Build ZAO OS CoinflowCheckout component | Dev | After ZAO ISV approved |
| Deploy webhook handler at `/api/payments/coinflow/webhook/route.ts` | Dev | After sandbox access |
| Get exact pricing from MSA | Zaal | During ISV specialist call |
| Discuss co-marketing opportunities | Zaal + Michael | Quarterly check-in |

---

## Files to Create (ZAO OS)

| File | Purpose |
|------|---------|
| `src/app/api/payments/coinflow/webhook/route.ts` | Handle Coinflow webhook events (24+ types) |
| `src/components/payments/CoinflowCheckout.tsx` | Wrap `CoinflowPurchase` with ZAO dark theme |
| `src/lib/payments/coinflow.ts` | Coinflow client setup, session key generation |

See Doc 222 for full payment infrastructure file plan (Stripe + Coinbase Commerce + Coinflow + 0xSplits).

---

## Sources

- [Coinflow Launchpad ISV Program](https://coinflow.cash/launchpad/)
- [Coinflow Embedded Payments Blog](https://coinflow.cash/blog/what-are-embedded-payments/)
- [Coinflow February 2026 Updates](https://coinflow.cash/blog/new-at-coinflow-february-2026/)
- [Coinflow Supported Tokens & Chains](https://docs.coinflow.cash/guides/checkout/payment-methods/payment-methods/crypto-payments/supported-tokens-and-chains)
- [Coinflow Marketplace Overview](https://docs.coinflow.cash/guides/marketplaces/marketplace-overview)
- [Coinflow Implementation Guide](https://docs.coinflow.cash/guides/checkout/implementation-overview/getting-started-with-implmentation)
- [Coinflow $25M Series A - Fortune](https://fortune.com/crypto/2025/10/08/stablecoin-coinflow-startup-funding-round-pantera-stripe-payments/)
- [Coinflow $25M Series A - CoinDesk](https://www.coindesk.com/business/2025/10/08/coinflow-raises-usd25m-to-scale-stablecoin-payments-backed-by-pantera-and-coinbase/)
- [Coinflow Documentation](https://docs.coinflow.cash/)
- [Doc 125 - Coinflow SDK Integration](../125-coinflow-fiat-checkout/)
- [Doc 222 - Payment Infrastructure](../222-payment-infrastructure-stripe-coinbase/)

---

## Related Docs

- [125 - Coinflow Fiat Checkout](../125-coinflow-fiat-checkout/) - React SDK details, webhook events, EVM settlement flow
- [222 - Payment Infrastructure](../222-payment-infrastructure-stripe-coinbase/) - Full dual-rail architecture (Stripe + Coinbase Commerce + Coinflow + 0xSplits)
- [101 - WaveWarZ Whitepaper](../../wavewarz/101-wavewarz-zao-whitepaper/) - WaveWarZ product spec
