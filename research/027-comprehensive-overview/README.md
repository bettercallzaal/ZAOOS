# 27 — Comprehensive Research Overview & Cross-Platform Expansion Plan

> **Status:** Master index + gap analysis + cross-platform research plan
> **Date:** March 2026
> **Purpose:** Organize everything researched so far, identify gaps, plan cross-platform expansion to bring profit/data/IP rights back to artists

---

> [!NOTE]
> **This document has been superseded by [Doc 50 — The ZAO Complete Guide](../050-the-zao-complete-guide/).** Retained for historical gap analysis reference.

## Part 1: What We've Researched (26 Docs, 7 Supplementary)

### Protocol & Infrastructure (7 docs)

| # | Doc | Summary | Status |
|---|-----|---------|--------|
| 01 | Farcaster Protocol | On-chain identity (Optimism) + off-chain messaging (Snapchain 10K+ TPS) | Complete |
| 02 | Hub API | Neynar REST + gRPC streaming, managed signers | Complete |
| 10 | Hypersnap | Incomplete — needs manual review | Blocked |
| 14 | Project Structure | Single Next.js app, GitHub Projects kanban | Complete |
| 17 | Neynar Onboarding | SIWF + managed signers + FID registration for new users | Complete |
| 18 | Security Audit | Pre-build checklist (env, sessions, Zod, rate limits) | Complete |
| 21 | Farcaster Deep Dive | Neynar acquired Farcaster Jan 2026, 40-60K DAU, developer-first pivot | Complete |

### Community & Social (4 docs)

| # | Doc | Summary | Status |
|---|-----|---------|--------|
| 12 | Gating | Allowlist (MVP) → NFT → Hats → EAS progression | Complete |
| 13 | Chat Messaging | Farcaster channels (public) + XMTP (private encrypted) | Complete |
| 20 | Followers/Following | Sortable/filterable lists — no other client has this | Complete |
| 22 | Ecosystem Players | Leaderboards, tokens (DEGEN/MOXIE/NOTES/CLANKER), mini apps, DAOs | Complete |

### Music & Curation (2 docs)

| # | Doc | Summary | Status |
|---|-----|---------|--------|
| 03 | Music Integration | Audius, Sound.xyz, Spotify APIs + unified Track schema + audio player | Complete |
| 04 | Respect Tokens | Soulbound reputation: curation mining, tiers, 2% weekly decay | Complete |

### Identity & Roles (3 docs)

| # | Doc | Summary | Status |
|---|-----|---------|--------|
| 05 | ZAO Identity (ZIDs) | FID wrapper + music profile + Respect + roles | Complete |
| 06 | Quilibrium | Privacy-preserving storage, Go-only SDK, design-compatible but don't block | Complete |
| 07 | Hats Protocol | On-chain role trees (curator/artist/mod) as non-transferable ERC-1155 | Complete |

### AI & Intelligence (3 docs)

| # | Doc | Summary | Status |
|---|-----|---------|--------|
| 08 | AI Memory | Implicit + explicit memory, pgvector, consolidation pipeline | Complete |
| 24 | ZAO AI Agent | ElizaOS + Claude + Hindsight, 4-phase plan, separate repo | Complete |
| 26 | Hindsight Memory | SOTA agent memory (91.4%), retain/recall/reflect, MCP support | Complete |

### Ecosystem & Reference (4 docs)

| # | Doc | Summary | Status |
|---|-----|---------|--------|
| 09 | Public APIs | Tier 1/2/3 API landscape (Neynar, Audius, Spotify, etc.) | Complete |
| 11 | Reference Repos | Sonata (MIT), Herocast (AGPL), Nook, Farcord | Complete |
| 19 | Ecosystem Landscape | Open-source clients, frame frameworks, data providers | Complete |
| 23 | Austin Griffith / ETH Skills | Scaffold-ETH 2, BuidlGuidl, ERC-8004 trustless agents, onchain credentials | Complete |

### APIs & Tools (2 docs)

| # | Doc | Summary | Status |
|---|-----|---------|--------|
| 16 | UI Reference | CG/Commonwealth patterns, Discord-style dark UI, navy+gold | Complete |
| 25 | Public APIs Index | 100+ APIs mapped to ZAO features by priority | Complete |

### Supplementary Docs (7)

| Doc | Location | Summary |
|-----|----------|---------|
| XMTP Research | docs/ | V3 MLS encryption, browser-sdk, COEP headers, agent integration |
| Hive Research | docs/ | InLeo, PeakD, music communities, cross-post monetization |
| Mini App Research | docs/ | Frames v2 → Mini Apps, SDK, manifest, notifications |
| Hub Streaming | docs/ | @farcaster/shuttle for cost reduction |
| Neynar Credit Optimization | docs/ | Credit usage optimization strategies |
| RESEARCH.md | root | Condensed research brief |
| BUILDLOG.md | root | Build-in-public narrative journal |

---

## Part 2: Research Gaps — What's Missing

### GAP 1: Cross-Platform Publishing (Critical)

We have Farcaster and Hive research, but no research on:

| Platform | Why It Matters | Research Needed |
|----------|---------------|-----------------|
| **Lens Protocol** | Second-largest decentralized social protocol, Polygon-based, Bonsai integration | API, SDK, cross-posting, publication model |
| **The Arena** | Social token trading platform on Avalanche, growing fast | API, social tokens, integration model |
| **Bluesky / AT Protocol** | 40M+ users, biggest decentralized competitor | API, cross-posting, identity bridging |
| **Nostr** | 16M users, Bitcoin community, relay-based | Protocol, NIPs, cross-posting feasibility |
| **Twitter/X** | Still largest social platform, essential for reach | API v2 costs, cross-posting, OAuth |
| **Instagram** | Visual/music discovery, Reels for short music content | Graph API, business accounts, limitations |
| **TikTok** | Music discovery powerhouse, short-form content | API access, music features, viral distribution |
| **YouTube** | Music video platform, YouTube Music integration | Data API v3, embeds, music content |
| **Threads** | Meta's Twitter competitor, growing fast | API availability, integration options |
| **Mastodon / ActivityPub** | Federated social, open protocol | ActivityPub spec, cross-posting |

### GAP 2: Artist Revenue & IP Rights (Critical — Core Mission)

No research on:

| Topic | Why It Matters |
|-------|---------------|
| **Music IP / Rights Management** | How to track and protect artist IP on-chain |
| **On-chain royalty splits** | Smart contracts for automatic revenue distribution |
| **Music NFT economics** | Revenue models: editions, 1/1s, streaming tokens |
| **Stems / remix rights** | Decentralized stem trading and remix licensing |
| **Streaming revenue data** | How much artists actually earn per stream across platforms |
| **Distribution platforms** | DistroKid, TuneCore, LANDR — API integrations |
| **Publishing rights** | ASCAP, BMI, SESAC — how on-chain publishing works |
| **Sync licensing** | Placing music in media — decentralized sync marketplaces |
| **Fan funding models** | Patronage, crowdfunding, pre-saves, tip jars |
| **Social capital → revenue** | Converting community engagement into artist income |

### GAP 3: Social Capital Economics (Important)

No research on:

| Topic | Why It Matters |
|-------|---------------|
| **Social token models** | Rally, Roll, Coinvise — creator tokens for communities |
| **Fan engagement economics** | How social capital converts to real value for artists |
| **Community-owned labels** | DAO-run record labels (Coop Records model deep dive) |
| **Curator incentives** | How to properly incentivize quality curation at scale |
| **Token-gated experiences** | Exclusive content, live streams, merch drops |
| **Revenue sharing models** | How platforms split revenue with creators |

### GAP 4: Web2 API Integration (Important)

No research on specific integration patterns for:

| Platform | What We Need |
|----------|-------------|
| **Discord** | Bot API, OAuth, webhook bridge to ZAO |
| **Telegram** | Bot API, community management, notifications |
| **Twitch** | Live music streaming integration |
| **Substack / Paragraph** | Newsletter/writing integration |
| **Patreon / Buy Me a Coffee** | Fan funding integration |

### GAP 5: Mobile & Distribution (Medium)

| Topic | Why It Matters |
|-------|---------------|
| **PWA vs Native** | Push notifications, offline, app stores |
| **React Native / Expo** | Native mobile app option |
| **App Store policies** | Crypto/web3 app approval challenges |

---

## Part 3: Cross-Platform Research Plan

### Priority Research Sprints

#### Sprint 1: Cross-Platform Publishing Hub (Next)

Research how ZAO OS can become a **publish-once, distribute-everywhere** hub.

**Research doc 28: Cross-Platform Publishing**
- Lens Protocol: API, SDK, publication model, Bonsai token
- Bluesky / AT Protocol: API, cross-posting, DID identity
- The Arena: social tokens, API, Avalanche integration
- Nostr: NIPs, relay publishing, key management
- Twitter/X: API v2 pricing, OAuth 2.0, cross-posting
- Mastodon: ActivityPub federation, cross-posting
- Threads: API status, Meta developer tools
- Instagram: Graph API, music content limitations
- TikTok: API access for music content
- YouTube: Data API v3, music content
- **Key question:** What's the minimum viable cross-post? (text + link + image)
- **Architecture:** Single compose → fan-out to all connected platforms

#### Sprint 2: Artist Revenue & IP Rights

Research how ZAO can **bring profit margins, data, and IP rights back to artists**.

**Research doc 29: Artist Revenue & IP Rights**
- Current streaming economics: per-stream rates across platforms
- Music NFT models: Sound.xyz, Catalog, Zora — what's working
- On-chain royalty splits: 0xSplits, Superfluid, custom smart contracts
- Publishing rights on-chain: EAS attestations for IP claims
- Distribution APIs: DistroKid, TuneCore integration options
- Stems & remix rights: decentralized licensing protocols
- Sync licensing: decentralized sync marketplaces
- Revenue transparency: on-chain vs off-chain revenue tracking
- **Key question:** How does ZAO's social capital (Respect, curation) translate to real artist revenue?

#### Sprint 3: Social Capital → Revenue Pipeline

Research how to convert community engagement into artist income.

**Research doc 30: Social Capital Economics**
- Social token models (Rally, Coinvise, Friend.tech learnings)
- Community-owned label model (deep dive on Coop Records DAO)
- Curator-as-investor: early curators earn when artists succeed
- Token-gated experiences: exclusive drops, live streams, merch
- Revenue sharing: how Spotify, Apple Music, YouTube split revenue
- Fan funding: Patreon, Buy Me a Coffee, Drip, Hypersub
- **Key question:** What's the ZAO flywheel? (Curate → Earn Respect → Access → Revenue Share)

#### Sprint 4: Web2 Platform Bridges

Research connecting ZAO to existing communities.

**Research doc 31: Web2 Platform Bridges**
- Discord bot: bridge ZAO channel ↔ Discord server
- Telegram bot: notifications, community management
- Twitch: live music streaming integration
- Newsletter: Paragraph/Substack cross-posting
- Patreon/BMAC: fan funding bridge
- RSS: generate feeds from ZAO content
- **Key question:** How do we pull people FROM web2 platforms INTO ZAO?

#### Sprint 5: Lens Protocol & The Arena Deep Dives

**Research doc 32: Lens Protocol Integration**
- Lens V2 architecture (Polygon + Momoka)
- Publication types, collect modules, follow modules
- Bonsai token and social graph portability
- Cross-posting between Farcaster and Lens
- SDK and API for building on Lens

**Research doc 33: The Arena Integration**
- Social token trading on Avalanche
- How Arena tokens work (buy/sell creator tokens)
- API and integration options
- Relevance to ZAO's Respect token model

---

## Part 4: The ZAO Vision Map

### The Problem

Artists lose 70-90% of revenue to intermediaries. They don't own their data, their audience relationships, or their IP. Streaming pays $0.003-0.005 per stream. Social platforms extract value from creators without sharing.

### The ZAO Solution

A tight-knit community that:
1. **Curates** music early (before it's popular) and earns Respect for quality curation
2. **Connects** artists directly with their most engaged fans (no intermediary)
3. **Distributes** across every platform from one hub (Farcaster + Hive + Lens + web2)
4. **Monetizes** through on-chain revenue splits, NFT editions, and social tokens
5. **Protects** IP rights through on-chain attestations and transparent royalty tracking

### The Flywheel

```
Artist releases music on ZAO
         ↓
Community curates (share, upvote, recommend)
         ↓
Curators earn Respect tokens
         ↓
Respect unlocks roles (Curator → Elder → Legend)
         ↓
Roles grant revenue share from community fund
         ↓
Community fund grows from:
  - Music NFT secondary sales (royalties)
  - Cross-platform distribution revenue
  - Token-gated experiences
  - Grants (Purple DAO, Optimism RetroPGF)
         ↓
Revenue flows back to artists + curators
         ↓
More artists join → more music → more curation → flywheel accelerates
```

### Social Capital as Currency

| Layer | What It Is | How It Earns |
|-------|-----------|-------------|
| **Respect** | Soulbound reputation | Curate early, curate quality, be consistent |
| **Roles (Hats)** | On-chain permissions | Earned via Respect thresholds |
| **Revenue Share** | % of community fund | Higher Respect = higher share |
| **Early Access** | First to hear new releases | Curator tier and above |
| **Governance** | Community decisions | Elder tier and above |

### Cross-Platform Strategy

```
                    ┌─── Farcaster (primary, native)
                    ├─── Hive (on-chain monetization)
                    ├─── Lens (decentralized social graph)
ZAO OS ─── publish ─┼─── Bluesky (decentralized reach)
                    ├─── Twitter/X (mainstream reach)
                    ├─── Discord (community bridge)
                    ├─── Nostr (censorship resistance)
                    └─── Web2 (Instagram, TikTok, YouTube)

                    ┌─── XMTP (encrypted DMs + groups)
ZAO OS ─── message ─┤
                    └─── Farcaster DCs (if available)

                    ┌─── Sound.xyz (music NFTs)
                    ├─── Audius (free streaming)
ZAO OS ─── music ───┼─── Spotify (mainstream discovery)
                    ├─── SoundCloud (indie distribution)
                    └─── On-chain stems (remix rights)

                    ┌─── Base (Respect tokens, Hats)
ZAO OS ─── on-chain ┼─── Optimism (Farcaster identity)
                    ├─── Ethereum (ERC-8004 agent, EAS)
                    └─── Hive Engine (community token)
```

---

## Part 5: Research Sprint Schedule

| Sprint | Research Doc | Topic | Priority |
|--------|------------|-------|----------|
| **1** | 28 | Cross-Platform Publishing (Lens, Bluesky, Arena, Nostr, X, Mastodon) | **Critical** |
| **2** | 29 | Artist Revenue & IP Rights (streaming economics, NFTs, royalties, publishing) | **Critical** |
| **3** | 30 | Social Capital Economics (social tokens, curator incentives, revenue sharing) | **High** |
| **4** | 31 | Web2 Platform Bridges (Discord, Telegram, Twitch, newsletters, RSS) | **High** |
| **5** | 32 | Lens Protocol Deep Dive (V2 architecture, SDK, cross-posting) | **Medium** |
| **6** | 33 | The Arena Deep Dive (social tokens, Avalanche, API) | **Medium** |

### What Each Sprint Produces

- **Sprint 1** → ZAO can publish to any platform from one compose bar
- **Sprint 2** → ZAO has a clear model for returning revenue to artists
- **Sprint 3** → Respect tokens have real economic value, not just reputation
- **Sprint 4** → ZAO connects to where people already are
- **Sprint 5** → ZAO is multi-protocol native (Farcaster + Lens)
- **Sprint 6** → ZAO leverages social token trading for community growth

---

## Sources

All 26 research folders + 7 supplementary docs in `/research/` and `/docs/`
