# 136 — API Status Verification — March 2026

> **Status:** Verified
> **Date:** March 25, 2026
> **Goal:** Confirm which APIs are active vs deprecated before integrating

## Critical Changes Affecting ZAO OS

| Change | Impact | Action |
|--------|--------|--------|
| **Sound.xyz SHUT DOWN** (Jan 16, 2026) | Music NFT fallback API is dead | Remove Sound.xyz API calls, rely on Alchemy NFT scan |
| **Neynar acquired Farcaster** (Jan 2026) | ~$1B deal, founders left. Credits-based pricing. | Monitor for breaking changes, current API still works |
| **POAP in maintenance mode** (Mar 16, 2026) | No new POAPs can be created, API still works read-only | Can still display existing POAPs but don't build new features on it |
| **Gitcoin Passport → Human Passport** | Acquired by Holonym Feb 2025, rebranded | API endpoints may have changed, verify at human.tech |

## Verified Active (safe to integrate)

| Service | Status | Last Verified | Notes |
|---------|--------|--------------|-------|
| **Neynar** | ACTIVE | Mar 2026 | Now owns Farcaster. Credits pricing. Existing API works. |
| **OpenRank** | ACTIVE | Mar 2026 | Karma3 Labs, $4.5M seed. No changes. |
| **Airstack** | ACTIVE | Mar 2026 | $21.3M Series A. Free tier unclear — check directly. |
| **EAS** | ACTIVE | Mar 2026 | OP Stack predeploy, unchanged. |
| **Coinbase Verified** | ACTIVE | Mar 2026 | 500K+ users on Base. |
| **Snapshot** | ACTIVE | Mar 2026 | Dominant DAO voting. Docs at docs.snapshot.box now. |
| **Audius** | ACTIVE | Mar 2026 | API + SDK both active. |
| **EFP** | ACTIVE | Mar 2026 | api.ethfollow.xyz operational. |
| **Basenames** | ACTIVE | Mar 2026 | 750K+ registrations on Base. |
| **Talent Protocol** | ACTIVE | Mar 2026 | Builder Score V2, API v3. |
| **Guild.xyz** | ACTIVE | Mar 2026 | V2 at era.guild.xyz. |
| **Delegate.xyz** | ACTIVE | Mar 2026 | 150+ integrations. |
| **Zora Coins** | ACTIVE | Mar 2026 | SDK + API active, key recommended. |
| **Moxie** | ACTIVE | Mar 2026 | $1.7M locked, 3K+ fan tokens on Base. |
| **Alchemy** | ACTIVE | Mar 2026 | 30M CU/month free tier, all APIs working. |

## Stagnant / At Risk

| Service | Status | Concern |
|---------|--------|---------|
| **DegenScore** | ACTIVE (stagnant?) | API docs up but no development signals. 3,836 beacon holders. |
| **POAP** | MAINTENANCE MODE | No new issuers since Mar 16, 2026. Read API works. |

## Dead / Shut Down

| Service | Status | Date |
|---------|--------|------|
| **Sound.xyz** | SHUT DOWN | Jan 16, 2026 |
| **Sound.xyz API** | DEAD | Pivoted to Vault.fm (no public API) |

## Revised Integration Priority

Based on verified status, here's what to actually build:

### Tier 1: Verified Active, Free, No New Keys
1. Neynar Score (already have)
2. OpenRank (free, no key, verified active)
3. Coinbase Verified ID (free GraphQL, verified active)
4. EAS Attestations (free GraphQL, verified active)
5. Snapshot Voting (free GraphQL, verified active)
6. Audius Profile (free API, verified active)
7. EFP On-Chain Followers (free API, verified active)
8. Basenames (ENS resolution, verified active)

### Tier 2: Verified Active, Need Free Key
9. Airstack FarScore (apply at airstack.xyz)
10. Talent Builder Score (apply at talentprotocol.com)
11. Guild.xyz Memberships (SDK, free)

### Tier 3: Changed/Rebranded — Verify New Endpoints
12. Human Passport (was Gitcoin Passport, now at human.tech)

### Remove from Codebase
13. Sound.xyz direct API calls (DEAD — use Alchemy NFT scan instead)

## Code Actions Needed

1. **Remove Sound.xyz fallback** in `src/app/api/music/wallet/route.ts` — the `fetchSoundXyz()` function calls a dead API
2. **Update POAP integration plan** — read-only display of existing POAPs is fine, but don't plan features around creating new ones
3. **Monitor Neynar** — they now own Farcaster, pricing model may change

## Sources

- [Sound.xyz Sunsetting](https://paragraph.com/@soundxyz/sunsetting-sound)
- [POAP Maintenance Mode](https://thedefiant.io/news/nfts-and-web3/poap-moves-to-maintenance-mode-as-founders-eye-next-generation-of-digital-collectibles)
- [Neynar Acquires Farcaster](https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app)
- [Gitcoin Passport → Human Passport](https://passport.human.tech/blog/from-gitcoin-passport-to-human-passport-we-re-now-part-of-human-tech)
- [All other sources from research docs 133-135]
