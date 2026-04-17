# CLAUDE.md - ZAO OS

## Session Start

**Invoke `/worksession`** before any work. Each terminal gets its own `ws/` branch.

## What This Is

ZAO OS is a gated Farcaster social client for **The ZAO** (ZTalent Artist Organization) - a decentralized music community on Base chain. 301 API routes, 279 components, 19 hooks, 240+ research docs.

**Stack:** Next.js 16, React 19, Supabase (RLS), Neynar, XMTP, Stream.io, Wagmi/Viem, Tailwind v4, iron-session.

## Project Map

| Directory | What | When to Read |
|-----------|------|-------------|
| `src/app/api/` | 301 route handlers across 54 domains | Working on backend |
| `src/components/` | 279 components by feature | Working on UI |
| `src/hooks/` | 19 custom hooks (useAuth, useChat, useRadio, etc.) | Working on state |
| `src/lib/` | Utils by domain: auth, db, farcaster, music, publish, agents | Working on business logic |
| `src/lib/agents/` | VAULT/BANKER/DEALER autonomous trading bots | Working on agents |
| `src/lib/publish/` | Cross-platform posting (Farcaster, X, Bluesky) | Working on distribution |
| `src/providers/` | Audio player, contexts | Working on player |
| `community.config.ts` | All branding, channels, admin FIDs, contracts, nav | Forking or configuring |
| `research/` | 240+ research docs (see research/README.md) | Use grep, not bulk reads |
| `scripts/` | SQL migrations, wallet generation, webhook setup | DB or infra work |
| `contracts/` | Solidity (staking, bounty board) | Smart contract work |

## Quick Start

```bash
npm install          # postinstall: patch-package + XMTP WASM copy
npm run dev          # Turbopack
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run test         # vitest
npm run lint:biome   # biome check
```

Env vars: see `.env.example`. App wallet: `npx tsx scripts/generate-wallet.ts`.

## Security (Non-Negotiable)

- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY` to browser
- **NEVER** use `dangerouslySetInnerHTML`
- **NEVER** ask for user wallet private keys
- All user input: Zod `safeParse` before processing
- Supabase RLS on all tables. Service role = server-side only
- XMTP keys are app-specific burner keys, never personal wallet keys

## Boundaries

**Always do:**
- Validate inputs with Zod, check session, return `NextResponse.json`
- Use `@/` import alias
- Mobile-first, dark theme (navy `#0a1628`, gold `#f5a623`)
- Use `Promise.allSettled` for parallel fault-tolerant operations
- Create PRs to main (never push directly)

**Ask first:**
- Database migrations or schema changes
- New dependencies
- Env var changes
- Changes to `community.config.ts`
- Changes to agent trading parameters

**Never do:**
- Commit secrets or `.env` files
- Skip Zod validation on API routes
- Use Redux/Zustand (we use React hooks + react-query)
- Use CSS modules or inline styles (Tailwind only)
- Pre-read large directories (spaces/ music/ governance/ zounz/) unless task requires it

## Per-File Commands

| File Pattern | Test | Lint |
|-------------|------|------|
| `src/app/api/**/*.ts` | `npx vitest run src/app/api/<feature>` | `npx biome check src/app/api/<feature>` |
| `src/components/**/*.tsx` | `npx vitest run src/components/<feature>` | `npx biome check src/components/<feature>` |
| `src/lib/**/*.ts` | `npx vitest run src/lib/<domain>` | `npx biome check src/lib/<domain>` |
| Any file | `npm run typecheck` | `npm run lint:biome` |

## Key Files

- `community.config.ts` - branding, channels, contracts, nav
- `src/middleware.ts` - rate limiting, CORS
- `src/lib/auth/session.ts` - iron-session config
- `src/lib/db/supabase.ts` - Supabase client
- `src/lib/agents/runner.ts` - shared agent trading logic
- `src/lib/agents/types.ts` - tokens, contracts, agent types
- `SECURITY.md` - full security policy

## Token Budget

- Use `/compact` every 15-20 messages
- Use grep on `research/*/README.md`, not bulk reads
- Don't pre-read `src/components/spaces/` (40+), `music/` (30+), `governance/`, `zounz/`
- Batch related questions into single messages

## Style

- Say "Farcaster" not "Warpcast"
- Mobile-first, desktop as enhancement
- Document build steps (build-in-public)
- Never generate wallet keys interactively

## Skills

See [Doc 154](research/154-skills-commands-master-reference/) for complete reference. Key commands: `/worksession`, `/z`, `/qa`, `/ship`, `/review`, `/zao-research`, `/autoresearch`, `/vps`.
