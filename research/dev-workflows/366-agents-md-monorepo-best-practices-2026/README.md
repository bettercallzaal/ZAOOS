# 366 - AGENTS.md & AI-Assisted Monorepo Best Practices (2026)

> **Status:** Research complete
> **Date:** 2026-04-15
> **Goal:** Extract best practices from Uniswap AI Toolkit, GitHub's 2500-repo AGENTS.md analysis, Farcaster hub-monorepo, and scaffolding patterns - apply to ZAO mono

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| AGENTS.md format | USE GitHub's 6-section structure: commands, testing, project structure, code style, git workflow, boundaries. ZAO mono already has this - refine it |
| Three-tier boundary system | USE in AGENTS.md: "Always do" / "Ask first" / "Never do" - more actionable than prose rules |
| Nested AGENTS.md per sub-repo | USE - each sub-repo gets its own AGENTS.md with domain-specific rules, parent provides defaults |
| Uniswap plugin model | SKIP - ZAO already uses ~/.claude/skills/ which is equivalent. Uniswap's Nx-based approach is overengineered for 1-person team |
| Scaffolding/templates | USE - create `scripts/scaffold.sh` for new API routes, components, hooks with ZAO conventions baked in |
| Changeset versioning | SKIP for now - ZAO doesn't publish npm packages, no need for automated semver |
| Security scanning in CI | INVESTIGATE - GitHub push protection for secrets is free and worth enabling |
| File-scoped commands | USE in AGENTS.md - provide per-file test/lint commands, not just full suite |
| Code examples over prose | USE - add concrete good/bad file references in AGENTS.md |
| PROGRESS.md with ticket IDs | USE - already implemented, add REC-XX style ticket IDs when Linear/GitHub Issues adopted |

## Comparison: AI-Assisted Monorepo Approaches

| Pattern | Recoupable (13 repos) | Uniswap AI Toolkit | Farcaster Hub | Nook (defunct) | ZAO Mono (9 repos) |
|---------|----------------------|--------------------|----|------|------|
| **Monorepo tool** | Git submodules | Nx + npm | Yarn + TurboRepo | Unknown | Git submodules |
| **Agent config** | AGENTS.md + symlink CLAUDE.md | Plugin marketplace + Nx generators | None visible | None | AGENTS.md + symlink CLAUDE.md |
| **Progress tracking** | PROGRESS.md (structured entries) | GitHub Issues + Linear | GitHub Releases + Changesets | None | PROGRESS.md |
| **Design system** | DESIGN.md (complete) | None visible | None | None | DESIGN.md (complete) |
| **Multi-IDE support** | .claude/.gemini/.codex/.cursor | .claude only (plugins) | None | None | .claude only (add more) |
| **Shared packages** | None (independent deploys) | Yes (Nx packages/) | Yes (packages/) | Yes (packages/) | None (independent deploys) |
| **Template/scaffold** | API repo is template | Nx generators | None | None | Not yet |
| **Branch strategy** | Per-repo (test vs main) | main + next + feature/* | main only | Unknown | Per-repo |
| **Best for** | Independent apps | Large team, shared libs | Protocol infra | Learning reference | Independent apps |

## What We Already Have (from Recoupable)

Done in zao-mono:
- [x] Git submodule monorepo (9 repos)
- [x] AGENTS.md as single source of truth
- [x] CLAUDE.md symlink
- [x] DESIGN.md with complete design system
- [x] CONTRIBUTING.md with PR rules
- [x] PROGRESS.md with structured tracking
- [x] GitHub repo (private, pushed)

## What to Add Next (from GitHub 2500-repo analysis + Uniswap)

### 1. Three-Tier Boundary System in AGENTS.md

Add to zao-mono/AGENTS.md:

```markdown
## Boundaries

### Always Do (no approval needed)
- Read any file in any sub-repo
- Run lint, typecheck on single files
- Run unit tests
- Create feature branches

### Ask First (requires approval)
- Install new dependencies
- Delete files
- Modify database migrations
- Push to any branch
- Create PRs

### Never Do
- Push directly to main
- Commit .env files or secrets
- Use dangerouslySetInnerHTML
- Expose server-only env vars to browser
- Ask for wallet private keys
- Force push or reset --hard
```

### 2. File-Scoped Commands

Add to AGENTS.md:

```markdown
## Commands

### File-scoped (preferred)
npx vitest run src/app/api/chat/__tests__/route.test.ts
npx tsc --noEmit src/app/api/chat/send/route.ts
npx eslint src/components/music/Player.tsx

### Full suite (only when asked)
pnpm test
pnpm lint
pnpm build
```

### 3. Good/Bad File References

Add to AGENTS.md:

```markdown
## Code Examples

### Good patterns (use as reference)
- API route: zaoos/src/app/api/chat/send/route.ts (Zod validation, session check, try/catch)
- Component: zaoos/src/components/navigation/PageHeader.tsx (clean, mobile-first)
- Hook: zaoos/src/hooks/useAuth.ts (proper state management)

### Anti-patterns (avoid)
- Inline styles instead of Tailwind
- Direct Supabase imports in components (use lib/ layer)
- Missing Zod validation on API inputs
```

### 4. Nested AGENTS.md Per Sub-repo

Each sub-repo should have its own AGENTS.md (or CLAUDE.md) with domain-specific rules:

```
zao-mono/
├── AGENTS.md              # Cross-project (brand, security, design ref)
├── zaoos/CLAUDE.md        # ZAO OS specific (already exists, 200+ lines)
├── fishbowlz/CLAUDE.md    # FISHBOWLZ specific (audio rooms, Privy auth)
├── concertz/CLAUDE.md     # COC Concertz specific (Firebase, Cloudinary)
└── bcz/CLAUDE.md          # BCZ specific (static HTML, mini app)
```

### 5. Multi-IDE Config Dirs

Following Recoupable's pattern:

```bash
mkdir -p zao-mono/.gemini zao-mono/.cursor zao-mono/.codex
# Each gets a minimal config pointing to AGENTS.md
```

### 6. Security: Enable GitHub Push Protection

Free feature - blocks commits containing secrets:
1. Go to repo Settings > Code security and analysis
2. Enable "Push protection"
3. Blocks API keys, tokens, passwords from being committed

### 7. Scaffold Script

Create `zao-mono/scripts/scaffold.sh` for generating new:
- API routes with Zod validation, session check, try/catch
- Components with "use client", dark theme, mobile-first
- Hooks with proper typing
- Test files with vitest setup

## Projects Worth Studying

| Project | GitHub | Why Study It | Key Pattern |
|---------|--------|-------------|-------------|
| **Recoupable** | recoupable/mono | AI-first monorepo, music industry, AGENTS.md pioneer | Git submodules + PROGRESS.md |
| **Uniswap AI Toolkit** | Uniswap/ai-toolkit | Enterprise AI workflow standardization | Plugin marketplace, slash commands as packages |
| **Farcaster Hub** | farcasterxyz/hub-monorepo | Protocol-level TypeScript monorepo | TurboRepo + Yarn, Rust for perf-critical code |
| **Nook** | nook-app/nook-client | Full Farcaster client architecture (defunct but open) | apps/ + packages/ separation, 15+ microservices |
| **Herocast** | hero-org/herocast | Power-user Farcaster client | Multi-account, scheduled posts, keyboard-first |
| **awesome-farcaster-dev** | ftchd/awesome-farcaster-dev | Curated list of Farcaster dev resources | Reference for finding more projects |
| **MakerKit** | makerkit/nextjs-saas-starter-kit-lite | Next.js + Supabase + TurboRepo SaaS template | Shared UI package, auth patterns |

## Key Numbers

| Metric | Value |
|--------|-------|
| Repos using AGENTS.md | 20,000+ (as of 2026) |
| GitHub leaked secrets (2024) | 39 million |
| AI-assisted projects secret exposure increase | 40% |
| Recommended AGENTS.md max lines | 150 (then split into nested files) |
| Farcaster hub-monorepo releases | 110+ |
| Uniswap AI Toolkit plugins | 7 |
| ZAO mono sub-repos | 9 |
| GitHub's 6 core AGENTS.md sections | commands, testing, structure, style, git, boundaries |

## Sources

- [GitHub Blog: How to write a great agents.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) - 2500 repo analysis
- [Uniswap AI Toolkit](https://github.com/Uniswap/ai-toolkit) - Enterprise AI workflow monorepo
- [AGENTS.md spec](https://agents.md/) - Official standard
- [AGENTS.md best practices gist](https://gist.github.com/0xfauzi/7c8f65572930a21efa62623557d83f6e) - Comprehensive template
- [Farcaster hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) - Protocol TypeScript monorepo
- [Nook client](https://github.com/nook-app/nook-client) - Defunct Farcaster client, great architecture reference
- [Herocast](https://github.com/hero-org/herocast) - Leading open-source Farcaster client
- [Scaffolding for AI development](https://medium.com/@vuongngo/scaling-ai-assisted-development-how-scaffolding-solved-my-monorepo-chaos-4838fb3b4dd6) - Template-based consistency
- [awesome-farcaster-dev](https://github.com/ftchd/awesome-farcaster-dev) - Curated Farcaster dev resources
