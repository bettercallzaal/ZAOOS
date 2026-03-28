# 28 — Cross-Platform Publishing: Publish Once, Distribute Everywhere

> **Status:** Research complete
> **Goal:** Make ZAO OS a hub that publishes to every social platform from one compose bar
> **Date:** March 2026

---

## Platform Comparison

| Platform | Users | Text Limit | Media | API Cost | Auth | Music Community |
|----------|-------|-----------|-------|----------|------|-----------------|
| **Farcaster** | 60K DAU | 1,024 chars | Images, embeds | Neynar plan | SIWF | Strong (Sonata, NOTES) |
| **Lens** | 45K WAU | Unlimited | Images, video | Free | EIP-712 | Limited |
| **Bluesky** | 40.2M | 300 chars | 4 images / 1 video | Free | OAuth 2.0 / DID | Growing (771+ starter packs) |
| **Nostr** | ~16M | Unlimited | Via NIP-94 | Free | Keypair | Strong (Wavlake) |
| **X/Twitter** | 600M+ | 280 chars | 4 images / 1 video | $200/mo Basic | OAuth 2.0 | Massive |
| **Mastodon** | 7M+ | 500 chars | 4 media | Free | OAuth 2.0 | Niche (SoNoMu, musician.social) |
| **Threads** | 200M+ | 500 chars | 10 images / 1 video | Free | Meta OAuth | Growing |
| **Instagram** | 2B+ | 2,200 chars | Images, Reels | Free | Graph API | Huge (strict rules) |
| **TikTok** | 1.5B+ | Video only | Video | Free (approval) | OAuth | Massive discovery |
| **YouTube** | 2.5B+ | Video only | Video | Free (quota) | OAuth 2.0 | Massive |

---

## 1. Lens Protocol (V3 on Lens Chain)

### Current State
- **Lens Chain mainnet** launched April 4, 2025 — migrated from Polygon to ZKSync ZK Stack
- **650,000 accounts**, ~45,000 weekly active users
- $45M total funding (including $31M from Lightspeed Faction)
- **Mask Network acquired stewardship** of consumer products (Jan 2026)

### Architecture (V3)
- Modular "social primitives": Accounts, Usernames, Graphs, Feeds, Groups, Rules, Actions
- Onchain Rules Engine for programmable social interactions
- **Grove**: decentralized storage for content
- Account abstraction built in

### Publication Model
- **Posts** (top-level), **Comments** (threaded), **Mirrors** (reshares), **Quotes**
- **Collect modules**: followers mint posts as NFTs with configurable pricing, limits, referral fees

### Bonsai Token
- DN-404 hybrid (ERC-20 + ERC-721) — every 100K BONSAI = 1 BONSAI NFT
- ~77% market share of paid mints on Lens
- 100M supply, 60% community allocation
- Used for: collecting posts, tipping, swapping, DeFi actions in-feed

### SDK
- `@lens-protocol/client` — framework-agnostic JS SDK (~4,950 weekly npm downloads)
- `@lens-protocol/react-web` — React hooks (v2.3.2)
- GraphQL-based API with typed fragments
- Docs at lens.xyz/docs

### Cross-Posting with Farcaster
- **Buttrfly** and **Phaver** bridge Lens + Farcaster
- **Supercast** enables cross-posting (Vitalik advocates this)
- No dedicated bridge API — done at client/app level

### Key Apps
- **Hey** (formerly Lenster) — Twitter-like feed
- **Orb** — 50K+ MAU (acquired by MaskDAO)
- **Tape** — TikTok-like short-form video
- **Phaver** — cross-protocol social app

---

## 2. Bluesky / AT Protocol

### Current State
- **40.2 million users**, 3.5-4.1M DAU
- 50,000+ custom feeds created
- **Free API** — no pricing tiers

### Architecture
1. **PDS (Personal Data Server)** — hosts your data, handles login
2. **Relay (BGS)** — crawls network, aggregates into firehose
3. **AppView** — assembles feeds from firehose

### API & SDK
- `@atproto/api` — official TypeScript SDK with built-in rate limit retry
- RESTful XRPC endpoints (not GraphQL)
- Key: `com.atproto.repo.createRecord`, `app.bsky.feed.post`
- **Rate limits:** 5,000 points/hour, 35,000 points/day

### Auth
- DID-based identity with DNS handles
- OAuth 2.0 with granular scoping (2025 update)
- App passwords for legacy

### Music Community
- **771+ Musicians starter packs**, 46+ Music Industry starter packs
- Natural migration target from X for music professionals
- Custom feeds can be created for music topics

---

## 3. Nostr Protocol

### How It Works
- **Keypairs**: npub (public) / nsec (private)
- **Relays**: simple servers accepting/serving events (no central authority)
- **Events**: JSON with kind, content, tags, sig

### Key Event Kinds
- Kind 0: Profile metadata
- Kind 1: Text note (post)
- Kind 3: Follow list
- NIP-38: Live statuses (what you're listening to)

### SDKs
- **nostr-tools**: Core protocol primitives
- **NDK (Nostr Development Kit)**: Higher-level, supports Svelte 5, React, React Native

### Music on Nostr — Wavlake
- Bitcoin Lightning-powered music streaming deeply integrated with Nostr
- Every song published as a Nostr note
- **Value 4 Value (V4V)**: listeners send micropayments in sats
- Flat 10% platform fee
- Artists report **$13,000/year on Wavlake vs $750 in 5 years** on traditional streaming
- Permissionless — no API keys, no rate limits from protocol

---

## 4. The Arena (Avalanche SocialFi)

### What It Is
- SocialFi on Avalanche — buy/trade "Tickets" (social tokens) representing creator relevance
- Bonding curve pricing
- **200,000+ users**, $10M+ paid in tips, $284M 30-day swap volume

### V2 Features (May 2025)
- Bonding-curve launchpad + native DEX in social feed
- Upcoming: Arena Stages (social audio + payments), Arena Groups, mini app store

### API
- **No public developer API** for third-party integration
- Would require direct on-chain interaction with Avalanche smart contracts
- Social token model relevant to ZAO (fans invest in artists)

---

## 5. Twitter/X API

### Pricing (2026)

| Tier | Cost | Read | Write |
|------|------|------|-------|
| **Free** | $0 | None | 1,500 tweets/mo |
| **Basic** | $200/mo | 15K tweets/mo | 50K tweets/mo |
| **Pro** | $5,000/mo | Full search | Full access |
| **Enterprise** | $42K+/mo | Everything | Everything |

- Feb 2026: added pay-as-you-go model alongside fixed tiers
- Free tier is **write-only** — sufficient for cross-posting text
- Best library: `twitter-api-v2` (npm)

---

## 6. Mastodon / ActivityPub

### API
- RESTful with JSON payloads
- OAuth 2.0 authentication per instance
- `POST /api/v1/statuses` to create posts
- 7M+ registered users across instances

### Music Instances
- **SoNoMu** (sonomu.club) — Sound, Noise, Music
- **musician.social** — all genres
- **musicians.today** — all levels
- **stereodon.social** — underground
- **drumstodon.net** — drummers

### Federation
- ActivityPub standard — content flows between compatible services
- Account portability between servers

---

## 7. Threads (Meta)

### API (launched June 2024, expanded July 2025)
- Post publishing: text, images, video, carousels
- GIF support via GIPHY (Feb 2026)
- Reply management, insights/analytics
- oEmbed API (no access token, March 2026)
- Partners: Hootsuite, Sprinklr, Ayrshare
- No DM API

---

## 8. Instagram

- **Business/Creator accounts only** via Meta App
- Rate limit: **25 posts per 24 hours**
- Supports: images, Reels, carousels, stories
- **Strict music copyright enforcement** — original music safer for automated posting

---

## 9. TikTok

- Direct Post or Upload to Inbox (draft review)
- **6 requests/minute** per access token
- App approval: 5-10 business days
- API-posted videos with unlicensed music get flagged
- Original music content recommended

---

## 10. YouTube

- Data API v3: **10,000 units/day** default quota
- Video upload: ~1,600 units = **~6 uploads/day max**
- Quota resets midnight Pacific
- Can request increases (free, merit-based)
- Shorts: upload as regular video with #Shorts + vertical format

---

## 11. Cross-Platform Publishing Tools

### Ayrshare API (Recommended Shortcut)

| Plan | Cost | Posts/mo | Platforms |
|------|------|---------|-----------|
| Free | $0 | 20 | All supported |
| Starter | $49/mo | — | All |
| Premium | $99/mo | 1,000 | All |
| Business | $499/mo | Multi-user | All |

Supports: X, Bluesky, Instagram, Threads, TikTok, YouTube, Reddit, Telegram, Pinterest, LinkedIn, Snapchat

### Other Tools
- **Hootsuite**: Public API, $99+/mo plans
- **Buffer**: Private API only
- **Later**: No public API

### Web3-Native Cross-Posting
No single "publish once, distribute everywhere" web3 tool exists yet. Closest:
- Phaver and Buttrfly bridge Lens + Farcaster
- Supercast enables cross-posting
- Building custom fan-out is most realistic

---

## 12. Recommended Architecture

### Minimum Viable Cross-Post

Text (truncated per platform) + link + 1 image

### Queue-Based Fan-Out

```
User creates post in ZAO OS
        │
        ▼
  [Post Normalization Service]
  - Store canonical post (text, media, metadata)
  - Upload media to CDN/IPFS
        │
        ▼
  [Message Queue (BullMQ/Redis)]
  - Fan out to platform-specific workers
        │
        ├──► [Farcaster] → Neynar API (already built)
        ├──► [Lens] → Lens SDK
        ├──► [Bluesky] → @atproto/api
        ├──► [Nostr] → NDK/nostr-tools
        ├──► [Hive] → @hiveio/dhive
        ├──► [X] → twitter-api-v2
        ├──► [Mastodon] → REST API
        ├──► [Threads] → Threads API
        ├──► [Instagram] → Graph API (via Ayrshare)
        ├──► [TikTok] → Content API (via Ayrshare)
        └──► [YouTube] → Data API v3
        │
        ▼
  [Status Tracker]
  - Success/failure per platform
  - Retry with exponential backoff
  - Store platform post IDs for analytics
```

### Platform-Specific Formatting

| Platform | Format Notes |
|----------|-------------|
| **Bluesky** | "Facets" for rich text (byte-offset, not markdown) |
| **Mastodon** | Basic HTML in content |
| **Farcaster** | Plain text + embeds as separate fields |
| **Lens** | Markdown-compatible |
| **Nostr** | Plain text, media via tags |

---

## Integration Priority

### Tier 1 — Build Custom (Web3 Native, Music-Aligned)

| Platform | Why | Cost |
|----------|-----|------|
| **Farcaster** | Already built, primary home | Neynar plan |
| **Lens** | Web3 social, collect/monetize, growing | Free |
| **Bluesky** | 40M users, free API, active music community | Free |
| **Nostr** | Wavlake music + V4V micropayments | Free |
| **Hive** | On-chain monetization, music communities | Free |

### Tier 2 — Use Ayrshare ($49-99/mo)

| Platform | Why | Notes |
|----------|-----|-------|
| **X/Twitter** | Mainstream reach | Free tier = 1,500 writes/mo |
| **Mastodon** | Open, music instances | Free API |
| **Threads** | Growing, Meta backing | Free API |

### Tier 3 — Media Platforms (Higher Effort)

| Platform | Why | Notes |
|----------|-----|-------|
| **Instagram** | Visual/music, strict rules | Business account required |
| **TikTok** | Music discovery powerhouse | Approval needed |
| **YouTube** | Music video platform | Quota limits |

### Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| Tier 1 custom integrations | $0 (all free APIs) |
| Ayrshare for Tier 2-3 | $49-99/mo |
| X API Basic (if needed) | $200/mo (optional) |
| **Total** | **$49-299/mo** |

---

## Sources

- [Lens Chain Launch](https://blog.availproject.org/lens-chain-goes-live-scaling-socialfi-with-avail-and-zksync/)
- [Introducing New Lens](https://lens.xyz/news/introducing-the-new-lens)
- [Farcaster vs Lens](https://blockeden.xyz/blog/2026/01/13/farcaster-vs-lens-socialfi-web3-social-graph/)
- [Lens SDK (npm)](https://www.npmjs.com/package/@lens-protocol/client)
- [Bonsai Token (CoinGecko)](https://www.coingecko.com/en/coins/bonsai-token)
- [Bluesky Rate Limits](https://docs.bsky.app/docs/advanced-guides/rate-limits)
- [Bluesky Stats (Sprout Social)](https://sproutsocial.com/insights/bluesky-statistics/)
- [Bluesky AT Protocol Architecture](https://docs.bsky.app/docs/advanced-guides/federation-architecture)
- [Bluesky OAuth](https://docs.bsky.app/blog/oauth-atproto)
- [Bluesky for Musicians](https://artistpush.me/blogs/news/what-is-bluesky-social-and-how-does-it-work-for-musicians)
- [Musicians Bluesky Starter Packs](https://blueskystarterpack.com/musicians)
- [X API Pricing 2026](https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/)
- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [NDK](https://github.com/nostr-dev-kit/ndk)
- [Wavlake Guide](https://onnostr.substack.com/p/a-beginners-guide-to-wavlake-empowering)
- [Wavlake V4V](https://www.nobsbitcoin.com/wavlake-value-for-value-music-with-lightning/)
- [The Arena on Avalanche](https://www.avax.network/about/blog/the-arenas-comeback-socialfi-app-on-avalanche)
- [Threads API](https://developers.facebook.com/blog/post/2024/06/18/the-threads-api-is-finally-here/)
- [Instagram Graph API 2026](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [TikTok Content Posting API](https://developers.tiktok.com/products/content-posting-api/)
- [YouTube Data API v3 Quotas](https://elfsight.com/blog/youtube-data-api-v3-limits-operations-resources-methods-etc/)
- [Ayrshare Pricing](https://www.ayrshare.com/pricing/)
- [Mastodon ActivityPub](https://docs.joinmastodon.org/spec/activitypub/)
- [SoNoMu Music Instance](https://sonomu.club/)
- [Music Mastodon Servers](https://mastodonservers.net/servers/music)
- [Crossbell Protocol](https://crossbell.io/)
- [Fan-Out Architecture](https://getstream.io/glossary/fan-out/)
