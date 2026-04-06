# CLAUDE.md — ZAO OS

## Session Start (Do This First)

**Before any work, invoke `/worksession`** to create an isolated branch. Multiple Claude Code terminals may be open simultaneously — each must work on its own `ws/` branch to avoid conflicts. Do not skip this even if the user jumps straight into a task.

## What This Is

ZAO OS is a gated Farcaster social client for **The ZAO** (ZTalent Artist Organization) — a decentralized music community. Built with Next.js 16 + React 19, Supabase, Neynar, and XMTP.

## Quick Start

```bash
npm install          # also runs postinstall (patch-package + copies XMTP WASM)
npm run dev          # next dev (Turbopack)
npm run build        # next build
npm run lint         # eslint
```

Required env vars: see `.env.example`. Generate app wallet with `npx tsx scripts/generate-wallet.ts`.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Protected routes (chat, messages, governance, social, admin, etc.)
│   ├── api/              # Route handlers: /api/[feature]/[action]/route.ts
│   └── page.tsx          # Landing / login
├── components/           # React components organized by feature (chat, messages, music, admin, social, etc.)
│   └── music/            # 30+ components: player, queue, reactions, binaural beats, lyrics, etc.
├── hooks/                # Custom hooks: useAuth, useChat, useRadio, usePlayerQueue, useNowPlaying, useListeningRoom, etc.
├── contexts/             # React contexts (XMTPContext, QueueContext)
├── providers/            # Provider wrappers (audio: PlayerProvider, HTMLAudioProvider)
├── lib/                  # Utilities by domain: auth, db, farcaster, gates, music, xmtp, validation, publish, moderation
└── types/                # TypeScript type definitions
community.config.ts       # All community branding, channels, contracts, nav — fork-friendly
research/                 # 155+ research docs (see research/README.md)
scripts/                  # DB setup, wallet generation, webhook registration
supabase/                 # Database config
```

## Code Conventions

- **Components:** PascalCase `.tsx` files. Use `"use client"` directive for interactive components.
- **Utilities:** camelCase `.ts` files in `src/lib/[domain]/`.
- **Hooks:** `use*` prefix, in `src/hooks/`.
- **API routes:** `/api/[feature]/[action]/route.ts`. Always validate input with Zod, check session, return `NextResponse.json`.
- **Imports:** Use `@/` path alias (maps to `src/`).
- **State:** React hooks + `@tanstack/react-query`. No Redux/Zustand.
- **Styling:** Tailwind CSS v4. Dark theme: navy `#0a1628` background, gold `#f5a623` primary.
- **Code splitting:** Use `next/dynamic` for heavy components (SearchDialog, SongSubmit, ProfileDrawer).
- **Error handling:** try/catch with Zod `safeParse` for inputs. Use `Promise.allSettled` for parallel fault-tolerant operations.

## Security Rules (Non-Negotiable)

**Read `SECURITY.md` for full details.** Key rules:

- **NEVER ask for, store, or access user wallet private keys.** The `APP_SIGNER_PRIVATE_KEY` is an auto-generated app wallet — not a user's key.
- **NEVER use `dangerouslySetInnerHTML`.**
- **NEVER expose server-only env vars** (`SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`) to the browser.
- All user input must be validated with Zod before processing.
- Supabase RLS is enabled on all tables. Use service role only server-side.
- XMTP keys are app-specific burner keys in localStorage — never personal wallet keys.

## Key Architecture Decisions

- **Auth:** iron-session (encrypted httpOnly cookies, 7-day TTL). Two auth methods: Sign In With Farcaster + wallet signature (SIWE).
- **Database:** Supabase PostgreSQL with RLS. No ORM — direct `@supabase/supabase-js` queries.
- **Messaging:** Farcaster casts (public, cached in Supabase) + XMTP (private, E2E encrypted via MLS).
- **Blockchain:** Wagmi + Viem for wallet integration. Respect tokens on Optimism.
- **Rate limiting:** Middleware-based per-IP limits on API routes (see `src/middleware.ts`).
- **Cross-platform publishing:** Approved proposals (1000+ Respect) auto-publish to Farcaster + Bluesky + X. Content normalization per platform. Lens + Hive scaffolded but deferred.
- **AI moderation:** Perspective API for content safety scoring (`src/lib/moderation/moderate.ts`).
- **Music Player:** Multi-platform (9 providers), crossfade engine (dual audio elements), binaural beats (Web Audio API oscillators), MediaSession API (all 8 actions), Wake Lock, respect-weighted curation.
- **Spaces (Live Audio/Video):** Stream.io Video SDK (`audio_room` call type) with backstage mode, RTMP multistream broadcast (Twitch/YouTube/Kick/Facebook), screen share, recording, transcription/closed captions, noise cancellation, hand raise queue, song requests, room chat, emoji reactions. Slug-based URLs. Admin can end/delete any room. Webhook for auto participant counts + recording URLs. Token auto-refresh (1-hour expiry). Alternative 100ms provider for fractal meetings.
- **Governance:** Three-tier system: (1) ZOUNZ Nouns Builder on-chain proposals (NFT voting on Base), (2) Snapshot gasless weekly priority polls via `@snapshot-labs/snapshot.js`, (3) Community proposals (Supabase, Respect-weighted, auto-publishes to Farcaster/Bluesky/X after 7-day voting + 1000R threshold).
- **Community config:** All branding, channels, admin FIDs, contracts in `community.config.ts`. Change this file to fork for a different community.

## Important Files

- `community.config.ts` — branding, channels, admin FIDs, contracts, nav pillars
- `src/middleware.ts` — rate limiting, CORS headers
- `src/lib/auth/session.ts` — iron-session config
- `src/lib/db/supabase.ts` — Supabase client setup
- `src/lib/farcaster/neynar.ts` — Neynar SDK client
- `src/lib/publish/` — cross-platform publishing (Farcaster, X, normalize, Lens/Hive scaffolds)
- `src/lib/moderation/moderate.ts` — AI content moderation (Perspective API)
- `src/providers/audio/PlayerProvider.tsx` — player state, MediaSession, Wake Lock, haptics
- `src/providers/audio/HTMLAudioProvider.tsx` — dual audio element engine with crossfade
- `src/components/music/BinauralBeats.tsx` — binaural beats with ambient mixer
- `src/lib/music/curationWeight.ts` — respect-weighted curation formula
- `src/lib/zounz/contracts.ts` — ZOUNZ DAO contract addresses + ABIs (Token, Auction, Governor, Treasury)
- `src/lib/snapshot/client.ts` — Snapshot GraphQL client for reading polls
- `src/components/governance/CreateWeeklyPoll.tsx` — One-click Snapshot poll creator
- `src/components/zounz/ZounzProposals.tsx` — On-chain proposals from ZOUNZ Governor
- `src/app/api/stream/` — Stream.io token generation, room CRUD, webhook handler
- `src/app/api/admin/spaces/` — Admin list/delete rooms endpoints
- `src/components/spaces/` — 40+ components: RoomView, controls, participants, chat, reactions, broadcast
- `src/lib/spaces/roomsDb.ts` — Room database CRUD with slug support
- `src/lib/spaces/rtmpManager.ts` — RTMP multistream broadcast engine
- `scripts/configure-stream-grants.ts` — Stream.io call type permission setup
- `scripts/` — DB setup SQL, wallet generation, webhook registration, data import

## Research Library

240+ research documents in `research/`. Start with:
- `research/README.md` — full index organized by topic
- `research/050-the-zao-complete-guide/` — canonical project reference
- `research/051-zao-whitepaper-2026/` — whitepaper Draft 4.5
- `research/154-skills-commands-master-reference/` — **CANONICAL** all commands/skills reference

Use the `/zao-research` skill for conducting new research.

## Skills & Commands

11 project skills in `.claude/skills/`, 8 autoresearch subcommands, 1 command (minimax), plus ~30 gstack/superpowers skills. See [Doc 154](research/154-skills-commands-master-reference/) for the complete reference.

**Most-used commands:**

| Command | When to Use |
|---------|-------------|
| `/catchup` | Start of session — restore context |
| `/new-route feature/action` | Scaffold API route with ZAO conventions |
| `/new-component feature/Name` | Scaffold component with dark theme, mobile-first |
| `/fix-issue 42` | Fix a GitHub issue end-to-end |
| `/check-env` | Validate env vars before deploy |
| `/standup` | Generate build-in-public notes |
| `/zao-research topic` | Research with 155+ doc library + web |
| `/review` | Pre-landing PR review |
| `/ship` | Ship workflow: tests → review → PR |
| `/qa` | QA test the site, find and fix bugs |
| `/investigate` | Root cause debugging |
| `/autoresearch goal` | Autonomous iteration toward a measurable goal |
| `/autoresearch:security` | STRIDE + OWASP security audit |
| `/vps` | Generate prompts for VPS Claude Code to manage ZOE |
| `/vps status` | Health check prompt for ZOE on VPS |
| `/z` | Quick status dashboard — branch, commits, needs attention |

**How to ask for new features:** Describe the outcome you want for users, not the implementation. Let the skill system figure out the workflow. See Doc 154, Part 13.

## Style Preferences

- Mobile-first design, desktop as enhancement
- Always say "Farcaster" not "Warpcast"
- Never generate app wallet keys interactively — use `scripts/generate-wallet.ts`
- Document build steps for content creation (build-in-public approach)
