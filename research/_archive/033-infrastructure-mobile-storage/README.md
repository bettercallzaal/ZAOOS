# 33 — Infrastructure: Media Storage, Mobile, Real-Time, Audio & Privacy

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Technical infrastructure decisions for a blockchain social media music platform

---

## Key Decisions for ZAO OS

### Immediate (MVP)
1. **Storage:** Supabase Storage for uploads. Plan migration to Cloudflare R2 + Pinata IPFS.
2. **Real-time:** Supabase Realtime (already in stack) — sufficient through 1,000+ users.
3. **Mobile:** PWA for chat/social. Accept iOS background audio limitation for now.
4. **Audio:** Native `<audio>` element with React wrapper. Audius API for streaming URLs.
5. **Monitoring:** Sentry (free 5K errors/mo) + Vercel Analytics (free).

### Music Player Phase
6. **Storage:** Cloudflare R2 for serving + Pinata IPFS for permanence. Arweave for NFT audio.
7. **Mobile:** Farcaster Mini App for music player (sidesteps iOS background audio).
8. **Audio:** Howler.js for crossfade + queue. wavesurfer.js for waveforms.
9. **Performance:** Upstash Redis for rate limiting. Self-host Farcaster hub to reduce Neynar costs.

### Scale Phase
10. **Mobile:** Capacitor wrapper for App Store presence with background audio.
11. **Audio:** LiveKit for live audio rooms.
12. **Privacy:** Semaphore for anonymous curation voting. Lit Protocol for token-gated encryption.

---

## 1. Decentralized Media Storage

### Cost Comparison

| Solution | 10 GB/mo | 100 GB/mo | Model | Speed |
|----------|----------|-----------|-------|-------|
| **Cloudflare R2** | Free (10GB) | $1.50/mo | Pay-as-you-go | Fast (zero egress!) |
| **Supabase Storage** | Free (1GB) | $25/mo | Subscription | Fast |
| **Pinata (IPFS)** | $20/mo | $200/mo | Subscription | Fast (dedicated gateway) |
| **web3.storage** | $1.50/mo | $15/mo | Pay-as-you-go | Medium |
| **Arweave (via Irys)** | $50-80 one-time | $500-800 one-time | Permanent | Fast |
| **AWS S3** | $0.23/mo | $2.30/mo | Pay-as-you-go | Fast |
| **Filecoin** | ~$0.001/mo | ~$0.01/mo | Deal-based | Slow (cold) |

**Winner:** Cloudflare R2 for serving (zero egress fees) + Pinata IPFS for decentralized permanence. Arweave for NFT audio/art.

### What Goes Where

| Data | Storage | Why |
|------|---------|-----|
| Profile pics / avatars | R2 (CDN) + IPFS backup | Fast serving, CID on-chain |
| Album art | Arweave (permanent) | Art deserves permanent storage |
| Audio files | R2 for streaming, IPFS for backup | Too large for on-chain |
| Post text | Farcaster Snapchain | Already handled by protocol |
| NFT metadata | Arweave or IPFS | Must be immutable |
| User settings | Supabase | Mutable, private |
| Encrypted DMs | XMTP network | E2E encrypted |

### Music File Sizes
- MP3 128kbps: ~3 MB per 3-min song
- MP3 320kbps: ~7 MB
- FLAC lossless: ~30 MB
- 1,000 tracks at 320kbps: ~7 GB

**Don't host music files directly.** Link to Audius, Sound.xyz, Spotify. Only host for NFT/collectible purposes on Arweave.

### How Music Platforms Store Files
- **Sound.xyz:** Arweave (permanent) + CDN (Cloudflare) for streaming
- **Audius:** Decentralized content nodes, 320kbps MP3
- **Catalog:** Arweave, lossless originals
- **Spotify:** Proprietary CDN, Ogg Vorbis 96-320kbps

---

## 2. Mobile Strategy

### The iOS Background Audio Problem

**PWA audio stops when app is backgrounded or screen locks on iOS.** This is the single biggest limitation for a music-first app. Media Session API partially works but is unreliable.

### Strategy by Phase

| Phase | Approach | Background Audio | App Store |
|-------|----------|-----------------|-----------|
| **1 (Now)** | PWA with `next-pwa` | No (iOS) / Yes (Android) | No |
| **2 (Music)** | Farcaster Mini App | Yes (inside Warpcast) | Via Warpcast |
| **3 (Growth)** | Capacitor wrapper | Yes (native plugin) | Yes |
| **4 (Scale)** | React Native + `react-native-track-player` | Full native | Yes |

### PWA Capabilities (2026)
- Push notifications: All platforms including iOS 16.4+
- Install prompts: Android/Chrome. iOS = manual "Add to Home Screen"
- Offline: Service workers + Workbox
- Media Session API: Lock screen controls (works on Android, unreliable iOS)
- Web Share API: Native share sheet

### Capacitor (Recommended Phase 3)
- Wraps existing Next.js app in native WebView
- Plugins for background audio, push notifications, camera
- Same codebase as web — no rewrite
- Can submit to App Store / Play Store
- **Compromise:** App Store presence + background audio without full rewrite

### App Store Policies
- **Apple:** NFT viewing/purchasing via crypto wallets allowed. 30% IAP commission on digital goods. Token-gated content OK if token purchased outside app.
- **Google:** More permissive. Blockchain digital goods can be sold outside Play billing.

---

## 3. Real-Time Infrastructure

### Supabase Realtime (Already in Stack)

| Feature | How It Works | Use Case |
|---------|-------------|----------|
| **Postgres Changes** | Subscribe to INSERT/UPDATE/DELETE | Chat messages, new casts |
| **Broadcast** | Pub/sub (no DB) | "User is typing", now playing |
| **Presence** | Track online users | Who's listening, online status |

**Limits:**
- Free: 200 concurrent connections, 2M messages/mo
- Pro ($25/mo): 500 connections, 5M messages/mo
- Sufficient through 1,000+ users

### Real-Time Architecture

```
Farcaster → Neynar webhook → API route → Supabase INSERT → Realtime → UI update
```

### Optimistic UI for Chat
1. User sends → immediately show with `status: 'sending'` (grey)
2. POST to API → cast via Neynar
3. Success → `status: 'sent'`
4. Failure → `status: 'failed'` + retry button
5. Webhook delivers same cast → deduplicate

### Presence
- Show who's online in community
- "Now playing" status for social music discovery
- Auto-clears on disconnect

---

## 4. Audio/Music Infrastructure

### Audio Library Recommendation

| Phase | Library | Why |
|-------|---------|-----|
| **MVP** | Native `<audio>` element | Zero dependencies, simple |
| **Music Phase** | Howler.js (~10KB) | Crossfade, queue, Web Audio API fallback |
| **Advanced** | wavesurfer.js (~60KB) | Waveform visualization |

### Waveform Visualization
- **wavesurfer.js v7+** — plugin-based, only load what you need
- **Performance tip:** Pre-compute waveform peaks server-side (using `audiowaveform` CLI). Store as JSON. Client renders from peaks instantly instead of decoding full audio.

### Audio Quality

| Format | Bitrate | Quality | Size (3 min) |
|--------|---------|---------|-------------|
| AAC 128kbps | 128 | Good (default) | ~3 MB |
| AAC 256kbps | 256 | High quality | ~6 MB |
| Opus 128kbps | 128 | Excellent | ~3 MB |
| FLAC | ~1000 | Lossless (NFTs) | ~30 MB |

Serve AAC 128kbps default, 256kbps "high quality" option. FLAC on Arweave for NFTs.

### Queue Management
- Ordered array of track IDs + current index pointer
- Shuffle: Fisher-Yates on indices, store both orders
- Repeat modes: none, one, all
- "Play next" inserts at currentIndex + 1
- Persist to localStorage for session continuity

### Live Audio Rooms (Future)
- **LiveKit:** Open-source WebRTC, self-hostable or cloud ($0.004/participant/min), React SDK
- 100+ participant rooms, pre-built components

---

## 5. Performance & Scalability

### Cost at Scale

| Scale | Monthly Cost | Key Costs |
|-------|-------------|-----------|
| **100 users** | $0-25 | Everything on free tiers |
| **1,000 users** | $100-300 | Vercel Pro ($20), Supabase Pro ($25), Neynar Growth (~$100) |
| **10,000 users** | $500-2,000 | Supabase Team ($599), Neynar Enterprise, self-hosted hub |

**Biggest cost driver at scale:** Neynar API credits. Mitigate by self-hosting Farcaster hub for reads.

### Caching Strategy

| Layer | Tool | TTL |
|-------|------|-----|
| **Client** | React Query | 30-60s feed, 5min profiles |
| **Edge** | Vercel Cache / Cache-Control | 1hr+ static |
| **Server** | Next.js fetch cache | 60-300s API responses |
| **DB** | Materialized views | 5-15min aggregates |
| **Redis** | Upstash (serverless) | Rate limits, sessions |

### Database Optimization
- Composite indexes: `(channel_id, created_at DESC)` on messages
- Cursor-based pagination (not OFFSET)
- Select specific columns, not `*`
- Connection pooling via PgBouncer (Supabase default)

### Monitoring Stack
- **Vercel Analytics:** Free, Web Vitals (already available)
- **Sentry:** Free 5K errors/mo, error tracking + replay
- **PostHog:** Free 1M events/mo, product analytics

---

## 6. Privacy & Data Sovereignty

### Public vs Private

| Data | Visibility | Why |
|------|-----------|-----|
| Casts/posts | Public | On Farcaster protocol |
| Respect balances | Public | Transparent reputation |
| Roles (Hats) | Public | On-chain, verifiable |
| DMs | Private (XMTP encrypted) | Personal communication |
| Email, wallet-to-identity mapping | Private (Supabase RLS) | PII |
| Listening history | Opt-in | Social discovery vs privacy |

### Zero-Knowledge Proofs

**Semaphore Protocol:**
- Anonymous group membership proofs ("I am a ZAO member" without revealing which one)
- JS SDK: `@semaphore-protocol/core`
- Use cases: anonymous curation voting, anonymous feedback, anonymous tipping

**Zupass:**
- ZK proof of event attendance / group membership
- Portable across platforms
- ZAO could issue Zupass tickets verifying membership

### GDPR Compliance
- Never store PII on-chain
- Farcaster's hybrid architecture is compliant (identity on-chain, content on hubs)
- ZAO OS data in Supabase = fully deletable
- Right to erasure: delete Supabase records, user controls their own Farcaster casts
- Privacy policy required: explain what's collected, where stored, user rights

### Data Portability
- Farcaster is inherently portable (FID, casts, social graph on protocol)
- Provide JSON/CSV export of ZAO-specific data (Respect history, favorites, settings)
- Switching from ZAO OS to any Farcaster client loses no protocol data

---

## Sources

- [Pinata](https://pinata.cloud/) — [Docs](https://docs.pinata.cloud/)
- [Cloudflare R2](https://www.cloudflare.com/products/r2/)
- [Arweave](https://arweave.org/) — [Irys](https://irys.xyz/)
- [web3.storage](https://web3.storage/)
- [Livepeer](https://livepeer.org/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [LiveKit](https://livekit.io/)
- [wavesurfer.js](https://wavesurfer.xyz/)
- [Howler.js](https://howlerjs.com/)
- [Capacitor](https://capacitorjs.com/)
- [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player)
- [Semaphore Protocol](https://semaphore.pse.dev/)
- [Zupass](https://zupass.org/)
- [Lit Protocol](https://litprotocol.com/)
- [Upstash Redis](https://upstash.com/)
- [Sentry](https://sentry.io/)
- [PostHog](https://posthog.com/)
