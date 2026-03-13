# ZAO OS

> A music-first Farcaster client for the ZAO community

## Vision

ZAO OS is a decentralized social client built on [Farcaster](https://farcaster.xyz) where **music is the primary content**. It features a reputation-based social network powered by ZAO Respect tokens and a new identity layer (ZIDs) designed for musicians, curators, and listeners.

### Four Pillars

| Pillar | Description |
|--------|-------------|
| **Music Feed** | Front page of social posts centered on music — inline audio players, streaming, collecting |
| **Respect Tokens** | Non-transferable soulbound tokens for social capital — earned, never bought |
| **ZIDs** | ZAO Identity — wraps Farcaster FIDs with music profiles, reputation, and community roles |
| **Quilibrium** | Future decentralized infrastructure for privacy-preserving identity and reputation |

---

## Research

All research is organized in the `research/` folder. Each topic has its own directory with a README containing findings, code examples, and implementation notes.

```
research/
├── 01-farcaster-protocol/    # Protocol architecture, message types, auth, contracts
├── 02-farcaster-hub-api/     # Hub HTTP/gRPC APIs, SDKs, hosted providers (Neynar, Pinata)
├── 03-music-integration/     # Music APIs (Audius, Sound.xyz, Spotify), Frames v2, audio player
├── 04-respect-tokens/        # Soulbound reputation system, earning mechanics, EAS attestations
├── 05-zao-identity/          # ZID schema, database design, creation flow, Hats roles
├── 06-quilibrium/            # Decentralized compute/storage, QUIL token, integration roadmap
├── 07-hats-protocol/         # NFT-based role hierarchies for community governance
├── 08-ai-memory/             # AI memory patterns for personalization
├── 09-public-apis/           # Curated list of useful public APIs
├── 10-hypersnap/             # Farcaster tooling
├── 11-reference-repos/       # All tracked repos, npm packages, external APIs
├── 12-gating/                # Access control: NFT gates, allowlists, invite codes, Hats
├── 13-chat-messaging/        # Chat via Farcaster channels + XMTP private messaging
├── 14-project-structure/     # App structure, task management, dev workflow
├── 15-mvp-spec/              # Locked MVP spec: gated chat, user flow, file structure
├── 16-ui-reference/          # CG/Commonwealth Discord-style UI patterns
├── 17-neynar-onboarding/     # Neynar FID registration + managed signer flow
```

### Quick Links

| Topic | Key Question | Go To |
|-------|-------------|-------|
| How does Farcaster work? | Protocol architecture, FIDs, messages | [01-farcaster-protocol](research/01-farcaster-protocol/) |
| How do I read/write casts? | Hub API endpoints, SDK code examples | [02-farcaster-hub-api](research/02-farcaster-hub-api/) |
| How to build a music feed? | Audio APIs, Frames v2 players, track schema | [03-music-integration](research/03-music-integration/) |
| How do Respect tokens work? | Earning, decay, tiers, on-chain attestation | [04-respect-tokens](research/04-respect-tokens/) |
| What is a ZID? | Identity schema, DB design, onboarding flow | [05-zao-identity](research/05-zao-identity/) |
| What is Quilibrium? | Decentralized infra, integration roadmap | [06-quilibrium](research/06-quilibrium/) |
| How to manage community roles? | Hats Protocol NFT hierarchies | [07-hats-protocol](research/07-hats-protocol/) |
| How to add AI memory? | Persistent memory patterns for social apps | [08-ai-memory](research/08-ai-memory/) |
| How to gate access? | Allowlists, NFTs, Hats, invite codes | [12-gating](research/12-gating/) |
| How to build chat? | Channel chat, XMTP DMs, real-time | [13-chat-messaging](research/13-chat-messaging/) |
| How to structure the project? | App structure, folders, task management | [14-project-structure](research/14-project-structure/) |
| What exactly is the MVP? | Locked spec, user flow, file structure, API routes | [15-mvp-spec](research/15-mvp-spec/) |
| What APIs are available? | Music, social, blockchain, media APIs | [09-public-apis](research/09-public-apis/) |
| What is HyperSnap? | Farcaster tooling | [10-hypersnap](research/10-hypersnap/) |
| All repos & packages? | GitHub repos, npm packages, API endpoints | [11-reference-repos](research/11-reference-repos/) |

---

## Tech Stack

```
Frontend:       Next.js 14+ (App Router) + React
Styling:        Tailwind CSS
Audio:          Howler.js / Web Audio API
Auth:           @farcaster/auth-kit (Sign In With Farcaster)
Farcaster:      Neynar SDK + Hub HTTP API
Music Data:     Audius API + Sound.xyz GraphQL + Spotify Web API
Database:       PostgreSQL (Prisma ORM)
On-chain:       Viem + Wagmi (Base / OP Mainnet)
Identity:       ZIDs (custom) + Hats Protocol (roles)
Reputation:     EAS (Ethereum Attestation Service)
Deployment:     Vercel (frontend) + Railway/Fly.io (backend)
Real-time:      WebSockets + Neynar webhooks
```

---

## Reference Repos

| Repo | Purpose |
|------|---------|
| [farcasterxyz/protocol](https://github.com/farcasterxyz/protocol) | Farcaster protocol spec |
| [farcasterxyz/hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) | Hub node + SDKs |
| [QuilibriumNetwork](https://github.com/QuilibriumNetwork) | Decentralized infrastructure |
| [Hats-Protocol/hats-anchor-app](https://github.com/Hats-Protocol/hats-anchor-app) | Role hierarchy NFTs |
| [farcasterorg/hypersnap](https://github.com/farcasterorg/hypersnap) | Farcaster tooling |
| [GoogleCloudPlatform/.../always-on-memory-agent](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/gemini/agents/always-on-memory-agent) | AI memory patterns |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | Claude persistent memory |
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | Public API directory |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    ZAO OS Client                     │
│                  (Next.js + React)                    │
│                                                       │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐ │
│  │ Music   │  │  Social  │  │ Profile │  │ Respect│ │
│  │ Feed    │  │  Graph   │  │  (ZID)  │  │ System │ │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └───┬────┘ │
└───────┼────────────┼────────────┼─────────────┼──────┘
        │            │            │             │
   ┌────▼────┐  ┌────▼─────┐  ┌──▼──┐   ┌─────▼─────┐
   │ Music   │  │ Farcaster│  │ ZID │   │  Respect  │
   │ APIs    │  │ Hub/     │  │ DB  │   │  Ledger   │
   │         │  │ Neynar   │  │     │   │           │
   ├─────────┤  └──────────┘  └──┬──┘   └─────┬─────┘
   │ Audius  │                   │             │
   │ Sound   │              ┌────▼─────────────▼────┐
   │ Spotify │              │      PostgreSQL       │
   │ Zora    │              └────────────┬──────────┘
   └─────────┘                           │
                                    ┌────▼────┐
                                    │  EAS    │
                                    │ (Base)  │
                                    └────┬────┘
                                         │
                                  ┌──────▼───────┐
                                  │  Quilibrium  │
                                  │  (future)    │
                                  └──────────────┘
```

---

## Task-Based Roadmap

No timelines. Just tasks, ordered by dependency. Ship each layer before starting the next.

---

### MVP — Gated Chat Client

The simplest thing that delivers value: sign in, prove you belong, chat with the community. Mobile-first. Bidirectional with Farcaster.

- [ ] Initialize Next.js 14+ project (App Router, Tailwind, TypeScript)
- [ ] Set up Supabase (allowlist, sessions, hidden_messages tables)
- [ ] Seed allowlist from CSV (real_name, ign, fid, wallet)
- [ ] Implement Sign In With Farcaster (SIWF) using `@farcaster/auth-kit`
- [ ] Build allowlist gate (check FID + wallet)
- [ ] Implement Neynar FID registration (onboard wallet-only users)
- [ ] Set up Neynar managed signer flow (one-time approval)
- [ ] Build mobile-first chat UI (Discord-style, sidebar as drawer)
- [ ] Fetch `/zao` channel feed via Neynar API
- [ ] Post messages to `/zao` channel via Neynar managed signer
- [ ] Reply threads — thread view for cast replies
- [ ] Real-time polling (5-10 sec refresh)
- [ ] Admin panel — manage allowlist, CSV upload, hide messages
- [ ] Deploy to Vercel (auto-deploy from github.com/bettercallzaal/ZAOOS)
- [ ] Invite initial ZAO community members (~50-100)

### Layer 2 — Music in Chat

Add music sharing and playback to the chat experience.

- [ ] Detect music URLs in casts (Audius, Sound.xyz, Spotify patterns)
- [ ] Build `<TrackCard />` component — rich preview for music embeds
- [ ] Integrate Audius API — pull track metadata, streaming URL, artwork
- [ ] Build `<AudioPlayer />` — inline play/pause per track
- [ ] Build persistent player bar — continues playing while scrolling
- [ ] Sound.xyz integration — music NFT metadata, mint links
- [ ] Spotify preview integration — 30-sec previews for mainstream tracks

### Layer 3 — Identity (ZIDs)

Wrap Farcaster FIDs with ZAO-specific profiles.

- [ ] Design ZID database schema (music profile, genres, role)
- [ ] ZID creation flow during onboarding (after SIWF + gate pass)
- [ ] Profile page — display ZID, music stats, linked wallets
- [ ] Music profile setup — role (listener/artist/curator), genre preferences
- [ ] Pull Farcaster profile data (PFP, display name, bio) into ZID

### Layer 4 — Respect Tokens

Social capital system for the community.

- [ ] Respect ledger database schema (actions, balances, tiers)
- [ ] Basic earning — earn Respect for posting, sharing music
- [ ] Curation mining — earn Respect when tracks you share get engagement
- [ ] Peer recognition — "respect" button on posts (like tipping)
- [ ] Tier system — newcomer/member/curator/elder based on balance
- [ ] Decay mechanism — weekly decay of unused Respect
- [ ] Display Respect balance and tier on profiles

### Layer 5 — Community Roles (Hats)

On-chain role management for the ZAO community.

- [ ] Deploy ZAO hat tree on Base (Top Hat → Curators/Artists/Mods)
- [ ] Integrate `@hatsprotocol/sdk-v1-core` for role checks
- [ ] Add hat-based gating (wear Curator hat = curator permissions)
- [ ] Auto-eligibility — Respect threshold triggers hat eligibility
- [ ] Role badges on profiles (hat = visible role)
- [ ] Moderator tools — content flagging, hide posts

### Layer 6 — Music Feed

Graduate from chat to a full music social feed.

- [ ] Feed view — algorithmic feed of music posts
- [ ] Feed ranking — weight by Respect, engagement, freshness, social graph
- [ ] Channel browsing — genre-based music channels
- [ ] Frames v2 — inline music player frames for cross-client embeds
- [ ] Collections — curated playlists/collections by curators
- [ ] Artist pages — dedicated profiles for verified artists

### Layer 7 — AI & Personalization

Memory-augmented, personalized experience.

- [ ] Implicit taste extraction from listening/sharing behavior
- [ ] User taste profiles (genres, artists, mood patterns)
- [ ] Personalized feed ranking based on taste profile
- [ ] Social memory — "you and X both love Y" connections
- [ ] AI-powered music discovery recommendations

### Layer 8 — On-Chain & Decentralization

Move key data on-chain for verifiability and portability.

- [ ] EAS attestations for ZID profiles on Base
- [ ] EAS attestations for Respect score snapshots
- [ ] Soulbound ERC-5192 for Respect tier badges
- [ ] NFT gate option (mint ZAO membership NFT)
- [ ] Quilibrium node integration (experimental)
- [ ] Quilibrium ZID storage (when SDK matures)

### Layer 9 — Private Messaging

Add encrypted DMs via XMTP.

- [ ] XMTP client integration (`@xmtp/xmtp-js`)
- [ ] 1:1 DMs between ZAO members
- [ ] FID → ETH address resolution for XMTP
- [ ] Group chat via XMTP MLS
- [ ] Rich messages — reactions, replies, attachments
