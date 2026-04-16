# 365 - Recoupable Monorepo Architecture & Best Practices for ZAO

> **Status:** Research complete
> **Date:** 2026-04-15
> **Goal:** Study Sweetman's Recoupable monorepo structure, extract best practices, and plan how ZAO ecosystem can adopt a similar pattern across 9+ repos

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Monorepo strategy | USE git submodules (like Recoupable) over Turborepo/pnpm workspaces - ZAO projects are independent Next.js apps with separate deploys, not shared-build packages |
| AGENTS.md / CLAUDE.md at root | USE - single source of truth for cross-project conventions, symlink CLAUDE.md to AGENTS.md so all AI tools read it |
| PROGRESS.md | USE - persistent memory across sessions, tracks in-flight PRs, dependencies, deployment coordination. Solves the "what was I working on?" problem |
| DESIGN.md at root | USE - ZAO already has design conventions scattered across CLAUDE.md rules. Extract to standalone DESIGN.md like Recoupable's |
| Separate database repo | USE - extract Supabase migrations from ZAO OS into `database/` submodule. Single schema truth, cleaner deploys |
| Skills repo | SKIP for now - ZAO skills live in ~/.claude/skills/ (user-level), not project-level. Recoupable's approach works because they ship skills as product |
| CONTRIBUTING.md | USE - "Do NOT open PRs on parent repo, PR to the sub-repo" rule prevents confusion |
| Branch strategy per sub-repo | USE Recoupable's pattern: `api` and `chat` PR to `test` branch first, other repos PR to `main` directly |

## What Recoupable Built

### The Mono Repo (github.com/recoupable/mono)

Git submodule-based monorepo. 13 submodules, each an independent repo with its own deploy pipeline. Parent repo holds cross-cutting docs + agent context.

```
recoupable/mono/
├── .agent/              # Agent context files
├── .agents/             # Multi-agent configs
├── .claude/             # Claude Code config
├── .gemini/             # Gemini config
├── .codex/              # Codex config
├── .cursor/             # Cursor IDE config
├── .github/             # Workflows
├── AGENTS.md            # Monorepo-wide guidance (canonical)
├── CLAUDE.md            # Symlink to AGENTS.md
├── CONTRIBUTING.md      # PR rules per sub-repo
├── DESIGN.md            # Complete design system
├── PROGRESS.md          # Persistent progress tracking
│
├── chat/                # Next.js 16 + React 19 + Vercel AI SDK (submodule)
├── api/                 # Next.js 16 + x402 + Supabase (submodule)
├── tasks/               # Trigger.dev v4 background workers (submodule)
├── docs/                # Mintlify documentation (submodule)
├── database/            # Supabase migrations (submodule)
├── remotion/            # Video generation (submodule)
├── bash/                # Interactive demo (submodule)
├── skills/              # LLM skills collection (submodule)
├── cli/                 # CLI tool (submodule)
├── marketing/           # Public website (submodule)
├── admin/               # Internal dashboard (submodule)
├── gtm/                 # Go-to-market (submodule)
└── strategy/            # Strategy docs (submodule)
```

### Architecture Pattern

```
chat (frontend) --> api (backend) --> Supabase (database)
                                  --> tasks (async Trigger.dev jobs)
```

Each submodule = independent repo, independent deploys, independent PRs. Parent repo is glue: docs, agent context, progress tracking.

### Best Practices Worth Stealing

**1. AGENTS.md as Single Source of Truth**
- One file, all cross-project conventions
- CLAUDE.md is a symlink to it (so Claude Code reads it automatically)
- Covers: git workflow, design system reference, code principles, architecture
- Critical rule: "NEVER push directly to main"

**2. PROGRESS.md as Persistent Memory**
- Structured entries: `## [YYYY-MM-DD] Submodule(s) - Feature Name (REC-XX)`
- Fields: Prompt, Status (completed/in_progress/blocked), Changes, PRs, Notes
- Cross-links ticket IDs (REC-65 depends on REC-66)
- Test counts per entry ("14 new tests for position calculation")
- Deployment coordination ("Tasks/API must be deployed together")
- **This is the monorepo's persistent memory** - prevents duplicating effort

**3. Single Responsibility Per File**
- One exported function per file
- All Supabase calls through `lib/supabase/[table]/[function].ts`
- Naming: `select*`, `insert*`, `update*`, `delete*`, `get*`
- Input validation: `validate<EndpointName>Body.ts`

**4. DESIGN.md**
- Complete design system: colors, typography (4-font stack), spacing (4px base), motion, components
- Shadow-as-border technique (box-shadow instead of CSS border)
- Responsive breakpoints with fluid type scaling (clamp())
- Referenced by AGENTS.md: "Before building UI, read DESIGN.md"

**5. Branch Strategy Per Sub-repo**
- `api` and `chat`: PR to `test` branch first, then merge to `main`
- Other repos: PR directly to `main`
- PRs always to the sub-repo, NEVER to the parent mono repo

**6. Skills as Product**
- 11 skills in dedicated repo, each with SKILL.md + references/ + scripts/
- Music industry focused: streaming growth, release management, songwriting
- Distributed via Claude Code plugin marketplace
- Apache 2.0 licensed

## Comparison: Monorepo Strategies

| Strategy | Git Submodules (Recoupable) | Turborepo + pnpm Workspaces | Nx | Single Repo (ZAO current) |
|----------|---------------------------|---------------------------|----|----|
| **Setup effort** | Low - just .gitmodules | Medium - turbo.json + workspace config | High - nx.json + project graphs | None |
| **Independent deploys** | Yes - each sub-repo deploys separately | Yes, but needs turbo pipeline config | Yes | N/A - already separate |
| **Shared packages** | Manual (copy or npm link) | Native (workspace:*) | Native | N/A |
| **CI/CD** | Per-repo CI (simpler) | Single CI with caching (faster) | Single CI with affected detection | Per-repo |
| **Agent context** | Parent repo AGENTS.md + per-repo CLAUDE.md | Root turbo.json + per-app configs | nx.json + project-level configs | Single CLAUDE.md |
| **Best for** | Independent apps with shared docs | Shared component libraries + apps | Enterprise monorepos with 50+ packages | Solo dev, single app |
| **ZAO fit** | Best - 9 independent apps | Overkill - no shared packages | Way overkill | Current state |

## ZAO Ecosystem - Current State (9 Repos)

| Repo | Location | Stack | Deploy | Status |
|------|----------|-------|--------|--------|
| **ZAO OS** | `/Documents/ZAO OS V1/` | Next.js 16 + Supabase + Neynar | Vercel | Active, main product |
| **FISHBOWLZ** | `/Documents/fishbowlz/` | Next.js + Privy + Supabase | Vercel (fishbowlz.com) | Active |
| **COC Concertz** | `/Documents/COCConcertZ/` | Next.js 16 + Firebase + Cloudinary | Vercel | Active |
| **BetterCallZaal** | `/Documents/BetterCallZaal/` | Static HTML + Farcaster Mini App | Vercel | Active |
| **WaveWarZ** | (separate) | Next.js + Solana | Vercel | Active |
| **ZAOUNZ** | `/Documents/ZAOUNZ/` | Unknown | Unknown | Unknown |
| **ZAOMusicBot** | `/Documents/ZAOMusicBot/` | Unknown | Unknown | Unknown |
| **ZAOVideoEditor** | `/Documents/ZAOVideoEditor/` | Unknown | Unknown | Unknown |
| **BCZ Zune** | `/Documents/BCZ Zune/` | Unknown | Unknown | Unknown |

### What's Missing (vs Recoupable)

| What Recoupable Has | ZAO Equivalent | Gap |
|---------------------|----------------|-----|
| `mono/` parent repo | None | No cross-project coordination |
| `AGENTS.md` at root | `CLAUDE.md` per project | No shared conventions across repos |
| `PROGRESS.md` | None | No cross-project progress tracking |
| `DESIGN.md` | Rules scattered in CLAUDE.md | No standalone design system doc |
| `CONTRIBUTING.md` | None | No cross-project PR guidelines |
| `database/` submodule | `supabase/` dir in ZAO OS | Migrations coupled to one app |
| `skills/` submodule | `~/.claude/skills/` (user-level) | Skills not versioned with project |
| Branch strategy docs | None | Inconsistent across repos |

## ZAO Mono Repo - Proposed Structure

```
zao-mono/
├── .claude/             # Claude Code config
├── .github/             # Cross-project workflows
├── AGENTS.md            # Monorepo-wide guidance (canonical)
├── CLAUDE.md            # Symlink to AGENTS.md
├── CONTRIBUTING.md      # PR rules per sub-repo
├── DESIGN.md            # ZAO design system (navy/gold, mobile-first)
├── PROGRESS.md          # Cross-project progress tracking
│
├── zaoos/               # ZAO OS - main social platform (submodule)
├── fishbowlz/           # FISHBOWLZ - audio rooms (submodule)
├── concertz/            # COC Concertz - concert promotion (submodule)
├── bcz/                 # BetterCallZaal - personal brand (submodule)
├── wavewarz/            # WaveWarZ - prediction market (submodule)
├── database/            # Shared Supabase migrations (submodule)
├── research/            # Research library (319+ docs) (submodule or dir)
└── agents/              # ZOE, ZOEY agent configs (submodule or dir)
```

### AGENTS.md for ZAO Mono (Draft)

Key sections to include:
1. **Brand glossary** - exact spellings (WaveWarZ, COC Concertz, etc.) - pull from existing CLAUDE.md
2. **Design system reference** - "Read DESIGN.md before UI work"
3. **Git workflow** - never push to main, PR to sub-repo not parent
4. **Code conventions** - shared across all Next.js apps (Zod validation, Supabase patterns, Tailwind dark theme)
5. **Security rules** - never expose server keys, never ask for wallet private keys
6. **Architecture** - which repo owns what domain
7. **Deploy targets** - Vercel project mapping per sub-repo

### Implementation Steps

| Step | Effort | What |
|------|--------|------|
| 1. Create `zao-mono` repo on GitHub | 10 min | Empty repo with AGENTS.md, CONTRIBUTING.md, DESIGN.md, PROGRESS.md |
| 2. Add existing repos as submodules | 30 min | `git submodule add` for each of the 9 repos |
| 3. Write AGENTS.md | 1 hour | Extract cross-cutting rules from ZAO OS CLAUDE.md |
| 4. Write DESIGN.md | 1 hour | Document navy/gold theme, spacing, typography, component patterns |
| 5. Write PROGRESS.md | 30 min | Seed with current in-flight work across repos |
| 6. Symlink CLAUDE.md to AGENTS.md | 1 min | `ln -s AGENTS.md CLAUDE.md` |
| 7. Extract database/ submodule | 2 hours | Move `supabase/` from ZAO OS to standalone repo |
| 8. Update each sub-repo's CLAUDE.md | 1 hour | Reference parent AGENTS.md, add repo-specific rules |

**Total effort: ~6 hours for full migration.**

## Sweetman's Other Best Practices

### From His Personal Repos (268 repos, Buenos Aires)

**1. Indexer-Per-Event Architecture**
- Separate repos for each blockchain event type (coins-beneficiaries, collect-fees, usdc-comments, usdc-payout)
- Each indexer is small, focused, independently deployable
- Pattern for ZAO: separate indexers for Respect events, ZABAL transfers, ZOUNZ auctions

**2. x402 Payment Protocol**
- HTTP-native payments (pay-per-request APIs)
- Already in ZAO research (Doc 280)
- Recoupable's API uses x402-next for monetized endpoints

**3. Template Repos**
- `api` repo is marked as public template
- Fork-and-customize model for new services
- Pattern for ZAO: template for new community forks (community.config.ts already supports this)

**4. Multi-Agent IDE Support**
- `.claude/`, `.gemini/`, `.codex/`, `.cursor/` directories in mono repo
- Each IDE gets its own config, all pointing to shared AGENTS.md
- Pattern for ZAO: add .gemini/ and .cursor/ alongside .claude/

**5. Skills as Separate Repo**
- 11 skills, each with SKILL.md + references/ + scripts/
- Apache 2.0 licensed, distributed via Claude Code marketplace
- Pattern for ZAO: extract ~/.claude/skills/ to versioned repo (future)

**6. DESIGN.md as Design System**
- Not Figma, not Storybook - just a markdown file
- Complete: colors (semantic tokens), typography (4 fonts with roles), spacing (4px base), motion (cubic-bezier), components (buttons, cards, inputs, chat bubbles), breakpoints
- Shadow-as-border technique everywhere
- **This is the most immediately useful pattern for ZAO**

## Key Numbers

| Metric | Value |
|--------|-------|
| Recoupable submodules | 13 repos in mono |
| Recoupable skills | 11 LLM skills |
| Sweetman total repos | 268 |
| ZAO repos to consolidate | 9 |
| Estimated migration effort | ~6 hours |
| PROGRESS.md entry fields | 5 (Prompt, Status, Changes, PRs, Notes) |
| Recoupable DESIGN.md font count | 4 (Geist Pixel Square, Plus Jakarta Sans, Geist Sans, Instrument Serif) |
| ZAO design tokens | 2 core (navy #0a1628, gold #f5a623) |

## Sources

- [recoupable/mono](https://github.com/recoupable/mono) - parent monorepo
- [recoupable/chat](https://github.com/recoupable/chat) - Next.js frontend (AGPL-3.0)
- [recoupable/Recoup-Agent-APIs](https://github.com/recoupable/Recoup-Agent-APIs) - backend (MIT)
- [recoupable/skills](https://github.com/recoupable/skills) - LLM skills collection (Apache-2.0)
- [recoupable/database](https://github.com/recoupable/database) - Supabase migrations
- [SweetmanTech GitHub](https://github.com/SweetmanTech) - 268 repos, onchain music infra
- [Recoupable AGENTS.md](https://raw.githubusercontent.com/recoupable/mono/main/AGENTS.md) - monorepo agent guidance
- [Recoupable DESIGN.md](https://raw.githubusercontent.com/recoupable/mono/main/DESIGN.md) - complete design system
