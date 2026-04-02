# 154 — Skills & Commands Master Reference

> **Status:** Research complete
> **Date:** March 27, 2026
> **Goal:** Complete reference for every command, skill, and workflow available in ZAO OS — when to use each, typical session flows, and how to ask for new features

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Start every session with** | `/catchup` to restore context |
| **Before any new feature** | Describe the outcome you want, not the implementation |
| **Before any code** | Let brainstorming + planning skills run first |
| **Before merging** | `/review` then `/ship` |
| **End of day** | `/standup` for build-in-public content |
| **End of week** | `/retro` for engineering retrospective |
| **Skills > commands** | New additions go in `.claude/skills/name/SKILL.md`, not `.claude/commands/` |

---

## Part 1: Daily Workflow Commands

These are the commands you'll use most often, in the order you'll typically use them.

### `/catchup`

**When:** Start of every session, after `/clear`, or when you lost context.

**What it does:** Reads uncommitted changes, recent commits, open branches, and running processes. Gives you a summary of what you were working on and what comes next.

**Example:**
```
/catchup
```

### `/standup`

**When:** End of day or end of week. Need build-in-public content for Farcaster.

**What it does:** Generates standup summaries from git history. Daily format (10 lines max) or weekly recap (castable, under 1024 chars for Farcaster).

**Example:**
```
/standup
```

### `/fix-issue [number]`

**When:** Have a GitHub issue to fix end-to-end.

**What it does:** Reads the issue + comments, proposes a fix approach, implements, tests, and commits referencing the issue number.

**Example:**
```
/fix-issue 42
```

### `/check-env`

**When:** Before deploy, after fresh clone, debugging "connection refused" errors.

**What it does:** Validates all required env vars from `.env.example` are set — without exposing their values. Reports Set / Missing / Empty for each.

**Example:**
```
/check-env
```

---

## Part 2: Building Features

### `/new-route [feature/action]`

**When:** Creating any new API route.

**What it does:** Scaffolds a route at `src/app/api/[feature]/[action]/route.ts` with ZAO OS conventions: Zod validation, session check, try/catch, `NextResponse.json`.

**Example:**
```
/new-route music/favorites
```

### `/new-component [feature/ComponentName]`

**When:** Creating any new React component.

**What it does:** Scaffolds a component at `src/components/[feature]/[Name].tsx` with `"use client"`, dark theme (navy `#0a1628`, gold `#f5a623`), mobile-first Tailwind, `@/` imports.

**Example:**
```
/new-component music/TrackCard
```

### `/minimax [prompt]`

**When:** Need to call the Minimax LLM for summaries, moderation, or AI features.

**What it does:** Sends a prompt to the local `/api/chat/minimax` endpoint. Supports optional system message, temperature, and max_tokens.

**Example:**
```
/minimax Summarize this governance proposal in 2 sentences
```

### `/next-best-practices`

**When:** Auto-loaded by Claude when relevant. 20 reference files covering Next.js 16 patterns.

**What it covers:** File conventions, RSC boundaries, async params/searchParams, metadata, error handling, route handlers, image/font optimization, bundling, hydration errors, Suspense, parallel routes, self-hosting, debug tricks.

---

## Part 3: Idea to Plan (Before Writing Code)

Use these in order when starting something new. You don't need all of them every time — pick what fits.

### `/office-hours`

**When:** Have a new idea, exploring if something is worth building.

**What it does:** Two modes:
- **Startup mode:** Six forcing questions (demand reality, status quo, desperate specificity, narrowest wedge, observation, future-fit)
- **Builder mode:** Design thinking brainstorming for side projects

**Example:**
```
"I want to add live listening rooms to ZAO OS"
→ /office-hours kicks in
```

### `/superpowers:brainstorming`

**When:** About to build any feature. This is MANDATORY before creative work.

**What it does:** Explores user intent, requirements, and design before implementation. Asks clarifying questions, maps out what's needed, considers alternatives.

**Example:**
```
"I want members to favorite tracks"
→ brainstorming explores: what does favorite mean? persist where? affect curation? show on profile?
```

### `/superpowers:writing-plans`

**When:** Have a spec or requirements, need a step-by-step implementation plan.

**What it does:** Creates a structured plan with phases, files to create/modify, dependencies, and review checkpoints.

**Example:**
```
"Plan out the favorites system based on what we brainstormed"
```

### `/plan-ceo-review`

**When:** Challenge the plan's ambition. Think bigger, expand scope, rethink premises.

**What it does:** Four modes: SCOPE EXPANSION (dream big), SELECTIVE EXPANSION (hold scope + cherry-pick), HOLD SCOPE (maximum rigor), SCOPE REDUCTION (strip to essentials).

**Example:**
```
"Is this ambitious enough? Think bigger."
```

### `/plan-eng-review`

**When:** Lock in architecture before coding. Data flow, edge cases, test coverage, performance.

**What it does:** Walks through issues interactively with opinionated recommendations. Catches architecture problems before you write code.

**Example:**
```
"Review the architecture of this plan"
```

### `/plan-design-review`

**When:** Plan has UI/UX components that should be reviewed before implementation.

**What it does:** Rates each design dimension 0-10, explains what would make it a 10, then fixes the plan.

**Example:**
```
"Critique the UI plan for the favorites feature"
```

### `/design-consultation`

**When:** Creating a design system from scratch (typography, color, layout, spacing, motion).

**What it does:** Researches the landscape, proposes a complete design system, generates preview pages, creates `DESIGN.md`.

**Example:**
```
"Create a design system for ZAO OS"
```

---

## Part 4: Writing Code

### `/superpowers:test-driven-development`

**When:** Before writing ANY implementation code. Write tests first.

**What it does:** RED-GREEN-REFACTOR cycle. Write failing test, write minimal code to pass, refactor.

**Example:**
```
"Implement the favorites API"
→ TDD: write test for POST /api/music/favorites → watch it fail → implement → watch it pass
```

### `/superpowers:executing-plans`

**When:** Have a written plan from a previous session, executing it step by step.

**What it does:** Follows the plan with review checkpoints between phases.

### `/superpowers:subagent-driven-development`

**When:** Plan has independent tasks that can be worked on in parallel.

**What it does:** Dispatches subagents for each independent task, reviews results.

### `/superpowers:dispatching-parallel-agents`

**When:** 2+ independent tasks that don't share state or have sequential dependencies.

**What it does:** Runs multiple agents simultaneously for maximum speed.

### `/superpowers:using-git-worktrees`

**When:** Need isolation from current workspace for a feature branch.

**What it does:** Creates isolated git worktrees with smart directory selection and safety verification.

### `/autoresearch [goal]`

**When:** Need autonomous iteration toward a measurable goal: modify, verify, keep/discard, repeat.

**What it does:** Karpathy's autoresearch loop. You define Goal, Scope, Metric, and Verify command. Claude iterates autonomously.

**Example:**
```
/autoresearch Improve test coverage from 30% to 80%
```

---

## Part 5: Debugging

### `/investigate`

**When:** Something is broken. Systematic 4-phase root cause analysis.

**What it does:** Investigate → Analyze → Hypothesize → Implement. Iron Law: no fixes without root cause.

**Example:**
```
"Why is the music player not loading on mobile?"
```

### `/superpowers:systematic-debugging`

**When:** Bug, test failure, or unexpected behavior — before proposing any fixes.

**What it does:** Structured debugging process. Prevents jumping to conclusions.

### `/autoresearch:debug`

**When:** Need to find ALL bugs, not just one. Autonomous bug-hunting loop.

**What it does:** Scientific method: Gather → Reconnaissance → Hypothesize → Test → Classify → Log → Repeat.

**Example:**
```
/autoresearch:debug Find all bugs in the governance voting system
```

### `/autoresearch:fix`

**When:** Have a list of errors/warnings to fix iteratively. One fix per iteration, auto-reverted on failure.

**What it does:** Detect → Prioritize → Fix ONE → Commit → Verify → Guard → Decide → Log.

**Example:**
```
/autoresearch:fix Fix all TypeScript errors in src/components/
```

---

## Part 6: Quality & Review

### `/review`

**When:** Before merging any code. Pre-landing PR review.

**What it does:** Analyzes diff against base branch for SQL safety, LLM trust boundary violations, conditional side effects, and structural issues.

### `/superpowers:requesting-code-review`

**When:** Completed a major feature, need validation against original requirements.

### `/superpowers:receiving-code-review`

**When:** Got code review feedback. Verify suggestions before blindly implementing — requires technical rigor, not performative agreement.

### `/superpowers:verification-before-completion`

**When:** About to claim work is done. Run verification commands and confirm output BEFORE making success claims.

**The rule:** Evidence before assertions. Always.

### `/simplify`

**When:** Code works but might have quality issues. Reviews changed code for reuse, quality, and efficiency.

### `/codex`

**When:** Want a second opinion. Three modes:
- **Review:** Independent diff review with pass/fail gate
- **Challenge:** Adversarial mode that tries to break your code
- **Consult:** Ask anything with session continuity

---

## Part 7: Testing & QA

### `/qa`

**When:** Feature is ready for testing. Full test-fix-verify loop.

**What it does:** Three tiers:
- **Quick:** Critical + high severity only
- **Standard:** + medium severity
- **Exhaustive:** + cosmetic issues

Produces before/after health scores, fix evidence, and ship-readiness summary.

### `/qa-only`

**When:** Want a bug report without any code changes. Report only.

### `/browse`

**When:** Need to open a URL in headless browser, take screenshots, interact with elements, verify page state.

**What it does:** ~100ms per command. Navigate, click, type, screenshot, diff before/after, check responsive layouts.

### `/setup-browser-cookies`

**When:** Need to test authenticated pages. Import cookies from your real browser (Chrome, Arc, Brave, Edge).

---

## Part 8: Shipping & Deploying

### `/ship`

**When:** Code is ready. Create PR, push, deploy.

**What it does:** Detect + merge base branch → run tests → review diff → bump VERSION → update CHANGELOG → commit → push → create PR.

### `/autoresearch:ship`

**When:** Shipping anything — not just code. Content, marketing, sales, research, design.

**What it does:** 8-phase universal workflow: Identify → Inventory → Checklist → Prepare → Dry-run → Ship → Verify → Log.

### `/superpowers:finishing-a-development-branch`

**When:** Implementation done, tests pass. Decide: merge, PR, or cleanup.

### `/document-release`

**When:** After shipping. Update README, ARCHITECTURE, CONTRIBUTING, CLAUDE.md to match what shipped.

---

## Part 9: Security & Safety

### `/autoresearch:security`

**When:** Need a full security audit.

**What it does:** STRIDE threat modeling + OWASP Top 10 coverage + red-team with 4 adversarial personas (Security Adversary, Supply Chain, Insider, Infrastructure).

**Flags:**
- `--diff` — only audit files changed since last audit
- `--fail-on critical` — CI/CD gate
- `--fix` — auto-remediate after audit

### `/careful`

**When:** Working near production. Warns before `rm -rf`, `DROP TABLE`, force-push, `git reset --hard`, `kubectl delete`.

### `/freeze [directory]`

**When:** Want to restrict edits to one directory. Prevents accidentally changing unrelated code.

**Example:**
```
/freeze src/components/music
```

### `/guard`

**When:** Maximum safety. Combines `/careful` + `/freeze`.

### `/unfreeze`

**When:** Remove the freeze boundary, allow edits everywhere again.

---

## Part 10: Research & Knowledge

### `/zao-research [topic]`

**When:** Need to research anything for ZAO OS.

**What it does:** Searches 136+ existing research docs first, then the codebase, then conducts new web research. Saves findings as a numbered research doc.

**Example:**
```
/zao-research Farcaster frames v2 integration
```

### `/autoresearch:predict`

**When:** Need multi-perspective analysis before a big change.

**What it does:** 3-8 expert personas analyze code independently, then debate. Personas: Architecture, Security, Performance, Reliability, Devil's Advocate. Optional adversarial set.

### `/autoresearch:scenario`

**When:** Need to explore use cases, edge cases, and derivative scenarios.

**What it does:** 12 exploration dimensions: happy path, error path, edge case, abuse, scale, concurrent, temporal, data variation, permission, integration, recovery, state transition.

### `/autoresearch:plan`

**When:** Setting up an autoresearch run. Interactive wizard.

**What it does:** Converts a Goal into validated config: Scope, Metric, Direction, and Verify command.

---

## Part 11: Meta & Configuration

### `/retro`

**When:** End of week or sprint. Engineering retrospective.

**What it does:** Analyzes commit history, work patterns, code quality metrics. Persistent history with trend tracking.

### `/update-config`

**When:** Need to change settings.json — permissions, hooks, env vars, automated behaviors.

### `/keybindings-help`

**When:** Customize keyboard shortcuts, rebind keys, add chord bindings.

### `/loop [interval] [command]`

**When:** Need to run something on a recurring interval.

**Example:**
```
/loop 5m /qa-only     <- check for bugs every 5 minutes
/loop 10m /check-env  <- monitor env vars
```

### `/schedule`

**When:** Create cron-scheduled remote agents.

### `/claude-api`

**When:** Building with Claude API or Anthropic SDK. Auto-activates on `anthropic` imports.

### `/gstack-upgrade`

**When:** Upgrade gstack to latest version.

---

## Part 12: Design

### `/design-review`

**When:** Visual QA on a live site. Finds spacing issues, hierarchy problems, AI slop patterns.

**What it does:** Iteratively fixes issues, committing each fix atomically with before/after screenshots.

### `/design-consultation`

**When:** Create a full design system from scratch.

### `/plan-design-review`

**When:** Review a plan's design dimensions before implementation. Rates 0-10.

---

## Part 13: How to Ask for Things

### The Right Way

**Describe the outcome, not the implementation.**

| Instead of... | Say... |
|---------------|--------|
| "Create a React component with useState that queries Supabase" | "I want members to see who's listening to the same track" |
| "Add a POST route with Zod schema for track favorites" | "I want members to favorite tracks" |
| "Write a useEffect that subscribes to Supabase Presence" | "Show real-time presence in listening rooms" |
| "Create a new skill file with YAML frontmatter" | "I want a command that checks RLS policies" |

### What to Include

1. **What you want** (the outcome for users)
2. **Context** (what already exists that's relevant)
3. **Why** (what problem this solves)

**Example:**
> "I want members to see who's listening to the same track right now. We already have the Now Playing component and Supabase Presence. This is for the social pillar."

### What Happens Behind the Scenes

```
You say: "I want [outcome]"
  → brainstorming explores requirements
  → writing-plans creates step-by-step plan
  → you review (eng/ceo/design review)
  → TDD implements it
  → review checks it
  → ship deploys it
```

You don't need to invoke each skill manually. Just describe what you want and the system picks the right workflow.

---

## Part 14: Typical Session Flows

### Feature Development Session

```
/catchup                           ← restore context
"I want [outcome for users]"       ← describe the feature
  → brainstorming asks questions
  → plan gets created
/plan-eng-review                   ← lock in architecture
  → TDD builds it
/review                            ← check before merging
/ship                              ← create PR
/standup                           ← build-in-public content
```

### Bug Fix Session

```
/catchup
/fix-issue 42                      ← or describe the bug
  → reads issue, proposes fix, implements, tests, commits
/review
/ship
```

### Research Session

```
/catchup
/zao-research [topic]              ← searches 136+ docs + web
  → saves as numbered research doc
```

### QA Session

```
/setup-browser-cookies             ← if testing auth pages
/qa                                ← full test-fix-verify loop
/ship                              ← after fixes are done
```

### Security Audit Session

```
/guard                             ← maximum safety mode
/autoresearch:security             ← full STRIDE + OWASP audit
/review                            ← review any fixes
/unfreeze                          ← restore normal mode
```

### End of Week

```
/retro                             ← engineering retrospective
/standup                           ← weekly recap for Farcaster
```

---

## Part 15: Complete Inventory

### Project Skills (`.claude/skills/`)

| Skill | Files | Purpose |
|-------|-------|---------|
| `autoresearch` | SKILL.md + 10 references (~5,625 lines) | Autonomous iteration framework |
| `zao-research` | SKILL.md + 5 references (~918 lines) | Research workflow for ZAO OS |
| `next-best-practices` | SKILL.md + 19 references (~3,745 lines) | Next.js 16 patterns |
| `catchup` | SKILL.md | Context restoration |
| `new-route` | SKILL.md | API route scaffolding |
| `new-component` | SKILL.md | Component scaffolding |
| `fix-issue` | SKILL.md | GitHub issue to commit |
| `check-env` | SKILL.md | Env var validation |
| `standup` | SKILL.md | Build-in-public notes |
| `vps` | SKILL.md | VPS/ZOE remote management (status/deploy/zoe) |
| `z` | SKILL.md | Quick status dashboard |

### Autoresearch Subcommands

| Command | Purpose |
|---------|---------|
| `/autoresearch` | Main autonomous loop |
| `/autoresearch:plan` | Goal → config wizard |
| `/autoresearch:debug` | Autonomous bug hunting |
| `/autoresearch:fix` | Iterative error fixing |
| `/autoresearch:security` | STRIDE + OWASP audit |
| `/autoresearch:predict` | Multi-persona analysis |
| `/autoresearch:scenario` | Use case exploration |
| `/autoresearch:ship` | Universal shipping |

### Project Commands (`.claude/commands/`)

| Command | Purpose |
|---------|---------|
| `/minimax` | Call Minimax LLM |

### Superpowers (built-in)

| Skill | Purpose |
|-------|---------|
| `superpowers:brainstorming` | Explore requirements before building |
| `superpowers:writing-plans` | Create implementation plans |
| `superpowers:executing-plans` | Execute plans with review checkpoints |
| `superpowers:test-driven-development` | RED-GREEN-REFACTOR cycle |
| `superpowers:systematic-debugging` | Structured debugging |
| `superpowers:dispatching-parallel-agents` | Parallel independent tasks |
| `superpowers:subagent-driven-development` | Parallel plan execution |
| `superpowers:using-git-worktrees` | Isolated feature branches |
| `superpowers:requesting-code-review` | Validate against requirements |
| `superpowers:receiving-code-review` | Handle review feedback |
| `superpowers:verification-before-completion` | Evidence before assertions |
| `superpowers:finishing-a-development-branch` | Merge/PR/cleanup decision |
| `superpowers:writing-skills` | Create or edit skills |

### Gstack Skills (built-in)

| Skill | Purpose |
|-------|---------|
| `/office-hours` | Brainstorm new ideas |
| `/plan-ceo-review` | Challenge ambition, expand scope |
| `/plan-eng-review` | Lock in architecture |
| `/plan-design-review` | Rate design dimensions |
| `/design-consultation` | Create design system |
| `/design-review` | Visual QA on live site |
| `/investigate` | Root cause debugging |
| `/qa` | Test + fix + verify loop |
| `/qa-only` | Report bugs only |
| `/review` | Pre-landing PR review |
| `/ship` | Ship workflow |
| `/document-release` | Post-ship docs update |
| `/retro` | Weekly retrospective |
| `/codex` | Second opinion (review/challenge/consult) |
| `/browse` | Headless browser interaction |
| `/setup-browser-cookies` | Import auth cookies |
| `/careful` | Warn before destructive commands |
| `/freeze` | Restrict edits to one directory |
| `/guard` | Maximum safety (careful + freeze) |
| `/unfreeze` | Remove edit restrictions |
| `/simplify` | Review code quality |
| `/loop` | Recurring interval tasks |
| `/schedule` | Cron-scheduled agents |

### Utility Skills (built-in)

| Skill | Purpose |
|-------|---------|
| `/update-config` | Change settings.json |
| `/keybindings-help` | Customize keyboard shortcuts |
| `/claude-api` | Claude API reference |
| `/gstack-upgrade` | Upgrade gstack |

---

## Sources

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [agentskills.io Specification](https://agentskills.io/specification)
- [Claude Code Security Docs](https://code.claude.com/docs/en/security)
- [Research Doc 137 — Skills Audit & Security Practices](../137-skills-audit-security-practices/)
- [Research Doc 54 — Superpowers Agentic Skills](../054-superpowers-agentic-skills/)
- [Research Doc 62 — Autoresearch Skill Improvement](../062-autoresearch-skill-improvement/)
- [Research Doc 69 — Claude Code Tips & Best Practices](../069-claude-code-tips-best-practices/)
