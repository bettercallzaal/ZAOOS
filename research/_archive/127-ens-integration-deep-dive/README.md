# 127 — ENS Integration Deep Dive for ZAO OS

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Fix ENS resolution, add text records, evaluate zao.eth subdomains

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **RPC endpoint** | Switch from `eth.llamarpc.com` to `cloudflare-eth.com` with fallback chain — more reliable for ENS |
| **Forward verification** | Add `getEnsAddress()` check after `getEnsName()` to prevent spoofed reverse records |
| **Text records** | Read `avatar`, `description`, `com.twitter`, `url`, `com.discord` from ENS to enrich profiles |
| **Shared module** | Create `src/lib/ens/resolve.ts` — single source for both client and server-side ENS |
| **zao.eth subdomains** | Register `zao.eth` (~$640/year), use NameStone API for gasless `member.zao.eth` subnames |
| **ENSv2/Namechain** | No action needed — Namechain L2 was cancelled Feb 2026, everything stays on L1 mainnet |

## Current State in ZAO OS

### What's Built
- `src/hooks/useENS.ts` — client-side reverse resolution (address → name), in-memory cache
- `src/app/api/members/[username]/route.ts` — server-side ENS for up to 5 wallets per member
- `ens_name` field in users table + types
- ENS names displayed on settings page + member profiles

### What's Broken/Missing
- RPC endpoint `eth.llamarpc.com` may be rate-limited → some lookups fail silently
- No forward verification (spoofable)
- No ENS text records (missing: avatar, description, twitter, github, discord from ENS)
- No shared ENS utility module (duplicated logic between hook and API)
- No `normalize()` call on ENS names (required by ENSIP-1 for UTS-46 normalization)

## ENS Text Records (ENSIP-5)

Members with ENS names may have rich profile data stored on-chain:

| Key | Description | Example |
|-----|-------------|---------|
| `avatar` | Profile image URL (supports NFT URIs) | `eip155:1/erc721:0x.../123` |
| `description` | Free-text bio | "Music producer from NYC" |
| `url` | Website | "https://example.com" |
| `com.twitter` | X/Twitter handle | "bettercallzaal" |
| `com.github` | GitHub username | "bettercallzaal" |
| `com.discord` | Discord handle | "zaal#1234" |
| `org.telegram` | Telegram handle | "@zaal" |
| `email` | Email address | "zaal@thezao.com" |

**Viem code:**
```typescript
import { normalize } from 'viem/ens';

const twitter = await client.getEnsText({
  name: normalize('vitalik.eth'),
  key: 'com.twitter',
});
```

## zao.eth Subdomains

### Cost
- `zao.eth` (3 letters): ~$640/year + gas
- Subdomains: free once parent is owned

### Two approaches

**On-chain (NameWrapper):**
- Each subdomain = ERC-1155 NFT
- Gas cost per creation (~$2-5 at current prices)
- Fuses control permissions (can make subdomains irrevocable)

**Gasless offchain (NameStone + CCIP-Read):**
- Subdomains stored in database, resolved via CCIP-Read (ERC-3668)
- Zero gas cost
- Names resolve in any ENS-compatible app (wallets, dApps, etherscan)
- NameStone provides REST API for creation/management
- Trade-off: centralized storage

**Recommendation:** Start with gasless via NameStone. Register `zao.eth` on-chain, then issue `zaal.zao.eth`, `candy.zao.eth` etc. via API. Each member gets a ZAO subdomain displayed on their profile.

## ENSv2 / Namechain Status (Feb 2026)

ENS Labs cancelled the Namechain L2 rollup. Reason: Ethereum L1 gas dropped ~99% after the gas limit increase (30M → 60M in 2025, targeting 200M in 2026). ENSv2 will launch entirely on L1 mainnet — no cross-chain complexity.

**Impact for ZAO OS:** Current mainnet-pointing setup is correct and future-proof.

## How Others Use ENS

- **Farcaster:** Usernames can be `.eth` names directly. Neynar returns verified ETH addresses.
- **Zora:** Creator profiles resolve ENS, display `.eth` names prominently
- **Sound.xyz (vault.fm):** Artist pages showed ENS-resolved names for collectors

## Implementation Plan for ZAO OS

### Phase 1: Fix Resolution (now)
1. Switch RPC to `cloudflare-eth.com` with fallback
2. Add `normalize()` to all ENS name inputs
3. Create shared `src/lib/ens/resolve.ts`
4. Add forward verification

### Phase 2: Text Records (next)
5. Read `avatar`, `description`, `com.twitter`, `url`, `com.discord` for members with ENS
6. Display on member profile as "ENS Profile" section
7. Use ENS avatar as fallback PFP if no Farcaster PFP

### Phase 3: zao.eth Subdomains (future)
8. Register `zao.eth` (~$640/year)
9. Integrate NameStone API
10. Auto-issue `member.zao.eth` to all ZAO members
11. Display on profiles + use as shareable identity

## Sources

- [ENS Resolution Docs](https://docs.ens.domains/resolution/)
- [ENSIP-5: Text Records](https://docs.ens.domains/ensip/5)
- [Viem getEnsText](https://viem.sh/docs/ens/actions/getEnsText)
- [Viem getEnsName](https://viem.sh/docs/ens/actions/getEnsName)
- [ENS Subdomains](https://docs.ens.domains/web/subdomains/)
- [NameWrapper](https://ens.mirror.xyz/0M0fgqa6zw8M327TJk9VmGY__eorvLAKwUwrHEhc1MI)
- [NameStone Gasless Subnames](https://namestone.com/blog/gasless-subnames)
- [ENS Registration Fees](https://support.ens.domains/en/articles/7900605-fees)
- [ENS Labs Scraps Namechain](https://www.theblock.co/post/388932/ens-labs-scraps-namechain-l2-shifts-ensv2-fully-ethereum-mainnet)
- [Farcaster ENS Names](https://docs.farcaster.xyz/learn/architecture/ens-names)
