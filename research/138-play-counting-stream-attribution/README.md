# 138 — Do Plays on ZAO OS Count? Stream Attribution Deep Dive

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Determine whether music played through ZAO OS counts as legitimate streams on source platforms, and identify gaps + fixes

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Spotify, SoundCloud, YouTube** | Already counting — ZAO OS uses native iframe embeds. No changes needed. |
| **Audius** | Likely counting — uses official API stream endpoint with `app_name`. Verify with Audius team. |
| **Sound.xyz** | NOT counting — direct audio URL bypass. Add optional embed or use their SDK. |
| **Apple Music** | NOT playing in-app — redirects to external. Implement MusicKit JS for in-app playback + stream counting. |
| **Tidal, Bandcamp** | NOT playing in-app — redirects to external. Low priority, limited API access. |
| **Last.fm scrobbling** | ADD THIS — universal play reporting across all platforms. 3-hour implementation. |
| **ListenBrainz** | ADD THIS — open-source scrobbling alternative, no approval needed. |

## Current State: Platform-by-Platform

### Plays DO Count (Native Embeds)

| Platform | How ZAO OS Plays It | Counts? | Conditions |
|----------|---------------------|---------|------------|
| **Spotify** | Native IFrame Embed API (`SpotifyProvider.tsx`) | **YES** | User must be logged into Spotify in browser + listen 30s+ ([source](https://developer.spotify.com/documentation/embeds)) |
| **SoundCloud** | Native Widget API (`SoundcloudProvider.tsx`) | **YES** | 30s+ listen. All widget plays count ([source](https://help.soundcloud.com/hc/en-us/articles/115003453587-Embedded-players)) |
| **YouTube** | Native IFrame API (`YoutubeProvider.tsx`) | **YES** | 30s+ active watch, not autoplayed muted ([source](https://www.subsub.io/blog/how-does-youtube-count-views)) |

**Why these work:** ZAO OS loads the official platform embed/widget, which handles authentication and play reporting internally. The platform sees these as legitimate embedded plays.

### Plays MIGHT Count (API Streaming)

| Platform | How ZAO OS Plays It | Counts? | Notes |
|----------|---------------------|---------|-------|
| **Audius** | Direct API stream URL: `GET /tracks/{id}/stream?app_name=ZAO` | **PROBABLY** | Audius SDK docs show an optional `skip_play_count` parameter (default false), meaning API streams count by default. ZAO OS passes `app_name` which registers the play. Confirm with Audius team. ([source](https://docs.audius.org/developers/api/stream-track/)) |

### Plays DO NOT Count (Direct Audio / External Redirect)

| Platform | How ZAO OS Plays It | Counts? | Fix |
|----------|---------------------|---------|-----|
| **Sound.xyz** | Extracts `normalizedAudioUrl` via GraphQL, plays via `<audio>` element | **NO** | Direct audio file bypass. Sound.xyz has no embed widget. Consider their SDK or accept this limitation. |
| **Apple Music** | Opens external link in new tab | **NO (in-app)** | Implement [MusicKit JS](https://developer.apple.com/musickit/) for in-app playback. Requires Apple Developer account. Plays via MusicKit count as streams and pay royalties. |
| **Tidal** | Opens external link in new tab | **NO (in-app)** | Tidal has no public embed API. Would need partnership. Low priority. |
| **Bandcamp** | Opens external link in new tab | **NO (in-app)** | Bandcamp has no embed player API for third-party apps. Low priority. |

## What "Counting" Actually Means

Each platform has rules for what constitutes a countable stream:

| Platform | Min Duration | Auth Required? | Pays Royalties? | Rate (2026) |
|----------|-------------|----------------|-----------------|-------------|
| Spotify | 30 seconds | Yes (logged in) | Yes (1000+ streams/yr threshold) | ~$0.003-0.005/stream ([source](https://support.spotify.com/us/artists/article/how-your-streams-are-counted/)) |
| SoundCloud | 30 seconds | No | Yes (SoundCloud Premier) | ~$0.003-0.004/stream |
| YouTube | 30 seconds | No | Yes (via Content ID / YPP) | ~$0.002-0.005/view |
| Apple Music | 30 seconds | Yes (subscriber) | Yes (from first stream) | ~$0.007-0.01/stream ([source](https://artists.apple.com/support/1124-apple-music-insights-royalty-rate)) |
| Audius | Any play | No | $AUDIO token rewards | Variable |
| Sound.xyz | N/A (NFT model) | No | Collector revenue | Per-mint price |

## Gaps & Implementation Plan

### Priority 1: Last.fm Scrobbling (Universal Play Reporting)

**Why:** Regardless of whether platform plays count, Last.fm scrobbling gives ZAO members a unified listening history and proves their engagement. It also surfaces ZAO artists in Last.fm charts.

**Implementation (from Doc 130):**
- New file: `src/lib/music/lastfm.ts`
- OAuth flow in Settings page
- Fire-and-forget scrobble call after 30s of playback
- API: `track.scrobble` + `track.updateNowPlaying` ([Last.fm API docs](https://www.last.fm/api))
- Effort: ~3 hours
- Requires: [Last.fm API key](https://www.last.fm/api/account/create)

```typescript
// Pseudocode for scrobble integration point
// In PlayerProvider.tsx, after 30s of playback:
if (elapsedSeconds >= 30 && !hasScrobbled) {
  scrobbleToLastFm({ artist, track, album, timestamp });
  hasScrobbled = true;
}
```

### Priority 2: ListenBrainz (Open-Source Alternative)

**Why:** No API approval needed (unlike Last.fm which requires partner contact for commercial use). Open data. Farcaster-aligned ethos.

- API: `POST /1/submit-listens` with user token ([docs](https://listenbrainz.readthedocs.io/))
- Effort: ~2 hours (simpler than Last.fm — token-based, no OAuth)

### Priority 3: Apple Music via MusicKit JS

**Why:** Apple Music pays the highest per-stream rate (~$0.01). Having in-app playback would actually pay ZAO artists.

- Replace `AppleMusicProvider.tsx` (currently external redirect) with MusicKit JS player
- Requires Apple Developer account + MusicKit JS token
- User must have Apple Music subscription for full playback
- Effort: ~8 hours
- [MusicKit JS docs](https://developer.apple.com/musickit/)

### Priority 4: Spotify Login Nudge

**Why:** Spotify embeds only play 30-second previews for non-logged-in users. ZAO OS should detect this and prompt members to log into Spotify.

- Check `SpotifyProvider` for preview-only playback state
- Show subtle banner: "Log into Spotify for full tracks"
- Effort: ~2 hours

### Priority 5: Play Completion Tracking

**Why:** Internal analytics. Know which tracks ZAO members actually finish vs skip.

- Already proposed in Doc 110: `track_engagement` table with `play_start`, `play_complete`, `skip` events
- Enhances respect-weighted curation (Doc 128)
- Effort: ~4 hours

## What ZAO OS Already Does Right

1. **Native embeds for top 3 platforms** — Spotify, SoundCloud, YouTube plays already count
2. **Internal play counting** — `songs.play_count` incremented via `POST /api/music/library/play`
3. **Now Playing presence** — `useNowPlaying` hook broadcasts what members listen to
4. **Trending algorithm** — Respect-weighted engagement tracking via `/api/music/trending-weighted`
5. **Songlink cross-platform links** — "Also on:" links let users jump to their preferred platform

## Architecture: Where Play Tracking Happens

```
User hits play
    │
    ├─► Platform Provider (Spotify/SC/YT iframe)
    │       └─► Platform counts the play natively ✓
    │
    ├─► HTMLAudioProvider (Audius/Sound.xyz direct URL)
    │       └─► Platform may or may not count ⚠️
    │
    ├─► POST /api/music/library/play
    │       └─► ZAO internal play_count++ ✓
    │
    ├─► [TODO] Last.fm scrobble after 30s
    │       └─► Universal external record
    │
    └─► [TODO] track_engagement event log
            └─► play_start, play_complete, skip analytics
```

## Existing Research Cross-References

| Doc | Relevance |
|-----|-----------|
| [128 — Music Player Complete Audit](../128-music-player-complete-audit/) | Canonical inventory of all 23 components, confirms play_count exists |
| [126 — Music Player Gap Analysis](../126-music-player-gap-analysis/) | Identified missing listening history UI |
| [130 — Next Music Integrations](../130-next-music-integrations/) | Last.fm scrobbling planned for Phase 4D |
| [110 — Music Discovery Feeds](../110-music-discovery-feeds/) | Proposed `track_engagement` schema |
| [112 — Audius API Deep Dive](../112-audius-api-deep-dive/) | Audius stream endpoint + `skip_play_count` param |

## Sources

- [Spotify Embed Docs](https://developer.spotify.com/documentation/embeds) — IFrame API, oEmbed, 30s preview rules
- [Spotify Stream Counting](https://support.spotify.com/us/artists/article/how-your-streams-are-counted/) — Official rules
- [Spotify Community: Embed Play Counts](https://community.spotify.com/t5/Spotify-for-Developers/Plays-and-streams-not-counted-with-Spotify-embed/td-p/5507122) — Logged-in requirement confirmed
- [SoundCloud Embedded Players](https://help.soundcloud.com/hc/en-us/articles/115003453587-Embedded-players) — Widget plays count
- [SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget) — JS control API
- [YouTube View Counting 2026](https://www.subsub.io/blog/how-does-youtube-count-views) — Embed views count with 30s rule
- [Audius Stream Track API](https://docs.audius.org/developers/api/stream-track/) — `skip_play_count` parameter
- [Audius SDK (npm)](https://www.npmjs.com/package/@audius/sdk) — JavaScript SDK
- [Apple Music Royalty Insights](https://artists.apple.com/support/1124-apple-music-insights-royalty-rate) — $0.01/stream
- [MusicKit JS](https://developer.apple.com/musickit/) — Web playback SDK
- [Last.fm API](https://www.last.fm/api) — Scrobble endpoints
- [ListenBrainz API](https://listenbrainz.readthedocs.io/) — Open-source scrobbling
- [RouteNote: Spotify Stream Rules](https://support.routenote.com/kb-article/how-does-spotify-count-a-stream/) — 30s minimum
