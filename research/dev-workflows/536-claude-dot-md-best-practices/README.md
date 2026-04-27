---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-27
related-docs: 528, 506, 507, 523, 524
tier: STANDARD
---

# 536 - Claude.md Best Practices (darkzodchi, X post)

> **Goal:** Extract practical CLAUDE.md design patterns from darkzodchi's thread on how to write instruction files that actually shape Claude's behavior without exceeding token budgets.

Trigger: Zaal forwarded https://x.com/zodchiii/status/2048683276194185640?s=51 via ZOE inbox (post by @zodchiii, handle darkzodchi).

---

## TL;DR

A well-designed CLAUDE.md file (max 80 lines, ~150-200 actionable instructions) is the difference between a senior engineer brief and a new hire lost in a codebase. Most teams waste lines on personality instructions or rules Claude figures out on its own. The highest-impact patterns prevent specific mistakes.

---

## Core Problem

- **Token budget math:** Claude's system prompt is ~50 instructions. CLAUDE.md gets ~100-150 before context window pressure causes Claude to drop rules.
- **Common failures:** 300+ line files, personality theater ("be a senior engineer"), duplicate rules across three config levels.
- **What actually works:** 5 sections (Commands, Architecture, Rules, Workflow, Out of Scope), 150-word max per section, negative rules equal to positive ones.

---

## The Three-Level Hierarchy

Most teams dump everything into `.claude/CLAUDE.md`. Effective projects use:

| Level | Location | Content | Scope |
|-------|----------|---------|-------|
| Global | `~/.claude/CLAUDE.md` | Rules that repeat across every project. Security (secrets, no console.log). Commit conventions. | All ZAO projects |
| Project | `.claude/CLAUDE.md` (in git) | Stack, commands, architecture, team context. | Shared with team |
| Local | `.claude/CLAUDE.local.md` (gitignored) | Personal quirks, local overrides, env-specific tweaks. | Single dev |

**ZAO OS match:** We use all three. Global at `~/.claude/`, project at `.claude/CLAUDE.md` + 3 rule files, local at `.claude/CLAUDE.local.md`.

---

## The Five Sections (Production Pattern)

### Section 1: Commands (keep it short)

Tell Claude exactly what to run, not how to guess.

```markdown
## Commands
- Dev: npm run dev
- Build: npm run build
- Test single file: npx vitest run src/...
- Lint + fix: npm run lint:biome
- Type check: npx tsc --noEmit
```

**Why:** Without this, Claude tries `npm test` when the project uses `npx vitest`, wastes 3 turns debugging a never-going-to-work command.

### Section 2: Architecture (no full listing)

Enough to know where things live + what goes where. Don't enumerate every file.

```markdown
## Architecture
- src/app/api/ → API routes, validated input, session checks only
- src/lib/auth/ → Session, Supabase service role, never expose to browser
- src/lib/broadcast/ → Stream.io + Livepeer logic, no UI
- src/components/ → React, hooks, TailwindCSS, mobile-first, no business logic
- src/lib/agents/ → Autonomous bots, state stored in Supabase, never ask for private keys
```

### Section 3: Rules (the critical section)

Every line should answer: "Would Claude make a mistake if this line was deleted?"

```markdown
## Rules
- NEVER expose SUPABASE_SERVICE_ROLE_KEY, NEYNAR_API_KEY, SESSION_SECRET, APP_SIGNER_PRIVATE_KEY to browser
- NEVER commit .env or secrets
- NEVER ask user for personal wallet private keys (generate app wallets instead)
- NEVER use dangerouslySetInnerHTML
- All user input: Zod safeParse before processing
- IMPORTANT: run typecheck after every code change
- Use Try/catch in API routes, log server-side, return sanitized 500 to client
- Always return NextResponse.json(...), never plain Response
- Create PRs to main, never push directly
```

**Key insight:** Negative rules ("NEVER") are as important as positive ones. IMPORTANT/MUST/YOU MUST improve adherence.

### Section 4: Workflow (prevents "Claude rewrites the entire file")

How you want Claude to approach tasks.

```markdown
## Workflow
- Ask clarifying questions before complex tasks
- Make minimal changes, don't refactor unrelated code
- Run tests after every change, fix failures before moving on
- Create separate commits per logical change, not one giant commit
- When unsure, explain both approaches and let me choose
```

### Section 5: Out of Scope

What Claude should NOT touch.

```markdown
## Out of Scope
- Anything in research/ (pre-read via grep + WebFetch, don't bulk-read)
- community.config.ts (ask first if changes needed)
- Env var or schema changes (ask first)
- Agent trading parameters (ask first)
```

---

## High-Impact Rules (The Ones That Matter)

After analyzing dozens of production CLAUDE.md files:

| Rule | Impact | Example |
|------|--------|---------|
| IMPORTANT: run typecheck after every code change | Prevents shipping broken types | Saves 2-3 bug-fix cycles per week |
| Make minimal changes, don't refactor unrelated code | Prevents "I touched file A but rewrote files B-E" | Shrinks diffs by 70%, makes reviews faster |
| Create separate commits per logical change | Prevents 47-file monster commits | Git history stays readable for blame/bisect |
| When unsure, explain both approaches and let me choose | Prevents Claude deciding architecture unilaterally | Keeps technical decisions human-owned |
| Never ask for private wallet keys | Prevents catastrophic secret leaks | One careless copy-paste doesn't compromise the user |

---

## What NOT To Include

- **Personality instructions** ("be a senior engineer", "think step by step") - Claude knows this
- **Rules your linter already handles** - biome/prettier/tsc handle formatting
- **Entire docs embedded via @-imports** - wastes instruction lines
- **Duplicate rules** - if global says "run tests", project doesn't repeat it
- **Things Claude learns via auto-memory** - `~/.claude/projects/<project>/memory/` captures this automatically

---

## ZAO OS Application

Current state (as of 2026-04-27):
- `~/.claude/CLAUDE.md` - global rules (secrets, no emojis, hyphens not em-dashes)
- `.claude/CLAUDE.md` - project overview, stack, commands
- `.claude/rules/*.md` - api-routes, components, typescript-hygiene, tests, skills, secret-hygiene (6 files)
- `.claude/CLAUDE.local.md` - personal session tweaks (gitignored)
- `~/.claude/projects/<project>/memory/` - auto-captured project knowledge

**Alignment:** We already follow the three-level hierarchy. The darkzodchi thread validates our approach + suggests minor optimizations:
1. Keep global + project files under 80 lines each (audit next sprint)
2. Review the rules/* files for duplication across layers
3. Add "Out of Scope" section to project CLAUDE.md (currently implicit)
4. Use IMPORTANT markers for the highest-impact rules only (don't overuse)

---

## Next Actions

| # | Action | Owner | Type | By |
|---|--------|-------|------|-----|
| 1 | Audit `.claude/CLAUDE.md` and `~/.claude/CLAUDE.md` line counts + content overlap | Claude (next session) | Review | This week |
| 2 | If either file > 80 lines, consolidate duplicates across layers | Claude | Edit | Next sprint |
| 3 | Add explicit "Out of Scope" section to `.claude/CLAUDE.md` (currently implicit in the tree) | Claude | Edit | Next sprint |
| 4 | Count IMPORTANT markers in all instruction files; if > 3 per file, deprioritize non-security rules | Claude | Audit | Next sprint |
| 5 | Cross-reference doc 528 (pi.dev) patterns with our CLAUDE.md structure — do we have a section for "extensibility" or "tools"? | Claude | Research | This week |
| 6 | Share ZAO's three-level CLAUDE.md approach with ECC (@affaan-m) as validated pattern | Zaal | Outreach | Anytime |

---

## Sources

- [darkzodchi X post](https://x.com/zodchiii/status/2048683276194185640?s=51) - "The CLAUDE.md File That 10x'd My Output (Full File Included)"
- Author: @zodchiii (darkzodchi), daily notes on AI & vibe coding
- Related research: Doc 528 (pi.dev agent), Doc 523 (Hermes spec), Doc 506 (TRAE skip decision)

---

## Staleness + Verification

- Last updated 2026-04-27 from live X post
- CLAUDE.md patterns are evergreen; re-validate when Zaal's workflow or team size changes significantly
- Check back 2026-06-27 to see if the three-level hierarchy has evolved in the ECC community
