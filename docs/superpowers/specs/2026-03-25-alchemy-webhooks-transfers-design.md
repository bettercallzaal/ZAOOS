# Alchemy Webhooks + Transfer History — Design Spec

> **Date:** March 25, 2026
> **Status:** Approved
> **Goal:** Auto-sync respect tokens on mint + historical transfer ledger
> **Research:** research/127 (ENS), research/128 (free APIs), research/129 (Alchemy deep)

---

## Problem

1. **Manual sync:** Admin must click "Sync Respect" button to update on-chain balances. If admin forgets, member profiles show stale data.
2. **No transfer history:** The respect ledger shows fractal scores + events but not on-chain transfer timestamps. Can't answer "when did this member receive their ZOR tokens?"

## Solution

### Feature 1: Alchemy Webhook — Auto-Sync on Mint

```
ZOR Respect minted on Optimism (weekly fractal results)
  │
  ├── Alchemy detects ERC-1155 transfer on contract 0x9885...45c
  │
  ├── Alchemy sends POST to https://zaoos.com/api/webhooks/alchemy
  │
  ├── Our endpoint:
  │   1. Validates HMAC SHA-256 signature (rejects spoofed requests)
  │   2. Parses transfer event (from, to, tokenId, value)
  │   3. Looks up recipient wallet in respect_members table
  │   4. Updates onchain_zor balance
  │   5. Stores transfer in respect_transfers table
  │   6. Returns 200 OK to Alchemy
  │
  └── Member profile shows updated balance in real-time
      (no admin action needed)

Fallback: /api/respect/sync still works as manual admin button
```

**CU cost:** ~40 CU per event, ~50 events/month = ~2K CU (0.007% of free tier)

**Webhook setup (manual, one-time):**
1. Go to Alchemy Dashboard → Webhooks → Create Webhook
2. Chain: Optimism
3. Type: NFT Activity
4. Contract: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
5. Webhook URL: `https://zaoos.com/api/webhooks/alchemy`
6. Copy the signing key → add as `ALCHEMY_WEBHOOK_SIGNING_KEY` env var

### Feature 2: Transfer History via getAssetTransfers

```
GET /api/respect/transfers?address=0x...
  │
  ├── Calls Alchemy getAssetTransfers for Optimism
  │   - Contract filter: OG Respect + ZOR Respect
  │   - Category: erc20 + erc1155
  │   - withMetadata: true (includes blockTimestamp)
  │
  ├── Returns: [{ from, to, value, tokenType, txHash, timestamp }]
  │
  ├── Stored in respect_transfers table (Supabase)
  │
  └── Displayed in member profile → Respect Ledger section
      as "On-chain" entries with tx links to Optimism Etherscan
```

**CU cost:** 120 CU per call, ~50 calls/month = ~6K CU (0.02% of free tier)

---

## Files to Create

### 1. `src/app/api/webhooks/alchemy/route.ts`
- POST handler for Alchemy webhook payloads
- HMAC SHA-256 signature validation using `ALCHEMY_WEBHOOK_SIGNING_KEY`
- Parses NFT Activity webhook payload format
- Updates `respect_members.onchain_zor` for the recipient
- Stores transfer in `respect_transfers` table
- Returns 200 immediately (Alchemy retries on non-200)

### 2. `src/app/api/respect/transfers/route.ts`
- GET: fetch transfers from Alchemy `getAssetTransfers` for both contracts
- Filters by address, paginated
- Caches results in `respect_transfers` table
- Returns timestamped transfer list

### 3. `scripts/create-respect-transfers.sql`
```sql
CREATE TABLE respect_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('og_erc20', 'zor_erc1155')),
  amount TEXT NOT NULL, -- stored as string to handle large numbers
  block_number BIGINT,
  block_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tx_hash, to_address, token_type)
);

CREATE INDEX idx_respect_transfers_to ON respect_transfers (to_address);
CREATE INDEX idx_respect_transfers_timestamp ON respect_transfers (block_timestamp DESC);

ALTER TABLE respect_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON respect_transfers FOR SELECT USING (true);
```

## Files to Modify

### 4. `src/app/api/respect/member/route.ts`
- Add on-chain transfers from `respect_transfers` table to the ledger
- Each transfer shows as: date, source: 'onchain', type: 'OG mint' or 'ZOR mint', amount, tx link

---

## ENV Variables

| Variable | Required | Where to get |
|----------|----------|-------------|
| `ALCHEMY_API_KEY` | Already set | Alchemy dashboard |
| `ALCHEMY_WEBHOOK_SIGNING_KEY` | New | Alchemy dashboard → Webhooks → Signing Key |

---

## Alchemy Webhook Payload Format (NFT Activity)

```json
{
  "webhookId": "wh_...",
  "id": "whevt_...",
  "createdAt": "2026-03-25T10:00:00.000Z",
  "type": "NFT_ACTIVITY",
  "event": {
    "network": "OPT_MAINNET",
    "activity": [
      {
        "category": "erc1155",
        "fromAddress": "0x0000000000000000000000000000000000000000",
        "toAddress": "0x7234c36a71ec237c2ae7698e8916e0735001e9af",
        "contractAddress": "0x9885cceef7e8371bf8d6f2413723d25917e7445c",
        "erc1155Metadata": [
          { "tokenId": "0x...", "value": "42" }
        ],
        "log": {
          "transactionHash": "0x...",
          "blockNumber": "0x..."
        }
      }
    ]
  }
}
```

## HMAC Signature Validation

Alchemy sends a `X-Alchemy-Signature` header containing HMAC SHA-256 of the raw request body using the signing key.

```typescript
import crypto from 'crypto';

function validateSignature(body: string, signature: string, signingKey: string): boolean {
  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(body, 'utf8');
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

## getAssetTransfers Request Format

```typescript
const response = await fetch(
  `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [{
        fromBlock: '0x0',
        toBlock: 'latest',
        toAddress: memberWallet,
        contractAddresses: [
          '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957', // OG Respect ERC-20
          '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c', // ZOR Respect ERC-1155
        ],
        category: ['erc20', 'erc1155'],
        withMetadata: true,
        maxCount: '0x3E8', // 1000
      }],
    }),
  }
);
```

## Backup Strategy

| Primary | Fallback | Trigger |
|---------|----------|---------|
| Alchemy Webhook (auto-sync) | Manual admin "Sync Respect" button | Webhook fails or Alchemy is down |
| Alchemy getAssetTransfers (history) | Direct viem getLogs on Optimism RPC | Alchemy API returns error |
| Alchemy NFT API (music discovery) | Sound.xyz + Zora direct APIs | Alchemy returns empty |
| Alchemy RPC (ENS) | Public RPCs (llamarpc, publicnode) | Alchemy is down |

Every Alchemy integration has a fallback path. No single point of failure.

## Implementation Order

1. Create `respect_transfers` table (SQL)
2. Build webhook receiver (`/api/webhooks/alchemy`)
3. Build transfer history API (`/api/respect/transfers`)
4. Add on-chain transfers to member ledger
5. Register webhook in Alchemy dashboard
6. Test with a real ZOR mint

## Budget Impact

| Feature | CU/month | % of 30M |
|---------|----------|----------|
| Current total | 174K | 0.58% |
| + Webhooks | +2K | +0.007% |
| + Transfers | +6K | +0.02% |
| **New total** | **~182K** | **0.61%** |

Still using less than 1% of free tier.
