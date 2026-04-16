# 414 - AI-Native Documentation Patterns for Monorepos (2026)

> **Status:** Research complete
> **Date:** April 15, 2026
> **Goal:** Best practices for documenting codebases where AI agents (Claude Code, Cursor, Copilot) are primary collaborators, and human collaborators need to onboard into AI-built code

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary agent config** | USE CLAUDE.md (root + per-package). Already have this. Anthropic's hierarchy walks up directory tree - subdirectory files load on demand. Under 500 words per file for density |
| **Universal agent standard** | ADD AGENTS.md at root as universal standard (60K+ projects). Symlink CLAUDE.md content or vice versa. Supported by Sourcegraph, OpenAI, Google, GitHub |
| **llms.txt** | ADD `/public/llms.txt` for web-facing docs. 60K+ projects adopted. Structured markdown with H1/H2 sections + links. Good for external AI tools accessing our docs |
| **ETH Zurich warning** | HEED - research shows AGENTS.md can hurt agent performance when it contains LLM-generated context. Only include non-inferable details (env setup, gotchas, security rules). Skip architecture AI can read from code |
| **Per-package CLAUDE.md** | USE for monorepo. Each package gets its own CLAUDE.md with build/test/lint commands + domain-specific rules. Root CLAUDE.md = map of what each app/package does |
| **Onboarding doc strategy** | USE CLAUDE.md as dual-purpose: onboards AI agents AND human collaborators. Answer "what would you tell a senior dev joining in 5 minutes?" |
| **Three-tier boundaries** | USE "Always do" / "Ask first" / "Never do" pattern from doc 366. More actionable than prose |
| **.cursorrules** | SKIP - Cursor-specific, doesn't benefit Claude Code or Copilot. AGENTS.md is universal |
| **CONTEXT.md** | SKIP - not adopted as standard. AGENTS.md superseded it |
| **Architecture docs for AI** | USE inline code comments + CLAUDE.md map over separate ARCHITECTURE.md. AI reads code better than prose descriptions of code |

---

## Comparison: AI Documentation Standards (2026)

| Standard | Adoption | Audience | Where | Format | ZAO Action |
|----------|----------|----------|-------|--------|------------|
| **CLAUDE.md** | Claude Code users | Claude agents | Root + subdirs | Markdown, <500 words | KEEP + improve |
| **AGENTS.md** | 60K+ projects | All AI agents | Root | Markdown, 6 sections | ADD (symlink from CLAUDE.md) |
| **llms.txt** | 60K+ projects | External AI tools | /llms.txt or /public/ | Structured MD, H1/H2 + links | ADD for web docs |
| **.cursorrules** | Cursor users | Cursor AI | Root | JSON/text | SKIP |
| **.github/copilot-instructions.md** | GitHub Copilot | Copilot | .github/ | Markdown | SKIP (AGENTS.md covers this) |
| **GEMINI.md** | Gemini CLI users | Gemini | Root | Markdown | SKIP for now |
| **CONTEXT.md** | Minimal | Mixed | Root | Markdown | SKIP (not standard) |

## The Documentation Stack (Recommended)

```
zaoos/
  CLAUDE.md              # Root - project map, security rules, conventions
  AGENTS.md              # Universal agent standard (can symlink to CLAUDE.md)
  public/llms.txt        # AI-readable project overview for web
  apps/
    web/
      CLAUDE.md          # Next.js app specifics: routes, components, build
    zabal-snap/
      CLAUDE.md          # Snap-specific: Farcaster Mini App patterns
  packages/
    agents/
      CLAUDE.md          # Agent module: Privy wallets, 0x API, trading logic
    publish/
      CLAUDE.md          # Cross-posting: platforms, normalization, rate limits
    config/
      CLAUDE.md          # Community config: what each field controls
    db/
      CLAUDE.md          # Supabase: RLS rules, service role usage, migrations
```

## What Goes Where

### Root CLAUDE.md (already exists, refine)

```markdown
# Project Map
- apps/web/ - Main Next.js 16 app (social client, music, governance)
- apps/zabal-snap/ - Farcaster Mini App for ZABAL staking
- packages/agents/ - VAULT/BANKER/DEALER autonomous trading agents
- packages/publish/ - Cross-platform publishing (Farcaster, X, Bluesky)
- packages/config/ - Community branding, channels, contracts
- packages/db/ - Supabase client + helpers

# Quick Start
npm install && npm run dev

# Security (Non-Negotiable)
- NEVER expose SUPABASE_SERVICE_ROLE_KEY, NEYNAR_API_KEY, SESSION_SECRET
- NEVER use dangerouslySetInnerHTML
- All user input validated with Zod

# Conventions
[existing conventions - already good]
```

### Per-Package CLAUDE.md (new)

```markdown
# @zaoos/agents

Trading agents (VAULT/BANKER/DEALER) that autonomously buy ZABAL on Base.

## Build/Test
npm run test          # vitest
npm run typecheck     # tsc --noEmit

## Key Files
- runner.ts     - Shared agent logic (buy, burn, stake, post)
- wallet.ts     - Privy TEE signing
- swap.ts       - 0x Swap API integration
- types.ts      - AgentName, TOKENS, contracts

## Boundaries
ALWAYS: validate swap quotes before executing
ASK FIRST: changing trade amounts or burn percentages
NEVER: expose Privy wallet IDs or signing keys in responses
```

### AGENTS.md (new, universal)

```markdown
# AGENTS.md - ZAO OS

## Commands
- Build: `npm run build`
- Test: `npm run test` (vitest)
- Lint: `npm run lint:biome`
- Typecheck: `npm run typecheck`
- Dev: `npm run dev`

## Testing
- Framework: Vitest
- Mock pattern: `vi.mock()` + `vi.hoisted()`
- Co-locate: `src/app/api/foo/__tests__/route.test.ts`
- Helpers: `src/test-utils/api-helpers.ts`

## Project Structure
[point to CLAUDE.md project map]

## Code Style
- Imports: `@/` alias (maps to src/)
- Components: PascalCase .tsx with "use client" for interactive
- API routes: /api/[feature]/[action]/route.ts
- Styling: Tailwind CSS v4, dark navy #0a1628 + gold #f5a623

## Git Workflow
- Branch: ws/<description>-MMDD-HHMM from main
- PRs: always to main, never push directly
- Commits: conventional commits

## Boundaries
ALWAYS: validate with Zod, check session, return NextResponse.json
ASK FIRST: database migrations, new dependencies, env var changes
NEVER: expose service keys, use dangerouslySetInnerHTML, skip auth checks
```

### llms.txt (new)

```markdown
# ZAO OS

> Gated Farcaster social client for The ZAO - a decentralized music community. Built with Next.js 16, Supabase, Neynar, XMTP.

## Docs
- [README](https://github.com/ZAO-OS/zaoos/blob/main/README.md): Project overview
- [CLAUDE.md](https://github.com/ZAO-OS/zaoos/blob/main/CLAUDE.md): Full codebase guide
- [AGENTS.md](https://github.com/ZAO-OS/zaoos/blob/main/AGENTS.md): AI agent instructions

## API
- [Auth](https://github.com/ZAO-OS/zaoos/tree/main/src/app/api/auth): Session management
- [Agents](https://github.com/ZAO-OS/zaoos/tree/main/src/app/api/agents): Trading agent endpoints
- [Music](https://github.com/ZAO-OS/zaoos/tree/main/src/app/api/music): Player + queue API

## Stack
- Next.js 16 + React 19 (App Router)
- Supabase (PostgreSQL + RLS)
- Neynar (Farcaster API)
- XMTP (encrypted messaging)
- Stream.io (live audio/video)
- Wagmi + Viem (blockchain)
```

---

## Onboarding Pattern: AI-Built Codebases

When code was primarily written with AI assistance, human collaborators face specific challenges:

### Problem: Tribal Knowledge Lives in Chat History

| Challenge | Solution |
|-----------|----------|
| "Why was this built this way?" | Research docs (240+ in `research/`) capture decision rationale |
| "What's the architecture?" | CLAUDE.md project map + per-package CLAUDE.md |
| "How do I run things?" | AGENTS.md commands section (universal, not Claude-specific) |
| "What are the gotchas?" | Three-tier boundaries in AGENTS.md |
| "What's in progress?" | GitHub Issues + PR descriptions |

### The 5-Minute Onboarding Test

Good documentation passes this test: A senior developer with the right stack experience can go from `git clone` to making a meaningful PR in under 30 minutes by reading only:

1. Root CLAUDE.md (2 min) - what is this, how to run it
2. AGENTS.md (1 min) - commands, style, boundaries
3. Relevant package CLAUDE.md (2 min) - domain-specific context

### ETH Zurich Finding (Critical)

Research from ETH Zurich (2026) found AGENTS.md files can **hurt** agent performance when they contain information the agent can infer from code. Rules:

- **DO include:** env setup, security rules, non-obvious gotchas, test commands, deployment steps
- **DO NOT include:** architecture descriptions AI can read from imports, type definitions AI can read from code, file listings AI can glob for

This aligns with Stack Overflow's finding: guidelines should be **explicit** (not tacit), **demonstrate patterns** (not describe them), **explain WHY** (not just what), and be **tested adversarially** (try to break them).

---

## ZAO OS Implementation Plan

### Phase 1: Improve Existing (30 min)

1. Trim root CLAUDE.md - remove architecture AI can read, keep security rules + conventions + project map
2. Add three-tier boundaries section
3. Add per-file test/lint commands

### Phase 2: Add Universal Standards (1 hour)

1. Create `AGENTS.md` at root (symlink relationship with CLAUDE.md)
2. Create `public/llms.txt` for web-facing docs
3. Create per-package `CLAUDE.md` files after monorepo migration completes

### Phase 3: Onboarding (Post-Migration)

1. Create `CONTRIBUTING.md` with the 5-minute onboarding flow
2. Add `research/README.md` pointer in root docs
3. Test with a fresh Claude Code session - can it make a PR without asking questions?

---

## Codebase Files Affected

| File | Action |
|------|--------|
| `CLAUDE.md` | REFINE - trim to <500 words, add project map, add boundaries |
| `AGENTS.md` | CREATE - universal agent standard |
| `public/llms.txt` | CREATE - web-facing AI docs |
| `apps/web/CLAUDE.md` | CREATE after monorepo Phase 3 |
| `packages/agents/CLAUDE.md` | CREATE after monorepo Phase 3 |
| `packages/publish/CLAUDE.md` | CREATE after monorepo Phase 3 |
| `packages/config/CLAUDE.md` | CREATE after monorepo Phase 3 |
| `packages/db/CLAUDE.md` | CREATE after monorepo Phase 3 |
| `CONTRIBUTING.md` | CREATE - human onboarding flow |
| `.claude/rules/` | KEEP - already contains per-domain rules (api-routes, components, tests) |

---

## Sources

- [llms.txt Standard](https://llmstxt.org/) - 60K+ projects, structured MD for AI
- [AGENTS.md Standard](https://agents.md/) - Universal agent config, Linux Foundation
- [How to Build AGENTS.md](https://www.augmentcode.com/guides/how-to-build-agents-md) - Augment Code, 2026
- [Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md) - HumanLayer, dual-purpose onboarding
- [Using CLAUDE.md Files](https://claude.com/blog/using-claude-md-files) - Official Anthropic guidance
- [AI File Format Reference](https://p0stman.com/the-complete-reference-guide-to-ai-file-formats-for-coding-agents/) - p0stman.com, full comparison
- [Stack Overflow: Coding Guidelines for AI + Humans](https://stackoverflow.blog/2025/01/23/coding-guidelines-for-ai-agents-and-humans/) - Explicit > tacit, demonstrate > describe
- [ETH Zurich AGENTS.md Research](https://arxiv.org/abs/2506.03276) - Warning: LLM-generated context in AGENTS.md can hurt performance
- [Doc 366: AGENTS.md Monorepo Best Practices](../366-agents-md-monorepo-best-practices-2026/) - Prior ZAO research on structure
- [Doc 405: Monorepo Migration Plan](../405-monorepo-migration/) - Turborepo + pnpm migration
