# 96 — Cross-Post API Deep Dive: Platform-by-Platform Integration Guide

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Detailed API research for each cross-posting target — SDKs, costs, rate limits, music relevance, code examples
> **Builds on:** Doc 28 (Cross-Platform Publishing), Doc 36 (Lens Deep Dive), Doc 77 (Bluesky Integration)

---

## 1. Nostr — nostr-tools / NDK

### Current State (March 2026)

| Detail | Value |
|--------|-------|
| **Package (low-level)** | `nostr-tools` v2.23.3 (npm, published Feb 2026) |
| **Package (high-level)** | `@nostr-dev-kit/ndk` v2.14.33 (npm, published Feb 2026) |
| **Also on JSR** | `@nostr/tools` (Deno/JSR registry) |
| **Cost** | **$0** — protocol is permissionless, no API keys |
| **Rate limits** | None at protocol level. Individual relays may throttle. |
| **TypeScript** | Requires TS >= 5.0 |
| **Users** | ~16M keypairs created (active users far fewer) |

### Music Community Relevance — Strong

**Wavlake** is alive and active:
- Bitcoin Lightning-powered music streaming deeply integrated with Nostr
- Every track published as a Nostr event
- **Value 4 Value (V4V):** listeners send micropayments in sats directly to artists
- Flat 10% platform fee (vs ~70% on Spotify)
- Artists report **$13,000/year on Wavlake vs $750 in 5 years** on traditional streaming
- **Wavman:** open-source Nostr music player — all Wavlake tracks available, zaps go to artists
- Mobile app updated Nov 2025, developer docs updated Feb 2026
- **Nostr Wallet Connect (NWC):** seamless wallet linking across NWC-compatible apps

**Nostr Open Media (NOM) Specification** (draft v0.1 by Wavlake):
- Standardized event schema for multimedia (music, video) on Nostr
- Uses NIP-33 Parameterized Replaceable Events as container
- Core fields: `title`, `guid`, `creator`, `type` (MIME), `duration`, `published_at`, `link`, `enclosure` (direct media URL), `version`
- Deliberately excludes payment/DRM to stay simple

**Music-Relevant NIPs:**
- **NIP-94:** File Metadata — used for audio track metadata
- **NIP-32:** Labeling — used for categorization, podcast linking
- **NIP-38:** Live Statuses — "what you're listening to"
- **NIP-23:** Long-form Content — album descriptions, reviews
- **NIP-33:** Parameterized Replaceable Events — NOM spec container
- **Proposed:** M3U Playlists NIP — community radio, shared mixtapes, curated queues

### Code Example — Post a Note with nostr-tools

```typescript
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';

// Generate or load keypair
const sk = generateSecretKey(); // Uint8Array — store securely!
const pk = getPublicKey(sk);

// Create a Kind 1 text note
const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['t', 'music'],           // hashtag
    ['t', 'zao'],
    ['r', 'https://wavlake.com/track/abc123'], // link reference
  ],
  content: 'New track drop from ZAO artist @npub1... 🎵\n\nhttps://wavlake.com/track/abc123',
}, sk);

// Publish to relay
const relay = await Relay.connect('wss://relay.damus.io');
await relay.publish(event);
relay.close();
```

### Code Example — Post with NDK (higher-level)

```typescript
import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

const signer = new NDKPrivateKeySigner(privateKeyHex);
const ndk = new NDK({
  explicitRelayUrls: [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
  ],
  signer,
});
await ndk.connect();

const event = new NDKEvent(ndk);
event.kind = 1;
event.content = 'New track drop from ZAO! Check it out on Wavlake';
event.tags = [['t', 'music'], ['t', 'zao']];

await event.publish(); // signs + publishes to all connected relays
```

### ZAO Integration Notes
- Store a Nostr keypair server-side as `NOSTR_PRIVATE_KEY` env var for community account posting
- Optional: let members link their own npub for individual cross-posting
- Tag posts with `['t', 'music']` and `['t', 'zao']` for discoverability
- Include Wavlake links in content for V4V monetization

---

## 2. Lens Protocol V3 — @lens-protocol/client

### Current State (March 2026)

| Detail | Value |
|--------|-------|
| **Package** | `@lens-protocol/client` (canary channel for V3) |
| **Chain SDK** | `@lens-chain/sdk` v1.0.0 |
| **React bindings** | `@lens-protocol/react` (WIP for V3) |
| **GraphQL types** | `@lens-protocol/graphql` |
| **Peer deps** | `viem` (^2.21.53) or `ethers` (^6.13.4) |
| **Cost** | **$0** — free API, apps can sponsor gas |
| **Rate limits** | GraphQL rate limiting (not publicly documented, generous for normal use) |
| **Chain** | Lens Chain (ZKSync ZK Stack rollup) — launched April 4, 2025 |
| **Users** | 650,000 accounts, ~45,000 WAU |
| **Weekly npm downloads** | ~4,950 |
| **API endpoint** | `https://api.lens.xyz/graphql` (mainnet) |

### Architecture (V3 on Lens Chain)
- Migrated from Polygon to ZKSync ZK Stack
- Modular primitives: Accounts, Usernames, Graphs, Feeds, Groups, Rules, Actions
- **Grove:** decentralized storage for content
- **Account abstraction:** smart wallet accounts with managers (delegates)
- **Gasless UX:** apps sponsor gas via `setAppSponsorship()`
- **Mask Network** acquired consumer product stewardship (Jan 2026)

### Music Relevance — High Potential, No Competition

- **No dedicated music apps on Lens** — opportunity gap for ZAO
- **Collect Actions:** artists attach configurable pricing to posts, collectors mint as on-chain records
- **Referral fees:** curators who share collectable posts earn a cut — maps directly to ZAO's Respect model
- **Bonsai token:** DN-404 hybrid, ~77% market share of paid mints on Lens

### Code Example — Post to Lens V3

```typescript
import { LensClient, production } from '@lens-protocol/client';
import { textOnly } from '@lens-protocol/metadata';

// 1. Create public client
const client = new LensClient({ environment: production });

// 2. Authenticate with wallet signature (EIP-712)
const challenge = await client.authentication.generateChallenge({
  signedBy: walletAddress,
  for: lensAccountAddress,
});
const signature = await wallet.signTypedData(challenge.typedData);
const sessionClient = await client.authentication.authenticate({
  id: challenge.id,
  signature,
});

// 3. Enable signless for gasless UX (one-time)
await sessionClient.authentication.enableSignless();

// 4. Upload metadata to storage
const metadata = textOnly({
  content: 'New track drop from ZAO! Artists own their music.',
  locale: 'en',
  tags: ['music', 'zao', 'web3'],
  appId: 'zao-os',
});
// Upload metadata to Grove/IPFS and get contentURI
const contentURI = await uploadToStorage(metadata);

// 5. Create post
const result = await sessionClient.post.create({
  contentURI,
  // Optional: add collect action for monetization
  actions: [{
    collectAction: {
      payToCollect: {
        amount: { currency: 'BONSAI', value: '100' },
        collectLimit: 1000,
        referralFee: 10, // 10% to curators
      },
    },
  }],
});
```

### ZAO Integration Notes
- Same wallet can control both Farcaster FID and Lens Account
- Store mapping `{ wallet_address, farcaster_fid, lens_account_address }` in Supabase
- Register ZAO as a Lens App to sponsor gas for members
- Collect Actions on music posts = direct artist monetization layer Farcaster lacks
- Install: `npm install @lens-protocol/client@canary @lens-chain/sdk@latest`

---

## 3. X/Twitter — twitter-api-v2

### Current State (March 2026)

| Detail | Value |
|--------|-------|
| **Package** | `twitter-api-v2` (npm) |
| **Cost (Free tier)** | **$0** — write-only, 1,500 tweets/month |
| **Cost (Basic)** | **$200/mo** — 15K reads + 50K writes/month |
| **Cost (Pro)** | **$5,000/mo** — 1M reads + 300K writes/month |
| **Cost (Enterprise)** | **$42,000+/mo** |
| **NEW: Pay-per-use** | Credit-based, launched Feb 6, 2026 — now default for new devs |
| **Auth** | OAuth 2.0 PKCE or OAuth 1.0a |
| **Users** | 600M+ |

### Pricing Deep Dive

**Free Tier (sufficient for cross-posting):**
- 1,500 tweets posted per month (app-level)
- Write-only — zero ability to read, search, or retrieve tweets
- Rate: ~17 tweets per 15-minute window
- No user context, no media uploads on some accounts

**Pay-Per-Use (new default):**
- Purchase credits in advance, balance decreases per API call
- Different endpoints cost different amounts
- 24-hour deduplication: requesting same resource twice = 1 charge
- Spending caps and auto top-up configurable
- Legacy tiers (Basic/Pro) still available for predictable billing

### Music Relevance — Massive Reach, High Cost for Full API

- Largest potential audience (600M+)
- Music community extremely active (Music Twitter)
- Free tier is perfect for cross-posting text — 1,500/mo is plenty for a community
- Cannot read replies/engagement on free tier

### Code Example — Post a Tweet (Free Tier)

```typescript
import { TwitterApi } from 'twitter-api-v2';

// OAuth 2.0 user context (or app-only for simple posting)
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

// Post a tweet
const { data } = await client.v2.tweet(
  'New track drop from ZAO! 🎵\n\nListen on Wavlake: https://wavlake.com/track/abc123\n\n#web3music #ZAO'
);

console.log('Tweet ID:', data.id);
// Rate: ~1,500 tweets/month on free tier
```

### ZAO Integration Notes
- Free tier is sufficient for community cross-posting (1,500/month)
- Create a dedicated @TheZAO app account
- OAuth 1.0a is simpler for server-to-server posting
- Cannot read engagement — fire-and-forget model on free tier
- Consider pay-per-use if you need to read replies/engagement later

---

## 4. Mastodon — REST API

### Current State (March 2026)

| Detail | Value |
|--------|-------|
| **Protocol** | ActivityPub (federated) |
| **API** | REST with JSON, per-instance |
| **JS library** | `masto` (npm) or direct fetch |
| **Cost** | **$0** — free, open API |
| **Rate limits** | 300 requests per 5 minutes (per instance, standard) |
| **Auth** | OAuth 2.0 per instance |
| **Text limit** | 500 chars (default, configurable per instance) |
| **Users** | 7M+ registered across instances |

### Music Instances — Status Check

| Instance | Status | Focus |
|----------|--------|-------|
| **sonomu.club** (SoNoMu) | **Active** | Sound, Noise, Music — musicians, producers, sonic manglers, algorave |
| **musician.social** | **Active** | All genres, all musicians |
| **musicians.today** | Active | All levels |
| **stereodon.social** | Active | Underground music |
| **drumstodon.net** | Active | Drummers |
| **mastodonmusic.social** | **Shut down** | Was general music |

### Code Example — Post a Status

```typescript
// Using fetch (no library needed)
const INSTANCE = 'https://sonomu.club';
const ACCESS_TOKEN = process.env.MASTODON_ACCESS_TOKEN!;

const response = await fetch(`${INSTANCE}/api/v1/statuses`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(), // prevent duplicates
  },
  body: JSON.stringify({
    status: 'New track drop from ZAO! 🎵\n\nListen: https://wavlake.com/track/abc123\n\n#web3music #music #ZAO',
    visibility: 'public',   // public | unlisted | private | direct
    language: 'en',
  }),
});

const status = await response.json();
console.log('Status ID:', status.id);
console.log('URL:', status.url);
```

### Code Example — Using masto library

```typescript
import { createRestAPIClient } from 'masto';

const masto = createRestAPIClient({
  url: 'https://sonomu.club',
  accessToken: process.env.MASTODON_ACCESS_TOKEN!,
});

const status = await masto.v1.statuses.create({
  status: 'New track drop from ZAO! 🎵\n\n#web3music #music',
  visibility: 'public',
});
```

### OAuth App Registration (One-Time)
```bash
curl -X POST https://sonomu.club/api/v1/apps \
  -d "client_name=ZAO OS" \
  -d "redirect_uris=https://zaoos.xyz/api/mastodon/callback" \
  -d "scopes=write:statuses read:accounts" \
  -d "website=https://zaoos.xyz"
```

### ZAO Integration Notes
- Register an app on a music instance (SoNoMu recommended)
- Consider posting to multiple music instances for wider reach
- ActivityPub federation means posts propagate across the Fediverse
- 500 char limit — shorter than Farcaster (1,024), needs truncation logic
- Hashtags are critical for discovery on Mastodon — always include #music

---

## 5. Threads (Meta) — Threads API

### Current State (March 2026)

| Detail | Value |
|--------|-------|
| **API** | REST (Graph API style) at `graph.threads.net` |
| **Cost** | **$0** — free |
| **Rate limits** | **250 posts per 24 hours** (rolling), 1,000 replies per 24 hours |
| **Auth** | Meta OAuth 2.0 (requires Meta App + Business verification) |
| **Text limit** | 500 chars |
| **Media** | 10 images or 1 video per post, carousels supported |
| **Users** | 200M+ |
| **oEmbed** | No access token required (March 2026 update) |
| **GIF support** | GIPHY integration (Feb 2026 update) |

### API Timeline
- June 2024: Initial API launch
- July 2025: Major expansion — comprehensive developer tools
- Feb 2026: GIF/GIPHY support added
- March 2026: oEmbed without access token

### Music Relevance — Growing, Large Audience

- 200M+ users with growing music community
- Instagram creator migration bringing music audience
- No music-specific features yet
- Good for reach, not for monetization

### Code Example — Publish a Text Post

```typescript
const THREADS_USER_ID = process.env.THREADS_USER_ID!;
const ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN!;
const BASE_URL = 'https://graph.threads.net/v1.0';

// Step 1: Create media container
const createResponse = await fetch(
  `${BASE_URL}/${THREADS_USER_ID}/threads`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      media_type: 'TEXT',
      text: 'New track drop from ZAO! Artists own their music. 🎵\n\nListen: https://wavlake.com/track/abc123',
      access_token: ACCESS_TOKEN,
    }),
  }
);
const { id: creationId } = await createResponse.json();

// Step 2: Publish the container
const publishResponse = await fetch(
  `${BASE_URL}/${THREADS_USER_ID}/threads_publish`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      creation_id: creationId,
      access_token: ACCESS_TOKEN,
    }),
  }
);
const { id: postId } = await publishResponse.json();
console.log('Threads post ID:', postId);
```

### ZAO Integration Notes
- Two-step publish flow (create container, then publish) — slightly more complex
- Requires Meta App review and business verification
- 250 posts/day is more than enough for community cross-posting
- No SDK library — direct REST calls are fine
- Partners: Hootsuite, Sprinklr, Ayrshare handle Threads if you prefer aggregator

---

## 6. Hive Blockchain — @hiveio/dhive

### Current State (March 2026)

| Detail | Value |
|--------|-------|
| **Package** | `@hiveio/dhive` (npm) — last release ~1 year ago |
| **Alternative** | `dhive-sl` (Splinterlands fork, more actively maintained) |
| **Cost** | **$0** — free, uses Resource Credits (earned by staking HIVE) |
| **Rate limits** | No hard rate limits — governed by Resource Credits |
| **Auth** | Hive private posting key |
| **Users** | ~1.5M accounts |
| **API nodes** | `https://api.hive.blog`, `https://api.openhive.network` |

### How Posting Works on Hive
- Posts are blockchain transactions signed with your posting key
- Resource Credits (RC) are consumed per transaction — regenerate over time
- Staking HIVE (powering up) gives more RC
- Posts earn HIVE/HBD rewards based on community upvotes over 7 days
- Community tags route posts to specific communities

### Music Communities on Hive — Active

| Community | Focus |
|-----------|-------|
| **Hive Open Mic** | Weekly music performance challenge, active global community |
| **BlockTunes** | Music NFT marketplace + mainstream distribution (Spotify, Apple Music) |
| **Music Community** | General music discussion and sharing |
| **NFTShowroom** | Digital art/music NFT marketplace on Hive |
| **3Speak** | Decentralized video/audio platform (50-100 uploads/day) |

### 2026 Roadmap Highlights
- Prototyping smart contract capabilities
- Modernizing API stack with REST-based interfaces
- Enhanced community features

### Code Example — Post to Hive

```typescript
import { Client, PrivateKey } from '@hiveio/dhive';

const client = new Client([
  'https://api.hive.blog',
  'https://api.openhive.network',
  'https://api.deathwing.me',
]);

const postingKey = PrivateKey.fromString(process.env.HIVE_POSTING_KEY!);
const author = 'thezao';

// Create a post
const result = await client.broadcast.comment(
  {
    parent_author: '',           // empty for top-level post
    parent_permlink: 'music',    // community/category tag
    author,
    permlink: `zao-track-drop-${Date.now()}`,  // unique slug
    title: 'New Track Drop from ZAO!',
    body: `# New Track Drop!\n\nArtists own their music in the ZAO ecosystem.\n\nListen on Wavlake: https://wavlake.com/track/abc123\n\n---\n\n*Cross-posted from [ZAO OS](https://zaoos.xyz)*`,
    json_metadata: JSON.stringify({
      tags: ['music', 'zao', 'web3music', 'hive-music'],
      app: 'zao-os/1.0',
      format: 'markdown',
      image: ['https://zaoos.xyz/og/track-abc123.png'],
      links: ['https://wavlake.com/track/abc123'],
    }),
  },
  postingKey
);

console.log('Transaction ID:', result.id);
console.log('Block:', result.block_num);
```

### ZAO Integration Notes
- Create a `@thezao` Hive account and stake some HIVE for Resource Credits
- Posts support full Markdown — richest formatting of all platforms
- 7-day reward window means engagement earns crypto
- Route posts to `hive-music` or Hive Open Mic communities via tags
- `json_metadata.app` field identifies ZAO OS as the posting app
- Consider BlockTunes integration for mainstream distribution bridge

---

## Summary Comparison

| Platform | Package | Cost | Rate Limits | Music Score | Auth Complexity |
|----------|---------|------|-------------|-------------|-----------------|
| **Nostr** | `nostr-tools` v2.23.3 / NDK v2.14.33 | $0 | None (relay-dependent) | **10/10** (Wavlake, V4V) | Low (keypair) |
| **Lens V3** | `@lens-protocol/client` (canary) | $0 | Generous (undocumented) | **8/10** (collects, no music apps yet) | Medium (EIP-712) |
| **X/Twitter** | `twitter-api-v2` | $0 (free) / $200 (basic) | 1,500 writes/mo (free) | **7/10** (massive reach) | Medium (OAuth) |
| **Mastodon** | `masto` or fetch | $0 | 300 req/5min | **6/10** (niche instances) | Medium (OAuth per instance) |
| **Threads** | REST (no SDK) | $0 | 250 posts/day | **5/10** (growing) | High (Meta App review) |
| **Hive** | `@hiveio/dhive` | $0 (RC-based) | RC-dependent | **8/10** (BlockTunes, Open Mic) | Low (posting key) |

## Recommended Priority for ZAO OS

### Phase 1 — Immediate (already researched, build custom)
1. **Nostr** — Free, permissionless, Wavlake V4V aligns perfectly with artist-first mission
2. **Lens V3** — Free, collect monetization fills Farcaster gap, no music competition
3. **Hive** — Free, on-chain rewards, active music communities

### Phase 2 — Quick Wins
4. **X/Twitter** — Free tier for write-only cross-posting (1,500/mo plenty)
5. **Mastodon** — Free, target SoNoMu music instance
6. **Bluesky** — Already researched in Doc 77, free API

### Phase 3 — When Scale Demands
7. **Threads** — Free but requires Meta App review process
8. **Instagram/TikTok/YouTube** — Use Ayrshare ($49-99/mo) as aggregator

### Total Cost for All Custom Integrations: $0/month
(Except X Basic at $200/mo if read access needed, or Ayrshare at $49-99/mo for Tier 3)

---

## Cross-Platform Publishing Tools

### Ayrshare API (shortcut for Web2 platforms)

| Plan | Cost | Platforms |
|------|------|-----------|
| Free | $0 | 20 posts/mo across all |
| Starter | $49/mo | Unlimited |
| Premium | $99/mo | 1,000 posts/mo |

Supports: X, Bluesky, Instagram, Threads, TikTok, YouTube, Reddit, Telegram, Pinterest, LinkedIn

### Why Build Custom for Web3
- No aggregator supports Nostr, Lens, Hive, or Farcaster
- Web3 platforms have unique auth (keypairs, wallet signatures, posting keys)
- Custom integration gives control over monetization features (Lens collects, Nostr V4V, Hive rewards)
- Queue-based fan-out architecture (see Doc 28) handles all platforms uniformly

---

## Sources

- [nostr-tools npm](https://www.npmjs.com/package/nostr-tools)
- [NDK npm](https://www.npmjs.com/package/@nostr-dev-kit/ndk)
- [Wavlake NOM Spec](https://github.com/wavlake/nom-spec)
- [Wavlake Zine](https://zine.wavlake.com/)
- [Wavman Music Player](https://zine.wavlake.com/introducing-wavman/)
- [Nostr NIPs Index](https://nostr-nips.com/)
- [Lens Protocol SDK](https://www.npmjs.com/package/@lens-protocol/client)
- [Lens Chain Docs](https://lens.xyz/docs)
- [Lens Chain Launch](https://blog.availproject.org/lens-chain-goes-live-scaling-socialfi-with-avail-and-zksync/)
- [X API Pricing 2026](https://zernio.com/blog/twitter-api-pricing)
- [X Pay-Per-Use Announcement](https://devcommunity.x.com/t/announcing-the-launch-of-x-api-pay-per-use-pricing/256476)
- [X API Tiers Compared](https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/)
- [Mastodon Statuses API](https://docs.joinmastodon.org/methods/statuses/)
- [SoNoMu Instance](https://sonomu.club/)
- [Musician.Social](https://musician.social/)
- [Music Mastodon Servers](https://mastodonservers.net/servers/music)
- [Threads API Posts](https://developers.facebook.com/docs/threads/posts/)
- [Threads API Changelog](https://developers.facebook.com/docs/threads/changelog/)
- [Threads API Guide](https://getlate.dev/blog/threads-api)
- [@hiveio/dhive npm](https://www.npmjs.com/package/@hiveio/dhive)
- [Hive Developer Docs](https://developers.hive.io/)
- [Hive Roadmap 2026](https://hive.io/en/roadmap/)
- [BlockTunes](https://blocktunes.net/how-to-become-a-blocktunes-artist/)
- [Hive Frontends Feb 2026](https://hive.blog/hive-133987/@dalz/a-look-at-the-top-hive-frontends-or-feb-2026)
- [Ayrshare Pricing](https://www.ayrshare.com/pricing/)
