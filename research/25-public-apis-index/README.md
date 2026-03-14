# 25 — Public APIs Index for ZAO OS

> **Status:** Research complete
> **Source:** github.com/public-apis/public-apis (curated list of 1,400+ free APIs)
> **Goal:** Index every API relevant to ZAO OS by use case and priority
> **Date:** March 2026

---

## Tier 1 — Must-Integrate (Core Features)

### Music & Audio

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Spotify** | Catalog, recommendations, playlists, audio features | OAuth | ? | **HIGH** | Discovery, embeds, AI recs |
| **SoundCloud** | Indie streaming, user content | OAuth | ? | **HIGH** | Indie artist discovery |
| **Last.fm** | Scrobbling, similar artists, tags, history | apiKey | ? | **HIGH** | Taste profiling, AI agent |
| **Genius** | Lyrics, annotations, artist bios | OAuth | ? | **HIGH** | Song context, lyrics |
| **MusicBrainz** | Open music DB (artists, releases, recordings) | None | ? | **HIGH** | Free metadata, no auth |
| **TheAudioDB** | Artist images, album art, metadata | apiKey | ? | **HIGH** | Artwork for profiles/feeds |
| **TasteDive** | Similar artist/content recommendations | apiKey | ? | **HIGH** | "You might like" recs |
| **Songlink / Odesli** | Universal cross-platform song links | apiKey | Yes | **HIGH** | Share links that work everywhere |

### Blockchain & Web3

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Etherscan** | Ethereum explorer, tokens, transactions | apiKey | Yes | **HIGH** | Respect tokens, NFT gating |
| **CoinGecko** | Crypto prices, market data | None | Yes | **HIGH** | Token pricing (free!) |
| **The Graph** | GraphQL blockchain indexing | apiKey | ? | **HIGH** | On-chain data queries |
| **Alchemy** | Ethereum Node-as-a-Service | apiKey | Yes | **HIGH** | Contract interactions |
| **INFURA** | Ethereum RPC provider | apiKey | Yes | **HIGH** | Alternative ETH provider |

### Platform Essentials

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Perspective API** | Toxicity/obscenity detection | apiKey | ? | **HIGH** | Content moderation |
| **PurgoMalum** | Profanity filter | None | ? | **HIGH** | Chat text filter (free!) |
| **OneSignal** | Push notifications | apiKey | ? | **HIGH** | Mobile push |
| **Giphy** | GIF search & embed | apiKey | ? | **HIGH** | GIF reactions in chat |
| **LinkPreview** | URL preview extraction | apiKey | Yes | **HIGH** | Rich link previews |
| **Microlink.io** | Structured data from URLs | None | Yes | **HIGH** | Link unfurling (free!) |
| **Google Analytics** | Web analytics | OAuth | ? | **HIGH** | Engagement tracking |
| **Discord** | Bot, OAuth, community bridge | OAuth | ? | **HIGH** | Community bridge |

---

## Tier 2 — Enhanced Experience

### Music Discovery & Events

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Audiomack** | Indie/hip-hop streaming | OAuth | ? | **MED** | Indie content |
| **Deezer** | Streaming, search, charts | OAuth | ? | **MED** | Charts, search |
| **Discogs** | Music DB, vinyl marketplace | OAuth | ? | **MED** | Collection tracking |
| **Musixmatch** | Lyrics database | apiKey | ? | **MED** | Lyrics display |
| **Freesound** | CC audio samples | apiKey | ? | **MED** | Sample sharing |
| **Bandsintown** | Concert/event discovery | None | ? | **MED** | Events (free!) |
| **Songkick** | Music events | apiKey | ? | **MED** | Concert discovery |
| **Radio Browser** | Internet radio directory | None | Yes | **MED** | Community radio |
| **iTunes Search** | Apple Music catalog search | None | ? | **MED** | Catalog data (free!) |

### AI & Moderation

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **NLP Cloud** | Sentiment, NER, classification | apiKey | ? | **MED** | AI agent NLP |
| **Dialogflow** | Conversational AI | apiKey | ? | **MED** | Agent chatbot |
| **Clarifai** | Image recognition, NSFW | OAuth | ? | **MED** | Image moderation |
| **Cloudmersive** | Image captioning, NSFW | apiKey | Yes | **MED** | Content moderation |
| **Irisnet** | Real-time image moderation | apiKey | Yes | **MED** | NSFW filter |
| **Tisane** | Abusive content detection | OAuth | Yes | **MED** | Text moderation |

### Media & Images

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Imgur** | Image hosting | OAuth | ? | **MED** | User image uploads |
| **Unsplash** | Free stock photos | OAuth | ? | **MED** | Default backgrounds |
| **Pexels** | Free stock photos/videos | apiKey | Yes | **MED** | Stock imagery |
| **Imgbb** | Simple image sharing | apiKey | ? | **MED** | Quick image upload |
| **Remove.bg** | Background removal | apiKey | ? | **MED** | Profile photo processing |
| **Dicebear Avatars** | Random pixel-art avatars | None | No | **MED** | Default profile pics |
| **RoboHash** | Generated avatars from hash | None | ? | **MED** | Unique auto-avatars |

### Web3 & Storage

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Covalent** | Multi-chain data aggregator | apiKey | ? | **MED** | Cross-chain wallet data |
| **Pinata** | IPFS pinning | apiKey | ? | **MED** | Decentralized storage |
| **Web3 Storage** | IPFS with 1TB free | apiKey | Yes | **MED** | Content storage |
| **Bitquery** | On-chain GraphQL, DEX data | apiKey | Yes | **MED** | Token analytics |
| **Ethplorer** | Token balances, history | apiKey | ? | **MED** | Wallet portfolio |

### Social & Communication

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Telegram Bot** | Messaging bot API | apiKey | ? | **MED** | Notifications bot |
| **Mastodon** | Federated social (ActivityPub) | OAuth | Yes | **MED** | Fediverse cross-post |
| **Reddit** | Social content | OAuth | ? | **MED** | Music subreddit aggregation |
| **Ayrshare** | Multi-platform posting | apiKey | Yes | **MED** | Cross-posting |
| **Slack** | Team messaging | OAuth | ? | **MED** | Internal comms |

### Weather & Mood

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Open-Meteo** | Global weather (no key!) | None | Yes | **MED** | Mood-based music recs |
| **OpenWeatherMap** | Weather data | apiKey | ? | **MED** | Weather-mood playlists |

### Notifications & Email

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Sendgrid** | Transactional email | apiKey | ? | **MED** | Email notifications |
| **Mailchimp** | Marketing email | apiKey | ? | **MED** | Community newsletters |

### Events & Location

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **Ticketmaster** | Event search | apiKey | ? | **MED** | Music events |
| **Eventbrite** | Event listing | OAuth | ? | **MED** | Community events |
| **ipapi.co** | IP geolocation (free!) | None | Yes | **MED** | Auto-detect region |
| **Nominatim** | OpenStreetMap geocoding | None | Yes | **MED** | Location features |

### Dev Tools

| API | What It Does | Auth | CORS | Priority | ZAO Feature |
|-----|-------------|------|------|----------|-------------|
| **GitHub** | Repos, users | OAuth | Yes | **MED** | Open source community |
| **RSS to JSON** | Convert RSS feeds | None | Yes | **MED** | Music blog aggregation |
| **YouTube** | Video platform | OAuth | ? | **MED** | Music video embeds |

---

## Tier 3 — Nice-to-Have

### Music (Low Priority)

| API | Auth | Notes |
|-----|------|-------|
| **Lyrics.ovh** | None | Simple lyrics |
| **Napster** | apiKey | Additional streaming |
| **Mixcloud** | OAuth | DJ mixes |
| **7digital** | OAuth | Music store |
| **AI Mastering** | apiKey | Music production |
| **Jamendo** | OAuth | CC music |
| **KKBOX** | OAuth | Asian market |
| **Openwhyd** | None | Playlist aggregation |
| **Songsterr** | None | Guitar tabs |
| **Genrenator** | None | Genre generator (fun) |
| **Phishin** | apiKey | Live recordings |

### Blockchain (Low Priority)

| API | Auth | Notes |
|-----|------|-------|
| **Solana JSON RPC** | None | If expanding to Solana |
| **Chainlink** | None | Price oracles |
| **0x** | None | DEX data |
| **CoinMarketCap** | apiKey | Market data |
| **Steem** | None | Hive fork |

### Identity & Auth (Low Priority)

| API | Auth | Notes |
|-----|------|-------|
| **Auth0** | apiKey | Managed auth |
| **Stytch** | apiKey | Passwordless |
| **Warrant** | apiKey | Authorization API |
| **FingerprintJS** | apiKey | Sybil resistance |

### Entertainment (Low Priority)

| API | Auth | Notes |
|-----|------|-------|
| **TMDb** | apiKey | Soundtrack discovery |
| **Wikipedia** | None | Artist bios |
| **Colormind** | None | Dynamic UI themes |
| **Vimeo** | OAuth | Video hosting |

### Text & Translation (Low Priority)

| API | Auth | Notes |
|-----|------|-------|
| **Datamuse** | None | Word suggestions |
| **LibreTranslate** | None | Open source translation |
| **Detect Language** | apiKey | Multi-language support |

### Analytics (Low Priority)

| API | Auth | Notes |
|-----|------|-------|
| **Countly** | None | Self-hosted analytics |
| **Metabase** | None | BI dashboards |

### Fun / Creative (Low Priority)

| API | Auth | Notes |
|-----|------|-------|
| **kanye.rest** | None | Random quotes |
| **Creative Commons Catalog** | OAuth | CC content |
| **Shields.io** | None | Achievement badges |
| **Pixela** | X-Key | Streak tracking |
| **QR code** | None | Profile/event QR codes |

---

## Quick Wins (Free, No Auth Required)

These APIs need no API key and can be integrated immediately:

| API | What It Does | CORS |
|-----|-------------|------|
| **MusicBrainz** | Open music metadata | ? |
| **CoinGecko** | Crypto prices | Yes |
| **PurgoMalum** | Profanity filter | ? |
| **Microlink.io** | URL unfurling | Yes |
| **Open-Meteo** | Weather data | Yes |
| **Bandsintown** | Concert events | ? |
| **iTunes Search** | Music catalog | ? |
| **ipapi.co** | IP geolocation | Yes |
| **Nominatim** | Geocoding | Yes |
| **Radio Browser** | Internet radio | Yes |
| **RSS to JSON** | Feed conversion | Yes |
| **Dicebear** | Generated avatars | No |
| **RoboHash** | Generated avatars | ? |
| **Wikipedia** | Artist bios | ? |
| **QR code** | QR generation | Yes |
| **Shields.io** | Badges | ? |
| **Datamuse** | Word suggestions | ? |
| **Sunrise/Sunset** | Sun times | No |

---

## Integration Priority by ZAO OS Phase

### MVP (Now)
- PurgoMalum (free text filter)
- Microlink.io (free link previews)
- Giphy (GIF reactions)

### Music Phase
- Spotify, SoundCloud, Last.fm (core music)
- MusicBrainz (free metadata)
- Songlink/Odesli (universal links)
- TasteDive (recommendations)

### Identity & Tokens Phase
- Etherscan, Alchemy (token verification)
- CoinGecko (token pricing)
- The Graph (on-chain indexing)

### AI Agent Phase
- Perspective API (toxicity)
- NLP Cloud (sentiment analysis)
- Open-Meteo (mood-based recs)

### Growth Phase
- OneSignal (push notifications)
- Sendgrid (email)
- Discord (community bridge)
- Bandsintown (events)

---

## Source

- [github.com/public-apis/public-apis](https://github.com/public-apis/public-apis)
