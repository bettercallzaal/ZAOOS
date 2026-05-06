# CLAUDE.md - ZAOOS

## Session Start

**Invoke `/worksession`** before any work. Each terminal gets its own `ws/` branch.

## What This Is

**ZAOOS is the lab.** Where new ZAO-ecosystem things get prototyped before they earn their own home.

The repo started as a gated Farcaster social client for **The ZAO** (188 members on Base) and grew into a monorepo where many ZAO experiments live side-by-side. Some have already graduated to their own repos (COC Concertz). Some are graduating now (ZAOstock 2026, Wed 2026-04-29). Some are paused (FISHBOWLZ). The rest are still being figured out.

The pattern: **Monorepo as Lab.**

- A thing graduates when it's ready for production + ready to share publicly + ready to attract new users.
- On graduation: own repo, own DB, own domain. Code is **deleted** from ZAOOS so there's no drift. Routes redirect.
- Sharing model: clone, no deps. Each graduate stands alone.
- Research stays in ZAOOS forever - it's the institutional memory across every product.

**Today the lab includes:** the original Farcaster client for The ZAO, the ZAOstock dashboard + Telegram bot (graduating Wed), agent stack (ZOE, Hermes), music player components, 540+ research docs. 301 API routes, 279 components, 19 hooks.

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

> Mirrors [AGENTS.md](./AGENTS.md) Boundaries. **AGENTS.md is the source of truth** - if these drift, update AGENTS.md first then sync here.

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

## Workflow Orchestration

1. **Plan first.** For any task with 3+ steps or architectural decisions, enter plan mode (or use `/plan-eng-review` / `/plan-ceo-review`). Never start a non-trivial task without a plan visible to Zaal.
2. **Subagents over inline work.** Offload research, code search, and multi-file analysis to Task/Agent tools. Keep main context for synthesis + decisions.
3. **Self-improvement loop.** When Zaal corrects an approach, save the pattern to `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_*.md`. Re-read relevant feedback memories at session start.
4. **Verification before "done".** Never mark a task complete without proof: tests pass, build green, screenshot of UI, or explicit Zaal approval. Run `/qa` for UI features, `npm run typecheck` for code.
5. **Elegance check on non-trivial changes.** Before committing, ask: "is there a simpler way?" Skip for trivial fixes.
6. **Autonomous bug fixing.** Given a bug report, fix it without asking permission for each step. Use `/investigate` for root cause; only escalate if blocked.

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

## Primary Surfaces (post-doc-601 cleanup, 2026-05-04)

ZAO operating surfaces collapsed from 12+ systems to 5. When proposing automation or new bots, check this list first.

| Surface | What | Source of truth |
|---------|------|-----------------|
| **ZOE** (`@zaoclaw_bot`) | Single concierge — tasks, captures, brief/reflect, recall | `bot/src/zoe/` (Hermes-brain pattern) |
| **Hermes** (`@zoe_hermes_bot`) | Autonomous fix-PR pipeline (coder + critic + auto-PR) | `bot/src/hermes/` |
| **ZAO Devz** (`@zaodevz_bot`) | Group dispatch + hourly learning tip | `bot/src/devz/` (Phase 3 fold-in to Hermes pending) |
| **Bonfire** (`@zabal_bonfire`) | Knowledge graph recall + multi-corpus ingest | bonfires.ai (Genesis tier, wallet-gated) |
| **ZAOstock bot** (`@ZAOstockTeamBot`) | Festival team coordination, graduates with ZAOstock spinout | `bot/` (root, separate from `bot/src/zoe/`) |

**Decommissioned 2026-05-04 — do NOT propose, build, or restart:**

- openclaw container + 7-agent squad (ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER) — source of "·" pings
- Composio AO orchestrator
- ZOE v2 / Agent Zero migration plan
- 10-bot branded fleet (Magnetiq/Research/WaveWarZ/POIDH as own bots) — folds into ZOE memory blocks
- FISHBOWLZ (paused 2026-04-16, killed 2026-05-04 — Juke partnership stands)

**Rule: no new bots without doc.** Before adding a new Telegram bot, agent process, or autonomous loop, write a numbered research doc + get explicit Zaal approval. New brand voices = persona block in `bot/src/zoe/` `human.md`, NOT a new bot. Reference `research/agents/601-agent-stack-cleanup-decision/`.
