# 219 — Free APIs & Zero-Cost Integrations for ZAO OS

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Catalog every free API and service that ZAO OS can integrate to add features at zero cost — prioritized by relevance to a decentralized music community platform.

---

## Executive Summary

There are **30+ free APIs and services** that ZAO OS can integrate without spending a dollar. The highest-impact integrations fall into three categories:

1. **Music enrichment** — synced lyrics (LRCLIB), cross-platform links (Odesli), metadata (MusicBrainz), decentralized streaming (Audius)
2. **Community engagement** — daily quotes, QR room links, push notifications, scheduling
3. **Platform reliability** — error tracking (Sentry), uptime monitoring (UptimeRobot), privacy-first analytics (Umami)

The single highest-ROI integration is **LRCLIB** — free synced lyrics with no API key, no rate limits, and direct relevance to the music player. Second is **Audius API** — a free, decentralized music catalog with zero rate limits that aligns perfectly with ZAO's web3 ethos.

---

## Priority Matrix

| Priority | Integration | Effort | Impact |
|----------|------------|--------|--------|
| P0 | LRCLIB (synced lyrics) | Low | High |
| P0 | Audius API (decentralized music catalog) | Medium | High |
| P0 | Odesli/Songlink (cross-platform links) | Low | High |
| P0 | Sentry (error tracking) | Low | High |
| P1 | MusicBrainz (music metadata) | Medium | High |
| P1 | Web Push via OneSignal (room alerts) | Medium | High |
| P1 | UptimeRobot (uptime monitoring) | Low | Medium |
| P1 | Umami (privacy analytics) | Medium | Medium |
| P1 | Color Thief (album art colors) | Low | Medium |
| P2 | QR Server API (room links) | Low | Medium |
| P2 | CoinGecko (crypto prices) | Low | Medium |
| P2 | Zen Quotes (daily inspiration) | Low | Low |
| P2 | Cal.com (scheduled rooms) | Medium | Medium |
| P2 | Resend (transactional email) | Low | Medium |
| P3 | Web Speech API (accessibility TTS) | Low | Low |
| P3 | Dub.co (URL shortener) | Low | Low |
| P3 | Web Audio API visualizer | Medium | Medium |
| P3 | Pixazo (AI album art) | Medium | Low |

---

## Part 1: Music Enrichment APIs

### 1.1 LRCLIB — Synced Lyrics

| Field | Details |
|-------|---------|
| **What it does** | Crowdsourced database of time-synchronized lyrics (LRC format). Nearly 3 million lyrics entries. |
| **Free tier** | Completely free. No API key required. No rate limits. No registration. |
| **Rate limits** | None enforced. Just include a User-Agent header. |
| **Auth** | None |
| **Relevance to ZAO** | Direct integration with the music player. Show synced lyrics that scroll with the song. Massive engagement feature for a music community. |
| **Effort** | Low — simple REST calls: `GET /api/get?artist_name=X&track_name=Y&album_name=Z` |
| **API docs** | https://lrclib.net/docs |
| **npm packages** | `lrclib-api` |

**Why P0:** ZAO OS already has a multi-platform music player with 9 providers. Adding synced lyrics that scroll in time with playback is a marquee feature that costs nothing.

---

### 1.2 Audius API — Decentralized Music Catalog

| Field | Details |
|-------|---------|
| **What it does** | Free, open API to search and stream from Audius's catalog of 1M+ tracks at 320kbps. Metadata, playlists, user profiles, trending tracks. |
| **Free tier** | Completely free. Zero rate limits. No API key required. |
| **Rate limits** | None |
| **Auth** | None for read operations. JavaScript SDK available for deeper integration. |
| **Relevance to ZAO** | A decentralized, artist-owned music platform aligns perfectly with ZAO's web3 values. Could serve as an additional music source alongside existing 9 providers. "Log in with Audius" provides social graph crossover. |
| **Effort** | Medium — need to integrate as a 10th provider in the player, map Audius metadata to ZAO's track schema |
| **API docs** | https://docs.audius.org/ |

**Why P0:** Free, unlimited, decentralized music streaming with no licensing concerns. Perfect philosophical alignment with ZAO. Could become the default source for independent artist discovery.

---

### 1.3 Odesli / Songlink — Cross-Platform Music Links

| Field | Details |
|-------|---------|
| **What it does** | Given a music link from any platform (Spotify, Apple Music, YouTube, etc.), returns links to the same song on all other platforms. |
| **Free tier** | Free. Optional API key recommended for production. |
| **Rate limits** | 10 requests/minute without API key. Higher with key (free to obtain). |
| **Auth** | Optional API key |
| **Relevance to ZAO** | When someone shares a Spotify link in chat, auto-expand it to show links for Apple Music, YouTube, Tidal, etc. Universal music sharing for a diverse community. |
| **Effort** | Low — single endpoint: `GET https://api.song.link/v1-alpha.1/links?url={url}` |
| **API docs** | https://odesli.co/ |

**Why P0:** Directly solves the "I'm on Apple Music not Spotify" problem. Auto-enrich any music link shared in ZAO chat or proposals.

---

### 1.4 MusicBrainz — Music Metadata

| Field | Details |
|-------|---------|
| **What it does** | Open encyclopedia of music metadata: artists, releases, recordings, labels, relationships, cover art. Community-maintained, Wikipedia-scale. |
| **Free tier** | Completely free. Open data under CC licenses. |
| **Rate limits** | 1 request/second per application. Proper User-Agent gets up to 300 req/sec aggregate. |
| **Auth** | None. User-Agent header required. |
| **Relevance to ZAO** | Enrich tracks with album art, release dates, label info, related artists. Power discovery features. Cover Art Archive provides free album artwork. |
| **Effort** | Medium — comprehensive API with many endpoints. npm package `musicbrainz-api` available. |
| **API docs** | https://musicbrainz.org/doc/MusicBrainz_API |

---

### 1.5 Genius — Song Annotations & Context

| Field | Details |
|-------|---------|
| **What it does** | Song metadata, annotations, artist info. Note: lyrics are NOT available via API (only via scraping, which violates ToS). |
| **Free tier** | Free developer account. 100 API calls/month on free tier. |
| **Rate limits** | 100 calls/month (very limited) |
| **Auth** | OAuth2 access token required |
| **Relevance to ZAO** | Song context and annotation data (not lyrics). Limited free tier makes it a secondary option. |
| **Effort** | Low but limited value due to rate limits |

**Verdict:** Use LRCLIB for lyrics instead. Genius free tier is too restrictive for production use.

---

## Part 2: Community Engagement APIs

### 2.1 QR Code Generation — QR Server API

| Field | Details |
|-------|---------|
| **What it does** | Generate QR codes via URL. No signup, no API key. |
| **Free tier** | Completely free. No limits documented. |
| **Rate limits** | Reasonable use (no hard limits published) |
| **Auth** | None |
| **Relevance to ZAO** | Generate QR codes for listening room links, event pages, profile shares. Display in room UI for IRL meetups. |
| **Effort** | Very low — just an image URL: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zao.fm/rooms/xyz` |
| **API docs** | https://goqr.me/api/ |

**Alternative:** QuickChart QR API (open source, self-hostable) at https://quickchart.io/qr-code-api/

---

### 2.2 Inspirational Quotes — Zen Quotes API

| Field | Details |
|-------|---------|
| **What it does** | Random inspirational quotes with author attribution. JSON format. |
| **Free tier** | Free with attribution required. Rate-limited per IP. |
| **Rate limits** | Reasonable per-IP limits (not specified exactly) |
| **Auth** | None |
| **Relevance to ZAO** | Daily quote on the dashboard/homepage. Music-themed quotes for community inspiration. Could rotate on the /social page. |
| **Effort** | Very low — `GET https://zenquotes.io/api/random` |
| **API docs** | https://zenquotes.io/ |

**Alternatives:** Quotable API (180 req/min, more generous), DummyJSON Quotes (testing/prototyping)

---

### 2.3 GIF Reactions — Current Landscape (2026)

| Field | Details |
|-------|---------|
| **What it does** | Search and embed GIFs in chat messages. |
| **Free tier** | Complicated in 2026. Giphy now charges (~$9K/yr). Tenor closed to new developers (acquired/shut down by Google). |
| **Relevance to ZAO** | GIF reactions in chat would be fun but the free options have dried up. |
| **Recommendation** | **Skip for now.** The major free GIF APIs (Giphy, Tenor) are no longer free or accepting new devs. Consider building a custom sticker/reaction system using community-uploaded assets instead, which aligns better with ZAO's artist-owned ethos. |

---

### 2.4 Scheduling — Cal.com

| Field | Details |
|-------|---------|
| **What it does** | Open-source scheduling platform. Unlimited bookings, event types, calendar sync on free tier. |
| **Free tier** | Free for 1 user: unlimited bookings, unlimited event types, calendar sync, webhooks, 70+ integrations. Self-hostable. |
| **Rate limits** | API access included on free tier |
| **Auth** | API key |
| **Relevance to ZAO** | Schedule listening rooms, community calls, fractal meetings. Embed booking links. Replace manual Discord coordination. |
| **Effort** | Medium — need to integrate scheduling UI, sync with room creation |
| **API docs** | https://cal.com/docs |

---

## Part 3: Visual & Creative APIs

### 3.1 Color Extraction — Color Thief (Client-Side Library)

| Field | Details |
|-------|---------|
| **What it does** | Extract dominant colors and palettes from images. Runs entirely in the browser. |
| **Free tier** | Completely free. MIT license. No API calls needed. |
| **Rate limits** | None (client-side) |
| **Auth** | None |
| **Relevance to ZAO** | Extract colors from album art to dynamically theme the player UI, room backgrounds, or chat bubbles. Adaptive UI that matches the currently playing track. |
| **Effort** | Low — `npm install colorthief`, then `colorThief.getColor(img)` returns `[r, g, b]` |
| **npm** | `colorthief` |

**Why high impact:** Imagine the player background subtly shifting to match the album art's color palette. Zero API cost, pure client-side, visually stunning.

---

### 3.2 AI Image Generation — Pixazo / Stability AI

| Field | Details |
|-------|---------|
| **What it does** | Generate images from text prompts. Album art generation, event posters, profile backgrounds. |
| **Free tier** | Pixazo: free open beta, no signup. Stability AI Community License: free for orgs under $1M revenue (unlimited). |
| **Rate limits** | Pixazo: not specified. Stability AI: generous for community license. |
| **Auth** | Varies |
| **Relevance to ZAO** | Auto-generate placeholder album art for tracks without covers. Create event visuals. AI-assisted artwork for proposals. |
| **Effort** | Medium — need to design prompts, handle async generation, cache results |

**Verdict:** Nice-to-have. The community license from Stability AI is generous but adds complexity. Lower priority than music-focused integrations.

---

### 3.3 Audio Visualization — Web Audio API (Browser Native)

| Field | Details |
|-------|---------|
| **What it does** | Real-time frequency and waveform analysis for audio visualization. Built into every modern browser. |
| **Free tier** | Free forever — it is a browser API. |
| **Rate limits** | None |
| **Auth** | None |
| **Relevance to ZAO** | Equalizer visualizations, waveform displays, reactive backgrounds in listening rooms. The `AnalyserNode` provides real-time FFT data. |
| **Effort** | Medium — need to connect to the existing HTMLAudioProvider, build Canvas/WebGL visualizer components |
| **Docs** | https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API |

**Note:** ZAO OS already uses Web Audio API for binaural beats (`BinauralBeats.tsx`). Extending to visualizations is a natural next step.

---

## Part 4: Utility APIs

### 4.1 Crypto Prices — CoinGecko

| Field | Details |
|-------|---------|
| **What it does** | Real-time and historical cryptocurrency prices, market data, token info. |
| **Free tier** | Demo API: 30 calls/min, 10,000 calls/month. Public (no key): 5-15 calls/min. |
| **Auth** | Optional API key for stable limits |
| **Relevance to ZAO** | Display RESPECT token value, ETH/USDC prices for tipping, AUDIO token price, NFT floor prices. Show USD equivalents in governance proposals. |
| **Effort** | Low — simple REST API with npm wrappers available |
| **API docs** | https://docs.coingecko.com/ |

---

### 4.2 URL Shortener — Dub.co

| Field | Details |
|-------|---------|
| **What it does** | Modern, open-source URL shortener with analytics, QR codes, UTM templates. |
| **Free tier** | 25 links/month, 1,000 events, 30-day retention, 3 custom domains, API access. No credit card. |
| **Rate limits** | Included with free tier |
| **Auth** | API key |
| **Relevance to ZAO** | Clean share links for rooms, proposals, events. Built-in QR codes. Track click-through on shared content. |
| **Effort** | Low |
| **API docs** | https://dub.co/docs |

**Note:** 25 links/month may be limiting. Consider combining with QR Server API (unlimited) for QR-specific needs.

---

### 4.3 Transactional Email — Resend

| Field | Details |
|-------|---------|
| **What it does** | Send transactional emails with React Email templates. Modern developer experience. |
| **Free tier** | 3,000 emails/month, 100/day limit. No credit card. |
| **Auth** | API key |
| **Relevance to ZAO** | Welcome emails, proposal notifications, weekly digests, room invites. React Email templates match the component-based approach. |
| **Effort** | Low — excellent TypeScript SDK, React Email for templates |
| **API docs** | https://resend.com/docs |

**Alternative:** Postmark (100 emails/month free, best deliverability)

---

### 4.4 Weather — OpenWeatherMap / Open-Meteo

| Field | Details |
|-------|---------|
| **What it does** | Current weather, forecasts, location-based weather data. |
| **Free tier** | OpenWeatherMap: 1,000,000 calls/month free. Open-Meteo: completely free, open source, no API key. |
| **Rate limits** | OWM: 60 calls/min. Open-Meteo: generous, no key needed. |
| **Auth** | OWM: API key. Open-Meteo: none. |
| **Relevance to ZAO** | Mood-based music recommendations ("rainy day playlist", "sunny vibes"). Ambient atmosphere in listening rooms. Creative but lower priority. |
| **Effort** | Low for API call, Medium for mood-mapping logic |

**Creative use case:** "It's raining in 4 members' cities right now — here's a rainy day mix" as a community feature.

---

## Part 5: Push Notifications & Communication

### 5.1 Web Push — OneSignal

| Field | Details |
|-------|---------|
| **What it does** | Cross-platform push notifications (web, mobile, email). |
| **Free tier** | Unlimited mobile push, 10,000 web push, 10,000 emails. Segmentation and A/B testing included. |
| **Auth** | API key + app ID |
| **Relevance to ZAO** | "Room is live!" alerts, proposal voting reminders, new music notifications, fractal meeting reminders. Critical for engagement. |
| **Effort** | Medium — service worker integration, notification permission flow, segment management |
| **API docs** | https://documentation.onesignal.com/ |

**Alternative:** Firebase Cloud Messaging (completely free for core messaging, but less feature-rich dashboard)

**Why P1:** Push notifications are the single biggest driver of return visits. 10,000 free web pushes covers ZAO's current community size many times over.

---

## Part 6: Platform Reliability & Observability

### 6.1 Error Tracking — Sentry

| Field | Details |
|-------|---------|
| **What it does** | Real-time error tracking, performance monitoring, session replays. |
| **Free tier** | 5,000 errors/month, 10,000 performance units, 50 session replays. 1 user. Free forever. |
| **Auth** | DSN key |
| **Relevance to ZAO** | Catch client-side errors (player failures, wallet connection issues, XMTP errors) before users report them. Source maps for meaningful stack traces. |
| **Effort** | Low — `npm install @sentry/nextjs`, run setup wizard, done |
| **API docs** | https://docs.sentry.io/ |

**Why P0:** Every production app needs error tracking. The Next.js integration is a 10-minute setup. 5,000 errors/month is more than enough for ZAO's scale.

---

### 6.2 Uptime Monitoring — UptimeRobot

| Field | Details |
|-------|---------|
| **What it does** | Monitor website/API uptime with alerts. |
| **Free tier** | 50 monitors, 5-minute check intervals, 3-month log retention. Email alerts. |
| **Auth** | Account (free signup) |
| **Relevance to ZAO** | Monitor the main site, API routes, Supabase, Neynar endpoints. Get alerted before users complain. Public status page. |
| **Effort** | Very low — web dashboard setup, no code needed |
| **URL** | https://uptimerobot.com/ |

**Alternative:** Better Stack (10 monitors, 3-minute checks, incident management, on-call scheduling — free)

---

### 6.3 Analytics — Umami

| Field | Details |
|-------|---------|
| **What it does** | Privacy-first web analytics. Cookie-free, GDPR compliant, lightweight (~2KB script). |
| **Free tier** | Self-hosted: completely free (MIT license). Cloud: 1M events/month free. |
| **Auth** | Self-hosted or cloud account |
| **Relevance to ZAO** | Track page views, events, user journeys without invasive tracking. Aligns with ZAO's privacy-respecting ethos. Built with Next.js (same stack). |
| **Effort** | Medium — self-host on existing infra or use cloud free tier. Dashboard setup. |
| **URL** | https://umami.is/ |

**Why Umami over Plausible:** Free cloud tier (Plausible has none), MIT license (Plausible is AGPL), same tech stack (Next.js + PostgreSQL), city-level geo data when self-hosted.

---

## Part 7: Accessibility & Internationalization

### 7.1 Text-to-Speech — Web Speech API (Browser Native)

| Field | Details |
|-------|---------|
| **What it does** | Convert text to speech using the browser's built-in speech synthesis. |
| **Free tier** | Free forever — browser API, no external calls. |
| **Rate limits** | None |
| **Auth** | None |
| **Relevance to ZAO** | Read proposals aloud, announce room events, accessibility for visually impaired members. "Read this proposal to me" button. |
| **Effort** | Low — `speechSynthesis.speak(new SpeechSynthesisUtterance(text))` |
| **Docs** | https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis |

**Note:** Quality varies by browser/OS. Good enough for accessibility, not for production voice features.

---

## Part 8: Farcaster Ecosystem (Already Partially Integrated)

### 8.1 Neynar — Farcaster Infrastructure

| Field | Details |
|-------|---------|
| **What it does** | Full Farcaster API: casts, users, channels, reactions, frames, webhooks. |
| **Free tier** | Free tier now available (recently added). Exact limits vary. |
| **Relevance to ZAO** | Already integrated. Monitor free tier limits and optimize API calls. Consider x402 protocol for pay-per-call beyond free tier. |
| **Status** | Already in use |

### 8.2 Farcaster Frames

| Field | Details |
|-------|---------|
| **What it does** | Interactive mini-apps embedded in Farcaster casts. |
| **Free tier** | Free to build and deploy. The Frames spec is open. |
| **Relevance to ZAO** | Build ZAO Frames: "Listen to this track", "Vote on this proposal", "Join this room". Viral distribution within Farcaster. |
| **Effort** | Medium — Frog framework available, Neynar Frame Studio for no-code |

### 8.3 Farcaster Hubs (Snapchain)

| Field | Details |
|-------|---------|
| **What it does** | Direct access to Farcaster's decentralized data layer. All casts, reactions, user data. |
| **Free tier** | Free and open. Run your own hub or query public hubs. |
| **Relevance to ZAO** | Reduce Neynar dependency for read operations. Direct protocol access. |
| **Effort** | High — requires running infrastructure or connecting to public hubs |

---

## Part 9: Real-Time Collaboration

### 9.1 PartyKit (Cloudflare)

| Field | Details |
|-------|---------|
| **What it does** | Real-time multiplayer infrastructure. WebSocket rooms, state synchronization. Now part of Cloudflare. |
| **Free tier** | Free for cloud-prem deployments on your own Cloudflare account. Pay only for Cloudflare resource usage (generous free tier). |
| **Auth** | Cloudflare account |
| **Relevance to ZAO** | Real-time features: collaborative playlists, live room chat presence, shared listening state, "who's listening now" indicators. |
| **Effort** | Medium-High — new infrastructure dependency, state management design |

### 9.2 Liveblocks

| Field | Details |
|-------|---------|
| **What it does** | Real-time collaboration infrastructure: presence, cursors, conflict-free data types. |
| **Free tier** | 500 monthly active rooms. First-day-free billing (users who don't return aren't charged). |
| **Auth** | API key |
| **Relevance to ZAO** | Collaborative governance editing, shared playlist curation, real-time proposal drafting. |
| **Effort** | Medium — good React hooks, but adds vendor dependency |

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks)
Zero-to-low code changes, immediate value.

| Integration | Time | Notes |
|------------|------|-------|
| Sentry error tracking | 2 hours | `npx @sentry/wizard@latest -i nextjs` |
| UptimeRobot monitoring | 30 min | Web dashboard, no code |
| QR Server for room links | 2 hours | Just an image URL in room share UI |
| Zen Quotes on dashboard | 1 hour | Single API call on page load |

### Phase 2: Music Features (2-4 weeks)
The features that make ZAO OS special.

| Integration | Time | Notes |
|------------|------|-------|
| LRCLIB synced lyrics | 1 week | New LyricsPanel component, sync with player time |
| Odesli link expansion | 3 days | Chat message enrichment, auto-detect music URLs |
| Color Thief adaptive UI | 3 days | Extract palette from album art, apply to player theme |
| MusicBrainz metadata enrichment | 1 week | Fill gaps in track metadata, album art from Cover Art Archive |

### Phase 3: Engagement & Growth (3-6 weeks)
Features that bring users back.

| Integration | Time | Notes |
|------------|------|-------|
| OneSignal web push | 2 weeks | Service worker, permission flow, room-live triggers |
| Umami analytics | 1 week | Self-host or cloud, event tracking for key flows |
| CoinGecko price display | 3 days | Token prices in governance/tipping UI |
| Resend transactional email | 1 week | Welcome, digest, notification emails |

### Phase 4: Advanced (6+ weeks)
Bigger bets for when the foundation is solid.

| Integration | Time | Notes |
|------------|------|-------|
| Audius as 10th provider | 3 weeks | Full provider integration, search, streaming |
| Cal.com room scheduling | 2 weeks | Scheduling UI, calendar sync, room auto-creation |
| Web Audio visualizer | 2 weeks | Canvas-based equalizer/waveform in player |
| Farcaster Frames | 2 weeks | "Listen on ZAO" and "Vote" frames |

---

## Cost Summary

| Integration | Monthly Cost | Notes |
|------------|-------------|-------|
| LRCLIB | $0 | No limits |
| Audius API | $0 | No limits |
| Odesli | $0 | 10 req/min without key |
| MusicBrainz | $0 | 1 req/sec |
| QR Server | $0 | No limits |
| Zen Quotes | $0 | Attribution required |
| Color Thief | $0 | Client-side only |
| Web Audio API | $0 | Browser native |
| Web Speech API | $0 | Browser native |
| Sentry | $0 | 5K errors/month |
| UptimeRobot | $0 | 50 monitors |
| Umami Cloud | $0 | 1M events/month |
| OneSignal | $0 | 10K web push/month |
| CoinGecko | $0 | 10K calls/month |
| Resend | $0 | 3K emails/month |
| Dub.co | $0 | 25 links/month |
| Cal.com | $0 | Unlimited bookings |
| Open-Meteo | $0 | No limits |
| PartyKit | $0* | *Cloudflare resource costs apply |
| Liveblocks | $0 | 500 active rooms/month |
| **Total** | **$0** | |

---

## What NOT to Integrate (and Why)

| Service | Reason to Skip |
|---------|---------------|
| **Giphy API** | No longer free (~$9K/yr). Dead for indie devs. |
| **Tenor API** | Closed to new developers as of Jan 2026. |
| **Genius for lyrics** | 100 calls/month limit is unusable. Lyrics require scraping (ToS violation). Use LRCLIB instead. |
| **Musixmatch official API** | Restrictive licensing. Community workarounds violate ToS. Use LRCLIB instead. |
| **Google Analytics** | Privacy concerns. Umami is better aligned with ZAO values. |
| **Bitly** | Only 10 links/month on free tier. Dub.co is more generous and open source. |

---

## Key Takeaways

1. **Music-first:** LRCLIB + Odesli + MusicBrainz + Audius give ZAO a music enrichment layer rivaling Spotify's, at zero cost.
2. **Browser APIs are underrated:** Web Audio (visualizer), Web Speech (TTS), and Color Thief (palette extraction) are free, private, and require no external calls.
3. **Reliability stack is free:** Sentry + UptimeRobot + Umami give production-grade observability for $0.
4. **GIF era is over for free devs:** Both Giphy and Tenor are no longer free. Build community-owned reactions instead.
5. **Push notifications are the engagement unlock:** OneSignal's free tier is generous enough for ZAO's scale and drives return visits.
6. **Farcaster ecosystem is free by design:** Frames, Hubs, and protocol access cost nothing. Build more Frames.

---

## Sources

- [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)
- [MusicBrainz Rate Limiting](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting)
- [Odesli/Songlink](https://odesli.co/)
- [LRCLIB API Docs](https://lrclib.net/docs)
- [Audius Developer Docs](https://docs.audius.org/)
- [Genius API](https://publicapis.io/genius-api)
- [QR Server API](https://goqr.me/api/)
- [QuickChart QR Code API](https://quickchart.io/qr-code-api/)
- [Zen Quotes](https://zenquotes.io/)
- [Giphy Pricing Changes](https://dev.to/giorgi_khachidze_ab9ac4ad/giphys-gif-api-is-no-longer-free-heres-what-you-need-to-know-l7h)
- [Tenor API Shutdown 2026](https://digitalbiztalk.com/article/google-shuts-down-tenor-api-what-developers-need-to-know-in-2026)
- [CoinGecko API Pricing](https://www.coingecko.com/en/api/pricing)
- [OpenWeatherMap Pricing](https://openweathermap.org/price)
- [Open-Meteo](https://open-meteo.com/)
- [Dub.co Pricing](https://dub.co/pricing)
- [OneSignal Pricing](https://onesignal.com/pricing)
- [Firebase Cloud Messaging](https://firebase.google.com/products/cloud-messaging)
- [Cal.com](https://cal.com/)
- [Color Thief](https://lokeshdhakar.com/projects/color-thief/)
- [Pixazo Free APIs](https://www.pixazo.ai/api/free)
- [Stability AI](https://platform.stability.ai/pricing)
- [Web Speech API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Web Audio API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Sentry Pricing](https://sentry.io/pricing/)
- [UptimeRobot Pricing](https://uptimerobot.com/pricing/)
- [Better Stack Uptime](https://betterstack.com/uptime)
- [Umami Analytics](https://umami.is/)
- [Umami vs Plausible 2026](https://blog.canadianwebhosting.com/plausible-vs-umami-self-hosted-analytics-2026/)
- [Resend Pricing](https://resend.com/pricing)
- [Liveblocks Pricing](https://liveblocks.io/pricing)
- [PartyKit / Cloudflare](https://blog.partykit.io/posts/partykit-is-joining-cloudflare/)
- [Neynar Documentation](https://docs.neynar.com/)
- [wavesurfer.js](https://wavesurfer.xyz/)
