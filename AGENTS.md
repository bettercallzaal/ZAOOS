# AGENTS.md — ZAO OS

> **For AI coding agents:** This file gives you the context you need to work on this codebase.
> Works with Claude Code, Cursor, Copilot, Windsurf, Gemini, or any LLM-powered coding tool.
> For fork/setup instructions, read [FORK.md](./FORK.md) first.

## What This Is

ZAO OS is a **gated, music-first Farcaster social client** — a community hub where members chat on Farcaster channels, send encrypted DMs via XMTP, listen to music together, govern via on-chain proposals, and earn reputation. Built with Next.js 16 + React 19, Supabase, Neynar, and XMTP.

**The single customization file is [`community.config.ts`](./community.config.ts)** — all branding, channels, contracts, admin access, and navigation live there.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Auth | iron-session (encrypted httpOnly cookies) |
| Social | Neynar SDK (Farcaster) |
| Messaging | XMTP Browser SDK (MLS, E2E encrypted) |
| Database | Supabase PostgreSQL + RLS + Realtime |
| Blockchain | Wagmi + Viem (Optimism, Base) |
| State | React Query (@tanstack/react-query) |
| Validation | Zod on every API route |
| Music | 9 platform providers + Web Audio API |
| Testing | Vitest |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Protected routes (chat, messages, governance, admin, etc.)
│   ├── api/              # 121 route handlers: /api/[feature]/[action]/route.ts
│   └── page.tsx          # Landing / login
├── components/           # React components organized by feature
├── hooks/                # Custom hooks: useAuth, useChat, useRadio, usePlayerQueue, etc.
├── contexts/             # React contexts (XMTPContext, QueueContext)
├── providers/            # Provider wrappers (9 audio providers, PostHog)
├── lib/                  # Utilities by domain: auth, db, farcaster, gates, music, xmtp, etc.
└── types/                # TypeScript type definitions
community.config.ts       # All community branding, channels, contracts — THE fork point
scripts/                  # Database setup, wallet generation, data import
research/                 # 155+ research docs
```

## Code Conventions

### Components
- PascalCase `.tsx` files with `"use client"` directive for interactive components
- Mobile-first design using Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- Dark theme: navy `#0a1628` background, gold `#f5a623` primary
- Use `next/dynamic` with `{ ssr: false }` for heavy components
- Use `@/` import alias for all project imports

### API Routes
- Path: `/api/[feature]/[action]/route.ts`
- Validate ALL input with Zod `safeParse` — return 400 on failure
- Check session with `getSession()` — return 401 if missing
- Always return `NextResponse.json(...)` — never plain Response
- Wrap body in try/catch, log errors server-side, return sanitized 500
- Use `Promise.allSettled` for parallel fault-tolerant operations

### Hooks & State
- `use*` prefix, in `src/hooks/`
- React Query for server state — no Redux/Zustand
- Tailwind CSS v4 — no inline styles or CSS modules

### Testing
- Vitest: `describe`, `it`, `expect` — not Jest globals
- Mock with `vi.mock()` + `vi.hoisted()` — not MSW or raw fetch mocks
- Co-locate tests: `src/app/api/foo/__tests__/route.test.ts`
- Cover success and error paths

## Security Rules (Non-Negotiable)

- **NEVER** store, log, or access user wallet private keys
- **NEVER** use `dangerouslySetInnerHTML`
- **NEVER** expose server-only env vars to the browser:
  - `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`
- All user input validated with Zod before processing
- Supabase RLS enabled on all tables — use service role only server-side
- XMTP keys are app-specific burner keys, never personal wallet keys

## Key Files

| File | Purpose |
|------|---------|
| `community.config.ts` | All branding, channels, contracts, admin FIDs, nav — **change this to fork** |
| `src/middleware.ts` | Rate limiting + CORS headers |
| `src/lib/auth/session.ts` | iron-session config |
| `src/lib/db/supabase.ts` | Supabase client (service role + anon) |
| `src/lib/farcaster/neynar.ts` | Neynar SDK wrapper |
| `src/lib/validation/schemas.ts` | All Zod schemas |
| `src/providers/audio/PlayerProvider.tsx` | Player state, MediaSession, Wake Lock |
| `src/providers/audio/HTMLAudioProvider.tsx` | Dual audio element crossfade engine |

## Common Tasks

### Add a new API route
```bash
# Create: src/app/api/{feature}/{action}/route.ts
# Pattern: Zod validate → getSession() → try/catch → NextResponse.json
```

### Add a new component
```bash
# Create: src/components/{feature}/{Name}.tsx
# Add "use client" if interactive, use Tailwind dark theme classes
```

### Add a new Farcaster channel
Edit `community.config.ts` → `farcaster.channels` array. It appears as a chat room automatically.

### Run tests
```bash
npm run test           # vitest run
npm run test:watch     # vitest watch mode
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
```

### Database changes
Write SQL migration → run in Supabase SQL Editor → save to `scripts/migrations/applied/`.

## Architecture Decisions

- **Auth:** Two methods — Sign In With Farcaster (Neynar managed signers) + Sign In With Ethereum (SIWE). Both create iron-session cookies.
- **Database:** No ORM — direct `@supabase/supabase-js` queries with RLS.
- **Messaging:** Public (Farcaster casts cached in Supabase) + Private (XMTP E2E encrypted).
- **Music:** 9 platform providers, crossfade via dual `<audio>` elements, binaural beats via Web Audio API oscillators.
- **Governance:** Three tiers: (1) On-chain Nouns Builder Governor, (2) Snapshot gasless polls, (3) Supabase community proposals with respect-weighted voting.
- **Cross-posting:** Approved proposals auto-publish to Farcaster + Bluesky + X with per-platform content normalization.
