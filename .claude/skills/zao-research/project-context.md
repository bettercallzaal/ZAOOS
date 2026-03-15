# ZAO OS Project Context

## What ZAO OS Is

A gated, music-first social platform built on Farcaster where artists keep their revenue, curators earn reputation, and the community owns its data. Encrypted DMs via XMTP, inline music playback from 6 platforms, Farcaster Mini App with push notifications.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) + React 19.2.3 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 |
| Auth | Sign In With Farcaster (SIWF) + iron-session 8 |
| Social | Neynar API (Farcaster) + XMTP Browser SDK v7 |
| Mini App | @farcaster/miniapp-sdk + Quick Auth |
| Database | Supabase (PostgreSQL + Realtime) |
| Validation | Zod 4 |
| Data Fetching | TanStack React Query v5 |
| Music | Audius API, Spotify/SoundCloud/YouTube embeds, Web Audio API |
| Deployment | Vercel |

## Key Architecture Decisions

- Single Next.js app (not monorepo) — extract services later per `research/14`
- Farcaster channel as public chat, XMTP for private encrypted DMs — per `research/13`
- Neynar webhooks (not polling) for real-time casts — 57x cheaper per `docs/neynar-credit-optimization.md`
- Allowlist gating for MVP, token gating planned — per `research/12`
- XMTP uses app-generated burner keys, never personal wallet keys — per `SECURITY.md`
- Mobile-first design, desktop as enhancement — per memory `feedback_mobile_first.md`

## Community

- 40 founding members (allowlist CSV)
- App FID: 19640
- Domain: zaoos.com
- Primary channel: /zao on Farcaster
- Builder: @bettercallzaal

## 9-Layer Roadmap

1. Gated Chat (built)
2. Music Feed (in progress)
3. ZIDs — music profiles
4. Respect System — soulbound curation tokens
5. Hats Roles — on-chain curator/artist/mod
6. AI Agent — ElizaOS + Claude + Hindsight
7. Cross-Platform — publish to Lens, Bluesky, Hive, Nostr, X
8. Governance — DAO treasury, Snapshot, Coordinape
9. Decentralized Infra — Quilibrium, self-hosted hub

## Important Rules

- Always say "Farcaster" not "Warpcast" — per memory `feedback_farcaster_not_warpcast.md`
- Never ask for personal wallet keys — per memory `feedback_never_ask_private_keys.md`
- Mobile-first design — per memory `feedback_mobile_first.md`
- Document every step for build-in-public — per memory `feedback_build_public.md`
