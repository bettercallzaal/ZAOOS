# Doc 225: Fork-Friendly Open-Source Patterns

**Date:** 2026-03-30
**Category:** Architecture / Developer Experience
**Status:** Complete
**Purpose:** Research how the best forkable open-source projects structure themselves for easy cloning and customization, with specific recommendations for ZAO OS.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Cal.com](#2-calcom)
3. [Dub.co](#3-dubco)
4. [Ghost CMS](#4-ghost-cms)
5. [Discourse](#5-discourse)
6. [Mastodon](#6-mastodon)
7. [Next.js Forkability Best Practices](#7-nextjs-forkability-best-practices)
8. [AI/LLM-Friendly Documentation](#8-aillm-friendly-documentation)
9. [Cross-Project Pattern Summary](#9-cross-project-pattern-summary)
10. [Recommendations for ZAO OS](#10-recommendations-for-zao-os)

---

## 1. Executive Summary

Five leading open-source projects were analyzed for fork-friendliness: Cal.com, Dub.co, Ghost CMS, Discourse, and Mastodon. Additionally, research was conducted on Next.js-specific forkability patterns, AI/LLM-friendly documentation standards (CLAUDE.md, AGENTS.md, llms.txt), and "vibe coding" repo patterns.

**The single biggest finding:** The projects that are easiest to fork share three traits:
1. A **single config file** that centralizes all community/brand-specific values
2. A **structured .env.example** with categorized variables and inline generation commands
3. A **dedicated "Fork This" or "Self-Host" guide** separate from the contributor README

ZAO OS already has trait #1 (`community.config.ts`) and a partial trait #2 (`.env.example`). The main gaps are: no dedicated fork/self-host guide, no one-click deploy button, no `CONTRIBUTING.md`, and no AI-agent-optimized documentation beyond `CLAUDE.md`.

---

## 2. Cal.com

**Repo:** https://github.com/calcom/cal.com
**License:** AGPLv3
**Stack:** Next.js, Prisma, PostgreSQL, tRPC, Zod

### What Makes It Fork-Friendly

**Monorepo with Turborepo:**
```
├── apps/           # Main applications
├── packages/       # Shared packages and libraries
├── agents/         # AI assistant configuration (.claude/, .cursor/)
├── deploy/         # Deployment configurations
├── docs/           # Documentation
├── scripts/        # Utility scripts
└── specs/          # API specifications
```

**Multiple Onboarding Paths:**
- `yarn dx` -- Docker-based quick start with pre-seeded test users and credentials
- Manual PostgreSQL setup for those who prefer it
- Gitpod integration for browser-based development (zero local setup)

**Pre-Seeded Test Users:** The `dx` command seeds default accounts (`free@example.com`/`free`, `pro@example.com`/`pro`, `admin@example.com`/`ADMINadmin2022!`) so forkers can immediately log in and explore.

**Env Var Handling:**
- `.env.example` at root with inline generation commands (e.g., `openssl rand -base64 32`)
- `.env.appStore.example` for optional integrations
- `packages/prisma/.env` for database config
- `yarn predev` command that checks for missing env vars on startup

**AI Agent Configuration:**
Cal.com now ships an `agents/` directory with symlinks to `.claude/` and `.cursor/`, containing:
- `rules/` -- modular engineering guidelines
- `skills/` -- reusable agent prompts
- `commands.md` -- command reference
- `knowledge-base.md` -- domain knowledge
- `AGENTS.md` -- main AI agent instructions

**Key Takeaway for ZAO OS:** The `yarn predev` env-check pattern and pre-seeded test users are both low-effort, high-impact additions. The `agents/` directory structure is worth studying since Cal.com is one of the largest open-source Next.js projects investing in AI-agent onboarding.

---

## 3. Dub.co

**Repo:** https://github.com/dubinc/dub
**License:** AGPLv3 (open core model -- 99% open, 1% commercial)
**Stack:** Next.js, PlanetScale (MySQL), Upstash (Redis), Tinybird (analytics), Vercel

### What Makes It Fork-Friendly

**Dedicated Self-Hosting Guide:** https://dub.co/docs/self-hosting
The guide is a standalone 9-step walkthrough, separate from the README and contributor docs. It covers:
1. Clone, install, configure local environment
2. Deploy Tinybird datasource/endpoints via CLI
3. Create Upstash Redis with REST API credentials
4. Initialize PlanetScale MySQL + Prisma schema
5. Register GitHub OAuth application
6. Configure Cloudflare R2 storage bucket
7. Setup Resend for transactional emails (optional)
8. Connect Unsplash API (optional)
9. Deploy to Vercel with all environment variables

**What Makes the Guide Effective:**
- Exact file paths and command syntax at every step
- Progressive complexity (local setup before remote services)
- Screenshots showing expected UI states
- Clear separation of required vs optional services
- License compliance note upfront

**Monorepo Structure:**
```
├── apps/web/       # Main Next.js application
├── packages/       # Shared libraries
├── pnpm-workspace.yaml
└── turbo.json
```

**Env Var Approach:** ~20+ environment variables categorized as:
- Application (`NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_APP_SHORT_DOMAIN`)
- Authentication (GitHub OAuth)
- Databases (Tinybird, Upstash, PlanetScale)
- Storage (R2/S3)
- Optional (Resend, Unsplash)

**Notable Fork: Stub** (https://github.com/Snazzah/stub) -- A community fork that stripped Dub down to a simpler self-hostable link shortener, demonstrating that the codebase is modular enough for significant forks.

**Key Takeaway for ZAO OS:** The dedicated self-hosting guide as a separate document (not buried in the README) is the gold standard. The progressive required-vs-optional env var categorization is directly applicable.

---

## 4. Ghost CMS

**Repo:** https://github.com/TryGhost/Ghost
**License:** MIT
**Stack:** Node.js, Handlebars templating, MySQL/SQLite

### What Makes It Fork-Friendly

**CLI-First Setup:**
- `ghost install local` -- under 1 minute to a running instance
- `ghost install` -- production setup with automatic SSL via LetsEncrypt
- No manual database configuration needed for local dev

**Theme/Core Separation:**
Ghost's most powerful fork-friendly pattern is the complete separation of themes from the CMS core. Themes are standalone repos using Handlebars templates that can be:
- Developed independently
- Installed via zip upload
- Version-controlled separately
- Hot-reloaded during development

**Starter Theme Template:** https://github.com/TryGhost/Starter -- GitHub's "Use this template" button creates a new repo with everything needed for custom theme development.

**Architecture Decision Records (ADRs):**
Ghost maintains an `/adr` directory documenting past architectural decisions. This is valuable for forkers who need to understand *why* things are built a certain way, not just *how*.

**Swappable Infrastructure via Docker Compose:**
```
compose.dev.yaml              # Base
compose.dev.analytics.yaml    # Analytics variant
compose.dev.mailgun.yaml      # Email variant
compose.dev.storage.yaml      # Storage variant
```

**AI Agent Integration:** Ghost also ships `.claude` and `.cursor` directories for AI assistant configuration.

**Key Takeaway for ZAO OS:** The theme/core separation pattern maps well to ZAO OS's `community.config.ts` approach but could go further. The ADR directory and starter template patterns are both worth adopting. The CLI installer concept (`ghost install`) is aspirational -- a `npx create-community-os` would be the ultimate fork experience.

---

## 5. Discourse

**Repo:** https://github.com/discourse/discourse
**License:** GPLv2
**Stack:** Ruby on Rails, Ember.js, PostgreSQL, Redis

### What Makes It Fork-Friendly

**Plugin Architecture:**
Discourse's standout pattern is its plugin system that allows extending functionality without modifying core code. Plugins can:
- Override CSS, HTML templates, and JavaScript behavior
- Provide configurable settings via admin UI
- Be managed via Git repositories
- Be composed as "theme components" (reusable modules)

**Theming Without Forking:**
Discourse intentionally designed its theming so you never need to fork to customize. Themes can override any template, add CSS/JS, and define settings -- all managed through the admin interface or Git repos. This "inversion of control" is key to avoiding fork drift.

**Multi-Environment Dev Setup:**
- `.devcontainer` for VS Code/GitHub Codespaces
- `.vscode` and `.zed` editor configurations
- Docker-based development environment
- Platform-specific guides (macOS, Ubuntu/Debian, Windows)

**Configuration via Admin UI:**
Rather than env vars for everything, Discourse uses a database-backed settings system with admin UI. Site name, colors, logos, and behavior are all configurable through the web interface after installation.

**Key Takeaway for ZAO OS:** The "theme components" pattern (reusable modules that can be mixed and matched) is worth considering for a future plugin system. The admin-UI-based configuration reduces the "edit config file and redeploy" friction. The `.devcontainer` support for GitHub Codespaces is a quick win for forker onboarding.

---

## 6. Mastodon

**Repo:** https://github.com/mastodon/mastodon
**License:** AGPLv3
**Stack:** Ruby on Rails, React/Redux, PostgreSQL, Redis, Node.js (streaming)

### What Makes It Fork-Friendly

**Comprehensive Instance Operator Documentation:**
https://docs.joinmastodon.org/admin/config/

Mastodon's env var documentation is the most thorough of all projects studied. Variables are organized into 8 categories:
1. **Basic** -- federation, secrets, deployment, scaling
2. **Backend** -- database, caching, search, email, monitoring
3. **File storage** -- CDN, object storage
4. **External authentication** -- LDAP, SAML, CAS, PAM, OmniAuth
5. **Hidden services** -- Tor integration
6. **Limits** -- anti-spam, sessions, feed management
7. **Other** -- migrations, encryption, deprecated features
8. **Uncategorized**

Each variable is documented with: name, description, default value, example value, version history, and security implications.

**Multiple .env Templates:**
```
.env.development
.env.production.sample
.env.test
.env.vagrant
```

**Multiple Deployment Paths:**
- Docker/docker-compose
- Heroku/Scalingo (cloud platform configs included)
- Helm charts (separate `mastodon/chart` repository)
- Standalone installation guide

**Fork Customization Pattern:**
Mastodon forks (like Glitch, Hometown, etc.) are common and well-supported. The `GITHUB_REPOSITORY=your-username/your-repo` env var lets forks point the "View source" link to their own repo.

**Separate Documentation Repository:**
https://github.com/mastodon/documentation -- Documentation lives in its own repo, which allows forkers to fork just the docs if they want to maintain their own guides.

**Key Takeaway for ZAO OS:** The categorized env var documentation pattern is directly applicable. The multiple `.env` templates for different environments (dev, production, test) reduce configuration errors. The `GITHUB_REPOSITORY` trick for forks is a nice touch.

---

## 7. Next.js Forkability Best Practices

Based on research across multiple sources and the projects above:

### Project Structure

**Use `src/` directory** to separate application code from root config files. This is already a ZAO OS convention and is validated by the broader community.

**Feature-based organization** over type-based:
```
# Good (ZAO OS already does this)
src/components/music/
src/components/governance/
src/components/admin/

# Avoid
src/components/buttons/
src/components/modals/
src/components/cards/
```

### Configuration Layering

The best forkable Next.js projects use a 3-layer config approach:

1. **Single community/brand config file** (e.g., `community.config.ts`) -- all values a forker must change
2. **`.env.example`** with categorized variables -- secrets and service credentials
3. **`next.config.js`** -- framework-level settings that rarely need changing

### TypeScript for Config Files

Using `.ts` instead of `.json` for config files (as ZAO OS does with `community.config.ts`) provides:
- Type safety and autocomplete for forkers
- Ability to derive values (computed properties)
- JSDoc comments for documentation
- Import validation at build time

### CI/CD Templates

Include GitHub Actions workflows that work out of the box:
- `.github/workflows/ci.yml` -- lint, type-check, test
- `.github/workflows/deploy.yml` -- deploy to Vercel/other
- `.github/ISSUE_TEMPLATE/` -- bug report and feature request templates
- `.github/PULL_REQUEST_TEMPLATE.md`

### One-Click Deploy

**Vercel Deploy Button** syntax:
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your/repo&env=NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,NEYNAR_API_KEY,SESSION_SECRET&envDescription=Required%20environment%20variables&envLink=https://github.com/your/repo/blob/main/.env.example&project-name=my-community-os)
```

Parameters supported: `repository-url`, `env` (required vars prompted during deploy), `envDescription`, `envLink`, `project-name`, `redirect-url`, `demo-title`, `demo-url`.

---

## 8. AI/LLM-Friendly Documentation

### CLAUDE.md Best Practices

Based on research from multiple sources including Cal.com's implementation:

**Optimal Structure (under 300 lines):**
1. **Project Context** -- one-line summary
2. **Quick Start** -- exact commands
3. **Code Conventions** -- specific patterns, not obvious things
4. **Architecture Decisions** -- key patterns the agent needs
5. **Security Rules** -- non-negotiable constraints
6. **Important Files** -- the 10-15 files the agent will touch most

**Key Principles:**
- Every line competes for attention with the actual work
- Delete anything the agent can infer from `package.json` or file structure
- Use `@imports` to reference detailed docs rather than embedding everything
- Maintain based on corrections -- every code review comment on AI-generated PRs is a signal

ZAO OS's `CLAUDE.md` is already well-structured at approximately 150 lines of substantive content, which is within the recommended range.

### AGENTS.md (Universal Standard)

AGENTS.md works across Claude Code, Cursor, GitHub Copilot, Windsurf, and other AI tools:

```markdown
## Project Overview
[One-sentence description]

## Build & Test
- Install: [command]
- Dev: [command]
- Test: [command]

## Code Standards
- [Specific requirement]

## Testing Requirements
[Expectations]
```

**Recommendation:** ZAO OS should add an `AGENTS.md` that mirrors the essential parts of `CLAUDE.md` for cross-tool compatibility.

### llms.txt Standard

An emerging convention (proposed September 2024, adopted by 2000+ sites by early 2026) for making documentation AI-crawlable:

- **`/llms.txt`** -- navigation index (under 10KB) pointing to key docs
- **`/llms-full.txt`** -- complete documentation in one Markdown file

Anthropic, Cursor, Mintlify, and others have adopted this. For ZAO OS, this would be a `public/llms.txt` file listing the key documentation pages for AI agents to understand the project.

### Cal.com's agents/ Directory Pattern

```
agents/
├── .claude/          # Claude Code config (symlinked)
├── .cursor/          # Cursor config (symlinked)
├── rules/            # Modular engineering guidelines
├── skills/           # Reusable agent prompts
├── commands.md       # Command reference
├── knowledge-base.md # Domain knowledge
└── AGENTS.md         # Main instructions
```

This pattern consolidates all AI-agent configuration in one place with symlinks to tool-specific locations.

---

## 9. Cross-Project Pattern Summary

| Pattern | Cal.com | Dub.co | Ghost | Discourse | Mastodon | ZAO OS (current) |
|---------|---------|--------|-------|-----------|----------|-------------------|
| Single brand config file | Partial | No | No (admin UI) | No (admin UI) | No (.env) | **Yes** (`community.config.ts`) |
| Categorized .env.example | Yes | Yes | Yes | Partial | **Best** | Partial |
| Dedicated fork/self-host guide | No (in README) | **Yes** (separate doc) | Yes (CLI docs) | Yes (INSTALL.md) | **Yes** (docs site) | **No** |
| One-click deploy button | No | No | No | No | No | **No** |
| Pre-seeded test data | **Yes** | Yes | Yes (CLI) | Yes | No | **No** |
| Multiple .env templates | Partial | No | Yes (compose) | No | **Yes** (4 files) | **No** |
| CONTRIBUTING.md | Yes | Yes | **Yes** | Yes | Yes | **No** |
| AI agent config (CLAUDE.md etc.) | **Best** | No | Yes | No | No | **Yes** |
| Architecture Decision Records | No | No | **Yes** | No | No | No |
| GitHub issue/PR templates | Yes | Yes | Yes | Yes | Yes | **No** |
| Dev container support | No | No | No | **Yes** | Partial | **No** |
| Starter/template repo | No | No | **Yes** | No | No | No |
| CLI installer | No | No | **Yes** | Yes | No | **No** |

---

## 10. Recommendations for ZAO OS

### Priority 1: Quick Wins (1-2 hours each)

**A. Add Vercel Deploy Button to README**
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bettercallzaal/zaoos&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEYNAR_API_KEY,SESSION_SECRET,APP_FID,APP_SIGNER_PRIVATE_KEY&envDescription=Required%20env%20vars%20for%20ZAO%20OS&envLink=https://github.com/bettercallzaal/zaoos/blob/main/.env.example&project-name=my-community-os)
```

**B. Categorize .env.example** -- Add section headers and required/optional markers:
```bash
# ══════════════════════════════════════════
# REQUIRED — Core platform services
# ══════════════════════════════════════════

# Supabase (https://supabase.com — create a free project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
...

# ══════════════════════════════════════════
# OPTIONAL — Enhanced features
# ══════════════════════════════════════════

# Bluesky cross-posting
BLUESKY_HANDLE=
...
```

**C. Add AGENTS.md** -- Cross-tool AI agent instructions (slim version of CLAUDE.md).

**D. Add GitHub Issue/PR Templates**
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

### Priority 2: Dedicated Fork Guide (half day)

**Create `FORK.md`** -- A standalone guide modeled on Dub.co's self-hosting doc:

```
# Fork ZAO OS for Your Community

## What You'll Get
[Feature list with screenshots]

## Prerequisites
- Node.js 20+, Supabase account, Neynar account

## Step 1: Clone and Configure
## Step 2: Set Up Supabase
## Step 3: Set Up Neynar (Farcaster)
## Step 4: Customize community.config.ts
## Step 5: Generate App Wallet
## Step 6: Run Database Scripts
## Step 7: Deploy to Vercel
## Step 8: Register Webhook

## Optional: Enable Additional Features
### Music Player
### Cross-Platform Publishing
### Encrypted DMs (XMTP)
### Governance (ZOUNZ / Snapshot)
```

### Priority 3: Developer Experience (1-2 days)

**A. Pre-seeded Test Data** -- Add a `scripts/seed-dev-data.ts` that creates test members, channels, and messages so forkers can explore the UI immediately.

**B. Env Var Validation on Startup** -- Add a `scripts/check-env.ts` (or enhance the existing `/check-env` skill) that runs during `npm run dev` and reports missing required variables with links to where to get them.

**C. CONTRIBUTING.md** -- Standard contributor guide covering:
- Development setup
- Code style (reference CLAUDE.md)
- PR process
- Testing expectations

**D. Multiple .env Templates** (following Mastodon's pattern):
- `.env.example` -- full reference with all variables
- `.env.development` -- minimal config for local dev
- `.env.production.sample` -- production-ready template

### Priority 4: Advanced (future)

**A. `npx create-community-os`** -- CLI scaffolding tool (like `ghost install`) that:
1. Asks community name, colors, Farcaster channel
2. Generates `community.config.ts`
3. Creates `.env.local` with prompts for each required service
4. Runs database setup
5. Opens browser at localhost:3000

**B. llms.txt** -- Add `public/llms.txt` for AI discoverability.

**C. GitHub Codespaces / .devcontainer** -- Zero-setup cloud development environment.

**D. Architecture Decision Records** -- Document key decisions in `docs/adr/` so forkers understand the "why" behind architectural choices.

---

## Sources

### Project Repositories
- [Cal.com GitHub](https://github.com/calcom/cal.com)
- [Dub.co GitHub](https://github.com/dubinc/dub)
- [Ghost GitHub](https://github.com/TryGhost/Ghost)
- [Discourse GitHub](https://github.com/discourse/discourse)
- [Mastodon GitHub](https://github.com/mastodon/mastodon)
- [Ghost Starter Theme Template](https://github.com/TryGhost/Starter)
- [Stub (Dub fork)](https://github.com/Snazzah/stub)

### Documentation
- [Dub Self-Hosting Guide](https://dub.co/docs/self-hosting)
- [Mastodon Environment Configuration](https://docs.joinmastodon.org/admin/config/)
- [Mastodon Instance Setup](https://docs.joinmastodon.org/admin/setup/)
- [Cal.com Contributor Guide](https://cal.com/docs/developing/open-source-contribution/contributors-guide)
- [Cal.com Monorepo Handbook](https://handbook.cal.com/engineering/codebase/monorepo-turborepo)
- [Ghost Developer Docs](https://docs.ghost.org/)
- [Discourse Theming/Customization](https://deepwiki.com/discourse/discourse/6-plugin-system)

### AI/LLM Documentation Patterns
- [The Complete Guide to AI Agent Memory Files](https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9)
- [Implementing CLAUDE.md and Agent Skills](https://www.groff.dev/blog/implementing-claude-md-agent-skills)
- [CLAUDE.md, AGENTS.md, and Every AI Config File Explained](https://www.deployhq.com/blog/ai-coding-config-files-guide)
- [What is llms.txt? (GitBook)](https://www.gitbook.com/blog/what-is-llms-txt)
- [llms.txt Explained (TacMind)](https://www.tacmind.com/blog/llms-txt)

### Deploy Buttons
- [Vercel Deploy Button Docs](https://vercel.com/docs/deploy-button)
- [Vercel Deploy Button Blog Post](https://vercel.com/blog/deploy-button)
- [Cloud Deploy Buttons Collection](https://github.com/cloudcommunity/Cloud-Deploy-Buttons)

### Best Practices
- [README Best Practices (GitHub)](https://github.com/jehna/readme-best-practices)
- [Make a README](https://www.makeareadme.com/)
- [Best Practices for Organizing Next.js 15](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)
- [My LLM Coding Workflow Going Into 2026 (Addy Osmani)](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e)
- [Beyond the Vibes: A Rigorous Guide to AI Coding](https://blog.tedivm.com/guides/2026/03/beyond-the-vibes-coding-assistants-and-agents/)
