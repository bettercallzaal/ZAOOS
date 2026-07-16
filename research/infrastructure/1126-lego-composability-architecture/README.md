---
topic: infrastructure
type: architecture
status: research-draft
last-validated: 2026-07-15
related-docs: 1025, 1027, 1124, 1021, 836
original-query: "split it into multiple repos and make it really easy to use them all together like Legos - design the composability architecture"
tier: DEEP
---

# 1126 - ZAO Estate: Lego Composability Architecture

> **Goal:** Design how N independent repos (zao-social, hermes-orchestrator, zaoos-workspace, ZAOOS research) compose without friction. Deliver a "Lego system" where Zaal can clone multiple repos and wire them together effortlessly. This doc is the architecture + concrete packages + composition patterns (execution is doc 1027's job).

## Executive summary

The ZAO estate after the split (doc 1025 target) will be 4 repos with different roles. Today they are coupled by monorepo convention (imports, shared config, shared node_modules). After split, they must compose via:

1. **STUDS (npm packages):** Reusable libraries published to npm under @zao/ org. Apps + bots import and upgrade via normal npm versioning.
2. **BASEPLATE (context + config):** zao-mcp as the universal context layer. Standard scaffold patterns (.claude/, CLAUDE.md, AGENTS.md, secret hygiene rules). Shared skills sync via ~/.claude/skills/.
3. **INSTRUCTIONS SHEET (registry):** A single source of truth for "what repos exist, what do they do, how do they wire together." Candidate: lightweight zao-stack.json manifest vs heavier zao-mono meta-repo (git submodules).
4. **CLONE-AND-GO GUARANTEE:** Every repo is independently usable (npm install alone, no private registry, no cross-repo relative imports) AND composable (imports published @zao packages, wires via standard patterns).
5. **MIGRATION SEQUENCING:** Packages graduate BEFORE their consumers move (so zao-social starts using @zao/ui day one, not copying code).

This doc names the first 3 concrete packages, recommends the registry shape, and maps the stage order.

## The four repos (post-split target, from doc 1025)

| Repo | Visibility | Role | Output | Owner |
|------|-----------|------|--------|-------|
| **ZAOOS** | private | Research library + institutional memory | 820+ research docs, zero code | @Zaal |
| **zao-social** | public | Farcaster client for The ZAO (188 members) | 302 API routes, 295 components, live on Vercel | @Zaal |
| **hermes-orchestrator** | public | Reusable bot engine (conductor, factory, coder/critic/PR pipeline, multi-token poll) | Agent framework, open for external use | @Zaal |
| **zaoos-workspace** | private | ZAO bot fleet instance (tokens, ICM boxes, ops, memory) | Fleet config, no reusable code | @Zaal |

**The Lego challenge:** How do these 4 repos share @zao/ui design tokens without copying? How does zao-social import a shared auth convention without coupling to ZAOOS? How does hermes-orchestrator use @zao/publish to cross-post without depending on ZAOOS config?

## 1. THE STUDS - Reusable npm packages

**What graduates first:** Libraries that multiple repos import. Publish to npm under @zao/ org (scoped, org-owned, semver public).

### Candidates for STUDS extraction (by priority + risk + usage)

| Package | Source directory | Current users | Graduation stage | Type | Size | npm scope |
|---------|------------------|----------------|------------------|------|------|-----------|
| **@zao/ui** (DONE) | ~~packages/zao-ui~~ | zao-social + hermes-orchestrator (dashboards) + future apps | Stage 0 (pre-split) | Design tokens + Tailwind | 120K | @zao/ui |
| **@zao/publish** | src/lib/publish/ (3 domains: farcaster, x, bluesky) | zao-social (post routes) + hermes-orchestrator (multi-bot post orchestration) | Stage 1 (before app moves) | Cross-platform posting | 180K | @zao/publish |
| **@zaoscout/scrapers** | (recommended in repo audit 1115) | zao-social (web scraper jobs) + future research bots | Stage 2 (after app moves) | Web scraping + HTML parse | TBD | @zaoscout/scrapers |
| **@zao/auth-session** | src/lib/auth/session.ts + iron-session config | zao-social (iron-session config) + future apps | Stage 2 (after app moves) | Session management + RLS | 45K | @zao/auth |
| **@zao/db-types** | packages/db/ (Supabase types + RLS helpers) | zao-social + ZAOOS infra scripts | Stage 2 | Database types + migrations | 80K | @zao/db |
| **hermes-orchestrator** (REUSE existing) | bot/src/hermes/ (coder/critic/PR pipeline, conductor factory) | Already published (PUBLIC engine) | Stage 1 | Bot engine | Already npm | @bettercallzaal/hermes-orchestrator |
| **@zao/icons** | public/icons/ | zao-social + design docs | Stage 0 or defer | Icon system | 200K | @zao/icons |
| **@zao/config-shared** | community.config.ts split (channel definitions, nav structures) | zao-social + future apps | Stage 2 | App config schema | 40K | @zao/config |

### Graduation rules for STUDS

1. **Only code that two or more repos need** graduates to a package. Single-repo code stays in-tree.
2. **No circular dependencies.** @zao/ui cannot import @zao/publish; packages are a DAG.
3. **Public npm org (@zao)** for all packages. Scoped org = clear ownership + discoverability.
4. **Semver public.** Versions are permanent; breaking changes bump major. Consumers can pin or float.
5. **No private registry.** Every package is published to public npm.org (no internal artifactory). If it's a secret, it's not a STUD - it stays in zaoos-workspace/.
6. **README + CHANGELOG in every package.** Each published package is buildable/testable standalone (no git submodules, no ZAOOS imports).

### Real npm publishing plan

**Responsible:** @Zaal (approves) + @zao-assistant (executes)

1. **Org setup** (stage 0, pre-split):
   - Create GitHub org @bettercallzaal (or reuse if exists)
   - Create npm org @zao (or @bettercallzaal)
   - Add org members + CI/CD automation

2. **Per-package pipeline** (stage 1-2):
   - Extract package to a `/packages/<name>/` subdirectory in the source repo (or standalone repo)
   - Add `package.json` with `@zao/<name>` and initial version `0.1.0`
   - Add CI/CD (GitHub Actions) to publish on semver tag (`v0.1.0` triggers `npm publish`)
   - First publish happens BEFORE the consuming repo moves

   Example `package.json`:
   ```json
   {
     "name": "@zao/publish",
     "version": "0.1.0",
     "description": "Cross-platform post orchestration (Farcaster, X, Bluesky)",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "repository": "github:bettercallzaal/zao-publish",
     "license": "MIT",
     "scripts": {
       "build": "tsc",
       "test": "vitest",
       "prepublishOnly": "npm run build && npm run test"
     }
   }
   ```

3. **Consumer adoption** (stage 1-2):
   - Once a package is published, consuming repos add it: `npm install @zao/publish`
   - Remove the old in-tree copy (via git rm), commit the change
   - CI/CD confirms build + tests still pass with the npm dependency

4. **Versioning discipline:**
   - 0.x.y during early adoption (zao-social + hermes using @zao/publish 0.1.x)
   - 1.0.0 after 2+ repos have used it for 2+ weeks without bugs
   - Semver thereafter (0-downtime backward-compat in minor/patch; breaking = major)

### Package extraction order (dependencies)

```
Stage 1 (before app moves):
  1. Extract @zao/publish (used by both zao-social + hermes-orchestrator for posting)
     - Publish to npm
     - zao-social starts consuming via npm
     - hermes-orchestrator starts consuming via npm
  2. Extract @zao/ui if not done (used by both for design tokens)

Stage 2 (after app moves to new repo):
  3. Extract @zao/auth-session (used by zao-social for session management)
  4. Extract @zao/db-types (used by zao-social + ZAOOS scripts)
  5. Extract @zaoscout/scrapers (research tool, lower priority)

Stages 3+ (after narrowing ZAOOS):
  6. Extract @zao/config-shared (low coupling, can wait)
  7. Extract @zao/icons (nice-to-have, can defer)
```

## 2. THE BASEPLATE - Context + Config Foundation

Every repo in the ZAO estate needs a common operating base. Post-split, that base is NOT ZAOOS (it's no longer a monorepo) - it's a set of shared conventions + files + a universal context server.

### 2.1 zao-mcp: The universal context layer

**What it is:** A single MCP server every ZAO repo's Claude session loads. It provides:
- Unified query of all ZAO research docs (ZAOOS research/ via full-text search + fallback to grep)
- Unified brand/entity glossary + ICM box lookups (from ZAOOS/research/identity/)
- Unified brand voice guidelines + design system reference
- Shared skill registry (who offers what; e.g., @zaal's gstack-vendor location)

**Usage:**
```bash
# Every repo's .claude/settings.json includes
{
  "mcp": [
    {
      "name": "zao-mcp",
      "url": "file:///path/to/zao-mcp/dist/index.js",
      "env": {
        "ZAO_RESEARCH_ROOT": "/Users/zaalpanthaki/Documents/ZAO OS V1/research",
        "ZAO_IDENTITY_BOXES": "/Users/zaalpanthaki/Documents/ZAO OS V1/research/identity/icm-boxes"
      }
    }
  ]
}
```

Claude's Claude Code + Claude in Slack immediately have access to:
- `query_research("agentic coding best practices")` - full-text search on ZAOOS research
- `lookup_entity("The ZAO")` - brand canon + glossary + handles
- `lookup_icm_box("zao-assistant")` - Zaal's AI operator box + linked contexts
- `list_skills()` - all published ZAO skills

**Implementation plan (stage 0-1):**
1. Clone or create repo bettercallzaal/zao-mcp (public, TypeScript + Node.js)
2. Implement MCP protocol handlers for the 4 queries above
3. Add to .claude/settings.json in ZAOOS (instance A)
4. Add to .claude/settings.json in zao-social once it exists (instance B)
5. Add to .claude/settings.json in hermes-orchestrator (instance C)

**Source:** ZAOOS research/ directory is the database (never moved). zao-mcp is a stateless query server.

### 2.2 Standard repo scaffold (.claude/, CLAUDE.md, AGENTS.md, rules/)

Every ZAO repo after split carries the same .claude/ structure. This is copied (not submodule-d, not git-cloned) at creation time, then maintained independently.

**Scaffold contents:**

```
.claude/
  settings.json        # MCP servers + hooks + env vars (per-repo, overrides global)
  rules/
    api-routes.md      # API validation + response shape
    components.md      # Component conventions (client directives, Tailwind, accessibility)
    typescript-hygiene.md  # Type safety + any bans + error handling
    secret-hygiene.md      # 5-guard secret scanning procedures
    pii-hygiene.md         # PII redaction rules (emails, phones, addresses)
    tests.md               # Vitest conventions, mock strategies, fixtures
    skill-enhancements.md  # ZAO-specific skill behaviors (brainstorm, planning)
  CLAUDE.md          # (copied from ZAOOS, edited per-repo role)
  AGENTS.md          # (copied from ZAOOS, reference only)
  skills/
    gstack/          # vendored gstack MIT (if app/bot needs build tools)
    zao-research/    # (reference to zao-mcp, not a copy)
    (future: zol/, autopilot/, etc.)

.github/
  workflows/
    ci.yml           # typecheck, build, test, lint (per-repo type)
    secret-scan.yml  # pre-commit hook simulation for CI

.gitignore          # Standardized: .env, node_modules/, .DS_Store, secrets patterns
.env.example        # Repository-specific env vars (NO real values ever)

tsconfig.json       # Standardized base (per-repo): {"extends": "@zao/tsconfig"} or inline
package.json        # Per-repo (app/bot/lib specific)
README.md           # How to clone + run this repo standalone
CONTRIBUTING.md     # How to extend (if public repo)
LICENSE             # MIT or matching ZAOOS + zao-social + hermes-orchestrator
```

**Maintenance:**
- When .claude/rules/ changes in ZAOOS, a loop/skill runs `git pull origin main` in each repo's .clone/rules/ and opens a PR (per /update-config) if changes conflict
- Per-repo CLAUDE.md overrides global ~/.claude/CLAUDE.md only for repo-specific docs; shared rules always win

### 2.3 Shared skills sync pattern

Zaal has ~32 repo skills in ~/.claude/skills/. Post-split, which repos carry which skills?

**Rule:** If a skill is SHARED (used by multiple repos), it lives in ONE canonical location + is symlinked/copied to others.

| Skill | Canonical location | Users | Sync mechanism |
|-------|-------------------|-------|-----------------|
| gstack (qa/ship/review/plan-eng) | zao-os/.claude/skills/gstack (MIT) | zao-social + hermes orchestrator + ZAOOS + bot loop | Vendored copy in each repo (no link, isolated) |
| zao-research (deep-research on ZAO topics) | ZAOOS/.claude/skills/zao-research | all repos | Symlink ~/.claude/skills/zao-research -> ZAOOS/.../zao-research |
| zol (ZOL Farcaster agent skill) | zao-os/.claude/skills/zol | ZAOOS + zao-social | Symlink |
| autoresearch | ~/.claude/skills/autoresearch (Claude's) | all | Global (no sync needed) |
| (others) | (per-repo or global) | (per-repo) | Document in each repo's README |

**Sync on workspace setup:**
```bash
# User runs this ONCE per machine
~/.zao/scripts/setup-skills.sh

# Script creates symlinks:
ln -s ~/zao-os/.claude/skills/gstack ~/.claude/skills/gstack
ln -s ~/zao-os/research ~/.claude/skills/zao-research-docs
# (More symlinks per the table above)
```

## 3. THE INSTRUCTIONS SHEET - Registry Surface

Today, the ZAO estate is ONE monorepo = ONE root. After split, how does a user discover "which repos exist, what do they do, how do they depend on each other"?

**Two candidates:**

### Option A: zao-mono (heavy) - Git Submodules Meta-Repo

**Structure:**
```
zao-mono/
  .gitmodules
    [submodule "ZAOOS"]
      path = ZAOOS
      url = git@github.com:bettercallzaal/ZAOOS.git
    [submodule "zao-social"]
      path = apps/zao-social
      url = git@github.com:bettercallzaal/zao-social.git
    [submodule "hermes-orchestrator"]
      path = agents/hermes-orchestrator
      url = git@github.com:bettercallzaal/hermes-orchestrator.git
    [submodule "zaoos-workspace"]
      path = fleet/zaoos-workspace
      url = git@github.com:bettercallzaal/zaoos-workspace.git (private, requires key)

  README.md                    # How to clone the whole estate
  ARCHITECTURE.md              # Repo purposes + wiring guide
  SETUP.sh                     # One-command setup (clone submodules, install, setup .claude/)
```

**Pros:**
- Users clone zao-mono and get everything (including history)
- git commands work across all repos
- Mirrors doc 1027's "cut over VPS to run all 4 repos"

**Cons:**
- Submodule cognitive load (push/pull/update cycles)
- Private submodules require SSH key setup
- git push in one submodule doesn't auto-push in meta-repo
- Heavier for casual users (they get all 4 repos even if they only need 1)

### Option B: zao-stack (light) - JSON Manifest Registry

**Structure:**
```
zao-stack/
  zao-stack.json              # Machine-readable registry
  README.md                   # How to use this registry
  SETUP.sh                    # Clone just the repos you need
  scripts/
    clone-estate.sh           # Clone all 4 repos in dependency order
    clone-stack.sh            # Clone specific subset (--app, --bot, --research)
    sync-skills.sh            # Symlink ~/.claude/skills per the shared-skills table
    verify-wiring.sh          # Check all repos are present + npm packages resolve
```

**zao-stack.json:**
```json
{
  "version": "1.0",
  "lastUpdated": "2026-07-15",
  "repos": [
    {
      "id": "zaoos",
      "name": "ZAOOS Research Library",
      "url": "git@github.com:bettercallzaal/ZAOOS.git",
      "visibility": "private",
      "role": "knowledge-base",
      "description": "~820 research docs on AI, agentic coding, music, governance. Stateless, no code.",
      "dependencies": [],
      "skills": ["zao-research"],
      "path": "ZAOOS"
    },
    {
      "id": "zao-social",
      "name": "ZAO Farcaster Client",
      "url": "git@github.com:bettercallzaal/zao-social.git",
      "visibility": "public",
      "role": "application",
      "description": "Farcaster client for The ZAO. 302 API routes, 295 components, live on Vercel.",
      "dependencies": ["zaoos"],
      "npmDependencies": ["@zao/ui@^0.1.0", "@zao/publish@^0.1.0", "@zao/auth@^0.1.0"],
      "skills": ["gstack", "zao-research"],
      "path": "apps/zao-social"
    },
    {
      "id": "hermes-orchestrator",
      "name": "Bot Engine & Orchestrator",
      "url": "git@github.com:bettercallzaal/hermes-orchestrator.git",
      "visibility": "public",
      "role": "framework",
      "description": "Reusable bot engine (conductor, factory, coder/critic/PR pipeline, multi-token poll).",
      "dependencies": [],
      "npmDependencies": ["@zao/publish@^0.1.0"],
      "skills": ["gstack"],
      "path": "agents/hermes-orchestrator"
    },
    {
      "id": "zaoos-workspace",
      "name": "ZAO Bot Fleet Instance",
      "url": "git@github.com:bettercallzaal/zaoos-workspace.git",
      "visibility": "private",
      "role": "fleet-config",
      "description": "Private instance: tokens, ICM boxes, ops allowlists, memory, fleet configs.",
      "dependencies": ["hermes-orchestrator"],
      "npmDependencies": [],
      "skills": [],
      "path": "fleet/zaoos-workspace"
    }
  ],
  "packages": [
    {
      "name": "@zao/ui",
      "npmName": "@zao/ui",
      "version": "0.1.0",
      "repo": "ZAOOS",
      "description": "Design tokens, Tailwind config, icon system."
    },
    {
      "name": "@zao/publish",
      "npmName": "@zao/publish",
      "version": "0.1.0",
      "repo": "ZAOOS",
      "description": "Cross-platform post orchestration (Farcaster, X, Bluesky)."
    },
    {
      "name": "@zao/auth",
      "npmName": "@zao/auth",
      "version": "0.1.0",
      "repo": "ZAOOS",
      "description": "Session management + iron-session config."
    }
  ],
  "commands": {
    "cloneEstate": "bash zao-stack/scripts/clone-estate.sh",
    "cloneApp": "bash zao-stack/scripts/clone-stack.sh --app",
    "cloneBot": "bash zao-stack/scripts/clone-stack.sh --bot",
    "setupSkills": "bash zao-stack/scripts/sync-skills.sh",
    "verifyWiring": "bash zao-stack/scripts/verify-wiring.sh"
  }
}
```

**Pros:**
- Lightweight + machine-readable (agents can parse it)
- Users clone only the repos they need (--app = zao-social + ZAOOS research)
- Easy to update per-repo URLs + dependencies
- Script automation is simpler (just parse JSON + loop)

**Cons:**
- Meta-repo (zao-stack) is a separate thing (one more repo to keep updated)
- Not git-native (requires custom scripts vs submodule standard)
- Users must run setup scripts (not just git clone)

### Recommendation: Hybrid (zao-stack + optional git submodules)

**Canonical:** zao-stack with the JSON registry (light, machine-readable, extensible)

**But:** For the VPS bot and heavy developers, zao-mono offers value as a convenience (one `git clone`, one submodule update, everything is there). Zaal can maintain BOTH:
- zao-stack is the official registry + lightweight setup
- zao-mono is GENERATED from zao-stack (the .gitmodules is auto-written from the JSON)

This gives users choice: `clone zao-stack` for lightweight, or `clone zao-mono` for all-at-once.

## 4. THE CLONE-AND-GO GUARANTEE

Each repo must be independently usable (fork, clone, run) AND composable (imports @zao packages, wires via standard patterns).

### Guarantee statement

> Any ZAO repo can be cloned to a fresh machine and run standalone with `npm install && npm run dev`, with NO cross-repo relative imports, NO private git submodules, and NO ZAOOS prerequisite.

### How this works

1. **All shared code is published npm packages (@zao/*).**
   - Import: `import { UIButton } from '@zao/ui'`
   - Not: `import { UIButton } from '../../../../ZAOOS/packages/zao-ui'`
   - Exception: ZAOOS/research/ (immutable docs, not code)

2. **All app config that's shared is versioned packages too.**
   - Import: `import { brandConfig } from '@zao/config'` (version 0.1.x)
   - Not: `import { brandConfig } from '/Users/zaalpanthaki/Documents/ZAO OS V1/community.config.ts'`
   - Each app/bot pins the version it uses; can upgrade independently

3. **Claude Code context is wired via zao-mcp (the MCP server).**
   - Claude looks up brand canon, research docs, ICM boxes via the mcp call
   - Not: relative file imports or local .claude/ copies

4. **Local development can still reference ZAOOS docs for human readers.**
   - Each repo's README points to https://github.com/bettercallzaal/ZAOOS/tree/main/research/...
   - Or: symlink ~/.zao/research -> ZAOOS/research for local search
   - But this is a convenience, not a dependency

### Verification per repo

After clone, verify the guarantee:

```bash
# Anywhere: /Users/someone-else/Documents/zao-social/

git clone git@github.com:bettercallzaal/zao-social.git
cd zao-social

# 1. No private submodules (check .gitmodules)
cat .gitmodules
# Should have NO entries (or only public repos)

# 2. No relative imports to ZAOOS/
grep -r "../../../../ZAOOS" src/ || echo "OK: no ZAOOS imports"

# 3. No imports to ~/.zao/ paths
grep -r "/Users/zaalpanthaki/Documents/ZAO" src/ || echo "OK: no local paths"

# 4. npm install alone (no git clone zao-social-deps)
npm install
# Should succeed without asking for private credentials

# 5. Run standalone
npm run dev
# Should start the app (it will fail at runtime if missing .env, but code will load)

# 6. Check package.json for @zao/* deps
grep '"@zao/' package.json
# Should list the shared packages (ui, publish, auth, db-types)
```

## 5. MIGRATION SEQUENCING - Fold into doc 1027's stages

The estate split (doc 1027) has 3 stages. The package extractions follow a parallel sequence.

### Stage 0 (pre-migration)

**Packages to extract BEFORE any repo moves:**

1. Publish @zao/ui (if not done)
2. Publish @zao/publish
3. Create zao-mcp MCP server (in ZAOOS or standalone)
4. Create zao-stack JSON registry + scripts
5. Add zao-stack as a git repo + publish

**Output:** zao-social can import @zao/publish on day 1, not copy code.

**Owner:** @zao-assistant
**Blocker for:** Stage 1 (bot move)
**By when:** 2026-07-16

### Stage 1 (bot framework out, apps import packages)

**Parallel to doc 1027 Stage 1 (bot/src/zoe -> hermes-orchestrator + zaoos-workspace):**

1. hermes-orchestrator starts importing @zao/publish (v0.1.0)
2. zaoos-workspace links to hermes-orchestrator as a submodule + private env
3. ZAOOS bot/ still exists, now imports from submodules (transitional)

**Output:** hermes-orchestrator boots clean with @zao/publish installed from npm.

**Owner:** @Loop (execution) + @Zaal (verify)
**Blocker for:** Stage 2 (app move)
**By when:** 2026-07-17

### Stage 2 (app out, consumes packages)

**Parallel to doc 1027 Stage 2 (src/ -> zao-social):**

1. Extract @zao/auth-session (used by zao-social for session management)
2. Publish @zao/auth-session to npm
3. Extract @zao/db-types (used by zao-social for DB queries)
4. Publish @zao/db-types to npm
5. zao-social starts importing @zao/auth + @zao/db-types from npm (not in-tree copies)
6. zao-social verifies npm install alone works
7. Vercel deploy of zao-social succeeds with package imports

**Output:** zao-social runs standalone from its own repo + npm packages + Vercel.

**Owner:** @Loop (execution) + @Zaal (deploy)
**Blocker for:** Stage 3 (narrow ZAOOS)
**By when:** 2026-07-19

### Stage 3 (narrow ZAOOS, research-only)

**Parallel to doc 1027 Stage 3 (delete code):**

1. Verify all repos are running from their own homes (bot from hermes/zaoos-workspace, app from zao-social)
2. Delete ZAOOS/src/ + ZAOOS/bot/ (no longer needed)
3. Publish @zaoscout/scrapers + @zao/icons (lower priority, can happen after)
4. Update zao-stack manifest to reflect new package versions
5. ZAOOS becomes docs-only; zao-stack is the master registry

**Output:** 4 independent repos + zao-stack + 5 npm packages (@ui, @publish, @auth, @db-types, @scrapers).

**Owner:** @Loop (execute) + @Zaal (verify + gate)
**Blocker for:** None (final state)
**By when:** 2026-07-21

## 6. WORKSPACE SHAPE - zaoos-workspace Visibility Recommendation

**Locked decision from doc 1025:** zaoos-workspace visibility = RECONSIDER

**Constraint:** It currently holds tokens + ICM keys = secrets that can NEVER be in a public repo

**Current zaoos-workspace assumed structure (from doc 1027):**
```
zaoos-workspace/
  zoe/
    fleet-config/
      brain.md              # Zaal's persona/knowledge
      allowlist-*.json      # Telegram + Discord allowlists
    memory/                 # Agent memory + logs
  .env (NOT COMMITTED)      # Real tokens + ICM keys
  .env.example (COMMITTED)  # Stubs only
  .gitignore (blocks .env)  # Never commit real keys
```

**Recommendation: zaoos-workspace remains PRIVATE with this shape:**

1. **Secrets in ~/.zao/private/ (OFF-REPO)** - Not in git at all:
   - ~/.zao/private/icm-keys.json (ICM box owner keys)
   - ~/.zao/private/telegram-tokens.json (bot tokens)
   - ~/.zao/private/.env (real token values)

2. **Shareable configs in zaoos-workspace (IN-REPO):**
   - zoe/fleet-config/brain.md (Zaal's persona, no secrets)
   - zoe/fleet-config/allowlist-*.json (user lists, no tokens)
   - zoe/memory/ (agent logs, sanitized)
   - .env.example (stubs only)
   - CLAUDE.md + AGENTS.md (reference)

3. **Load-time injection (VPS runtime):**
   - VPS operator (or ~/bin/bootstrap.sh) reads ~/.zao/private/icm-keys.json
   - Injects into process.env before bot starts
   - Bot imports from zaoos-workspace repo + env vars
   - Result: public + private layers separate at runtime

**Benefits:**
- zaoos-workspace remains readable by humans (no encrypted keys in git)
- Secrets never leak (even if repo is accidentally made public)
- Rotation is easy (change ~/.zao/private/*, restart bot, no code commit)
- Follows ~/.zao pattern established in project (already used for gpt-loop keys, diarization models)

**Visibility:** zaoos-workspace = PRIVATE (stays private)

## Next Actions table

| Action | Owner | Type | Status | By When | Blocker for |
|--------|-------|------|--------|---------|-------------|
| Review + approve composability architecture (this doc) | @Zaal | Decision | pending | 2026-07-16 | Stage 0 start |
| Decide: zao-mono (submodules) vs zao-stack (JSON) or BOTH | @Zaal | Decision | pending | 2026-07-16 | Registry publication |
| Create zao-mcp MCP server (query research, ICM boxes, brand) | @Loop | Build | pending | 2026-07-16 | All repo Claude sessions |
| Create zao-stack repo + JSON registry | @Loop | Build | pending | 2026-07-16 | Clone estate script |
| Extract @zao/publish (Farcaster + X + Bluesky posting) | @Loop | Package | pending | 2026-07-16 | hermes + zao-social import it |
| Publish @zao/publish v0.1.0 to npm | @Loop | Publish | pending | 2026-07-16 | Stage 1 gate |
| Create ~/.zao/private/ conventions doc + bootstrap.sh | @Loop | Infra | pending | 2026-07-17 | VPS bot setup |
| hermes-orchestrator imports @zao/publish (Stage 1) | @Loop | Code | pending | 2026-07-17 | hermes boots |
| Extract @zao/auth-session + @zao/db-types | @Loop | Package | pending | 2026-07-18 | Stage 2 gate |
| Publish @zao/auth + @zao/db-types v0.1.0 to npm | @Loop | Publish | pending | 2026-07-18 | zao-social imports |
| zao-social imports @zao/* packages (Stage 2) | @Loop | Code | pending | 2026-07-19 | zao-social Vercel deploy |
| Verify clone-and-go guarantee per repo | @Loop | QA | pending | 2026-07-19 | Stage 2 gate |
| Extract @zaoscout/scrapers (lower priority) | @Loop | Package | pending | 2026-07-21 | Stage 3 |
| Publish @zaoscout/scrapers + @zao/icons | @Loop | Publish | pending | 2026-07-21 | Future consumers |
| Update zao-stack.json with final package list + versions | @Loop | Manifest | pending | 2026-07-21 | Final state |

## Recommendation trio (for Zaal's go/no-go)

### 1. **Packages (STUDS) to extract first** (in order)
   1. @zao/publish (0.1.0) - cross-platform posting, used by zao-social + hermes
   2. @zao/auth-session (0.1.0) - session + RLS, used by zao-social
   3. @zao/db-types (0.1.0) - database types, used by zao-social + scripts
   4. (Later: @zaoscout/scrapers, @zao/icons, @zao/config-shared)

### 2. **Composition surface (INSTRUCTIONS SHEET)**
   - **Primary:** zao-stack (lightweight JSON registry + scripts)
   - **Secondary/Optional:** zao-mono (submodules meta-repo for convenience, generated from zao-stack)
   - **Command:** Users run `bash zao-stack/scripts/clone-estate.sh` or `clone-stack.sh --app` to get what they need

### 3. **Workspace shape (zaoos-workspace visibility)**
   - **Visibility:** REMAINS PRIVATE (no change to doc 1025)
   - **Secrets handling:** Migrate to ~/.zao/private/ (off-repo), code in repo loads them at runtime
   - **Pattern:** Follow existing ~/.zao convention (gpt-loop keys, diarization models already use it)
   - **VPS bootstrap:** Create ~/bin/bootstrap.sh that reads ~/.zao/private/ and starts bot with injected env

## Sources

- Doc 1025 (2026-07-10): ZAOOS Estate Split - target architecture (approved)
- Doc 1027 (2026-07-10): ZAOOS Staged Migration Plan (execution roadmap)
- Doc 1124 (2026-07-15): ZAOOS Estate Split Manifest (directory mapping + stage gates)
- Doc 1021 (2026-07-10): ZOE Bot Factory - engine-vs-instance split
- Doc 836 (2026-06-11): ZAOOS repo estate census (302 routes, 295 components, 820 docs)
- Doc 1115 (2026-07-07): Repo estate audit 2026 (recommended package extractions)
- Brainstorm with Zaal, 2026-07-15 (this session): Lego composability architecture
- CLAUDE.md: Secret hygiene rules + component conventions
- ~/.zao/ pattern: Existing off-repo secrets storage (gpt-loop, diarization models)

## Appendix: Sample package.json for @zao/publish

```json
{
  "name": "@zao/publish",
  "version": "0.1.0",
  "description": "Cross-platform post orchestration for Farcaster, X, and Bluesky",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "prepublishOnly": "npm run build && npm run test"
  },
  "repository": {
    "type": "git",
    "url": "git@github.com:bettercallzaal/zao-publish.git"
  },
  "keywords": [
    "farcaster",
    "x",
    "bluesky",
    "social-media",
    "orchestration"
  ],
  "author": "Zaal @ The ZAO",
  "license": "MIT",
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  }
}
```

## Appendix: clone-estate.sh (zao-stack helper script)

```bash
#!/bin/bash
set -e

# Clone the entire ZAO estate into ./zao-estate/
# Usage: bash clone-estate.sh [--shallow]

SHALLOW=${1:-}
BASE_DIR="${HOME}/zao-estate"

echo "Cloning ZAO estate into $BASE_DIR..."

mkdir -p "$BASE_DIR"
cd "$BASE_DIR"

# Clone all repos listed in zao-stack.json
repos=(
  "https://github.com/bettercallzaal/ZAOOS.git:ZAOOS"
  "https://github.com/bettercallzaal/zao-social.git:apps/zao-social"
  "https://github.com/bettercallzaal/hermes-orchestrator.git:agents/hermes-orchestrator"
  "git@github.com:bettercallzaal/zaoos-workspace.git:fleet/zaoos-workspace"
)

for repo_spec in "${repos[@]}"; do
  url="${repo_spec%:*}"
  path="${repo_spec#*:}"
  
  echo "Cloning $url -> $path"
  if [ -z "$SHALLOW" ]; then
    git clone "$url" "$path"
  else
    git clone --depth 1 "$url" "$path"
  fi
done

echo ""
echo "Estate cloned. Next steps:"
echo "  cd $BASE_DIR"
echo "  bash zao-stack/scripts/setup-env.sh"
echo "  bash zao-stack/scripts/sync-skills.sh"
echo "  bash zao-stack/scripts/verify-wiring.sh"
```
