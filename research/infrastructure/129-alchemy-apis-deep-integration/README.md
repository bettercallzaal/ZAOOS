# 129 — Alchemy APIs Deep Integration for ZAO OS

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Maximize value from Alchemy free tier — webhooks, transfer history, budget analysis

## Key Decisions / Recommendations

| API | Use Case | CU/month | Priority |
|-----|----------|----------|----------|
| **Webhooks** | Auto-sync ZOR respect on mint — eliminate manual admin sync | ~2K | **Build now** |
| **getAssetTransfers** | Historical respect transfer ledger with timestamps | ~6K | **Build now** |
| **getTokenBalances** | Replace multicall for OG ERC-20 | Saves ~1.2K | Skip — minimal gain |

## Budget Analysis

**Free tier: 30M CU/month.** Current + planned usage:

| Method | CU/call | Monthly calls | Monthly CU | % of 30M |
|--------|---------|---------------|------------|----------|
| ENS (`eth_call`) | 26 | ~500 | 13K | 0.04% |
| NFT discovery (`getNftsForOwner`) | 480 | ~300 | 144K | 0.48% |
| Transfers (`getAssetTransfers`) | 120 | ~50 | 6K | 0.02% |
| Webhooks | ~40/event | ~50 | 2K | 0.007% |
| Respect multicall | 26 | ~200 | 5.2K | 0.017% |
| **Total** | | | **~174K** | **0.58%** |

**99.4% of free tier unused.** Enormous headroom.

## 1. Alchemy Webhooks — Auto-Sync Respect

**Problem:** Admin must manually click "Sync Respect" to update on-chain balances.

**Solution:** NFT Activity Webhook on Optimism watching ZOR Respect contract.

**How it works:**
1. Register webhook in Alchemy dashboard pointing to `https://zaoos.com/api/webhooks/alchemy`
2. Alchemy sends POST when any ERC-1155 transfer happens on ZOR contract
3. Our endpoint validates HMAC signature, parses event, updates `respect_members.onchain_zor`
4. Real-time — no manual admin action needed

**Details:**
- Supports ERC-1155 on Optimism (confirmed)
- Free tier: 5 webhooks max (we need 1-2)
- HMAC SHA-256 signature validation
- ~40 CU per event, ~50 events/month = ~2K CU

**Files to create:**
- `src/app/api/webhooks/alchemy/route.ts` — webhook receiver
- Keep `/api/respect/sync` as manual fallback

## 2. Transfers API — Historical Respect Ledger

**Problem:** Current respect ledger only has data from Airtable imports + fractal scores. No on-chain transfer timestamps.

**Solution:** `getAssetTransfers` for both respect contracts on Optimism.

**How it works:**
1. Call `getAssetTransfers` with `contractAddresses` filter for both contracts
2. Returns: from, to, value, blockTimestamp, txHash
3. Store in new `respect_transfers` table
4. Display on member profiles + analytics

**Details:**
- 120 CU per call, supports pagination (1000 results/page)
- Initial backfill: ~5-20 calls
- Ongoing: 1-2 calls/week
- Filters: `fromAddress=0x0` for mints, `toAddress=member` for specific member history

**Files to create:**
- `scripts/create-respect-transfers.sql` — new table
- `src/app/api/respect/history/route.ts` — fetch + store transfers
- Update member profile to show on-chain transfer timeline

## Current Alchemy Usage in Codebase

| File | Chain | API Used |
|------|-------|----------|
| `src/lib/ens/resolve.ts` | Mainnet | `eth_call` (ENS Universal Resolver) |
| `src/lib/ordao/client.ts` | Optimism | `eth_call` (OREC proposals, respect balances) |
| `src/app/api/music/wallet/route.ts` | Mainnet + OP + Base | NFT API v3 (`getNftsForOwner`) |
| `src/app/api/ens/route.ts` | Mainnet | ENS server-side API |

## Sources

- [Alchemy Webhook Pricing](https://www.alchemy.com/support/how-are-webhooks-and-websockets-priced)
- [Alchemy Webhook Types](https://www.alchemy.com/docs/reference/webhook-types)
- [Optimism Webhooks](https://www.alchemy.com/overviews/optimism-webhooks)
- [getAssetTransfers](https://www.alchemy.com/docs/reference/alchemy-getassettransfers)
- [Compute Unit Costs](https://www.alchemy.com/docs/reference/compute-unit-costs)
- [Token API](https://www.alchemy.com/docs/reference/token-api-overview)
