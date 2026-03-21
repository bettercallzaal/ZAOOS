# 89 — Paperclip + gstack + Autoresearch: The AI Company Stack

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Document how Paperclip, gstack, and autoresearch stack together to create AI-agent-run development workflows, and map the broader ecosystem of complementary tools for ZAO OS

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install gstack** | YES — MIT license, 31.8K stars, 21 skills including `/qa` (real browser testing), `/ship` (one-command deploy), `/review` (staff-level code review). Install to `~/.claude/skills/gstack` |
| **Stack order** | Paperclip (orchestration) → gstack (engineering skills per agent) → autoresearch (R&D loops). Each layer is independent but multiplicative together |
| **Conductor** | INSTALL — free Mac app by Garry Tan for running 10-15 parallel Claude Code sessions in isolated git worktrees. The missing piece for multi-agent parallelism |
| **For ZAO OS specifically** | Use gstack's `/qa` + `/review` + `/ship` on the ZAO codebase. Use Paperclip's 5 agents (doc 67) with gstack skills loaded. Use autoresearch for skill improvement (already doing this per doc 62-63) |
| **Skill marketplaces** | BOOKMARK [awesomeskills.dev](https://awesomeskills.dev) (3,032 skills) and [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) (549+ skills, 12.1K stars) for discovering new capabilities |
| **Skip for now** | Ruflo (too heavy, 259 MCP tools), Antigravity (Google IDE, different ecosystem), Cursor (now owned by Cognition/Devin, $250M acquisition) |

---

## The Three-Tool Stack

### Layer 1: Paperclip — The Company (Already Live)

**What it is:** Open-source orchestration layer. Org charts, budgets, task tickets, heartbeat scheduling, governance.

**ZAO Status:** Already researched extensively in docs 67, 71, 72, 76, 81, 82. Five agents configured: CEO, Community Manager, Music Curator, Dev Agent, Content Publisher.

| Stat | Value |
|------|-------|
| Stars | ~30,500 |
| License | MIT |
| Latest version | v2026.318.0 (March 18, 2026) |
| Key new features | Full plugin system, isolated execution workspaces, Hermes adapter, inline doc editing |
| ClipMart status | Still "COMING SOON" — template marketplace not yet live |

**New since doc 82:** Plugin system with runtime lifecycle management, CLI tooling, settings UI. 10 new DB migrations (0028-0037). Company logo uploads. Optimized heartbeat token usage.

### Layer 2: gstack — The Engineering Team (NEW)

**What it is:** 21 Claude Code skills (15 specialist roles + 6 power tools) that turn each agent session into a structured sprint with planning, building, testing, and shipping phases.

**Created by:** Garry Tan (CEO of Y Combinator). Claims 600K+ lines of production code in 60 days using this system.

| Stat | Value |
|------|-------|
| Repo | [github.com/garrytan/gstack](https://github.com/garrytan/gstack) |
| Stars | 31,796 |
| License | MIT |
| Created | March 11, 2026 |
| Requirements | Claude Code + Git + Bun v1.0+ |

#### Installation (30 seconds)

```bash
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack
./setup
```

The setup script: checks for Bun, builds the `/browse` Playwright binary, installs Chromium, creates `~/.gstack` state directory, symlinks skills into Claude Code's skill directory.

**Team install:** Copy into `.claude/skills/gstack` in the repo so it's committed.

Also supports Codex, Gemini CLI, Cursor via `./setup --host codex` or `--host auto`.

#### All 21 Skills

**Planning (4 skills):**

| Skill | Role | What It Does |
|-------|------|-------------|
| `/office-hours` | YC Office Hours | 6 forcing questions that reframe your product. Generates 3 approaches with effort estimates. Design doc feeds downstream skills |
| `/plan-ceo-review` | CEO / Founder | Challenges scope. Finds the 10-star product. 4 modes: Expansion, Selective Expansion, Hold Scope, Reduction |
| `/plan-eng-review` | Eng Manager | Locks architecture with ASCII diagrams, edge cases, test matrix, failure modes, security concerns |
| `/plan-design-review` | Senior Designer | Rates each design dimension 0-10, explains what a 10 looks like. AI Slop detection |

**Building (5 skills):**

| Skill | Role | What It Does |
|-------|------|-------------|
| `/review` | Staff Engineer | Finds bugs that pass CI but break production. Auto-fixes obvious ones. Flags completeness gaps |
| `/investigate` | Debugger | Systematic root-cause analysis. Iron Law: no fixes without investigation. Stops after 3 failed attempts. Auto-freezes to target module |
| `/design-review` | Designer Who Codes | Audits then fixes design issues. Atomic commits, before/after screenshots |
| `/design-consultation` | Design Partner | Builds complete design system. Researches landscape, proposes creative risks, generates product mockups |
| `/codex` | Second Opinion | Cross-model analysis with OpenAI Codex. 3 modes: review gate, adversarial challenge, open consultation |

**Testing & Shipping (5 skills):**

| Skill | Role | What It Does |
|-------|------|-------------|
| `/qa` | QA Lead | Opens real Chromium browser, finds bugs, fixes with atomic commits, writes regression tests |
| `/qa-only` | QA Reporter | Same as `/qa` but report-only — no code changes |
| `/browse` | QA Engineer | Real browser automation. ~100ms per command. Playwright-based |
| `/ship` | Release Engineer | Syncs main, runs tests, audits coverage, pushes, opens PR. Auto-invokes `/document-release` |
| `/document-release` | Technical Writer | Updates all project docs to match what was shipped |

**Safety & Ops (3 skills):**

| Skill | Role | What It Does |
|-------|------|-------------|
| `/careful` | Safety Guard | Warns before `rm -rf`, `DROP TABLE`, force-push, `git reset --hard` |
| `/freeze` | Edit Lock | Restricts edits to one directory. Hard block |
| `/guard` | Max Safety | `/careful` + `/freeze` combined |

**Meta (2 skills):**

| Skill | Role | What It Does |
|-------|------|-------------|
| `/retro` | Eng Manager | Weekly retro with per-person breakdowns, shipping streaks, test health |
| `/gstack-upgrade` | Self-Updater | Detects global vs vendored install, syncs both |
| `/setup-browser-cookies` | Session Manager | Imports cookies from Chrome/Arc/Brave/Edge for authenticated testing |
| `/unfreeze` | Lock Remover | Removes `/freeze` boundary |

#### The Sprint Process

gstack enforces an ordered workflow:
```
Think → Plan → Build → Review → Test → Ship → Reflect
```

Each skill reads artifacts from the previous phase. `/plan-eng-review` reads the design doc from `/office-hours`. `/review` reads the code you built. `/ship` reads the test results from `/qa`.

**Power move:** Run 10-15 skills simultaneously via Conductor — one agent does `/office-hours` on a new feature while another does `/qa` on staging while another does `/ship` on a finished PR.

### Layer 3: Autoresearch — The R&D Lab (Already Installed)

**What it is:** Autonomous iteration loop. Modify code, run experiment, check results, keep or revert, repeat. ~12 experiments/hour, ~100 overnight.

**ZAO Status:** Already researched in docs 62-63. Installed at `.claude/skills/autoresearch/` with 7 subcommands: `/autoresearch`, `/autoresearch:plan`, `/autoresearch:debug`, `/autoresearch:fix`, `/autoresearch:security`, `/autoresearch:ship`, `/autoresearch:predict`.

**Notable results since launch:**
- Karpathy ran it 2 days: found 20 improvements on hand-tuned code, 11% total speedup
- Shopify CEO Tobi Lutke pointed it at their templating engine: 53% faster rendering from 93 automated commits

---

## How The Stack Works Together

```
┌─────────────────────────────────────────────┐
│                  YOU (Board)                 │
│         Review dashboards, approve PRs       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           PAPERCLIP (Company Layer)          │
│  Org chart · Budgets · Tasks · Governance    │
│  Assigns work · Tracks costs · Audit trail   │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┼──────────┐
        │         │          │
┌───────▼──┐ ┌───▼────┐ ┌───▼──────────┐
│ GSTACK   │ │ GSTACK │ │ AUTORESEARCH │
│ Dev Agent│ │QA Agent│ │ R&D Agent    │
│ /review  │ │ /qa    │ │ /autoresearch│
│ /ship    │ │/browse │ │ :fix :debug  │
└──────────┘ └────────┘ └──────────────┘
        │         │          │
┌───────▼─────────▼──────────▼────────────────┐
│         CONDUCTOR (Parallelism Layer)        │
│   10-15 Claude Code sessions in worktrees    │
└─────────────────────────────────────────────┘
```

### The Workflow

1. **You** set a goal in Paperclip ("Ship the notification UI for ZAO OS")
2. **Paperclip CEO agent** breaks it into tickets, assigns to agents
3. **Dev Agent** uses gstack: `/office-hours` → `/plan-eng-review` → builds code → `/review`
4. **QA Agent** uses gstack: `/qa` tests in real browser → `/qa-only` reports
5. **R&D Agent** uses autoresearch: runs optimization loops on performance-critical code
6. **Dev Agent** uses `/ship` → pushes, opens PR
7. **Paperclip** logs costs, time, decisions. You review from your phone.

### ZAO OS-Specific Application

| ZAO Task | Tool Combination |
|----------|-----------------|
| Build new API route | gstack `/office-hours` → `/plan-eng-review` → build → `/review` → `/ship` |
| Fix a bug | gstack `/investigate` (root cause) → fix → `/qa` (verify in browser) |
| Optimize Neynar API calls | autoresearch `/autoresearch:fix` with `npm run build` as metric |
| Security audit of routes | autoresearch `/autoresearch:security` on `src/app/api/` |
| Improve a Claude skill | autoresearch main loop with binary assertions (doc 63 pattern) |
| Ship a feature E2E | Paperclip assigns → gstack builds → autoresearch optimizes → gstack ships |
| Test mobile UI flows | gstack `/qa` with `/setup-browser-cookies` for authenticated sessions |

---

## The Broader Ecosystem: What Else to Install

### Tier 1: Install Now (High Value, Low Friction)

| Tool | What | Install | Why for ZAO |
|------|------|---------|-------------|
| **[Conductor](https://conductor.build)** | Parallel Claude Code sessions in worktrees | Free Mac app download | Run 10-15 agents simultaneously. Critical for the Paperclip + gstack combo |
| **[VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)** | 549+ curated skills | Browse and pick | 12.1K stars. Skills for Supabase, Vercel, testing, security — all relevant to ZAO |
| **Official Supabase skill** | Supabase-specific Claude Code skill | From skill marketplace | ZAO is built on Supabase — this is a no-brainer |
| **Official Vercel skill** | Deploy + preview | From skill marketplace | ZAO deploys on Vercel |

### Tier 2: Evaluate Soon (Promising but More Setup)

| Tool | What | Why Consider |
|------|------|-------------|
| **[Composio](https://composio.dev)** | 1000+ external app integrations as skills | Could connect Paperclip agents to Farcaster, Discord, GitHub, Notion |
| **[OpenWork](https://github.com/different-ai/openwork)** | Open-source Cowork alternative for teams | If ZAO adds more human contributors |
| **[Code Conductor](https://github.com/ryanmac/code-conductor)** | GitHub-native parallel orchestration | Alternative to Conductor if you want git-native parallelism |
| **Google `gws`** | Google Workspace APIs as Claude skills | If ZAO uses Google Docs/Sheets for planning |

### Tier 3: Watch (Interesting but Not Ready or Not a Fit)

| Tool | Status | Notes |
|------|--------|-------|
| **ClipMart** | "Coming Soon" | Paperclip template marketplace — watch for launch |
| **Antigravity** | Google's new IDE | Agent-first IDE, but separate ecosystem from Claude Code |
| **Ruflo** | v3.5, 259 MCP tools | Too heavy for ZAO's needs. 5,900+ commits is a lot of surface area |
| **Gas Town / Multiclaude** | Active | Alternative multi-agent orchestrators — evaluate if Conductor doesn't fit |

### Skill Marketplaces to Bookmark

| Marketplace | Size | URL |
|-------------|------|-----|
| awesomeskills.dev | 3,032 skills across 14 collections | [awesomeskills.dev](https://www.awesomeskills.dev/en) |
| VoltAgent/awesome-agent-skills | 549+ skills, 12.1K stars | [GitHub](https://github.com/VoltAgent/awesome-agent-skills) |
| alirezarezvani/claude-skills | 192+ skills | [GitHub](https://github.com/alirezarezvani/claude-skills) |
| SkillsMP | Agent Skills Marketplace | [skillsmp.com](https://skillsmp.com) |
| awesome-skills.com | Visual directory | [awesome-skills.com](https://awesome-skills.com/) |

---

## Cross-Reference with Existing ZAO Research

| Existing Doc | Relationship to This Research |
|-------------|-------------------------------|
| **Doc 67** — Paperclip AI Agent Company | Foundation — 5 ZAO agents, budgets, heartbeats. This doc adds gstack skills ON TOP of those agents |
| **Doc 72** — Paperclip Functionality Deep Dive | Explains the "Standing By" problem. gstack skills give agents more to DO on each heartbeat |
| **Doc 63** — Autoresearch Deep Dive | ZAO-specific use cases for autoresearch. Complements gstack's build phase |
| **Doc 71** — Rate Limits & Multi-Agent | Still applies — running gstack + Paperclip + autoresearch multiplies token usage. Stagger heartbeats |
| **Doc 81** — Multi-Company | Use Paperclip multi-company to separate "ZAO OS Dev" from "ZAO Community Ops" |
| **Doc 82** — ClipMart Plugins | Still "Coming Soon" — watch for launch |
| **Doc 76** — Git Branching for Agents | gstack's `/ship` + Conductor worktrees align with trunk-based dev strategy |
| **Doc 70** — Subagents vs Agent Teams | gstack is the "specialist roles" approach; Paperclip is the "company" approach. They stack |
| **Doc 44** — Agentic Development Workflows | Predecessor to all of this — gstack + Paperclip are the mature versions of those patterns |

---

## Quick Start: Installing the Full Stack

```bash
# 1. Paperclip (if not already running — see doc 67)
npx paperclipai onboard --yes
# Dashboard at http://localhost:3100

# 2. gstack
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack
./setup

# 3. autoresearch (already installed per doc 63)
# Verify: ls .claude/skills/autoresearch/SKILL.md

# 4. Conductor (optional but recommended)
# Download from https://conductor.build — free Mac app

# 5. Verify everything
# In Claude Code, try: /office-hours, /review, /qa, /ship
# In Paperclip dashboard: create tasks, assign to agents
# Autoresearch: /autoresearch:plan to set up a new experiment
```

---

## The SKILL.md Standard

All three tools use the same underlying format: **SKILL.md files** in `.claude/skills/`. This standard has become universal across Claude Code, Codex, Antigravity, Gemini CLI, and Cursor. Skills can:

- Spawn isolated subagents
- Inject live data via shell commands
- Restrict tool access per skill
- Override models per skill
- Hook into lifecycle events
- Run in forked contexts

This means skills written for gstack work in Codex. Skills written for autoresearch work in Cursor. The ecosystem is converging on one format.

---

## Part 2: How to Actually Use These Tools (Added March 20, 2026)

### gstack Practical Usage Guide for ZAO OS

#### The Sprint Pipeline

gstack enforces an ordered workflow. Here's how it maps to ZAO OS development:

```
Think (/office-hours) → Plan (/plan-ceo-review → /plan-eng-review) → Build → Review (/review) → Test (/qa) → Ship (/ship) → Reflect (/retro)
```

**You don't need all 21 skills to get value.** Start with the **starter trio**: `/review`, `/qa`, `/ship`. Add planning skills as you take on bigger features.

#### Skill-to-ZAO Task Map

| ZAO OS Task | Best gstack Skill | Why | Example |
|-------------|-------------------|-----|---------|
| **New feature (e.g., notification UI)** | `/office-hours` → `/plan-eng-review` → build → `/review` → `/qa` → `/ship` | Full sprint pipeline for anything non-trivial | "Use /office-hours to plan the in-app notification bell" |
| **Bug fix** | `/investigate` → fix → `/qa` | Iron Law: no fixes without root cause. Auto-freezes to the module being debugged | "Use /investigate to debug why XMTP messages aren't loading" |
| **Code review before merge** | `/review` | Catches SQL safety, LLM trust boundary violations, conditional side effects | "Use /review to check the governance API routes" |
| **Test mobile UI flows** | `/qa` + `/setup-browser-cookies` | Real Chromium browser, real clicks, ~100ms/command. Import cookies for authenticated testing | "Use /qa to test the chat flow on mobile viewport" |
| **Report-only audit (no changes)** | `/qa-only` | Same methodology as `/qa` but no code changes — just a report | "Use /qa-only to audit the admin panel" |
| **Ship a PR** | `/ship` | Syncs main, runs `npm run lint` + `npm run build`, audits coverage, pushes, opens PR | "Use /ship to deploy the respect token display" |
| **Update docs after shipping** | `/document-release` | Auto-updates README, CLAUDE.md, architecture docs to match what shipped | "Use /document-release after merging the governance feature" |
| **UI/design audit** | `/design-review` | Rates each dimension 0-10, fixes issues, atomic commits, before/after screenshots | "Use /design-review on the chat components" |
| **Working on production/Vercel** | `/careful` or `/guard` | Warns before destructive commands. `/guard` = `/careful` + `/freeze` combined | Always enable before touching Supabase production |
| **Scope debugging to one module** | `/freeze src/lib/auth` | Restricts ALL edits to that directory. Hard block on anything outside | Good for isolating session bugs without breaking other modules |
| **Weekly retro** | `/retro` | Per-person breakdowns, shipping streaks, test health trends | Run every Monday morning on the ZAO repo |
| **Second opinion on architecture** | `/codex` | Cross-model analysis with OpenAI Codex. Pass/fail gate or adversarial challenge | Use for critical decisions like auth flow changes |
| **Brainstorm new ZAO feature** | `/office-hours` (Builder mode) | 6 forcing questions, generates 3 implementation approaches with effort estimates | "Use /office-hours to brainstorm the AI taste profile feature" |

#### The Three QA Tiers

`/qa` runs in three tiers. For ZAO OS:

| Tier | What It Checks | When to Use |
|------|---------------|-------------|
| **Quick** | Critical + High severity only | Quick smoke test after a small change |
| **Standard** | + Medium severity | Default for most features |
| **Exhaustive** | + Cosmetic issues | Before a major release or after UI redesign |

#### ZAO OS-Specific `/qa` Targets

ZAO OS runs on `localhost:3000` (Next.js dev). Key flows to test:

| Flow | URL | What to Check |
|------|-----|---------------|
| Login (wallet) | `/` | Connect wallet → SIWE signature → session created → redirects to chat |
| Login (Farcaster) | `/` | SIWF button → Neynar popup → FID linked → session created |
| Chat | `/chat` | Messages load, new cast sends, reactions work, real-time updates |
| Governance | `/governance` | Proposals display, voting works, Respect-weighted results |
| Admin | `/admin` | Allowlist management, user search, respect import |
| Music | `/social` (music tab) | Song submissions, player works, queue management |
| Messages (XMTP) | `/messages` | DM list loads, new conversation, message send/receive |

**Use `/setup-browser-cookies`** to import your authenticated session from Chrome/Arc so `/qa` can test flows behind the auth gate.

#### Power Patterns

**Pattern 1: Parallel Sprint (requires Conductor)**
```
Session 1: /office-hours on Feature A
Session 2: /qa on Feature B (already built)
Session 3: /review on PR #47
Session 4: /ship on a finished branch
```
Each session runs in its own git worktree. Zero conflicts.

**Pattern 2: Build → Review → QA → Ship Pipeline**
In a single session, chain the skills:
1. Build the feature
2. `/review` — catches bugs before test
3. `/qa` — tests in real browser
4. `/ship` — pushes and opens PR

**Pattern 3: Investigation Lock**
When debugging:
1. `/freeze src/lib/auth` — lock edits to auth module
2. `/investigate` — systematic root cause analysis
3. Fix → `/qa` to verify → `/unfreeze`

**Pattern 4: gstack + autoresearch Combo**
For optimization work:
1. Use `/autoresearch:plan` to define the metric (e.g., lighthouse score, build time)
2. Run `/autoresearch` overnight — 100 iterations of improvements
3. Next morning: `/review` the changes autoresearch made
4. `/qa` to verify nothing broke
5. `/ship` the improvements

**Pattern 5: Competitive Build (via gstack-auto)**
For critical features, run N parallel implementations:
1. Each implementation goes through the full pipeline
2. Score each one
3. Best version wins and becomes the base

### Conductor Usage Guide

Conductor is the parallelism layer. Without it, you run one Claude Code session at a time. With it, you run 10-15.

**How Garry Tan uses it:** 15 Conductor sessions across 3 projects simultaneously, averaging 17K lines of code per day (35% tests).

**For ZAO OS specifically:**

| Session | Task | gstack Skill |
|---------|------|-------------|
| 1 | Build notification UI | `/office-hours` → build |
| 2 | QA test chat flow | `/qa` |
| 3 | Review governance API | `/review` |
| 4 | Fix XMTP bug | `/investigate` |
| 5 | Ship admin panel PR | `/ship` |
| 6 | Autoresearch lint fixes | `/autoresearch:fix` |

Each session gets its own git worktree — changes are isolated until merged.

**Port isolation:** gstack's browser daemon uses random ports (10000-60000), so 10 sessions can each run their own Chromium instance with zero conflicts.

### Paperclip + gstack Integration

**No direct integration exists yet** — these are complementary tools. But here's how to wire them manually:

1. **Paperclip assigns tasks** → Agent wakes up
2. **Agent loads gstack skills** → Uses `/review`, `/qa`, `/ship` as needed
3. **Agent completes task** → Paperclip logs the result

**How to configure:** In each Paperclip agent's `promptTemplate`, add instructions to use gstack skills:

```
You are the Dev Agent for The ZAO. When assigned a coding task:
1. Read the task description from your Paperclip inbox
2. Use /plan-eng-review to lock the architecture
3. Build the feature
4. Use /review to check for bugs
5. Use /qa to test in a real browser
6. Use /ship to push and open a PR
7. Update the Paperclip task with the PR link
```

**For the Research Agent:** Combine Paperclip task assignment with autoresearch:
```
You are the Research Agent for The ZAO. When assigned a research task:
1. Read the task from your Paperclip inbox
2. Use /autoresearch:plan to define scope and metrics
3. Run /autoresearch with the defined plan
4. Summarize findings and update the Paperclip task
```

### Known Issues & Workarounds (from GitHub Issues)

| Issue | Workaround |
|-------|-----------|
| Context window fills up instantly (#203) | Use `/freeze` to limit scope. Break large tasks into smaller sessions |
| No `/implement` skill after `/office-hours` (#242) | Just build manually after the plan is done — the design doc is in the session |
| Windows browse binary fails (#254) | macOS/Linux only for browser testing. Use `/qa-only` (report mode) on Windows |
| Skill suggestions too aggressive | Say "stop suggesting things" or run `gstack-config set proactive false` |
| Browser auth walls / CAPTCHAs | Use `$B handoff` to get visible Chrome, solve manually, then `$B resume` |

### ZAO OS Database Suggestions

ZAO OS uses Supabase PostgreSQL. Here's how the stack helps with database work:

**Using `/careful` for database operations:**
Always enable `/careful` or `/guard` before running SQL migrations. It will warn before:
- `DROP TABLE`, `TRUNCATE`, `DELETE FROM` without WHERE
- Any destructive Supabase CLI commands

**Using `/review` for migration safety:**
`/review` specifically checks for **SQL safety** — it flags:
- Missing RLS policies on new tables
- Exposed service role keys in responses
- Missing Zod validation on inputs that touch the database
- Transactions without proper error handling

**Autoresearch for query optimization:**
Use `/autoresearch:fix` with your Supabase query performance as the metric:
1. Define metric: query execution time from Supabase Dashboard
2. Run iterations: each iteration tries a different index, query structure, or RLS policy
3. Keep improvements, discard regressions

**Database tasks mapped to tools:**

| Database Task | Tool | Approach |
|---------------|------|----------|
| New table + RLS | Build → `/review` (catches missing RLS) | Review flags if RLS is missing |
| Schema migration | `/careful` + build + `/review` | Safety guard prevents accidental drops |
| Query optimization | `/autoresearch:fix` | Iterative improvement with measurable metric |
| Audit existing RLS | `/qa-only` on admin routes | Report-only audit of access control |
| Supabase Edge Functions | Build → `/review` → `/ship` | Standard pipeline |
| pgvector setup (for AI memory) | `/office-hours` → `/plan-eng-review` → build | Plan first — embedding strategy matters |
| Real-time subscriptions | Build → `/qa` (test in browser) | `/qa` can verify real-time updates visually |

**Supabase-specific gstack patterns:**

1. **Before any migration:** Enable `/guard` mode
2. **After writing RLS policies:** Use `/review` — it specifically checks for SQL safety violations
3. **Testing authenticated flows:** Use `/setup-browser-cookies` to import your session, then `/qa` tests flows that require auth
4. **Performance optimization:** Point `/autoresearch:fix` at slow queries with `EXPLAIN ANALYZE` as the metric

### Effort Compression for ZAO OS (gstack Reference)

| ZAO Task | Human Time | With gstack | Compression |
|----------|-----------|-------------|-------------|
| New API route + validation + tests | 1 day | 15 min | ~50x |
| Full feature (component + API + DB) | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Security audit of all 58 routes | 3 days | 2 hours | ~12x |
| UI redesign of one section | 2 days | 1 hour | ~16x |
| Database migration + RLS + tests | 1 day | 20 min | ~36x |

---

## Sources

- [gstack GitHub — garrytan/gstack](https://github.com/garrytan/gstack) — 31.8K stars, MIT
- [Paperclip GitHub — paperclipai/paperclip](https://github.com/paperclipai/paperclip) — ~30.5K stars, MIT
- [Paperclip Website](https://paperclip.ing/)
- [Karpathy autoresearch — karpathy/autoresearch](https://github.com/karpathy/autoresearch) — ~45.3K stars
- [TechCrunch: Why Garry Tan's Claude Code setup has gotten so much love, and hate (March 17, 2026)](https://techcrunch.com/2026/03/17/why-garry-tans-claude-code-setup-has-gotten-so-much-love-and-hate/)
- [PracticALy: AI Companies With No Humans](https://www.practicaly.ai/p/ai-companies-with-no-humans-paperclip-claude-marketplace-and-karpathy-s-autoresearch)
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — 12.1K stars, 549+ skills
- [awesomeskills.dev](https://www.awesomeskills.dev/en) — 3,032 skills
- [Conductor](https://www.conductor.build/) — Parallel Claude Code sessions
- [Paperclip Releases](https://github.com/paperclipai/paperclip/releases)
- [Composio: Top Claude Skills](https://composio.dev/content/top-claude-skills)
- [Shipyard: Multi-agent orchestration for Claude Code](https://shipyard.build/blog/claude-code-multi-agent/)
- [Garry Tan — gstack launch tweet](https://x.com/garrytan/status/2032014570118922347)
- [Garry Tan — 17K LOC/day with 15 Conductor sessions](https://x.com/garrytan/status/2033306615966060734)
- [gstack-auto — competitive tournament builds](https://github.com/loperanger7/gstack-auto)
- [DEV Community gstack deep dive](https://dev.to/createitv/a-cto-called-it-god-mode-garry-tan-just-open-sourced-how-he-ships-10000-lines-of-code-per-week-1ck7)
- [gstack GitHub Issues](https://github.com/garrytan/gstack/issues) — 254 issues/PRs, common problems documented
- [MindStudio: autoresearch + self-improving skills](https://www.mindstudio.ai/blog/claude-code-autoresearch-self-improving-skills)
