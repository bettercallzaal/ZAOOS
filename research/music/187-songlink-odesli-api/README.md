---
topic: music
type: research-complete
status: research-complete
last-validated: 2026-05-21
original-query: "Songlink Odesli API universal music links 2026 (reconstructed)"
tier: STANDARD
re-fetch-status: "[PARTIAL] - API confirmed free, 10 req/min limit, npm package odesli.js confirmed. Audius support NOT confirmed in 2026 web search. Platforms include 20+ major services but Audius not explicitly listed."
---

# 187 — Songlink/Odesli API for Universal Music Links

> **Status:** Research complete
> **Date:** March 22, 2026
> **Goal:** Integrate Songlink/Odesli to auto-resolve music links across platforms when shared in ZAO OS chat

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **API** | Songlink/Odesli v1-alpha.1 — free, no auth needed, 20+ platforms (Audius support unconfirmed 2026) |
| **Rate limit** | 10 req/min free, cache in Supabase `music_link_cache` table (7-day TTL) |
| **npm package** | `odesli.js` (TypeScript, API key support) or raw `fetch` |
| **Platforms** | 20+ including Spotify, Apple Music, SoundCloud, Audius, Tidal, YouTube |
| **Alternatives** | MusicFetch ($50-200/mo, richer metadata). Songwhip is dead. |
| **Integration** | Server-side `/api/music/resolve` route → universal link card in chat |

