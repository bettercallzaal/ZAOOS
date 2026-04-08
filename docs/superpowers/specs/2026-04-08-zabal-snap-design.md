# ZABAL Token Snap - Design Spec

> **Date:** 2026-04-08
> **Status:** Approved for implementation
> **Goal:** Standalone Farcaster Snap showing $ZABAL token dashboard with burn/distribution tracking, swap/send actions, and activity drill-down

---

## Overview

A proof-of-concept Farcaster Snap for the $ZABAL community token. Dashboard-first design: users see key stats instantly in the Farcaster feed, can swap/send ZABAL with native wallet actions, and drill down into burn + distribution activity.

Standalone Hono app deployed to `snap.zaoos.com`. No ZAO OS coupling. Reads on-chain data directly via Viem + Base RPC.

---

## Architecture

```
Farcaster client GETs snap URL
  -> Hono server on snap.zaoos.com
  -> Viem reads Base RPC (token data, transfer events, burns)
  -> Returns SnapResponse JSON
  -> Client renders dashboard card in feed

User taps "Swap ZABAL"
  -> swap_token action (native wallet flow, no server round-trip)

User taps "Send ZABAL"
  -> send_token action (native wallet flow)

User taps "Activity"
  -> submit action -> POST to server
  -> Server returns Page 2 (distribution bar chart, supply breakdown)
```

### Stack

| Piece | Choice |
|-------|--------|
| Language | TypeScript |
| Framework | Hono + `@farcaster/snap-hono` v1.4.8 |
| On-chain data | Viem `createPublicClient` with Base HTTP RPC |
| State | None (all reads are live from chain) |
| Deploy | Vercel at `snap.zaoos.com` (subdomain of ZAOOS) |
| Theme | `amber` (#FFAE00 - matches ZAO gold) |
| Auth | JFS auto-handled by snap-hono |
| Package manager | pnpm |

### Dependencies

```json
{
  "@farcaster/snap": "^1.15.1",
  "@farcaster/snap-hono": "^1.4.8",
  "@hono/node-server": "^1.0.0",
  "@noble/curves": "^2.0.0",
  "hono": "^4.0.0",
  "viem": "^2.21.0",
  "zod": "^4.0.0"
}
```

---

## Token Constants

```typescript
const ZABAL = {
  address: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07' as const,
  chainId: 8453, // Base
  decimals: 18,
  symbol: 'ZABAL',
  totalSupply: 100_000_000_000n, // 100B
  caip19: 'eip155:8453/erc20:0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
  // ZAAL's admin/distribution address
  zaalAddress: '0x7234c36A71ec237c2Ae7698e8916e0735001E9Af' as const,
  // Dead address for burn tracking
  burnAddress: '0x000000000000000000000000000000000000dEaD' as const,
};
```

---

## Pages

### Page 1: Dashboard (GET - landing page)

**What the user sees in their Farcaster feed:**

```
+------------------------------------------+
|  $ZABAL              [amber badge: Base]  |
|  The ZAO community token                  |
|                                           |
|  Price         $0.000000141               |
|  Market Cap    $14.1K                     |
|  Holders       340                        |
|                                           |
|  ---------------------------------------- |
|                                           |
|  [fire badge] Burned: 1.2B ZABAL         |
|  [send badge] Distributed: 8.5B ZABAL    |
|                                           |
|  [Swap ZABAL]  [Send ZABAL]  [Activity]  |
+------------------------------------------+
```

**Components:**

| Element ID | Type | Props |
|------------|------|-------|
| `page` | `stack` | `direction: "vertical", gap: "md"` |
| `header` | `item` | `title: "$ZABAL", description: "The ZAO community token"` |
| `chain_badge` | `badge` | `label: "Base", color: "blue"` |
| `price` | `item` | `title: "Price", description: "$0.000000141"` |
| `mcap` | `item` | `title: "Market Cap", description: "$14.1K"` |
| `holders` | `item` | `title: "Holders", description: "340"` |
| `divider` | `separator` | `{}` |
| `burned` | `item` | `title: "Burned", description: "1.2B ZABAL"` |
| `burn_badge` | `badge` | `label: "Deflationary", color: "red", icon: "flame"` |
| `distributed` | `item` | `title: "Sent from ZAAL", description: "8.5B ZABAL"` |
| `dist_badge` | `badge` | `label: "Community", color: "green", icon: "send"` |
| `btn_row` | `stack` | `direction: "horizontal", gap: "sm"` |
| `swap_btn` | `button` | `label: "Swap", icon: "refresh-cw"` |
| `send_btn` | `button` | `label: "Send", icon: "coins"` |
| `more_btn` | `button` | `label: "Activity", variant: "primary"` |

**Actions:**

| Button | Action | Params |
|--------|--------|--------|
| `swap_btn` | `swap_token` | `buyToken: "eip155:8453/erc20:0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07"` |
| `send_btn` | `send_token` | `token: "eip155:8453/erc20:0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07"` |
| `more_btn` | `submit` | `target: "{baseUrl}/activity"` |

**Data fetching (Viem multicall on GET):**

1. `totalSupply()` - verify 100B
2. `balanceOf(burnAddress)` - tokens burned
3. `balanceOf(zaalAddress)` - remaining in ZAAL wallet
4. Transfer event logs from `zaalAddress` (recent distributions)
5. Holder count - from BaseScan API or cached

### Page 2: Activity Feed (POST /activity)

**What the user sees after tapping "Activity":**

```
+------------------------------------------+
|  ZABAL Activity           [amber accent]  |
|                                           |
|  Top Recipients from ZAAL                 |
|  ============= 0x1234...af  2.1B         |
|  =========  0xab12...cd     1.4B          |
|  ======  0xef34...56        900M          |
|  ====  0x7890...12          600M          |
|  ==  0xcd56...78            300M          |
|                                           |
|  Supply Breakdown                         |
|  ================ LP Pool    65.2%        |
|  ========= Vault (locked)   30.0%         |
|  == Airdrop                   4.8%        |
|                                           |
|  [<- Back]          [View on BaseScan]    |
+------------------------------------------+
```

**Components:**

| Element ID | Type | Props |
|------------|------|-------|
| `page` | `stack` | `direction: "vertical", gap: "md"` |
| `title` | `text` | `content: "ZABAL Activity", weight: "bold"` |
| `recipients_label` | `text` | `content: "Top Recipients from ZAAL", size: "sm"` |
| `recipients_chart` | `bar_chart` | `bars: [{label, value}...], color: "amber", max: <highest>` |
| `supply_label` | `text` | `content: "Supply Breakdown", size: "sm"` |
| `supply_chart` | `bar_chart` | `bars: [{label: "LP Pool", value: 65.2}, ...], color: "green", max: 100` |
| `btn_row` | `stack` | `direction: "horizontal", gap: "sm", justify: "between"` |
| `back_btn` | `button` | `label: "Back", icon: "arrow-left"` |
| `basescan_btn` | `button` | `label: "BaseScan", variant: "primary", icon: "external-link"` |

**Actions:**

| Button | Action | Params |
|--------|--------|--------|
| `back_btn` | `submit` | `target: "{baseUrl}/"` (returns to Page 1) |
| `basescan_btn` | `open_url` | `target: "https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07"` |

**Data fetching (Viem on POST):**

1. Transfer event logs from `zaalAddress` - aggregate by recipient, top 5
2. Supply breakdown - hardcoded from Clanker data (65.2% pool, 30% vault, 4.8% airdrop)

---

## On-Chain Data Strategy

### Viem Setup

```typescript
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(), // uses default public Base RPC
});

const erc20Abi = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);
```

### Data Calls

| Data Point | Method | Notes |
|------------|--------|-------|
| Total supply | `totalSupply()` | Should be 100B * 10^18 |
| Burned | `balanceOf(0x...dEaD)` | Tokens sent to dead address |
| ZAAL balance | `balanceOf(zaalAddress)` | Remaining undistributed |
| Distributed | `totalSupply - burned - zaalBalance - lpPool - vault` | Derived |
| Top recipients | `Transfer` event logs from `zaalAddress` | `getLogs` with fromBlock, aggregate |
| Holder count | BaseScan API or hardcode initially | Can update via cron later |
| Price | Uniswap V4 pool quote or DexScreener API | Best effort, can hardcode initially |

### Caching

For the POC, fetch live on every request. The 5-second POST timeout is generous for 2-3 RPC calls via multicall. If latency becomes an issue, add a 60-second in-memory cache.

---

## Project Structure

```
zabal-snap/
  package.json
  tsconfig.json
  src/
    index.ts          # Hono app + registerSnapHandler
    server.ts         # @hono/node-server for local dev
    token.ts          # Viem client + on-chain data fetching
    pages/
      dashboard.ts    # Page 1 SnapResponse builder
      activity.ts     # Page 2 SnapResponse builder
    utils.ts          # formatNumber, shortenAddress, etc.
```

---

## Deployment

### Local Development

```bash
pnpm install
SKIP_JFS_VERIFICATION=true pnpm dev  # http://localhost:3003
# Test: curl -H 'Accept: application/vnd.farcaster.snap+json' http://localhost:3003/
# Emulator: https://farcaster.xyz/~/developers/snaps
```

### Production (snap.zaoos.com via Vercel)

```bash
# Deploy to Vercel with custom domain
vercel deploy --prod
# Set custom domain: snap.zaoos.com -> Vercel project
# Add CNAME record: snap.zaoos.com -> cname.vercel-dns.com
```

**Live URL:** `https://snap.zaoos.com`
**Share:** Cast this URL on Farcaster to see the snap in-feed

### Environment Variables

| Variable | Value |
|----------|-------|
| `SNAP_PUBLIC_BASE_URL` | `https://snap.zaoos.com` |
| `SKIP_JFS_VERIFICATION` | `true` (dev only) |

---

## Constraints Compliance

| Constraint | Our Design | Status |
|------------|-----------|--------|
| POST timeout 5s | 2-3 Viem multicalls (~1s) | OK |
| Text max 320 chars | Longest text is ~40 chars | OK |
| Bar chart max 6 bars | Top 5 recipients + supply 3 bars | OK |
| Button label max 30 chars | "Swap", "Send", "Activity" | OK |
| Item title max 100 chars | "Price", "Market Cap", etc. | OK |
| Item description max 160 chars | Numbers only | OK |
| Badge label max 30 chars | "Base", "Deflationary", "Community" | OK |
| HTTPS URLs in prod | snap.zaoos.com = HTTPS | OK |
| Version "1.0" | Yes | OK |
| Theme accent = palette color | `amber` | OK |

---

## Future Extensions (not in POC)

- **Tip Jar page** - toggle_group for amount (1K/10K/100K), send_token with pre-filled amount
- **Burn Tracker** - progress bar showing % of supply burned, updated live
- **Holder Leaderboard** - item_group with top holders, badge tiers (whale/dolphin/shrimp)
- **Year of the ZABAL Daily** - newsletter excerpt with open_url to full post
- **Content negotiation** - add snap response to zaoos.com token page
- **ZOE integration** - ZOE auto-casts the snap URL daily with updated stats

---

## Success Criteria

1. Snap renders in Farcaster feed when URL is cast
2. Dashboard shows live price, holders, burn count, distribution count
3. Swap button opens native wallet swap flow for ZABAL
4. Send button opens native wallet send flow
5. Activity page shows top recipients chart and supply breakdown
6. Back button returns to dashboard
7. BaseScan link opens in browser
8. Works in the snap emulator at farcaster.xyz/~/developers/snaps

---

## References

- [Doc 295 - Farcaster Snaps Deep Dive](../../research/farcaster/295-farcaster-snaps/)
- [Doc 258 - ZABAL + SANG Tokenomics](../../research/business/258-zabal-sang-buyback/)
- [Snap SKILL.md](https://docs.farcaster.xyz/snap/SKILL.md)
- [Snap LLMs.txt](https://docs.farcaster.xyz/snap/llms.txt) (2600-line full spec)
- [ZABAL on BaseScan](https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)
- [ZABAL on Clanker](https://www.clanker.world/clanker/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)
- [farcasterxyz/snap repo](https://github.com/farcasterxyz/snap) - MIT, template + examples
