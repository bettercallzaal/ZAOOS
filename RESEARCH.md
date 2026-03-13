# ZAO OS — Farcaster Client Research Brief

## Vision
A music-first Farcaster client exclusive to the ZAO community, featuring:
- **Music Social Feed** — front page of social posts centered on music
- **ZAO Respect Tokens** — non-transferable social capital for community reputation
- **ZIDs (ZAO IDs)** — decentralized identity layer for a new social network
- **Quilibrium Integration** — decentralized infrastructure for identity + reputation storage

---

## 1. Farcaster Protocol Overview

### Architecture (Hybrid Onchain/Offchain)
- **Onchain (OP Mainnet):** Identity contracts — IdRegistry (FIDs), KeyRegistry (Ed25519 signers), StorageRegistry (message quotas)
- **Offchain (Hubs):** P2P gossip network storing social data via CRDTs. Reference implementation: **Hubble**
- Every message is protobuf-encoded, signed with Ed25519, and includes: FID, timestamp (Farcaster epoch: seconds since 2021-01-01), message body, Blake3 hash

### Message Types
| Type | Purpose |
|------|---------|
| CastAdd/CastRemove | Posts (up to 1024 bytes, 2 embeds, mentions, parent for replies/channels) |
| ReactionAdd/Remove | Likes and recasts |
| LinkAdd/Remove | Follows |
| UserDataAdd | Profile (PFP, display name, bio, URL, username) |
| VerificationAddEthAddress | Link Ethereum addresses to FID |
| FrameAction | Interactions with Frames (mini-apps) |

### Storage Limits (per unit purchased)
- 5,000 casts, 2,500 reactions, 2,500 links, 50 user data, 50 verifications

### Channels
- Organized via `parentUrl` on casts (e.g., `https://farcaster.group/music`)
- Channel moderation is application-layer, not protocol-enforced

---

## 2. Hub APIs — How to Read/Write Farcaster Data

### Hub Ports
- gRPC: **2283** (full-featured, streaming)
- HTTP: **2281** (REST-like, simpler)
- Gossip: **2282**

### Key HTTP Endpoints
```
GET /v1/castsByFid?fid=<fid>&pageSize=N&reverse=true
GET /v1/castsByParent?url=<channel_url>          # channel feed
GET /v1/castsByMention?fid=<fid>
GET /v1/reactionsByCast?target_fid=<fid>&target_hash=<hash>&reaction_type=1
GET /v1/linksByFid?fid=<fid>&link_type=follow     # who you follow
GET /v1/linksByTargetFid?target_fid=<fid>          # followers
GET /v1/userDataByFid?fid=<fid>
GET /v1/storageLimitsByFid?fid=<fid>
POST /v1/submitMessage                             # submit signed protobuf
```

### Hosted Hub Providers
| Provider | Endpoint | Notes |
|----------|----------|-------|
| **Neynar** | `hub-api.neynar.com` / `api.neynar.com` | Best DX, REST API v2, managed signers, webhooks. Free tier available. |
| **Pinata** | `hub.pinata.cloud` | Free public hub access + Auth Kit |
| **Airstack** | `hubs.airstack.xyz` | GraphQL layer, combines Farcaster + onchain data |

### Neynar Higher-Level API (recommended for client dev)
```
GET /v2/farcaster/feed?feed_type=following&fid=<fid>
GET /v2/farcaster/feed/trending
GET /v2/farcaster/cast?identifier=<hash>&type=hash
GET /v2/farcaster/user/bulk?fids=3,2
POST /v2/farcaster/cast   # with managed signer
Header: api_key: <key>
```

---

## 3. Key SDKs & Libraries

| Package | Purpose |
|---------|---------|
| `@farcaster/hub-nodejs` | Node.js gRPC client for hubs |
| `@farcaster/hub-web` | Browser gRPC-Web client |
| `@farcaster/core` | Message builders, crypto, protobuf types |
| `@farcaster/auth-kit` | React "Sign In With Farcaster" components |
| `@farcaster/auth-client` | Headless SIWF auth |
| `@farcaster/frame-sdk` | Frames v2 SDK (for building mini-apps) |
| `@neynar/nodejs-sdk` | Neynar REST API wrapper |

### Authentication Flow
1. **Sign In With Farcaster (SIWF):** User signs with custody address → app gets FID
2. **Signer Registration:** App generates Ed25519 keypair → user approves via Warpcast deep link → key registered in KeyRegistry on-chain
3. **Message Signing:** App signs casts/reactions with registered Ed25519 key → submits to hub

### Submitting a Cast (Code Pattern)
```typescript
import { makeCastAdd, NobleEd25519Signer, FarcasterNetwork } from '@farcaster/hub-nodejs';

const signer = new NobleEd25519Signer(ed25519PrivateKey);
const cast = await makeCastAdd(
  { text: 'Hello ZAO!', embeds: [{ url: 'https://sound.xyz/...' }], mentions: [], mentionsPositions: [], embedsDeprecated: [] },
  { fid: 12345, network: FarcasterNetwork.MAINNET },
  signer
);
await client.submitMessage(cast.value);
```

---

## 4. Frames v2 — Inline Music Players

Frames v2 is the critical enabler for music in the feed:
- Full HTML/JS/CSS in a sandboxed webview
- Inline audio player with play/pause, waveforms, etc.
- Wallet interactions (mint, tip) directly in the frame
- Manifest at `/.well-known/farcaster.json`
- SDK: `sdk.actions.ready()`, `sdk.actions.openUrl()`, `sdk.wallet.ethProvider`
- Push notifications for followed frames

**This means ZAO OS can render a full audio player inline in every music post.**

---

## 5. Music Integration Sources

### On-Chain Music (Web3-native)
| Platform | API | Notes |
|----------|-----|-------|
| **Sound.xyz** | GraphQL `api.sound.xyz/graphql` | Music NFT drops on Base/OP. SDK available. |
| **Audius** | REST `discoveryprovider.audius.co/v1/` | Decentralized streaming. Free API, no auth needed. Full track streaming. |
| **Zora** | Zora API + `@zoralabs/protocol-sdk` | General NFTs, popular for music. On Base. |
| **Spinamp** | `api.spinamp.xyz` | Aggregator across Sound, Catalog, Zora. |

### Web2 Music
| Service | API | Notes |
|---------|-----|-------|
| **Spotify** | Web API | 30-sec previews, metadata. OAuth required. |
| **SoundCloud** | Widget API | Embed player. Limited API. |

### Recommended Strategy
Start with **Audius** (free, full streaming, decentralized) + **Sound.xyz** (music NFTs, web3 audience) + **Spotify previews** (mainstream reach).

---

## 6. ZAO Respect Tokens — Social Capital System

### Design Principles
- **Non-transferable (Soulbound)** — prevents buying reputation
- **Earned through contribution** — curation, engagement, early discovery
- **Decays slowly** — use-it-or-lose-it prevents stale reputation
- **Grants power** — increased tip allowance, curation weight, governance

### Earning Mechanisms
1. **Curation Mining:** Share a track early → others collect/play it → earn Respect
2. **Peer Recognition:** Other users "respect" your posts (like DEGEN tipping)
3. **Consistency:** Regular quality participation earns baseline Respect
4. **Artist Verification:** Verified artists earn Respect for releases

### Existing Models to Learn From
- **DEGEN on Farcaster:** Daily tip allowances based on holdings/engagement. Massive adoption.
- **Moxie (Airstack):** Fan tokens on Farcaster, engagement-based earning.
- **Optimism Fractal Respect:** Non-transferable, peer-evaluated, Fibonacci-weighted distribution.

### Technical Implementation
- Off-chain point tracking (PostgreSQL) with periodic on-chain attestation
- **EAS (Ethereum Attestation Service)** on Base/OP for lightweight on-chain reputation stamps
- **ERC-5192** for soulbound token standard
- Merkle root snapshots on-chain for verifiability without gas costs per action

---

## 7. ZIDs — ZAO Decentralized Identity

### Concept
ZIDs extend Farcaster FIDs with a ZAO-specific identity layer:
- **FID** = Farcaster identity (on OP Mainnet)
- **ZID** = ZAO identity (wraps FID + adds music profile, Respect score, community roles)

### ZID Contains
- Linked FID (Farcaster identity)
- Music profile (genres, artist/listener role, collection history)
- Respect token balance (cumulative social capital)
- Community roles (curator, artist, supporter, etc.)
- Linked wallets (for NFT ownership verification)

### Quilibrium Integration Potential
- Store ZID attestations on Quilibrium for privacy-preserving, censorship-resistant identity
- Quilibrium's oblivious hypergraph = node operators can't see stored data
- gRPC API on Quilibrium nodes for read/write
- Would need a Go middleware service (Quilibrium SDK is Go-based)

### Near-Term Approach
- Store ZIDs in a PostgreSQL database + on-chain attestations via EAS
- Bridge to Quilibrium as the network matures (SDK still early)

---

## 8. Quilibrium Network

### What It Is
- Decentralized compute + storage + networking protocol
- Proof of Meaningful Work (PoMW) consensus
- Written in Go (`ceremonyclient` repo)
- QUIL token — fair-launch, no pre-mine, earned by node operators
- Privacy by default — oblivious transfer + MPC cryptography

### Relevance to ZAO OS
| Layer | Current Approach | Quilibrium Future |
|-------|-----------------|-------------------|
| Identity | FIDs on OP + ZIDs in PostgreSQL | ZID attestations on Quilibrium |
| Reputation | Off-chain tracking + EAS | Respect token state on Quilibrium |
| Content | Farcaster Hubs | Quilibrium as censorship-resistant backup |
| Media | CDN links | Decentralized storage on Quilibrium |

### Maturity Assessment
- **Early stage** — developer tooling still maturing
- **No JS/TS SDK** — only Go libraries, would need a bridge service
- **Recommendation:** Design with Quilibrium in mind, but don't block on it. Build with PostgreSQL + EAS now, migrate later.

---

## 9. Competitive Landscape

No dominant music-first Farcaster client exists. The space has:
- `/music` channel on Warpcast (discussion, not a dedicated experience)
- Scattered Frame experiments for music
- Spinamp as a music NFT aggregator (not Farcaster-native)

**ZAO OS fills a clear gap: dedicated music social client with reputation and identity.**

---

## 10. Recommended Tech Stack

```
Frontend:       Next.js 14+ (App Router) + React
Styling:        Tailwind CSS
Audio:          Howler.js or Web Audio API
Auth:           @farcaster/auth-kit (SIWF)
Farcaster API:  Neynar SDK (@neynar/nodejs-sdk) + direct hub HTTP for real-time
Music Data:     Audius API + Sound.xyz GraphQL + Spotify Web API
Database:       PostgreSQL (via Prisma)
On-chain:       Viem + Wagmi (Base/OP Mainnet)
Reputation:     EAS (Ethereum Attestation Service)
Deployment:     Vercel (frontend) + Railway/Fly.io (backend)
Real-time:      WebSockets + Neynar webhooks
```

---

## Next Steps
1. Initialize the Next.js project with the above stack
2. Implement SIWF authentication
3. Build the music feed (Neynar API + music enrichment)
4. Build inline audio player component
5. Design and implement ZID schema
6. Design and implement Respect token system
7. Deploy MVP
