# CLAUDE.md — ZAO OS

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
├── hooks/                # Custom hooks: useAuth, useChat, useRadio, useFocusTrap, etc.
├── contexts/             # React contexts (XMTPContext)
├── providers/            # Provider wrappers (audio)
├── lib/                  # Utilities by domain: auth, db, farcaster, gates, music, xmtp, validation
└── types/                # TypeScript type definitions
community.config.ts       # All community branding, channels, contracts, nav — fork-friendly
research/                 # 71 research docs (see research/README.md)
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
- **Community config:** All branding, channels, admin FIDs, contracts in `community.config.ts`. Change this file to fork for a different community.

## Important Files

- `community.config.ts` — branding, channels, admin FIDs, contracts, nav pillars
- `src/middleware.ts` — rate limiting, CORS headers
- `src/lib/auth/session.ts` — iron-session config
- `src/lib/db/supabase.ts` — Supabase client setup
- `src/lib/farcaster/neynar.ts` — Neynar SDK client
- `scripts/` — DB setup SQL, wallet generation, webhook registration

## Research Library

71 research documents in `research/`. Start with:
- `research/README.md` — full index organized by topic
- `research/50-the-zao-complete-guide/` — canonical project reference
- `research/51-zao-whitepaper-2026/` — whitepaper Draft 4.5

Use the `/zao-research` skill for conducting new research.

## Style Preferences

- Mobile-first design, desktop as enhancement
- Always say "Farcaster" not "Warpcast"
- Never generate app wallet keys interactively — use `scripts/generate-wallet.ts`
- Document build steps for content creation (build-in-public approach)
