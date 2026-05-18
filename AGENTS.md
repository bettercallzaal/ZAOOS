# AGENTS.md - ZAO OS

> Universal agent config for AI coding tools (Claude Code, Cursor, Copilot, Gemini, Codex).
> For Claude Code specifics, see [CLAUDE.md](./CLAUDE.md).

## Commands

```bash
npm install          # postinstall: patch-package + XMTP WASM
npm run dev          # next dev (Turbopack)
npm run build        # next build
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run test:watch   # vitest (watch mode)
npm run lint:biome   # biome check .
npm run lint:fix     # biome check --write .
npm run format       # biome format --write .
```

## Testing

- **Framework:** Vitest (`describe`, `it`, `expect` - not Jest globals)
- **Mocking:** `vi.mock()` + `vi.hoisted()` - never MSW or raw `fetch` mocks
- **Helpers:** `src/test-utils/api-helpers.ts` (session mocks, request builders, Supabase chain mocks)
- **Location:** Co-located: `src/app/api/foo/__tests__/route.test.ts`
- **Auth guards:** Table-driven tests with `describe.each` across routes
- **Database:** Never connect to real databases in tests. Mocks only.

### Per-file test commands

```bash
npx vitest run src/app/api/auth       # test specific API route
npx vitest run src/components/chat    # test specific component
npx vitest run src/lib/agents         # test specific lib module
npm run typecheck                     # typecheck everything
npx biome check src/lib/agents        # lint specific module
```

## Project Structure

```
src/app/api/         # 301 route handlers: /api/[feature]/[action]/route.ts
src/components/      # 279 components organized by feature
src/hooks/           # 19 custom hooks (useAuth, useChat, useRadio, etc.)
src/lib/             # Utilities by domain (auth, db, farcaster, music, publish, agents)
src/providers/       # React providers (audio player, contexts)
src/types/           # TypeScript type definitions
community.config.ts  # Branding, channels, contracts, nav - THE fork point
research/            # 240+ research docs
scripts/             # SQL migrations, wallet generation, webhooks
contracts/           # Solidity (staking, bounty board)
```

## Code Style

- **Imports:** `@/` path alias (maps to `src/`)
- **Components:** PascalCase `.tsx`, `"use client"` for interactive
- **API routes:** `/api/[feature]/[action]/route.ts` - Zod validation, session check, `NextResponse.json`
- **Utilities:** camelCase `.ts` in `src/lib/[domain]/`
- **Hooks:** `use*` prefix in `src/hooks/`
- **Styling:** Tailwind CSS v4. Dark theme: navy `#0a1628`, gold `#f5a623`. Mobile-first.
- **State:** React hooks + `@tanstack/react-query`. No Redux/Zustand.
- **Code splitting:** `next/dynamic` with `{ ssr: false }` for heavy components
- **Error handling:** try/catch with Zod `safeParse`. `Promise.allSettled` for parallel ops.

## Git Workflow

- **Branch:** `ws/<description>-MMDD-HHMM` from latest `main`
- **PRs:** Always to `main`. Never push directly.
- **Commits:** Conventional commits with optional scope.

```
feat(zoe): add facts memory layer
fix(api): zod parse on /api/cast/publish
docs: research doc 618 agents.md audit
chore(deps): bump grammy 1.31 -> 1.32
```

Scope = the subsystem touched (`zoe`, `hermes`, `api`, `music`, `agents`, `publish`). Skip scope for repo-wide changes.

## Security

- **Never expose server-only env vars** (`SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`) to the browser or in API responses.
- **Never use `dangerouslySetInnerHTML`** anywhere.
- **Never ask for or store user wallet private keys.** Generate app-scoped wallets via `npx tsx scripts/generate-wallet.ts`.
- **All user input** flows through Zod `safeParse` at the route boundary.
- **Supabase RLS** on every table. Service role = server only.
- **XMTP keys** are app-specific burner keys, never personal.
- **Secrets in agent pipelines** follow `.claude/rules/secret-hygiene.md` (5 guards: stub keys on disk, pre-commit diff scan, post-edit HEAD scan, pre-complete repo scan, prompt-level redaction).
- See [SECURITY.md](./SECURITY.md) for the full policy.

## Boundaries

> **Source of truth.** [CLAUDE.md](./CLAUDE.md) mirrors this section for Claude Code orchestration; if they drift, this file wins.

### Always Do

- Validate ALL user input with Zod `safeParse` before processing
- Check session with `getSession()` before authenticated operations
- Return `NextResponse.json(...)` from API routes
- Wrap API handler body in try/catch, log errors server-side
- Use `@/` import alias for all project imports
- Design mobile-first with Tailwind responsive prefixes

### Ask First

- Database migrations or schema changes
- Adding new npm dependencies
- Changing environment variables
- Modifying `community.config.ts`
- Changing agent trading parameters or wallet configs

### Never Do

- Expose server env vars: `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`
- Use `dangerouslySetInnerHTML`
- Ask for, store, or access user wallet private keys
- Commit `.env` files or secrets
- Use CSS modules, inline styles, or non-Tailwind styling
- Skip Zod validation on any API route
- Connect to production/staging databases in tests

## Key Files

| File | Purpose |
|------|---------|
| `community.config.ts` | All branding, channels, contracts, nav - change this to fork |
| `src/middleware.ts` | Rate limiting + CORS |
| `src/lib/auth/session.ts` | iron-session config |
| `src/lib/db/supabase.ts` | Supabase client (service role + anon) |
| `src/lib/farcaster/neynar.ts` | Neynar SDK wrapper |
| `src/lib/agents/runner.ts` | Shared agent trading logic (VAULT/BANKER/DEALER) |
| `src/providers/audio/PlayerProvider.tsx` | Player state, MediaSession, Wake Lock |
| `SECURITY.md` | Full security policy |

## Specialized Agent Personas

System-prompt files for spawned subagents. Renamed `AGENTS.md` -> `PERSONA.md` (2026-05-06) so coding tools that walk subtrees don't mistake them for project-level config.

| Path | Role |
|------|------|
| [`agents/founding-engineer/PERSONA.md`](./agents/founding-engineer/PERSONA.md) | Lead engineering decisions, architecture |
| [`agents/ceo/PERSONA.md`](./agents/ceo/PERSONA.md) | Strategy + product cuts |
| [`agents/security-auditor/PERSONA.md`](./agents/security-auditor/PERSONA.md) | Security audits, threat modeling |
| [`agents/researcher/PERSONA.md`](./agents/researcher/PERSONA.md) | Research doc generation per `/zao-research` skill |

## Bot Subtree (`bot/`)

The `bot/` tree houses Telegram bots running on VPS 1 (Hostinger KVM 2). Hermes canonical pattern: each bot is a grammy long-poll process that delegates LLM work to Claude CLI subprocesses (uses Max plan, $0 marginal cost).

| Bot | Source | Purpose |
|-----|--------|---------|
| ZOE (`@zaoclaw_bot`) | `bot/src/zoe/` | Single concierge: tasks, captures, brief/reflect, recall, newsletter, social drafts |
| Hermes (`@zoe_hermes_bot`) | `bot/src/hermes/` | Autonomous fix-PR pipeline (coder + critic + auto-PR) |
| ZAO Devz (`@zaodevz_bot`) | `bot/src/devz/` | Group dispatch + hourly learning tip cron |
| ZAOstock (`@ZAOstockTeamBot`) | `bot/` (root, separate) | Festival team coordination - graduates with ZAOstock spinout |

Conventions inside `bot/`:
- Letta-style memory blocks at `~/.zao/zoe/` (persona, human, recent, tasks, captures, facts, newsletters)
- Brand voice rules at `bot/src/zoe/brand.md` (Year of the ZABAL: no emojis, no em dashes, fact-only)
- Persona at `bot/src/zoe/persona.md` (deployed to VPS at `~/.zao/zoe/persona.md`)
- Hermes pattern documented in [research doc 613](./research/agents/613-hermes-canonical-agent-framework/)
- No new bots without a numbered research doc + Zaal sign-off (CLAUDE.md "Primary Surfaces")
