# Public APIs for ZAO OS

> Source: [github.com/public-apis/public-apis](https://github.com/public-apis/public-apis) + Web3-specific additions

## Priority Tiers

### Tier 1 — Must-Have (Core Functionality)

| API | Auth | Category | Use in ZAO OS |
|-----|------|----------|---------------|
| **Neynar** | apiKey | Social | Farcaster backbone — casts, feeds, channels, managed signers |
| **SIWF (Auth Kit)** | — | Auth | Sign In With Farcaster — primary authentication |
| **Audius** | None | Music | Free decentralized streaming, search, full tracks |
| **Sound.xyz** | GraphQL | Music | Music NFT drops, artist releases, collectors |
| **Pinata** | apiKey | Storage | IPFS pinning + free Farcaster hub access |
| **Alchemy** | apiKey | Blockchain | Ethereum/L2 node, NFT metadata, wallet balances |

### Tier 2 — High Value

| API | Auth | Category | Use in ZAO OS |
|-----|------|----------|---------------|
| **Spotify Web API** | OAuth | Music | 30-sec previews, metadata, recommendations, audio features |
| **XMTP** | — | Messaging | Web3 encrypted DMs between Farcaster users |
| **Zora** | — | Blockchain | On-chain music NFT minting/collecting |
| **Last.fm** | apiKey | Music | Scrobbling, listening history, social listening, similar artists |
| **Genius** | OAuth | Music | Lyrics, song annotations, artist bios |
| **OneSignal / FCM** | apiKey | Notifications | Push notifications for social activity |
| **Pusher / Ably** | apiKey | Real-time | WebSocket infra for live feed updates |
| **Anthropic Claude** | apiKey | AI | Content analysis, music discovery AI, moderation |

### Tier 3 — Nice to Have

| API | Auth | Category | Use in ZAO OS |
|-----|------|----------|---------------|
| **Reservoir** | apiKey | Blockchain | Aggregated NFT data, real-time sales, collection stats |
| **The Graph** | apiKey | Blockchain | Custom subgraphs for music smart contracts |
| **Dune Analytics** | apiKey | Analytics | On-chain music economy dashboards |
| **ListenBrainz** | apiKey | Music | Open-source scrobbling, social listening stats |
| **Songkick** | apiKey | Music | Concert/event discovery |
| **Cloudinary** | apiKey | Media | Dynamic image processing, album art optimization |
| **PostHog** | apiKey | Analytics | Open-source product analytics, feature flags |
| **Privy** | apiKey | Auth | Web3-native auth with embedded wallets |

---

## Music APIs — Detailed

### Streaming & Metadata

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **Audius** | None | Yes | `discoveryprovider.audius.co/v1/` | Full streaming, no auth. Best free option. |
| **Spotify** | OAuth | Yes | `developer.spotify.com` | 30-sec previews, audio features (tempo, energy, danceability) |
| **Deezer** | OAuth | Yes | `developers.deezer.com/api` | 30-sec previews, editorial playlists |
| **SoundCloud** | OAuth | Yes | `developers.soundcloud.com` | Indie tracks, waveforms. Limited API. |
| **Audiomack** | OAuth | Yes | `audiomack.com/data-api/docs` | Underground/indie music, trending |
| **Jamendo** | OAuth | Yes | `developer.jamendo.com` | Creative Commons, royalty-free |
| **Napster** | apiKey | Yes | `developer.prod.napster.com` | Metadata, streaming |

### Metadata & Discovery

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **MusicBrainz** | None | Yes | `musicbrainz.org/doc/MusicBrainz_API` | Canonical metadata DB (artist, release, recording IDs) |
| **Last.fm** | apiKey | Yes | `last.fm/api` | Scrobbling, recommendations, similar artists |
| **iTunes Search** | None | Yes | Apple docs | Search Apple catalog, album art, preview URLs |
| **TheAudioDB** | apiKey | Yes | `theaudiodb.com/api_guide.php` | Album art, artist images, discographies |

### Lyrics

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **Genius** | OAuth | Yes | `docs.genius.com` | Lyrics + annotations. Rich social features. |
| **Musixmatch** | apiKey | Yes | `developer.musixmatch.com` | Largest lyrics catalog, synced lyrics |

### Events

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **Songkick** | apiKey | Yes | `songkick.com/developer` | Concerts, artist tours |
| **Ticketmaster** | apiKey | Yes | `developer.ticketmaster.com` | Live events, venues |

---

## Blockchain / Web3 APIs

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **Alchemy** | apiKey | Yes | `docs.alchemy.com` | Node infra, NFT API, wallet balances |
| **Infura** | apiKey | Yes | `infura.io/docs` | Ethereum/IPFS nodes |
| **Zora** | — | Yes | `docs.zora.co` | Music NFT protocol on Base |
| **Reservoir** | apiKey | Yes | `docs.reservoir.tools` | NFT aggregation, real-time sales |
| **OpenSea** | apiKey | Yes | `docs.opensea.io` | NFT marketplace data |
| **Moralis** | apiKey | Yes | `docs.moralis.io` | Multi-chain NFT/wallet APIs |
| **The Graph** | apiKey | Yes | `thegraph.com/docs` | Custom subgraph queries |
| **CoinGecko** | None | Yes | `coingecko.com/en/api` | Token prices (for tip values) |
| **Etherscan** | apiKey | Yes | `docs.etherscan.io` | On-chain activity lookup |
| **Pinata** | apiKey | Yes | `docs.pinata.cloud` | IPFS pinning + Farcaster hub |
| **Web3.Storage** | apiKey | Yes | `web3.storage/docs` | Decentralized file storage |

---

## Social & Community

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **Neynar** | apiKey | Yes | `docs.neynar.com` | Primary Farcaster API |
| **Airstack** | apiKey | Yes | `docs.airstack.xyz` | Farcaster + onchain GraphQL |
| **XMTP** | — | Yes | `xmtp.org/docs` | Web3 encrypted messaging |
| **Daily.co** | apiKey | Yes | `docs.daily.co` | Audio/video rooms (listening parties) |
| **Discord** | OAuth | Yes | Discord dev portal | Community integration |

---

## Auth

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **SIWF** | — | Yes | `docs.farcaster.xyz/auth-kit` | Native Farcaster auth |
| **Privy** | apiKey | Yes | `docs.privy.io` | Web3 auth + embedded wallets |
| **Dynamic** | apiKey | Yes | `docs.dynamic.xyz` | Multi-wallet auth |

---

## Media & Image

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **Cloudinary** | apiKey | Yes | `cloudinary.com/documentation` | Image transforms, CDN, album art resize |
| **imgix** | — | Yes | `docs.imgix.com` | URL-based image processing |
| **remove.bg** | apiKey | Yes | `remove.bg/api` | Background removal for avatars |

---

## Notifications & Real-time

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **OneSignal** | apiKey | Yes | `documentation.onesignal.com` | Cross-platform push |
| **Firebase CM** | apiKey | Yes | Firebase docs | Push notifications |
| **Pusher** | apiKey | Yes | `pusher.com/docs` | WebSocket infra |
| **Ably** | apiKey | Yes | `ably.com/docs` | Real-time pub/sub |
| **SendGrid** | apiKey | Yes | `docs.sendgrid.com` | Email (weekly digests) |

---

## AI / ML

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **Anthropic** | apiKey | Yes | `docs.anthropic.com` | Claude — content analysis, moderation, discovery AI |
| **OpenAI** | apiKey | Yes | `platform.openai.com/docs` | GPT + embeddings |
| **Hugging Face** | apiKey | Yes | `huggingface.co/docs` | Open-source ML (sentiment, genre detection) |
| **AssemblyAI** | apiKey | Yes | `assemblyai.com/docs` | Audio transcription |
| **Stability AI** | apiKey | Yes | `platform.stability.ai/docs` | AI image generation (playlist covers) |

---

## Analytics

| API | Auth | HTTPS | URL | Notes |
|-----|------|-------|-----|-------|
| **PostHog** | apiKey | Yes | `posthog.com/docs/api` | Open-source product analytics |
| **Dune** | apiKey | Yes | `dune.com/docs/api` | On-chain analytics |
| **Plausible** | apiKey | Yes | `plausible.io/docs` | Privacy-friendly web analytics |
