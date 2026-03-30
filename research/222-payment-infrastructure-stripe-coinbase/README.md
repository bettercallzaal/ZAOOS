# 222 — Payment Infrastructure: Stripe, Coinbase Commerce, Coinflow, 0xSplits

> **Status:** Research complete
> **Date:** March 30, 2026
> **Goal:** Evaluate and recommend payment infrastructure for ZAO OS — covering membership purchases, event ticketing (ZAO Stock, October 2026), merch sales, and music royalty splits
> **Updates:** Doc 125 (Coinflow), Doc 143 (0xSplits), Doc 213 (ZAO Stock), Doc 216 (tipping/tickets)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary fiat processor** | **Stripe Connect** — 2.9% + 30c per card transaction, handles memberships, ticketing, merch, and recurring billing. Automatic payout splitting to artists/vendors via Connect accounts |
| **Crypto payments** | **Coinbase Commerce** — 1% fee, accepts BTC/ETH/USDC/DAI/LTC on Base/Ethereum/Polygon. Self-custody, no KYC for merchants. Use for crypto-native members who prefer on-chain payments |
| **Fiat-to-crypto bridge** | **Coinflow** — fiat card/ACH/Apple Pay that settles to USDC on Base. Use specifically for NFT mints and on-chain membership purchases where the end result must be on-chain (Doc 125) |
| **On-chain royalty splits** | **0xSplits** — zero protocol fees, deployed on Base, $250M+ distributed. Use for all artist payment splits from NFT sales and streaming revenue (Doc 143) |
| **ZAO Stock ticketing** | **Stripe Connect + Unlock Protocol** — Stripe handles fiat ticket sales ($25-75 price range), Unlock Protocol mints attendance NFTs on Base as collectible POAPs (Doc 216) |
| **Merch sales** | **Stripe Connect** — standard e-commerce checkout with Stripe Elements, ship via existing merch fulfillment |
| **Architecture** | Dual-rail: Stripe for fiat, Coinbase Commerce for crypto, 0xSplits for on-chain distribution. Coinflow reserved for fiat-to-on-chain bridge when needed |

---

## Comparison Table

| Feature | Stripe Connect | Coinbase Commerce | Coinflow | 0xSplits |
|---------|---------------|-------------------|----------|----------|
| **Fee** | 2.9% + 30c (cards), 0.8% (ACH), 1.5% (crypto/USDC) | 1% flat | Custom (not published) | 0% (gas only) |
| **Fiat support** | Yes (cards, ACH, Apple Pay, Google Pay, SEPA, iDEAL) | No (crypto only) | Yes (cards, ACH, Apple Pay, Google Pay, PIX) | No |
| **Crypto support** | USDC only (via Bridge acquisition) | BTC, ETH, USDC, DAI, LTC, 10+ tokens | Settles to USDC on Base/Arbitrum/Polygon | ETH, USDC, any ERC-20 |
| **Recurring billing** | Yes (Stripe Billing, dunning, retries) | No | No | No |
| **Payout splitting** | Yes (Connect multi-party payouts) | No | No | Yes (core feature, immutable or mutable splits) |
| **Settlement** | Fiat to bank (2-day rolling) | Crypto to merchant wallet | USDC on-chain or credits | On-chain to split recipients |
| **Chains** | Ethereum, Solana, Polygon (via Bridge) | Base, Ethereum, Polygon, Solana | Base, Ethereum, Polygon, Arbitrum, Solana | Base, Ethereum, Optimism, Polygon, Arbitrum, Zora, 13+ chains |
| **React SDK** | `@stripe/react-stripe-js` | Hosted checkout page + API | `@coinflow/react` | `@0xsplits/splits-sdk`, `@0xsplits/splits-sdk-react` |
| **KYC required** | Yes (for Connect accounts) | No (merchant side) | Yes (Sumsub/Persona) | No |
| **Chargebacks** | Platform handles | N/A (crypto is final) | Protection available | N/A (on-chain is final) |
| **Best for ZAO** | Memberships, tickets, merch, recurring | Crypto-native member payments | NFT mints with fiat | Artist royalty distribution |

---

## Payment Architecture for ZAO OS

### Dual-Rail System

```
                         ZAO OS Payment Flow
                              │
                 ┌────────────┴────────────┐
                 │                          │
           FIAT RAIL                   CRYPTO RAIL
           (Stripe)                    (On-Chain)
                 │                          │
    ┌────────────┤              ┌───────────┤
    │            │              │           │
Memberships  Tickets      Coinbase     0xSplits
  $10/mo     $25-75      Commerce    (royalties)
  Stripe     Stripe       1% fee      0% fee
 Billing    Checkout                     │
    │            │              │    ┌────┴────┐
    │            │              │    Artist   ZAO
    │            │              │    80%    Treasury
    ▼            ▼              ▼             10%
  Supabase    Unlock        Wallet
  (record)   Protocol       (direct)
             (POAP NFT)
```

### Flow 1: Membership Purchase (Stripe)

1. User clicks "Join ZAO" on landing page
2. Stripe Checkout Session created via `/api/payments/checkout/route.ts`
3. User pays $10/month via card/Apple Pay/Google Pay
4. Stripe webhook fires `checkout.session.completed` to `/api/payments/webhook/route.ts`
5. API inserts member record in Supabase `members` table, sets `membership_status = 'active'`
6. Stripe Billing handles recurring charges, failed payment retries, cancellations

### Flow 2: ZAO Stock Ticket Purchase (Stripe + Unlock)

1. User visits ZAO Stock event page
2. Selects ticket tier (General $25, VIP $50, All-Access $75)
3. Stripe Checkout processes payment
4. On success, backend mints attendance NFT via Unlock Protocol `PublicLock` on Base
5. NFT serves as ticket (checked via `balanceOf`) and post-event collectible
6. Revenue split: 70% artist payments (via 0xSplits), 20% venue/production, 10% ZAO treasury

### Flow 3: Crypto Payment (Coinbase Commerce)

1. User toggles "Pay with crypto" on any purchase
2. Coinbase Commerce charge created via `/api/payments/crypto/route.ts`
3. User pays from their connected wallet (BTC, ETH, USDC, etc.)
4. Coinbase webhook confirms payment to `/api/payments/crypto/webhook/route.ts`
5. Funds arrive in ZAO merchant wallet on Base

### Flow 4: Artist Royalty Distribution (0xSplits)

1. NFT sale or streaming revenue accumulates in split contract on Base
2. 0xSplits contract auto-routes: Artist 80%, ZAO Treasury 10%, Curator 10%
3. Any party calls `distribute()` to trigger payout (bots incentivized to do this)
4. Zero protocol fees — only gas cost (~$0.001 on Base)
5. Full implementation in Doc 143 with `@0xsplits/splits-sdk`

---

## ZAO Stock Ticket Pricing Model

Based on Doc 213 target of 500-1,000 attendees:

| Tier | Price | Capacity | Revenue |
|------|-------|----------|---------|
| Early Bird | $25 | 200 | $5,000 |
| General Admission | $40 | 500 | $20,000 |
| VIP (meet & greet) | $75 | 100 | $7,500 |
| **Total** | | **800** | **$32,500** |

**After fees:** Stripe takes ~$1,072 (2.9% + 30c on 800 txns). Net revenue: **$31,428**.

**Revenue split:**
- Artist payments (via 0xSplits): $21,999 (70%)
- Venue + production: $6,286 (20%)
- ZAO Treasury: $3,143 (10%)

---

## ZAO OS Integration: File Paths

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/payments/checkout/route.ts` | Create Stripe Checkout sessions (memberships, tickets, merch) |
| `src/app/api/payments/webhook/route.ts` | Handle Stripe webhooks (checkout.session.completed, invoice.paid, etc.) |
| `src/app/api/payments/crypto/route.ts` | Create Coinbase Commerce charges |
| `src/app/api/payments/crypto/webhook/route.ts` | Handle Coinbase Commerce webhooks |
| `src/lib/payments/stripe.ts` | Stripe client setup, helper functions |
| `src/lib/payments/coinbase.ts` | Coinbase Commerce client, charge creation |
| `src/lib/payments/constants.ts` | Product IDs, price tiers, webhook secrets |
| `src/components/payments/CheckoutButton.tsx` | Stripe Checkout redirect button |
| `src/components/payments/CryptoPayButton.tsx` | Coinbase Commerce payment button |
| `src/components/payments/PricingCard.tsx` | Membership/ticket pricing display |
| `supabase/migrations/xxx_payments.sql` | Payments table, subscriptions table |

### Existing Files to Modify

| File | Change |
|------|--------|
| `community.config.ts` | Add `payments` config: Stripe publishable key ref, product IDs, tier pricing |
| `src/middleware.ts` | Add rate limiting for `/api/payments/*` routes (10 req/min) |
| `src/lib/music/splits.ts` | Already scaffolded in Doc 143 — connect to payment flow |

### Database Schema

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'coinbase', 'coinflow')),
  provider_id TEXT NOT NULL UNIQUE,  -- Stripe session ID or Coinbase charge ID
  product_type TEXT NOT NULL CHECK (product_type IN ('membership', 'ticket', 'merch', 'tip')),
  product_id TEXT,                    -- specific product reference
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_fid ON payments(fid, created_at DESC);
CREATE INDEX idx_payments_provider ON payments(provider, provider_id);
CREATE INDEX idx_payments_status ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_read ON payments FOR SELECT USING (true);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_fid ON subscriptions(fid);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_read ON subscriptions FOR SELECT USING (true);
```

---

## Implementation Dependencies

### NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | ^17.x | Server-side Stripe API client |
| `@stripe/react-stripe-js` | ^3.x | React Stripe Elements (optional, for embedded forms) |
| `@stripe/stripe-js` | ^5.x | Client-side Stripe.js loader |
| `coinbase-commerce-node` | ^1.x | Coinbase Commerce server SDK |
| `@0xsplits/splits-sdk` | ^6.4.1 | 0xSplits SDK (already evaluated in Doc 143) |
| `@0xsplits/splits-sdk-react` | ^1.x | React hooks for splits (SplitsProvider, useSplitMetadata) |

### Environment Variables (Server-Only)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
COINBASE_COMMERCE_API_KEY=...
COINBASE_COMMERCE_WEBHOOK_SECRET=...
```

**Security note:** Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is exposed to the browser. All other keys are server-only per ZAO OS security rules.

---

## Implementation Priority

| Phase | Work | Effort | Ships |
|-------|------|--------|-------|
| **Phase 1: Stripe Core** | Stripe Checkout for memberships + webhook handler + payments table | 8 hrs | Week 1 |
| **Phase 2: ZAO Stock Tickets** | Ticket tiers + Stripe Checkout + Unlock Protocol NFT mint on success | 12 hrs | Week 2-3 |
| **Phase 3: Crypto Payments** | Coinbase Commerce integration + dual payment option on checkout | 6 hrs | Week 3 |
| **Phase 4: 0xSplits Royalties** | Connect NFT sale revenue to split contracts, auto-distribute | 4 hrs | Week 4 |
| **Phase 5: Merch Store** | Product catalog in Supabase + Stripe Checkout + shipping | 10 hrs | Week 5-6 |
| **Total** | | **40 hrs** | **6 weeks** |

---

## Cost Analysis (Monthly, 100 Members)

| Scenario | Volume | Stripe Fees | Coinbase Fees | 0xSplits Fees | Total Fees |
|----------|--------|-------------|---------------|---------------|------------|
| **Memberships only** ($10/mo x 100) | $1,000 | $59 (2.9% + 30c x 100) | $0 | $0 | $59 |
| **+ 20 crypto payments** ($10 x 20) | $1,200 | $59 | $2 | $0 | $61 |
| **+ ZAO Stock tickets** (800 x $40 avg) | $33,200 | $1,131 | $2 | $0 | $1,133 |
| **+ NFT sales** (50 x $20 avg) | $34,200 | $1,131 | $12 | ~$0.05 gas | $1,143 |

**Key number:** Total annual payment processing fees for a fully active ZAO with 100 members and one festival: approximately **$1,800-2,400/year** (3.4-4.1% effective rate).

---

## Why Not Just One Provider

| Single-provider approach | Problem |
|--------------------------|---------|
| Stripe only | No native crypto payments; crypto-native artists want to pay with ETH/USDC directly |
| Coinbase Commerce only | No fiat support; 60%+ of ZAO Stock attendees will use credit cards; no recurring billing |
| Coinflow only | No published pricing; limited to USDC settlement; no recurring billing; newer company |
| 0xSplits only | Distribution only, not a payment processor; handles splits after revenue arrives |

The dual-rail approach (Stripe + Coinbase Commerce + 0xSplits) covers every user type: traditional card payers, crypto-native members, and transparent artist royalty distribution.

---

## Sources

- [Stripe Connect Pricing](https://stripe.com/connect/pricing) — 2.9% + 30c standard, Connect payout fees
- [Stripe Event Payment Processing](https://stripe.com/resources/more/event-payment-processing-how-to-make-payments-easier-to-manage-and-more-convenient-for-attendees)
- [Coinbase Commerce Review 2026 — 1% Fee](https://blockfinances.fr/en/coinbase-commerce-review-fees-guide)
- [Stripe vs Coinbase Commerce 2026 Comparison](https://blockfinances.fr/en/stripe-crypto-vs-coinbase-commerce-comparison-2026)
- [Coinbase Commerce Next.js Integration](https://dev.to/joshuajee/how-to-accept-crypto-payments-in-a-nextjs-application-using-coinbase-commerce-303e)
- [Coinbase Commerce Vercel Template](https://vercel.com/templates/next.js/coinbase-commerce)
- [0xSplits — Financial Infrastructure for Onchain Teams](https://splits.org/)
- [0xSplits SDK on npm](https://www.npmjs.com/package/@0xsplits/splits-sdk)
- [0xSplits React SDK Docs](https://docs.splits.org/react)
- [Coinflow $25M Series A — Fortune](https://fortune.com/crypto/2025/10/08/stablecoin-coinflow-startup-funding-round-pantera-stripe-payments/)
- [Coinflow Checkout Docs](https://docs.coinflow.cash/guides/checkout/checkout-overview/how-checkout-works) — Doc 125 deep dive
- [Unlock Protocol — NFT Ticket Sales](https://unlock-protocol.com/guides/how-to-sell-nft-tickets-for-an-event/)
- [13 Best Crypto Payment Gateways 2026](https://ventureburn.com/best-crypto-payment-gateway/)

---

## Related Docs

- [125 — Coinflow Fiat Checkout](../125-coinflow-fiat-checkout/) — detailed Coinflow SDK integration
- [143 — 0xSplits Revenue Distribution](../143-0xsplits-revenue-distribution/) — 0xSplits SDK setup and split creation
- [213 — ZAO Stock Planning](../213-zao-stock-planning/) — festival logistics and production planning
- [216 — Web3 Streaming Features](../216-web3-streaming-features-tipping-gating-tickets/) — tipping, token gating, NFT tickets
