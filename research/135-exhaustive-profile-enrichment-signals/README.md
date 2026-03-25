# 135 — Exhaustive Profile Enrichment Signals

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Every possible data point readable from wallet, FID, or social accounts

## Top Recommendation: Airstack

**One API to replace 5-6 individual calls.** Airstack's single GraphQL query resolves:
wallet → ENS → Farcaster → Lens → POAPs → XMTP → NFTs → Moxie → FarScore

Free tier available. `https://api.airstack.xyz/gql`

## NEW Signals Not in Previous Research (docs 133/134)

| # | Signal | Lookup | API | Free? | Music Community Value |
|---|--------|--------|-----|-------|----------------------|
| 1 | **Airstack FarScore** | FID | `api.airstack.xyz/gql` | Free tier | HIGH — rich influence metric |
| 2 | **Snapshot Voting** | Wallet | `hub.snapshot.org/graphql` | Free | HIGH — "Voted in 47 proposals" |
| 3 | **Wallet Age** | Wallet | Etherscan/Alchemy | Free | HIGH — "Wallet since 2018" |
| 4 | **Audius Profile** | Handle | `api.audius.co/v1/users` | Free | VERY HIGH — tracks, plays, followers |
| 5 | **EFP On-Chain Followers** | Wallet | `api.ethfollow.xyz` | Free | HIGH — on-chain social graph |
| 6 | **Hypersub Subscriptions** | FID | Neynar (existing key) | Free | HIGH — "Supports 3 creators" |
| 7 | **Basenames** | Wallet | ENS resolution | Free | MEDIUM — ".base.eth" identity |
| 8 | **Moxie Earnings** | FID | Airstack | Free | MEDIUM — Farcaster economic activity |
| 9 | **Safe Multisig** | Wallet | `safe-transaction-mainnet.safe.global` | Free | LOW — treasury managers |
| 10 | **Guild.xyz Memberships** | Wallet | `@guildxyz/sdk` | Free | MEDIUM — community roles |
| 11 | **Delegate.xyz** | Wallet | `api.delegate.xyz` | Free | LOW — delegation status |
| 12 | **Music NFT Detection** | Wallet | Alchemy getNftsForOwner | Free (existing) | HIGH — Sound/Zora/Catalog NFTs |
| 13 | **Zora Creator Coins** | Wallet | `@zoralabs/coins-sdk` | Free | MEDIUM — creator economy |
| 14 | **Channel Memberships** | FID | Neynar (existing key) | Free | MEDIUM — "/music, /zao, /base" |

## Full Signal Inventory (All Sources)

### Already Built (Batch 1 — deployed)
- Neynar Score (0-1)
- OpenRank (engagement rank)
- Coinbase Verified ID (Base EAS)
- EAS Attestation Count (Optimism)
- GitHub Activity (repos, followers)

### Ready to Add (free, no new keys)
- Wallet Age (first transaction timestamp)
- Snapshot Voting History (proposals voted, DAOs)
- Audius Profile (followers, tracks, plays)
- EFP On-Chain Followers (api.ethfollow.xyz)
- Basenames (.base.eth resolution)
- Safe Multisig Detection
- Hypersub Subscriptions (existing Neynar key)
- Channel Memberships (existing Neynar key)
- Music NFT Count (existing Alchemy key)

### Need Free API Key (apply)
- Airstack FarScore + Cross-Protocol (airstack.xyz)
- Talent Builder Score (talentprotocol.com)
- Human Passport (developer.passport.xyz)
- POAPs (documentation.poap.tech)
- Guild.xyz SDK

### Skip
- Spotify (API removed user lookup Feb 2026)
- Bandcamp (no public API)
- X/Twitter ($200/mo minimum)
- Lens (low ZAO member overlap)
- World ID (low adoption)
- OnchainScore.xyz (no API yet)

## Music-Specific Signals (Highest Value for ZAO)

| Signal | What It Shows | Source |
|--------|-------------|--------|
| **Audius Profile** | Tracks published, total plays, followers | Free API |
| **Music NFTs Collected** | Sound.xyz, Zora, Catalog holdings | Alchemy (existing) |
| **Hypersub Subscriptions** | Which music creators they support | Neynar (existing) |
| **Moxie Earnings** | Farcaster economic activity | Airstack (free) |
| **Zora Creator Coins** | Creator economy participation | On-chain reads |

## Profile Display Mockup

```
┌─────────────────────────────────────────┐
│ REPUTATION SIGNALS                       │
├─────────────────────────────────────────┤
│ Farcaster   Score: 82   #1,234 rank     │
│ Wallet      Since 2018  Safe: No        │
│ Coinbase    ✓ Verified  12 attestations  │
│ Governance  47 Snapshot votes            │
│ GitHub      14 repos · 89 followers      │
│ On-chain    47 EFP followers             │
│ Audius      142 followers · 8 tracks     │
│             Total plays: 45,230          │
│ Music NFTs  7 collected (Sound, Zora)    │
│ Hypersub    Supports 3 creators          │
│ Builder     72/100 Talent Score          │
│ POAPs       23 events attended           │
└─────────────────────────────────────────┘
```

## Sources

- [Airstack Docs](https://docs.airstack.xyz/)
- [Airstack FarScore](https://docs.airstack.xyz/airstack-docs-and-faqs/farcaster/farscore)
- [Snapshot GraphQL API](https://docs.snapshot.org/graphql-api)
- [EFP API Docs](https://docs.ethfollow.xyz/api/)
- [Safe Transaction Service](https://safe-transaction-mainnet.safe.global/)
- [Delegate.xyz API](https://docs.delegate.xyz/)
- [Guild.xyz SDK](https://github.com/guildxyz/guild-sdk)
- [Audius API](https://docs.audius.org/developers/api/get-user)
- [Zora Coins SDK](https://docs.zora.co/coins)
- [Hypersub/Fabric STP](https://docs.withfabric.xyz/)
- [Zerion API](https://developers.zerion.io/)
- [Basenames](https://docs.base.org/identity/basenames)
