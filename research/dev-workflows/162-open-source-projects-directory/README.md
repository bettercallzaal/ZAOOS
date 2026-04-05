# 162 — Open Source Projects Directory for ZAO OS

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Catalog open source projects and APIs from opensourceprojects.dev and similar directories that ZAO OS can integrate or learn from

## Key Recommendations

| Priority | Project | Action | Why |
|----------|---------|--------|-----|
| P0 | Sonata | Study codebase | Music-focused Farcaster client with identical stack (Next.js + Supabase + Tailwind + Neynar). MIT license. Direct reference for ZAO OS music/social features |
| P0 | Audius API | Integrate | Free REST API for the largest open music catalog. Could power music discovery, artist pages, and streaming in ZAO OS without licensing issues |
| P0 | Herocast | Study codebase | Power-user Farcaster client (Next.js + Supabase + Tailwind). Multi-account management, scheduled posts, analytics. AGPL license (study only, do not copy) |
| P1 | Farcaster Indexer | Evaluate | Save all Farcaster protocol data to Postgres — could replace or supplement Neynar caching in Supabase |
| P1 | FarcasterKit | Integrate | React hooks for Farcaster apps — could simplify ZAO OS client-side Farcaster code |
| P1 | Funkwhale | Evaluate for DJ rooms | Self-hosted music server with federation (ActivityPub), API v2, social listening. Could back ZAO OS listening rooms |
| P1 | Umami | Deploy | Privacy-focused analytics (Next.js + PostgreSQL). Drop-in replacement for any analytics ZAO OS needs. MIT license |
| P2 | Mixpost | Evaluate | Self-hosted social media scheduler (MIT). Could inform ZAO OS cross-posting to Farcaster/Bluesky/X |
| P2 | Navidrome | Evaluate | Lightweight music server with Subsonic API. Good for self-hosted community music library |
| P2 | Frames.js / Frog | Integrate | SDKs for building Farcaster Frames — enable ZAO OS to create interactive mini-apps |
| P3 | Agent-Reach | Utility | AI agent web content extraction — useful for automated research/content curation features |
| P3 | Fluxer | Reference | Self-hosted community messaging — design patterns for ZAO OS community chat |

## Detailed Findings

---

### Direct Integrations (APIs/Services)

#### 1. Audius REST API
- **URL:** https://docs.audius.org/api/
- **GitHub:** https://github.com/audiusproject
- **What it does:** Decentralized music streaming platform with a free, public REST API providing access to the largest open music catalog on the internet. Artists upload directly; no licensing middleman.
- **ZAO OS application:** ZAO OS could query the Audius API to power music discovery, pull artist profiles, stream tracks in listening rooms, and surface music from ZAO community members who also publish on Audius. The API requires no authentication for read operations and returns JSON — trivial to call from Next.js API routes.
- **API keys/services:** Free API access, no key required for basic endpoints. SDK available.
- **License:** Apache 2.0
- **Grants:** Audius Grants Program reopened Q1 2025 — ZAO OS could apply for funding as an integration partner.

#### 2. FarcasterKit (React Hooks)
- **URL:** https://github.com/dylsteck/farcasterkit
- **What it does:** React hooks library for building Farcaster applications — simplifies feed fetching, user data, cast creation, and engagement actions.
- **ZAO OS application:** Could replace custom hooks in ZAO OS that currently wrap Neynar calls. Provides standardized patterns for Farcaster data access in React 19.
- **API keys/services:** Uses your existing Neynar/Hub credentials.
- **License:** Open source (check repo for specific license)

#### 3. react-farcaster-embed
- **URL:** https://github.com/pugson/react-farcaster-embed
- **What it does:** React component for displaying embedded Farcaster casts with Next.js SSR support.
- **ZAO OS application:** Drop-in component for rendering cast embeds in the ZAO OS feed, governance proposals, and social pages. Supports server-side rendering which aligns with ZAO OS's Next.js App Router architecture.
- **License:** Open source

#### 4. Frames.js
- **URL:** https://framesjs.org/ | https://github.com/framesjs/frames.js
- **What it does:** Framework for building Farcaster Frames (interactive mini-apps that render inside Farcaster clients).
- **ZAO OS application:** ZAO OS could publish Frames that let users vote on governance proposals, preview music, or interact with community content directly within Warpcast/other clients. Drives engagement back to ZAO OS.
- **License:** Open source

#### 5. Frog (by wevm)
- **URL:** https://github.com/wevm/frog
- **What it does:** Another framework for Farcaster Frames, from the team behind Wagmi/Viem (which ZAO OS already uses).
- **ZAO OS application:** Since ZAO OS already depends on Wagmi/Viem, Frog would be the most natural Frames framework — consistent patterns, same maintainers. Could build music-sharing frames, voting frames, respect token frames.
- **License:** Open source

#### 6. Pinata FDK (Farcaster Development Kit)
- **URL:** https://github.com/PinataCloud/pinata-fdk
- **What it does:** Farcaster Development Kit from Pinata — tools for building Farcaster applications including frame validation, IPFS pinning for cast media.
- **ZAO OS application:** Could handle media uploads (album art, audio files) to IPFS via Pinata, plus Farcaster frame development.
- **License:** Open source

#### 7. Umami Analytics
- **URL:** https://github.com/umami-software/umami
- **What it does:** Privacy-focused, cookie-free web analytics. Next.js frontend, PostgreSQL backend, ~2KB tracking script.
- **ZAO OS application:** Drop-in analytics for ZAO OS that respects member privacy. Same tech stack (Next.js + PostgreSQL). Self-hostable or cloud option at umami.is. GDPR compliant — important for a community tool.
- **Stars:** 27,000+
- **License:** MIT

---

### Reference Implementations

#### 8. Sonata (Music + Farcaster Client) -- HIGHEST PRIORITY REFERENCE
- **URL:** https://github.com/Coop-Records/sonata | Live: https://sonata.tips
- **What it does:** Music-focused Farcaster client supporting Spotify, SoundCloud, and Sound.xyz. Users share and discover music on the Farcaster network.
- **ZAO OS application:** **Near-identical tech stack** — Next.js, Supabase (PostgreSQL), Tailwind CSS, TypeScript, Vercel deployment. This is the single most relevant reference codebase for ZAO OS. Study its music embedding patterns, Farcaster integration architecture, Supabase schema design, and multi-platform music source handling.
- **Stars:** 8 | **Commits:** 1,539 (very active)
- **License:** MIT (can freely borrow patterns and code)

#### 9. Herocast (Power User Farcaster Client)
- **URL:** https://github.com/hero-org/herocast
- **What it does:** Desktop + web Farcaster client with multi-account management, scheduled posting, engagement analytics. Keyboard-first power-user design.
- **ZAO OS application:** Study its Supabase integration patterns, Sentry error tracking setup, multi-account management, and post scheduling logic. Its analytics-without-tracking approach aligns with ZAO OS values. **Note AGPL license — study but do not copy code directly.**
- **Stars:** 89 | **Commits:** 698
- **Tech:** Next.js, TypeScript, Supabase, Tailwind CSS, pnpm
- **License:** AGPL v3 (copyleft — derivative works must also be AGPL)

#### 10. Opencast (Twitter-style Farcaster Client) -- ARCHIVED
- **URL:** https://github.com/stephancill/opencast
- **What it does:** Fully open source, self-hostable Twitter-flavored Farcaster client. Feeds, profiles, casts, engagement actions, notifications, channels.
- **ZAO OS application:** Reference for building a full Farcaster social experience. Uses Prisma ORM (ZAO OS uses raw Supabase, but the data models are instructive). Archived August 2025 but code remains available.
- **Stars:** 193 | **Commits:** 428
- **Tech:** Next.js, TypeScript, Prisma, Tailwind CSS, Docker
- **License:** MIT

#### 11. Farcaster Indexer
- **URL:** https://github.com/gskril/farcaster-indexer
- **What it does:** Saves all Farcaster protocol data to PostgreSQL. Direct hub connection for real-time indexing.
- **ZAO OS application:** Could supplement or replace Neynar-cached data in Supabase. Run your own indexer to have full control over Farcaster data without API rate limits. Particularly useful for ZAO OS governance (tracking proposal casts) and social features.
- **License:** Open source

#### 12. Farcaster Hub Feeds
- **URL:** https://github.com/gskril/farcaster-hub-feeds
- **What it does:** Generates RSS, Atom, and JSON feeds from Farcaster Hub data.
- **ZAO OS application:** Could power RSS feeds of ZAO community casts, enabling members to follow ZAO activity outside the app. Also useful for cross-posting workflows.
- **License:** Open source

#### 13. Fluxer (Community Messaging)
- **URL:** https://github.com/fluxerapp/fluxer
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/2a63b80e-ed58-4245-af81-c4c18dd42924
- **What it does:** Self-hosted messaging platform for friend groups and communities. Persistent group conversations, privacy-focused.
- **ZAO OS application:** Design reference for ZAO OS's community chat features alongside XMTP private messaging. Study its community-focused UX patterns — how it handles groups, channels, and persistent conversations.
- **License:** Open source

#### 14. Mixpost (Social Media Scheduler)
- **URL:** https://github.com/inovector/mixpost
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/1943572273677373810
- **What it does:** Self-hosted social media scheduler. Schedule posts to Twitter/X, Facebook, Mastodon, LinkedIn. Content management with media uploads.
- **ZAO OS application:** Reference for ZAO OS's cross-platform publishing system (`src/lib/publish/`). Study its multi-platform content normalization, scheduling queue, and media handling. ZAO OS already publishes to Farcaster + Bluesky + X — Mixpost's patterns could improve that pipeline.
- **Stars:** 2,000+
- **Tech:** PHP/Laravel (different stack, but architecture patterns transfer)
- **License:** MIT

#### 15. Botcaster (Farcaster Bot Framework)
- **URL:** https://github.com/BigWhaleLabs/botcaster
- **What it does:** Framework for building Farcaster bots.
- **ZAO OS application:** Could power automated ZAO community bots — welcome messages for new members, governance notifications, music drop announcements, respect token updates.
- **License:** Open source

#### 16. Searchcaster
- **URL:** https://github.com/gskril/searchcaster
- **What it does:** Search casts and profiles on the Farcaster protocol.
- **ZAO OS application:** Reference for implementing search within ZAO OS's Farcaster feed. Could study its indexing and query patterns.
- **License:** Open source

---

### Tools & Infrastructure

#### 17. Tau (Self-hosted PaaS)
- **URL:** https://github.com/taubyte/tau
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/1952985220002799643
- **What it does:** Self-hosted Vercel/Netlify alternative. Git-based deployments, serverless functions (WebAssembly), distributed P2P edge networking.
- **ZAO OS application:** If ZAO OS ever needs to move off Vercel (cost, decentralization goals), Tau provides a self-hosted alternative with the same push-to-deploy workflow. The P2P networking aligns with ZAO's decentralization ethos.
- **Stars:** 4,200+
- **License:** BSD-3-Clause

#### 18. Onchain Helm Charts
- **URL:** https://github.com/dtechvision/onchain-helmcharts
- **What it does:** Kubernetes Helm Charts for Farcaster infrastructure (Hubs, indexers).
- **ZAO OS application:** If ZAO OS scales to running its own Farcaster Hub, these charts simplify deployment on Kubernetes.
- **License:** Open source

#### 19. Clear Wallet
- **URL:** https://github.com/andrei0x309/clear-wallet
- **What it does:** FOSS browser wallet supporting Warpcast login and Sign In With Farcaster (SIWF).
- **ZAO OS application:** Reference for ZAO OS's auth flow. Study its SIWF implementation patterns alongside ZAO OS's existing iron-session + SIWE auth.
- **License:** Open source

#### 20. Farcaster Registration Tool
- **URL:** https://github.com/gskril/farcaster-registration
- **What it does:** Tool for gifting Farcaster accounts.
- **ZAO OS application:** Could enable ZAO OS admins to onboard new community members by gifting them Farcaster accounts directly, reducing friction for artists who are not yet on Farcaster.
- **License:** Open source

#### 21. Agent-Reach
- **URL:** https://github.com/Panniantong/Agent-Reach
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/98258f76-86c9-4980-9616-b5ad00cb6df4
- **What it does:** Python tool for AI agents to fetch and extract clean, readable content from URLs. Strips ads/clutter, outputs LLM-optimized text. No API costs.
- **ZAO OS application:** Could power automated content curation — an AI agent that monitors music blogs, artist announcements, and web3 music news to surface relevant content to the ZAO community. Also useful for the research pipeline.
- **License:** Not specified (check repo)

---

### Music-Specific

#### 22. Funkwhale (Self-hosted Music Server + Federation)
- **URL:** https://funkwhale.audio/ | https://docs.funkwhale.audio/
- **What it does:** Self-hosted music streaming and sharing platform with ActivityPub federation. Users upload music, create playlists, follow others, and share across the Fediverse. Version 2.0 (March 2026) brings new API v2, ListenBrainz sync, and multi-artist support.
- **ZAO OS application:** Could serve as the backend for ZAO OS listening rooms and DJ spaces. Artists upload tracks to a ZAO Funkwhale instance; the API v2 feeds the ZAO OS player. Federation means ZAO music could be discoverable across the Fediverse. Supports podcasts and internet radio — aligns with ZAO's music-first identity.
- **License:** AGPL v3

#### 23. Navidrome (Lightweight Music Server)
- **URL:** https://github.com/navidrome/navidrome | https://navidrome.org
- **What it does:** Lightweight, fast (written in Go) self-hosted music streaming server. Subsonic API compatible, meaning any Subsonic client app works with it. Supports MP3, FLAC, OGG, AAC. Transcoding via FFmpeg. Only 30-50MB RAM idle.
- **ZAO OS application:** Simpler alternative to Funkwhale for hosting a ZAO community music library. The Subsonic API is well-documented and widely supported. Could back the ZAO OS multi-provider player — adding "ZAO Library" as a 10th provider alongside Spotify, SoundCloud, etc.
- **Stars:** 13,000+
- **License:** GPL v3

#### 24. Nuclear (Desktop Music Aggregator)
- **URL:** https://github.com/nukeop/nuclear
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/b67cef2f-4411-4518-801b-60261e8ed35b
- **What it does:** Desktop app that aggregates free music from multiple public sources. Plugin-based architecture for music sources. Lyrics, downloads, radio modes, playlists.
- **ZAO OS application:** Study its plugin-based music source architecture. ZAO OS's multi-provider player (9 providers) could adopt a similar plugin pattern for cleaner extensibility. Nuclear's approach to aggregating disparate APIs into a unified playback experience is directly relevant.
- **Tech:** Electron
- **License:** AGPL v3

#### 25. SimpMusic (YouTube + Spotify Unified Player)
- **URL:** https://github.com/maxrave-dev/SimpMusic
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/6e68be24-b3aa-4d77-82ab-460e1756ded1
- **What it does:** Unifies YouTube and Spotify into one music interface. Searches both, creates mixed playlists, consistent player UX.
- **ZAO OS application:** Reference for ZAO OS's multi-source music player. Study how it normalizes track data models across YouTube and Spotify APIs into a single unified format — directly applicable to ZAO OS's 9-provider player.
- **License:** Not specified

#### 26. Beets (Music Library Manager)
- **URL:** https://github.com/beetbox/beets
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/1964560403121496125
- **What it does:** Python CLI for music library management. Auto-corrects metadata via MusicBrainz, organizes files, fetches album art, handles duplicates. Extensive plugin ecosystem.
- **ZAO OS application:** Backend utility for curating the ZAO community music library. Ensure consistent metadata, proper tagging, and organized storage for any self-hosted music collection. The MusicBrainz integration provides canonical music data.
- **License:** MIT

#### 27. Spotube (Lightweight Spotify Client)
- **URL:** https://github.com/KRTirtho/spotube
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/b59d14f5-31c0-4891-af46-f439a3cbf260
- **What it does:** Open source Spotify client that uses YouTube Music for actual audio streaming. Cross-platform via Flutter.
- **ZAO OS application:** Study its approach to using Spotify metadata with YouTube audio — a pattern ZAO OS could adopt to bypass Spotify streaming restrictions while maintaining catalog access.
- **License:** Not specified

#### 28. Vibe Music (Self-hosted Web Music Player)
- **URL:** https://github.com/vibe-music/vibe-music-web | https://vibemusic.app
- **opensourceprojects.dev:** https://www.opensourceprojects.dev/post/5f551ce6-5511-45f6-9d86-78eabb826a19
- **What it does:** Self-hosted web-based music player. TypeScript, React, Vite. Browse, search, playlist creation for personal collections.
- **ZAO OS application:** Closest web-based music player reference to ZAO OS's own player. Study its React-based player UI patterns, playlist management, and responsive design.
- **Tech:** TypeScript, React, Vite
- **License:** Not specified

#### 29. Audiopium (Audio NFT Platform)
- **URL:** https://github.com/NaveenMarasinghe/audiopium
- **What it does:** Audio NFT platform built with React, Solidity, Hardhat, NFT.storage, Moralis. Fans mint ERC-1155 NFTs with audio metadata.
- **ZAO OS application:** Reference for any future ZAO music NFT features. The ERC-1155 approach (multiple editions of the same audio) fits ZAO's community model better than 1-of-1 NFTs. Study its audio metadata embedding in NFT contracts.
- **License:** Not specified

---

## The Original Post

The specific post at https://www.opensourceprojects.dev/post/98258f76-86c9-4980-9616-b5ad00cb6df4 features **Agent-Reach**, a Python tool by @Panniantong that enables AI agents to fetch and extract clean, readable content from URLs without expensive API calls. It acts as a "vision module" for AI agents — stripping ads, navigation, and clutter to return human-readable text optimized for LLM context windows.

**Relevance to ZAO OS:** Moderate. Agent-Reach could power automated content curation features — an AI agent monitoring music blogs, artist announcements, and web3 music news to surface relevant content to the ZAO community. It could also enhance the research pipeline (the `/zao-research` skill) by providing cleaner web content extraction. However, it is a Python tool, so integration would require a separate microservice or serverless function rather than direct inclusion in the Next.js app.

**Posted:** March 28, 2026 | **Views:** 2,377

---

## Open Source Project Directories

Beyond opensourceprojects.dev, these directories are useful for discovering tools relevant to ZAO OS:

| Directory | URL | Best For |
|-----------|-----|----------|
| opensourceprojects.dev | https://opensourceprojects.dev | Curated GitHub project discovery, trending repos |
| awesome-farcaster-dev | https://github.com/FTCHD/awesome-farcaster-dev | **Most relevant** — comprehensive Farcaster tools/libs/clients list |
| awesome-farcaster (a16z) | https://github.com/a16z/awesome-farcaster | Broader Farcaster ecosystem (clients, tools, communities) |
| awesome-frames | https://github.com/davidfurlong/awesome-frames | Farcaster Frames resources specifically |
| Open Source Alternative | https://opensourcealternative.to | Find OSS alternatives to proprietary tools (500+ projects) |
| OpenAlternative | https://openalternative.co | Similar — curated OSS alternatives |
| GitHub Topics: farcaster | https://github.com/topics/farcaster | All Farcaster-tagged repos on GitHub |
| GitHub Topics: music-nft | https://github.com/topics/music-nft | Music NFT projects |
| dTech Farcaster Docs | https://dtech.vision/farcaster | Zero-to-hero Farcaster developer guides |

---

## Sources

- https://www.opensourceprojects.dev/post/98258f76-86c9-4980-9616-b5ad00cb6df4 (Agent-Reach)
- https://www.opensourceprojects.dev/post/2a63b80e-ed58-4245-af81-c4c18dd42924 (Fluxer)
- https://www.opensourceprojects.dev/post/b67cef2f-4411-4518-801b-60261e8ed35b (Nuclear)
- https://www.opensourceprojects.dev/post/6e68be24-b3aa-4d77-82ab-460e1756ded1 (SimpMusic)
- https://www.opensourceprojects.dev/post/6e5313f1-132c-4777-b876-a22133cf03a9 (Solara)
- https://www.opensourceprojects.dev/post/5f551ce6-5511-45f6-9d86-78eabb826a19 (Vibe Music)
- https://www.opensourceprojects.dev/post/1964560403121496125 (Beets)
- https://www.opensourceprojects.dev/post/b59d14f5-31c0-4891-af46-f439a3cbf260 (Spotube)
- https://www.opensourceprojects.dev/post/1943572273677373810 (Mixpost)
- https://www.opensourceprojects.dev/post/1952985220002799643 (Tau)
- https://www.opensourceprojects.dev/post/1954033518214070317 (Umami)
- https://github.com/FTCHD/awesome-farcaster-dev (Farcaster dev tools index)
- https://github.com/a16z/awesome-farcaster (Farcaster ecosystem index)
- https://github.com/Coop-Records/sonata (Sonata)
- https://github.com/hero-org/herocast (Herocast)
- https://github.com/stephancill/opencast (Opencast)
- https://github.com/audiusproject (Audius)
- https://docs.audius.org/api/ (Audius API)
- https://funkwhale.audio/ (Funkwhale)
- https://navidrome.org (Navidrome)
- https://github.com/umami-software/umami (Umami)
- https://opensourcealternative.to (Open Source Alternative directory)
- https://openalternative.co (OpenAlternative directory)
