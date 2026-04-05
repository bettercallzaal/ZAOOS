# 111 — Audius API Deep Dive for ZAO OS Integration

> **Date:** 2026-03-22
> **Status:** Research Complete
> **Relevance:** High — ZAO OS already recognizes Audius URLs and streams via the v1 REST API. This doc maps the full surface area for deeper integration.

---

## Table of Contents

1. [Current ZAO OS Integration Status](#1-current-zao-os-integration-status)
2. [Audius API v1 — Complete Endpoint Reference](#2-audius-api-v1--complete-endpoint-reference)
3. [Rate Limits and Authentication](#3-rate-limits-and-authentication)
4. [Audius SDK (@audius/sdk)](#4-audius-sdk-audiussdk)
5. [Audius Embed Player ("Bedtime")](#5-audius-embed-player-bedtime)
6. [Content Nodes and Streaming Architecture](#6-content-nodes-and-streaming-architecture)
7. [Community Playlists and Curation](#7-community-playlists-and-curation)
8. [Artist Verification and Identity](#8-artist-verification-and-identity)
9. [$AUDIO Token, Tipping, and Token Gating](#9-audio-token-tipping-and-token-gating)
10. [Integration Recommendations for ZAO OS](#10-integration-recommendations-for-zao-os)

---

## 1. Current ZAO OS Integration Status

ZAO OS already has a working Audius integration at a basic level:

- **URL detection:** `src/lib/music/isMusicUrl.ts` recognizes `audius.co/{artist}/{track}` URLs
- **Type definition:** `TrackType` includes `'audius'` in `src/types/music.ts`
- **Metadata fetching:** `src/app/api/music/metadata/route.ts` has a `fetchAudius()` function that:
  1. Resolves an Audius page URL to a track object via `GET /v1/resolve?url=...&app_name=ZAO-OS`
  2. Extracts `title`, `user.name`, and `artwork` (480x480 or 150x150)
  3. Constructs a stream URL: `https://api.audius.co/v1/tracks/{id}/stream?app_name=ZAO-OS`
- **Playback:** The `HTMLAudioProvider` plays the stream URL directly via `<audio>` element
- **UI:** `MusicEmbed.tsx` renders Audius tracks with purple accent color and inline playback controls

**What is missing:** Search, trending, playlist integration, user profile linking, BPM/key metadata, community playlist curation, and the embed player.

---

## 2. Audius API v1 — Complete Endpoint Reference

**Base URL:** `https://api.audius.co/v1`

The API is a standard REST API with JSON responses. All responses are wrapped in a `{ data: ... }` envelope. The OpenAPI spec is available at `https://api.audius.co/v1/swagger.yaml` (494KB YAML).

### 2.1 Tracks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tracks` | Get tracks by ID, permalink, or ISRC |
| `POST` | `/tracks` | Create (upload) a new track |
| `GET` | `/tracks/search` | Search tracks by query, genre, mood, key, BPM |
| `GET` | `/tracks/trending` | Top 100 trending tracks |
| `GET` | `/tracks/trending/{version}` | Trending by strategy version |
| `GET` | `/tracks/trending/ids` | Just the IDs of trending tracks |
| `GET` | `/tracks/trending/underground` | Top 100 trending underground tracks |
| `GET` | `/tracks/trending/underground/winners` | Weekly underground trending winners |
| `GET` | `/tracks/trending/winners` | Weekly trending winners |
| `GET` | `/tracks/recommended` | Recommended tracks |
| `GET` | `/tracks/recommended/{version}` | Recommended by strategy version |
| `GET` | `/tracks/feeling-lucky` | Random tracks from "Feeling Lucky" smart playlist |
| `GET` | `/tracks/recent-premium` | Most recently listed premium (paid) tracks |
| `GET` | `/tracks/recent-comments` | Tracks with most recent active discussion |
| `GET` | `/tracks/most-shared` | Most shared tracks by time range |
| `GET` | `/tracks/usdc-purchase` | Top trending USDC purchasable tracks |
| `GET` | `/tracks/download_counts` | Download counts for tracks by ID |
| `GET` | `/tracks/inspect` | Inspect file details for tracks |
| `GET` | `/tracks/{track_id}` | Get a single track by ID |
| `PUT` | `/tracks/{track_id}` | Update a track |
| `DELETE` | `/tracks/{track_id}` | Delete a track |
| `GET` | `/tracks/{track_id}/stream` | **Stream the audio file (supports Range headers)** |
| `GET` | `/tracks/{track_id}/access-info` | Access permissions for track |
| `GET` | `/tracks/{track_id}/stats` | Play count and other stats |
| `GET` | `/tracks/{track_id}/comments` | Comments on a track |
| `GET` | `/tracks/{track_id}/comment_count` | Comment count |
| `GET` | `/tracks/{track_id}/favorites` | Users who favorited |
| `POST` | `/tracks/{track_id}/favorites` | Favorite a track |
| `DELETE` | `/tracks/{track_id}/favorites` | Unfavorite a track |
| `GET` | `/tracks/{track_id}/reposts` | Users who reposted |
| `POST` | `/tracks/{track_id}/reposts` | Repost a track |
| `DELETE` | `/tracks/{track_id}/reposts` | Unrepost a track |
| `POST` | `/tracks/{track_id}/shares` | Record a share event |
| `GET` | `/tracks/{track_id}/remixes` | Tracks that remix this track |
| `GET` | `/tracks/{track_id}/remixing` | Tracks this track remixes |
| `GET` | `/tracks/{track_id}/download_count` | Download count |

#### Track Search Parameters

```
GET /v1/tracks/search?query=...&genre[]=...&mood[]=...&key[]=...&bpm_min=...&bpm_max=...&sort_method=...&only_downloadable=...&is_purchaseable=...&has_downloads=...&offset=...&limit=...
```

- `query` — text search term
- `genre[]` — filter by genre (array, can pass multiple)
- `mood[]` — filter by mood (array)
- `key[]` — filter by musical key (array, e.g. `C major`, `A minor`)
- `bpm_min` / `bpm_max` — BPM range filter
- `sort_method` — sort order
- `only_downloadable` — boolean
- `is_purchaseable` — boolean
- `has_downloads` — boolean
- `includePurchaseable` — boolean

#### Trending Parameters

```
GET /v1/tracks/trending?genre=...&time=...&offset=0&limit=20
```

- `time` — `"week"`, `"month"`, or `"allTime"`
- `genre` — filter by genre string
- `offset` / `limit` — pagination

#### Track Object Shape (Response)

Based on the swagger spec and live API responses:

```json
{
  "data": {
    "id": "4boROp0",
    "title": "DISFRUTA",
    "description": "frooots latest banger",
    "genre": "Deep House",
    "mood": "Fiery",
    "tags": "house,deep",
    "release_date": "2024-08-02T21:57:07Z",
    "duration": 245,
    "bpm": 124.0,
    "musical_key": "C minor",
    "is_original_available": true,
    "track_cid": "Qm...",
    "preview_cid": "Qm...",
    "orig_file_cid": "Qm...",
    "orig_filename": "disfruta.wav",
    "artwork": {
      "150x150": "https://creatornode.audius.co/.../150x150.jpg",
      "480x480": "https://creatornode.audius.co/.../480x480.jpg",
      "1000x1000": "https://creatornode.audius.co/.../1000x1000.jpg"
    },
    "repost_count": 25,
    "favorite_count": 51,
    "comment_count": 8,
    "play_count": 1200,
    "permalink": "/artist/disfruta",
    "is_streamable": true,
    "is_downloadable": false,
    "is_purchaseable": false,
    "has_current_user_reposted": false,
    "has_current_user_saved": false,
    "remix_of": { "tracks": null },
    "user": {
      "id": "abc123",
      "handle": "frooots",
      "name": "Frooots",
      "bio": "...",
      "is_verified": true,
      "follower_count": 5000,
      "followee_count": 200,
      "track_count": 42,
      "album_count": 3,
      "playlist_count": 5,
      "artist_pick_track_id": "4boROp0",
      "cover_photo": { ... },
      "profile_picture": { ... },
      "wallet": "0x..."
    }
  }
}
```

Key fields for ZAO OS: `bpm`, `musical_key` (detected via libKeyFinder/Essentia during upload), `duration`, `genre`, `mood`, `tags`, `play_count`, artwork at 3 sizes.

### 2.2 Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | Get users by ID |
| `GET` | `/users/search` | Search users by query |
| `GET` | `/users/{user_id}` | Get a single user |
| `GET` | `/users/{user_id}/tracks` | Get a user's tracks |
| `GET` | `/users/{user_id}/favorites` | Get a user's favorites |
| `GET` | `/users/{user_id}/reposts` | Get a user's reposts |
| `GET` | `/users/{user_id}/followers` | Get a user's followers |
| `GET` | `/users/{user_id}/following` | Get users this user follows |
| `GET` | `/users/{user_id}/subscribers` | Users subscribed to this user |
| `GET` | `/users/{user_id}/supporters` | Users who have tipped this user |
| `GET` | `/users/{user_id}/supportings` | Users this user has tipped |
| `GET` | `/users/handle/{handle}` | Look up user by handle |
| `POST` | `/users/{user_id}/follow` | Follow a user |
| `DELETE` | `/users/{user_id}/follow` | Unfollow a user |
| `POST` | `/users/{user_id}/subscribe` | Subscribe to a user |
| `DELETE` | `/users/{user_id}/subscribe` | Unsubscribe |

### 2.3 Playlists

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/playlists` | Get playlists by ID, permalink, or UPC |
| `POST` | `/playlists` | **Create a new playlist or album** |
| `GET` | `/playlists/search` | Search playlists |
| `GET` | `/playlists/trending` | Trending playlists |
| `GET` | `/playlists/{playlist_id}` | Get a single playlist |
| `PUT` | `/playlists/{playlist_id}` | **Update a playlist (add/remove tracks)** |
| `DELETE` | `/playlists/{playlist_id}` | Delete a playlist |
| `GET` | `/playlists/{playlist_id}/tracks` | Get tracks in a playlist |
| `GET` | `/playlists/{playlist_id}/access-info` | Access permissions |
| `POST` | `/playlists/{playlist_id}/favorites` | Favorite a playlist |
| `DELETE` | `/playlists/{playlist_id}/favorites` | Unfavorite |
| `GET` | `/playlists/{playlist_id}/favorites` | Users who favorited |
| `POST` | `/playlists/{playlist_id}/reposts` | Repost a playlist |
| `DELETE` | `/playlists/{playlist_id}/reposts` | Unrepost |
| `GET` | `/playlists/{playlist_id}/reposts` | Users who reposted |
| `POST` | `/playlists/{playlist_id}/shares` | Record a share event |

### 2.4 Resolve

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/resolve?url=...` | Resolve any Audius URL to the API resource (302 redirect) |

This is what ZAO OS currently uses. Pass any `audius.co` URL and it resolves to the track/user/playlist JSON.

### 2.5 Comments

Full CRUD for comments on tracks:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/comments` | Create a comment |
| `GET` | `/comments/{comment_id}` | Get a comment |
| `PUT` | `/comments/{comment_id}` | Update a comment |
| `DELETE` | `/comments/{comment_id}` | Delete a comment |
| `POST` | `/comments/{comment_id}/react` | React to a comment |
| `DELETE` | `/comments/{comment_id}/react` | Remove reaction |
| `POST` | `/comments/{comment_id}/pin` | Pin a comment |
| `DELETE` | `/comments/{comment_id}/pin` | Unpin |
| `POST` | `/comments/{comment_id}/report` | Report a comment |
| `GET` | `/comments/{comment_id}/replies` | Get replies to a comment |

### 2.6 Other Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tips` | Recent tips on the network |
| `GET` | `/explore/best-selling` | Best-selling tracks and playlists |
| `GET` | `/dashboard_wallet_users?wallets[]=0x...` | **Get Audius profiles by wallet address** |
| `GET` | `/challenges/undisbursed` | Undisbursed challenge rewards |
| `GET` | `/events` | Event feed |
| `GET` | `/events/entity` | Events for a specific entity |
| `POST` | `/developer-apps` | Register a developer app |

---

## 3. Rate Limits and Authentication

### Authentication Options

1. **`app_name` query parameter (legacy, still works):**
   ```
   GET /v1/tracks/trending?app_name=ZAO-OS
   ```
   No registration needed. This is what ZAO OS currently uses. Lower rate limits.

2. **API Key (recommended):**
   - Register at `https://audius.co/settings` or `https://api.audius.co/plans`
   - Free tier available with no cost
   - Pass as header: `X-API-Key: your_api_key`
   - Safe for client-side use

3. **Bearer Token (for write operations):**
   - Generated alongside API Key
   - Pass as header: `Authorization: Bearer your_token`
   - **Backend only** — grants ability to act on behalf of authorized users
   - Can be rotated without regenerating the API Key

### Rate Limits

- **Without API Key (`app_name` only):** Lower limits, exact numbers not published but anecdotally ~100 requests/minute
- **With Free API Key:** Higher limits, sufficient for most apps
- **Unlimited plan:** Contact api@audius.co for enterprise needs

### Recommendation for ZAO OS

Switch from `app_name=ZAO-OS` to a registered API Key. Store `AUDIUS_API_KEY` in `.env` (safe for client exposure) and `AUDIUS_BEARER_TOKEN` in `.env` (server-only). This is a minimal change in the metadata route.

---

## 4. Audius SDK (`@audius/sdk`)

### Package Info

- **npm:** `@audius/sdk`
- **Current version:** 15.0.1 (published March 2026)
- **Language:** TypeScript
- **Source:** `AudiusProject/apps` monorepo, `packages/libs/`
- **CDN:** `https://cdn.jsdelivr.net/npm/@audius/sdk@latest/dist/sdk.min.js`

### Installation

```bash
npm install @audius/sdk
```

### Initialization

```typescript
// Backend (Node.js) — full access
import { sdk } from '@audius/sdk';

const audiusSdk = sdk({
  apiKey: process.env.AUDIUS_API_KEY!,
  bearerToken: process.env.AUDIUS_BEARER_TOKEN!,
});

// Frontend (browser) — read-only + OAuth
const audiusSdk = sdk({
  apiKey: 'your_api_key',
  redirectUri: 'https://your-app.com/oauth/callback',
});
```

### Available Namespaces and Methods

```typescript
// Tracks
audiusSdk.tracks.getTrack({ trackId: 'D7KyD' })
audiusSdk.tracks.searchTracks({ query: 'deep house' })
audiusSdk.tracks.getTrendingTracks({ time: 'week', genre: 'Electronic' })
audiusSdk.tracks.favoriteTrack({ trackId, userId })
audiusSdk.tracks.repostTrack({ trackId, userId })
audiusSdk.tracks.uploadTrack({ ... })

// Users
audiusSdk.users.getUserByHandle({ handle: 'frooots' })
audiusSdk.users.getUser({ userId })
audiusSdk.users.getFollowers({ userId })
audiusSdk.users.getFollowing({ userId })
audiusSdk.users.getReposts({ userId })
audiusSdk.users.getFavorites({ userId })
audiusSdk.users.getSupporters({ userId })
audiusSdk.users.getSupportings({ userId })
audiusSdk.users.getSubscribers({ userId })
audiusSdk.users.getBulkUsers({ ... })

// Playlists
audiusSdk.playlists.getPlaylist({ playlistId })
audiusSdk.playlists.searchPlaylists({ query })
audiusSdk.playlists.getTrendingPlaylists({ time })
audiusSdk.playlists.getPlaylistTracks({ playlistId })
audiusSdk.playlists.createPlaylist({ ... })
audiusSdk.playlists.updatePlaylist({ ... })
audiusSdk.playlists.deletePlaylist({ ... })
audiusSdk.playlists.favoritePlaylist({ playlistId, userId })
audiusSdk.playlists.repostPlaylist({ playlistId, userId })

// Albums
audiusSdk.albums.getAlbum({ albumId })
audiusSdk.albums.getAlbumTracks({ albumId })

// Resolve
audiusSdk.resolve({ url: 'https://audius.co/artist/track' })

// OAuth
audiusSdk.oauth.login()
audiusSdk.oauth.handleRedirectCallback()
```

### SDK vs Raw REST

| Factor | SDK | REST |
|--------|-----|------|
| TypeScript types | Built-in | Manual |
| Discovery node selection | Automatic | Manual or use `api.audius.co` |
| Auth handling | Built-in OAuth flow | Manual token management |
| Bundle size | ~50KB+ | Zero (just fetch) |
| Write operations | Easier (handles signing) | Must manage Hedgehog wallet signing |

**Recommendation:** For ZAO OS server-side routes, the raw REST API is fine and already working. The SDK adds value if we want to add OAuth ("Log in with Audius") or perform write operations (creating playlists, favoriting). For browser-side search UI, the SDK with CDN is a good option.

---

## 5. Audius Embed Player ("Bedtime")

### Embed URL Format

```
https://audius.co/embed/track/{TRACK_ID}?flavor={flavor}
https://audius.co/embed/playlist/{PLAYLIST_ID}?flavor={flavor}
```

### Flavor Options

- `card` — Compact card layout (recommended for feed embeds)
- `compact` — Minimal horizontal player bar
- (default) — Full-size player with artwork

### Iframe Usage

```html
<iframe
  src="https://audius.co/embed/track/D7KyD?flavor=card"
  width="100%"
  height="120"
  allow="encrypted-media"
  style="border: none;"
></iframe>
```

### Status

The original "Bedtime" embed player repo (`AudiusProject/bedtime`) was **archived June 2023**. The embed player now lives inside the Audius client monorepo at `AudiusProject/apps` (previously `AudiusProject/audius-client`). It is built with Preact and renders inside an iframe.

### Customization Limitations

- No documented dark mode toggle (the player uses its own theme)
- No events API for playback state callbacks
- No documented way to customize colors or branding
- Size is controlled by iframe dimensions and the `flavor` parameter

### ZAO OS Recommendation

ZAO OS already has its own custom player (the `MusicEmbed` component + `HTMLAudioProvider`) that streams directly from the Audius API. This is **superior** to the iframe embed because:
- Full control over dark theme (navy + gold)
- Unified player across all platforms
- No iframe overhead
- Direct audio control (play, pause, seek, queue)

Keep using the direct stream URL approach. The embed player is only useful for external contexts (sharing ZAO playlists on other sites).

---

## 6. Content Nodes and Streaming Architecture

### Architecture Overview

Audius runs on two types of nodes:

1. **Discovery Nodes (Discovery Providers):**
   - Index metadata from the Audius Content Ledger (blockchain)
   - Serve the REST API
   - Handle search, trending algorithms, social features
   - Built with Python/Celery/PostgreSQL/Elasticsearch
   - The `api.audius.co` gateway automatically routes to a healthy discovery node

2. **Content Nodes:**
   - Store and serve the actual audio files, images, and metadata
   - Process uploads with FFMPEG (segment + transcode)
   - Run IPFS nodes for decentralized storage
   - Built with Node.js/Express/PostgreSQL/Redis
   - Audio is stored redundantly across multiple content nodes

### How Streaming Works

1. Client calls `GET /v1/tracks/{id}/stream` on a discovery node
2. The discovery node resolves the track's content node(s)
3. The request is proxied/redirected to the appropriate content node
4. Content node serves the audio file (MP3 segments)
5. **Range headers are supported** for seeking and partial downloads

### Stream Endpoint Details

```
GET /v1/tracks/{track_id}/stream
```

**Headers:**
- `Range: bytes=0-` — Standard HTTP range request for streaming/seeking

**Optional Parameters:**
- `signature` — Wallet signature for gated content access
- `data` — Data used to generate the signature
- `nft_access_signature` — DN-generated signature for gated content
- `skip_play_count` — Boolean to disable play count tracking
- `api_key` — API key for third-party apps

**Response:**
- `200 OK` or `206 Partial Content` with audio/mpeg body
- Standard streaming response with `Content-Range` headers

### Node Selection

- **For most apps:** Use `https://api.audius.co` as the base URL. It acts as a load balancer and automatically selects healthy discovery nodes.
- **For advanced use:** Query the discovery node registry or visit `https://dashboard.audius.org/services/discovery-provider` to see all registered nodes.
- The SDK handles node selection automatically.

### ZAO OS Current Approach

ZAO OS constructs stream URLs like:
```
https://api.audius.co/v1/tracks/{id}/stream?app_name=ZAO-OS
```
This works well. The `api.audius.co` gateway handles node selection.

---

## 7. Community Playlists and Curation

### Can ZAO Programmatically Create/Manage Playlists?

**Yes.** The API supports full playlist CRUD:

```typescript
// Create a ZAO Community Playlist
POST /v1/playlists
{
  user_id: "zao_curator_user_id",
  playlist_name: "ZAO Community Picks - March 2026",
  description: "Curated by The ZAO community",
  is_album: false,
  track_ids: ["trackId1", "trackId2", ...],
  artwork: { ... }
}

// Add tracks to existing playlist
PUT /v1/playlists/{playlist_id}
{
  user_id: "zao_curator_user_id",
  track_ids: [...existing_tracks, "new_track_id"]
}
```

### Requirements for Write Operations

1. **An Audius account** — ZAO would need a dedicated Audius account (e.g., `@thezao`)
2. **Bearer token** — Must authenticate as that user via OAuth or API credentials
3. **SDK recommended** — Write operations involve signing transactions; the SDK handles this

### "ZAO Community Playlist" Design

**Option A: Single curator account**
- Create an `@TheZAO` Audius account
- Backend service manages the playlist via Bearer token
- ZAO members submit Audius track URLs via ZAO OS
- A moderation/voting step approves additions
- Backend calls `PUT /playlists/{id}` to add approved tracks

**Option B: Collaborative via social signals**
- ZAO members post Audius links in the ZAO OS feed
- Tracks that earn enough Respect / reposts get auto-added
- A cron job or webhook aggregates top tracks into the playlist

**Option C: Trending within ZAO**
- Track which Audius links get the most engagement in ZAO OS
- Build a "ZAO Trending" feed using internal engagement data
- Optionally sync to an Audius playlist for external visibility

---

## 8. Artist Verification and Identity

### Audius Identity System

- Every Audius user has a **wallet address** (Ethereum)
- Users can link additional wallets (Solana, Ethereum) to their profile
- The `dashboard_wallet_users` endpoint resolves wallet addresses to Audius profiles:

```
GET /v1/dashboard_wallet_users?wallets[]=0x1234...&wallets[]=0x5678...
```

### Linking Audius to Farcaster

There is no native Audius-Farcaster identity bridge. However, ZAO OS can implement one:

**Approach 1: Wallet-based matching**
1. ZAO OS already stores Farcaster users' connected wallet addresses
2. Query Audius `dashboard_wallet_users` endpoint with those wallets
3. If a match is found, link the Audius profile to the Farcaster profile
4. Display Audius profile data (track count, follower count, verified status) on the user's ZAO OS profile

**Approach 2: Manual linking**
1. User enters their Audius handle in ZAO OS settings
2. ZAO OS verifies ownership by checking if the Audius account's wallet matches the user's Farcaster verified address
3. Store the mapping in Supabase

**Approach 3: Audius OAuth**
1. Use "Log in with Audius" (OAuth 2.0 PKCE flow) as a verification step
2. User authenticates with Audius, ZAO OS receives their Audius user ID
3. Store the Farcaster FID <-> Audius user ID mapping

### Artist Verification on Audius

- Audius has its own verified artist program (`is_verified: true` in user object)
- Verification is visible via the API response
- ZAO OS could display a "Verified on Audius" badge for linked accounts

---

## 9. $AUDIO Token, Tipping, and Token Gating

### Tipping via $AUDIO

- Users can tip artists with $AUDIO tokens directly on Audius
- Tips are visible via the API:
  ```
  GET /v1/tips?receiver_min_followers=100&unique_by=sender
  GET /v1/users/{user_id}/supporters
  GET /v1/users/{user_id}/supportings
  ```
- ZAO OS could display tip leaderboards or "most supported ZAO artists"

### NFT / Token Gating

- Artists can gate tracks behind NFT ownership
- Collectors who hold specific NFTs from an artist get exclusive access
- Gate checking requires wallet signature via the stream endpoint's `signature` parameter
- The `access-info` endpoint shows what access a user has:
  ```
  GET /v1/tracks/{track_id}/access-info?user_id=...
  ```

### USDC Purchases

- Artists can sell tracks for USDC (stablecoin)
- The `/tracks/usdc-purchase` endpoint lists trending purchasable tracks
- Purchase requires on-chain transaction (not just API call)
- Relevant for ZAO artists who want to monetize directly

### $AUDIO Staking

- Node operators stake $AUDIO to run discovery/content nodes
- Not directly relevant for ZAO OS integration but relevant for the whitepaper narrative

---

## 10. Integration Recommendations for ZAO OS

### Priority 1: Enhance Current Integration (Low effort, high value)

1. **Register an API Key** — Switch from `app_name=ZAO-OS` to a proper API key for better rate limits
2. **Enrich track metadata** — Extract `bpm`, `musical_key`, `duration`, `genre`, `mood`, `play_count` from the resolve response and display in the `MusicEmbed` component
3. **Add artwork at 1000x1000** — Currently using 480x480; use 1000x1000 for full-screen views

### Priority 2: Search and Discovery (Medium effort, high value)

4. **Audius search in QuickAddSong** — When a user types a search term, query `/v1/tracks/search` and show results alongside other platform results
5. **ZAO Trending from Audius** — Show trending Audius tracks filtered by genres relevant to ZAO (e.g., Electronic, Hip-Hop, R&B)
6. **Genre/mood/BPM filters** — Leverage Audius's advanced search params for music discovery

### Priority 3: Community Features (Higher effort)

7. **ZAO Community Playlist** — Create and maintain an Audius playlist that reflects the community's taste
8. **Wallet-based identity linking** — Match Farcaster wallets to Audius accounts for profile enrichment
9. **Tip visibility** — Show which ZAO members are top supporters/tippers on Audius

### Priority 4: Advanced (Future)

10. **Audius OAuth** — "Log in with Audius" for identity verification
11. **Token-gated content** — Support playing NFT-gated Audius tracks for users who hold the required tokens
12. **Remix tracking** — Use the `/remixes` and `/remixing` endpoints to build remix trees within ZAO

### Code Change: Enhanced fetchAudius()

The current `fetchAudius()` in `src/app/api/music/metadata/route.ts` could be enhanced to return richer metadata:

```typescript
// Enhanced version (suggested)
async function fetchAudius(url: string): Promise<TrackMetadata | null> {
  const resolveRes = await fetch(
    `${AUDIUS_API}/resolve?url=${encodeURIComponent(url)}`,
    {
      headers: {
        'User-Agent': 'ZAO-OS/1.0',
        'X-API-Key': process.env.AUDIUS_API_KEY!,
      },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!resolveRes.ok) return null;

  const resolved = await resolveRes.json();
  const track = resolved?.data;
  if (!track?.id) return null;

  return {
    id: track.id,
    type: 'audius',
    trackName: track.title ?? '',
    artistName: track.user?.name ?? '',
    artworkUrl: track.artwork?.['1000x1000'] ?? track.artwork?.['480x480'] ?? '',
    url,
    streamUrl: `${AUDIUS_API}/tracks/${track.id}/stream`,
    feedId: '',
    // Extended fields (requires TrackMetadata type update)
    duration: track.duration,
    bpm: track.bpm,
    musicalKey: track.musical_key,
    genre: track.genre,
    mood: track.mood,
    playCount: track.play_count,
    favoriteCount: track.favorite_count,
    repostCount: track.repost_count,
  };
}
```

---

## Sources

- [Audius REST API Quick Start](https://docs.audius.co/api/)
- [Audius OpenAPI Spec (Swagger)](https://api.audius.co/v1/swagger.yaml)
- [Audius JavaScript SDK on npm](https://www.npmjs.com/package/@audius/sdk)
- [Audius JavaScript SDK Docs](https://docs.audius.co/sdk/)
- [Audius Protocol Architecture](https://docs.audius.co/learn/concepts/protocol/)
- [Audius Content Node Architecture](https://docs.audius.co/learn/architecture/content-node/)
- [Audius Discovery Node Architecture](https://docs.audius.co/learn/architecture/discovery-node/)
- [Audius Embed Player (Bedtime) - Archived](https://github.com/AudiusProject/bedtime)
- [Audius Apps Monorepo](https://github.com/AudiusProject/apps)
- [Audius API Backend](https://github.com/AudiusProject/api)
- [Key & BPM Search at Audius](https://engineering.audius.co/key-bpm-search-at-audius/)
- [Audius NFT Token Gating](https://www.coindesk.com/web3/2023/03/09/audius-implements-nft-gating-for-exclusive-artist-access/)
- [Understanding USDC on Audius](https://support.audius.co/help/Understanding-USDC-on-Audius)
- [Audius $AUDIO Token](https://audius.org/en/token)
- [Audius Tipping](https://www.coindesk.com/business/2022/07/19/blockchain-music-service-audius-to-allow-users-to-tip-artists-using-audio)
- [Audius Dashboard (Node Registry)](https://dashboard.audius.org/services/discovery-provider)
- [Stream Track Endpoint Docs](https://docs.audius.co/developers/api/stream-track/)
- [Audius SDK Playlists Docs](https://docs.audius.co/developers/sdk/playlists/)
